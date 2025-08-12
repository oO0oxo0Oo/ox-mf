<template>
  <div class="cube-demo">
    <div ref="worldRef" class="world-container">
      <World ref="worldComponent" />
    </div>

    <!-- 开始动画控制按钮 -->
    <div class="animation-controls">
      <button 
        @click="startBeginAnimation" 
        class="start-btn"
        :class="{ 'active': isAnimationPlaying }"
      >
        {{ isAnimationPlaying ? '动画播放中...' : '开始动画' }}
      </button>
    </div>

    <!-- 贴片可见性控制按钮 -->
    <div class="edge-controls">
      <button 
        @click="toggleEdges" 
        class="edge-btn"
        :class="{ 'active': edgesVisible }"
      >
        {{ edgesVisible ? '隐藏贴片' : '显示贴片' }}
      </button>
    </div>

    <!-- 边长控制面板 -->
    <div class="size-controls">
      <div class="control-group">
        <label for="piece-size">自定义立方体边长: {{ (cubeStore.config.customPieceSize || cubeStore.config.pieceSize).toFixed(3) }}</label>
        <input
          id="piece-size"
          type="range"
          min="0.1"
          max="0.5"
          step="0.01"
          :value="cubeStore.config.customPieceSize || cubeStore.config.pieceSize"
          @input="updateCustomPieceSize"
          class="size-slider"
        />
        <div class="size-value">{{ (cubeStore.config.customPieceSize || cubeStore.config.pieceSize).toFixed(3) }}</div>
        <button @click="resetCustomPieceSize" class="reset-btn">重置边长</button>
      </div>

      <!-- 魔方外观控制 -->
      <div class="control-group">
        <label for="corner-radius">角半径: {{ cubeStore.config.pieceCornerRadius.toFixed(3) }}</label>
        <input
          id="corner-radius"
          type="range"
          min="0.0"
          max="0.5"
          step="0.01"
          :value="cubeStore.config.pieceCornerRadius"
          @input="updateCornerRadius"
          class="appearance-slider"
        />
        <div class="slider-value">{{ cubeStore.config.pieceCornerRadius.toFixed(3) }}</div>
      </div>

      <div class="control-group">
        <label for="edge-roundness">边缘圆润度: {{ cubeStore.config.edgeCornerRoundness.toFixed(3) }}</label>
        <input
          id="edge-roundness"
          type="range"
          min="0.0"
          max="0.5"
          step="0.01"
          :value="cubeStore.config.edgeCornerRoundness"
          @input="updateEdgeRoundness"
          class="appearance-slider"
        />
        <div class="slider-value">{{ cubeStore.config.edgeCornerRoundness.toFixed(3) }}</div>
      </div>

      <div class="control-group">
        <label for="edge-scale">边缘缩放: {{ cubeStore.config.edgeScale.toFixed(2) }}</label>
        <input
          id="edge-scale"
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          :value="cubeStore.config.edgeScale"
          @input="updateEdgeScale"
          class="appearance-slider"
        />
        <div class="slider-value">{{ cubeStore.config.edgeScale.toFixed(2) }}</div>
      </div>

      <button @click="resetAppearance" class="reset-btn">重置外观</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import World from '../components/World.vue'
import { useControls } from '../composable/useControls.js'
import { useGameStore, useCubeStore } from '../stores'

const worldRef = ref(null)
const worldComponent = ref(null)
let controls = null
let cubeInstance = null

  // 贴片可见性状态
  const edgesVisible = ref(false)

// 动画播放状态
const isAnimationPlaying = ref(false)

// Store 实例
const gameStore = useGameStore()
const cubeStore = useCubeStore()

// 开始Begin组件的动画
function startBeginAnimation() {
  if (isAnimationPlaying.value) {
    console.log('动画已在播放中...')
    return
  }
  
  console.log('开始播放Begin组件动画...')
  isAnimationPlaying.value = true
  
  // 通过事件总线或全局状态来触发Begin组件的动画
  // 这里我们使用自定义事件来通知Begin组件
  window.dispatchEvent(new CustomEvent('startBeginAnimation'))
}

// 监听Begin组件的动画状态变化
function handleBeginAnimationStarted() {
  console.log('Begin组件动画已开始')
  isAnimationPlaying.value = true
}

function handleBeginAnimationCompleted() {
  console.log('Begin组件动画已完成')
  isAnimationPlaying.value = false
}

// 更新自定义立方体边长
function updateCustomPieceSize(event) {
  const newSize = parseFloat(event.target.value)
  cubeStore.setCustomPieceSize(newSize)
}

// 重置自定义立方体边长到默认值
function resetCustomPieceSize() {
  cubeStore.setCustomPieceSize(null)
}

// 更新角半径
function updateCornerRadius(event) {
  const newRadius = parseFloat(event.target.value)
  console.log('更新角半径:', newRadius)
  cubeStore.setPieceCornerRadius(newRadius)
  
  // 检查魔方实例是否存在
  if (cubeInstance) {
    console.log('魔方实例存在，尝试更新角半径')
    if (typeof cubeInstance.updatePieceCornerRadius === 'function') {
      cubeInstance.updatePieceCornerRadius(newRadius)
      console.log('角半径更新方法调用成功')
    } else {
      console.warn('魔方实例没有 updatePieceCornerRadius 方法')
    }
  } else {
    console.warn('魔方实例不存在，无法更新角半径')
  }
}

