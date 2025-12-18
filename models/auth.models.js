const db = require('../config/db.js');
const User = {
    // 1. Procurar o médico através do username
    getUserByUsername: async (username) => {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1', 
            [username]
        );
        return result.rows[0];
    },

    // 2. Atualização das tentativas e bloqueios
    updateUserLoginAttempts: async (id_user, attempts, lockoutUntil) => {
        const result = await db.query(
            'UPDATE users SET failed_attempts = $1, lockout_until = $2 WHERE id_user = $3 RETURNING *',
            [attempts, lockoutUntil, id_user]
        );
        return result.rows[0];
    },

    // 3. Reset quando o login é bem-sucedido
    resetLoginAttempts: async (id_user) => {
        const result = await db.query(
            'UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id_user = $1 RETURNING *',
            [id_user]
        );
        return result.rows[0];
    }
};

module.exports = User;