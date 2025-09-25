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

// -------- ROUTES --------

// Page d'accueil
app.get('/', (req, res) => {
  res.render('index', { randonnees: [] }); // vide car plus de DB
});

// Liste des randonnées (fictive)
app.get('/randonnees', (req, res) => {
  res.json([]); // renvoie un tableau vide
});

// Page de détail randonnée (fictive)
app.get('/randonnee/:id', (req, res) => {
  res.render('rando', { rando: { id: req.params.id, nom: "Exemple", description: "Randonnée fictive" } });
});

// Formulaire de contribution
app.get('/contribuer', requireAuth, (req, res) => {
  res.render('contribute', { rando: null });
});

// Traitement du formulaire de contribution (sans DB)
app.post('/contribuer', requireAuth, upload.single('photo'), (req, res) => {
  res.redirect('/'); // redirige vers accueil
});

// Formulaire de modification (fictif)
app.get('/modifier/:id', requireAuth, (req, res) => {
  res.render('contribute', { rando: { id: req.params.id, nom: "Exemple" } });
});

// Traitement du formulaire de modification (fictif)
app.post('/modifier/:id', requireAuth, upload.single('photo'), (req, res) => {
  res.redirect('/randonnee/' + req.params.id);
});

// Page de connexion
app.get('/connexion', (req, res) => {
  res.render('connexion', { erreur: '' });
});

// Traitement de la connexion (fictif, pas de DB)
app.post('/connexion', async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  // Auth fictive : si identifiant == "admin", on connecte
  if (identifiant === "admin" && mot_de_passe === "admin") {
    req.session.utilisateur = identifiant;
    return res.redirect('/');
  }

  res.render('connexion', { erreur: 'Identifiant ou mot de passe incorrect.' });
});

// Déconnexion
app.get('/deconnexion', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Notation fictive
app.post('/noter', requireAuth, (req, res) => {
  res.json({ success: true }); // réponse fictive
});

// Autres pages statiques
app.get('/graphisme', (req, res) => res.render('graphisme'));
app.get('/motiondesign', (req, res) => res.render('motiondesign'));
app.get('/illustration', (req, res) => res.render('illustration'));
app.get('/biographie', (req, res) => res.render('biographie'));
app.get('/cgu', (req, res) => res.render('cgu'));
app.get('/plan-du-site', (req, res) => res.render('plan'));
app.get('/contact', (req, res) => res.render('contact'));

// -------- Lancement du serveur --------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
