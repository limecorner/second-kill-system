const redis = require('redis');

async function testRedis() {
  console.log('開始測試Redis連接...');
  console.log('Redis配置:', {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '無',
    db: process.env.REDIS_DB || 0
  });

  // 創建Redis客戶端
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  });

  // 連接事件處理
  client.on('connect', () => {
    console.log('✅ Redis連接成功');
  });

  client.on('error', (err) => {
    console.error('❌ Redis連接錯誤:', err.message);
  });

  client.on('ready', () => {
    console.log('✅ Redis客戶端準備就緒');
  });

  client.on('end', () => {
    console.log('Redis連接已關閉');
  });

  try {
    // 嘗試連接
    await client.connect();
    console.log('正在嘗試連接Redis...');

    // 測試ping
    const pong = await client.ping();
    console.log('✅ Redis ping 成功:', pong);

    // 測試基本操作
    console.log('測試基本Redis操作...');

    // 設置一個測試值
    await client.set('test_key', 'test_value');
    console.log('✅ 設置測試值成功');

    // 獲取測試值
    const value = await client.get('test_key');
    console.log('✅ 獲取測試值成功:', value);

    // 刪除測試值
    await client.del('test_key');
    console.log('✅ 刪除測試值成功');

    console.log('🎉 所有Redis測試通過！');

  } catch (error) {
    console.error('❌ Redis測試失敗:', error.message);
    console.log('請確保Redis服務器正在運行');
    console.log('如果使用Docker，請運行: docker run -d -p 6379:6379 redis');
  } finally {
    try {
      await client.quit();
      console.log('Redis連接已關閉');
    } catch (error) {
      console.error('關閉Redis連接失敗:', error.message);
    }
  }
}

// 運行測試
testRedis(); 