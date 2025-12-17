const db = require('../db/db');

const User = {
    // Procura o médico pelo username na tabela Users
    findByUsername: async (username) => {
        const query = 'SELECT id_user, username, password, failed_login_attempts, lockout_until FROM Users WHERE username = $1';
        const result = await db.query(query, [username]);
        return result.rows[0];
    },

    // atualização das tentativas e bloqueios
    updateLockout: async (id_user, attempts, lockoutUntil) => {
        const query = 'UPDATE Users SET failed_login_attempts = $1, lockout_until = $2 WHERE id_user = $3';
        return await db.query(query, [attempts, lockoutUntil, id_user]);
    },

    // Reset quando o login é bem-sucedido
    resetLockout: async (id_user) => {
        const query = 'UPDATE Users SET failed_login_attempts = 0, lockout_until = NULL WHERE id_user = $1';
        return await db.query(query, [id_user]);
    }
};

module.exports = User;