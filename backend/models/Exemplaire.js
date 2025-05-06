const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exemplaire = sequelize.define('Exemplaire', {
    id_exemplaire: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_livre: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isbn: {
      type: DataTypes.STRING(13)
    },
    disponibilite: {
      type: DataTypes.ENUM('libre', 'en pret'),
      defaultValue: 'libre'
    },
    format: {
      type: DataTypes.ENUM('lecture sur place', 'empruntable'),
      allowNull: false
      },
    derniers_emprunteurs: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    },

    emprunteur_numero_carte: {
      type: DataTypes.STRING(20)
    },
    titre: {
      type: DataTypes.STRING(255)
    },
    date_emprunt: {
      type: DataTypes.DATE
    },
    date_retour_prevue: {
      type: DataTypes.DATE
    },
    bibliothecaire_emprunt_id: {
      type: DataTypes.INTEGER
    },
    section: {
      type: DataTypes.ENUM('adulte', 'jeunesse'),
      allowNull: false
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    auteurs: {
      type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    code_barre: {
      type: DataTypes.STRING(30)
    },
    session_acquisition_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'session_acquisition',
        key: 'id'
      }
    },
    session_nom: {
      type: DataTypes.STRING(100)
    },
    preteur_username: {
      type: DataTypes.STRING(100)
    }
  }, {
    tableName: 'exemplaire',
    timestamps: false
  });

  return Exemplaire;
};
