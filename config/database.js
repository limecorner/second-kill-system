const mysql = require('mysql2/promise');

// 數據庫配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'second_kill_system',
  charset: 'utf8mb4',
  timezone: '+08:00',

  // 連接池配置
  connectionLimit: 20,

  // 查詢配置
  multipleStatements: true,
  dateStrings: true
};

// 創建連接池
const pool = mysql.createPool(dbConfig);

// 測試連接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('數據庫連接成功');
    connection.release();
  } catch (error) {
    console.error('數據庫連接失敗:', error);
    process.exit(1);
  }
}

// 執行查詢
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('查詢錯誤:', error);
    throw error;
  }
}

// 執行事務
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// 關閉連接池
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool
}; 