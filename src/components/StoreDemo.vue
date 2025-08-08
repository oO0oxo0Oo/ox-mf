<template>
  <div class="store-demo">
    <h2>Pinia Store 演示</h2>
    
    <!-- 游戏状态 -->
    <div class="section">
      <h3>游戏状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span>游戏状态:</span>
          <span :class="gameStore.isPlaying ? 'active' : 'inactive'">
            {{ gameStore.isPlaying ? '进行中' : '未开始' }}
          </span>
        </div>
        <div class="status-item">
          <span>分数:</span>
          <span>{{ gameStore.score }}</span>
        </div>
        <div class="status-item">
          <span>等级:</span>
          <span>{{ gameStore.level }}</span>
        </div>
      </div>
      
      <div class="actions">
        <button @click="gameStore.startGame()" :disabled="gameStore.isPlaying">
          开始游戏
        </button>
        <button @click="gameStore.pauseGame()" :disabled="!gameStore.isPlaying">
          暂停
        </button>
        <button @click="gameStore.resetGame()" :disabled="!gameStore.isPlaying">
          重置
        </button>
        <button @click="addPoints">+100分</button>
        <button @click="gameStore.nextLevel()">升级</button>
      </div>
    </div>
    
    <!-- 架构说明 -->
    <div class="section">
      <h3>架构说明</h3>
      <div class="architecture-info">
        <p><strong>Game Store:</strong> 管理游戏的核心状态，包括分数、等级、游戏状态等</p>
        <p><strong>World 组件:</strong> 提供Three.js场景渲染功能</p>
        <p><strong>组合使用:</strong> Store通过ref引用World组件来访问Three.js对象和方法</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores'

const gameStore = useGameStore()

// 添加分数的方法
const addPoints = () => {
  gameStore.addScore(100)
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