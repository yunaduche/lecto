
const express = require('express');
const router = express.Router();
const exemplaireService = require('../services/exemplaireAcquisitionService');

router.get('/liste', async (req, res) => {
    try {
        const result = await exemplaireService.listSessionsAcquisition();
        res.json(result);
    } catch (error) {
        console.error('Erreur route /sessions:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.get('/session/:idSession', async (req, res) => {
    try {
        const { idSession } = req.params;
        const { 
            section,
            disponibilite,
            format,
            page = 1,
            limit = 10,
            sortBy = 'date_creation',
            sortOrder = 'DESC'
        } = req.query;

        const filters = {
            section,
            disponibilite: disponibilite === 'true',
            format,
            pagination: { page: parseInt(page), limit: parseInt(limit) },
            sort: { field: sortBy, order: sortOrder }
        };

        const resultat = await exemplaireService.getExemplairesBySession(idSession, filters);
        res.json(resultat);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/session/:idSession/stats', async (req, res) => {
    try {
        const { idSession } = req.params;
        const stats = await exemplaireService.getDetailedStats(idSession);
        res.json(stats);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


//
router.get('/search', async (req, res) => {
    try {
        const { 
            titre,
            auteur,
            isbn,
            page = 1,
            limit = 10
        } = req.query;

        const resultats = await exemplaireService.searchExemplaires({
            titre,
            auteur,
            isbn,
            pagination: { page: parseInt(page), limit: parseInt(limit) }
        });
        res.json(resultats);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;
