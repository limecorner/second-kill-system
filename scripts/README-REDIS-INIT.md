# Redis 初始化腳本說明

本目錄包含用於初始化秒殺系統 Redis 資料的腳本，根據 `/purchase` 端點的需求設計。

## 腳本列表

### 1. `init-multi-products-redis.js`
初始化所有活動和商品的 Redis 資料。

**功能：**
- 獲取所有活動和商品
- 設置庫存相關的 Redis keys
- 設置活動狀態和時間範圍
- 設置商品限購和價格信息
- 清理過期的用戶購買記錄
- 設置系統配置

**使用方法：**
```bash
node scripts/init-multi-products-redis.js
```

### 2. `init-redis-by-activity.js`
根據指定的活動 ID 初始化 Redis 資料。

**功能：**
- 只初始化指定活動的資料
- 設置該活動的所有商品庫存
- 清理該活動的用戶購買記錄

**使用方法：**
```bash
node scripts/init-redis-by-activity.js <activity_id>
```

**範例：**
```bash
node scripts/init-redis-by-activity.js 1
```

### 3. `test-redis-init.js`
測試 Redis 初始化是否正常工作。

**功能：**
- 執行完整的初始化流程
- 驗證 Redis 資料是否正確設置
- 顯示初始化結果摘要

**使用方法：**
```bash
node scripts/test-redis-init.js
```

## Redis Keys 結構

### 庫存相關
```
seckill:activity:{activity_id}:product:{product_id}:stock          # 可用庫存
seckill:activity:{activity_id}:product:{product_id}:reserved       # 已預扣庫存
```

### 活動相關
```
seckill:activity:{activity_id}:status                             # 活動狀態
seckill:activity:{activity_id}:start_time                         # 活動開始時間
seckill:activity:{activity_id}:end_time                           # 活動結束時間
```

### 商品相關
```
seckill:activity:{activity_id}:product:{product_id}:limit         # 限購數量
seckill:activity:{activity_id}:product:{product_id}:price         # 秒殺價格
```

### 用戶購買記錄
```
seckill:user:{user_id}:activity:{activity_id}:product:{product_id}  # 用戶購買數量
```

### 系統配置
```
seckill:config:payment_timeout_minutes                           # 支付超時時間
seckill:config:max_concurrent_users                             # 最大併發用戶數
seckill:config:rate_limit_per_minute                            # 每分鐘請求限制
seckill:config:seckill_button_disable_seconds                   # 秒殺按鈕禁用時間
```

## 使用場景

### 1. 系統啟動時初始化
```bash
# 初始化所有活動
node scripts/init-multi-products-redis.js
```

### 2. 新增活動後初始化
```bash
# 初始化特定活動
node scripts/init-redis-by-activity.js 1
```

### 3. 測試驗證
```bash
# 測試初始化是否正常
node scripts/test-redis-init.js
```

## 注意事項

1. **執行前確保：**
   - Redis 服務正在運行
   - 資料庫中有活動和商品資料
   - 資料庫連接正常

2. **初始化時機：**
   - 系統首次部署
   - 新增活動後
   - 庫存調整後
   - 系統重啟後

3. **資料一致性：**
   - 腳本會從資料庫讀取最新資料
   - 會清理過期的用戶購買記錄
   - 確保 Redis 資料與資料庫同步

4. **錯誤處理：**
   - 腳本包含完整的錯誤處理
   - 會顯示詳細的執行日誌
   - 失敗時會顯示具體錯誤信息

## 與 `/purchase` 端點的關係

這些腳本設置的 Redis 資料直接支援 `/purchase` 端點的功能：

1. **庫存檢查：** `seckill:activity:{activity_id}:product:{product_id}:stock`
2. **限購檢查：** `seckill:user:{user_id}:activity:{activity_id}:product:{product_id}`
3. **活動狀態檢查：** `seckill:activity:{activity_id}:status`
4. **活動時間檢查：** `seckill:activity:{activity_id}:start_time` 和 `seckill:activity:{activity_id}:end_time`

確保這些 Redis 資料正確初始化後，`/purchase` 端點就能正常處理秒殺購買請求。 