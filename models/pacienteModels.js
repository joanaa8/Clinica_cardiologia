
const { connection } = require("../config/db"); // A tua conexão SQL
// Obter o perfil do próprio paciente
const getMyProfile = async (userId) => {
    // Supomos que tens uma tabela 'person'(paciente) ligada à 'user'
    const query = `
        SELECT p.name, p.date_of_birth, p.health_number, p.sex, p.blood_type, p.weight_kg, p.height_cm, p.email, p.telefone, p.emergency_contact
        FROM projeto.Person p
        WHERE p.id_user = ?
    `;
    const [rows] = await connection.execute(query, [userId]);
    return rows[0];
};
// 2. Buscar Alergias
const getMyAllergys = async (userId) => {
    const query = `
        SELECT al.allergy,  al.gravity
        FROM projeto.Allergys al
        JOIN projeto.Person p ON al.person_id = p.id
        WHERE p.id_user = ?
    `;
    const [rows] = await connection.execute(query, [userId]);
    return rows;
};

const getMyClinicalProblem = async (userId) => {
    const query = `
        SELECT cp.description, cp.cid_code, cp.snomed_ct, cp.problem_type, cp.status
        FROM projeto.Clinical_Problem cp
        JOIN projeto.Person p ON cp.person_id = p.id
        WHERE p.id_user = ?
    `;
    const [rows] = await connection.execute(query, [userId]);
    return rows;
};

// Obter as MINHAS consultas
const getMyAppointments = async (userId) => {
    const query = `
    SELECT a.id, a.apointment_date, ac.name as nome_medico, a.status
FROM projeto."Appointment" a
JOIN projeto."Account" m ON a.doctor_id = m.id       
JOIN projeto."Person" p ON a.patient_id = p.id         -- Correção: Tabela Person e coluna patient_id
WHERE p.id_user = ?                                   
ORDER BY a.apointment_date DESC
    `;
    const [rows] = await connection.execute(query, [userId]);
    return rows;
};

// Obter as MINHAS prescrições
const getMyPrescriptions = async (userId) => {
    const query = `
        SELECT pr.id, pr.patient_id, pr.doctor_id, pr.status, pr.prescription_date, pr.notes, pr.justificacao
        FROM projeto.Prescription pr
        JOIN projeto.Account m ON pr.doctor_id = m.id
        JOIN projeto.Person p ON pr.patient_id = p.id
        WHERE p.id_user = ?
        ORDER BY pr.prescription_date DESC
    `;
    const [rows] = await connection.execute(query, [userId]);
    return rows;
};

module.exports = {
    getMyProfile,
    getMyAllergys,
    getMyClinicalProblem,
    getMyAppointments,
    getMyPrescriptions
};