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
<<<<<<< HEAD
        req.user = { 
           
            id: decoded.id || decoded.id_user, // Unifica tudo numa propriedade 'id'
            id_user: decoded.id_user,          // Mantém para compatibilidade (médicos)
            is_professional: decoded.is_professional 
        };
=======
        
        // 4. Guardar dados do user no pedido
        req.user = decoded; 
>>>>>>> 1aea2ded88c401e3ecb1a179cc21aea85a85eba0
        next();
    } catch (err) {
        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }
};

module.exports = { verifyToken };