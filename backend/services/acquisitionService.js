const {SessionAcquisition} = require('../models');
const { Op } = require('sequelize');
const { User } = require('../models'); 

class SessionAcquisitionService {
  static async createSession(nom, createdBy) {
  
    const user = await User.findOne({ where: { username: createdBy, role: 'chef_bibliothecaire' } });
    if (!user) {
      throw new Error('Seul un chef bibliothécaire peut créer une session.');
    }

    // Créer une nouvelle session.
    const session = await SessionAcquisition.create({ nom, created_by: createdBy });
    return session;
  }

  static async closeSession(sessionId, username) {
    // verif que l'utilisateur est chef_bibliothecaire.
    const user = await User.findOne({ where: { username, role: 'chef_bibliothecaire' } });
    if (!user) {
      throw new Error('Seul un chef bibliothécaire peut fermer une session.');
    }

 
    const session = await SessionAcquisition.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error('Session non trouvée.');
    }
    if (session.nom === 'existant') {
      throw new Error('La session "existant" ne peut pas être fermée.');
    }
    if (session.status !== 'ouvert') {
      throw new Error('La session n’est pas ouverte.');
    }

    // day 18 i'm deaad
    session.status = 'fermee';
    session.closed_at = new Date();
    await session.save();
    return session;
  }

  static async  listSessions(options = {}) {
    const {
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      pageSize = 10,
      startDate,
      endDate,
      status
    } = options;

    const allowedSortColumns = [
      'id', 
      'nom', 
      'status', 
      'created_at', 
      'closed_at'
    ];

    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) 
      ? sortOrder.toUpperCase() 
      : 'DESC';
  
    const whereConditions = {

      nom: {
        [Op.ne]: 'existant'
      }
    };
  

    if (search) {
      whereConditions.nom = {
        [Op.and]: [
          { [Op.like]: `%${search}%` },
          { [Op.ne]: 'existant' }
        ]
      };
    }
  
    // Filtre par date
    if (startDate && endDate) {
      whereConditions.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
  
    // Filtre par statut
    if (status) {
      whereConditions.status = status;
    }
  
    try {
      const { count, rows } = await SessionAcquisition.findAndCountAll({
        where: whereConditions,
        order: [[validSortBy, validSortOrder]],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
  
      return {
        sessions: rows,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error);
      throw new Error('Impossible de récupérer les sessions');
    }
  }


  static async getSessionDetails(sessionId) {

    const session = await SessionAcquisition.findByPk(sessionId, {

      include: [

        // inclusions, to rethink...aaaaaaaaaaaaaaaaaaaaaaaaaaaaa

      ]

    });


    if (!session) {

      throw new Error('Session non trouvée');

    }


    return session;

  }
}

module.exports = SessionAcquisitionService;
