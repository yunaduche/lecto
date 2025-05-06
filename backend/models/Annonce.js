const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Annonce = sequelize.define('Annonce', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    objet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date_publication: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  return Annonce;
};
