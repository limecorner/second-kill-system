const { query, testConnection } = require('../config/database');

async function createTables() {
  try {
    console.log('開始創建數據庫表...');

    // 測試數據庫連接
    await testConnection();

    // 1. 創建用戶表
    console.log('1. 創建用戶表...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar VARCHAR(255),
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_status (status)
      )
    `);

    // 2. 創建商品表
    console.log('2. 創建商品表...');
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        original_price DECIMAL(10,2) NOT NULL,
        seckill_price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(255),
        category VARCHAR(100),
        status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_category (category)
      )
    `);

    // 3. 創建秒殺活動表
    console.log('3. 創建秒殺活動表...');
    await query(`
      CREATE TABLE IF NOT EXISTS seckill_activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        activity_name VARCHAR(200) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        total_stock INT NOT NULL,
        available_stock INT NOT NULL,
        reserved_stock INT DEFAULT 0,
        max_purchase_per_user INT DEFAULT 1,
        status ENUM('pending', 'active', 'ended', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        INDEX idx_product_id (product_id),
        INDEX idx_status (status),
        INDEX idx_time (start_time, end_time)
      )
    `);

    // 4. 創建訂單表
    console.log('4. 創建訂單表...');
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        activity_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'simulated',
        payment_time TIMESTAMP NULL,
        payment_timeout TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        INDEX idx_order_no (order_no),
        INDEX idx_user_id (user_id),
        INDEX idx_activity_id (activity_id),
        INDEX idx_status (status),
        INDEX idx_payment_timeout (payment_timeout)
      )
    `);

    // 5. 創建庫存變動記錄表
    console.log('5. 創建庫存變動記錄表...');
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        activity_id INT NOT NULL,
        order_id INT NULL,
        change_type ENUM('reserve', 'confirm', 'release', 'adjust') NOT NULL,
        change_quantity INT NOT NULL,
        before_stock INT NOT NULL,
        after_stock INT NOT NULL,
        reason VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        INDEX idx_activity_id (activity_id),
        INDEX idx_order_id (order_id),
        INDEX idx_change_type (change_type),
        INDEX idx_created_at (created_at)
      )
    `);

    // 6. 創建用戶購買記錄表
    console.log('6. 創建用戶購買記錄表...');
    await query(`
      CREATE TABLE IF NOT EXISTS user_purchases (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        activity_id INT NOT NULL,
        total_purchased INT DEFAULT 0,
        last_purchase_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
        UNIQUE KEY unique_user_activity (user_id, activity_id),
        INDEX idx_user_id (user_id),
        INDEX idx_activity_id (activity_id)
      )
    `);

    // 7. 創建系統配置表
    console.log('7. 創建系統配置表...');
    await query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        description VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_config_key (config_key)
      )
    `);

    // 8. 創建操作日誌表
    console.log('8. 創建操作日誌表...');
    await query(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      )
    `);

    // 9. 插入初始系統配置
    console.log('9. 插入初始系統配置...');
    await query(`
      INSERT IGNORE INTO system_configs (config_key, config_value, description) VALUES
      ('payment_timeout_minutes', '15', '支付超時時間（分鐘）'),
      ('max_concurrent_users', '1000', '最大併發用戶數'),
      ('rate_limit_per_minute', '60', '每分鐘請求限制'),
      ('seckill_button_disable_seconds', '3', '秒殺按鈕禁用時間（秒）')
    `);

    // 10. 創建視圖
    console.log('10. 創建視圖...');

    // 活動詳情視圖
    await query(`
      CREATE OR REPLACE VIEW activity_details AS
      SELECT 
        sa.id,
        sa.activity_name,
        sa.start_time,
        sa.end_time,
        sa.total_stock,
        sa.available_stock,
        sa.reserved_stock,
        sa.max_purchase_per_user,
        sa.status,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.original_price,
        p.seckill_price,
        p.image_url,
        p.category,
        CASE 
          WHEN NOW() < sa.start_time THEN 'not_started'
          WHEN NOW() BETWEEN sa.start_time AND sa.end_time THEN 'active'
          ELSE 'ended'
        END as current_status
      FROM seckill_activities sa
      JOIN products p ON sa.product_id = p.id
    `);

    // 用戶購買統計視圖
    await query(`
      CREATE OR REPLACE VIEW user_purchase_stats AS
      SELECT 
        u.id as user_id,
        u.username,
        sa.id as activity_id,
        sa.activity_name,
        COALESCE(up.total_purchased, 0) as total_purchased,
        sa.max_purchase_per_user,
        (sa.max_purchase_per_user - COALESCE(up.total_purchased, 0)) as remaining_quota
      FROM users u
      CROSS JOIN seckill_activities sa
      LEFT JOIN user_purchases up ON u.id = up.user_id AND sa.id = up.activity_id
      WHERE sa.status = 'active'
    `);

    console.log('✅ 所有表創建成功！');
    console.log('\n已創建的表：');
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
  createTables();
}

module.exports = { createTables }; 