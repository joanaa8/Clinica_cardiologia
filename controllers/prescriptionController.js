const db = require('../config/db');

// --- FUNÇÕES AUXILIARES ---
function gerarNumeroReceita() {
    return Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0');
}

function gerarCodigoAcesso() {
    return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// 1. Pesquisa de Medicamentos
exports.searchMeds = async (req, res) => {
    const termo = req.query.term ? `%${req.query.term}%` : '%';
    try {
        const query = `
            SELECT id, commercial_name, dosage, form_factor 
            FROM Medication_catalog 
            WHERE commercial_name ILIKE $1 
            LIMIT 10
        `;
        const { rows } = await db.query(query, [termo]);
        res.json(rows);
    } catch (error) {
        console.error('Erro Search:', error);
        res.status(500).json({ message: "Erro ao pesquisar." });
    }
};

// 2. Buscar Variações
exports.getVariations = async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json([]);

    try {
        // ILIKE para ignorar maiúsculas/minúsculas
        const query = `
            SELECT id, commercial_name, dosage, form_factor 
            FROM Medication_catalog 
            WHERE commercial_name ILIKE $1 
            ORDER BY form_factor, dosage
        `;
        const { rows } = await db.query(query, [name]);
        res.json(rows);
    } catch (error) {
        console.error('Erro Variações:', error);
        res.status(500).json({ message: "Erro ao buscar variações." });
    }
};

// --- 3. CRIAR PRESCRIÇÃO (AQUI ESTAVA O ERRO) ---
exports.createPrescription = async (req, res) => {
    const { patient_id, items, notes, justificacao } = req.body;
    
    let authUserId = null;
    if (req.user) authUserId = req.user.id_user || req.user.id; 

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Sem itens na prescrição." });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Obter ID do médico
        const queryDoctor = `SELECT id FROM Account WHERE id_user = $1`;
        const resDoctor = await client.query(queryDoctor, [authUserId]);

        if (resDoctor.rows.length === 0) throw new Error("Perfil de médico não encontrado.");
        const doctor_id = resDoctor.rows[0].id; 
        
        const novoNumeroReceita = gerarNumeroReceita();
        const novoCodigoAcesso = gerarCodigoAcesso();

        // 2. Inserir Cabeçalho (Status 'active' para tabela Prescription)
        const queryHeader = `
            INSERT INTO Prescription 
            (patient_id, doctor_id, prescription_date, notes, status, prescription_number, access_code, justificacao) 
            VALUES ($1, $2, NOW(), $3, 'active', $4, $5, $6) 
            RETURNING id, prescription_number, access_code
        `;
        
        const resHeader = await client.query(queryHeader, [
            patient_id, 
            doctor_id, 
            notes, 
            novoNumeroReceita,
            novoCodigoAcesso,
            justificacao || null
        ]);

        const { id: prescricaoId, prescription_number, access_code } = resHeader.rows[0];

        // 3. Preparar Item (REMOVI O form_factor DAQUI PARA NÃO DAR ERRO)
        const queryItem = `
            INSERT INTO Prescription_item 
            (prescription_id, medication_id, dose, instructions, quantity, start_date, end_date, regularidade) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        // 4. Preparar Histórico (Status 'ativo' para tabela Histórico)
        const queryHistory = `
            INSERT INTO Patient_Medication_History
            (person_id, medication_name, start_date, end_date, status, source, notes)
            VALUES ($1, $2, CURRENT_DATE, $3, 'ativo', 'prescrito', $4)
        `;

        for (const item of items) {
            // Inserir Item
            await client.query(queryItem, [
                prescricaoId,
                item.medication_id || null, 
                item.dose,
                item.instructions,
                item.quantity,
                item.start_date || new Date(),
                item.end_date,
                item.regularidade
                // Nota: O form_factor foi removido daqui pois a coluna não existe na BD
            ]);

            // Inserir Histórico
            await client.query(queryHistory, [
                patient_id,
                item.nome_medicamento || "Medicamento ID " + item.medication_id, 
                item.end_date, 
                `Receita nº ${novoNumeroReceita}. ${item.instructions || ''}`
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: "Prescrição criada com sucesso",
            data: { prescription_number, access_code }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro Prescrição:", error);
        
        // Tratamento de erros específicos para te ajudar
        if (error.code === '42703') { // Undefined Column
            return res.status(500).json({ message: "Erro DB: Coluna inexistente (Verifique form_factor)." });
        }
        if (error.code === '22P02') { // Invalid Enum
            return res.status(500).json({ message: "Erro DB: Status inválido (Enum)." });
        }

        res.status(500).json({ message: "Erro ao processar prescrição." });
    } finally {
        client.release();
    }
};

// 4. Pesquisar Utentes
exports.searchPatients = async (req, res) => {
    const termo = req.query.term ? `%${req.query.term}%` : '%';
    try {
        const query = `SELECT id, name, health_number FROM Person WHERE name ILIKE $1 OR health_number ILIKE $1 LIMIT 5`;
        const { rows } = await db.query(query, [termo]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Erro ao pesquisar utentes." }); }
};

// 5. Obter Utente por ID
exports.getPatientById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT id, name, health_number FROM Person WHERE id = $1`;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Utente não encontrado" });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar utente." }); }
};


