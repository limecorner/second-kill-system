const { ensureConnected } = require('../config/redis');
const seckillModel = require('../models/seckillModel');

async function initMultiProductsRedis() {
  try {
    console.log('🚀 開始初始化多產品 Redis 資料...');

    const redisClient = await ensureConnected();

    // 1. 獲取所有活動
    const activities = await seckillModel.getAllActivities();
    console.log(`📋 找到 ${activities.length} 個活動`);

    for (const activity of activities) {
      console.log(`\n📦 處理活動: ${activity.activity_name} (ID: ${activity.id})`);

      // 2. 獲取活動中的所有商品
      const activityProducts = await seckillModel.getActivityProducts(activity.id);
      console.log(`   📦 活動包含 ${activityProducts.length} 個商品`);

      for (const product of activityProducts) {
        console.log(`   🛍️  處理商品: ${product.product_name} (ID: ${product.product_id})`);

        // 3. 設置庫存相關的 Redis keys
        const stockKey = `seckill:activity:${activity.id}:product:${product.product_id}:stock`;
        const reservedStockKey = `seckill:activity:${activity.id}:product:${product.product_id}:reserved`;

        // 設置可用庫存
        await redisClient.set(stockKey, product.available_stock);
        console.log(`     ✅ 設置庫存: ${product.available_stock} (Key: ${stockKey})`);

        // 設置已預扣庫存
        await redisClient.set(reservedStockKey, product.reserved_stock || 0);
        console.log(`     ✅ 設置已預扣庫存: ${product.reserved_stock || 0} (Key: ${reservedStockKey})`);

        // 4. 設置活動狀態
        const activityStatusKey = `seckill:activity:${activity.id}:status`;
        await redisClient.set(activityStatusKey, activity.status);
        console.log(`     ✅ 設置活動狀態: ${activity.status} (Key: ${activityStatusKey})`);

        // 5. 設置活動時間範圍
        const activityStartKey = `seckill:activity:${activity.id}:start_time`;
        const activityEndKey = `seckill:activity:${activity.id}:end_time`;
        await redisClient.set(activityStartKey, activity.start_time);
        await redisClient.set(activityEndKey, activity.end_time);
        console.log(`     ✅ 設置活動時間: ${activity.start_time} - ${activity.end_time}`);

        // 6. 設置商品限購信息
        const productLimitKey = `seckill:activity:${activity.id}:product:${product.product_id}:limit`;
        await redisClient.set(productLimitKey, product.max_purchase_per_user);
        console.log(`     ✅ 設置限購數量: ${product.max_purchase_per_user} (Key: ${productLimitKey})`);

        // 7. 設置商品價格信息
        const productPriceKey = `seckill:activity:${activity.id}:product:${product.product_id}:price`;
        await redisClient.set(productPriceKey, product.seckill_price);
        console.log(`     ✅ 設置秒殺價格: ${product.seckill_price} (Key: ${productPriceKey})`);
      }
    }

    // 8. 清理過期的用戶購買記錄（可選）
    console.log('\n🧹 清理過期的用戶購買記錄...');
    const userPurchasePattern = 'seckill:user:*:activity:*:product:*';
    const userPurchaseKeys = await redisClient.keys(userPurchasePattern);

    if (userPurchaseKeys.length > 0) {
      console.log(`   找到 ${userPurchaseKeys.length} 個用戶購買記錄`);
      // 這裡可以根據需要設置過期時間或清理舊記錄
      for (const key of userPurchaseKeys) {
        await redisClient.expire(key, 24 * 60 * 60); // 24小時過期
      }
      console.log('   ✅ 已設置用戶購買記錄過期時間');
    }

    // 9. 設置系統配置
    console.log('\n⚙️  設置系統配置...');
    const systemConfigs = {
      'seckill:config:payment_timeout_minutes': '15',
      'seckill:config:max_concurrent_users': '1000',
      'seckill:config:rate_limit_per_minute': '60',
      'seckill:config:seckill_button_disable_seconds': '3'
    };

    for (const [key, value] of Object.entries(systemConfigs)) {
      await redisClient.set(key, value);
      console.log(`   ✅ 設置配置: ${key} = ${value}`);
    }

    console.log('\n🎉 Redis 初始化完成！');
    console.log('\n📊 初始化摘要:');
    console.log(`   - 活動數量: ${activities.length}`);

    let totalProducts = 0;
    for (const activity of activities) {
      const activityProducts = await seckillModel.getActivityProducts(activity.id);
      totalProducts += activityProducts.length;
    }
    console.log(`   - 商品總數: ${totalProducts}`);
    console.log(`   - Redis Keys 設置完成`);

  } catch (error) {
    console.error('❌ Redis 初始化失敗:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  initMultiProductsRedis()
    .then(() => {
      console.log('✅ 腳本執行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 腳本執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { initMultiProductsRedis };
