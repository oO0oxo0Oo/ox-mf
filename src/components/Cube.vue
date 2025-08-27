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

    <!-- 延迟 2 秒后渲染 RotationMenu -->
    <RotationMenu 
      v-if="showRotationMenu"
      @toggle-dragging="handleToggleDragging"
      @reset-cube="handleResetCube"
      @reset-world-rotation="handleResetWorldRotation"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import World from './World.vue'
import RotationMenu from "./RotationMenu.vue"
import { useControls } from '../composable/useControls.js'
import { useCubeStore } from '../stores/index.js'
import { useAnimationStore } from '../stores/animation.js'
import { useTimeline } from '../composable/useTimeline.js'
import { TimelineAnimationManager } from '../animations/timelineAnimations.js'
import { getThemeColors } from '../config/themes.js'
import { useRotationQueue } from '../composable/useRotationQueue.js'

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

// ===== 延迟渲染状态 =====
const showRotationMenu = ref(false)

// ===== Store 实例 =====
const cubeStore = useCubeStore()
const animationStore = useAnimationStore()
const rotationQueue = useRotationQueue()

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
watch(() => cubeStore.config.pieceSize, (newSize) => {
  state.value.cubeInstance?.updatePieceSize?.(newSize)
}, { immediate: false })

// 监听圆角半径变化
watch(() => cubeStore.config.pieceCornerRadius, (newRadius) => {
  state.value.cubeInstance?.updatePieceCornerRadius?.(newRadius)
}, { immediate: false })

// 监听魔方类型变化，重新初始化系统
watch(() => cubeStore.config.cubeType, (newType, oldType) => {
  if (newType !== oldType && state.value.isInitialized) {
    reinitializeSystem()
  }
}, { immediate: false })

// 监听主题变化，实时更新魔方颜色
watch(() => cubeStore.config.theme, (newTheme) => {
  if (newTheme && state.value.cubeInstance?.updateColors) {
    const colors = getThemeColors(newTheme)
    state.value.cubeInstance.updateColors(colors)
    
    if (canAnimate.value) {
      triggerThemeSwitchAnimation()
    }
  }
}, { immediate: true })

// ===== 核心方法 =====

// 重新初始化系统 - 拆分成清晰的步骤
function reinitializeSystem() {
  // 1. 清理旧实例
  cleanupOldInstance()
  
  // 2. 创建新实例
  createNewInstance()
  
  // 3. 重新设置系统
  setupSystems()
}

// 清理旧实例
function cleanupOldInstance() {
  if (state.value.cubeInstance?.holder && worldComponent.value?.scene) {
    worldComponent.value.scene.remove(state.value.cubeInstance.holder)
  }
}

// 创建新实例
function createNewInstance() {
  cubeStore.initCube(worldComponent.value.scene)
  const newInstance = cubeStore.getCubeInstance()
  if (!newInstance) return
  
  state.value.cubeInstance = newInstance
  rotationQueue.setCubeInstance(newInstance)
}

// 设置系统
function setupSystems() {
  // 重新初始化控制模块
  if (state.value.controls) {
    state.value.controls.disable()
  }
  initControls()
  
  // 重新初始化动画系统
  initAnimationSystem()
  
  // 触发开场动画
  if (state.value.animationManager) {
    triggerThemeSwitchAnimation()
  }
}

// 初始化魔方 - 拆分成清晰的步骤
function initCube() {
  if (!worldComponent.value) {
    console.warn('World 组件未准备好')
    return false
  }

  // 1. 配置设置
  setupInitialConfig()
  
  // 2. 创建魔方实例
  createCubeInstance()
  
  // 3. 初始化组件
  initComponents()
  
  // 4. 设置状态
  setupInitialState()
  
  return state.value.animationManager ? true : false
}

