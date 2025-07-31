-- 回滾庫存的 Lua 腳本
-- 參數說明：
-- KEYS[1]: 庫存 key (seckill:activity:{activityId}:product:{productId}:stock)
-- KEYS[2]: 已預扣庫存 key (seckill:activity:{activityId}:product:{productId}:reserved)
-- KEYS[3]: 用戶購買記錄 key (seckill:user:{userId}:activity:{activityId}:product:{productId})
-- ARGV[1]: 回滾數量

local rollbackQuantity = tonumber(ARGV[1])

-- 回滾庫存：增加可用庫存，減少已預扣庫存，減少用戶購買記錄
redis.call('INCRBY', KEYS[1], rollbackQuantity)
redis.call('DECRBY', KEYS[2], rollbackQuantity)
redis.call('DECRBY', KEYS[3], rollbackQuantity)

-- 如果用戶購買記錄變為0，刪除該key
local userPurchased = redis.call('GET', KEYS[3])
if tonumber(userPurchased) <= 0 then
    redis.call('DEL', KEYS[3])
end

return {'ok', '庫存回滾成功'} 