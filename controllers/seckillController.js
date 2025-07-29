const seckillService = require('../services/seckillService');

class SeckillController {
  async purchase(req, res) {
    try {
      const { activityId, productId, quantity = 1 } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // 參數驗證
      if (!activityId) {
        return res.status(400).json({
          success: false,
          message: '活動ID不能為空'
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: '商品ID不能為空'
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: '購買數量必須大於0'
        });
      }

      const result = await seckillService.executeSeckill(
        userId,
        activityId,
        productId,
        quantity,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        message: '購買成功',
        data: result
      });

    } catch (error) {
      console.error('秒殺購買失敗:', error);

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new SeckillController();
