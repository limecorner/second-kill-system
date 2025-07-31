-- 秒殺購買的 Lua 腳本
-- 參數說明：
-- KEYS[1]: 用戶購買記錄 key (seckill:user:{userId}:activity:{activityId}:product:{productId})
-- KEYS[2]: 庫存 key (seckill:activity:{activityId}:product:{productId}:stock)
-- KEYS[3]: 已預扣庫存 key (seckill:activity:{activityId}:product:{productId}:reserved)
-- ARGV[1]: 購買數量
-- ARGV[2]: 用戶限購數量
-- ARGV[3]: 過期時間（秒）

-- 獲取當前用戶已購買數量
local userPurchased = redis.call('GET', KEYS[1])
local currentPurchased = tonumber(userPurchased) or 0

-- 獲取當前庫存
local availableStock = redis.call('GET', KEYS[2])
local currentStock = tonumber(availableStock) or 0

-- 獲取請求數量
local requestQuantity = tonumber(ARGV[1])
local maxPurchasePerUser = tonumber(ARGV[2])
local expireTime = tonumber(ARGV[3])

-- 檢查用戶限購
if currentPurchased + requestQuantity > maxPurchasePerUser then
    return {'error', 'EXCEED_LIMIT', '超出限購數量'}
end

-- 檢查庫存
if currentStock < requestQuantity then
    return {'error', 'INSUFFICIENT_STOCK', '庫存不足'}
end

-- 原子性操作：扣減庫存、增加已預扣庫存、更新用戶購買記錄
redis.call('DECRBY', KEYS[2], requestQuantity)
redis.call('INCRBY', KEYS[3], requestQuantity)
redis.call('INCRBY', KEYS[1], requestQuantity)
redis.call('EXPIRE', KEYS[1], expireTime)

-- 返回成功結果
local newStock = currentStock - requestQuantity
local newUserPurchased = currentPurchased + requestQuantity
return {'ok', newStock, newUserPurchased} 