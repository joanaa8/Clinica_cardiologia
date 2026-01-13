const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const cdssController = require('../controllers/cdssController');
// Importar o middleware com o nome correto (plural)
const { verifyToken } = require('../middlewares/authMiddlewares'); 

// Rota de pesquisa (pode ser pública ou privada, deixei pública por enquanto)
router.get('/search-meds', prescriptionController.searchMeds);
router.get('/variations', prescriptionController.getVariations);
router.get('/search-patients', prescriptionController.searchPatients);
router.get('/patient/:id', prescriptionController.getPatientById);
router.get('/my-prescriptions', verifyToken, prescriptionController.getMyPrescriptions);
router.get('/:id/details', verifyToken, prescriptionController.getPrescriptionDetails);
router.put('/:id/cancel', verifyToken, prescriptionController.cancelPrescription);
router.post('/check-interactions', verifyToken, prescriptionController.checkInteractions);

// Rota de criar prescrição (PROTEGIDA pelo verifyToken)
router.post('/', verifyToken, prescriptionController.createPrescription);

module.exports = router;