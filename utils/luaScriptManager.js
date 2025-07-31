const fs = require('fs');
const path = require('path');

class LuaScriptManager {
  constructor() {
    this.scripts = new Map();
    this.scriptHashes = new Map();
    this.loadScripts();
  }

  // 加載所有 Lua 腳本
  loadScripts() {
    const luaDir = path.join(__dirname, '../lua');

    try {
      const files = fs.readdirSync(luaDir);

      files.forEach(file => {
        if (file.endsWith('.lua')) {
          const scriptName = file.replace('.lua', '');
          const scriptPath = path.join(luaDir, file);
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');

          this.scripts.set(scriptName, scriptContent);
          console.log(`📜 已加載 Lua 腳本: ${scriptName}`);
        }
      });
    } catch (error) {
      console.error('❌ 加載 Lua 腳本失敗:', error);
    }
  }

  // 獲取腳本內容
  getScript(scriptName) {
    return this.scripts.get(scriptName);
  }

  // 獲取腳本哈希（用於 EVALSHA）
  getScriptHash(scriptName) {
    return this.scriptHashes.get(scriptName);
  }

  // 設置腳本哈希
  setScriptHash(scriptName, hash) {
    this.scriptHashes.set(scriptName, hash);
  }

  // 獲取所有腳本名稱
  getScriptNames() {
    return Array.from(this.scripts.keys());
  }

  // 重新加載腳本
  reloadScripts() {
    this.scripts.clear();
    this.scriptHashes.clear();
    this.loadScripts();
  }
}

module.exports = new LuaScriptManager(); 