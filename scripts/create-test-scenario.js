const { query, testConnection } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createTestScenario() {
  try {
    console.log('開始創建測試場景...\n');

    // 測試數據庫連接
    await testConnection();

    // 1. 創建測試用戶（1萬個）
    console.log('1. 創建測試用戶...');
    const userCount = 10000;
    const batchSize = 1000;

    for (let i = 0; i < userCount; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, userCount - i);

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

    // 2. 創建測試商品
    console.log('\n2. 創建測試商品...');
    await query(`
      INSERT INTO products (name, description, original_price, seckill_price, image_url, category) 
      VALUES ('iPhone 15 Pro', '蘋果最新旗艦手機', 9999.00, 999.00, 'https://example.com/iphone.jpg', '手機')
    `);

    const productResult = await query('SELECT LAST_INSERT_ID() as id');
    const productId = productResult[0].id;
    console.log(`商品創建成功，ID: ${productId}`);

    // 3. 創建秒殺活動
    console.log('\n3. 創建秒殺活動...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 明天下午2點

    const endTime = new Date(tomorrow);
    endTime.setHours(16, 0, 0, 0); // 下午4點結束

    await query(`
      INSERT INTO seckill_activities ( 
        activity_name, start_time, end_time, 
      ) VALUES (?, ?, ? )
    `, ['iPhone 15 Pro 秒殺活動', tomorrow, endTime]);

    const activityResult = await query('SELECT LAST_INSERT_ID() as id');
    const activityId = activityResult[0].id;
    console.log(`活動創建成功，ID: ${activityId}`);

    // 4. 顯示測試信息
    console.log('\n✅ 測試場景創建完成！');
    console.log('\n📋 測試信息：');
    console.log(`- 用戶數量: ${userCount} 個`);
    console.log(`- 商品ID: ${productId}`);
    console.log(`- 活動ID: ${activityId}`);
    console.log(`- 庫存數量: 10 件`);
    console.log(`- 每人限購: 1 件`);
    console.log(`- 活動時間: ${tomorrow.toLocaleString()} - ${endTime.toLocaleString()}`);

    console.log('\n🔧 測試用戶信息：');
    console.log('- 用戶名格式: user1, user2, ..., user10000');
    console.log('- 密碼: 1234');
    console.log('- 郵箱格式: user1@example.com, user2@example.com, ...');

    console.log('\n📝 下一步：');
    console.log('1. 啟動服務器: npm run dev');
    console.log('2. 運行壓力測試腳本');
    console.log('3. 監控系統性能');

  } catch (error) {
    console.error('❌ 創建測試場景失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  createTestScenario();
}

module.exports = { createTestScenario }; 