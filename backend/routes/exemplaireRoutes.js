const express = require('express');
const router = express.Router();
const ExemplaireService = require('../services/exemplaireService');

router.post('/ajouter-exemplaires', async (req, res) => {
  try {
    const { isbn, nombreExemplaires } = req.body;

   
    if (!isbn || !nombreExemplaires || nombreExemplaires < 1) {
      return res.status(400).json({
        success: false,
        message: 'ISBN et nombre d\'exemplaires (positif) requis'
      });
    }

    const nombre = parseInt(nombreExemplaires, 10);
    if (isNaN(nombre)) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre d\'exemplaires doit être un nombre valide'
      });
    }

    const resultat = await ExemplaireService.ajouterExemplaires(isbn, nombre);
    
    res.status(200).json({
      success: true,
      message: `${nombre} exemplaire(s) ajouté(s) avec succès`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout des exemplaires:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors de l\'ajout des exemplaires'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const exemplaires = await ExemplaireService.getAllExemplaires();
    res.json(exemplaires);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des exemplaires", error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exemplaire = await ExemplaireService.getExemplaireById(req.params.id);
    if (exemplaire) {
      res.json(exemplaire);
    } else {
      res.status(404).json({ message: "Exemplaire non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'exemplaire", error });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const exemplaires = await ExemplaireService.searchExemplaires(req.params.query);
    res.json(exemplaires);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la recherche d'exemplaires", error });
  }
});

router.get('/filter/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    if (isNaN(count)) {
      return res.status(400).json({ message: "Le paramètre count doit être un nombre" });
    }
    const exemplaires = await ExemplaireService.filterExemplaires(count);
    res.json(exemplaires);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du filtrage des exemplaires", error });
  }
});

module.exports = router;