require('dotenv').config();
const express = require('express');
const path = require("path");
const cors = require('cors');
const pool = require('./db/db');
const app = express();

// 1. Importar as Rotas de Autenticação
const authRoutes = require('./routes/auth.routes');

const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(express.json()); // Essencial para ler o body do fetch (username/password)
app.use(cors());

// --- Servir Ficheiros Estáticos (Frontend) ---
// Isto permite que o browser aceda ao index.html, css/ e js/ dentro de 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- Rotas da API ---
// Liga os ficheiros de rotas que criámos. O prefixo será /api/auth
app.use('/api/auth', authRoutes);

// --- Rota de Teste da Base de Dados ---
const pool = require('./db/db'); // Certifique-se que o caminho está correto para o seu ficheiro de conexão 
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database()");
        res.send("Ligado à base de dados: " + result.rows[0].current_database);
    } catch (err) {
        res.status(500).send("Erro ao ligar à BD: " + err.message);
    }
});

// --- Rota Padrão (Redireciona para o Login se não encontrar nada) ---
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(` Servidor da Clínica Machado Lemos em http://localhost:${port}`);
});