const { ensureConnected } = require('../config/redis');
const seckillService = require('../services/seckillService');
const luaScriptManager = require('../utils/luaScriptManager');

async function testSeckillPerformance() {
  try {
    console.log('🧪 開始測試秒殺性能...');

    // 1. 檢查 Lua 腳本是否加載
    console.log('\n📜 檢查 Lua 腳本...');
    const scriptNames = luaScriptManager.getScriptNames();
    console.log(`   已加載的腳本: ${scriptNames.join(', ')}`);

    const seckillScript = luaScriptManager.getScript('seckill');
    const rollbackScript = luaScriptManager.getScript('rollback-stock');

    if (!seckillScript) {
      throw new Error('seckill.lua 腳本未找到');
    }
    if (!rollbackScript) {
      throw new Error('rollback-stock.lua 腳本未找到');
    }
    console.log('   ✅ Lua 腳本加載成功');

    // 2. 測試 Redis 連接
    console.log('\n🔗 測試 Redis 連接...');
    const redisClient = await ensureConnected();
    await redisClient.ping();
    console.log('   ✅ Redis 連接正常');

    // 3. 模擬高併發測試
    console.log('\n⚡ 模擬高併發測試...');

    // 設置測試數據
    const testActivityId = 1;
    const testProductId = 1;
    const testUserId = 1;
    const initialStock = 100;

    // 初始化測試庫存
    const stockKey = `seckill:activity:${testActivityId}:product:${testProductId}:stock`;
    const reservedStockKey = `seckill:activity:${testActivityId}:product:${testProductId}:reserved`;
    const userPurchaseKey = `seckill:user:${testUserId}:activity:${testActivityId}:product:${testProductId}`;

    await redisClient.set(stockKey, initialStock);
    await redisClient.set(reservedStockKey, 0);
    await redisClient.del(userPurchaseKey);

    console.log(`   📦 設置初始庫存: ${initialStock}`);

    // 模擬併發請求
    const concurrentRequests = 50;
    const promises = [];

    console.log(`   🚀 發起 ${concurrentRequests} 個併發請求...`);

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        (async () => {
          try {
            // 模擬不同的用戶ID
            const userId = testUserId + i;
            const userKey = `seckill:user:${userId}:activity:${testActivityId}:product:${testProductId}`;

            // 執行 Lua 腳本
            const result = await redisClient.eval(
              seckillScript,
              3,
              userKey,
              stockKey,
              reservedStockKey,
              '1', // 購買數量
              '5', // 限購數量
              '86400' // 過期時間
            );

            return { success: true, userId, result };
          } catch (error) {
            return { success: false, userId: testUserId + i, error: error.message };
          }
        })()
      );
    }

    // 等待所有請求完成
    const results = await Promise.all(promises);
    const endTime = Date.now();

    // 統計結果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalTime = endTime - startTime;

    console.log(`\n📊 測試結果:`);
    console.log(`   - 總請求數: ${concurrentRequests}`);
    console.log(`   - 成功數: ${successCount}`);
    console.log(`   - 失敗數: ${failCount}`);
    console.log(`   - 總耗時: ${totalTime}ms`);
    console.log(`   - 平均響應時間: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
    console.log(`   - QPS: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);

    // 檢查最終庫存
    const finalStock = await redisClient.get(stockKey);
    const finalReserved = await redisClient.get(reservedStockKey);

    console.log(`\n📦 庫存狀態:`);
    console.log(`   - 剩餘庫存: ${finalStock}`);
    console.log(`   - 已預扣庫存: ${finalReserved}`);
    console.log(`   - 庫存變化: ${initialStock - finalStock}`);

    // 驗證庫存一致性
    if (parseInt(finalStock) + parseInt(finalReserved) === initialStock) {
      console.log('   ✅ 庫存一致性檢查通過');
    } else {
      console.log('   ❌ 庫存一致性檢查失敗');
    }

    console.log('\n🎉 性能測試完成！');

  } catch (error) {
    console.error('❌ 性能測試失敗:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testSeckillPerformance()
    .then(() => {
      console.log('✅ 測試執行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { testSeckillPerformance }; 