// 6. Listar Prescrições (CORRIGIDO COM DATA_FIM)
exports.getMyPrescriptions = async (req, res) => {
    let authUserId = null;
    if (req.user) authUserId = req.user.id_user || req.user.id;

    try {
        const client = await db.connect();
        
        // 1. Obter ID do Médico
        const queryDoctor = `SELECT id FROM Account WHERE id_user = $1`;
        const resDoctor = await client.query(queryDoctor, [authUserId]);
        
        if (resDoctor.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: "Médico não encontrado." });
        }
        const doctorId = resDoctor.rows[0].id;

        // 2. Query Principal (ALTERADA)
        const queryList = `
            SELECT 
                p.id, 
                p.prescription_number, 
                TO_CHAR(p.prescription_date, 'DD/MM/YYYY') as data_formatada,
                p.status, 
                per.name as nome_paciente, 
                p.patient_id, 
                p.access_code,
                STRING_AGG(mc.commercial_name, ', ') as lista_medicamentos,
                -- ADICIONADO: Pega a maior data de fim entre os itens desta receita
                MAX(pi.end_date) as data_fim
            FROM Prescription p
            JOIN Person per ON p.patient_id = per.id
            LEFT JOIN Prescription_item pi ON p.id = pi.prescription_id
            LEFT JOIN Medication_catalog mc ON pi.medication_id = mc.id
            WHERE p.doctor_id = $1
            GROUP BY p.id, per.name, p.patient_id, p.prescription_date, p.status, p.prescription_number, p.access_code
            ORDER BY p.prescription_date DESC
        `;
        
        const { rows } = await client.query(queryList, [doctorId]);
        client.release();
        res.json(rows);

    } catch (error) { 
        console.error("Erro ao listar prescrições:", error);
        res.status(500).json({ message: "Erro ao listar." }); 
    }
};

// 7. Detalhes
exports.getPrescriptionDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const queryHeader = `
            SELECT p.*, per.name as nome_paciente, per.health_number 
            FROM Prescription p
            JOIN Person per ON p.patient_id = per.id
            WHERE p.id = $1
        `;
        const headerRes = await db.query(queryHeader, [id]);
        if (headerRes.rows.length === 0) return res.status(404).json({ message: "Não encontrada" });

        const queryItems = `
            SELECT pi.*, mc.commercial_name, mc.form_factor, mc.dosage
            FROM Prescription_item pi
            LEFT JOIN Medication_catalog mc ON pi.medication_id = mc.id
            WHERE pi.prescription_id = $1
        `;
        const itemsRes = await db.query(queryItems, [id]);

        res.json({ header: headerRes.rows[0], items: itemsRes.rows });
    } catch (error) { res.status(500).json({ message: "Erro detalhes." }); }
};

// 8. Anular
exports.cancelPrescription = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const query = `UPDATE Prescription SET status = 'cancelled', justificacao = $2 WHERE id = $1 RETURNING id`;
        const result = await db.query(query, [id, reason]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Não encontrada" });
        res.json({ message: "Anulada.", status: 'cancelled' });
    } catch (error) { res.status(500).json({ message: "Erro ao anular." }); }
};


// 9. Verificar Interações (CORRIGIDO: Apenas status 'active')
exports.checkInteractions = async (req, res) => {
    const { patient_id, new_meds_ids } = req.body;

    // Se não houver medicamentos novos, retorna vazio
    if (!new_meds_ids || new_meds_ids.length === 0) return res.json([]);

    try {
        const client = await db.connect();

        // 1. Buscar medicamentos ATIVOS no histórico do paciente
        // CORREÇÃO: Removemos "OR status = 'ativo'". O Postgres não aceita valores fora do ENUM.
        const queryAtivo = `
            SELECT pi.medication_id 
            FROM Prescription p
            JOIN Prescription_item pi ON p.id = pi.prescription_id
            WHERE p.patient_id = $1 
              AND p.status = 'active' 
              AND pi.end_date >= CURRENT_DATE
        `;
        
        const resAtivo = await client.query(queryAtivo, [patient_id]);
        const idsJaAtivos = resAtivo.rows.map(r => r.medication_id);

        console.log(`[DEBUG] Utente ${patient_id} - Meds Ativos (BD):`, idsJaAtivos);
        console.log(`[DEBUG] Novos a prescrever:`, new_meds_ids);

        // 2. Juntar e Converter para Inteiros
        const todosMeds = [...new Set([...idsJaAtivos, ...new_meds_ids])]
            .map(id => parseInt(id))
            .filter(id => !isNaN(id));

        if (todosMeds.length < 2) {
            console.log("[DEBUG] Menos de 2 medicamentos. Sem risco.");
            client.release();
            return res.json([]);
        }

        // 3. Query de Interações
        const queryInteractions = `
            WITH MedsIngredients AS (
                SELECT c.id_medication, c.id_active_ingredient, m.commercial_name
                FROM Composition c
                JOIN Medication_catalog m ON c.id_medication = m.id
                WHERE c.id_medication = ANY($1::int[])
            )
            SELECT DISTINCT 
                r.severity, 
                r.message, 
                m1.commercial_name as medicamento_1, 
                m2.commercial_name as medicamento_2
            FROM Interaction_component ic
            JOIN Interaction_Rule r ON ic.rule_id = r.id
            JOIN MedsIngredients m1 ON m1.id_active_ingredient = ic.pa_id_1
            JOIN MedsIngredients m2 ON m2.id_active_ingredient = ic.pa_id_2
            WHERE m1.id_medication != m2.id_medication
        `;

        const { rows } = await client.query(queryInteractions, [todosMeds]);
        client.release();
        
        console.log(`[DEBUG] Interações encontradas: ${rows.length}`);
        
        res.json(rows);

    } catch (error) {
        console.error("ERRO CRÍTICO SQL:", error);
        
        // Retorna erro 500 mas com JSON para não deixar o frontend pendurado
        res.status(500).json({ 
            message: "Erro técnico na verificação.",
            details: error.message 
        });
    }
};