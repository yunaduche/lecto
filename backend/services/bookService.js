const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



//  distance de Levenshtein
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

function cleanIsbn(isbn) {
  if (!isbn) return null;
  // Enlève tout sauf les chiffres
  return isbn.replace(/\D/g, '');
}

// Fonction pour vérifier si deux chaînes sont similaires
function areSimilar(str1, str2, threshold = 2) {
  if (!str1 || !str2) return false;
  const distance = levenshteinDistance(
    str1.toLowerCase(),
    str2.toLowerCase()
  );
  return distance <= threshold;
}

const bookService = {

  async addBook(bookInfo, catalogueur) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
   

      const userInfo = await this.getUserInfo(catalogueur.username);
      if (!userInfo || !['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(userInfo.role)) {
        throw new Error('Seuls les bibliothécaires peuvent ajouter des livres');
      }

      const section = userInfo.role === 'bibliothecaire_jeunesse' ? 'jeunesse' : 'adulte';
      
      const queryText = `
        INSERT INTO livre (
          isbn, titre, auteurs, editeurs, format,
          date_publication, nombre_pages, categorie, langue,
          mots_cle, description, url_photo, nombre_exemplaires,
          section, catalogueur_username
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING *
      `;
      
      const values = [
        bookInfo.isbn,
        bookInfo.titre,
        bookInfo.auteurs,
        bookInfo.editeurs,
        bookInfo.format,
        bookInfo.date_publication,
        bookInfo.nombre_pages,
        bookInfo.categorie,
        bookInfo.langue,
        bookInfo.mots_cle,
        bookInfo.description,
        bookInfo.url_photo,
        bookInfo.nombre_exemplaires || 1,
        section,
        catalogueur.username
      ];

      const res = await client.query(queryText, values);

      // Récupération des codes-barres générés
      const barcodeQuery = `
        SELECT code_barre 
        FROM exemplaire 
        WHERE isbn = $1 
        ORDER BY date_creation DESC 
        LIMIT $2
      `;
      
      const barcodes = await client.query(barcodeQuery, [bookInfo.isbn, bookInfo.nombre_exemplaires || 1]);
      
      await client.query('COMMIT');
      
      return {
        livre: res.rows[0],
        codes_barres: barcodes.rows.map(row => row.code_barre)
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  async updateBook(isbn, bookInfo, catalogueur) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Vérification du rôle
      const userInfo = await this.getUserInfo(catalogueur.username);
      if (!userInfo || !['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(userInfo.role)) {
        throw new Error('Seuls les bibliothécaires peuvent modifier des livres');
      }


          const queryText = `
        UPDATE livre 
        SET titre = $1, auteurs = $2, editeurs = $3, format = $4,
            date_publication = $5, nombre_pages = $6, categorie = $7,
            langue = $8, mots_cle = $9, description = $10, url_photo = $11
        WHERE isbn = $12
        RETURNING *
      `;
      
      const values = [
        bookInfo.titre,
        bookInfo.auteurs,
        bookInfo.editeurs,
        bookInfo.format,
        bookInfo.date_publication,
        bookInfo.nombre_pages,
        bookInfo.categorie,
        bookInfo.langue,
        bookInfo.mots_cle,
        bookInfo.description,
        bookInfo.url_photo,
        isbn
      ];

      const res = await client.query(queryText, values);
      await client.query('COMMIT');
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Nouvelle fonction pour supprimer un livre
  async deleteBook(isbn, catalogueur) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      

      const userInfo = await this.getUserInfo(catalogueur.username);
      if (!userInfo || !['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(userInfo.role)) {
        throw new Error('Seuls les bibliothécaires peuvent supprimer des livres');
      }

      const res = await client.query('DELETE FROM livre WHERE isbn = $1 RETURNING *', [isbn]);
      
      await client.query('COMMIT');
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  async deleteBooks(isbns, catalogueur) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Vérification du rôle
        const userInfo = await this.getUserInfo(catalogueur.username);
        if (!userInfo || !['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(userInfo.role)) {
            throw new Error('Seuls les bibliothécaires peuvent supprimer des livres');
        }

        // Vérification et suppression des livres
        const deletedBooks = [];
        for (const isbn of isbns) {
          
            const res = await client.query('DELETE FROM livre WHERE isbn = $1 RETURNING *', [isbn]);
            if (res.rows.length) {
                deletedBooks.push(res.rows[0]);
            }
        }

        await client.query('COMMIT');
        return deletedBooks;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
},
  async addBookWithGeneratedBarcode(bookInfo, catalogueur) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const generatedBarcode = await this.generateUniqueBarcode();
      bookInfo.isbn = generatedBarcode;
      
      const result = await this.addBook(bookInfo, catalogueur);
      
      await client.query('COMMIT');
      return { ...result, generatedBarcode };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async addExemplaire(isbn, catalogueur) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userInfo = await this.getUserInfo(catalogueur.username);
      if (!userInfo || !['bibliothecaire_jeunesse', 'bibliothecaire_adulte'].includes(userInfo.role)) {
        throw new Error('Seuls les bibliothécaires peuvent ajouter des exemplaires');
      }

      // recup des informations du livre
      const livreInfo = await client.query('SELECT * FROM livre WHERE isbn = $1', [isbn]);
      if (livreInfo.rows.length === 0) {
        throw new Error('Livre non trouvé');
      }

      // verif de la correspondance section/rôle
      if ((userInfo.role === 'bibliothecaire_jeunesse' && livreInfo.rows[0].section !== 'jeunesse') ||
          (userInfo.role === 'bibliothecaire_adulte' && livreInfo.rows[0].section !== 'adulte')) {
        throw new Error('Vous ne pouvez pas ajouter d\'exemplaire pour cette section');
      }

      const result = await client.query(`
        INSERT INTO exemplaire (
          isbn, format, section
        ) VALUES (
          $1, $2, $3
        ) RETURNING *
      `, [isbn, livreInfo.rows[0].format, livreInfo.rows[0].section, 'existant']);

      await client.query(`
        UPDATE livre 
        SET nombre_exemplaires = nombre_exemplaires + 1 
        WHERE isbn = $1
      `, [isbn]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async getAllBooks() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT *
        FROM livre
        ORDER BY titre
      `;
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  },
  async searchBooks(criteria) {
    const client = await pool.connect();
    try {
      let query = `
        WITH ranked_books AS (
          SELECT 
            *,
            ts_rank(to_tsvector('french', titre), plainto_tsquery('french', COALESCE($1, ''))) as titre_rank,
            ts_rank(to_tsvector('french', COALESCE(description, '')), plainto_tsquery('french', COALESCE($2, ''))) as description_rank,
            CASE 
              WHEN $3::text IS NOT NULL THEN
                CASE 
                  WHEN isbn::text LIKE $4 THEN 1.0
                  WHEN isbn::text LIKE $5 THEN 0.8
                  WHEN isbn::text LIKE $6 THEN 0.6
                  ELSE 0.4
                END
              ELSE 0
            END as isbn_rank
          FROM livre 
          WHERE 1=1
      `;
      
      const values = [
        criteria.titre || '', 
        criteria.description || '',
        criteria.isbn ? criteria.isbn.replace(/\D/g, '') : null,
        criteria.isbn ? criteria.isbn.replace(/\D/g, '') + '%' : null,
        criteria.isbn ? '%' + criteria.isbn.replace(/\D/g, '') : null,
        criteria.isbn ? '%' + criteria.isbn.replace(/\D/g, '') + '%' : null
      ];
      let paramCount = 7;

      if (criteria.titre || criteria.description) {
        query += ` AND (
          to_tsvector('french', titre) @@ plainto_tsquery('french', $1)
          OR to_tsvector('french', COALESCE(description, '')) @@ plainto_tsquery('french', $2)
        )`;
      }

   
      if (criteria.isbn) {
        const cleanIsbn = criteria.isbn.replace(/\D/g, '');
        query += ` AND (
          isbn::text LIKE $4
          OR isbn::text LIKE $5
          OR isbn::text LIKE $6
        )`;
      }
    
      if (criteria.auteurs) {
        query += ` AND (
          $${paramCount} = ANY(auteurs)
          OR EXISTS (
            SELECT 1 FROM unnest(auteurs) author
            WHERE author ILIKE $${paramCount + 1}
          )
        )`;
        values.push(criteria.auteurs, `%${criteria.auteurs}%`);
        paramCount += 2;
      }

      if (criteria.editeurs) {
        query += ` AND (
          $${paramCount} = ANY(editeurs)
          OR EXISTS (
            SELECT 1 FROM unnest(editeurs) editor
            WHERE editor ILIKE $${paramCount + 1}
          )
        )`;
        values.push(criteria.editeurs, `%${criteria.editeurs}%`);
        paramCount += 2;
      }

      if (criteria.mots_cle) {
        query += ` AND (
          $${paramCount} = ANY(mots_cle)
          OR EXISTS (
            SELECT 1 FROM unnest(mots_cle) keyword
            WHERE keyword ILIKE $${paramCount + 1}
          )
        )`;
        values.push(criteria.mots_cle, `%${criteria.mots_cle}%`);
        paramCount += 2;
      }

      // Format
      if (criteria.format) {
        query += ` AND format = $${paramCount}`;
        values.push(criteria.format);
        paramCount++;
      }

      // Section
      if (criteria.section) {
        query += ` AND section = $${paramCount}`;
        values.push(criteria.section);
        paramCount++;
      }

      if (criteria.categorie) {
        query += ` AND categorie ILIKE $${paramCount}`;
        values.push(`%${criteria.categorie}%`);
        paramCount++;
      }

      if (criteria.langue) {
        query += ` AND langue ILIKE $${paramCount}`;
        values.push(`%${criteria.langue}%`);
        paramCount++;
      }

      if (criteria.date_publication) {
        if (criteria.date_publication.start && criteria.date_publication.end) {
          query += ` AND date_publication BETWEEN $${paramCount} AND $${paramCount + 1}`;
          values.push(criteria.date_publication.start, criteria.date_publication.end);
          paramCount += 2;
        } else {
          query += ` AND date_publication = $${paramCount}`;
          values.push(criteria.date_publication);
          paramCount++;
        }
      }

      if (criteria.nombre_pages) {
        if (criteria.nombre_pages.min && criteria.nombre_pages.max) {
          query += ` AND nombre_pages BETWEEN $${paramCount} AND $${paramCount + 1}`;
          values.push(criteria.nombre_pages.min, criteria.nombre_pages.max);
          paramCount += 2;
        } else {
          query += ` AND nombre_pages = $${paramCount}`;
          values.push(criteria.nombre_pages);
          paramCount++;
        }
      }

      // Catalogueur
      if (criteria.catalogueur_username) {
        query += ` AND catalogueur_username ILIKE $${paramCount}`;
        values.push(`%${criteria.catalogueur_username}%`);
        paramCount++;
      }

      // Date de catalogage (avec intervalle)
      if (criteria.date_catalogage) {
        if (criteria.date_catalogage.start && criteria.date_catalogage.end) {
          query += ` AND date_catalogage BETWEEN $${paramCount} AND $${paramCount + 1}`;
          values.push(criteria.date_catalogage.start, criteria.date_catalogage.end);
          paramCount += 2;
        } else {
          query += ` AND date_catalogage = $${paramCount}`;
          values.push(criteria.date_catalogage);
          paramCount++;
        }
      }

      // Session d'acquisition
      if (criteria.id_session_acquisition) {
        query += ` AND id_session_acquisition = $${paramCount}`;
        values.push(criteria.id_session_acquisition);
        paramCount++;
      }

      // Status d'acquisition
      if (criteria.acquisition_status) {
        query += ` AND acquisition_status ILIKE $${paramCount}`;
        values.push(`%${criteria.acquisition_status}%`);
        paramCount++;
      }

      // Disponibilité
      if (criteria.disponible === 'true') {
        query += ` AND exemplaires_disponibles > 0`;
      } else if (criteria.disponible === 'false') {
        query += ` AND exemplaires_disponibles = 0`;
      }

      // Fermeture de la CTE et tri final
      query += `
        )
        SELECT *, 
          (COALESCE(titre_rank, 0) + COALESCE(description_rank, 0) + COALESCE(isbn_rank, 0)) as relevance_score
        FROM ranked_books
        ORDER BY relevance_score DESC, titre ASC
      `;

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  } ,
  
  async generateUniqueBarcode() {
    const client = await pool.connect();
    try {
      while (true) {
        // code-barres aléatoire à 12 chiffres commençant par "99"
        const barcode = '99' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      
        const checkQuery = 'SELECT COUNT(*) FROM livre WHERE isbn = $1';
        const checkResult = await client.query(checkQuery, [barcode]);
        
        if (checkResult.rows[0].count === '0') {
       
          return barcode;
        }
      
      }
    } finally {
      client.release();
    }
  },

  async getUserInfo(username) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0]; // Retourne les infos de l'utilisateur ou undefined s'il n'existe pas
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },
  async checkIsbnExists(isbn) {
    const client = await pool.connect();
    try {
      const queryText = 'SELECT COUNT(*) FROM livre WHERE isbn = $1';
      const result = await client.query(queryText, [isbn]);
      return result.rows[0].count > 0; // Retourne true si l'ISBN existe déjà
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
};





module.exports = bookService;