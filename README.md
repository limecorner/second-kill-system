# 秒殺商品系統

一個基於 Node.js + Express + MySQL + Redis 的高併發秒殺系統。

## 功能特點

- 🚀 高併發處理
- 🛡️ 防超賣機制
- ⏰ 限時秒殺
- 📦 庫存管理
- 👤 用戶限購
- 💳 模擬支付
- 📊 實時監控

## 技術棧

- **後端**: Node.js, Express
- **數據庫**: MySQL
- **緩存**: Redis
- **認證**: JWT
- **驗證**: Joi

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置數據庫

1. 創建 MySQL 數據庫：
```sql
CREATE DATABASE second_kill_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 複製環境變量文件：
```bash
cp env.example .env
```

3. 修改 `.env` 文件中的數據庫配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=second_kill_system
```

### 3. 初始化數據庫

執行建表腳本：

```bash
node scripts/init-database.js
```

### 4. 啟動服務器

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

服務器將在 http://localhost:3000 啟動

## 數據庫表結構

### 核心表
- `users` - 用戶表
- `products` - 商品表
- `seckill_activities` - 秒殺活動表
- `orders` - 訂單表
- `inventory_logs` - 庫存變動記錄表
- `user_purchases` - 用戶購買記錄表

### 輔助表
- `system_configs` - 系統配置表
- `operation_logs` - 操作日誌表

### 視圖
- `activity_details` - 活動詳情視圖
- `user_purchase_stats` - 用戶購買統計視圖

## API 文檔

### 認證相關
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登錄

### 商品相關
- `GET /api/products` - 獲取商品列表
- `GET /api/products/:id` - 獲取商品詳情

### 秒殺相關
- `GET /api/activities` - 獲取活動列表
- `GET /api/activities/:id` - 獲取活動詳情
- `POST /api/orders` - 創建訂單

## 業務邏輯

### 秒殺流程
1. 用戶瀏覽活動商品
2. 檢查活動狀態和庫存
3. 檢查用戶限購數量
4. 下單並預扣庫存
5. 生成訂單
6. 支付處理
7. 支付成功後正式扣減庫存

### 防超賣機制
- 數據庫樂觀鎖
- Redis 原子操作
- 庫存預扣機制
- 支付超時釋放

### 限購機制
- 每個用戶在單個活動中限購指定數量
- 實時檢查用戶已購買數量
- 不同活動獨立計算限購

## 開發指南

### 項目結構
```
second-kill-system/
├── config/          # 配置文件
├── controllers/     # 控制器
├── models/         # 數據模型
├── routes/         # 路由
├── services/       # 業務邏輯
├── scripts/        # 腳本文件
├── database/       # 數據庫文件
└── public/         # 靜態文件
```

### 代碼規範
- 遵循 MVC 架構
- 使用 async/await 處理異步
- 統一錯誤處理
- 添加適當的日誌記錄

## 部署

### 環境要求
- Node.js >= 14
- MySQL >= 8.0
- Redis >= 6.0

### 生產環境配置
1. 設置環境變量
2. 配置數據庫連接池
3. 設置 Redis 緩存
4. 配置日誌記錄
5. 設置監控和告警

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 許可證

MIT License 