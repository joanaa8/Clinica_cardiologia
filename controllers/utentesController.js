const patientModel = require("../models/utentesModels");

// Validação auxiliar de acesso
const validateAccess = async (doctorId, patientId, res) => {
    const allowed = await patientModel.checkPatientAccess(doctorId, patientId);
    if (!allowed) {
        res.status(403).json({ error: "Acesso negado ao utente" });
        return false;
    }
    return true;
};

// 1. Listar Utentes
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

// 2. Detalhes do Utente
const getPatientDetailsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;
        if (!(await validateAccess(doctorId, patientId, res))) return;
        const patient = await patientModel.getPatientDetails(patientId);
        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar detalhes" });
    }
};

// 3. Alergias
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

// 4. Problemas Clínicos
const getPatientClinicalProblemsController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;
        if (!(await validateAccess(doctorId, patientId, res))) return;
        const data = await patientModel.getPatientClinicalProblems(patientId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar problemas" });
    }
};

// 5. Medicação
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

// 6. Consultas
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

// 7. Prescrições
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

// 8. ADICIONAR HISTÓRICO (POST)
const addMedicationToHistoryController = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;
        const { medication_name, notes, start_date, end_date } = req.body;

        if (!(await validateAccess(doctorId, patientId, res))) return;
        if (!medication_name) return res.status(400).json({ error: "Nome obrigatório" });

        // Chama a função do MODEL
        const result = await patientModel.addMedicationHistory(patientId, medication_name, notes, start_date, end_date);
        
        res.status(201).json({ 
            success: true, 
            message: "Histórico adicionado.", 
            data: result.rows ? result.rows[0] : null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao adicionar histórico" });
    }
};

// 9. LER HISTÓRICO (GET)
const getMedicationHistory = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const patientId = req.params.id;
        if (!(await validateAccess(doctorId, patientId, res))) return;
        
        // Chama a função do MODEL
        const result = await patientModel.getMedicationHistory(patientId);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao ler histórico" });
    }
};

// --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
// Todas as funções têm de estar dentro deste objeto
module.exports = {
    getAllPatientsController,
    getPatientDetailsController,
    getPatientAllergiesController,
    getPatientClinicalProblemsController,
    getPatientMedicationController,
    getPatientAppointmentsController,
    getPatientPrescriptionsController,
    addMedicationToHistoryController,
    getMedicationHistory
};