
const express = require('express');
const router = express.Router();
const empruntService = require('../services/listEmpruntService');

// middlware pour updt les statuts de retard
router.use(async (req, res, next) => {
  try {
    await empruntService.updateEmpruntsRetardStatus();
    next();
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
    try {
      const emprunts = await empruntService.getAllEmprunts();
      res.json({
        success: true,
        count: emprunts.length,
        data: emprunts
      });
    } catch (error) {
      next(error);
    }
  });

// emprunts en cours
router.get('/en-cours', async (req, res, next) => {
  try {
    const emprunts = await empruntService.getEmpruntsEnCours();
    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts
    });
  } catch (error) {
    next(error);
  }
});

// emprunts en retard
router.get('/en-retard', async (req, res, next) => {
  try {
    const emprunts = await empruntService.getEmpruntsEnRetard();
    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts
    });
  } catch (error) {
    next(error);
  }
});


router.use((error, req, res, next) => {
  console.error('Erreur:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Une erreur est survenue'
  });
});

module.exports = router;