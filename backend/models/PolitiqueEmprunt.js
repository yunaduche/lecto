const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PolitiqueEmprunt = sequelize.define('PolitiqueEmprunt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    duree_emprunt_jours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre_renouvellement_max: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre_exemplaires_max: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'politique_emprunt',
    timestamps: false,
    underscored: true
  });

  return PolitiqueEmprunt;
};