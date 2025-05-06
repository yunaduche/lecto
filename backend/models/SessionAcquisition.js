const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionAcquisition = sequelize.define('SessionAcquisition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ouvert', 'fermee'),
      defaultValue: 'ouvert',
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'session_acquisition',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['nom', 'status'], // Contrainte d'unicité sur `nom` et `status`
      },
    ],
  });

  return SessionAcquisition;
};
