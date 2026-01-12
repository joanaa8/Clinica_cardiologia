require('dotenv').config();
const express = require('express');
const path = require('path');

//importar rotas
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes'); // Rota correta
const appointmentRoutes = require('./routes/appointmentRoutes');
const utentesRoutes = require('./routes/utentesRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const authsnsRoutes =require('./routes/authsnsRoutes.js');
const jwt = require('jsonwebtoken'); 
const connection = require('./config/db'); 
const JWT_SECRET = process.env.JWT_SECRET || 'a_tua_chave_secreta'; 


const { verifyToken } = require('./middlewares/authMiddlewares');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Autenticação (SEM token)
app.use('/api/sns', authsnsRoutes);
app.use('/api/auth', authRoutes);



// Rotas protegidas
app.use('/api/account', verifyToken, accountRoutes);
app.use('/api/prescricoes', prescriptionRoutes); // Usa a rota criada no passo 2
app.use('/api', verifyToken, appointmentRoutes); 
app.use('/api/utentes', verifyToken, utentesRoutes);
app.use('/api/paciente', verifyToken, pacienteRoutes);


app.use((err, req, res, next) => {
    console.error('Erro Servidor:', err.stack);
    res.status(500).json({ status: 500, message: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor da Clínica a correr na porta ${PORT}`);
    console.log(`Link: http://localhost:${PORT}`);
});

// Rota de LOGIN UNIFICADO
app.post('/api/auth/login', async (req, res) => {

    const { login_id, secret } = req.body; 

    try {
        // 1. TENTATIVA MÉDICO (Verifica na tabela Users/Account)
        const queryMedico = `
            SELECT u.id_user, u.password, ac.name 
            FROM projeto.User u
            LEFT JOIN projeto.Account ac ON u.id_user = ac.id
            WHERE u.username = $1
        `;
        const resMedico = await connection.execute(queryMedico, [login_id]);
        
        if (resMedico.rows.length > 0) {
            const medico = resMedico.rows[0];
            if (medico.password === secret) { 
                // É UM MÉDICO!
                const token = jwt.sign({ id: medico.id_user, role: 'medico' }, JWT_SECRET, { expiresIn: '4h' });
                
                return res.json({
                    token: token,
                    is_professional: true, 
                    role: 'medico',
                    name: medico.name
                });
            }
        }
        // 2. TENTATIVA PACIENTE (Se não for médico, verifica Person)
        const queryPaciente = `
            SELECT id, name 
            FROM projeto.Person p
            WHERE health_number = $1 AND phone = $2
        `;
        const resPaciente = await connection.execute(queryPaciente, [login_id, secret]);

        if (resPaciente.rows.length > 0) {
            const paciente = resPaciente.rows[0];
            const token = jwt.sign({ id: paciente.id, role: 'paciente' }, JWT_SECRET, { expiresIn: '4h' });
            return res.json({
                token: token,
                is_professional: false, 
                role: 'paciente',
                name: paciente.name
            });
        }
        // 3. SE FALHAR OS DOIS
        return res.status(401).json({ message: "Dados de login incorretos." });

    } catch (error) {
        console.error("Erro no login unificado:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});