const { query, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/database');

class SeckillModel {
  // 獲取所有活動
  async getAllActivities() {
    const sql = `
      SELECT 
        a.*,
        p.name as product_name,
        p.description as product_description,
        p.original_price,
        p.seckill_price
      FROM seckill_activities a
      JOIN products p ON a.product_id = p.id
      ORDER BY a.created_at DESC
    `;
    const rows = await query(sql);
    return rows;
  }

  // 獲取活動詳情
  async getActivityById(activityId) {
    const sql = `
      SELECT 
        a.*,
        p.name as product_name,
        p.description as product_description,
        p.original_price,
        p.seckill_price
      FROM seckill_activities a
      JOIN products p ON a.product_id = p.id
      WHERE a.id = ?
    `;
    const rows = await query(sql, [activityId]);
    return rows[0];
  }

  // 獲取活動中的所有商品
  async getActivityProducts(activityId) {
    const sql = `
      SELECT 
        ap.*,
        p.name as product_name,
        p.description as product_description,
        p.original_price,
        p.seckill_price,
        p.category
      FROM activity_products ap
      JOIN products p ON ap.product_id = p.id
      WHERE ap.activity_id = ?
    `;
    const rows = await query(sql, [activityId]);
    return rows;
  }

  // 獲取活動中特定商品的限購信息
  async getActivityProductLimit(activityId, productId) {
    const sql = `
      SELECT * FROM activity_products 
      WHERE activity_id = ? AND product_id = ?
    `;
    const rows = await query(sql, [activityId, productId]);
    return rows[0];
  }

  // 獲取商品信息
  async getProductById(productId) {
    const sql = `
      SELECT * FROM products WHERE id = ?
    `;
    const rows = await query(sql, [productId]);
    return rows[0];
  }

  // 檢查用戶購買記錄
  async getUserPurchaseRecord(userId, activityId) {
    const sql = `
      SELECT 
        user_id,
        activity_id,
        SUM(quantity) as total_quantity,
        COUNT(*) as order_count
      FROM orders 
      WHERE user_id = ? AND activity_id = ? AND status = 'paid'
      GROUP BY user_id, activity_id
    `;
    const rows = await query(sql, [userId, activityId]);
    return rows[0];
  }

  // 創建訂單
  async createOrder(orderData) {
    const sql = `
      INSERT INTO orders (
        order_no, user_id, activity_id, product_id, 
        quantity, unit_price, total_amount, 
        status, payment_timeout, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    `;

    const values = [
      orderData.orderNo,
      orderData.userId,
      orderData.activityId,
      orderData.productId,
      orderData.quantity,
      orderData.unitPrice,
      orderData.totalAmount,
      orderData.paymentTimeout
    ];

    const result = await query(sql, values);
    return result.insertId;
  }

  // 獲取訂單詳情
  async getOrderById(orderId) {
    const sql = `
      SELECT * FROM orders WHERE id = ?
    `;
    const rows = await query(sql, [orderId]);
    return rows[0];
  }

  // 更新訂單狀態
  async updateOrderStatus(orderId, status, paymentTime = null) {
    let sql = `UPDATE orders SET status = ? WHERE id = ?`;
    let values = [status, orderId];

    if (paymentTime) {
      sql = `UPDATE orders SET status = ?, paid_at = ? WHERE id = ?`;
      values = [status, paymentTime, orderId];
    }

    await query(sql, values);
  }

  // 記錄操作日誌
  async logOperation(userId, operation, entityType, entityId, details, ipAddress, userAgent) {
    const sql = `
      INSERT INTO operation_logs (
        user_id, action, target_type, target_id, 
        details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      userId,
      operation,
      entityType,
      entityId,
      JSON.stringify(details),
      ipAddress,
      userAgent
    ];

    await query(sql, values);
  }
}

module.exports = new SeckillModel(); 