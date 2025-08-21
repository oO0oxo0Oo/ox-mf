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

    <RotationMenu 
      @toggle-dragging="handleToggleDragging"
      @reset-cube="handleResetCube"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import World from './World.vue'
import RotationMenu from "./RotationMenu.vue"
import { useControls } from '../composable/useControls.js'
import { useGameStore, useCubeStore } from '../stores/index.js'
import { useAnimationStore } from '../stores/animation.js'
import { useTimeline } from '../composable/useTimeline.js'
import { TimelineAnimationManager } from '../animations/timelineAnimations.js'
import { getThemeColors } from '../config/themes.js'

// ===== 组件配置 =====
const props = defineProps({
  cubeConfig: {
    type: Object,
    default: () => ({
      type: 'cube3',
      theme: 'classic'
    })
  }
})

// ===== 响应式引用 =====
const worldRef = ref(null)
const worldComponent = ref(null)

// ===== Store 实例 =====
const gameStore = useGameStore()
const cubeStore = useCubeStore()
const animationStore = useAnimationStore()

// ===== 状态管理 =====
const state = ref({
  isInitialized: false,
  isAnimating: false,
  controls: null,
  cubeInstance: null,
  animationManager: null
})

// ===== 计算属性 =====
const isReady = computed(() => {
  return state.value.isInitialized && 
         state.value.cubeInstance && 
         worldComponent.value
})

const canAnimate = computed(() => {
  return isReady.value && 
         !state.value.isAnimating && 
         state.value.animationManager
})

// ===== 动画系统 =====
const timeline = useTimeline()

// ===== 响应式监听器 =====

// 监听魔方边长变化，实时更新魔方
watch(() => cubeStore.config.pieceSize, (newSize, oldSize) => {
  if (state.value.cubeInstance?.updatePieceSize) {
    // 现代方式：使用响应式验证
    if (isValidSize(newSize)) {
      state.value.cubeInstance.updatePieceSize(newSize)
    } else {
      console.warn('接收到无效的魔方尺寸:', newSize)
    }
  }
}, { immediate: false })

// 监听圆角半径变化
watch(() => cubeStore.config.pieceCornerRadius, (newRadius, oldRadius) => {
  if (state.value.cubeInstance?.updatePieceCornerRadius) {
    if (isValidRadius(newRadius)) {
      state.value.cubeInstance.updatePieceCornerRadius(newRadius)
    } else {
      console.warn('接收到无效的圆角半径:', newRadius)
    }
  }
}, { immediate: false })

// 监听主题变化，实时更新魔方颜色
watch(() => props.cubeConfig.theme, (newTheme) => {
  if (newTheme && state.value.cubeInstance?.updateColors) {
    const colors = getThemeColors(newTheme)
    state.value.cubeInstance.updateColors(colors)
    
    // 触发主题切换动画
    if (canAnimate.value) {
      triggerThemeSwitchAnimation()
    }
  }
}, { immediate: true })

// ===== 核心方法 =====

// 现代方式：初始化动画系统
function initAnimationSystem() {
  const worldMethods = gameStore.getWorldMethods()
  
  if (!isWorldReady(worldMethods)) {
    console.warn('World场景或相机未准备好，无法初始化动画系统')
    return false
  }

  // 设置时间线到store
  animationStore.setTimeline(timeline)
  
  // 创建动画管理器实例
  state.value.animationManager = new TimelineAnimationManager(
    timeline, 
    worldMethods.scene, 
    worldMethods.camera, 
    null, // 没有粒子系统
    8,    // baseRadius
    0,    // initialRotationX
    0,    // initialRotationY
    state.value.cubeInstance,
    cubeStore
  )
  
  // 设置到store中
  animationStore.setAnimationManager(state.value.animationManager)
  
  console.log('动画系统初始化成功')
  return true
}

// 现代方式：初始化魔方
function initCube() {
  if (!isWorldReady()) {
    console.warn('World 组件未准备好')
    return false
  }

  // 根据配置设置魔方类型
  cubeStore.setCubeType(props.cubeConfig.type)
  
  // 设置主题 - 确保主题在初始化时就被应用
  if (props.cubeConfig.theme) {
    cubeStore.setTheme(props.cubeConfig.theme)
    console.log('初始化时设置主题:', props.cubeConfig.theme)
  }
  
  // 使用 store 初始化魔方
  const worldMethods = gameStore.getWorldMethods()
  cubeStore.initCube(worldMethods.scene)
  
  // 获取魔方实例
  state.value.cubeInstance = cubeStore.getCubeInstance()
  
  // 初始化控制模块
  initControls()
  
  // 默认隐藏贴片
  state.value.cubeInstance.hideEdges()
  
  // 初始化动画系统
  const animationSuccess = initAnimationSystem()
  
  if (animationSuccess) {
    state.value.isInitialized = true
    console.log('魔方初始化成功')
    return true
  }
  
  return false
}

// 现代方式：初始化控制模块
async function initControls() {
  if (!state.value.cubeInstance || !worldRef.value) return false
  
  const worldMethods = gameStore.getWorldMethods()
  state.value.controls = useControls(worldRef, state.value.cubeInstance, worldMethods.camera)
  state.value.controls.init()
  state.value.controls.enable()
  return true
}

// 触发主题切换动画
function triggerThemeSwitchAnimation() {
  if (!canAnimate.value) return
  
  state.value.isAnimating = true
  state.value.animationManager.setupCubeEntranceTimeline(state.value.cubeInstance)
  
  // 监听动画完成
  timeline.on('complete', () => {
    state.value.isAnimating = false
  })
}

// ===== 事件处理器 =====

// 处理禁用/启用拖拽
function handleToggleDragging(enabled) {
  if (state.value.controls) {
    if (enabled) {
      state.value.controls.enable()
    } else {
      state.value.controls.disable()
    }
  }
}

// 处理还原魔方
function handleResetCube() {
  if (state.value.cubeInstance) {
    state.value.cubeInstance.reset()
  }
  // 重新启用拖拽控制
  if (state.value.controls) {
    state.value.controls.enable()
  }
}

// ===== 工具函数 =====

// 验证尺寸值
function isValidSize(size) {
  return typeof size === 'number' && !isNaN(size) && size > 0
}

// 验证半径值
function isValidRadius(radius) {
  return typeof radius === 'number' && !isNaN(radius) && radius >= 0
}

// 检查World是否准备好
function isWorldReady(worldMethods = null) {
  const methods = worldMethods || gameStore.getWorldMethods()
  return methods?.scene && methods?.camera
}

// ===== 生命周期 =====

onMounted(() => {
  // 设置 World 引用到 store
  gameStore.setWorldRef(worldComponent.value)
  
  // 等待 World 组件初始化完成后自动初始化魔方
  setTimeout(() => {
    if (initCube()) {
      triggerThemeSwitchAnimation()
    }
  }, 400)
})

onUnmounted(() => {
  // 清理资源
  if (state.value.controls) {
    state.value.controls.disable()
  }
  
  if (state.value.animationManager) {
    state.value.animationManager = null
  }
  
  state.value.cubeInstance = null
  state.value.isInitialized = false
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
</style> 