const {
    getAllAppointments,
    getAppointmentByIdModel,
    updateAppointmentModel,
    getStatsModel,
    getCalendarEventsModel
} = require('../models/appointmentModels.js');

//Controller para obter todas as consultas de um médico com filtros de ordenação(próximas, passadas, canceladas)
const getAppointment = async (req, res) => {
    try {
        const doctorId = req.user.id_user; 
        const { ordenar } = req.query;

        const consultas = await getAllAppointments(doctorId, ordenar);
        res.json(consultas);

    } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        res.status(500).json({ message: "Erro ao carregar consultas." });
    }
};

//Controller para obter os detalhes de uma consulta específica de um médico
const getAppointmentById = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const { id } = req.params;

        const consulta = await getAppointmentByIdModel(doctorId, id);

        if (!consulta) {
            return res.status(404).json({ message: "Consulta não encontrada." });
        }

        res.json(consulta);

    } catch (error) {
        console.error("Erro ao buscar consulta:", error);
        res.status(500).json({ message: "Erro ao carregar consulta." });
    }
};

//Controller para atualizar a data de uma consulta específica de um médico
const updateAppointment = async (req, res) => {
    try {
        const doctorId = req.user.id_user;
        const { id } = req.params;
        const { data } = req.body;

        const consultaAtualizada = await updateAppointmentModel(doctorId, id, data);

        if (!consultaAtualizada) {
            return res.status(404).json({
                message: "Consulta não encontrada ou não autorizada."
            });
        }

        res.json({
            success: true,
            message: "Consulta reagendada com sucesso",
            consulta: consultaAtualizada
        });

    } catch (error) {
        console.error("Erro ao atualizar consulta:", error);
        res.status(500).json({ message: "Erro ao atualizar consulta." });
    }
};

//Controller para obter estatísticas de consultas de um médico
const getStats = async (req, res) => {
    try {
        console.log("Utilizador no Token:", req.user); // Vê se o req.user existe!
        const stats = await getStatsModel(req.user.id_user); 
        res.json(stats);
    } catch (error) {
        console.error("ERRO REAL NO TERMINAL:", error.message); // Isto vai dizer o que falhou no SQL
        res.status(500).json({ message: "Erro ao carregar consulta." });
    }
};

//Controller para obter eventos do calendário de um médico
const getCalendarEvents = async (req, res) => {
    try {
        const doctorId = req.user.id_user; // UUID vindo do token
        const eventos = await getCalendarEventsModel(doctorId);
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao carregar eventos do calendário" });
    }
};

module.exports = {
    getAppointment,
    getAppointmentById,
    updateAppointment,
    getStats,
    getCalendarEvents
};
