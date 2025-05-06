const { User } = require('../models');
const bcrypt = require('bcrypt');

exports.createUser = async (userData) => {
  const { password, ...otherData } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({ ...otherData, password: hashedPassword });
};

exports.getUserByUsername = async (username) => {
  try {
    const user = await User.findOne({ where: { username } });
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
};

exports.getAllLibrarians = async () => {
  try {
    const librarians = await User.findAll({
      where: {
        role: ['bibliothecaire_jeunesse', 'bibliothecaire_adulte', 'admin', 'chef_bibliothecaire']
      },
      attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role', 'created_at', 'last_login']
    });
    return librarians;
  } catch (error) {
    console.error('Erreur lors de la récupération des bibliothécaires:', error);
    throw error;
  }
};

//réinitialiser le mot de passe d'un bibliothécaire
exports.resetLibrarianPassword = async (userId, newPassword) => {
  try {
    const user = await User.findOne({
      where: {
        id: userId,
        role: ['bibliothecaire_jeunesse', 'bibliothecaire_adulte', 'admin', 'chef_bibliothecaire']
      }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé ou non autorisé');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    
    return { message: 'Mot de passe réinitialisé avec succès' };
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw error;
  }
};