const {PolitiqueEmprunt} = require('../models');
class PolitiqueEmpruntService {

  async getPolitiqueEmprunt() {
    try {
      const politique = await PolitiqueEmprunt.findOne();
      return politique;
    } catch (error) {
      throw new Error('Erreur lors de la récupération de la politique d\'emprunt');
    }
  }

  async updatePolitiqueEmprunt(data) {
    try {
      const [updated] = await PolitiqueEmprunt.update(
        {
          duree_emprunt_jours: data.duree_emprunt_jours,
          nombre_renouvellement_max: data.nombre_renouvellement_max,
          nombre_exemplaires_max: data.nombre_exemplaires_max
        },
        { where: {} }
      );

      if (updated === 0) {
        throw new Error('Aucune politique d\'emprunt trouvée');
      }

      return this.getPolitiqueEmprunt();
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de la politique d\'emprunt');
    }
  }
}

module.exports = new PolitiqueEmpruntService();