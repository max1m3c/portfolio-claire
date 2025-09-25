const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/randonnees.db');

db.serialize(() => {
  // Création des tables
  db.run(`CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifiant TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS randonnees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    adresse TEXT NOT NULL,
    photo TEXT,
    utilisateur_id TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(identifiant)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id TEXT NOT NULL,
    randonnee_id INTEGER NOT NULL,
    note INTEGER NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(identifiant),
    FOREIGN KEY (randonnee_id) REFERENCES randonnees(id)
  )`);

  // Insertion des utilisateurs
  db.run(`INSERT OR IGNORE INTO utilisateurs (identifiant, mot_de_passe) VALUES (?, ?)`, [
    'max',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MHQ8z7U2R1QzJzJzJzJzJzJzJzJzJzJ'
  ]);

  db.run(`INSERT OR IGNORE INTO utilisateurs (identifiant, mot_de_passe) VALUES (?, ?)`, [
    'bap',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MHQ8z7U2R1QzJzJzJzJzJzJzJzJzJzJ'
  ]);

  // Insertion des randonnées
  db.run(`INSERT OR IGNORE INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)`, [
    'Aiguebelette, Rocher du Corbeau, Col du Crucifix et Col Saint-Michel',
    'Au départ d\'Aiguebelette, une randonnée sans difficulté sur le versant Ouest de la montagne de l\'Épine, empruntant la Voie Romaine et la Voie Sarde. Cet itinéraire offre de nombreux points de vue sur le Lac d\'Aiguebelette.',
    'Aiguebelette-le-Lac (73610)',
    'lac.jpg',
    ''
  ]);

  db.run(`INSERT OR IGNORE INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)`, [
    'Tour du Lac du Bourget',
    'Une randonnée facile autour du plus grand lac naturel de France, offrant de superbes vues sur les montagnes environnantes.',
    'Le Bourget-du-Lac (73370)',
    'lac_bourget.jpg',
    ''
  ]);

  db.run(`INSERT OR IGNORE INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)`, [
    'Mont Revard',
    'Randonnée vers le Mont Revard avec une vue panoramique sur le lac du Bourget et les Alpes.',
    'Aix-les-Bains (73100)',
    'mont_revard.jpg',
    ''
  ]);

  db.run(`INSERT OR IGNORE INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)`, [
    'Dent du Chat',
    'Une randonnée plus exigeante vers la Dent du Chat, offrant des vues spectaculaires sur le lac du Bourget.',
    'Chambéry (73000)',
    'dent_du_chat.jpg',
    ''
  ]);

  db.run(`INSERT OR IGNORE INTO randonnees (nom, description, adresse, photo, utilisateur_id) VALUES (?, ?, ?, ?, ?)`, [
    'Lac d\'Aiguebelette',
    'Une promenade facile autour du lac d\'Aiguebelette, idéale pour les familles.',
    'Aiguebelette-le-Lac (73610)',
    'lac_aiguebelette.jpg',
    ''
  ]);

  
  console.log('Base de données initialisée avec succès.');
});

db.close();
