require('dotenv').config();
const { Pool } = require('pg');

console.log("=== DIAGNÓSTICO DA CONEXÃO ===");
console.log("Base de dados alvo:", process.env.DB_NAME);
console.log("Porta:", process.env.DB_PORT || 5432);
console.log("Host:", process.env.DB_HOST || 'localhost');
console.log("===============================");

const pool = new Pool({

  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

});

pool.on("connect", () => {

  console.log("Connection pool established with Database");

});

module.exports = {
  query: (text, params) => pool.query(text, params),
};