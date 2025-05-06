const { Op, fn, col, cast } = require('sequelize');
const db = require('../../models');
console.log('DB object:', Object.keys(db));

class BorrowService {
  async borrowBook(adherentId, exemplaireId, bibliothecaireId) {
    console.log('Models available:', Object.keys(db));
    console.log('Adherents model:', db.Adherents);
    console.log('Exemplaire model:', db.Exemplaire);
    console.log('User model:', db.User);

    console.log('Input parameters:', { adherentId, exemplaireId, bibliothecaireId });

    const t = await db.sequelize.transaction();
    try {
      // verif l'adhérent
      const adherent = await db.Adherents.findOne({
        where: { id: adherentId },
        transaction: t
      });
      if (!adherent) throw new Error('Adhérent non trouvé');
      console.log('Adherent numero_carte:', adherent.numero_carte, 'Type:', typeof adherent.numero_carte);
      
     
      const canBorrow = await this.canAdherentBorrow(adherent);
      if (!canBorrow.allowed) throw new Error(canBorrow.reason);
      
      // Vverif bibliothecaire
      if (!bibliothecaireId) {
        throw new Error('id du bibliothécaire manquant');
      }
      console.log('recherche bibliothécaire:', bibliothecaireId);
      const bibliothecaire = await db.User.findOne({
        where: { id: bibliothecaireId },
        transaction: t
      });
      if (!bibliothecaire) {
        console.log('Bibliothécaire non trouvé pour ID:', bibliothecaireId);
        throw new Error('Bibliothécaire non trouvé');
      }
      console.log('Bibliothécaire trouvé:', bibliothecaire.username);
      
  
      const exemplaire = await db.Exemplaire.findOne({
        where: { id_exemplaire: exemplaireId },
        include: [db.Livre],
        transaction: t
      });
      if (!exemplaire) throw new Error('Exemplaire non trouvé');
      
      if (exemplaire.disponibilite !== 'libre') throw new Error('Exemplaire non disponible');
      if (exemplaire.format !== 'empruntable') throw new Error('Exemplaire non empruntable');
      
  
      const existingLoan = await db.Emprunt.findOne({
        where: {
          id_adherent: adherentId,
          id_exemplaire: {
            [Op.in]: db.sequelize.literal(`(SELECT id_exemplaire FROM exemplaire WHERE isbn = '${exemplaire.isbn}')`)
          },
          date_retour_effective: null
        },
        transaction: t
      });
      if (existingLoan) throw new Error('Vous avez déjà emprunté un exemplaire de ce livre');
      
      // Créer l'emprunt
      const dateRetourPrevue = new Date();
      dateRetourPrevue.setDate(dateRetourPrevue.getDate() + 15);
      const emprunt = await db.Emprunt.create({
        id_adherent: adherentId,
        id_exemplaire: exemplaireId,
        date_emprunt: new Date(),
        date_retour_prevue: dateRetourPrevue,
        bibliothecaire_id: bibliothecaireId
      }, { transaction: t });
      
      // upfate l'adhérent
      await adherent.update({
        emprunts_en_cours_ids: db.sequelize.fn('array_append', db.sequelize.col('emprunts_en_cours_ids'), exemplaireId),
        emprunts_en_cours_isbns: db.sequelize.fn('array_append', db.sequelize.col('emprunts_en_cours_isbns'), exemplaire.isbn),
        nombre_total_emprunts: db.sequelize.literal('nombre_total_emprunts + 1')
      }, { transaction: t });
      
      //update  l'exemplaire
      await exemplaire.update({
        disponibilite: 'en pret',
        emprunteur_numero_carte: adherent.numero_carte,
        date_emprunt: new Date(),
        date_retour_prevue: dateRetourPrevue,
        derniers_emprunteurs: fn('array_append', col('derniers_emprunteurs'), cast(adherentId.toString(), 'VARCHAR')),
        bibliothecaire_emprunt_id: bibliothecaireId
      }, { 
        transaction: t,
        logging: console.log // log du query SQL
      });

      await t.commit();
      return { emprunt, livre: exemplaire.Livre };
    } catch (error) {
      console.error('Error in borrowBook:', error);
      if (error.sql) {
        console.error('SQL query that caused the error:', error.sql);
      }
      await t.rollback();
      throw error;
    }
  }

  async canAdherentBorrow(adherent) {
    if (adherent.banni) return { allowed: false, reason: 'Adhérent banni' };
    if (new Date(adherent.fin_adhesion) < new Date()) return { allowed: false, reason: 'Adhésion expirée' };
    
    const empruntsEnCours = await db.Emprunt.count({
      where: {
        id_adherent: adherent.id,
        date_retour_effective: null
      }
    });
    
    if (empruntsEnCours >= 2) return { allowed: false, reason: 'Nombre maximum d\'emprunts atteint' };
    return { allowed: true };
  }
}

module.exports = new BorrowService();