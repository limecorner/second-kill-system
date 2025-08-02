const seckillModel = require('../models/seckillModel');
const { ensureConnected } = require('../config/redis');
const luaScriptManager = require('../utils/luaScriptManager');
const crypto = require('crypto');

class SeckillService {
  // 生成訂單號
  generateOrderNo() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `SK${timestamp}${random}`.toUpperCase();
  }

  // 執行秒殺購買
  async executeSeckill(userId, activityId, productId, quantity = 1, ipAddress, userAgent) {
    try {
      // 1. 檢查活動是否存在且有效
      // 這裡要改
      const activity = await seckillModel.getActivityById(activityId);
      if (!activity) {
        throw new Error('活動不存在');
      }

      // 2. 檢查活動狀態
      if (activity.status !== 'active') {
        throw new Error('活動未開始或已結束');
      }

      const now = new Date();
      if (now < new Date(activity.start_time) || now > new Date(activity.end_time)) {
        throw new Error('活動未開始或已結束');
      }

      // 3. 檢查商品是否在活動中
      const activityProduct = await seckillModel.getActivityProductLimit(activityId, productId);
      if (!activityProduct) {
        throw new Error('商品不在該活動中');
      }

      // 4. 獲取Redis客戶端
      const redisClient = await ensureConnected();

      // 5. 使用Lua腳本進行原子操作
      const userPurchaseKey = `seckill:user:${userId}:activity:${activityId}:product:${productId}`;
      const stockKey = `seckill:activity:${activityId}:product:${productId}:stock`;
      const reservedStockKey = `seckill:activity:${activityId}:product:${productId}:reserved`;

      // 使用 Lua 腳本進行原子操作
      const seckillScript = luaScriptManager.getScript('seckill');
      if (!seckillScript) {
        throw new Error('Lua 腳本未找到');
      }

      // 執行 Lua 腳本
      const result = await redisClient.eval(
        seckillScript,
        {
          keys: [userPurchaseKey, stockKey, reservedStockKey],
          arguments: [
            quantity.toString(),
            String(activityProduct.max_purchase_per_user || 1),
            String(24 * 60 * 60) // 24小時過期
          ]
        }
      );

      // 檢查 Lua 腳本執行結果
      if (result && Array.isArray(result) && result[0] === 'error') {
        if (result[1] === 'EXCEED_LIMIT') {
          throw new Error(`超出限購數量，每人最多購買${activityProduct.max_purchase_per_user}件`);
        } else if (result[1] === 'INSUFFICIENT_STOCK') {
          throw new Error('庫存不足');
        } else {
          throw new Error(result[2] || '秒殺失敗');
        }
      }

      // 7. 獲取商品信息
      const product = await seckillModel.getProductById(productId);
      if (!product) {
        throw new Error('商品不存在');
      }

      // 8. 獲取系統配置
      const paymentTimeoutMinutes = 15; // 默認15分鐘
      const paymentTimeout = new Date(Date.now() + paymentTimeoutMinutes * 60 * 1000);

      // 9. 生成訂單號
      const orderNo = this.generateOrderNo();

      // 10. 創建訂單
      let orderId;
      try {
        orderId = await seckillModel.createOrder({
          orderNo,
          userId,
          activityId,
          productId,
          quantity,
          unitPrice: product.seckill_price,
          totalAmount: product.seckill_price * quantity,
          paymentTimeout
        });

        // 11. 用戶購買記錄已在Lua腳本中更新

        // 12. 記錄操作日誌
        await seckillModel.logOperation(
          userId,
          'seckill_purchase',
          'order',
          orderId,
          {
            activityId,
            productId,
            quantity,
            unitPrice: product.seckill_price,
            totalAmount: product.seckill_price * quantity
          },
          ipAddress,
          userAgent
        );

        return {
          orderId,
          orderNo,
          activityId,
          productId,
          quantity,
          unitPrice: product.seckill_price,
          totalAmount: product.seckill_price * quantity,
          paymentTimeout
        };

      } catch (error) {
        // 如果創建訂單失敗，使用Lua腳本回滾庫存
        try {
          const rollbackScript = luaScriptManager.getScript('rollback-stock');
          if (rollbackScript) {
            await redisClient.eval(
              rollbackScript,
              {
                keys: [stockKey, reservedStockKey, userPurchaseKey],
                arguments: [String(quantity)]
              }
            );
            console.log('✅ 庫存回滾成功');
          }
        } catch (releaseError) {
          console.error('❌ 回滾Redis庫存失敗:', releaseError);
        }
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SeckillService(); 