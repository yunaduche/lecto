const db = require('../../models');
const { QueryTypes } = require('sequelize');

class ReturnService {
  async getBookReturnInfo(isbn) {
    try {
      const results = await db.sequelize.query('SELECT * FROM obtenir_infos_retour_livre(:isbn)', {
        replacements: { isbn },
        type: QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error(`Erreur lors de la récupération des informations de retour: ${error.message}`);
      throw error;
    }
  }

  async getAdherentBorrowedBooks(numeroCarteAdherent) {
    try {
      const result = await db.sequelize.query('SELECT * FROM lister_emprunts_adherent(:numeroCarteAdherent)', {
        replacements: { numeroCarteAdherent },
        type: QueryTypes.SELECT
      });
      return result;
    } catch (error) {
      console.error(`Erreur lors de la récupération des livres empruntés par l'adhérent: ${error.message}`);
      throw error;
    }
  }

  async returnBookByExemplaireId(exemplaireId) {
    const t = await db.sequelize.transaction();
    try {
      const [result] = await db.sequelize.query('SELECT retourner_livre(:exemplaireId) AS message', {
        replacements: { exemplaireId },
        type: QueryTypes.SELECT,
        transaction: t
      });

      if (result.message.startsWith('Erreur')) {
        throw new Error(result.message);
      }

      await t.commit();
      return { message: result.message };
    } catch (error) {
      await t.rollback();
      console.error(`Erreur lors du retour du livre: ${error.message}`);
      throw error;
    }
  }


  async returnBook(exemplaireId) {
    const t = await db.sequelize.transaction();
    try {
      console.log(`Tentative de retour du livre pour l'exemplaire ID: ${exemplaireId}`);
     
      const emprunt = await db.Emprunt.findOne({
        where: {
          id_exemplaire: exemplaireId,
          date_retour_effective: null 
        },
        include: [
          { model: db.Exemplaire, include: [db.Livre] },
          { model: db.Adherents }
        ],
        transaction: t
      });
  
      if (!emprunt) {
        throw new Error('Aucun emprunt actif trouvé pour cet exemplaire');
      }
  
      const [result] = await db.sequelize.query('SELECT retourner_livre(:exemplaireId) AS message', {
        replacements: { exemplaireId },
        type: db.Sequelize.QueryTypes.SELECT,
        transaction: t
      });
  
      const returnMessage = result.message;
      if (returnMessage.startsWith('Erreur')) {
        throw new Error(returnMessage);
      }
  
      const today = new Date();
      const isLate = today > emprunt.date_retour_prevue;
 
      await emprunt.update({
        date_retour_effective: today
      }, { transaction: t });
 
      await emprunt.Exemplaire.update({
        disponibilite: 'libre',
        emprunteur_numero_carte: null,
        date_emprunt: null,
        date_retour_prevue: null
      }, { transaction: t });
  
      await t.commit();
      console.log(`Retour du livre effectué avec succès pour l'exemplaire ID: ${exemplaireId}`);
      return { message: returnMessage, isLate };
    } catch (error) {
      await t.rollback();
      console.error(`Erreur lors du retour du livre: ${error.message}`);
      throw error;
    }
  }

  async getOverdueLoans() {
    try {
      const overdueLoans = await db.EmpruntEnRetard.findAll();
      return overdueLoans;
    } catch (error) {
      console.error('Erreur lors de la récupération des emprunts en retard:', error);
      throw error;
    }
  }

  async updateOverdueLoans() {
    const t = await db.sequelize.transaction();
    try {
      await db.sequelize.query('SELECT maj_emprunts_en_retard()', {
        type: QueryTypes.SELECT,
        transaction: t
      });
      await t.commit();
      console.log('Mise à jour des emprunts en retard effectuée avec succès');
    } catch (error) {
      await t.rollback();
      console.error('Erreur lors de la mise à jour des emprunts en retard:', error);
      throw error;
    }
  }
}

module.exports = new ReturnService();