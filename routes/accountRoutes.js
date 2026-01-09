const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const { verifyToken } = require('../middlewares/authMiddlewares'); 


router.get('/me', verifyToken, accountController.getMe);

module.exports = router;
