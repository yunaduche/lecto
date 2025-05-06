const { Op } = require('sequelize');
const { Log, User } = require('../models');
const moment = require('moment');

class LogController {
  // Méthode gnrqu pour la recup des logs
  async getLogs(whereCondition = {}) {
    try {
      return await Log.findAll({
        where: whereCondition,
        include: [{
          model: User,
          as: 'user', 
          attributes: ['first_name', 'last_name']
        }],
        order: [['timestamp', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des logs: ${error.message}`);
    }
  }

  // recup tous les logs
  async getAllLogs(req, res) {
    try {
      const logs = await this.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des logs', 
        error: error.message 
      });
    }
  }

  // recup les logs du jour
  async getTodayLogs(req, res) {
    try {
      const today = moment().startOf('day');
      const logs = await this.getLogs({
        timestamp: {
          [Op.gte]: today.toDate(),
          [Op.lt]: moment(today).add(1, 'day').toDate()
        }
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des logs du jour', 
        error: error.message 
      });
    }
  }

  async getLogsByEventType(req, res) {
    try {
      const { eventType } = req.params;
      const logs = await this.getLogs({ event_type: eventType });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des logs par type', 
        error: error.message 
      });
    }
  }

}

module.exports = new LogController();