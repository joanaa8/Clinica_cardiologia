const db = require('../config/db.js');

const Account = {
    getByUserId: async (id_user) => {
        try {
            const query = `
                SELECT name, email, professional_license
                FROM Account
                WHERE id_user = $1
            `;
            const result = await db.query(query, [id_user]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Account;
