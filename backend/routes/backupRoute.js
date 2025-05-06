const express = require('express');
const multer = require('multer');
const DatabaseBackupController = require('../controllers/databaseController');
const DatabaseBackupService = require('../services/databaseBackupService');
const fs = require('fs/promises');
const path = require('path');

const router = express.Router();
const controller = new DatabaseBackupController();

// multer upload
const upload = multer({ dest: 'uploads/' });

router.get('/export/schema', controller.exportSchema.bind(controller));
router.get('/export/data', controller.exportData.bind(controller));
router.get('/export/full', controller.exportFull.bind(controller));


router.post('/restore', upload.single('backup'), controller.restore.bind(controller));


router.get('/list', controller.listBackups.bind(controller));
router.delete('/:filename', controller.deleteBackup.bind(controller));

router.post('/validate-directory', async (req, res) => {
    try {
      const { dirName } = req.body;
      
    
      if (!dirName) {
        return res.status(400).json({ 
          error: 'Le nom du dossier est requis',
          details: 'dirName must be provided in request body'
        });
      }

      console.log('Nom du dossier reçu:', dirName);
  
      const possiblePaths = [
        path.join(process.cwd(), dirName),
        path.join(process.cwd(), '..', dirName),
      ];
  
      console.log('Recherche dans les chemins possibles:', possiblePaths);
  
      let validPath = null;
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          validPath = testPath;
          console.log('Dossier trouvé à:', testPath);
          break;
        } catch (err) {
          console.log(`Dossier non trouvé à: ${testPath}`);
        }
      }
  
      if (!validPath) {
        const newPath = path.join(process.cwd(), '..', dirName);
        await fs.mkdir(newPath, { recursive: true });
        validPath = newPath;
        console.log('Nouveau dossier créé à:', newPath);
      }
  
      res.json({ 
        success: true, 
        fullPath: validPath,
        message: 'Dossier validé et prêt à être utilisé'
      });
  
    } catch (error) {
      console.error('Erreur de validation du dossier:', error);
      res.status(500).json({ 
        error: `Erreur de validation du dossier: ${error.message}`,
        details: error
      });
    }
});
  
  router.post('/set-directory', async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      console.log('Réception de la demande de configuration du dossier:', req.body);
  
 
      await fs.access(dirPath);
      console.log('Dossier accessible:', dirPath);
  
      const dbService = new DatabaseBackupService();
      dbService.setBackupDirectory(dirPath);
      
      // creer le dossier 
      await fs.mkdir(dirPath, { recursive: true });
      console.log('Dossier configuré avec succès:', dirPath);
  
      res.json({ 
        success: true, 
        path: dirPath,
        message: 'Dossier de sauvegarde configuré avec succès'
      });
  
    } catch (error) {
      console.error('Erreur lors de la configuration du dossier:', error);
      res.status(500).json({ 
        error: `Erreur lors de la configuration du dossier: ${error.message}`,
        details: error
      });
    }
  });
  
  router.post('/export/:type', async (req, res) => {
    try {
      const { outputPath } = req.body;
      const dbService = new DatabaseBackupService();
      dbService.setBackupDirectory(outputPath);
      const filePath = await dbService[`export${req.params.type.charAt(0).toUpperCase() + req.params.type.slice(1)}`]();
      res.status(200).json({ success: true, filePath });
    } catch (error) {
      res.status(500).json({ 
        error: 'Export échoué',
        details: error.message 
      });
    }
  });

  router.post('/export/:type', async (req, res) => {
    try {
      const { outputPath } = req.body;
      const dbService = new DatabaseBackupService();
      
      // verif export valide
        const validTypes = ['Schema', 'Data', 'Books'];
      const requestedType = req.params.type.charAt(0).toUpperCase() + req.params.type.slice(1);
      
      if (!validTypes.includes(requestedType)) {
        return res.status(400).json({ 
          error: 'Type d\'export invalide',
          validTypes 
        });
      }
  
      if (outputPath) {

        dbService.setBackupDirectory(outputPath);
      }
  
      const filePath = await dbService[`export${requestedType}`]();
      
      res.status(200).json({ success: true, filePath });
    } catch (error) {

      res.status(500).json({
        error: 'Export échoué',
        details: error.message
      });
    }
  });

module.exports = router;