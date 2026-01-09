const AccountModel = require('../models/accountModels');

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

module.exports = { getMe };
