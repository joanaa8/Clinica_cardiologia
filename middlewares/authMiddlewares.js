const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {

    const token = req.headers['authorization'];//obter token do header
    
    if (!token) return res.status(403).json({ error: "Token não fornecido." });

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);//validação
        req.userId = decoded.id;//guardar id
        next();

    } catch (err) { //tratamento de erros

        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }
};

module.exports = { verifyToken };