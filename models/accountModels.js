const pool = require('../config/db');

// Busca a conta do profissional baseada no ID de utilizador (Login)
const getByUserId = async (userId) => {
    const query = `
        SELECT id, name, professional_license 
        FROM Account 
        WHERE id_user = $1 AND deleted_at IS NULL;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

module.exports = { getByUserId };