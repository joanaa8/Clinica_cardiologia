const patientModel = require("../models/utentesModels");

//Controller para obter todos os utentes associados ao médico autenticado
const getAllPatientsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patients = await patientModel.getAllPatients(doctorId);
        res.json(patients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar utentes" });
    }
};

// Função para validar se o médico tem acesso ao utente
const validateAccess = async (doctorId, patientId, res) => {
    const allowed = await patientModel.checkPatientAccess(doctorId, patientId);
    if (!allowed) {
        res.status(403).json({ error: "Acesso negado ao utente" });
        return false;
    }
    return true;
};

//Controller para obter os detalhes de um utente específico
const getPatientDetailsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const patient = await patientModel.getPatientDetails(patientId);
        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar dados do utente" });
    }
};

//Controller para obter as alergias de um utente específico
const getPatientAllergiesController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const data = await patientModel.getPatientAllergies(patientId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar alergias" });
    }
};

//Controller para obter os problemas clínicos de um utente específico
const getPatientClinicalProblemsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const data = await patientModel.getPatientClinicalProblems(patientId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar problemas clínicos" });
    }
};

//Controller para obter a medicação de um utente específico
const getPatientMedicationController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const data = await patientModel.getPatientMedication(patientId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar medicação" });
    }
};

//Controller para obter as consultas de um utente específico
const getPatientAppointmentsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const data = await patientModel.getPatientAppointments(patientId, doctorId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar consultas" });
    }
};

//Controller para obter as prescrições de um utente específico
const getPatientPrescriptionsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;

        if (!(await validateAccess(doctorId, patientId, res))) return;

        const data = await patientModel.getPatientPrescriptions(patientId, doctorId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar prescrições" });
    }
};

module.exports = {
    getAllPatientsController,
    getPatientDetailsController,
    getPatientAllergiesController,
    getPatientClinicalProblemsController,
    getPatientMedicationController,
    getPatientAppointmentsController,
    getPatientPrescriptionsController
};
