const redis = require('redis');

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0
};

// 創建Redis客戶端
const client = redis.createClient(redisConfig);

// 連接事件處理
client.on('connect', () => {
  console.log('Redis連接成功');
});

client.on('error', (err) => {
  console.error('Redis連接錯誤:', err.message);
});

client.on('ready', () => {
  console.log('Redis客戶端準備就緒');
});

client.on('end', () => {
  console.log('Redis連接已關閉');
});

// 確保客戶端已連接
async function ensureConnected() {
  if (!client.isReady) {
    await client.connect();
  }
  return client;
}

// 測試連接
async function testConnection() {
  try {
    const redisClient = await ensureConnected();
    await redisClient.ping();
    console.log('Redis連接測試成功');
    return true;
  } catch (error) {
    console.error('Redis連接測試失敗:', error.message);
    return false;
  }
}

// 關閉連接
async function closeConnection() {
  try {
    if (client.isReady) {
      await client.quit();
      console.log('Redis連接已關閉');
    }
  } catch (error) {
    console.error('關閉Redis連接失敗:', error.message);
  }
}

module.exports = {
  client,
  ensureConnected,
  testConnection,
  closeConnection
}; 