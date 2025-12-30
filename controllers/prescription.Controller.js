const PrescriptionModel = require('../models/prescription.model');

exports.getMyPrescriptions = async (req, res) => {
    try {
        // O ID do médico (req.user)
        const doctorId = req.user.id || req.user.id_user;
        const prescricoes = await PrescriptionModel.getAllByDoctorId(doctorId);

        res.json(prescricoes);
    } catch (error) {
        console.error("Erro ao buscar prescrições:", error);
        res.status(500).json({ message: "Erro ao carregar prescrições." });
    }
};