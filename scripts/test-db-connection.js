const mysql = require('mysql2/promise');

// 測試數據庫連接配置
const testConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // 請根據您的 MySQL 配置修改
  charset: 'utf8mb4'
};

async function testConnection() {
  try {
    console.log('正在測試數據庫連接...');
    console.log('配置:', {
      host: testConfig.host,
      port: testConfig.port,
      user: testConfig.user,
      password: testConfig.password ? '***' : '(空)'
    });

    const connection = await mysql.createConnection(testConfig);
    console.log('✅ 數據庫連接成功！');

    // 測試查詢
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL 版本:', rows[0].version);

    // 檢查數據庫是否存在
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbNames = databases.map(db => db.Database);
    console.log('現有數據庫:', dbNames);

    if (dbNames.includes('second_kill_system')) {
      console.log('✅ 數據庫 second_kill_system 已存在');
    } else {
      console.log('❌ 數據庫 second_kill_system 不存在，請先創建');
      console.log('請執行以下 SQL 命令創建數據庫：');
      console.log('CREATE DATABASE second_kill_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    }

    await connection.end();

  } catch (error) {
    console.error('❌ 數據庫連接失敗:', error.message);
    console.log('\n請檢查以下配置：');
    console.log('1. MySQL 服務是否啟動');
    console.log('2. 用戶名和密碼是否正確');
    console.log('3. 數據庫是否已創建');
    console.log('\n如果 MySQL 沒有密碼，請修改 scripts/test-db-connection.js 中的 password 為空字符串');
  }
}

testConnection(); 