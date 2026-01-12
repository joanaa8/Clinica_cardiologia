const express = require('express');
const router = express.Router();

const portalController = require('../controllers/pacienteController');

const { verifyToken } = require('../middlewares/authMiddlewares');

router.get('/perfil', verifyToken, portalController.getMe);
router.get('/consultas', verifyToken, portalController.getMyConsultas);
router.get('/prescricoes', verifyToken, portalController.getMyPrescricoes);

module.exports = router;