const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 公開路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要認證的路由
router.get('/profile', authenticateToken, authController.getUserInfo);
router.put('/profile', authenticateToken, authController.updateUserInfo);
router.put('/password', authenticateToken, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

// 管理員路由（用於測試）
router.post('/create-test-users', authController.createTestUsers);

module.exports = router; 