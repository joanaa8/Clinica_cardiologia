const { PrescriptionSNSById } = require ('../models/sns_simulacaoModels.js');

const PrescriptionSNSController = {
    // Devolve a lista de prescrições  do utente que entrou no portal
    list: async (req, res) => {
        try {
            const { patientId } = req.params;
            const prescriptions = await PrescriptionSNSById.GetPrescriptionsSNS(patientId);
            res.status(200).json(prescriptions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = PrescriptionSNSController ;
