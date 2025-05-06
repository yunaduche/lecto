const { Pool } = require('pg');
const cron = require('node-cron');
const DatabaseBackupService = require('./databaseBackupService');
require('dotenv').config();

const poolConfig = {
    user: process.env.DB_USER,
    host: 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};

class BackupConfigService {
  constructor() {
    this.pool = new Pool(poolConfig);
    this.backupService = new DatabaseBackupService();
    this.currentJob = null;
  }

  setBackupDirectory(directoryPath) {
    this.backupDir = directoryPath;
  }

  validateCronExpression(cronExpression) {
    try {
   
      if (!cron.validate(cronExpression)) {
        console.error('Expression cron invalide:', cronExpression);
        return '0 0 * * *'; //
      }
      return cronExpression;
    } catch (error) {
      console.error('Erreur lors de la validation de l\'expression cron:', error);
      return '0 0 * * *';
    }
  }

  async initializeTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS backup_config (
        id SERIAL PRIMARY KEY,
        is_enabled BOOLEAN DEFAULT false,
        frequency TEXT DEFAULT '0 0 * * *',
        backup_path TEXT DEFAULT './backups',
        retention_days INTEGER DEFAULT 7,
        last_backup TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    try {
      await this.pool.query(query);
      const checkQuery = 'SELECT id FROM backup_config LIMIT 1';
      const result = await this.pool.query(checkQuery);
      
      if (result.rows.length === 0) {
        const defaultFrequency = '0 0 * * *'; // midnightt
        await this.pool.query(`
          INSERT INTO backup_config (is_enabled, frequency, backup_path)
          VALUES (false, $1, './backups')
        `, [defaultFrequency]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la table backup_config:', error);
    }
  }

  async getConfig() {
    try {
      const result = await this.pool.query('SELECT * FROM backup_config ORDER BY id LIMIT 1');
      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw error;
    }
  }

  async updateConfig(config) {
    const {
      is_enabled,
      frequency,
      backup_path,
      retention_days
    } = config;

    const validatedFrequency = this.validateCronExpression(frequency);

    try {
      const query = `
        UPDATE backup_config
        SET is_enabled = $1,
            frequency = $2,
            backup_path = $3,
            retention_days = $4,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        is_enabled,
        validatedFrequency,
        backup_path,
        retention_days
      ]);

      await this.reconfigureBackupService(result.rows[0]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw error;
    }
  }

  async reconfigureBackupService(config) {
    if (this.currentJob) {
      this.currentJob.stop();
      this.currentJob = null;
    }

    if (!config.is_enabled) {
      console.log('Service de sauvegarde désactivé');
      return;
    }

    try {
      const validatedFrequency = this.validateCronExpression(config.frequency);
      this.backupService.setBackupDirectory(config.backup_path);
      
      this.currentJob = cron.schedule(validatedFrequency, async () => {
        try {
          await this.backupService.performBackup();
          await this.pool.query(`
            UPDATE backup_config
            SET last_backup = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [config.id]);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde programmée:', error);
        }
      });
      
      console.log(`Service de sauvegarde reconfiguré avec la fréquence: ${validatedFrequency}`);
    } catch (error) {
      console.error('Erreur lors de la reconfiguration du service de sauvegarde:', error);
    }
  }

  async initializeFromDatabase() {
    try {
      const config = await this.getConfig();
      if (config) {
        await this.reconfigureBackupService(config);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation depuis la base de données:', error);
      throw error;
    }
  }
}

module.exports = BackupConfigService;