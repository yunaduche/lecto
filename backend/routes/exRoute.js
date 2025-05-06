const express = require('express');
const router = express.Router();
const exemplaireService = require('../services/exService');


router.get('/', async (req, res) => {
  try {
    const exemplaires = await exemplaireService.getAllExemplaires();
    res.json({ success: true, data: exemplaires });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
  router.get('/:id', async (req, res) => {
  try {
    const exemplaire = await exemplaireService.getExemplaireById(req.params.id);
    if (!exemplaire) {
      return res.status(404).json({
        success: false,
        message: 'Exemplaire non trouvé'
      });
    }
    res.json({ success: true, data: exemplaire });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//recherche d'exemplaires
router.get('/search', async (req, res) => {
  try {
    const exemplaires = await exemplaireService.searchExemplaires(req.query);
    res.json({ success: true, data: exemplaires });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Vérifier d'abord si l'exemplaire peut être supprimé
    await exemplaireService.verifyDeletionPossible(req.params.id);
    
    const result = await exemplaireService.deleteExemplaire(req.params.id);
    
    res.json({
      success: true,
      message: 'Exemplaire supprimé avec succès'
    });
  } catch (error) {
    res.status(error.message.includes('non trouvé') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/batch/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste d\'IDs invalide'
      });
    }

    for (const id of ids) {
      await exemplaireService.verifyDeletionPossible(id);
    }

    const result = await exemplaireService.deleteMultipleExemplaires(ids);
    
    res.json({
      success: true,
      message: `${result.deletedCount} exemplaire(s) supprimé(s) avec succès`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;