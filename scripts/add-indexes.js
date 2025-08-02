const { query, testConnection } = require('../config/database');

async function addNecessaryIndexes() {
  try {
    console.log('開始添加必要的索引...\n');

    // 測試數據庫連接
    await testConnection();

    // 定義需要添加的索引
    const indexesToAdd = [
      // users 表
      { table: 'users', name: 'idx_username', columns: 'username' },
      { table: 'users', name: 'idx_email', columns: 'email' },
      { table: 'users', name: 'idx_status', columns: 'status' },

      // products 表
      { table: 'products', name: 'idx_status', columns: 'status' },
      { table: 'products', name: 'idx_category', columns: 'category' },

      // seckill_activities 表

      // orders 表
      { table: 'orders', name: 'idx_order_no', columns: 'order_no' },
      { table: 'orders', name: 'idx_user_id', columns: 'user_id' },
      { table: 'orders', name: 'idx_activity_id', columns: 'activity_id' },
      { table: 'orders', name: 'idx_status', columns: 'status' },
      { table: 'orders', name: 'idx_payment_timeout', columns: 'payment_timeout' },

      // inventory_logs 表
      { table: 'inventory_logs', name: 'idx_activity_id', columns: 'activity_id' },
      { table: 'inventory_logs', name: 'idx_order_id', columns: 'order_id' },
      { table: 'inventory_logs', name: 'idx_change_type', columns: 'change_type' },
      { table: 'inventory_logs', name: 'idx_created_at', columns: 'created_at' },

      // user_purchases 表
      { table: 'user_purchases', name: 'idx_user_id', columns: 'user_id' },
      { table: 'user_purchases', name: 'idx_activity_id', columns: 'activity_id' },

      // system_configs 表
      { table: 'system_configs', name: 'idx_config_key', columns: 'config_key' },

      // operation_logs 表
      { table: 'operation_logs', name: 'idx_user_id', columns: 'user_id' },
      { table: 'operation_logs', name: 'idx_action', columns: 'action' },
      { table: 'operation_logs', name: 'idx_created_at', columns: 'created_at' }
    ];

    for (const indexInfo of indexesToAdd) {
      try {
        console.log(`添加索引: ${indexInfo.table}.${indexInfo.name} (${indexInfo.columns})`);
        await query(`CREATE INDEX ${indexInfo.name} ON ${indexInfo.table} (${indexInfo.columns})`);
        console.log(`  ✅ 成功添加索引: ${indexInfo.name}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`  ⚠️  索引已存在: ${indexInfo.name}`);
        } else {
          console.log(`  ❌ 添加索引失敗: ${indexInfo.name} - ${error.message}`);
        }
      }
    }

    console.log('\n✅ 索引添加完成！');

  } catch (error) {
    console.error('❌ 添加索引失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  addNecessaryIndexes();
}

module.exports = { addNecessaryIndexes }; 