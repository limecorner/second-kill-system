const { query } = require('../config/database');

async function createActivityWithMultiProducts() {
  try {
    console.log('開始創建活動1的多商品設置...');

    // 1. 確保有足夠的商品
    console.log('1. 檢查和創建商品...');
    const products = [
      {
        id: 1,
        name: 'iPhone 15 Pro',
        description: '蘋果最新旗艦手機',
        original_price: 9999.00,
        seckill_price: 999.00,
        category: '手機'
      },
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

      console.log(`✅ 商品確認: ${product.name}`);
    }

    // 2. 創建活動商品關聯表（如果不存在）
    console.log('\n2. 創建活動商品關聯表...');
    await query(`
      CREATE TABLE IF NOT EXISTS activity_products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        activity_id INT NOT NULL,
        product_id INT NOT NULL,
        max_purchase_per_user INT DEFAULT 1,
        available_stock INT NOT NULL,
        reserved_stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES seckill_activities(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE KEY unique_activity_product (activity_id, product_id)
      )
    `);

    console.log('✅ 活動商品關聯表創建成功');

    // 3. 插入活動1的商品關聯
    console.log('\n3. 設置活動1的商品關聯...');
    const activityProducts = [
      { product_id: 1, max_purchase_per_user: 1, available_stock: 50 },
      { product_id: 2, max_purchase_per_user: 2, available_stock: 30 },
      { product_id: 3, max_purchase_per_user: 3, available_stock: 100 }
    ];

    for (const ap of activityProducts) {
      await query(`
        INSERT INTO activity_products (activity_id, product_id, max_purchase_per_user, available_stock, reserved_stock)
        VALUES (1, ?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE 
          max_purchase_per_user = VALUES(max_purchase_per_user),
          available_stock = VALUES(available_stock)
      `, [ap.product_id, ap.max_purchase_per_user, ap.available_stock]);

      console.log(`✅ 商品${ap.product_id}設置完成: 每人限購${ap.max_purchase_per_user}件`);
    }

    console.log('\n🎉 活動1多商品設置完成！');
    console.log('\n📊 活動1商品列表:');
    console.log('   - 商品1 (iPhone 15 Pro): 每人限購1件');
    console.log('   - 商品2 (MacBook Pro 14): 每人限購2件');
    console.log('   - 商品3 (AirPods Pro): 每人限購3件');

  } catch (error) {
    console.error('❌ 創建活動多商品失敗:', error);
  }
}

// 運行腳本
if (require.main === module) {
  createActivityWithMultiProducts();
}

module.exports = { createActivityWithMultiProducts }; 