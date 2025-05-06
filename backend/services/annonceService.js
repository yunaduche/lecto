const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.PORT,
    database: process.env.DB_NAME
});

const annonceService = {
    async createAnnonce(objet, contenu) {
        const query = `
            INSERT INTO annonce (objet, contenu) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        const values = [objet, contenu];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getAllAnnonces() {
        const query = `
            SELECT * FROM annonce 
            ORDER BY date_publication DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    },

    async getAnnonceById(id) {
        const query = `
            SELECT * FROM annonce 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = annonceService;