const pool = require("../config/db");

//verificar se existe acesso ao utente
const checkPatientAccess = async (doctorId, patientId) => {
    const query = `
        SELECT 1
        FROM Appointment a
        JOIN Account acc ON a.doctor_id = acc.id
        WHERE acc.id_user = $1
          AND a.patient_id = $2
        LIMIT 1;
    `;
    const result = await pool.query(query, [doctorId, patientId]);
    return result.rowCount > 0;
};

// verifica e retorna todos os utentes associados ao médico
const getAllPatients = async (doctorId) => {
    const query = `
        SELECT DISTINCT
            p.id,
            p.name,
            p.date_of_birth,
            p.sex,
            p.blood_type,
            p.health_number
        FROM Person p
        JOIN Appointment a ON a.patient_id = p.id
        JOIN Account acc ON a.doctor_id = acc.id
        WHERE acc.id_user = $1
          AND p.deleted_at IS NULL
        ORDER BY p.name;
    `;
    const { rows } = await pool.query(query, [doctorId]);
    return rows;
};

//obtem detalhes pessoais de um utente
const getPatientDetails = async (patientId) => {
    const query = `
        SELECT
            id,
            name,
            date_of_birth,
            sex,
            blood_type,
            emergency_contact,
            health_number,
            phone,
            email
        FROM Person
        WHERE id = $1
          AND deleted_at IS NULL;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows[0];
};

//ontem as alergias de um utente
const getPatientAllergies = async (patientId) => {
    const query = `
        SELECT
            allergy,
            gravity
        FROM Allergies
        WHERE person_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows;
};

//obtem os problemas clinicos de um utente
const getPatientClinicalProblems = async (patientId) => {
    const query = `
        SELECT
            description,
            problem_type,
            cid_code,
            snomed_ct,
            status
        FROM Clinical_Problem
        WHERE person_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows;
};

//obtem o historico medicamentoso de um utente
const getPatientMedication = async (patientId) => {
    const query = `
        SELECT
            medication_name,
            start_date,
            end_date,
            status,
            source,
            notes
        FROM Patient_Medication_History
        WHERE person_id = $1
        ORDER BY start_date DESC;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows;
};

//obtem as consultas de um utente
const getPatientAppointments = async (patientId, doctorId) => {
    const query = `
        SELECT
            a.id,
            a.appointment_date,
            a.status
        FROM Appointment a
        JOIN Account acc ON a.doctor_id = acc.id
        WHERE a.patient_id = $1
          AND acc.id_user = $2
        ORDER BY a.appointment_date DESC;
    `;
    const { rows } = await pool.query(query, [patientId, doctorId]);
    return rows;
};

//obtem as prescrições de um utente
const getPatientPrescriptions = async (patientId, doctorId) => {
    const query = `
        SELECT
            p.id,
            p.prescription_date,
            p.status,
            p.notes,
            acc.name AS doctor_name
        FROM Prescription p
        JOIN Account acc ON p.doctor_id = acc.id
        WHERE p.patient_id = $1
          AND acc.id_user = $2
        ORDER BY p.prescription_date DESC;
    `;
    const { rows } = await pool.query(query, [patientId, doctorId]);
    return rows;
};

module.exports = {
    checkPatientAccess,
    getAllPatients,
    getPatientDetails,
    getPatientAllergies,
    getPatientClinicalProblems,
    getPatientMedication,
    getPatientAppointments,
    getPatientPrescriptions
};
