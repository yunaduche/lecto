const db = require('../models');
const { QueryTypes, Op } = require('sequelize');

class LivreService {
  async createLivreWithExemplaires(livreData, nombreExemplaires, username) {
    const t = await db.sequelize.transaction();

    try {
    
      const user = await db.User.findOne({ 
        where: { username },
        transaction: t
      });
      
      if (!user) {
        throw new Error(`Utilisateur ${username} non trouvé`);
      }

      const livre = await db.Livre.create({
        ...livreData,
        catalogueur_username: username
      }, { transaction: t });

      let sessionAcquisition;
      if (['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(user.role)) {
        sessionAcquisition = await db.SessionAcquisition.findOne({
          where: { nom: 'existant' },
          transaction: t
        });
      } else if (user.role === 'chef_bibliothecaire') {
        sessionAcquisition = await db.SessionAcquisition.findOne({
          where: {
            status: 'ouvert',
            nom: { [Op.ne]: 'existant' }
          },
          order: [['created_at', 'DESC']],
          transaction: t
        });
      }

      if (!sessionAcquisition) {
        throw new Error('Session d\'acquisition non trouvée');
      }

      // create
      const exemplaires = [];
      for (let i = 0; i < nombreExemplaires; i++) {
        const [{ generate_unique_barcode }] = await db.sequelize.query(
          'SELECT generate_unique_barcode()',
          { 
            type: QueryTypes.SELECT,
            transaction: t
          }
        );

        const exemplaire = await db.Exemplaire.create({
          id_livre: livre.id_livre,
          isbn: livre.isbn,
          titre: livre.titre,
          auteurs: livre.auteurs,
          format: livre.format,
          section: livre.section,
          disponibilite: 'libre',
          session_acquisition_id: sessionAcquisition.id,
          session_nom: sessionAcquisition.nom,
          code_barre: generate_unique_barcode
        }, { transaction: t });
        
        exemplaires.push(exemplaire);
      }

      // Mettre à jour le nombre d'exemplaires du livre
      await livre.update({
        nombre_exemplaires: nombreExemplaires,
        exemplaires_disponibles: nombreExemplaires
      }, { transaction: t });

      await t.commit();
      return { livre, exemplaires };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
  
  async addExemplairesToExistingLivre(isbn, nombreExemplaires, username) {
    const t = await db.sequelize.transaction();
    try {
      // Vérifier l'utilisateur
      const user = await db.User.findOne({
        where: { username },
        transaction: t
      });
      
      if (!user) {
        throw new Error(`Utilisateur ${username} non trouvé`);
      }

      // recup le livre existant
      const livre = await db.Livre.findOne({
        where: { isbn },
        transaction: t
      });

      if (!livre) {
        throw new Error(`Livre avec ISBN ${isbn} non trouvé`);
      }

      // determiner la session d'acquisition
      let sessionAcquisition;
      if (['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(user.role)) {
        sessionAcquisition = await db.SessionAcquisition.findOne({
          where: { nom: 'existant' },
          transaction: t
        });
      } else if (user.role === 'chef_bibliothecaire') {
        sessionAcquisition = await db.SessionAcquisition.findOne({
          where: {
            status: 'ouvert',
            nom: { [Op.ne]: 'existant' }
          },
          order: [['created_at', 'DESC']],
          transaction: t
        });
      }

      if (!sessionAcquisition) {
        throw new Error('Session d\'acquisition non trouvée');
      }


      const exemplaires = [];
      for (let i = 0; i < nombreExemplaires; i++) {
        const [{ generate_unique_barcode }] = await db.sequelize.query(
          'SELECT generate_unique_barcode()',
          {
            type: QueryTypes.SELECT,
            transaction: t
          }
        );

        const exemplaire = await db.Exemplaire.create({
          id_livre: livre.id_livre,
          isbn: livre.isbn,
          titre: livre.titre,
          auteurs: livre.auteurs,
          format: livre.format,
          section: livre.section,
          disponibilite: 'libre',
          session_acquisition_id: sessionAcquisition.id,
          session_nom: sessionAcquisition.nom,
          code_barre: generate_unique_barcode
        }, { transaction: t });
        
        exemplaires.push(exemplaire);
      }

      // updt nombre d'exemplaires du livre
      const newTotal = livre.nombre_exemplaires + nombreExemplaires;
      const newDisponibles = livre.exemplaires_disponibles + nombreExemplaires;

      await livre.update({
        nombre_exemplaires: newTotal,
        exemplaires_disponibles: newDisponibles
      }, { transaction: t });

      await t.commit();
      return { livre, exemplaires };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

}

module.exports = new LivreService();