const jwt = require('jsonwebtoken');

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 生成 JWT Token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'seckill-system',
    audience: 'seckill-users'
  });
}

// 驗證 JWT Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// 解析 Token（不驗證，僅解析）
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

// 從請求頭中提取 Token
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }

  return parts[1];
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  JWT_SECRET,
  JWT_EXPIRES_IN
}; 