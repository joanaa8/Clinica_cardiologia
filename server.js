require('dotenv').config();
const express = require('express');
const path = require('path');

// Importar as rotas
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes'); // Rota correta
const appointmentRoutes = require('./routes/appointmentRoutes');
const utentesRoutes = require('./routes/utentesRoutes');

const { verifyToken } = require('./middlewares/authMiddlewares');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas Públicas
app.use('/api/auth', authRoutes);

// Rotas Protegidas (Adiciona verifyToken quando o login estiver pronto)
// Para testar agora, podes remover o verifyToken temporariamente se o frontend não enviar token
app.use('/api/account', verifyToken, accountRoutes);
app.use('/api/prescricoes', prescriptionRoutes); // Usa a rota criada no passo 2
app.use('/api', verifyToken, appointmentRoutes); 
app.use('/api/utentes', verifyToken, utentesRoutes);

app.use((err, req, res, next) => {
    console.error('Erro Servidor:', err.stack);
    res.status(500).json({ status: 500, message: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Link: http://localhost:${PORT}/`);
});