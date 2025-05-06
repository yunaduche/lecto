const { Op } = require('sequelize');
const db = require('../models');

class EmpruntService {
  async getEmpruntsEnCours() {
    try {
      return await db.Emprunt.findAll({
        where: {
          statut_emprunt: 'en_cours',
          date_retour_effective: null
        },
        order: [['date_retour_prevue', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des emprunts en cours: ${error.message}`);
    }
  }

  async getAllEmprunts() {
    try {
      return await db.Emprunt.findAll({
        order: [['date_emprunt', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des emprunts: ${error.message}`);
    }
  }
  
  async getEmpruntsEnRetard() {
    try {
      const dateActuelle = new Date();
      return await db.Emprunt.findAll({
        where: {
          statut_emprunt: 'en_cours',
          date_retour_effective: null,
          date_retour_prevue: {
            [Op.lt]: dateActuelle
          }
        },
        order: [['date_retour_prevue', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des emprunts en retard: ${error.message}`);
    }
  }

  async updateEmpruntsRetardStatus() {
    try {
      const dateActuelle = new Date();
      await db.Emprunt.update(
        { est_retard: true },
        {
          where: {
            statut_emprunt: 'en_cours',
            date_retour_effective: null,
            date_retour_prevue: {
              [Op.lt]: dateActuelle
            }
          }
        }
      );
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des statuts de retard: ${error.message}`);
    }
  }
}

module.exports = new EmpruntService();