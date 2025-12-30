const AccountModel = require('../models/accountModels');

exports.getMe = async (req, res) => {
    try {
        // O ID vem do middleware de autenticação (req.user.id)
        const userId = req.user.id || req.user.id_user; // caso o nome do campo varie
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