const db = require("../config/db"); 

// Obter o perfil
const getMyProfile = async (personId) => {
    const query = `
        SELECT p.name, p.date_of_birth, p.health_number, p.sex, p.blood_type, p.weight_kg, p.height_cm, p.email, p.phone as telefone, p.emergency_contact
        FROM Person p
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows[0];
};
// Obter Alergias
const getMyAllergys = async (personId) => {
    const query = `
        SELECT al.allergy, al.gravity
        FROM Allergies al
        JOIN Person p ON al.person_id = p.id
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};

// Obter Problemas
const getMyClinicalProblem = async (personId) => {
    const query = `
        SELECT cp.description, cp.cid_code, cp.snomed_ct, cp.problem_type, cp.status
        FROM Clinical_Problem cp
        JOIN Person p ON cp.person_id = p.id
        WHERE p.id = $1
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};
// Obter Consultas
const getMyAppointments = async (personId) => {
    const query = `
        SELECT a.id, a.appointment_date, ac.name as nome_medico, a.status
        FROM Appointment a
        JOIN Account ac ON a.doctor_id = ac.id       
        JOIN Person p ON a.patient_id = p.id        
        WHERE p.id = $1                                   
        ORDER BY a.appointment_date DESC
    `;
    const result = await db.query(query, [personId]);
    return result.rows;
};
// Obter Prescrições
const getMyPrescriptions = async (personId) => {
    const query = `
        SELECT 
            pr.id, 
            pr.status, 
            pr.prescription_date, 
            pr.notes,
            
            -- ESTA LINHA É A QUE FALTAVA PARA O NOME DO MÉDICO:
            acc.name as doctor_name, 

            -- Dados do Medicamento e Item
            mc.commercial_name as medication_name, 
            mc.dosage,
            mc.form_factor,
            pi.end_date,
            pi.quantity,
            pi.instructions
            
        FROM Prescription pr
        JOIN Account acc ON pr.doctor_id = acc.id  -- Liga à tabela de contas (Médicos)
        JOIN Prescription_item pi ON pr.id = pi.prescription_id
        JOIN Medication_catalog mc ON pi.medication_id = mc.id
        WHERE pr.patient_id = $1
        ORDER BY pr.prescription_date DESC
    `;
    
    try {
        const result = await db.query(query, [personId]); 
        return result.rows;
    } catch (err) {
        console.error("Erro ao buscar prescrições:", err);
        return [];
    }
};

const findPatientByHealthNumber = async (healthNumber) => {
    // 1. Log para ver o que estamos a procurar (Ajuda a ver se há espaços em branco)
    console.log(`[MODEL] A procurar paciente na BD com Health Number: '${healthNumber}'`);

    // 2. CORREÇÃO: Adicionei 'projeto.' antes de Person
    const query = `SELECT * FROM Person WHERE health_number = $1`;
    
    try {
        const result = await db.query(query, [healthNumber]);
        
        // 3. Log para ver o que a BD respondeu
        console.log(`[MODEL] Resultado encontrado:`, result.rows.length > 0 ? 'Sim' : 'Zero');
        
        return result.rows[0];
    } catch (error) {
        console.error("[MODEL] Erro ao procurar paciente:", error);
        throw error;
    }
};
module.exports = {
    getMyProfile,
    getMyAllergys,
    getMyClinicalProblem,
    getMyAppointments,
    getMyPrescriptions,
    findPatientByHealthNumber
};