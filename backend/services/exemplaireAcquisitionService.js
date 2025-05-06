
const { Exemplaire, SessionAcquisition, sequelize } = require('../models');
const { Op } = require('sequelize');

class ExemplaireService {
 
    async getExemplairesBySession(idSession, filters = {}) {
        try {
            const {
                section,
                disponibilite,
                format,
                pagination = { page: 1, limit: 10 },
                sort = { field: 'date_creation', order: 'DESC' }
            } = filters;

      
            const where = {
                id_session_acquisition: idSession
            };


            if (section) {
                where.section = section;
            }

            if (disponibilite !== undefined) {
                where.disponibilite = String(disponibilite === 'true' || disponibilite === true);
            }

            if (format) {
                where.format = format;
            }

            console.log('Filtres appliqués:', where); 

            const offset = (pagination.page - 1) * pagination.limit;

    
            const { count, rows: exemplaires } = await Exemplaire.findAndCountAll({
                where,
                order: [[sort.field, sort.order]],
                limit: pagination.limit,
                offset,
                attributes: [
                    'id_exemplaire',
                    'isbn',
                    'titre',
                    'disponibilite',
                    'format',
                    'section',
                    'derniers_emprunteurs',
                    'acquisition_status',
                    'date_creation',
                    'url_photo',
                    'emprunteur_numero_carte',
                    'date_emprunt',
                    'date_retour_prevue',
                    'bibliothecaire_emprunt_id',
                    'auteurs'
                ]
            });

            const stats = await Exemplaire.findAll({
                where: { id_session_acquisition: idSession },
                attributes: [
                    'section',
                    [sequelize.fn('COUNT', sequelize.col('id_exemplaire')), 'total'],
                    [
                        sequelize.fn(
                            'SUM',
                            sequelize.literal("CASE WHEN disponibilite = 'true' THEN 1 ELSE 0 END")
                        ),
                        'disponibles'
                    ]
                ],
                group: ['section']
            });

            const session = await SessionAcquisition.findByPk(idSession);
            if (!session) {
                throw new Error('Session non trouvée');
            }

            const statistiques = {
                total: count,
                adulte: stats.find(s => s.section === 'adulte')?.dataValues.total || 0,
                jeunesse: stats.find(s => s.section === 'jeunesse')?.dataValues.total || 0,
                disponibles: stats.reduce((sum, stat) => sum + (parseInt(stat.dataValues.disponibles) || 0), 0)
            };

            return {
                success: true,
                session: {
                    id: session.id_session,
                    titre: session.titre,
                    statut: session.statut,
                    date_ouverture: session.date_ouverture
                },
                statistiques,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    totalItems: count,
                    totalPages: Math.ceil(count / pagination.limit)
                },
                exemplaires: exemplaires.map(ex => ({
                    id: ex.id_exemplaire,
                    isbn: ex.isbn,
                    titre: ex.titre,
                    disponibilite: ex.disponibilite === 'true', 
                    format: ex.format,
                    section: ex.section,
                    derniers_emprunteurs: ex.derniers_emprunteurs,
                    auteurs: ex.auteurs,
                    emprunt_actuel: ex.emprunteur_numero_carte ? {
                        numero_carte: ex.emprunteur_numero_carte,
                        date_emprunt: ex.date_emprunt,
                        date_retour_prevue: ex.date_retour_prevue,
                        bibliothecaire_id: ex.bibliothecaire_emprunt_id
                    } : null
                }))
            };
        } catch (error) {
            console.error('Erreur détaillée:', error);
            throw new Error(`Erreur lors de la récupération des exemplaires: ${error.message}`);
        }
    }

    async getDetailedStats(idSession) {
        try {
            const stats = await sequelize.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN "section" = 'adulte' THEN 1 ELSE 0 END) as total_adulte,
                    SUM(CASE WHEN "section" = 'jeunesse' THEN 1 ELSE 0 END) as total_jeunesse,
                    SUM(CASE WHEN disponibilite = 'true' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN emprunteur_numero_carte IS NOT NULL THEN 1 ELSE 0 END) as empruntes
                FROM "exemplaire"
                WHERE id_session_acquisition = :idSession
            `, {
                replacements: { idSession },
                type: sequelize.QueryTypes.SELECT,
                logging: console.log
            });

            // view de la result
            console.log('Résultats des stats:', stats);

            return {
                success: true,
                statistiques: stats[0]
            };
        } catch (error) {
            //detaillée
            console.error('Erreur SQL complète:', error);
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

  
    async searchExemplaires(criteres) {
        const {
            titre,
            auteur,
            isbn,
            pagination = { page: 1, limit: 10 }
        } = criteres;

        const where = {};
        if (titre) where.titre = { [Op.iLike]: `%${titre}%` };
        if (isbn) where.isbn = { [Op.iLike]: `%${isbn}%` };
        if (auteur) where.auteurs = { [Op.contains]: [auteur] };

        const offset = (pagination.page - 1) * pagination.limit;

        try {
            const { count, rows: exemplaires } = await Exemplaire.findAndCountAll({
                where,
                limit: pagination.limit,
                offset
            });

            return {
                success: true,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    totalItems: count,
                    totalPages: Math.ceil(count / pagination.limit)
                },
                exemplaires
            };
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    async listSessionsAcquisition() {
        try {
            const sessions = await sequelize.query(`
                SELECT DISTINCT 
                    id_session_acquisition,
                    MAX(titre) as titre,
                    COUNT(*) as nombre_exemplaires,
                    MAX(date_creation) as derniere_modification
                FROM exemplaire 
                WHERE id_session_acquisition IS NOT NULL
                GROUP BY id_session_acquisition
                ORDER BY MAX(date_creation) DESC
            `, {
                type: sequelize.QueryTypes.SELECT
            });

            return {
                success: true,
                sessions: sessions.map(session => ({
                    id: session.id_session_acquisition,
                    titre: session.titre,
                    nombre_exemplaires: parseInt(session.nombre_exemplaires),
                    derniere_modification: session.derniere_modification
                }))
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des sessions:', error);
            throw new Error(`Erreur lors de la récupération des sessions d'acquisition: ${error.message}`);
        }
    }
}

module.exports = new ExemplaireService();