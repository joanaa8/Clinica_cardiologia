const PrescriptionModel = require('../models/prescriptionModels');

const getMyPrescriptions = async (req, res) => {
    try {
        // Garantir que usamos o ID que vem do Token (id ou id_user)
        const doctorId = req.user.id || req.user.id_user;
        const prescricoes = await PrescriptionModel.getAllByDoctorId(doctorId);

        res.json(prescricoes);
    } catch (error) {
        console.error("Erro ao buscar prescrições:", error);
        res.status(500).json({ message: "Erro ao carregar prescrições." });
    }
};


module.exports = { 
    getMyPrescriptions 
};