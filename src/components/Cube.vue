<template>
  <div class="cube-demo">
    <!-- 动态 Blob 背景 -->
    <div class="blob-background">
      <div class="blob">
        <svg
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 310 350"
        >
          <path
            d="M156.4,339.5c31.8-2.5,59.4-26.8,80.2-48.5c28.3-29.5,40.5-47,56.1-85.1c14-34.3,20.7-75.6,2.3-111  c-18.1-34.8-55.7-58-90.4-72.3c-11.7-4.8-24.1-8.8-36.8-11.5l-0.9-0.9l-0.6,0.6c-27.7-5.8-56.6-6-82.4,3c-38.8,13.6-64,48.8-66.8,90.3c-3,43.9,17.8,88.3,33.7,128.8c5.3,13.5,10.4,27.1,14.9,40.9C77.5,309.9,111,343,156.4,339.5z"
          />
        </svg>
      </div>
    </div>
    
    <div ref="worldRef" class="world-container">
      <World ref="worldComponent" />
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
      <button 
        @click="startAnimation" 
        class="edge-btn"
      >
        开始动画
      </button>
    </div>
    <!-- <RotationMenu /> -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import World from './World.vue'
import RotationMenu from "./RotationMenu.vue"
import { useControls } from '../composable/useControls.js'
import { useGameStore, useCubeStore } from '../stores/index.js'
import { useAnimationStore } from '../stores/animation.js'
import { useTimeline } from '../composable/useTimeline.js'
import { TimelineAnimationManager } from '../animations/timelineAnimations.js'

// 接收魔方配置属性
const props = defineProps({
  cubeConfig: {
    type: Object,
    default: () => ({
      type: 'cube3',
      style: 'classic'
    })
  }
})

const worldRef = ref(null)
const worldComponent = ref(null)
let controls = null
let cubeInstance = null

// 贴片可见性状态
const edgesVisible = ref(false)

// Store 实例
const gameStore = useGameStore()
const cubeStore = useCubeStore()
const animationStore = useAnimationStore()

// 动画系统
const timeline = useTimeline()
let animationManager = null

// 监听魔方边长变化，实时更新魔方
watch(() => cubeStore.config.pieceSize, (newSize) => {
  if (cubeInstance && cubeInstance.updatePieceSize) {
    cubeInstance.updatePieceSize(newSize)
  }
})

// 初始化动画系统
function initAnimationSystem() {
  const worldMethods = gameStore.getWorldMethods()
  if (!worldMethods || !worldMethods.scene || !worldMethods.camera) {
    console.warn('World场景或相机未准备好，无法初始化动画系统')
    return
  }

  // 设置时间线到store
  animationStore.setTimeline(timeline)
  
  // 创建动画管理器实例（这里没有粒子系统，所以传null）
  animationManager = new TimelineAnimationManager(
    timeline, 
    worldMethods.scene, 
    worldMethods.camera, 
    null, // 没有粒子系统
    8,    // baseRadius
    0,    // initialRotationX
    0,    // initialRotationY
    cubeInstance, // 魔方实例
    cubeStore // 传入cube store
  )
  
  // 设置到store中
  animationStore.setAnimationManager(animationManager)
}

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
  
  // 根据配置设置魔方类型
  cubeStore.setCubeType(props.cubeConfig.type)
  
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
  
  // 初始化动画系统
  initAnimationSystem()
  
}

// 切换贴片可见性
function toggleEdges() {
  if (cubeInstance) {
    const isVisible = cubeInstance.toggleEdges()
    edgesVisible.value = isVisible
  }
}

function startAnimation() {
  // 使用统一的动画系统启动魔方出场动画
  animationStore.startAnimation('cubeEntrance', cubeInstance)
}

onMounted(() => {
  // 设置 World 引用到 store
  gameStore.setWorldRef(worldComponent.value)
  
  // 等待 World 组件初始化完成后自动初始化魔方
  setTimeout(() => {
    initCube()
    startAnimation()
  },0)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Poppins:700');

.cube-demo {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FFB1A4;
  position: relative;
  overflow: hidden;
}

/* Blob 背景容器 */
.blob-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  pointer-events: none; /* 确保不会阻挡交互 */
}

/* Blob 动画元素 */
.blob {
  position: absolute;
  top: 0;
  left: 0;
  fill: #023F92;
  width: 50vmax;
  z-index: 1;
  animation: blobMove 20s ease-in-out infinite;
  transform-origin: 50% 50%;
}

/* Blob 动画关键帧 */
@keyframes blobMove {
  0%   { transform: scale(1) translate(10px, -30px); }
  38%  { transform: scale(0.8, 1) translate(80vw, 30vh) rotate(160deg); }
  40%  { transform: scale(0.8, 1) translate(80vw, 30vh) rotate(160deg); }
  78%  { transform: scale(1.3) translate(0vw, 50vh) rotate(-20deg); }
  80%  { transform: scale(1.3) translate(0vw, 50vh) rotate(-20deg); }
  100% { transform: scale(1) translate(10px, -30px); }
}

.world-container {
  flex: 1;
  position: relative;
  background: transparent;
  z-index: 10; /* 确保魔方在blob之上 */
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
</style> 