# 數據庫設置指南

## 1. MySQL 安裝和配置

### 檢查 MySQL 是否已安裝
```bash
mysql --version
```

### 如果未安裝，請先安裝 MySQL
- Windows: 下載並安裝 MySQL Community Server
- 或使用 XAMPP/WAMP 等集成環境

## 2. 創建數據庫

### 方法一：使用命令行
```bash
# 連接到 MySQL
mysql -u root -p

# 在 MySQL 中執行
CREATE DATABASE second_kill_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 方法二：使用 phpMyAdmin
1. 打開 phpMyAdmin
2. 點擊「新建」
3. 數據庫名：`second_kill_system`
4. 字符集：`utf8mb4_unicode_ci`
5. 點擊「創建」

## 3. 配置數據庫連接

### 步驟 1：創建環境變量文件
```bash
cp env.example .env
```

### 步驟 2：修改 .env 文件
根據您的 MySQL 配置修改以下內容：

```env
# 如果 MySQL 沒有密碼
DB_PASSWORD=

# 如果 MySQL 有密碼
DB_PASSWORD=your_mysql_password

# 其他配置保持默認
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_NAME=second_kill_system
```

### 步驟 3：測試連接
```bash
node scripts/test-db-connection.js
```

## 4. 執行建表腳本

連接成功後，執行建表腳本：

```bash
node scripts/init-database.js
```

## 常見問題

### 問題 1：Access denied for user 'root'@'localhost'
**解決方案：**
1. 檢查 MySQL 是否啟動
2. 確認用戶名和密碼是否正確
3. 如果忘記密碼，可以重置 MySQL root 密碼

### 問題 2：數據庫不存在
**解決方案：**
```sql
CREATE DATABASE second_kill_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 問題 3：權限不足
**解決方案：**
```sql
GRANT ALL PRIVILEGES ON second_kill_system.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## 驗證設置

建表成功後，您應該看到以下表：

```sql
USE second_kill_system;
SHOW TABLES;
```

應該顯示：
- users
- products
- seckill_activities
- orders
- inventory_logs
- user_purchases
- system_configs
- operation_logs

以及視圖：
- activity_details
- user_purchase_stats 