const express = require('express');
const router = express.Router();
const politiqueEmpruntService = require('../services/politiqueEmpruntService');

router.get('/', async (req, res) => {
  try {
    const politique = await politiqueEmpruntService.getPolitiqueEmprunt();
    res.json(politique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { duree_emprunt_jours, nombre_renouvellement_max, nombre_exemplaires_max } = req.body;
    if (!duree_emprunt_jours || !nombre_renouvellement_max || !nombre_exemplaires_max) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const updatedPolitique = await politiqueEmpruntService.updatePolitiqueEmprunt({
      duree_emprunt_jours,
      nombre_renouvellement_max,
      nombre_exemplaires_max
    });

    res.json(updatedPolitique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;