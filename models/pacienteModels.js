const db = require("../config/db"); 

// Obter o perfil
const getMyProfile = async (personId) => {
    const query = `
        SELECT p.name, p.date_of_birth, p.health_number, p.sex, p.blood_type, p.weight_kg, p.height_cm, p.email, p.phone as telefone, p.emergency_contact
        FROM projeto.Person p
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows[0];
};
// Obter Alergias
const getMyAllergys = async (personId) => {
    const query = `
        SELECT al.allergy, al.gravity
        FROM projeto.Allergies al
        JOIN projeto.Person p ON al.person_id = p.id
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};

// Obter Problemas
const getMyClinicalProblem = async (personId) => {
    const query = `
        SELECT cp.description, cp.cid_code, cp.snomed_ct, cp.problem_type, cp.status
        FROM projeto.Clinical_Problem cp
        JOIN projeto.Person p ON cp.person_id = p.id
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};
// Obter Consultas
const getMyAppointments = async (personId) => {
    const query = `
        SELECT a.id, a.appointment_date, ac.name as nome_medico, a.status
        FROM projeto.Appointment a
        JOIN projeto.Account ac ON a.doctor_id = ac.id       
        JOIN projeto.Person p ON a.patient_id = p.id        
        WHERE p.id = $1                                   
        ORDER BY a.appointment_date DESC
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};
// Obter Prescrições
const getMyPrescriptions = async (personId) => {
    const query = `
        SELECT pr.id, pr.patient_id, pr.doctor_id, pr.status, pr.prescription_date, pr.notes, pr.justificacao
        FROM projeto.Prescription pr
        JOIN projeto.Account m ON pr.doctor_id = m.id
        JOIN projeto.Person p ON pr.patient_id = p.id
        WHERE p.id = $1
        ORDER BY pr.prescription_date DESC
    `;
    // CORREÇÃO: Mudei de db.execute para db.query para ser consistente
    const result = await db.query(query, [personId]); 
    return result.rows;
};

module.exports = {
    getMyProfile,
    getMyAllergys,
    getMyClinicalProblem,
    getMyAppointments,
    getMyPrescriptions
};