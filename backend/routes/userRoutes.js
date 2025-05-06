const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

router.post('/creerCompteBibliothecaire', async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });
  } catch (error) {
    next(error);
  }
});


router.get('/bibliothecaires', async (req, res, next) => {
  try {
    const librarians = await userService.getAllLibrarians();
    res.status(200).json(librarians);
  } catch (error) {
    next(error);
  }
});

router.post('/reinitialiserMotDePasse/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    await userService.resetLibrarianPassword(id, newPassword);
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;