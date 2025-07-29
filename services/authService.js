const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { query, transaction } = require('../config/database');

class AuthService {
  // 用戶註冊
  async register(userData) {
    const { username, email, password, phone } = userData;

    // 驗證輸入
    if (!username || !email || !password) {
      throw new Error('用戶名、郵箱和密碼不能為空');
    }

    // 檢查用戶名和郵箱是否已存在
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      throw new Error('用戶名或郵箱已存在');
    }

    // 加密密碼
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 創建用戶
    const result = await query(
      'INSERT INTO users (username, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, phone]
    );

    // 生成 JWT Token
    const token = generateToken({
      userId: result.insertId,
      username: username,
      email: email
    });

    return {
      user: {
        id: result.insertId,
        username,
        email,
        phone
      },
      token
    };
  }

  // 用戶登錄
  async login(credentials) {
    const { username, password } = credentials;

    // 驗證輸入
    if (!username || !password) {
      throw new Error('用戶名和密碼不能為空');
    }

    // 查找用戶
    const users = await query(
      'SELECT id, username, email, password_hash, status FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      throw new Error('用戶不存在');
    }

    const user = users[0];

    // 檢查用戶狀態
    if (user.status !== 'active') {
      throw new Error('用戶已被禁用');
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('密碼錯誤');
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  // 批量創建測試用戶
  async createTestUsers(count = 10000) {
    const users = [];
    const batchSize = 1000; // 每批處理1000個用戶

    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, count - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const userNum = i + j + 1;
        const username = `user${userNum}`;
        const email = `user${userNum}@example.com`;
        const password = '1234';
        const passwordHash = await bcrypt.hash(password, 10);

        batch.push([username, email, passwordHash, `1380000${userNum.toString().padStart(4, '0')}`]);
      }

      // 批量插入
      const placeholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
      const values = batch.flat();

      await query(
        `INSERT INTO users (username, email, password_hash, phone) VALUES ${placeholders}`,
        values
      );

      console.log(`已創建 ${i + currentBatchSize} 個測試用戶`);
    }

    return { message: `成功創建 ${count} 個測試用戶` };
  }

  // 獲取用戶信息
  async getUserInfo(userId) {
    const users = await query(
      'SELECT id, username, email, phone, avatar, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('用戶不存在');
    }

    return users[0];
  }

  // 更新用戶信息
  async updateUserInfo(userId, updateData) {
    const { phone, avatar } = updateData;

    const result = await query(
      'UPDATE users SET phone = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [phone, avatar, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('用戶不存在');
    }

    return { message: '用戶信息更新成功' };
  }

  // 修改密碼
  async changePassword(userId, oldPassword, newPassword) {
    // 獲取用戶當前密碼
    const users = await query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('用戶不存在');
    }

    // 驗證舊密碼
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isOldPasswordValid) {
      throw new Error('舊密碼錯誤');
    }

    // 加密新密碼
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密碼
    await query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    return { message: '密碼修改成功' };
  }
}

module.exports = new AuthService(); 