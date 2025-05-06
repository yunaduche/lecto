const express = require('express');
const router = express.Router();
const circulationService = require('../services/circulationService');
const CirculationController = require('../controllers/circulationController');

// infos adhérents
router.get('/adherent/:numeroCarte', async (req, res) => {
  try {
    const adherent = await circulationService.getAdherentInfo(req.params.numeroCarte);
    res.json(adherent);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// verif adhérent peut emprunter
router.get('/can-borrow/:adherentId', async (req, res) => {
  try {
    const adherent = await circulationService.getAdherentInfo(req.params.adherentId);
    const result = await circulationService.canBorrow(adherent);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/return-info/:isbn', CirculationController.getBookReturnInfo);
router.post('/emprunt', CirculationController.borrowBook);
router.post('/retour', CirculationController.returnBook);
router.post('/renouvellement', CirculationController.renewLoan);
router.get('/adherent-books/:numeroCarteAdherent', CirculationController.getAdherentBorrowedBooks);
router.post('/retour-exemplaire', CirculationController.returnBookByExemplaireId);

// Bannir un adhérent
router.post('/ban/:adherentId', async (req, res) => {
  try {
    const { cause } = req.body;
    const adherent = await circulationService.banAdherent(req.params.adherentId, cause);
    res.json(adherent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/ban/:numerocarte', async (req, res) => {
  try {
    const { numerocarte } = req.params;
    const { cause } = req.body;
    const result = await circulationService.banAdherent(numerocarte, cause);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Débannir un adhérent
router.post('/unban/:numerocarte', async (req, res) => {
  try {
    const { numerocarte } = req.params;
    const result = await circulationService.debanAdherent(numerocarte);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Orapport des livres en retard
router.get('/livres-en-retard', async (req, res) => {
  try {
    const result = await circulationService.getLivresEnRetard();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// verif et enregistrer l'état des emprunts
router.post('/verifier-emprunts', async (req, res) => {
  try {
    const result = await circulationService.verifierEtEnregistrerEmprunts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;