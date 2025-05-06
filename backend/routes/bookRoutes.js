const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const {sequelize} = require('../models');
const { Exemplaire, Livre } = require('../models');

const createExemplaires = async (idLivre, nombre, username) => {
  const result = await sequelize.query(
    'SELECT * FROM create_exemplaires(:idLivre, :nombre, :username)',
    {
      replacements: { idLivre, nombre, username },
      type: sequelize.QueryTypes.SELECT
    }
  );
  return result;
};


// Créer un nouveau notice
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { catalogueur_username, nombre_exemplaires = 0, ...livreData } = req.body;
    
    
    console.log('Données reçues:', {...livreData,
      catalogueur_username,
      nombre_exemplaires
    });

    // Créer le notice
    const nouveauLivre = await Livre.create({
      ...livreData,
      catalogueur_username,
      nombre_exemplaires,
      exemplaires_disponibles: nombre_exemplaires
    }, { 
      transaction,
      returning: true 
    });

    console.log('Livre créé dans la base:', nouveauLivre.toJSON());

    // Verif avec SQL request
    const verificationSQL = await sequelize.query(
      'SELECT * FROM livre WHERE id_livre = :id',
      {
        replacements: { id: nouveauLivre.id_livre },
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    console.log('Vérification SQL:', verificationSQL);

    if (!verificationSQL || verificationSQL.length === 0) {
      await transaction.rollback();
      return res.status(500).json({ 
        message: 'Erreur: Le livre n\'a pas été correctement enregistré dans la base de données',
        details: nouveauLivre.toJSON()
      });
    }

    await transaction.commit();

    // Renvoyer le notice creée
    res.status(201).json({
      message: 'Livre créé avec succès',
      livre: verificationSQL[0]
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur complète:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du livre',
      error: error.message,
      details: error.original || error
    });
  }
});



const validateBookInfo = (req, res, next) => {
  const { bookInfo } = req.body;
  if (!bookInfo || !bookInfo.titre) {
    return res.status(400).json({ message: 'Les informations du livre sont incomplètes' });
  }
  next();
};

// vérif de l'ISBN
const validateIsbn = (req, res, next) => {
  const isbn = req.body.bookInfo?.isbn || req.body.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN est requis' });
  }
  next();
};


