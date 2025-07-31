const { query, testConnection } = require('../config/database');

async function resetData() {
  try {
    console.log('開始重置數據...\n');

    // 測試數據庫連接
    await testConnection();

    // 1. 清空指定的表格
    console.log('1. 清空表格數據...');

    const tablesToClear = [
      'user_purchases',
      'orders',
      'operation_logs',
      'inventory_logs'
    ];

    for (const table of tablesToClear) {
      try {
        await query(`DELETE FROM ${table}`);
        console.log(`✅ 已清空 ${table} 表格`);
      } catch (error) {
        console.log(`⚠️  清空 ${table} 表格時發生錯誤: ${error.message}`);
      }
    }

    // 2. 更新 activity_products 表格的庫存
    console.log('\n2. 更新 activity_products 庫存...');

    const stockUpdates = [
      { activity_id: 1, product_id: 1, available_stock: 10, reserved_stock: 0 },
      { activity_id: 1, product_id: 2, available_stock: 20, reserved_stock: 0 },
      { activity_id: 1, product_id: 3, available_stock: 30, reserved_stock: 0 },
      { activity_id: 2, product_id: 1, available_stock: 40, reserved_stock: 0 },
      { activity_id: 2, product_id: 2, available_stock: 50, reserved_stock: 0 },
      { activity_id: 2, product_id: 3, available_stock: 60, reserved_stock: 0 }
    ];

    for (const update of stockUpdates) {
      try {
        // 檢查記錄是否存在
        const existingRecord = await query(
          'SELECT * FROM activity_products WHERE activity_id = ? AND product_id = ?',
          [update.activity_id, update.product_id]
        );

        if (existingRecord.length > 0) {
          // 更新現有記錄
          await query(
            'UPDATE activity_products SET available_stock = ?, reserved_stock = ? WHERE activity_id = ? AND product_id = ?',
            [update.available_stock, update.reserved_stock, update.activity_id, update.product_id]
          );
          console.log(`✅ 已更新 activity_id=${update.activity_id}, product_id=${update.product_id}: available_stock=${update.available_stock}, reserved_stock=${update.reserved_stock}`);
        } else {
          // 插入新記錄
          await query(
            'INSERT INTO activity_products (activity_id, product_id, available_stock, reserved_stock) VALUES (?, ?, ?, ?)',
            [update.activity_id, update.product_id, update.available_stock, update.reserved_stock]
          );
          console.log(`✅ 已新增 activity_id=${update.activity_id}, product_id=${update.product_id}: available_stock=${update.available_stock}, reserved_stock=${update.reserved_stock}`);
        }
      } catch (error) {
        console.log(`❌ 更新 activity_id=${update.activity_id}, product_id=${update.product_id} 時發生錯誤: ${error.message}`);
      }
    }

    // 3. 顯示更新結果
    console.log('\n3. 顯示更新結果...');
    const result = await query(`
      SELECT activity_id, product_id, available_stock, reserved_stock 
      FROM activity_products 
      WHERE (activity_id = 1 AND product_id IN (1, 2, 3)) 
         OR (activity_id = 2 AND product_id IN (1, 2, 3))
      ORDER BY activity_id, product_id
    `);

    console.log('\n📋 當前 activity_products 狀態:');
    console.log('activity_id | product_id | available_stock | reserved_stock');
    console.log('------------|------------|-----------------|---------------');

    for (const row of result) {
      console.log(`${row.activity_id.toString().padStart(10)} | ${row.product_id.toString().padStart(10)} | ${row.available_stock.toString().padStart(15)} | ${row.reserved_stock.toString().padStart(13)}`);
    }

    console.log('\n✅ 數據重置完成！');
    console.log('\n📝 操作摘要:');
    console.log('- 已清空 user_purchases, orders, operation_logs, inventory_logs 表格');
    console.log('- 已更新 activity_products 表格的庫存設置');

  } catch (error) {
    console.error('❌ 重置數據失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  resetData();
}

module.exports = { resetData }; 