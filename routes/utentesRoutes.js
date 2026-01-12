const express = require("express");
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddlewares');

// Importa o controlador (PLURAL)
const controller = require("../controllers/utentesController");

// --- DEBUG ---
// Se aparecer "undefined" no terminal, é porque o ficheiro controller está vazio ou mal nomeado
console.log("A carregar Controller de Utentes:", controller); 

// ROTAS (Usamos controller.NomeDaFuncao)
router.get("/", verifyToken, controller.getAllPatientsController);
router.get("/:id", verifyToken, controller.getPatientDetailsController);
router.get("/:id/alergies", verifyToken, controller.getPatientAllergiesController);
router.get("/:id/problemas", verifyToken, controller.getPatientClinicalProblemsController);
router.get("/:id/consultas", verifyToken, controller.getPatientAppointmentsController);
router.get("/:id/prescricoes", verifyToken, controller.getPatientPrescriptionsController);

// ROTAS DE HISTÓRICO
router.get("/:id/medicacao", verifyToken, controller.getMedicationHistory);
router.post("/:id/medicacao", verifyToken, controller.addMedicationToHistoryController);

module.exports = router;