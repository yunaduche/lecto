const { Exemplaire, sequelize } = require('../models');

const listExemplairesByAcquisition = async () => {
  try {
    const exemplaires = await Exemplaire.findAll({
      attributes: [
        'session_acquisition_id',
        'session_nom',
        [sequelize.fn('COUNT', sequelize.col('id_exemplaire')), 'exemplaire_count'],
      ],
      group: ['session_acquisition_id', 'session_nom']
    });

    const exemplairesDetails = await Exemplaire.findAll({
      attributes: [
        'session_acquisition_id',
        'id_exemplaire',
        'id_livre',
        'isbn',
        'disponibilite',
        'format',
        'derniers_emprunteurs',
        'emprunteur_numero_carte',
        'titre',
        'date_emprunt',
        'date_retour_prevue',
        'bibliothecaire_emprunt_id',
        'section',
        'date_creation',
        'auteurs',
        'code_barre',
        'preteur_username'
      ]
    });

    const groupedExemplaires = exemplaires.map(ex => ({
      ...ex.toJSON(),
      exemplaires: exemplairesDetails.filter(ed => ed.session_acquisition_id === ex.session_acquisition_id)
    }));

    return groupedExemplaires;
  } catch (error) {
    console.error('Erreur lors de la récupération des exemplaires par acquisition:', error);
    throw new Error('Erreur lors de la récupération des exemplaires par acquisition');
  }
};

module.exports = {
  listExemplairesByAcquisition
};
