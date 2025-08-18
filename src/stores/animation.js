import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCubeStore } from './cube.js'


export const useAnimationStore = defineStore('animation', () => {
  // ===== 获取cube store引用 =====
  const cubeStore = useCubeStore()
  
  // ===== 状态定义 =====
  
  // 粒子视觉效果参数
  const particleParams = ref({
    sizeMultiplier: 60,
    gapMultiplier: 0,
    opacityMultiplier: 0.9
  })
  
  // 相机参数
  const cameraParams = ref({
    rotationX: 0,
    rotationY: 0,
    radius: 8
  })
  
  // 动画状态
  const animationState = ref({
    isPlaying: false,
    currentPhase: '',
    progress: 0,
    currentAnimation: ''
  })
  
  // 系统实例
  const instances = ref({
    timeline: null,
    animationManager: null
  })
  
  // ===== 新增：动画事件状态（替代事件系统） =====
  const animationEvents = ref({
    lastUpdate: null,      // 最后一次动画更新数据
    lastComplete: null,    // 最后一次动画完成数据
    lastStep: null,        // 最后一次动画步骤数据
    lastError: null        // 最后一次动画错误数据
  })
  
  // ===== 监听cube store的魔方类型变化 =====
  watch(() => cubeStore.config.cubeType, (newType) => {
    updateCubeParamsFromStore({ type: newType })
  }, { immediate: true })
  
  // ===== 同步魔方参数的方法 =====
  function updateCubeParamsFromStore(cubeConfig) {
    // 根据魔方类型调整动画参数
    if (cubeConfig.type === 'cube2') {
      // 2阶魔方：调整粒子大小和间距
      particleParams.value.sizeMultiplier = 80  // 2阶魔方块更大
      particleParams.value.gapMultiplier = 0.1
    } else if (cubeConfig.type === 'cube3') {
      // 3阶魔方：标准参数
      particleParams.value.sizeMultiplier = 60
      particleParams.value.gapMultiplier = 0
    }

  }
  
  // ===== 计算属性 =====
  
  // 统一的动画信息
  const animationInfo = computed(() => ({
    // 动画状态
    ...animationState.value,
    // 粒子参数
    ...particleParams.value,
    // 魔方参数（从 cubeStore 获取）
    cornerRadius: cubeStore.config.pieceCornerRadius,
    pieceSize: cubeStore.config.pieceSize,
    edgeCornerRoundness: cubeStore.config.edgeCornerRoundness,
    edgeScale: cubeStore.config.edgeScale
  }))
  
  // 相机信息
  const cameraInfo = computed(() => ({
    ...cameraParams.value
  }))
  
  // ===== 新增：事件触发方法（替代emit） =====
  function triggerAnimationUpdate(data) {
    animationEvents.value.lastUpdate = { ...data, timestamp: Date.now() }
  }
  
  function triggerAnimationComplete(data) {
    animationEvents.value.lastComplete = { ...data, timestamp: Date.now() }
  }
  
  function triggerAnimationStep(data) {
    animationEvents.value.lastStep = { ...data, timestamp: Date.now() }
  }
  
  function triggerAnimationError(data) {
    animationEvents.value.lastError = { ...data, timestamp: Date.now() }
  }
  
  function setTimeline(timelineInstance) {
    instances.value.timeline = timelineInstance
  }
  
  function setAnimationManager(managerInstance) {
    instances.value.animationManager = managerInstance
  }
  
  // ===== 统一更新方法 =====
  
  function updateFromAnimationData(data) {
    // 更新粒子参数
    if (data.cubeSizeMultiplier !== undefined) {
      particleParams.value.sizeMultiplier = data.cubeSizeMultiplier
    }
    if (data.gapSizeMultiplier !== undefined) {
      particleParams.value.gapMultiplier = data.gapSizeMultiplier
    }
    
    // 更新相机参数
    if (data.currentRotationX !== undefined) {
      cameraParams.value.rotationX = data.currentRotationX
    }
    if (data.currentRotationY !== undefined) {
      cameraParams.value.rotationY = data.currentRotationY
    }
    
    // 更新魔方参数（同步到 cubeStore）
    if (data.cornerRadius !== undefined) {
      cubeStore.setPieceCornerRadius(data.cornerRadius)
    }
    
    // 更新动画状态
    if (data.phase) {
      animationState.value.currentPhase = data.phase
    }
    if (data.progress !== undefined) {
      animationState.value.progress = data.progress
    }
  }
  
  // ===== 便利更新方法 =====
  
  function updateParticleParams(updates) {
    Object.assign(particleParams.value, updates)
  }
  
  function updateCameraParams(updates) {
    Object.assign(cameraParams.value, updates)
  }
  
  function updateAnimationState(updates) {
    Object.assign(animationState.value, updates)
  }
  

  
  // ===== 动画控制方法 =====
  
  function startAnimation(type, cubeInstance = null) {
    const manager = instances.value.animationManager
    const timeline = instances.value.timeline
    
    if (!manager) {
      console.warn('动画管理器未初始化')
      return false
    }
    
    try {
      animationState.value.isPlaying = true
      animationState.value.currentAnimation = type
      
      switch (type) {
        case 'cubeEntrance':
          if (!cubeInstance) {
            throw new Error('魔方实例未提供')
          }
          animationState.value.currentPhase = '魔方出场动画'
          manager.setupCubeEntranceTimeline(cubeInstance)
          break
          
        case 'cubeAnimation':
          if (!timeline) {
            throw new Error('时间线未初始化')
          }
          animationState.value.currentPhase = '立方体动画'
          manager.setupCubeAnimationTimeline()
          break
          
        case 'continuous':
          if (!timeline || !cubeInstance) {
            throw new Error('时间线或魔方实例未提供')
          }
          animationState.value.currentPhase = '连续动画序列'
          if (manager.setCubeInstance) {
            manager.setCubeInstance(cubeInstance)
          }
          manager.setupCubeAnimationTimeline()
          break
          
        default:
          throw new Error(`未知动画类型: ${type}`)
      }

      return true
      
    } catch (error) {
      console.error(`启动 ${type} 动画时出错:`, error)
      animationState.value.isPlaying = false
      animationState.value.currentPhase = ''
      triggerAnimationError({ error: error.message, type })
      return false
    }
  }
  

  
  // 控制方法
  function pauseAnimation() {
    const timeline = instances.value.timeline
    if (timeline) {
      timeline.pause()
      animationState.value.isPlaying = false
    }
  }
  
  function stopAnimation() {
    const timeline = instances.value.timeline
    if (timeline) {
      timeline.stop()
      animationState.value.isPlaying = false
      animationState.value.currentPhase = ''
      animationState.value.progress = 0
    }
  }
  
  function resetAnimation() {
    const timeline = instances.value.timeline
    if (timeline) {
      timeline.reset()
      // 重置所有状态
      Object.assign(animationState.value, {
        isPlaying: false,
        currentPhase: '',
        progress: 0,
        currentAnimation: ''
      })
      Object.assign(particleParams.value, {
        sizeMultiplier: 60,
        gapMultiplier: 0,
        opacityMultiplier: 0.9
      })
      Object.assign(cameraParams.value, {
        rotationX: 0,
        rotationY: 0,
        radius: 8
      })
      // 重置魔方参数
      cubeStore.updateCubeGeometry({
        pieceSize: 1/3,
        pieceCornerRadius: 0.12,
        edgeCornerRoundness: 0.08,
        edgeScale: 1.0
      })
    }
  }
  
  function toggleLoop() {
    const timeline = instances.value.timeline
    if (timeline) {
      const currentLoopState = timeline.getInfo().isLooping
      timeline.setLoop(!currentLoopState)
    }
  }
  
  function getTimelineInfo() {
    const timeline = instances.value.timeline
    return timeline ? timeline.getInfo() : {
      isPlaying: false,
      isLooping: false,
      currentItem: null,
      progress: 0
    }
  }
  
  // ===== 导出 =====
  
  return {
    // ===== 状态（新结构） =====
    particleParams,
    cameraParams,
    animationState,
    instances,
    animationEvents, // 新增：动画事件状态
    
    // ===== 计算属性 =====
    animationInfo,
    cameraInfo,
    
    // ===== 核心方法 =====
    // 实例管理
    setTimeline,
    setAnimationManager,
    
    // 状态更新
    updateParticleParams,
    updateCameraParams,
    updateAnimationState,
    updateFromAnimationData,
    updateCubeParamsFromStore,
    
    // 动画控制
    startAnimation,
    pauseAnimation,
    stopAnimation,
    resetAnimation,
    toggleLoop,
    getTimelineInfo,
    
    // 事件触发方法（替代emit）
    triggerAnimationUpdate,
    triggerAnimationComplete,
    triggerAnimationStep,
    triggerAnimationError
  }
})
