const db = require('../config/db');

const Prescription = {
    getAllByDoctorId: async (doctorId) => {
        try {
            const query = `
                SELECT 
                    p.id AS prescription_id,
                    pi.id AS item_id,
                    pe.name AS patient_name,
                    mc.commercial_name AS medication_name,
                    pi.start_date,
                    pi.end_date,
                    p.status
                FROM Prescription p
                JOIN Person pe ON p.patient_id = pe.id
                JOIN Prescription_item pi ON pi.prescription_id = p.id
                JOIN Medication_catalog mc ON pi.medication_id = mc.id
                WHERE p.doctor_id = $1
                ORDER BY p.created_at DESC
            `;
            
            const result = await db.query(query, [doctorId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Prescription;