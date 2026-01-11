const pool = require("../config/db");

// Função para obter todas as consultas de um médico com filtros de ordenação
const getAllAppointments = async (doctorId, ordenar = "proximas") => {

    let orderBy = "a.appointment_date ASC";// Definição padrão da ordenação e filtro de status
    let statusFilter = "AND a.status = 'scheduled'"; // Por defeito, apenas agendadas

    // Ajusta filtro e ordenação consoante o parâmetro 'ordenar
    if (ordenar === "passadas") {
        orderBy = "a.appointment_date DESC";
        statusFilter = "AND a.appointment_date < CURRENT_TIMESTAMP";
    } else if (ordenar === "proximas") {
        statusFilter = "AND a.appointment_date >= CURRENT_TIMESTAMP AND a.status = 'scheduled'";
    } else if (ordenar === "canceladas") {
        statusFilter = "AND a.status = 'cancelled'";
    }

    const query = `
        SELECT
            a.id AS appointment_id,
            a.appointment_date,
            a.status,
            p.name AS patient_name
        FROM Appointment a
        JOIN Person p ON a.patient_id = p.id
        JOIN Account acc ON a.doctor_id = acc.id
        WHERE acc.id_user = $1  -- Filtra pelo UUID do médico vindo do token
          AND a.deleted_at IS NULL
          ${statusFilter}       -- Aplica o filtro definido acima
        ORDER BY ${orderBy};    -- Ordena de acordo com o filtro
    `;

    const { rows } = await pool.query(query, [doctorId]);
    return rows;
};

// Função para obter os detalhes de uma consulta específica de um médico
const getAppointmentByIdModel = async (doctorId, appointmentId) => {
    const query = `
        SELECT
            a.id AS appointment_id,
            a.appointment_date,
            a.status,
            p.name AS patient_name,
            p.phone,          -- Dados da tabela Person
            p.health_number   -- Dados da tabela Person
        FROM Appointment a
        JOIN Person p ON a.patient_id = p.id
        JOIN Account acc ON a.doctor_id = acc.id
        WHERE a.id = $1
          AND acc.id_user = $2 -- UUID do médico vindo do token
          AND a.deleted_at IS NULL;
    `;
    const { rows } = await pool.query(query, [appointmentId, doctorId]);
    return rows[0];
};

// Função para atualizar a data de uma consulta específica de um médico
const updateAppointmentModel = async (doctorId, appointmentId, newDate) => {
    const query = `
        UPDATE Appointment
        SET appointment_date = $1,
            updated_at = CURRENT_TIMESTAMP
        FROM Account d
        WHERE Appointment.id = $2
          AND Appointment.doctor_id = d.id
          AND d.id_user = $3
          AND Appointment.deleted_at IS NULL
        RETURNING Appointment.id, Appointment.appointment_date; -- Alterado de appointment_id para id
    `;

    const { rows } = await pool.query(query, [newDate, appointmentId, doctorId]);
    return rows[0];
};

module.exports = {
    getAllAppointments,
    getAppointmentByIdModel,
    updateAppointmentModel
};
