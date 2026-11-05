const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

module.exports = router;
