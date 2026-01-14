require('dotenv').config();
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Ler o cabeçalho
    const authHeader = req.headers['authorization'];
    // 2. Separar "Bearer" do token
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Acesso negado: Token não fornecido." });
    }

    try {
        // 3. Verificar validade
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { 
           
            id: decoded.id || decoded.id_user, // Unifica tudo numa propriedade 'id'
            id_user: decoded.id_user,          // Mantém para compatibilidade (médicos)
            is_professional: decoded.is_professional 
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }
};

module.exports = { verifyToken };