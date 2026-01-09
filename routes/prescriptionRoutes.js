const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');


const { verifyToken } = require('../middlewares/authMiddlewares');


router.get('/', verifyToken, prescriptionController.getMyPrescriptions);

module.exports = router;