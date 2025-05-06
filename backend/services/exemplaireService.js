const { Op, Sequelize } = require('sequelize');
const { Exemplaire, Livre, Adherents } = require('../models');

class ExemplaireService {

  async ajouterExemplaires(isbn, nombreExemplaires) {
    let transaction;

    try {

      transaction = await Exemplaire.sequelize.transaction();


      const livre = await Livre.findOne({
        where: { isbn },
        lock: true,
        transaction
      });

      if (!livre) {
        throw new Error(`Livre avec ISBN ${isbn} non trouvé`);
      }

      const exemplairesACreer = Array.from({ length: nombreExemplaires }, () => ({
        isbn: isbn,
        disponibilite: 'libre',
        format: livre.format,
        section: livre.section
      }));

      await Exemplaire.bulkCreate(exemplairesACreer, { transaction });


      await livre.increment({
        'nombre_exemplaires': nombreExemplaires
        
      }, { transaction });


      await transaction.commit();

      return await Livre.findByPk(isbn, {
        attributes: [
          'isbn',
          'titre',
          'nombre_exemplaires',
          'exemplaires_disponibles'
        ]
      });

    } catch (error) {
   
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Erreur lors du rollback:', rollbackError);
        }
      }
      
      throw new Error(`Erreur lors de l'ajout des exemplaires: ${error.message}`);
    }
  }

    async getAllExemplaires() {
        return Exemplaire.findAll({
          include: [
            { 
              model: Livre, 
              attributes: ['titre', 'auteurs', 'editeurs'] 
            },
            {
              model: Adherents,
              as: 'DerniersEmprunteurs',
              attributes: [],
              through: { attributes: [] }
            }
          ],
          attributes: [
            'id_exemplaire',
            'isbn',
            'titre',
            'disponibilite',
            'format',
            [Sequelize.fn('ARRAY_AGG', Sequelize.col('DerniersEmprunteurs.numero_carte')), 'derniers_emprunteurs']
          ],
          group: [
            'Exemplaire.id_exemplaire', 
            'Exemplaire.isbn',
            'Exemplaire.titre',
            'Exemplaire.disponibilite',
            'Exemplaire.format',
            'Livre.isbn', 
            'Livre.titre', 
            'Livre.auteurs', 
            'Livre.editeurs'
          ]
        });
      }
      async getExemplaireById(id) {
        const exemplaire = await Exemplaire.findByPk(id, {
          include: [
            { model: Livre, attributes: ['titre', 'auteurs', 'editeurs'] },
            {
              model: Adherents,
              as: 'DerniersEmprunteurs',
              attributes: ['numero_carte'],
              through: { attributes: [] }
            }
          ],
          attributes: {
            include: [
              [
                Sequelize.fn('ARRAY_AGG', Sequelize.col('DerniersEmprunteurs.numero_carte')),
                'derniers_emprunteurs'
              ]
            ]
          },
          group: ['Exemplaire.id_exemplaire', 'Livre.isbn', 'Livre.titre', 'Livre.auteurs', 'Livre.editeurs']
        });
    
        if (!exemplaire) {
          throw new Error('Exemplaire non trouvé');
        }
    
        return exemplaire.get({ plain: true });
      }

  async searchExemplaires(query) {
    return Exemplaire.findAll({
      include: [{
        model: Livre,
        where: {
          [Op.or]: [
            { titre: { [Op.iLike]: `%${query}%` } },
            { isbn: { [Op.iLike]: `%${query}%` } }
          ]
        },
        attributes: ['titre', 'auteurs', 'editeurs', 'isbn']
      }]
    });
  }

  async filterExemplaires(count) {
    const exemplaires = await Exemplaire.findAll({
      include: [{ model: Livre, attributes: ['titre', 'isbn'] }],
      attributes: ['isbn', [Sequelize.fn('COUNT', Sequelize.col('Exemplaire.id_exemplaire')), 'count']],
      group: ['Exemplaire.isbn', 'Livre.titre', 'Livre.isbn'],
      having: Sequelize.literal(`COUNT(Exemplaire.id_exemplaire) > ${count}`)
    });

    return exemplaires;
  }
}

module.exports = new ExemplaireService();