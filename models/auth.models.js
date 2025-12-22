const db = require('../config/db.js');

const getUserByUsernameService = async (username) => {
  const query = `
    SELECT u.*, a.name as real_name 
    FROM Users u 
    LEFT JOIN Account a ON u.id_user = a.id_user 
    WHERE u.username = $1`;
  
  // O SEGUNDO ARGUMENTO DEVE SER UM ARRAY [username]
  const result = await db.query(query, [username]);
  return result.rows[0];
};

module.exports = {
  getUserByUsernameService
};