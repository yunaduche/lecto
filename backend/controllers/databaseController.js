const DatabaseBackupService = require('../services/databaseBackupService');

class DatabaseBackupController {
  constructor() {
    this.backupService = new DatabaseBackupService();
  }

  async exportSchema(req, res) {
    try {
      const filePath = await this.backupService.exportSchema();
      res.download(filePath);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'export du schéma' });
    }
  }

  async exportData(req, res) {
    try {
      const filePath = await this.backupService.exportData();
      res.download(filePath);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'export des données' });
    }
  }

  async exportFull(req, res) {
    try {
      const filePath = await this.backupService.exportFull();
      res.download(filePath);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'export complet' });
    }
  }

  async restore(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      await this.backupService.restore(req.file.path);
      res.json({ message: 'Restauration effectuée avec succès' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la restauration' });
    }
  }

  async listBackups(req, res) {
    try {
      const backups = await this.backupService.listBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la liste des backups' });
    }
  }

  async deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      await this.backupService.deleteBackup(filename);
      res.json({ message: 'Backup supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du backup' });
    }
  }
}

module.exports = DatabaseBackupController;