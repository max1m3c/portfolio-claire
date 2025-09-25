const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session
app.use(session({
  secret: 'secret_rando',
  resave: false,
  saveUninitialized: false
}));

// Middleware pour injecter la session dans toutes les vues
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Configuration de multer pour uploader les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads'); // dossier où stocker les images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // nom unique
  }
});
const upload = multer({ storage });

// Middleware pour vérifier la connexion
function requireAuth(req, res, next) {
  if (!req.session.utilisateur) {
    return res.redirect('/connexion');
  }
  next();
}

// Page d'accueil
app.get('/', (req, res) => {
  db.all('SELECT * FROM randonnees ORDER BY nom ASC', [], (err, rows) => {
    if (err) throw err;
    res.render('index', { randonnees: rows });
  });
});

// Route pour récupérer les randonnées triées
app.get('/randonnees', (req, res) => {
  const { sort } = req.query;
  let query = 'SELECT randonnees.*, AVG(notes.note) as averageRating FROM randonnees LEFT JOIN notes ON randonnees.id = notes.randonnee_id';

  if (sort === 'popularity') {
    query += ' GROUP BY randonnees.id ORDER BY averageRating DESC';
  } else {
    query += ' GROUP BY randonnees.id ORDER BY randonnees.nom ASC';
  }

  db.all(query, [], (err, rows) => {
    if (err) throw err;
    res.json(rows);
  });
});

// Page de détail d'une randonnée
app.get('/randonnee/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT randonnees.*, utilisateurs.identifiant AS createur FROM randonnees LEFT JOIN utilisateurs ON randonnees.utilisateur_id = utilisateurs.identifiant WHERE randonnees.id = ?', [id], (err, row) => {
    if (err) throw err;

    // Calculer la moyenne des notes
    db.all('SELECT AVG(note) as averageRating FROM notes WHERE randonnee_id = ?', [id], (err, ratings) => {
      if (err) throw err;
      row.averageRating = ratings[0]?.averageRating || 'Aucune note';
      res.render('rando', { rando: row });
    });
  });
});

// Formulaire de contribution
app.get('/contribuer', requireAuth, (req, res) => {
  res.render('contribute', { rando: null });
});

// Traitement du formulaire de contribution
app.post('/contribuer', requireAuth, upload.single('photo'), (req, res) => {
  const { nom, description, adresse } = req.body;
  const photo = req.file ? req.file.filename : null;
  const utilisateur_id = req.session.utilisateur; // Récupérer l'identifiant de l'utilisateur connecté

  db.run(
    'INSERT INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)',
    [nom, description, adresse, photo, utilisateur_id],
    function (err) {
      if (err) throw err;
      res.redirect('/randonnee/' + this.lastID);
    }
  );
});

// Formulaire de modification d'une randonnée
app.get('/modifier/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM randonnees WHERE id = ?', [id], (err, row) => {
    if (err) throw err;
    res.render('contribute', { rando: row });
  });
});

// Traitement du formulaire de modification
app.post('/modifier/:id', requireAuth, upload.single('photo'), (req, res) => {
  const id = req.params.id;
  const { nom, description, adresse } = req.body;
  const photo = req.file ? req.file.filename : null;

  let query = 'UPDATE randonnees SET nom = ?, description = ?, adresse = ?';
  let params = [nom, description, adresse];

  if (photo) {
    query += ', photo = ?';
    params.push(photo);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function (err) {
    if (err) throw err;
    res.redirect('/randonnee/' + id);
  });
});

// Page de connexion
app.get('/connexion', (req, res) => {
  res.render('connexion', { erreur: '' });
});

// Traitement de la connexion
app.post('/connexion', async (req, res) => {
  const { identifiant, mot_de_passe, nouvel_utilisateur } = req.body;

  if (nouvel_utilisateur) {
    try {
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM utilisateurs WHERE identifiant = ?', [identifiant], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (existingUser) {
        return res.render('connexion', { erreur: 'Cet identifiant existe déjà.' });
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      db.run('INSERT INTO utilisateurs (identifiant, mot_de_passe) VALUES (?, ?)', [identifiant, hashedPassword], function (err) {
        if (err) throw err;
        req.session.utilisateur = identifiant;
        res.redirect('/');
      });
    } catch (err) {
      console.error(err);
      res.render('connexion', { erreur: 'Erreur lors de la création de l\'utilisateur.' });
    }
  } else {
    db.get('SELECT * FROM utilisateurs WHERE identifiant = ?', [identifiant], async (err, user) => {
      if (err) throw err;

      if (!user || !(await bcrypt.compare(mot_de_passe, user.mot_de_passe))) {
        return res.render('connexion', { erreur: 'Identifiant ou mot de passe incorrect.' });
      }

      req.session.utilisateur = identifiant;
      res.redirect('/');
    });
  }
});

// Déconnexion
app.get('/deconnexion', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Route pour enregistrer une note
app.post('/noter', requireAuth, (req, res) => {
  const { randonnee_id, note } = req.body;
  const utilisateur_id = req.session.utilisateur;

  // Vérifier si l'utilisateur a déjà noté cette randonnée
  db.get('SELECT * FROM notes WHERE utilisateur_id = ? AND randonnee_id = ?', [utilisateur_id, randonnee_id], (err, existingNote) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur.' });
    }

    if (existingNote) {
      return res.status(400).json({ error: 'Vous avez déjà noté cette randonnée.' });
    }

    // Enregistrer la nouvelle note
    db.run('INSERT INTO notes (utilisateur_id, randonnee_id, note) VALUES (?, ?, ?)', [utilisateur_id, randonnee_id, note], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la note.' });
      }
      res.json({ success: true });
    });
  });
});

app.get('/graphisme', (req, res) => {
  res.render('graphisme');
});

app.get('/motiondesign', (req, res) => {
  res.render('motiondesign');
});

app.get('/illustration', (req, res) => {
  res.render('illustration');
});

app.get('/biographie', (req, res) => {
  res.render('biographie');
});

app.get('/cgu', (req, res) => {
  res.render('cgu');
});

app.get('/plan-du-site', (req, res) => {
  res.render('plan');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});




// Lancement du serveur
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
