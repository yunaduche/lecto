const express = require('express');
const router = express.Router();
const exemplaireService = require('../services/exemplaireServ');

router.get('/acquisitions', async (req, res) => {
  try {
    const exemplaires = await exemplaireService.listExemplairesByAcquisition();
    res.json(exemplaires);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