// 更新边缘圆润度
function updateEdgeRoundness(event) {
  const newRoundness = parseFloat(event.target.value)
  console.log('更新边缘圆润度:', newRoundness)
  cubeStore.setEdgeCornerRoundness(newRoundness)
  
  // 检查魔方实例是否存在
  if (cubeInstance) {
    console.log('魔方实例存在，尝试更新边缘圆润度')
    if (typeof cubeInstance.updateEdgeCornerRoundness === 'function') {
      cubeInstance.updateEdgeCornerRoundness(newRoundness)
      console.log('边缘圆润度更新方法调用成功')
    } else {
      console.warn('魔方实例没有 updateEdgeCornerRoundness 方法')
    }
  } else {
    console.warn('魔方实例不存在，无法更新边缘圆润度')
  }
}

// 更新边缘缩放
function updateEdgeScale(event) {
  const newScale = parseFloat(event.target.value)
  console.log('更新边缘缩放:', newScale)
  cubeStore.setEdgeScale(newScale)
  
  // 检查魔方实例是否存在
  if (cubeInstance) {
    console.log('魔方实例存在，尝试更新边缘缩放')
    if (typeof cubeInstance.updateEdgeScale === 'function') {
      cubeInstance.updateEdgeScale(newScale)
      console.log('边缘缩放更新方法调用成功')
    } else {
      console.warn('魔方实例没有 updateEdgeScale 方法')
    }
  } else {
    console.warn('魔方实例不存在，无法更新边缘缩放')
  }
}

// 重置外观到默认值
function resetAppearance() {
  cubeStore.setPieceCornerRadius(0.12)
  cubeStore.setEdgeCornerRoundness(0.08)
  cubeStore.setEdgeScale(1.0)
}

// 监听自定义边长变化，实时更新魔方
watch(() => cubeStore.config.customPieceSize, (newSize) => {
  if (cubeInstance && cubeInstance.regenerateModel) {
    cubeInstance.regenerateModel(newSize)
  }
})

// 初始化魔方
function initCube() {
  if (!worldComponent.value) {
    console.warn('World 组件未准备好')
    return
  }

  const worldMethods = gameStore.getWorldMethods()
  if (!worldMethods || !worldMethods.scene) {
    console.warn('World 场景未准备好')
    return
  }

  console.log('开始初始化魔方...')
  
  // 使用 store 初始化魔方
  cubeStore.initCube(worldMethods.scene)
  
  // 获取魔方实例
  cubeInstance = cubeStore.getCubeInstance()
  
  // 初始化控制模块
  controls = useControls(worldRef, cubeInstance, worldMethods.camera)
  controls.init()
  controls.enable() // 启用拖拽控制
  
  // 默认隐藏贴片
  cubeInstance.hideEdges()
  edgesVisible.value = false
  
  console.log('魔方和控制模块初始化完成，贴片已隐藏')
}

// 切换贴片可见性
function toggleEdges() {
  if (cubeInstance) {
    const isVisible = cubeInstance.toggleEdges()
    edgesVisible.value = isVisible
    console.log(`贴片已${isVisible ? '显示' : '隐藏'}`)
  }
}

onMounted(() => {
  // 设置 World 引用到 store
  gameStore.setWorldRef(worldComponent.value)
  
  // 添加Begin组件动画状态事件监听器
  window.addEventListener('beginAnimationStarted', handleBeginAnimationStarted)
  window.addEventListener('beginAnimationCompleted', handleBeginAnimationCompleted)
  
  // 等待 World 组件初始化完成后自动初始化魔方
  setTimeout(() => {
    if (worldComponent.value && worldComponent.value.scene) {
      initCube()
    }
  }, 100)
})

// 添加onUnmounted生命周期钩子
onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('beginAnimationStarted', handleBeginAnimationStarted)
  window.removeEventListener('beginAnimationCompleted', handleBeginAnimationCompleted)
})
</script>

<style scoped>
.cube-demo {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.world-container {
  flex: 1;
  position: relative;
  background: transparent;
}

/* 开始动画控制按钮样式 */
.animation-controls {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.start-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.start-btn:hover::before {
  left: 100%;
}

.start-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.start-btn.active {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
  cursor: not-allowed;
}

.start-btn.active:hover {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  transform: none;
}

/* 贴片可见性控制按钮 */
.edge-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.edge-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.edge-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.edge-btn:hover::before {
  left: 100%;
}

.edge-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.edge-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 6px 16px rgba(240, 147, 251, 0.4);
}

.edge-btn.active:hover {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(233, 30, 99, 0.4);
}

/* 边长控制面板样式 */
.size-controls {
  position: fixed;
  top: 20px;
  left: 200px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 320px;
  max-width: 400px;
}

/* 魔方外观控制面板样式 */
.appearance-controls {
  position: fixed;
  top: 20px;
  left: 320px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 280px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.size-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.size-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 外观滑块样式 */
.appearance-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.appearance-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.appearance-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.appearance-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.appearance-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.size-value {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(102, 126, 234, 0.1);
}

.slider-value {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 6px;
  border-radius: 6px;
  background-color: rgba(240, 147, 251, 0.1);
}

.reset-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
</style> 