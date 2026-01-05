const db = require('../config/db.js');

const Account = {
    getById: async (id) => {
        try {
            // Vai buscar o nome e a licença à tabela Account
            const query = 'SELECT name, email, professional_license FROM Account WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Account;