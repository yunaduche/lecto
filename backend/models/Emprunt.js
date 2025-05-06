module.exports = (sequelize, DataTypes) => {
    const Emprunt = sequelize.define('Emprunt', {
      id_emprunt: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      numero_carte: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      code_barre_exemplaire: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      id_exemplaire: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      titre: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      date_emprunt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      date_retour_prevue: {
        type: DataTypes.DATE,
        allowNull: false
      },
      date_retour_effective: {
        type: DataTypes.DATE
      },
      nombre_renouvellement: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      username_bibliothecaire: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      statut_emprunt: {
        type: DataTypes.STRING(50),
        defaultValue: 'en_cours'
      },
      est_retard: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'emprunt',
      timestamps: false
    });
  
    return Emprunt;
  };