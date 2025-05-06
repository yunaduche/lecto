const express = require('express');
const router = express.Router();
const SessionAcquisitionService = require('../services/acquisitionService');

// creation session
router.post('/create', async (req, res) => {
  try {
    const { nom, createdBy } = req.body;
    const session = await SessionAcquisitionService.createSession(nom, createdBy);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get('/active', async (req, res) => {
    try {
      const { 
        search, 
        sortBy, 
        sortOrder, 
        page, 
        pageSize
      } = req.query;
  //filtrage des sessions avec status ouvert
      const options = {
        search,
        sortBy,
        sortOrder,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        status: 'ouvert' 
      };
  
      const sessions = await SessionAcquisitionService.listSessions(options);
  
      res.status(200).json(sessions);
    } catch (error) {
      console.error('Erreur dans la route /active:', error);
      res.status(500).json({ error: error.message });
    }
  });



router.post('/close', async (req, res) => {
  try {
    const { sessionId, username } = req.body;
    const session = await SessionAcquisitionService.closeSession(sessionId, username);
    res.status(200).json(session);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/list', async (req, res) => {
    try {
      const { 
        search, 
        sortBy, 
        sortOrder, 
        page, 
        pageSize,
        startDate,
        endDate,
        status
      } = req.query;
  
      const sessions = await SessionAcquisitionService.listSessions({
        search,
        sortBy,
        sortOrder,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        startDate,
        endDate,
        status
      });
  
      res.status(200).json(sessions);
    } catch (error) {
      console.error('Erreur dans la route /list:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  
  
  router.get('/:sessionId', async (req, res) => {
  
    try {
  
      const { sessionId } = req.params;
  
      const session = await SessionAcquisitionService.getSessionDetails(sessionId);
  
      res.status(200).json(session);
  
    } catch (error) {
  
      res.status(404).json({ error: error.message });
  
    }
  
  });

module.exports = router;
