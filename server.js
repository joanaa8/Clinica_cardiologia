require('dotenv').config(); 

const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes')
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();


app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Frontend
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/prescricoes', prescriptionRoutes);


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use((err, req, res, next) => {
    console.error(' Ocorreu um erro no Servidor:', err.stack);
    res.status(500).json({ status: 500, message: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor da Clínica a correr na porta ${PORT}`);
    console.log(`Link: http://localhost:${PORT}`);
});