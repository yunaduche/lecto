const express = require('express');
const router = express.Router();
const livreService = require('../services/livreService');

router.post('/livres', async (req, res) => {
  try {
    const { livre, nombreExemplaires, username, operation, existingIsbn } = req.body;
    
    if (!username) {
      return res.status(400).json({
        message: "Username est requis"
      });
    }

    let result;
    if (operation === 'ajout_exemplaires') {
    
      result = await livreService.addExemplairesToExistingLivre(
        existingIsbn,
        nombreExemplaires,
        username
      );
    } else {
      
      result = await livreService.createLivreWithExemplaires(
        livre,
        nombreExemplaires,
        username
      );
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

module.exports = router;