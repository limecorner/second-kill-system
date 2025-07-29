const { query, testConnection } = require('../config/database');

let sql = "UPDATE users SET id = CASE username\n";

for (let i = 1; i <= 10000; i++) {
  sql += `  WHEN 'user${i}' THEN ${i}\n`;
}

sql += "END\nWHERE username IN (\n";

for (let i = 1; i <= 10000; i++) {
  sql += `'user${i}'${i < 10000 ? ',' : ''}\n`;
}

sql += ");";

async function updateUserId() {
  await query(sql);
  console.log('updateUserId success');
  process.exit(0);
}

// 如果直接運行此腳本
if (require.main === module) {
  updateUserId();
}

// UPDATE users SET id = CASE username
//   WHEN 'user1' THEN 1
//   WHEN 'user2' THEN 2
//   ...
//   WHEN 'user10000' THEN 10000
// END
// WHERE username IN ('user1', 'user2', ..., 'user10000');
