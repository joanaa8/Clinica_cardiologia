require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  schema: 'public',
});

// Verificação de conexão imediata
(async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão bem-sucedida ao PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Erro ao conectar ao PostgreSQL:', err.message);
    process.exit(1);
  }
})();

// Tratamento de erros
pool.on('error', (err) => {
  console.error('Erro inesperado no cliente do pool:', err);
});


module.exports = pool;