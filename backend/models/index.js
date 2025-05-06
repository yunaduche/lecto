  const { Sequelize, DataTypes } = require('sequelize');
  const config = require('../config/database');

  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: {
      charset: 'utf8',
    },
    logging: config.logging
  });
  
  const db = {};

  db.Emprunt = require('./Emprunt')(sequelize, DataTypes);
 
  db.User = require('./User')(sequelize, DataTypes);
  db.SessionAcquisition = require('./SessionAcquisition')(sequelize, DataTypes);
  db.PolitiqueEmprunt = require('./PolitiqueEmprunt')(sequelize, DataTypes);
  db.BibliothequeLog = require('./LogModel')(sequelize, DataTypes);
  db.Exemplaire = require('./Exemplaire')(sequelize, DataTypes);
  db.Livre = require('./Livre')(sequelize, DataTypes);
 
  db.Adherents = sequelize.define('Adherents', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero_carte: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    codebarre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero_telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    quartier: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    adresse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type_adhesion: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fin_adhesion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emprunts_en_cours_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    },
    emprunts_en_cours_isbns: {
      type: DataTypes.ARRAY(DataTypes.STRING(13)),
      defaultValue: []
    },
    nombre_total_emprunts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    nb_retard_retour: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    banni: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    cause_banissement: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'adherents',
    timestamps: false
  });

  

db.Livre.hasMany(db.Exemplaire, { foreignKey: 'isbn' });
db.Exemplaire.belongsTo(db.Livre, { foreignKey: 'isbn' });

// Nouvelle relation avec la table users
db.Livre.belongsTo(db.User, {
    foreignKey: 'catalogueur_username',
    targetKey: 'username',
    as: 'catalogueur'
});
  
  db.HistoriqueRetours = sequelize.define('HistoriqueRetours', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date_verification: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    id_emprunt: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_exemplaire: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    statut: {
      type: DataTypes.ENUM('en cours', 'en retard', 'retourné'),
      allowNull: false
    }
  }, {
    tableName: 'historique_retours',
    timestamps: false
  });

  db.EmpruntEnRetard = sequelize.define('EmpruntEnRetard', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_exemplaire: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isbn: {
      type: DataTypes.STRING(13),
      allowNull: false
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    numero_carte: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    date_emprunt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_retour_prevue: {
      type: DataTypes.DATE,
      allowNull: false
    },
    jours_de_retard: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'emprunt_en_retard',
    timestamps: false
  });

  // Associations
  db.Livre.hasMany(db.Exemplaire, { foreignKey: 'isbn' });
  db.Exemplaire.belongsTo(db.Livre, { foreignKey: 'isbn' });

  db.Exemplaire.hasMany(db.Emprunt, { foreignKey: 'id_exemplaire' });
  db.Emprunt.belongsTo(db.Exemplaire, { foreignKey: 'id_exemplaire' });

  db.Exemplaire.hasMany(db.EmpruntEnRetard, { foreignKey: 'id_exemplaire' });
  db.EmpruntEnRetard.belongsTo(db.Exemplaire, { foreignKey: 'id_exemplaire' });
  db.Exemplaire.hasMany(db.Emprunt, { foreignKey: 'id_exemplaire' });
db.Emprunt.belongsTo(db.Exemplaire, { foreignKey: 'id_exemplaire' });
db.Exemplaire.hasMany(db.EmpruntEnRetard, { foreignKey: 'id_exemplaire' });
db.EmpruntEnRetard.belongsTo(db.Exemplaire, { foreignKey: 'id_exemplaire' });

// Association avec l'adherent actuel
db.Exemplaire.belongsTo(db.Adherents, { 
  foreignKey: 'emprunteur_numero_carte',
  targetKey: 'numero_carte',
  as: 'Adherent' 
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

  db.Adherents.hasMany(db.EmpruntEnRetard, { foreignKey: 'id_adherent' });
  db.EmpruntEnRetard.belongsTo(db.Adherents, { foreignKey: 'id_adherent' });


  db.User.hasMany(db.Exemplaire, { foreignKey: 'bibliothecaire_emprunt_id' });
  db.Exemplaire.belongsTo(db.User, { foreignKey: 'bibliothecaire_emprunt_id' });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  module.exports = db;