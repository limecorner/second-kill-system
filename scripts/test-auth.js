const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 測試用戶數據
const testUser = {
  username: 'testuser1',
  email: 'testuser1@example.com',
  password: 'test123456',
  phone: '13800000001'
};

async function testAuth() {
  try {
    console.log('🧪 開始測試認證系統...\n');

    // 1. 測試註冊
    console.log('1. 測試用戶註冊...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ 註冊成功:', registerResponse.data.message);
    console.log('用戶ID:', registerResponse.data.data.user.id);
    console.log('Token:', registerResponse.data.data.token.substring(0, 50) + '...\n');

    // 2. 測試登錄
    console.log('2. 測試用戶登錄...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    console.log('✅ 登錄成功:', loginResponse.data.message);
    console.log('Token:', loginResponse.data.data.token.substring(0, 50) + '...\n');

    const token = loginResponse.data.data.token;

    // 3. 測試獲取用戶信息
    console.log('3. 測試獲取用戶信息...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 獲取用戶信息成功:', profileResponse.data.data.username);
    console.log('郵箱:', profileResponse.data.data.email);
    console.log('狀態:', profileResponse.data.data.status + '\n');

    // 4. 測試更新用戶信息
    console.log('4. 測試更新用戶信息...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
      phone: '13800000002',
      avatar: 'https://example.com/avatar.jpg'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 更新用戶信息成功:', updateResponse.data.message + '\n');

    // 5. 測試無效 Token
    console.log('5. 測試無效 Token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
    } catch (error) {
      console.log('✅ 無效 Token 被正確拒絕:', error.response.data.error + '\n');
    }

    // 6. 測試無 Token
    console.log('6. 測試無 Token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`);
    } catch (error) {
      console.log('✅ 無 Token 被正確拒絕:', error.response.data.error + '\n');
    }

    console.log('🎉 所有認證測試通過！');

  } catch (error) {
    console.error('❌ 測試失敗:', error.response?.data?.error || error.message);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth }; 