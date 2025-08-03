#!/usr/bin/env node

/**
 * 訂單隊列處理器
 * 用於處理異步訂單創建
 */

const seckillService = require('../services/seckillService');

async function startOrderQueueProcessor() {
  console.log('🚀 啟動訂單隊列處理器...');

  try {
    // 啟動隊列處理
    await seckillService.processOrderQueue();
  } catch (error) {
    console.error('❌ 訂單隊列處理器錯誤:', error);
    process.exit(1);
  }
}

// 處理進程信號
process.on('SIGINT', () => {
  console.log('\n🛑 收到中斷信號，正在關閉訂單隊列處理器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到終止信號，正在關閉訂單隊列處理器...');
  process.exit(0);
});

// 啟動處理器
startOrderQueueProcessor(); 