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
    // === ESTA LINHA RESOLVE O PROBLEMA ===
    // Define o schema ANTES da ligação ficar pronta.
    // Assim funciona logo à primeira, tanto para ti (projeto) como para eles (public)
    options: '-c search_path=projeto,public' 
});

pool.on('error', (err, client) => {
    console.error('Erro inesperado no cliente PostgreSQL', err);
    process.exit(-1);
});

module.exports = pool;