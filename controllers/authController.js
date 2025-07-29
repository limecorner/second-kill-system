const authService = require('../services/authService');
const Joi = require('joi');

// 驗證規則
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

class AuthController {
  // 用戶註冊
  async register(req, res) {
    try {
      // 驗證輸入
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await authService.register(value);

      res.status(201).json({
        message: '註冊成功',
        data: result
      });

    } catch (error) {
      console.error('註冊錯誤:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // 用戶登錄
  async login(req, res) {
    try {
      // 驗證輸入
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await authService.login(value);

      res.json({
        message: '登錄成功',
        data: result
      });

    } catch (error) {
      console.error('登錄錯誤:', error.message);
      res.status(401).json({ error: error.message });
    }
  }

  // 批量創建測試用戶
  async createTestUsers(req, res) {
    try {
      const { count = 10000 } = req.body;

      if (count > 100000) {
        return res.status(400).json({ error: '一次最多創建10萬個用戶' });
      }

      const result = await authService.createTestUsers(count);

      res.json({
        message: '測試用戶創建成功',
        data: result
      });

    } catch (error) {
      console.error('創建測試用戶錯誤:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // 獲取用戶信息
  async getUserInfo(req, res) {
    try {
      const userInfo = await authService.getUserInfo(req.user.id);

      res.json({
        message: '獲取用戶信息成功',
        data: userInfo
      });

    } catch (error) {
      console.error('獲取用戶信息錯誤:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // 更新用戶信息
  async updateUserInfo(req, res) {
    try {
      const { phone, avatar } = req.body;

      const result = await authService.updateUserInfo(req.user.id, { phone, avatar });

      res.json({
        message: '用戶信息更新成功',
        data: result
      });

    } catch (error) {
      console.error('更新用戶信息錯誤:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // 修改密碼
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: '舊密碼和新密碼不能為空' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: '新密碼長度不能少於6位' });
      }

      const result = await authService.changePassword(req.user.id, oldPassword, newPassword);

      res.json({
        message: '密碼修改成功',
        data: result
      });

    } catch (error) {
      console.error('修改密碼錯誤:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // 登出（客戶端刪除 Token）
  async logout(req, res) {
    res.json({
      message: '登出成功',
      data: { token: null }
    });
  }
}

module.exports = new AuthController(); 