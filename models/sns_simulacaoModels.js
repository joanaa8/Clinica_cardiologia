const pool = require('../config/db.js');

const PrescriptionSNSById = {
    
    GetPatientInfomation : async  ( health_number, phone) => {
        const query =  // quero ir buscar os dados do utente que esta a entrar 
        `Select
         id, name, health_number, phone 
         From Person 
         WHERE health_number = $1 AND phone = $2;`;
        
        const { rows } = await pool.query(query, [health_number, phone]);
        return rows[0];

    },
    // para ligar aos dados das prescriçoes 
    GetPrescriptionsSNS : async ( patientId) => {
        const query = 
        `SELECT 
         p.prescription_number, p.status, p.prescription_date,
         mc.commercial_name,  mc.dosage,
         pi.instructions,
         acc.name as doctor_name
             FROM Prescription p
             JOIN Prescription_item pi ON p.id = pi.prescription_id
             JOIN Medication_catalog mc ON pi.medication_id = mc.id
             JOIN Account acc ON p.doctor_id = acc.id
             WHERE p.patient_id = $1
             ORDER BY p.prescription_date DESC;`; 

    try{
         const { rows } = await pool.query(query,  [patientId]);
         return rows; // Retorna todas as prescriçoes 
    } catch (err) {
         console.error("Erro na base de dados:", err);
         throw err;
    }   
    
    }
};

module.exports = PrescriptionSNSById;