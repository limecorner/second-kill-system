const { verifyToken, extractTokenFromHeader } = require('../config/jwt');
const { query } = require('../config/database');

// JWT 認證中間件
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // 驗證 Token
    const decoded = verifyToken(token);

    // 檢查用戶是否存在且狀態正常
    const users = await query(
      'SELECT id, username, email, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'active']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用戶不存在或已被禁用' });
    }

    // 將用戶信息添加到請求對象
    req.user = users[0];
    next();

  } catch (error) {
    console.error('認證錯誤:', error.message);
    return res.status(401).json({ error: '認證失敗' });
  }
}

// 可選認證中間件（不強制要求登錄）
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    const users = await query(
      'SELECT id, username, email, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'active']
    );

    req.user = users.length > 0 ? users[0] : null;
    next();

  } catch (error) {
    req.user = null;
    next();
  }
}

// 檢查用戶權限中間件
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登錄' });
    }

    // 這裡可以擴展角色檢查邏輯
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: '權限不足' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
}; 