// 设置初始配置
function setupInitialConfig() {
  cubeStore.setCubeType(props.cubeConfig.type)
  if (props.cubeConfig.theme) {
    cubeStore.setTheme(props.cubeConfig.theme)
    console.log('初始化时设置主题:', props.cubeConfig.theme)
  }
}

// 创建魔方实例
function createCubeInstance() {
  cubeStore.initCube(worldComponent.value.scene)
  state.value.cubeInstance = cubeStore.getCubeInstance()
  rotationQueue.setCubeInstance(state.value.cubeInstance)
}

// 初始化组件
function initComponents() {
  initControls()
  initAnimationSystem()
}

// 设置初始状态
function setupInitialState() {
  state.value.cubeInstance.hideEdges()
  
  if (state.value.animationManager) {
    state.value.isInitialized = true
    console.log('魔方初始化成功')
  }
}

// 初始化控制模块
function initControls() {
  if (!state.value.cubeInstance || !worldRef.value || !worldComponent.value) return false
  
  state.value.controls = useControls(worldRef, state.value.cubeInstance, worldComponent.value.camera, worldComponent.value)
  state.value.controls.init()
  state.value.controls.enable()
  rotationQueue.setControlsInstance(state.value.controls)
  
  return true
}

// 初始化动画系统
function initAnimationSystem() {
  if (!worldComponent.value) {
    console.warn('World组件未准备好，无法初始化动画系统')
    return false
  }

  animationStore.setTimeline(timeline)
  
  state.value.animationManager = new TimelineAnimationManager(
    timeline, 
    worldComponent.value.scene, 
    worldComponent.value.camera, 
    null, // 没有粒子系统
    8,    // baseRadius
    0,    // initialRotationX
    0,    // initialRotationY
    state.value.cubeInstance,
    cubeStore
  )
  
  animationStore.setAnimationManager(state.value.animationManager)
  console.log('动画系统初始化成功')
  return true
}

// 触发主题切换动画
function triggerThemeSwitchAnimation() {
  if (!canAnimate.value) return
  
  state.value.isAnimating = true
  state.value.animationManager.setupCubeEntranceTimeline(state.value.cubeInstance)
  
  timeline.on('complete', () => {
    state.value.isAnimating = false
  })
}

// ===== 事件处理器 =====

// 处理禁用/启用拖拽
function handleToggleDragging(enabled) {
  state.value.controls?.[enabled ? 'enable' : 'disable']()
}

// 处理还原魔方
function handleResetCube() {
  state.value.cubeInstance?.reset()
  // 重新启用拖拽控制
  state.value.controls?.enable()
}

// 处理重置整体旋转
function handleResetWorldRotation() {
  state.value.controls?.resetWorldRotation()
}

// ===== 工具函数 =====

// 检查World是否准备好
function isWorldReady() {
  return worldComponent.value?.scene && worldComponent.value?.camera
}

// ===== 生命周期 =====

onMounted(() => {
  // 等待 World 组件初始化完成后自动初始化魔方
  setTimeout(() => {
    if (initCube()) {
      triggerThemeSwitchAnimation()
    }
  }, 400)
  
  // 延迟 2 秒后显示 RotationMenu
  setTimeout(() => {
    showRotationMenu.value = true
  }, 2000)
})

onUnmounted(() => {
  // 清理资源 - 使用可选链操作符简化
  state.value.controls?.disable()
  state.value.animationManager = null
  state.value.cubeInstance = null
  state.value.isInitialized = false
})
</script>

<style scoped>
/* @import url('https://fonts.googleapis.com/css?family=Poppins:700'); */

.cube-demo {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FFB1A4;
  position: relative;
  overflow: hidden;
  transition: background 20s ease;
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
  z-index: 10; 
  transform: translateY(-5vh);
}

.reset-world-btn {
	background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
	border-color: rgba(102, 126, 234, 0.3);
}

.reset-world-btn:hover {
	background: linear-gradient(145deg, #5a6fd8 0%, #6a4190 100%);
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}
</style> 