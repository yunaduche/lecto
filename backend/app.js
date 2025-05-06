const express = require('express');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const { router: authRoutes, authMiddleware } = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const circulationRoutes = require('./routes/circulationRoutes');
const adherentRoutes = require('./routes/adherentRoutes');
const exemplaireRoutes = require('./routes/exemplaireRoutes');
const authorizationMiddleware = require('./middleware/authorizationMiddleware');
const errorHandler = require('./middleware/errorHandler');
const bookApiRoutes = require('./routes/bookApiRoutes');
const db = require('./models');
const acquisitionRoutes = require('./routes/acquisitionRoutes');
const exemplaireAcquisitionRoutes = require('./routes/exemplaireAcquisitionRoute');
const PolitiqueEmpruntRoutes = require('./routes/politiqueEmpruntRoute')
const logRoutes = require('./routes/logRoute')
const exRoutes = require('./routes/exemplaireRoute')
const livreRoute = require('./routes/livreRoute')
const exRoute = require('./routes/exRoute')
const listEmprunt = require('./routes/empruntListRoute')
const backupRoute = require('./routes/backupRoute');
const BackupConfigService  = require('./services/backupConfigService');
const annonceRoute = require('./routes/annonceRoute');

const backupConfigService = new BackupConfigService();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// sync de la base de données
db.sequelize.sync().then(() => {
  console.log('Base de données synchronisée');
}).catch(err => {
  console.error('Erreur lors de la synchronisation de la base de données:', err);
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/circulations', circulationRoutes);
app.use('/api/adherents', adherentRoutes);
app.use('/api/exemplaire', exemplaireRoutes);
app.use('/api/book-search', bookApiRoutes);
app.use('/api/acquisitions', acquisitionRoutes);
app.use('/api/exemplaireAcquisitions', exemplaireAcquisitionRoutes);
app.use('/api/politique', PolitiqueEmpruntRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/ex', exRoutes);
app.use('/api/notice', livreRoute);
app.use('/api/ex', exRoute);
app.use('/api/backup', backupRoute);
app.use('/api/listemprunt', listEmprunt);
app.use('/api/annonce', annonceRoute)

//service de sauvegarde


async function initializeBackupService() {
  const backupConfigService = new BackupConfigService();

  await backupConfigService.initializeFromDatabase();
  
  return backupConfigService;
}

app.put('/api/backup-config', async (req, res) => {
  try {
    const config = await backupConfigService.updateConfig({
      is_enabled: req.body.isEnabled,
      frequency: req.body.frequency, 
      backup_path: req.body.backupPath,
      retention_days: req.body.retentionDays
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup-config', async (req, res) => {
  try {
    const config = await backupConfigService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(errorHandler);

const PORT = 9999;
app.listen(PORT, async () => {
  try {
    const backupConfigService = await initializeBackupService();
    console.log('Service de sauvegarde initialisé');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du service de sauvegarde:', error);
  }
});
