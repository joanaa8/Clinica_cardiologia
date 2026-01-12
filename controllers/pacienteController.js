const portalModel = require('../models/pacienteModels');
// 1. Perfil Completo (Dados Pessoais + Alergias + Problemas)
const getMe = async (req, res) => {
    try {
        const userId = req.user.id_user; 

        console.log("A buscar dados para o utilizador ID:", userId);

        const [perfil, alergias, problemas] = await Promise.all([
            portalModel.getMyProfile(userId),
            portalModel.getMyAllergys(userId),
            portalModel.getMyClinicalProblem(userId)
        ]);


        // Junta tudo num único objeto bonito para o Frontend
        const resposta = {
            ...perfil,          // Espalha nome, email, data nascimento...
            alergias: alergias, // Adiciona a lista de alergias
            problemas: problemas // Adiciona a lista de problemas
        };

        res.json(resposta);

    } catch (error) {
        console.error("Erro ao buscar perfil do paciente:", error);
        res.status(500).json({ message: "Erro interno ao carregar perfil." });
    }
};

// 2. Obter as Minhas Consultas
const getMyConsultas = async (req, res) => {
    try {
        const userId = req.user.id_user;
        const consultas = await portalModel.getMyAppointments(userId);
        
        // Se não tiver consultas, retorna array vazio 
        res.json(consultas || []);

    } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        res.status(500).json({ message: "Erro ao carregar consultas." });
    }
};

// 3. Obter as Minhas Prescrições
const getMyPrescricoes = async (req, res) => {
    try {
        const userId = req.user.id_user;
        const prescricoes = await portalModel.getMyPrescriptions(userId);
        
        res.json(prescricoes || []);

    } catch (error) {
        console.error("Erro ao buscar prescrições:", error);
        res.status(500).json({ message: "Erro ao carregar prescrições." });
    }
};

module.exports = {
    getMe,
    getMyConsultas,
    getMyPrescricoes
};