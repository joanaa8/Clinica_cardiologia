const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ error: "Token não fornecido." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { 
            id_user: decoded.id_user,       // UUID da tabela Users
            is_professional: decoded.is_professional 
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }
};

module.exports = { verifyToken };

