const express = require('express');
const router = express.Router();
const { signup, login, getCurrentUser, getAllUsers, resetPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.get('/users', authenticateToken, getAllUsers);
router.post('/reset-password', resetPassword);

module.exports = router;
