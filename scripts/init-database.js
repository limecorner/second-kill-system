const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('../config/database');

async function initDatabase() {
  try {
    console.log('開始初始化數據庫...');

    // 測試數據庫連接
    await testConnection();

    // 讀取 schema.sql 文件
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('正在執行建表語句...');

    // 將 SQL 語句按分號分割並逐個執行
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`執行語句 ${i + 1}/${statements.length}...`);
          await query(statement);
        } catch (error) {
          console.error(`語句 ${i + 1} 執行失敗:`, error.message);
          console.error('問題語句:', statement.substring(0, 100) + '...');
          throw error;
        }
      }
    }

    console.log('✅ 數據庫表創建成功！');
    console.log('已創建的表：');
    console.log('- users (用戶表)');
    console.log('- products (商品表)');
    console.log('- seckill_activities (秒殺活動表)');
    console.log('- orders (訂單表)');
    console.log('- inventory_logs (庫存變動記錄表)');
    console.log('- user_purchases (用戶購買記錄表)');
    console.log('- system_configs (系統配置表)');
    console.log('- operation_logs (操作日誌表)');
    console.log('- activity_details (活動詳情視圖)');
    console.log('- user_purchase_stats (用戶購買統計視圖)');

    console.log('\n🎉 數據庫初始化完成！');

  } catch (error) {
    console.error('❌ 數據庫初始化失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase }; 