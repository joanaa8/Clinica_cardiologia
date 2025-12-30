const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middlewares/authMiddlewares');

router.get('/', authMiddleware, prescriptionController.getMyPrescriptions);

module.exports = router;