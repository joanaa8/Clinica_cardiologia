const portalModel = require('../models/pacienteModels');
// 1. Perfil Completo (Dados Pessoais + Alergias + Problemas)
const getMe = async (req, res) => {
    try {
        // CORREÇÃO: O token tem 'id', não 'id_user' (porque o login é na tabela Person)
        const userId = req.user.id; 

        console.log("A buscar dados para o paciente ID:", userId);

        const [perfil, alergias, problemas] = await Promise.all([
            portalModel.getMyProfile(userId),
            portalModel.getMyAllergys(userId),
            portalModel.getMyClinicalProblem(userId)
        ]);

        if (!perfil) {
             return res.status(404).json({ message: "Paciente não encontrado." });
        }

        const resposta = {
            ...perfil,          
            alergias: alergias, 
            problemas: problemas 
        };

        res.json(resposta);

    } catch (error) {
        console.error("Erro ao buscar perfil do paciente:", error);
        res.status(500).json({ message: "Erro interno ao carregar perfil." });
    }
};
    // 2. Consultas
const getMyConsultas = async (req, res) => {
    try {
            // CORREÇÃO: req.user.id
        const userId = req.user.id;
        const consultas = await portalModel.getMyAppointments(userId);
            res.json(consultas || []);

     } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        res.status(500).json({ message: "Erro ao carregar consultas." });
    }
};

// 3. Prescrições
const getMyPrescricoes = async (req, res) => {
    try {
        // CORREÇÃO: req.user.id
        const userId = req.user.id;
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