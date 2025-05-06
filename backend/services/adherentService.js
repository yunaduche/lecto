
const { Op } = require('sequelize');
const db = require('../models');

class AdherentService {
  constructor() {
    this.Adherents = db.Adherents;
  }

  generateUniqueCodebarre = async () => {
    let codebarre;
    let isUnique = false;
    while (!isUnique) {
      codebarre = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      const existingAdherent = await this.Adherents.findOne({ where: { codebarre } });
      if (!existingAdherent) {
        isUnique = true;
      }
    }
    return codebarre;
  }

  createAdherent = async (adherentData) => {
    const codebarre = await this.generateUniqueCodebarre();
    return this.Adherents.create({ ...adherentData, codebarre });
  }
  getAdherentByNumeroCarte = (numeroCarte) => {
    return this.Adherents.findOne({ where: { numero_carte: numeroCarte } });
  }
  
  getAllAdherents = () => {
    return this.Adherents.findAll();
  }

  getAdherentById = (id) => {
    return this.Adherents.findByPk(id);
  }

  updateAdherent = (id, updateData) => {
    return this.Adherents.update(updateData, { where: { id } });
  }

  deleteAdherent = (id) => {
    return this.Adherents.destroy({ where: { id } });
  }
  searchAdherents = async (searchTerm) => {
    const isNumeric = /^\d+$/.test(searchTerm);
  
    return this.Adherents.findAll({
      where: {
        [Op.or]: [
          { nom: { [Op.iLike]: `%${searchTerm}%` } },
          { numero_carte: { [Op.iLike]: `%${searchTerm}%` } },
          { codebarre: { [Op.iLike]: `%${searchTerm}%` } },
          ...(isNumeric ? [{ id: searchTerm }] : []) 
        ]
      }
    });
  }
  
  filterAdherents = async (filters = {}, options = {}) => {
    // default
    const defaultOptions = {
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'ASC'
    };

    const finalOptions = { ...defaultOptions, ...options };


    const whereConditions = {};

//listes des filtres
    if (filters.nom) {
      whereConditions.nom = { [Op.iLike]: `%${filters.nom}%` };
    }

    if (filters.email) {
      whereConditions.email = { [Op.iLike]: `%${filters.email}%` };
    }

    if (filters.quartier) {
      whereConditions.quartier = { [Op.iLike]: `%${filters.quartier}%` };
    }

    if (filters.type_adhesion) {
      whereConditions.type_adhesion = filters.type_adhesion;
    }

    if (filters.banni !== undefined) {
      whereConditions.banni = filters.banni;
    }

    // Filtres de plage pour les dates
    if (filters.fin_adhesion_start || filters.fin_adhesion_end) {
      whereConditions.fin_adhesion = {};
      
      if (filters.fin_adhesion_start) {
        whereConditions.fin_adhesion[Op.gte] = new Date(filters.fin_adhesion_start);
      }
      
      if (filters.fin_adhesion_end) {
        whereConditions.fin_adhesion[Op.lte] = new Date(filters.fin_adhesion_end);
      }
    }

    // Filtres de plage pour les nombres
    if (filters.nombre_total_emprunts_min !== undefined) {
      whereConditions.nombre_total_emprunts = {
        [Op.gte]: filters.nombre_total_emprunts_min
      };
    }

    if (filters.nombre_total_emprunts_max !== undefined) {
      whereConditions.nombre_total_emprunts = {
        ...(whereConditions.nombre_total_emprunts || {}),
        [Op.lte]: filters.nombre_total_emprunts_max
      };
    }


    const result = await this.Adherents.findAndCountAll({
      where: whereConditions,
      order: [[finalOptions.sortBy, finalOptions.sortOrder]],
      limit: finalOptions.pageSize,
      offset: (finalOptions.page - 1) * finalOptions.pageSize
    });

    return {
      totalItems: result.count,
      totalPages: Math.ceil(result.count / finalOptions.pageSize),
      currentPage: finalOptions.page,
      pageSize: finalOptions.pageSize,
      items: result.rows
    };
  }


}

module.exports = new AdherentService();