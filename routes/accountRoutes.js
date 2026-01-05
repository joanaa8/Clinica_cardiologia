const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddlewares');

router.get('/me', authMiddleware, accountController.getMe);

module.exports = router;