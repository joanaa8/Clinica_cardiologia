const AccountModel = require('../models/accountModels');
const jwt = require('jsonwebtoken');

// --- 1. FUNÇÃO DE LOGIN (Que faltava!) ---
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(`Tentativa de login com o nome de utilizador: ${username}`);
        
        // 1. Buscar utilizador pelo username (Usando o Model)
        const user = await AccountModel.getByUsername(username);

        if (!user) {
            console.log("Utilizador não encontrado");
            return res.status(401).json({ message: "Utilizador não encontrado" });
        }

        console.log("Utilizador encontrado:", user.username);
        console.log("Verificar password...");

        // 2. Verificar Password
        // NOTA: Se usares bcrypt, muda para: await bcrypt.compare(password, user.password)
        // Aqui assumo texto simples conforme os teus exemplos anteriores
        if (password !== user.password) {
            console.log("Password invalida");
            return res.status(401).json({ message: "Password incorreta" });
        }

        console.log("Password valida: true");

        // 3. Gerar Token
        // O payload inclui id_user para o getMe funcionar depois
        const token = jwt.sign(
            { 
                id_user: user.id_user, // Importante para o getMe
                id_account: user.id,
                username: user.username,
                role: user.role,
                is_professional: true // Flag útil para o frontend
            },
            process.env.ACCESS_TOKEN_SECRET || 'a_tua_chave_secreta_aqui',
            { expiresIn: '24h' }
        );

        // 4. Retornar sucesso
        res.json({
            message: "Login efetuado com sucesso",
            token: token,
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro interno no login." });
    }
};

// --- 2. O TEU GETME (Mantido igual) ---
const getMe = async (req, res) => {
    try {
        const userId = req.user.id_user; // UUID do token
        console.log('REQ.USER:', req.user);

        const medico = await AccountModel.getByUserId(userId);

        if (!medico) {
            return res.status(404).json({
                message: "Perfil de médico não encontrado."
            });
        }

        res.json(medico);

    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ message: "Erro interno." });
    }
};

// --- 3. EXPORTAR AS DUAS FUNÇÕES ---
module.exports = { getMe, login };
