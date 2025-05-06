const { Op } = require('sequelize');
const db = require('../models');

class CirculationService {


  async getAdherentInfo(numeroCarte) {
    console.log('Recherche de l\'adhérent avec le numéro de carte:', numeroCarte);
    try {
      const adherent = await db.Adherents.findOne({
        where: {
          numero_carte: {
            [Op.iLike]: numeroCarte
          }
        },
        include: [{
          model: db.Emprunt,
          where: {
            date_retour_effective: null 
          },
          include: [
            {
              model: db.Exemplaire,
              include: [db.Livre]
            },
            {
              model: db.User,
              attributes: ['id', 'username']
            }
          ]
        }],
        attributes: {
          include: [
            [
              db.sequelize.literal('(SELECT COUNT(*) FROM emprunt WHERE emprunt.id_adherent = "Adherents".id AND emprunt.date_retour_effective IS NULL)'),
              'emprunt_en_cours'
            ],
            [
              db.sequelize.literal('(SELECT COUNT(*) FROM emprunt WHERE emprunt.id_adherent = "Adherents".id AND emprunt.date_retour_prevue < CURRENT_DATE AND emprunt.date_retour_effective IS NULL)'),
              'emprunts_en_retard'
            ]
          ]
        },
        logging: console.log
      });
  
      if (!adherent) {
        console.log('Adhérent non trouvé dans la base de données');
        throw new Error('Adhérent non trouvé');
      }

      const adherentInfo = adherent.toJSON();
      adherentInfo.adhesion_valide = new Date(adherentInfo.fin_adhesion) >= new Date();
      adherentInfo.peut_emprunter = !adherentInfo.banni &&
                                    adherentInfo.adhesion_valide &&
                                    adherentInfo.emprunt_en_cours < 2;
  
      console.log('Adhérent trouvé:', adherentInfo);
      return adherentInfo;
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'adhérent:', error);
      throw error;
    }
  }

  async banAdherent(numero_carte, cause) {
    try {
      await db.sequelize.query('SELECT bannir_adherent(:numero_carte, :cause)', {
        replacements: { numero_carte, cause },
        type: db.sequelize.QueryTypes.SELECT
      });
      return { message: 'Adhérent banni avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors du bannissement de l'adhérent: ${error.message}`);
    }
  }

  async debanAdherent(numero_carte) {
    try {
      await db.sequelize.query('SELECT debannir_adherent(:numero_carte)', {
        replacements: { numero_carte },
        type: db.sequelize.QueryTypes.SELECT
      });
      return { message: 'Adhérent débanni avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors du débannissement de l'adhérent: ${error.message}`);
    }
  }

  async getLivresEnRetard() {
    try {
      const result = await db.sequelize.query('SELECT * FROM rapport_livres_en_retard()', {
        type: db.sequelize.QueryTypes.SELECT
      });
      return result;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du rapport des livres en retard: ${error.message}`);
    }
  }

  async verifierEtEnregistrerEmprunts() {
    try {
      await db.sequelize.query('SELECT verifier_et_enregistrer_emprunts()', {
        type: db.sequelize.QueryTypes.SELECT
      });
      return { message: 'Vérification et enregistrement des emprunts effectués avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors de la vérification et de l'enregistrement des emprunts: ${error.message}`);
    }
  }

  async updateDerniersEmprunteurs(exemplaireId, adherentId, transaction) {
    const exemplaire = await db.Exemplaire.findByPk(exemplaireId, { transaction });
    const nouveauxDerniersEmprunteurs = [adherentId, ...exemplaire.derniers_emprunteurs.slice(0, 2)];
    await exemplaire.update({ derniers_emprunteurs: nouveauxDerniersEmprunteurs }, { transaction });
  }

  async enregistrerRetardHistorique(emprunt, daysLate, transaction) {
    await db.HistoriqueRetours.create({
      id_emprunt: emprunt.id_emprunt,
      id_adherent: emprunt.id_adherent,
      id_exemplaire: emprunt.id_exemplaire,
      date_verification: new Date(),
      statut: 'en retard',
      jours_de_retard: daysLate
    }, { transaction });
  }

  async getStatistiquesEmprunts(dateDebut, dateFin) {

    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(*) as total_emprunts,
        AVG(CASE WHEN date_retour_effective > date_retour_prevue THEN 1 ELSE 0 END) as taux_retard,
        AVG(CASE WHEN date_retour_effective IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (date_retour_effective - date_emprunt))/86400 
        ELSE
          EXTRACT(EPOCH FROM (CURRENT_DATE - date_emprunt))/86400
        END) as duree_moyenne_emprunt
      FROM emprunt
      WHERE date_emprunt BETWEEN :dateDebut AND :dateFin
    `, {
      replacements: { dateDebut, dateFin },
      type: db.sequelize.QueryTypes.SELECT
    });
    return stats[0];
  }

  async getLivresPopulaires(limite = 10) {
  
    return await db.Livre.findAll({
      attributes: [
        'isbn',
        'titre',
        [db.sequelize.fn('COUNT', db.sequelize.col('Emprunts.id_emprunt')), 'nombre_emprunts']
      ],
      include: [{
        model: db.Exemplaire,
        attributes: [],
        include: [{
          model: db.Emprunt,
          attributes: []
        }]
      }],
      group: ['Livre.isbn'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('Emprunts.id_emprunt')), 'DESC']],
      limit: limite
    });
  }
}

module.exports = new CirculationService();