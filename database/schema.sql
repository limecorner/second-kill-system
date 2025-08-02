-- 秒殺系統數據庫表結構設計

-- 用戶表
CREATE TABLE users (
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
);

-- 商品表
CREATE TABLE products (
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
);

-- 秒殺活動表
CREATE TABLE seckill_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_name VARCHAR(200) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'active', 'ended', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE `activity_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `product_id` int NOT NULL,
  `max_purchase_per_user` int DEFAULT '1',
  `available_stock` int NOT NULL,
  `reserved_stock` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_activity_product` (`activity_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `activity_products_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `seckill_activities` (`id`),
  CONSTRAINT `activity_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
)


-- 訂單表
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL, -- 訂單號
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'simulated',
    payment_time TIMESTAMP NULL,
    payment_timeout TIMESTAMP NOT NULL, -- 支付超時時間
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_status (status),
    INDEX idx_payment_timeout (payment_timeout),
    CHECK (quantity > 0),
    CHECK (unit_price > 0),
    CHECK (total_amount > 0)
);

-- 庫存變動記錄表
CREATE TABLE inventory_logs (
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
);

-- 用戶購買記錄表（用於限購檢查）
CREATE TABLE user_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    total_purchased INT DEFAULT 0, -- 該用戶在該活動中的總購買數量
    last_purchase_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
    UNIQUE KEY unique_user_activity (user_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id)
);

-- 系統配置表
CREATE TABLE system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- 操作日誌表
CREATE TABLE operation_logs (
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
);

-- 插入初始系統配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('payment_timeout_minutes', '15', '支付超時時間（分鐘）'),
('max_concurrent_users', '1000', '最大併發用戶數'),
('rate_limit_per_minute', '60', '每分鐘請求限制'),
('seckill_button_disable_seconds', '3', '秒殺按鈕禁用時間（秒）');

-- 創建視圖：活動詳情視圖
CREATE VIEW activity_details AS
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
JOIN products p ON sa.product_id = p.id;

-- 創建視圖：用戶購買統計視圖
CREATE VIEW user_purchase_stats AS
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
WHERE sa.status = 'active'; 