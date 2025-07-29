const { query } = require('../config/database');

async function createMultiProducts() {
  try {
    console.log('開始創建多商品和活動...');

    // 1. 創建更多商品
    console.log('1. 創建更多商品...');
    const products = [
      {
        id: 2,
        name: 'MacBook Pro 14',
        description: '蘋果專業筆記本電腦',
        original_price: 19999.00,
        seckill_price: 15999.00,
        category: '電腦'
      },
      {
        id: 3,
        name: 'AirPods Pro',
        description: '蘋果無線降噪耳機',
        original_price: 2499.00,
        seckill_price: 1999.00,
        category: '配件'
      },
      {
        id: 4,
        name: 'iPad Air',
        description: '蘋果平板電腦',
        original_price: 4999.00,
        seckill_price: 3999.00,
        category: '平板'
      }
    ];

    for (const product of products) {
      await query(`
        INSERT INTO products (id, name, description, original_price, seckill_price, category, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          seckill_price = VALUES(seckill_price)
      `, [product.id, product.name, product.description, product.original_price, product.seckill_price, product.category]);

      console.log(`✅ 商品創建成功: ${product.name}`);
    }

    // 2. 創建更多活動
    console.log('\n2. 創建更多活動...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1天前開始
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天後結束

    const activities = [
      {
        id: 2,
        product_id: 2,
        activity_name: 'MacBook Pro 14 秒殺活動',
        max_purchase_per_user: 1,
        total_stock: 50,
        available_stock: 50
      },
      {
        id: 3,
        product_id: 3,
        activity_name: 'AirPods Pro 秒殺活動',
        max_purchase_per_user: 2,
        total_stock: 100,
        available_stock: 100
      },
      {
        id: 4,
        product_id: 4,
        activity_name: 'iPad Air 秒殺活動',
        max_purchase_per_user: 1,
        total_stock: 30,
        available_stock: 30
      }
    ];

    for (const activity of activities) {
      await query(`
        INSERT INTO seckill_activities (
          id, product_id, activity_name, start_time, end_time,
          total_stock, available_stock, reserved_stock,
          max_purchase_per_user, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'active', NOW())
        ON DUPLICATE KEY UPDATE 
          activity_name = VALUES(activity_name),
          max_purchase_per_user = VALUES(max_purchase_per_user),
          available_stock = VALUES(available_stock)
      `, [
        activity.id, activity.product_id, activity.activity_name,
        startTime, endTime, activity.total_stock, activity.available_stock,
        activity.max_purchase_per_user
      ]);

      console.log(`✅ 活動創建成功: ${activity.activity_name}`);
    }

    console.log('\n🎉 多商品和活動創建完成！');
    console.log('\n📊 活動列表:');
    console.log('   - 活動1: iPhone 15 Pro (每人限購1件)');
    console.log('   - 活動2: MacBook Pro 14 (每人限購1件)');
    console.log('   - 活動3: AirPods Pro (每人限購2件)');
    console.log('   - 活動4: iPad Air (每人限購1件)');

  } catch (error) {
    console.error('❌ 創建多商品失敗:', error);
  }
}

// 運行腳本
if (require.main === module) {
  createMultiProducts();
}

module.exports = { createMultiProducts }; 