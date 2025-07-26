const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 導入路由
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/product');
// const orderRoutes = require('./routes/order');
// const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中間件
app.use(helmet());
app.use(cors());

// 限流中間件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 限制每個IP 15分鐘內最多100個請求
  message: '請求過於頻繁，請稍後再試'
});
app.use('/api/', limiter);

// 解析請求體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態文件
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/inventory', inventoryRoutes);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ error: '路由不存在' });
});

// 全局錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服務器內部錯誤' });
});

app.listen(PORT, () => {
  console.log(`服務器運行在端口 ${PORT}`);
});

module.exports = app; 