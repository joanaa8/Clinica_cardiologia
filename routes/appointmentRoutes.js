const express = require('express');
const router = express.Router();

const { getAppointment, getAppointmentById, updateAppointment, getStats, getCalendarEvents } = require("../controllers/appointmentController.js");
router.get('/consultas/estatisticas', getStats);
router.get('/consultas/eventos', getCalendarEvents);


router.get('/consultas', getAppointment);
router.get('/consultas/:id', getAppointmentById);
router.put('/consultas/:id', updateAppointment);



       
module.exports = router;