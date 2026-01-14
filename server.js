require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const connection = require('./config/db'); 
const JWT_SECRET = process.env.JWT_SECRET || 'a_tua_chave_secreta'; 
const { verifyToken } = require('./middlewares/authMiddlewares');

// --- IMPORTAR ROTAS ---
// Rotas da Clínica
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const utentesRoutes = require('./routes/utentesRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');

// Rotas do SNS
const authsnsRoutes = require('./routes/authsnsRoutes.js');
const sns_simulacaoRoutes = require('./routes/sns_simulacaoRoutes.js');

// ============================================================
// SERVIDOR 1: PORTAL DA CLÍNICA (Porta 3000)
// ============================================================
const appClinica = express();

appClinica.use(express.json());
appClinica.use(express.urlencoded({ extended: true }));
// Serve os ficheiros estáticos (HTML, CSS, JS)
appClinica.use(express.static(path.join(__dirname, 'public')));

// --- Rotas da Clínica ---
appClinica.use('/api/auth', authRoutes);
appClinica.use('/api/account', verifyToken, accountRoutes);
appClinica.use('/api/prescricoes', prescriptionRoutes);
appClinica.use('/api', verifyToken, appointmentRoutes); 
appClinica.use('/api/utentes', verifyToken, utentesRoutes);
appClinica.use('/api/paciente', verifyToken, pacienteRoutes);

// Rota de LOGIN UNIFICADO (Mantido na Clínica)
appClinica.post('/api/auth/login', async (req, res) => {
    const { login_id, secret } = req.body; 
    try {
        // 1. TENTATIVA MÉDICO
        const queryMedico = `
            SELECT u.id_user, u.password, ac.name 
            FROM projeto.User u
            LEFT JOIN projeto.Account ac ON u.id_user = ac.id
            WHERE u.username = $1
        `;
        // Nota: Usei connection.query para garantir compatibilidade com Postgres padrão
        const resMedico = await connection.query(queryMedico, [login_id]); 
        
        if (resMedico.rows.length > 0) {
            const medico = resMedico.rows[0];
            if (medico.password === secret) { 
                const token = jwt.sign({ id: medico.id_user, role: 'medico' }, JWT_SECRET, { expiresIn: '4h' });
                return res.json({ token, is_professional: true, role: 'medico', name: medico.name });
            }
        }
        // 2. TENTATIVA PACIENTE
        const queryPaciente = `SELECT id, name FROM projeto.Person p WHERE health_number = $1 AND phone = $2`;
        const resPaciente = await connection.query(queryPaciente, [login_id, secret]);

        if (resPaciente.rows.length > 0) {
            const paciente = resPaciente.rows[0];
            const token = jwt.sign({ id: paciente.id, role: 'paciente' }, JWT_SECRET, { expiresIn: '4h' });
            return res.json({ token, is_professional: false, role: 'paciente', name: paciente.name });
        }
        return res.status(401).json({ message: "Dados de login incorretos." });
    } catch (error) {
        console.error("Erro no login unificado:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// Tratamento de erros Clínica
appClinica.use((err, req, res, next) => {
    console.error('Erro Servidor Clínica:', err.stack);
    res.status(500).json({ status: 500, message: 'Erro interno no servidor Clínica' });
});


// ============================================================
// SERVIDOR 2: SIMULADOR SNS (Porta 4000)
// ============================================================
const appSNS = express();

appSNS.use(express.json());
appSNS.use(express.urlencoded({ extended: true }));
// Também serve os ficheiros estáticos (para aceder ao sns_entrada.html)
appSNS.use(express.static(path.join(__dirname, 'public')));

// --- Rotas do SNS ---
appSNS.use('/api/sns', authsnsRoutes);
appSNS.use('/api/simulacao', sns_simulacaoRoutes); 

// Tratamento de erros SNS
appSNS.use((err, req, res, next) => {
    console.error('Erro Servidor SNS:', err.stack);
    res.status(500).json({ status: 500, message: 'Erro interno no servidor SNS' });
});


// ============================================================
// INICIAR OS DOIS SERVIDORES
// ============================================================

const PORT_CLINICA = 3000;
const PORT_SNS = 4000;

appClinica.listen(PORT_CLINICA, () => {
    console.log('----------------------------------------------------');
    console.log(`🏥 PORTAL CLÍNICA a correr na porta ${PORT_CLINICA}`);
    console.log(`👉 Link: http://localhost:${PORT_CLINICA}`);
    console.log('----------------------------------------------------');
});

appSNS.listen(PORT_SNS, () => {
    console.log(`💊 SIMULADOR SNS a correr na porta ${PORT_SNS}`);
    console.log(`👉 Link: http://localhost:${PORT_SNS}/sns_entrada.html`);
    console.log('----------------------------------------------------');
});