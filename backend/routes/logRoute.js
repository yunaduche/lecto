const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { BibliothequeLog } = require('../models');

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


const validateDateParams = (req, res, next) => {
    const { year, month, day } = req.params;
    if (year && !Number.isInteger(+year)) {
        return res.status(400).json({ error: 'Format d\'année invalide' });
    }
    if (month && (!Number.isInteger(+month) || +month < 1 || +month > 12)) {
        return res.status(400).json({ error: 'Format de mois invalide' });
    }
    if (day && (!Number.isInteger(+day) || +day < 1 || +day > 31)) {
        return res.status(400).json({ error: 'Format de jour invalide' });
    }
    next();
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;
const TIMEZONE = 'Indian/Antananarivo';

// optimisation des requêtes avec sélection des colonnes
const defaultAttributes = ['id', 'event_type', 'username', 'timestamp', 'details'];


const cacheMiddleware = (duration) => {
    const cache = new Map();
    return (req, res, next) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);
        
        if (cachedResponse && Date.now() - cachedResponse.timestamp < duration) {
            return res.json(cachedResponse.data);
        }
        
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, {
                timestamp: Date.now(),
                data: body
            });
            res.sendResponse(body);
        };
        next();
    };
};


router.get('/', cacheMiddleware(60000), asyncHandler(async (req, res) => {
    const { limit = DEFAULT_LIMIT, offset = 0 } = req.query;
    const logs = await BibliothequeLog.findAll({
        attributes: defaultAttributes,
        order: [['timestamp', 'DESC']],
        limit: Math.min(+limit, MAX_LIMIT),
        offset: +offset
    });
    res.json({ logs, count: logs.length });
}));

router.get('/date/:year/:month/:day', validateDateParams, asyncHandler(async (req, res) => {
    const { year, month, day } = req.params;
    const date = moment.tz(`${year}-${month}-${day}`, TIMEZONE).startOf('day');
    
    const logs = await BibliothequeLog.findAll({
        attributes: defaultAttributes,
        where: {
            timestamp: {
                [Op.gte]: date.toDate(),
                [Op.lt]: date.clone().add(1, 'day').toDate()
            }
        },
        order: [['timestamp', 'DESC']]
    });
    
    res.json({
        date: date.format('YYYY-MM-DD'),
        count: logs.length,
        logs
    });
}));



router.get('/event/:type', asyncHandler(async (req, res) => {
    const logs = await BibliothequeLog.findAll({
        where: {
            event_type: req.params.type
        },
        order: [['timestamp', 'DESC']]
    });
    res.json(logs);
}));
//par username
router.get('/user/:username', asyncHandler(async (req, res) => {
    const logs = await BibliothequeLog.findAll({
        where: {
            username: req.params.username
        },
        order: [['timestamp', 'DESC']]
    });
    res.json(logs);
}));

router.get('/month/:year/:month', asyncHandler(async (req, res) => {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const logs = await BibliothequeLog.findAll({
        where: {
            timestamp: {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            }
        },
        order: [['timestamp', 'DESC']]
    });
    res.json(logs);
}));



router.get('/year/:year', asyncHandler(async (req, res) => {
    const { year } = req.params;
    const startDate = new Date(year, 0, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, 11, 31);
    endDate.setHours(23, 59, 59, 999);
    
    const logs = await BibliothequeLog.findAll({
        where: {
            timestamp: {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            }
        },
        order: [['timestamp', 'DESC']]
    });
    res.json(logs);
}));


router.get('/between', asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    console.log('Dates reçues:', { startDate, endDate });
    
    try {
        const start = moment(startDate).startOf('day').toDate();
        const end = moment(endDate).endOf('day').toDate();

        console.log('Dates converties:', {
            start: start.toISOString(),
            end: end.toISOString()
        });

        const logs = await BibliothequeLog.findAll({
            where: {
                timestamp: {
                    [Op.between]: [start, end]
                }
            },
            order: [['timestamp', 'DESC']]
        });

        console.log('Requête SQL générée:', BibliothequeLog.findAll({
            where: {
                timestamp: {
                    [Op.between]: [start, end]
                }
            },
            order: [['timestamp', 'DESC']]
        }).toString());

        console.log('Logs trouvés:', logs.length);
        
        res.json({
            count: logs.length,
            startDate: start,
            endDate: end,
            logs: logs
        });
    } catch (error) {
        console.error('Erreur de recherche:', error);
        res.status(400).json({ 
            message: 'Erreur de format de date',
            error: error.message,
            format: 'YYYY-MM-DD'
        });
    }
}));

const moment = require('moment-timezone');

router.get('/today', asyncHandler(async (req, res) => {
    
    moment.tz.setDefault('Indian/Antananarivo');
    
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    console.log('Plage de recherche (Madagascar):', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
    });

    const logs = await BibliothequeLog.findAll({
        where: {
            timestamp: {
                [Op.between]: [startOfDay, endOfDay]
            }
        },
        order: [['timestamp', 'DESC']]
    });

    console.log('Logs trouvés:', logs.length);
    console.log('Détails des logs:', logs.map(log => ({
        id: log.id,
        event_type: log.event_type,
        timestamp: log.timestamp
    })));
    
    res.json({
        count: logs.length,
        date: startOfDay,
        logs: logs
    });
}));

router.get('/search', asyncHandler(async (req, res) => {
    const { 
        query,
        eventType,
        startDate,
        endDate,
        username,
        limit = 100,
        offset = 0
    } = req.query;

    try {
        const whereClause = {};
        const searchConditions = [];

      
        if (query) {
      
            const stringColumns = ['username', 'livre_titre', 'exemplaire_titre', 'session_nom'];
            stringColumns.forEach(column => {
                searchConditions.push({
                    [column]: {
                        [Op.iLike]: `%${query}%`
                    }
                });
            });

            searchConditions.push({
                details: {
                    [Op.cast]: {
                        type: 'text',
                        [Op.iLike]: `%${query}%`
                    }
                }
            });

            searchConditions.push(
                Sequelize.where(
                    Sequelize.fn('to_char', Sequelize.col('timestamp'), 'YYYY-MM-DD HH24:MI:SS'),
                    { [Op.iLike]: `%${query}%` }
                )
            );

            whereClause[Op.or] = searchConditions;
        }

   
        if (eventType) {
            whereClause.event_type = eventType;
        }

        if (username) {
            whereClause.username = username;
        }

       
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) {
                whereClause.timestamp[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.timestamp[Op.lte] = new Date(endDate);
            }
        }

   
        const { count, rows: logs } = await BibliothequeLog.findAndCountAll({
            where: whereClause,
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            total: count,
            offset: parseInt(offset),
            limit: parseInt(limit),
            logs: logs
        });

    } catch (error) {
        console.error('Erreur de recherche:', error);
        res.status(500).json({
            message: 'Erreur lors de la recherche',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));



    module.exports = router;