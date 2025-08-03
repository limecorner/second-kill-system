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

      // 6. 獲取商品信息
      const product = await seckillModel.getProductById(productId);
      if (!product) {
        throw new Error('商品不存在');
      }

      // 7. 生成訂單號
      const orderNo = this.generateOrderNo();

      // 8. 異步創建訂單 - 使用 Redis 作為消息隊列
      const orderData = {
        orderNo,
        userId,
        activityId,
        productId,
        quantity,
        unitPrice: product.seckill_price,
        totalAmount: product.seckill_price * quantity,
        paymentTimeout: new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // 15分鐘，轉換為 MySQL DATETIME 格式
        ipAddress,
        userAgent,
        timestamp: Date.now()
      };

      // 將訂單數據存入 Redis 隊列
      await redisClient.sendCommand(['LPUSH', 'order_queue', JSON.stringify(orderData)]);

      // 設置隊列處理標記
      await redisClient.sendCommand(['SETEX', `order_processing:${orderNo}`, '3000', '1']); // 50分鐘過期

      // 9. 立即返回成功響應
      return {
        orderNo,
        activityId,
        productId,
        quantity,
        unitPrice: product.seckill_price,
        totalAmount: product.seckill_price * quantity,
        status: 'processing',
        message: '秒殺成功，訂單正在處理中'
      };

    } catch (error) {
      throw error;
    }
  }

  // 處理訂單隊列
  async processOrderQueue() {
    const redisClient = await ensureConnected();

    while (true) {
      try {
        // 從隊列中取出訂單
        const orderData = await redisClient.sendCommand(['BRPOP', 'order_queue', '1']);

        if (orderData) {
          const order = JSON.parse(orderData[1]);
          await this.createOrderFromQueue(order);
        }
      } catch (error) {
        console.error('處理訂單隊列錯誤:', error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒後重試
      }
    }
  }

  // 從隊列創建訂單
  async createOrderFromQueue(orderData) {
    const redisClient = await ensureConnected();
    const { orderNo, userId, activityId, productId, quantity, unitPrice, totalAmount, paymentTimeout, ipAddress, userAgent } = orderData;

    try {
      // 檢查是否已經處理過
      const processing = await redisClient.sendCommand(['GET', `order_processing:${orderNo}`]);
      if (!processing) {
        console.log(`訂單 ${orderNo} 已處理或過期`);
        return;
      }

      // 創建訂單
      const orderId = await seckillModel.createOrder({
        orderNo,
        userId,
        activityId,
        productId,
        quantity,
        unitPrice,
        totalAmount,
        paymentTimeout
      });

      // 記錄操作日誌
      await seckillModel.logOperation(
        userId,
        'seckill_purchase',
        'order',
        orderId,
        {
          activityId,
          productId,
          quantity,
          unitPrice,
          totalAmount
        },
        ipAddress,
        userAgent
      );

      // 移除處理標記
      await redisClient.sendCommand(['DEL', `order_processing:${orderNo}`]);

      console.log(`✅ 訂單創建成功: ${orderNo}, ID: ${orderId}`);

    } catch (error) {
      console.error(`❌ 創建訂單失敗: ${orderNo}`, error);

      // 如果創建訂單失敗，回滾 Redis 庫存
      try {
        const userPurchaseKey = `seckill:user:${userId}:activity:${activityId}:product:${productId}`;
        const stockKey = `seckill:activity:${activityId}:product:${productId}:stock`;
        const reservedStockKey = `seckill:activity:${activityId}:product:${productId}:reserved`;

        const rollbackScript = luaScriptManager.getScript('rollback-stock');
        if (rollbackScript) {
          await redisClient.eval(
            rollbackScript,
            {
              keys: [stockKey, reservedStockKey, userPurchaseKey],
              arguments: [String(quantity)]
            }
          );
          console.log(`✅ 庫存回滾成功: ${orderNo}`);
        }
      } catch (rollbackError) {
        console.error(`❌ 回滾庫存失敗: ${orderNo}`, rollbackError);
      }

      // 移除處理標記
      await redisClient.sendCommand(['DEL', `order_processing:${orderNo}`]);
    }
  }

  // 獲取訂單狀態
  async getOrderStatus(orderNo) {
    try {
      const order = await seckillModel.getOrderByOrderNo(orderNo);
      if (order) {
        return {
          orderNo,
          status: order.status,
          orderId: order.id,
          createdAt: order.created_at
        };
      } else {
        // 檢查是否還在處理中
        const redisClient = await ensureConnected();
        const processing = await redisClient.sendCommand(['GET', `order_processing:${orderNo}`]);

        if (processing) {
          return {
            orderNo,
            status: 'processing',
            message: '訂單正在處理中'
          };
        } else {
          return {
            orderNo,
            status: 'not_found',
            message: '訂單不存在'
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SeckillService(); 