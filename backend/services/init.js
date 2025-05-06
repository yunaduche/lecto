const DatabaseBackupService = require('../services/databaseBackupService');

function initializeBackupService() {
    const backupService = new DatabaseBackupService();
    

    backupService.setBackupDirectory('./backups');
    
    // programmer la sauvegarde quotidienne à 12h
    backupService.scheduleBackup('0 12 * * *');
    
    console.log('Service de sauvegarde initialisé');
    
    return backupService;
}

module.exports = { initializeBackupService };