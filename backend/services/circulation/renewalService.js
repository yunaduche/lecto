const db = require('../../models');

class RenewalService {
  async renewLoan(empruntId) {
    const t = await db.sequelize.transaction();
    try {
      const emprunt = await db.Emprunt.findByPk(empruntId, { 
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      
      if (!emprunt) throw new Error('Emprunt est introuvable');
      if (emprunt.renouvele) throw new Error('Cet emprunt a déjà été renouvelé');
      if (new Date() > emprunt.date_retour_prevue) throw new Error('Emprunt en retard, renouvellement impossible');
      
      const newReturnDate = new Date(emprunt.date_retour_prevue);
      newReturnDate.setDate(newReturnDate.getDate() + 15);
      
      await emprunt.update({
        date_retour_prevue: newReturnDate,
        renouvele: true
      }, { transaction: t });

      await db.Exemplaire.update({
        date_retour_prevue: newReturnDate
      }, { 
        where: { id_exemplaire: emprunt.id_exemplaire },
        transaction: t 
      });

      await t.commit();
      return emprunt;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new RenewalService();