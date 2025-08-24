import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCubeStore } from './cube.js'
import { storeToRefs } from 'pinia'

export const useAnimationStore = defineStore('animation', () => {
  // ===== 常量配置 =====
  const CUBE_TYPE_CONFIGS = {
    cube2: { sizeMultiplier: 80, gapMultiplier: 0.1 },
    cube3: { sizeMultiplier: 60, gapMultiplier: 0 },
    cube4: { sizeMultiplier: 50, gapMultiplier: 0.05 },
    default: { sizeMultiplier: 60, gapMultiplier: 0 }
  }

  const INITIAL_STATES = {
    particleParams: { sizeMultiplier: 60, gapMultiplier: 0, opacityMultiplier: 0.9 },
    cameraParams: { rotationX: 0, rotationY: 0, radius: 8 },
    animationState: { isPlaying: false, currentPhase: '', progress: 0, currentAnimation: '' }
  }

  // ===== 获取cube store引用，使用storeToRefs保持响应性 =====
  const cubeStore = useCubeStore()
  const { config: cubeConfig } = storeToRefs(cubeStore)
  
  // ===== 状态定义 - 直接暴露响应式引用 =====
  
  // 粒子视觉效果参数
  const particleParams = ref({ ...INITIAL_STATES.particleParams })
  
  // 相机参数
  const cameraParams = ref({ ...INITIAL_STATES.cameraParams })
  
  // 动画状态
  const animationState = ref({ ...INITIAL_STATES.animationState })
  
  // 系统实例
  const instances = ref({
    timeline: null,
    animationManager: null
  })
  
  // 动画事件状态
  const animationEvents = ref({
    lastUpdate: null,
    lastComplete: null,
    lastStep: null,
    lastError: null
  })

  // ===== 计算属性 - 直接使用响应式数据 =====
  
  // 根据魔方类型自动调整的粒子参数
  const adjustedParticleParams = computed(() => {
    const { cubeType } = cubeConfig.value
    return CUBE_TYPE_CONFIGS[cubeType] || CUBE_TYPE_CONFIGS.default
  })
  
  // 统一的动画信息 - 直接引用cube store的响应式数据
  const animationInfo = computed(() => ({
    // 动画状态
    ...animationState.value,
    // 粒子参数（根据魔方类型自动调整）
    ...particleParams.value,
    ...adjustedParticleParams.value,
    // 魔方参数（直接引用，自动响应变化）
    cornerRadius: cubeConfig.value.pieceCornerRadius,
    pieceSize: cubeConfig.value.pieceSize,
    edgeCornerRoundness: cubeConfig.value.edgeCornerRoundness,
    edgeScale: cubeConfig.value.edgeScale,
    cubeType: cubeConfig.value.cubeType
  }))
  
  // 相机信息
  const cameraInfo = computed(() => ({
    ...cameraParams.value
  }))

  // ===== 工具函数 =====
  
  // 统一的错误处理
  const handleAnimationError = (error, context) => {
    console.error(`动画错误 [${context}]:`, error)
    animationState.value.isPlaying = false
    animationState.value.currentPhase = ''
    triggerAnimationError({ error: error.message, context })
    return false
  }

  // 事件触发工厂函数
  const createEventTrigger = (eventType) => (data) => {
    animationEvents.value[eventType] = { ...data, timestamp: Date.now() }
  }

  // ===== 事件触发方法 =====
  const triggerAnimationUpdate = createEventTrigger('lastUpdate')
  const triggerAnimationComplete = createEventTrigger('lastComplete')
  const triggerAnimationStep = createEventTrigger('lastStep')
  const triggerAnimationError = createEventTrigger('lastError')
  
  function setTimeline(timelineInstance) {
    instances.value.timeline = timelineInstance
  }
  
  function setAnimationManager(managerInstance) {
    instances.value.animationManager = managerInstance
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
      return handleAnimationError(error, `启动 ${type} 动画`)
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
      // 重置所有状态到初始值
      Object.entries(INITIAL_STATES).forEach(([key, initialState]) => {
        Object.assign(eval(key).value, initialState)
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
    // ===== 状态（直接暴露响应式引用） =====
    particleParams,
    cameraParams,
    animationState,
    instances,
    animationEvents,
    
    // ===== 计算属性 =====
    animationInfo,
    cameraInfo,
    adjustedParticleParams,
    
    // ===== 核心方法 =====
    // 实例管理
    setTimeline,
    setAnimationManager,
    
    // 动画控制
    startAnimation,
    pauseAnimation,
    stopAnimation,
    resetAnimation,
    toggleLoop,
    getTimelineInfo,
    
    // 事件触发方法
    triggerAnimationUpdate,
    triggerAnimationComplete,
    triggerAnimationStep,
    triggerAnimationError
  }
})
