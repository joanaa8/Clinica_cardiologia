const AccountModel = require('../models/accountModels');

const getMe = async (req, res) => {
    try {
        // Garantimos que usamos o ID que vem do Token
        const userId = req.user.id_user; 
        const medico = await AccountModel.getById(userId);

        if (!medico) {
            return res.status(404).json({ message: "Perfil de médico não encontrado." });
        }

        res.json(medico);
    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ message: "Erro interno." });
    }
};


module.exports = { 
    getMe 
};
