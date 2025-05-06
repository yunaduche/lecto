const { sequelize } = require('../models');

const createExemplaires = async (idLivre, nombre, username) => {
  const result = await sequelize.query(
    'SELECT * FROM create_exemplaires(:idLivre, :nombre, :username)',
    {
      replacements: { idLivre, nombre, username },
      type: sequelize.QueryTypes.SELECT
    }
  );
  return result;
};