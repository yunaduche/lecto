const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const dbConfig = require('../config/database');
const cron = require('node-cron');
const execAsync = promisify(exec);

class DatabaseBackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups'); // Dossier par défaut
    this.pgDumpPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump"';
    this.psqlPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql"';
    this.isScheduled = false;
  }

  setBackupDirectory(directoryPath) {
    this.backupDir = directoryPath;
  }

  async ensureDirectoryExists() {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async exportSchema() {
    await this.ensureDirectoryExists();
    try {
      const filename = `schema_${new Date().toISOString().split('T')[0]}.sql`;
      const filePath = path.join(this.backupDir, filename);
     
      const { host, database, username, password } = dbConfig;
      console.log('Configuration de la base de données:', {
        host,
        database,
        username,
      });
      
      const command = `${this.pgDumpPath} -h ${host} -U ${username} -d ${database} --schema-only > "${filePath}"`;
     
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      const { stdout, stderr } = await execAsync(command, { env });
      if (stderr) {
        console.warn('Avertissements lors de l\'export:', stderr);
      }
      if (stdout) {
        console.log('Sortie de la commande:', stdout);
      }
      
      await fs.access(filePath);
      console.log('Fichier créé avec succès:', filePath);
      return filePath;
    } catch (error) {
      console.error('Erreur dans exportSchema:', {
        message: error.message,
        command: error.cmd,
        stderr: error.stderr,
        stdout: error.stdout
      });
      throw error;
    }
  }

  async exportData() {
    try {
      const filename = `data_${new Date().toISOString().split('T')[0]}.sql`;
      const filePath = path.join(this.backupDir, filename);
     
      const { host, database, username, password } = dbConfig;
      console.log('Configuration de la base de données:', {
        host,
        database,
        username,
      });
      
      const command = `${this.pgDumpPath} -h ${host} -U ${username} -d ${database} --data-only > "${filePath}"`;
     
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      const { stdout, stderr } = await execAsync(command, { env });
      if (stderr) {
        console.warn('Avertissements lors de l\'export:', stderr);
      }
      if (stdout) {
        console.log('Sortie de la commande:', stdout);
      }
      
      await fs.access(filePath);
      console.log('Fichier créé avec succès:', filePath);
      return filePath;
    } catch (error) {
      console.error('Erreur dans exportData:', {
        message: error.message,
        command: error.cmd,
        stderr: error.stderr,
        stdout: error.stdout
      });
      throw error;
    }
  }


  async exportBooks() {
    try {
      const filename = `books_data_${new Date().toISOString().split('T')[0]}.sql`;
      const filePath = path.join(this.backupDir, filename);
     
      const { host, database, username, password } = dbConfig;
      console.log('Configuration de la base de données:', {
        host,
        database,
        username,
      });
      
      const command = `${this.pgDumpPath} -h ${host} -U ${username} -d ${database} --table=livre --data-only > "${filePath}"`;
     
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      const { stdout, stderr } = await execAsync(command, { env });
      if (stderr) {
        console.warn('Avertissements lors de l\'export des livres:', stderr);
      }
      if (stdout) {
        console.log('Sortie de la commande:', stdout);
      }
      
      await fs.access(filePath);
      console.log('Fichier d\'export des livres créé avec succès:', filePath);
      return filePath;
    } catch (error) {
      console.error('Erreur dans exportBooks:', {
        message: error.message,
        command: error.cmd,
        stderr: error.stderr,
        stdout: error.stdout
      });
      throw error;
    }
  }

  async exportFull() {
    try {
      const filename = `full_backup_${new Date().toISOString().split('T')[0]}.sql`;
      const filePath = path.join(this.backupDir, filename);
     
      const { host, database, username, password } = dbConfig;
      console.log('Configuration de la base de données:', {
        host,
        database,
        username,
      });
      
      const command = `${this.pgDumpPath} -h ${host} -U ${username} -d ${database} > "${filePath}"`;
     
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      const { stdout, stderr } = await execAsync(command, { env });
      if (stderr) {
        console.warn('Avertissements lors de l\'export:', stderr);
      }
      if (stdout) {
        console.log('Sortie de la commande:', stdout);
      }
      
      await fs.access(filePath);
      console.log('Fichier créé avec succès:', filePath);
      return filePath;
    } catch (error) {
      console.error('Erreur dans exportFull:', {
        message: error.message,
        command: error.cmd,
        stderr: error.stderr,
        stdout: error.stdout
      });
      throw error;
    }
  }

  async restore(filePath) {
    try {
      const { host, database, username, password } = dbConfig;
      
    
      await fs.access(filePath);
      console.log('Fichier de restauration trouvé:', filePath);
      
      const command = `${this.psqlPath} -h ${host} -U ${username} -d ${database} < "${filePath}"`;
     
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      const { stdout, stderr } = await execAsync(command, { env });
      if (stderr) {
        console.warn('Avertissements lors de la restauration:', stderr);
      }
      if (stdout) {
        console.log('Sortie de la commande:', stdout);
      }
      
      console.log('Restauration terminée avec succès');
    } catch (error) {
      console.error('Erreur dans restore:', {
        message: error.message,
        command: error.cmd,
        stderr: error.stderr,
        stdout: error.stdout
      });
      throw error;
    }
  }
  //sauvegarde auto
  async performBackup() {
    try {
      console.log('Démarrage de la sauvegarde...');
      const schemaFile = await this.exportSchema();
      const dataFile = await this.exportData();
      
      console.log('Sauvegarde terminée avec succès');
      console.log('Fichiers créés:', {
        schema: schemaFile,
        data: dataFile
      });

      await this.cleanOldBackups();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  async cleanOldBackups(retentionDays = 7) {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = new Date();

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

        if (daysOld > retentionDays) {
          await fs.unlink(filePath);
          console.log(`Fichier supprimé: ${file} (${Math.floor(daysOld)} jours)`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des anciennes sauvegardes:', error);
    }
  }

  scheduleBackup(cronExpression = '0 12 * * *') {
    if (this.isScheduled) {
      console.warn('Une sauvegarde est déjà programmée');
      return;
    }

    this.isScheduled = true;
    cron.schedule(cronExpression, async () => {
      console.log('Exécution de la sauvegarde programmée');
      try {
        await this.performBackup();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde programmée:', error);
      }
    });

    console.log(`Sauvegarde programmée avec l'expression cron: ${cronExpression}`);
  }

}

module.exports = DatabaseBackupService;