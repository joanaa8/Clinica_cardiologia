const pool = require('../config/db');

// Função de pesquisa ajustada
const searchMedications = async (termo) => {
    // Se o termo vier vazio, transforma em '%%' (busca tudo)
    // O LIMIT 20 é essencial para não bloquear o navegador com milhares de resultados
    const searchPattern = `%${termo || ''}%`;
    
    const query = `
        SELECT id, commercial_name, dosage, form_factor, manufacturer 
        FROM projeto.Medication_catalog
        WHERE commercial_name ILIKE $1 
        ORDER BY commercial_name ASC
        LIMIT 20;
    `;
    
    const result = await pool.query(query, [searchPattern]);
    return result.rows;
};


const getMedicationVariations = async (commercialName) => {
    const query = `
        SELECT id, commercial_name, dosage, form_factor 
        FROM Medication_catalog
        WHERE commercial_name ILIKE $1
        ORDER BY form_factor, dosage;
    `;
    // Usa o nome exato para encontrar os "irmãos"
    const result = await pool.query(query, [commercialName]);
    return result.rows;
};

// Função de criação da prescrição (Mantém-se igual, mas envio completa)
const createPrescriptionTransaction = async (data) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Inicia Transação

        // 1. Inserir Cabeçalho da Prescrição
        const insertPrescriptionQuery = `
            INSERT INTO projeto.Prescription 
            (patient_id, doctor_id, prescription_date, notes, status)
            VALUES ($1, $2, CURRENT_DATE, $3, 'active')
            RETURNING id, prescription_number, access_code;
        `;
        
        const resPrescription = await client.query(insertPrescriptionQuery, [
            data.patient_id, 
            data.doctor_account_id, 
            data.notes
        ]);
        const prescriptionId = resPrescription.rows[0].id;

        // 2. Inserir Itens da Prescrição
        const insertItemQuery = `
            INSERT INTO projeto.Prescription_item
            (prescription_id, medication_id, dose, instructions, start_date, end_date, quantity, regularidade)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', $5, 'diaria');
        `;

        for (const item of data.items) {
            await client.query(insertItemQuery, [
                prescriptionId,
                item.medication_id, // Pode ser null se for inserido manualmente sem ID
                item.dose,
                item.instructions,
                item.quantity
            ]);
        }

        await client.query('COMMIT'); // Confirma
        return resPrescription.rows[0];

    } catch (e) {
        await client.query('ROLLBACK'); // Cancela erro
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    searchMedications,
    getMedicationVariations,
    createPrescriptionTransaction
};