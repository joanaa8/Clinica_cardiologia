const pool = require("../config/db");
const { get } = require("../routes/prescriptionRoutes");

// Verificar se existe acesso ao utente
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

// Verifica e retorna todos os utentes associados ao médico
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

// Obtém detalhes pessoais de um utente (ADICIONEI weight_kg E height_cm)
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
            email,
            weight_kg,  -- Adicionado
            height_cm   -- Adicionado
        FROM Person
        WHERE id = $1
          AND deleted_at IS NULL;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows[0];
};

// Obtém as alergias de um utente
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

// Obtém os problemas clínicos de um utente
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

// Obtém o histórico medicamentoso de um utente
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

// Obtém as consultas de um utente
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

// Obtém as prescrições de um utente
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



const addHistoryEntry = async (patientId, name, endDate, notes) => {
    const query = `
        INSERT INTO Patient_Medication_History
        (person_id, medication_name, start_date, end_date, status, source, notes)
        VALUES ($1, $2, CURRENT_DATE, $3, 'active', 'manual', $4)
    `;
    await pool.query(query, [patientId, name, endDate, notes]);
};

const addMedicationHistory = async (id, medication_name, notes, start_date, end_date) => {
    const query = `
        INSERT INTO projeto.Patient_Medication_History 
        (person_id, medication_name, notes, start_date, end_date, status, source) 
        VALUES ($1, $2, $3, $4, $5, 'ativo', 'externo') 
        RETURNING *
    `;
    const values = [id, medication_name, notes, start_date || null, end_date || null];
    
   
    return await pool.query(query, values); 
};

// Se a função de leitura também tiver 'db', muda também:
const getMedicationHistory = async (id) => {
    const query = `
        SELECT * FROM projeto.Patient_Medication_History 
        WHERE person_id = $1 
        ORDER BY start_date DESC
    `;
  
    return await pool.query(query, [id]); 
};

module.exports = {
    checkPatientAccess,
    getAllPatients,
    getPatientDetails,
    getPatientAllergies,
    getPatientClinicalProblems,
    getPatientMedication,
    getPatientAppointments,
    getPatientPrescriptions,
    addHistoryEntry,
    addMedicationHistory,
    getMedicationHistory
};