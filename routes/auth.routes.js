const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rota POST para o login
router.post('/login', authController.login);

module.exports = router;