const pool = require('../config/db.js');

const findByUsername = async (username) => {
    const query = `
        SELECT u.id_user, u.password, u.lockout_until, u.failed_login_attempts,
               a.professional_license
        FROM Users u
        LEFT JOIN account a ON u.id_user = a.id_user
        WHERE u.username = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows[0];
};

//aplicação do RN2
const increaseAttempts= async (id_user) => {
    const query = `
        UPDATE Users SET failed_login_attempts = failed_login_attempts + 1, 
        lockout_until = CASE 
        WHEN failed_login_attempts +1 >= 3 THEN NOW() + INTERVAL \'5 minutes\' 
        ELSE lockout_until END WHERE id_user = $1
    `;
    await pool.query(query, [id_user]);
};

const resetAttempts = async (id_user) => {
    const query = `
        UPDATE Users SET failed_login_attempts = 0, 
        lockout_until = NULL 
        WHERE id_user = $1
    `;
    await pool.query(query, [id_user]);
};

const setResetToken = async (id_user, token, expires) => {
    const query = `
    UPDATE Users SET reset_token = $1, 
    reset_token_expires = $2 
    WHERE id_user = $3
    `;
    await pool.query(query, [token, expires, id_user]);
};

const updatePassword = async (id_user, hash) => {
    const query = `
        UPDATE Users SET password = $1, 
        reset_token = NULL, 
        reset_token_expires = NULL 
        WHERE id_user = $2 
    `;
    await pool.query(query, [hash, id_user]);
};

const findByEmail = async (email) => {
    const query = `
        SELECT u.id_user
        FROM Users u
        JOIN Account a ON a.id_user = u.id_user
        WHERE a.email = $1
    `;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
};


const findByResetToken = async (token) => {
    const query = `
        SELECT id_user, reset_token_expires 
        FROM Users 
        WHERE reset_token = $1
    `;
    const { rows } = await pool.query(query, [token]);
    return rows[0];
};

module.exports = {
    findByUsername,
    increaseAttempts,
    resetAttempts,
    setResetToken,
    updatePassword,
    findByEmail,
    findByResetToken,
};

