const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Livre = sequelize.define('Livre', {
    id_livre: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    isbn: {
      type: DataTypes.STRING(13)
    },
    titre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    auteurs: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false
    },
    editeurs: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['lecture sur place', 'empruntable']]
      }
    },
    nombre_exemplaires: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    date_publication: {
      type: DataTypes.STRING(255)
    },
    nombre_pages: {
      type: DataTypes.INTEGER
    },
    numero_classe: {
      type: DataTypes.INTEGER
    },
    categorie: {
      type: DataTypes.STRING(255)
    },
    langue: {
      type: DataTypes.STRING(50)
    },
    mots_cle: {
      type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    description: {
      type: DataTypes.TEXT
    },
    url_photo: {
      type: DataTypes.STRING(255)
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['adulte', 'jeunesse']]
      }
    },
    catalogueur_username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'username'
      }
    },
    date_catalogage: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    exemplaires_disponibles: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'livre',
    timestamps: false
  });

  return Livre;
};