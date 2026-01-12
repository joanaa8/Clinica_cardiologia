require('dotenv').config();

const express = require('express');
const path = require('path');

//importar rotas
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const utentesRoutes = require('./routes/utentesRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const authsnsRoutes =require('./routes/authsnsRoutes.js');
const sns_simulacaoRoutes = require('./routes/sns_simulacaoRoutes.js');



const { verifyToken } = require('./middlewares/authMiddlewares');

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Autenticação (SEM token)
app.use('/api/sns', authsnsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/simulacao', sns_simulacaoRoutes); 


// Rotas protegidas
app.use('/api/account', verifyToken, accountRoutes);
app.use('/api/prescricoes', verifyToken, prescriptionRoutes);
app.use('/api', verifyToken, appointmentRoutes); 
app.use('/api/utentes', verifyToken, utentesRoutes);
app.use('/api/paciente', verifyToken, pacienteRoutes);



app.use((err, req, res, next) => {
    console.error('Ocorreu um erro no Servidor:', err.stack);
    res.status(500).json({
        status: 500,
        message: 'Erro interno no servidor'
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor da Clínica a correr na porta ${PORT}`);
    console.log(`Link: http://localhost:${PORT}`);
});
