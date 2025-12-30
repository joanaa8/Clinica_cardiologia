const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.Controller');
const authMiddleware = require('../middlewares/authMiddlewares');

router.get('/me', authMiddleware, accountController.getMe);

module.exports = router;