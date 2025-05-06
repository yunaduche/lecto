const { Op } = require('sequelize');
const db = require('../models');

class ExemplaireService {
  constructor() {
    this.Exemplaire = db.Exemplaire;
    this.Adherents = db.Adherents;
  }


  getAllExemplaires = async () => {
    try {
      return await this.Exemplaire.findAll({
        order: [['date_creation', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des exemplaires: ${error.message}`);
    }
  }

  // recup un exemplaire par ID
  getExemplaireById = async (id) => {
    try {
      return await this.Exemplaire.findByPk(id);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'exemplaire: ${error.message}`);
    }
  }

  // recup les exemplaires par livre ID
  getExemplairesByLivreId = async (idLivre) => {
    try {
      return await this.Exemplaire.findAll({
        where: { id_livre: idLivre }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des exemplaires du livre: ${error.message}`);
    }
  }

  // recup les exemplaires disponibles
  getExemplairesDisponibles = async () => {
   
      try {
      return await this.Exemplaire.findAll({
        where: { disponibilite: 'libre' }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des exemplaires disponibles: ${error.message}`);
    }
  }

  // Créer un nouvel exemplaire
  createExemplaire = async (exemplaireData) => {
    try {
      return await this.Exemplaire.create(exemplaireData);
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'exemplaire: ${error.message}`);
    }
  }


  updateExemplaire = async (id, exemplaireData) => {
    try {
      const exemplaire = await this.Exemplaire.findByPk(id);
      if (!exemplaire) {
        throw new Error('Exemplaire non trouvé');
      }
      return await exemplaire.update(exemplaireData);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'exemplaire: ${error.message}`);
    }
  }


  deleteExemplaire = async (id) => {
    try {
      const exemplaire = await this.Exemplaire.findByPk(id);
      if (!exemplaire) {
        throw new Error('Exemplaire non trouvé');
      }
      await exemplaire.destroy();
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'exemplaire: ${error.message}`);
    }
  }


  searchExemplaires = async (searchParams) => {
    try {
      const { titre, isbn, format, section, disponibilite } = searchParams;
      const whereClause = {};

      if (titre) {
        whereClause.titre = { [Op.iLike]: `%${titre}%` };
      }
      if (isbn) {
        whereClause.isbn = isbn;
      }
      if (format) {
        whereClause.format = format;
      }
      if (section) {
        whereClause.section = section;
      }
      if (disponibilite) {
        whereClause.disponibilite = disponibilite;
      }

      return await this.Exemplaire.findAll({
        where: whereClause,
        order: [['date_creation', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur lors de la recherche d'exemplaires: ${error.message}`);
    }
  }
  deleteMultipleExemplaires = async (ids) => {
    try {
      const result = await this.Exemplaire.destroy({
        where: {
          id: {
            [Op.in]: ids
          }
        }
      });
      
      if (result === 0) {
        throw new Error('Aucun exemplaire trouvé pour la suppression');
      }
      
      return {
        success: true,
        deletedCount: result
      };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression multiple des exemplaires: ${error.message}`);
    }
  }

  verifyDeletionPossible = async (id) => {
    try {
      const exemplaire = await this.Exemplaire.findByPk(id);
      if (!exemplaire) {
        throw new Error('Exemplaire non trouvé');
      }

      if (exemplaire.disponibilite === 'emprunté') {
        throw new Error('Impossible de supprimer un exemplaire actuellement emprunté');
      }

      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification: ${error.message}`);
    }
  }

}

module.exports = new ExemplaireService();