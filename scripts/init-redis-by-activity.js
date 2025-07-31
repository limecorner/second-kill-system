const { ensureConnected } = require('../config/redis');
const seckillModel = require('../models/seckillModel');

async function initRedisByActivity(activityId) {
  try {
    console.log(`🚀 開始初始化活動 ${activityId} 的 Redis 資料...`);

    const redisClient = await ensureConnected();

    // 1. 獲取活動詳情
    const activity = await seckillModel.getActivityById(activityId);
    if (!activity) {
      throw new Error(`活動 ${activityId} 不存在`);
    }

    console.log(`📋 活動: ${activity.activity_name} (ID: ${activity.id})`);

    // 2. 獲取活動中的所有商品
    const activityProducts = await seckillModel.getActivityProducts(activityId);
    console.log(`📦 活動包含 ${activityProducts.length} 個商品`);

    if (activityProducts.length === 0) {
      console.log('⚠️  警告: 該活動沒有商品');
      return;
    }

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

      // 4. 設置商品限購信息
      const productLimitKey = `seckill:activity:${activity.id}:product:${product.product_id}:limit`;
      await redisClient.set(productLimitKey, product.max_purchase_per_user);
      console.log(`     ✅ 設置限購數量: ${product.max_purchase_per_user} (Key: ${productLimitKey})`);

      // 5. 設置商品價格信息
      const productPriceKey = `seckill:activity:${activity.id}:product:${product.product_id}:price`;
      await redisClient.set(productPriceKey, product.seckill_price);
      console.log(`     ✅ 設置秒殺價格: ${product.seckill_price} (Key: ${productPriceKey})`);
    }

    // 6. 設置活動狀態
    const activityStatusKey = `seckill:activity:${activity.id}:status`;
    await redisClient.set(activityStatusKey, activity.status);
    console.log(`✅ 設置活動狀態: ${activity.status} (Key: ${activityStatusKey})`);

    // 7. 設置活動時間範圍
    const activityStartKey = `seckill:activity:${activity.id}:start_time`;
    const activityEndKey = `seckill:activity:${activity.id}:end_time`;
    await redisClient.set(activityStartKey, activity.start_time);
    await redisClient.set(activityEndKey, activity.end_time);
    console.log(`✅ 設置活動時間: ${activity.start_time} - ${activity.end_time}`);

    // 8. 清理該活動的用戶購買記錄（可選）
    console.log('\n🧹 清理該活動的用戶購買記錄...');
    const userPurchasePattern = `seckill:user:*:activity:${activity.id}:product:*`;
    const userPurchaseKeys = await redisClient.keys(userPurchasePattern);

    if (userPurchaseKeys.length > 0) {
      console.log(`   找到 ${userPurchaseKeys.length} 個用戶購買記錄`);
      for (const key of userPurchaseKeys) {
        await redisClient.del(key);
      }
      console.log('   ✅ 已清理用戶購買記錄');
    } else {
      console.log('   ℹ️  沒有找到用戶購買記錄');
    }

    console.log('\n🎉 Redis 初始化完成！');
    console.log('\n📊 初始化摘要:');
    console.log(`   - 活動: ${activity.activity_name}`);
    console.log(`   - 商品數量: ${activityProducts.length}`);
    console.log(`   - Redis Keys 設置完成`);

  } catch (error) {
    console.error('❌ Redis 初始化失敗:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const activityId = process.argv[2];

  if (!activityId) {
    console.error('❌ 請提供活動 ID');
    console.log('使用方法: node init-redis-by-activity.js <activity_id>');
    process.exit(1);
  }

  initRedisByActivity(parseInt(activityId))
    .then(() => {
      console.log('✅ 腳本執行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 腳本執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { initRedisByActivity }; 