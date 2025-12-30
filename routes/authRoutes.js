const express = require('express');
const router = express.Router();
const { login, requestPasswordReset, resetPassword } = require("../controllers/authController.js");

router.post('/login', login);
router.post('/recuperar', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);



       
module.exports = router;