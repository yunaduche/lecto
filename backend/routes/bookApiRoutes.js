
const express = require('express');
const router = express.Router();
const BookApiService = require('../services/bookApiService');

//  creer instance
const bookApiService = new BookApiService();

router.get('/search/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
   
    if (!isbn) {
      return res.status(400).json({
        error: 'ISBN invalide. Veuillez fournir un ISBN à 13 chiffres.'
      });
    }

    const bookData = await bookApiService.fetchBookDataByISBN(isbn);
   
    if (!bookData) {
      return res.status(404).json({
        error: 'Aucune information trouvée pour cet ISBN.'
      });
    }

    res.json(bookData);
  } catch (error) {
    console.error('Error in book search route:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des données du livre.'
    });
  }
});

module.exports = router;