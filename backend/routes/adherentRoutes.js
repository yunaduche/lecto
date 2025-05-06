const express = require('express');
const router = express.Router();
const adherentService = require('../services/adherentService');
const db = require('../models');

router.post('/', async (req, res) => {
    try {
      const newAdherent = await adherentService.createAdherent(req.body);
      res.status(201).json(newAdherent);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const adherents = await adherentService.getAllAdherents();
      res.json(adherents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post('/batch', async (req, res) => {
    try {
      const adherents = req.body;
      if (!Array.isArray(adherents)) {
        return res.status(400).json({ message: "Le corps de la requête doit être un tableau d'adhérents" });
      }
      if (adherents.length === 0) {
        return res.status(400).json({ message: "Le tableau d'adhérents ne peut pas être vide" });
      }
  
      const createdAdherents = [];
      const updatedAdherents = [];
      const errors = [];
  
      for (let i = 0; i < adherents.length; i++) {
        try {
          const adherent = adherents[i];
          
          
          const existingAdherent = await adherentService.getAdherentByNumeroCarte(adherent.numero_carte);
          
          if (existingAdherent) {
         
            const updatedAdherent = await adherentService.updateAdherent(existingAdherent.id, adherent);
            updatedAdherents.push(updatedAdherent);
          } else {
        
            const newAdherent = await adherentService.createAdherent(adherent);
            createdAdherents.push(newAdherent);
          }
        } catch (error) {
          errors.push({ index: i, error: error.message });
        }
      }
  
      res.status(200).json({
        message: `Traitement terminé`,
        created: `${createdAdherents.length} adhérents créés`,
        updated: `${updatedAdherents.length} adhérents mis à jour`,
        createdAdherents,
        updatedAdherents,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Erreur lors du traitement du lot:', error);
      res.status(500).json({ message: "Erreur interne du serveur lors du traitement du lot" });
    }
  });
  

  
  router.get('/:id', async (req, res) => {
    try {
      const adherent = await adherentService.getAdherentById(req.params.id);
      if (adherent) {
        res.json(adherent);
      } else {
        res.status(404).json({ message: 'Adhérent non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  router.put('/:id', async (req, res) => {
    try {
      const updated = await adherentService.updateAdherent(req.params.id, req.body);
      if (updated[0] === 1) {
        res.json({ message: 'Adhérent mis à jour avec succès' });
      } else {
        res.status(404).json({ message: 'Adhérent non trouvé' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await adherentService.deleteAdherent(req.params.id);
      if (deleted) {
        res.json({ message: 'Adhérent supprimé avec succès' });
      } else {
        res.status(404).json({ message: 'Adhérent non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get('/search', async (req, res) => {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ message: 'Un terme de recherche est requis' });
      }
      const adherents = await adherentService.searchAdherents(term);
      res.json(adherents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get('/filter', async (req, res) => {
    try {
      
      const filters = {
      
        nom: req.query.nom,
        email: req.query.email,
        quartier: req.query.quartier,
        type_adhesion: req.query.type_adhesion,
  
        banni: req.query.banni !== undefined 
          ? (req.query.banni === 'true' || req.query.banni === '1') 
          : undefined,
  
     
        fin_adhesion_start: req.query.fin_adhesion_start,
        fin_adhesion_end: req.query.fin_adhesion_end,
  
       
        nombre_total_emprunts_min: req.query.nombre_total_emprunts_min 
          ? parseInt(req.query.nombre_total_emprunts_min) 
          : undefined,
        nombre_total_emprunts_max: req.query.nombre_total_emprunts_max 
          ? parseInt(req.query.nombre_total_emprunts_max) 
          : undefined
      };
  
      //tri et paginationn
      const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 10,
        sortBy: req.query.sortBy || 'id',
        sortOrder: req.query.sortOrder || 'ASC'
      };
  
     
      const result = await adherentService.filterAdherents(
    
        Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ),
        options
      );
  
      res.json(result);
    } catch (error) {
      console.error('Erreur lors du filtrage des adhérents:', error);
      res.status(500).json({ 
        message: 'Erreur lors du filtrage des adhérents', 
        error: error.message 
      });
    }
  });
  
  module.exports = router;