router.post('/add', validateBookInfo, validateIsbn, async (req, res) => {
  try {
    const { bookInfo, username } = req.body;
    const catalogueur = { username };
    
    // Vérifier si l'ISBN existe déjà
    const isbnExists = await bookService.checkIsbnExists(bookInfo.isbn);
    if (isbnExists) {
      return res.status(409).json({ 
        message: 'Un livre avec cet ISBN existe déjà',
        isbn: bookInfo.isbn
      });
    }
    
    // Ajouter le livre
    const savedBook = await bookService.addBook(bookInfo, catalogueur);
    res.status(201).json({
      message: 'Livre ajouté avec succès',
      book: savedBook
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre:', error);
    res.status(error.status || 500).json({
      message: "Une erreur s'est produite lors de l'ajout du livre",
      error: error.message
    });
  }
});

router.put('/:isbn',async (req, res) => {
  try {
    const { isbn } = req.params;
    const bookInfo = req.body;
    const { username } = req.body;
    const catalogueur ={ username };
    
    const updatedBook = await bookService.updateBook(isbn, bookInfo, catalogueur);
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/deleteOne/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { username } = req.body;
    const catalogueur ={ username };
    
    const deletedBook = await bookService.deleteBook(isbn, catalogueur);
    res.json({ message: 'Livre supprimé avec succès', book: deletedBook });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/multiple', async (req, res) => {
  try {
      const { isbns } = req.body;
      const { username } = req.body;
      const catalogueur = { username };
      
      if (!isbns || !Array.isArray(isbns) || isbns.length === 0) {
          throw new Error('Veuillez fournir au moins un ISBN pour supprimer les livres');
      }

      const deletedBooks = await bookService.deleteBooks(isbns, catalogueur);
      res.json({ message: 'Livres supprimés avec succès', books: deletedBooks });
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

router.post('/add-exemplaire', validateIsbn, async (req, res) => {
  try {
    const { isbn, username } = req.body;
    const catalogueur = { username };
    
    const isbnExists = await bookService.checkIsbnExists(isbn);
    if (!isbnExists) {
      return res.status(404).json({
        message: 'Aucun livre trouvé avec cet ISBN',
        isbn
      });
    }
    
    const result = await bookService.addExemplaire(isbn, catalogueur);
    res.status(201).json({
      message: 'Exemplaire ajouté avec succès',
      exemplaire: result
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'exemplaire:', error);
    res.status(error.status || 500).json({
      message: "Une erreur s'est produite lors de l'ajout de l'exemplaire",
      error: error.message
    });
  }
});

//verif ISBN

router.get('/check-exists', async (req, res) => {
  const { searchTerm, searchType } = req.query;
  
  try {
    const exists = await bookService.checkBookExists(searchTerm, searchType);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/by-title/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const book = await client.query(`
      SELECT * FROM livre 
      WHERE LOWER(titre) = LOWER($1)
    `, [title]);
    
    res.json(book.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-with-generated-barcode', validateBookInfo, async (req, res) => {
  try {
    const { bookInfo, username } = req.body; // recup  le catalogueur du body
    const catalogueur = { username };
    const result = await bookService.addBookWithGeneratedBarcode(bookInfo, catalogueur);
    res.status(201).json({
      message: 'Livre ajouté avec succès ave c un code-barres généré',
      ...result
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre avec code-barres généré:', error);
    res.status(error.status || 500).json({
       message: "Une erreur s'est produite lors de l'ajout du livre",
      error: error.message
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    const books = await bookService.getAllBooks();
    res.status(200).json({
      count: books.length,
      books
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des livres:', error);
    res.status(500).json({
      message: "Une erreur s'est produite lors de la récupération des livres",
      error: error.message
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const searchCriteria = {
      titre: req.query.titre?.trim() || null,
      description: req.query.description?.trim() || null,
      isbn: req.query.isbn ? req.query.isbn.replace(/\D/g, '') : null,
      auteurs: req.query.auteurs?.trim() || null,
      editeurs: req.query.editeurs?.trim() || null,
      mots_cle: req.query.mots_cle?.trim() || null,
      format: req.query.format?.trim() || null,
      section: req.query.section?.trim() || null,
      categorie: req.query.categorie?.trim() || null,
      langue: req.query.langue?.trim() || null,
      catalogueur_username: req.query.catalogueur_username?.trim() || null,
      acquisition_status: req.query.acquisition_status?.trim() || null,
      disponible: req.query.disponible?.toString().toLowerCase(),
    };

    Object.keys(searchCriteria).forEach(key => {
      if (searchCriteria[key] === undefined) delete searchCriteria[key];
    });

    const books = await bookService.searchBooks(searchCriteria);
    
    res.status(200).json({
      count: books.length,
      criteria: searchCriteria,
      books: books
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des livres:', error);
    res.status(500).json({
      message: "Une erreur s'est produite lors de la recherche des livres",
      error: error.message
    });
  }
});



// Fonction intervalles de dates



router.get('/user-info', async (req, res) => {
  try {
    if (!req.user?.username) {
      return res.status(401).json({
        message: "Utilisateur non authentifié"
      });
    }

    const userInfo = await bookService.getUserInfo(req.user.username);
    if (!userInfo) {
      return res.status(404).json({
        message: "Informations utilisateur non trouvées"
      });
    }

    res.status(200).json(userInfo);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    res.status(500).json({
      message: "Une erreur s'est produite lors de la récupération des informations utilisateur",
      error: error.message
    });
  }
});

module.exports = router;