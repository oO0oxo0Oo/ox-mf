<template>
  <div class="store-demo">
    <h2>Pinia Store 演示</h2>
    
    <!-- 游戏状态 -->
    <div class="section">
      <h3>游戏状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span>游戏状态:</span>
          <span class="inactive">已简化</span>
        </div>
        <div class="status-item">
          <span>分数:</span>
          <span>0</span>
        </div>
        <div class="status-item">
          <span>等级:</span>
          <span>1</span>
        </div>
      </div>
      
      <div class="actions">
        <button @click="addPoints">+100分</button>
        <button disabled>开始游戏</button>
        <button disabled>暂停</button>
        <button disabled>重置</button>
        <button disabled>升级</button>
      </div>
    </div>
    
    <!-- 架构说明 -->
    <div class="section">
      <h3>架构说明</h3>
      <div class="architecture-info">
        <p><strong>架构已简化:</strong> 移除了不必要的 game store，直接使用 World 组件</p>
        <p><strong>World 组件:</strong> 提供Three.js场景渲染功能</p>
        <p><strong>直接引用:</strong> 组件直接引用 World 组件，无需中间层</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 添加分数的方法
const addPoints = () => {
  // 游戏逻辑已简化，不再需要 game store
  console.log('添加分数功能已简化')
}
</script>

<style scoped>
.store-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #4f46e5;
  padding-bottom: 10px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-item span:first-child {
  font-weight: bold;
  color: #666;
}

.active {
  color: #22c55e;
  font-weight: bold;
}

.inactive {
  color: #ef4444;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #3730a3;
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.architecture-info {
  background: white;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.6;
}

.architecture-info p {
  margin: 10px 0;
}
</style> 