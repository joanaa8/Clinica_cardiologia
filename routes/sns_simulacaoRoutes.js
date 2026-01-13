const express = require('express');
const router = express.Router();
const prescriptionSNSController = require("../controllers/sns_simulacaoControllers");

//a rota  para listar as prescirçoes
router.get('/receitas/:patientId', prescriptionSNSController.list );


module.exports = router; 