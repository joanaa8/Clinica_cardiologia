const express = require("express");
const router = express.Router();

const {
    getAllPatientsController,
    getPatientDetailsController,
    getPatientAllergiesController,
    getPatientClinicalProblemsController,
    getPatientMedicationController,
    getPatientAppointmentsController,
    getPatientPrescriptionsController
} = require("../controllers/utentesController");

const { verifyToken } = require("../middlewares/authMiddlewares");


router.get("/", verifyToken, getAllPatientsController);
router.get("/:id", verifyToken, getPatientDetailsController);
router.get("/:id/alergies", verifyToken, getPatientAllergiesController);
router.get("/:id/problemas", verifyToken, getPatientClinicalProblemsController);
router.get("/:id/medicacao", verifyToken, getPatientMedicationController);
router.get("/:id/consultas", verifyToken, getPatientAppointmentsController);
router.get("/:id/prescricoes", verifyToken, getPatientPrescriptionsController);
module.exports = router;
