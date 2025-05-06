const express = require('express');
const router = express.Router();
const annonceService = require('../services/annonceService');


router.post('/', async (req, res) => {
    try {
        const { objet, contenu } = req.body;
        
        if (!objet || !contenu) {
            return res.status(400).json({ 
                message: 'L\'objet et le contenu sont requis'  //res detail
            });
        }

        const annonce = await annonceService.createAnnonce(objet, contenu);
        res.status(201).json(annonce);
    } catch (error) {
        console.error('Erreur lors de la création de l\'annonce:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de l\'annonce' 
        });
    }
});


router.get('/', async (req, res) => {
    try {
        const annonces = await annonceService.getAllAnnonces();
        res.json(annonces);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des annonces' 
        });
    }
});

//on aura besoin pour postman
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const annonce = await annonceService.getAnnonceById(id);
        
        if (!annonce) {
            return res.status(404).json({ 
                message: 'Annonce non trouvée' 
            });
        }
        
        res.json(annonce);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'annonce:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de l\'annonce' 
        });
    }
});

module.exports = router;