const { query, testConnection } = require('../config/database');

async function showAllIndexes() {
  try {
    console.log('查看所有表的索引...\n');

    // 測試數據庫連接
    await testConnection();

    // 獲取所有表名
    const tables = await query('SHOW TABLES');

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`📋 表: ${tableName}`);

      // 獲取表的所有索引
      const indexes = await query(`
        SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX,
          CARDINALITY,
          INDEX_TYPE
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);

      if (indexes.length === 0) {
        console.log('  - 沒有索引');
        continue;
      }

      // 按索引名分組
      const indexGroups = {};
      indexes.forEach(index => {
        if (!indexGroups[index.INDEX_NAME]) {
          indexGroups[index.INDEX_NAME] = {
            columns: [],
            isUnique: !index.NON_UNIQUE,
            type: index.INDEX_TYPE
          };
        }
        indexGroups[index.INDEX_NAME].columns.push(index.COLUMN_NAME);
      });

      // 顯示每個索引
      for (const [indexName, indexInfo] of Object.entries(indexGroups)) {
        const uniqueText = indexInfo.isUnique ? 'UNIQUE' : 'INDEX';
        const typeText = indexName === 'PRIMARY' ? 'PRIMARY KEY' : uniqueText;
        console.log(`  - ${indexName}: ${typeText} (${indexInfo.columns.join(', ')})`);
      }

      console.log('');
    }

    console.log('✅ 索引查看完成！');

  } catch (error) {
    console.error('❌ 查看索引失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  showAllIndexes();
}

module.exports = { showAllIndexes }; 