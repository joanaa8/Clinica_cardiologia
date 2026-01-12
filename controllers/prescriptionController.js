const db = require('../config/db');

// --- FUNÇÕES AUXILIARES (Gerar Códigos) ---
function gerarNumeroReceita() {
    // Gera 13 dígitos aleatórios (simulação)
    return Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0');
}

function gerarCodigoAcesso() {
    // Gera 4 dígitos aleatórios
    return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// 1. Pesquisa de Medicamentos (Autocomplete)
exports.searchMeds = async (req, res) => {
    const termo = req.query.term ? `%${req.query.term}%` : '%';
    try {
        const query = `
            SELECT id, commercial_name, dosage, form_factor 
            FROM projeto.Medication_catalog 
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

// 2. Buscar Variações por Nome Exato
exports.getVariations = async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json([]);

    try {
        const query = `
            SELECT id, commercial_name, dosage, form_factor 
            FROM projeto.Medication_catalog 
            WHERE commercial_name = $1 
            ORDER BY form_factor, dosage
        `;
        const { rows } = await db.query(query, [name]);
        res.json(rows);
    } catch (error) {
        console.error('Erro Variações:', error);
        res.status(500).json({ message: "Erro ao buscar variações." });
    }
};

// 3. Criar Prescrição (CORRIGIDO)
exports.createPrescription = async (req, res) => {
    // Recebe justificacao do frontend
    const { patient_id, items, notes, justificacao } = req.body;
    
    const authUserId = req.user.id_user; 

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Sem itens na prescrição." });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Obter ID do médico
        const queryDoctor = `SELECT id FROM projeto.Account WHERE id_user = $1`;
        const resDoctor = await client.query(queryDoctor, [authUserId]);

        if (resDoctor.rows.length === 0) {
            throw new Error("Perfil de médico não encontrado para este utilizador.");
        }
        const doctor_id = resDoctor.rows[0].id; 
        
        // --- CORREÇÃO DO ERRO ---
        // Temos de gerar os números aqui antes de usar na Query
        const novoNumeroReceita = gerarNumeroReceita();
        const novoCodigoAcesso = gerarCodigoAcesso();
        // ------------------------

        // 2. Inserir Cabeçalho (Com Justificação e Códigos Gerados)
        const queryHeader = `
            INSERT INTO projeto.Prescription 
            (patient_id, doctor_id, prescription_date, notes, status, prescription_number, access_code, justificacao) 
            VALUES ($1, $2, NOW(), $3, 'active', $4, $5, $6) 
            RETURNING id, prescription_number, access_code
        `;
        
        const resHeader = await client.query(queryHeader, [
            patient_id, 
            doctor_id, 
            notes, 
            novoNumeroReceita,  // $4
            novoCodigoAcesso,   // $5
            justificacao || null // $6 (Pode ser null se não houver conflito)
        ]);

        const { id: prescricaoId, prescription_number, access_code } = resHeader.rows[0];

        // 3. Inserir Itens
        const queryItem = `
            INSERT INTO projeto.Prescription_item 
            (prescription_id, medication_id, dose, instructions, quantity, start_date, end_date, regularidade, form_factor) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        for (const item of items) {
            await client.query(queryItem, [
                prescricaoId,
                item.medication_id || null, 
                item.dose,
                item.instructions,
                item.quantity,
                item.start_date,
                item.end_date,
                item.regularidade,
                item.forma
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: "Criado com sucesso",
            data: { prescription_number, access_code }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro Prescrição:", error);
        
        if (error.message.includes("Perfil de médico")) {
            return res.status(403).json({ message: error.message });
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
        const query = `
            SELECT id, name, health_number 
            FROM projeto.Person 
            WHERE name ILIKE $1 OR health_number ILIKE $1 
            LIMIT 5
        `;
        const { rows } = await db.query(query, [termo]);
        res.json(rows);
    } catch (error) {
        console.error('Erro Search Patients:', error);
        res.status(500).json({ message: "Erro ao pesquisar utentes." });
    }
};

// 5. Obter Utente por ID
exports.getPatientById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT id, name, health_number FROM projeto.Person WHERE id = $1`;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Utente não encontrado" });
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro Get Patient:', error);
        res.status(500).json({ message: "Erro ao buscar utente." });
    }
};

// 6. Listar Prescrições do Médico Logado (Atualizado com nomes dos medicamentos)
exports.getMyPrescriptions = async (req, res) => {
    const authUserId = req.user.id_user; 

    try {
        const client = await db.connect();
        const queryDoctor = `SELECT id FROM projeto.Account WHERE id_user = $1`;
        const resDoctor = await client.query(queryDoctor, [authUserId]);
        
        if (resDoctor.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: "Médico não encontrado." });
        }
        const doctorId = resDoctor.rows[0].id;

        const queryList = `
            SELECT 
                p.id, 
                p.prescription_number, 
                TO_CHAR(p.prescription_date, 'DD/MM/YYYY') as data_formatada,
                p.status, 
                per.name as nome_paciente,
                p.access_code,
                STRING_AGG(mc.commercial_name, ', ') as lista_medicamentos
            FROM projeto.Prescription p
            JOIN projeto.Person per ON p.patient_id = per.id
            LEFT JOIN projeto.Prescription_item pi ON p.id = pi.prescription_id
            LEFT JOIN projeto.Medication_catalog mc ON pi.medication_id = mc.id
            WHERE p.doctor_id = $1
            GROUP BY p.id, per.name, p.prescription_date, p.status, p.prescription_number, p.access_code
            ORDER BY p.created_at DESC
        `;
        
        const { rows } = await client.query(queryList, [doctorId]);
        client.release();
        
        res.json(rows);
    } catch (error) {
        console.error('Erro Listar:', error);
        res.status(500).json({ message: "Erro ao listar prescrições." });
    }
};

// 7. Obter Detalhes Completos
exports.getPrescriptionDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const queryHeader = `
            SELECT p.*, per.name as nome_paciente, per.health_number 
            FROM projeto.Prescription p
            JOIN projeto.Person per ON p.patient_id = per.id
            WHERE p.id = $1
        `;
        const headerRes = await db.query(queryHeader, [id]);
        
        if (headerRes.rows.length === 0) return res.status(404).json({ message: "Não encontrada" });

        const queryItems = `
            SELECT pi.*, mc.commercial_name 
            FROM projeto.Prescription_item pi
            LEFT JOIN projeto.Medication_catalog mc ON pi.medication_id = mc.id
            WHERE pi.prescription_id = $1
        `;
        const itemsRes = await db.query(queryItems, [id]);

        res.json({ header: headerRes.rows[0], items: itemsRes.rows });
    } catch (error) {
        console.error("Erro Detalhes:", error);
        res.status(500).json({ message: "Erro ao obter detalhes" });
    }
};

// 8. Anular Prescrição (Com Justificativa)
exports.cancelPrescription = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: "É obrigatório indicar uma justificativa para anular." });
    }

    try {
        const query = `
            UPDATE projeto.Prescription 
            SET status = 'cancelled', justificacao = $2
            WHERE id = $1 
            RETURNING id, status
        `;
        const result = await db.query(query, [id, reason]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Prescrição não encontrada" });

        res.json({ message: "Prescrição anulada com sucesso.", status: 'cancelled' });
    } catch (error) {
        console.error("Erro Anular:", error);
        res.status(500).json({ message: "Erro ao anular prescrição." });
    }
};

// 9. Verificar Interações (SAD)
exports.checkInteractions = async (req, res) => {
    const { patient_id, new_meds_ids } = req.body;

    if (!new_meds_ids || new_meds_ids.length === 0) {
        return res.json([]);
    }

    try {
        const client = await db.connect();

        // 1. Medicamentos Ativos do Paciente
        const queryActive = `
            SELECT pi.medication_id
            FROM projeto.Prescription p
            JOIN projeto.Prescription_item pi ON p.id = pi.prescription_id
            WHERE p.patient_id = $1 
              AND p.status = 'active'
              AND pi.end_date >= CURRENT_DATE
        `;
        const resActive = await client.query(queryActive, [patient_id]);
        const activeMedsIds = resActive.rows.map(r => r.medication_id);

        // 2. Juntar tudo (Novos + Antigos)
        const allMedsToCheck = [...new Set([...activeMedsIds, ...new_meds_ids])].filter(id => id);

        if (allMedsToCheck.length < 2) {
            client.release();
            return res.json([]);
        }

        // 3. Verificar Regras
        const queryInteractions = `
            WITH MedsIngredients AS (
                SELECT c.id_medication, c.id_active_ingredient, m.commercial_name
                FROM projeto.Composition c
                JOIN projeto.Medication_catalog m ON c.id_medication = m.id
                WHERE c.id_medication = ANY($1::int[])
            )
            SELECT DISTINCT
                r.severity,
                r.message,
                m1.commercial_name as medicamento_1,
                m2.commercial_name as medicamento_2
            FROM projeto.Interaction_component ic
            JOIN projeto.Interaction_Rule r ON ic.rule_id = r.id
            JOIN MedsIngredients m1 ON m1.id_active_ingredient = ic.pa_id_1
            JOIN MedsIngredients m2 ON m2.id_active_ingredient = ic.pa_id_2
            WHERE m1.id_medication != m2.id_medication
        `;

        const { rows } = await client.query(queryInteractions, [allMedsToCheck]);
        client.release();

        res.json(rows);

    } catch (error) {
        console.error("Erro Check Interactions:", error);
        res.status(500).json({ message: "Erro ao verificar interações." });
    }
};