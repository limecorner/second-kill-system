const { query, testConnection } = require('../config/database');

async function removeAllIndexes() {
  try {
    console.log('開始移除所有表的索引...');

    // 測試數據庫連接
    await testConnection();

    // 獲取所有表名
    const tables = await query('SHOW TABLES');
    console.log('發現的表:', tables.map(t => Object.values(t)[0]));

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n處理表: ${tableName}`);

      // 獲取表的所有索引（除了主鍵）
      const indexes = await query(`
        SELECT INDEX_NAME, COLUMN_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND INDEX_NAME != 'PRIMARY'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);

      if (indexes.length === 0) {
        console.log(`  - ${tableName}: 沒有需要移除的索引`);
        continue;
      }

      // 按索引名分組
      const indexGroups = {};
      indexes.forEach(index => {
        if (!indexGroups[index.INDEX_NAME]) {
          indexGroups[index.INDEX_NAME] = [];
        }
        indexGroups[index.INDEX_NAME].push(index.COLUMN_NAME);
      });

      // 移除每個索引
      for (const [indexName, columns] of Object.entries(indexGroups)) {
        try {
          console.log(`  - 移除索引: ${indexName} (${columns.join(', ')})`);
          await query(`ALTER TABLE ${tableName} DROP INDEX ${indexName}`);
          console.log(`    ✅ 成功移除索引: ${indexName}`);
        } catch (error) {
          console.log(`    ❌ 移除索引失敗: ${indexName} - ${error.message}`);
        }
      }
    }

    console.log('\n✅ 索引移除完成！');
    console.log('\n注意：');
    console.log('- 主鍵索引被保留');
    console.log('- 外鍵約束被保留');
    console.log('- 唯一約束被移除');
    console.log('- 普通索引被移除');

  } catch (error) {
    console.error('❌ 移除索引失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  removeAllIndexes();
}

module.exports = { removeAllIndexes }; 