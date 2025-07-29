const express = require('express');
const router = express.Router();
const seckillController = require('../controllers/seckillController');
const { authenticateToken } = require('../middleware/auth');

// 秒殺購買 - 需要登錄
router.post('/purchase', authenticateToken, seckillController.purchase);

module.exports = router; 