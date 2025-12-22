const express = require('express');
const router = express.Router();
// Importa o objeto exportado pelo controller
const { login, resetPassword } = require('../controllers/auth.controller.js');
// Assegura-te que os nomes login e resetPassword existem no controller
router.post('/login', login);
router.post('/reset-password', resetPassword);

module.exports = router;