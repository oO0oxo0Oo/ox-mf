<template>
  <div class="cube-demo">
    <h2>魔方 Store + Composable 演示</h2>
    
    <!-- 魔方状态 -->
    <div class="section">
      <h3>魔方状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span>初始化状态:</span>
          <span :class="cubeStore.isInitialized ? 'active' : 'inactive'">
            {{ cubeStore.isInitialized ? '已初始化' : '未初始化' }}
          </span>
        </div>
        <div class="status-item">
          <span>当前状态:</span>
          <span>{{ cubeStore.currentState }}</span>
        </div>
        <div class="status-item">
          <span>移动次数:</span>
          <span>{{ cubeStore.cubeData.moves.length }}</span>
        </div>
        <div class="status-item">
          <span>解决状态:</span>
          <span :class="cubeStore.cubeData.isSolved ? 'solved' : 'unsolved'">
            {{ cubeStore.cubeData.isSolved ? '已解决' : '未解决' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="section">
      <h3>魔方控制</h3>
      <div class="controls">
        <button @click="initCube" :disabled="cubeStore.isInitialized">
          初始化魔方
        </button>
        <button @click="resetCube" :disabled="!cubeStore.isInitialized">
          重置魔方
        </button>
        <button @click="addRandomMove" :disabled="!cubeStore.isInitialized">
          添加随机移动
        </button>
        <button @click="setSolved" :disabled="!cubeStore.isInitialized">
          标记为已解决
        </button>
        <button @click="resetMoves" :disabled="cubeStore.cubeData.moves.length === 0">
          清空移动记录
        </button>
      </div>
    </div>

    <!-- 移动记录 -->
    <div class="section" v-if="cubeStore.cubeData.moves.length > 0">
      <h3>移动记录</h3>
      <div class="moves-list">
        <div 
          v-for="(move, index) in cubeStore.cubeData.moves" 
          :key="index"
          class="move-item"
        >
          {{ index + 1 }}. {{ move }}
        </div>
      </div>
    </div>

    <!-- 架构说明 -->
    <div class="section">
      <h3>架构说明</h3>
      <div class="architecture-info">
        <p><strong>Store (useCubeStore):</strong> 管理魔方的全局状态，如初始化状态、移动记录、解决状态等</p>
        <p><strong>Composable (useCube):</strong> 提供魔方的核心逻辑，如Three.js对象创建、模型生成、重置等</p>
        <p><strong>组合使用:</strong> Store调用Composable来执行具体操作，同时管理相关的状态</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useGameStore, useCubeStore } from '../stores'

const gameStore = useGameStore()
const cubeStore = useCubeStore()

// 初始化魔方
function initCube() {
  console.log('initCube函数被调用')
  const worldMethods = gameStore.getWorldMethods()
  console.log('worldMethods:', worldMethods)
  if (worldMethods && worldMethods.scene) {
    console.log('开始初始化魔方...')
    cubeStore.initCube(worldMethods.scene)
  } else {
    console.warn('World scene not available')
  }
}

// 重置魔方
function resetCube() {
  cubeStore.resetCube()
}

// 添加随机移动
function addRandomMove() {
  const moves = ['R', 'L', 'U', 'D', 'F', 'B', 'R\'', 'L\'', 'U\'', 'D\'', 'F\'', 'B\'']
  const randomMove = moves[Math.floor(Math.random() * moves.length)]
  cubeStore.addMove(randomMove)
}

// 设置解决状态
function setSolved() {
  cubeStore.setSolved(true)
  cubeStore.setState('solved')
}

// 重置移动记录
function resetMoves() {
  cubeStore.resetMoves()
}

onMounted(() => {
  console.log('Cube Demo mounted')
  console.log('Game Store:', gameStore)
  console.log('Cube Store:', cubeStore)
})
</script>

<style scoped>
.cube-demo {
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

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.controls button:hover:not(:disabled) {
  background: #3730a3;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.moves-list {
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 10px;
}

.move-item {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.move-item:last-child {
  border-bottom: none;
}

.active {
  color: #059669;
  font-weight: bold;
}

.inactive {
  color: #dc2626;
  font-weight: bold;
}

.solved {
  color: #059669;
  font-weight: bold;
}

.unsolved {
  color: #dc2626;
  font-weight: bold;
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