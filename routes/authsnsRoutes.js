const express = require('express');
const router = express.Router();
const authsnsController = require("../controllers/authsnsController");

//
router.post('/loginSNS', authsnsController.loginSNS);


module.exports = router; 