const seckillModel = require('../models/seckillModel');
const { ensureConnected } = require('../config/redis');
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

      console.log("🚀 ~ SeckillService ~ executeSeckill ~ quantity:", quantity)
      console.log("🚀 ~ SeckillService ~ executeSeckill ~ activityProduct.max_purchase_per_user:", activityProduct.max_purchase_per_user)

      // 檢查用戶限購
      const userPurchased = await redisClient.get(userPurchaseKey);
      const currentPurchased = parseInt(userPurchased) || 0;

      if (currentPurchased + quantity > activityProduct.max_purchase_per_user) {
        throw new Error(`超出限購數量，每人最多購買${activityProduct.max_purchase_per_user}件`);
      }

      // 檢查庫存
      const availableStock = await redisClient.get(stockKey);
      const currentStock = parseInt(availableStock) || 0;

      if (currentStock < quantity) {
        throw new Error('庫存不足');
      }

      // 扣減庫存
      await redisClient.decrBy(stockKey, quantity);
      await redisClient.incrBy(reservedStockKey, quantity);

      // 更新用戶購買記錄
      await redisClient.incrBy(userPurchaseKey, quantity);
      await redisClient.expire(userPurchaseKey, 24 * 60 * 60); // 24小時過期

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
          const rollbackScript = luaScriptManager.getScript('rollback_stock');
          if (rollbackScript) {
            await redisClient.eval(
              rollbackScript,
              2, // 2個keys
              stockKey,
              reservedStockKey,
              quantity.toString()
            );
          }
        } catch (releaseError) {
          console.error('回滾Redis庫存失敗:', releaseError);
        }
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SeckillService(); 