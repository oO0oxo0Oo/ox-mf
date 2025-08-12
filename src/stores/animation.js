import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 动画状态管理store
 * 负责管理所有页面的动画状态和参数
 * 使用事件驱动架构，监听动画管理器事件并分发
 */
export const useAnimationStore = defineStore('animation', () => {
  // ===== 状态定义 =====
  
  // 立方体动画参数
  const cubeSizeMultiplier = ref(60)
  const gapSizeMultiplier = ref(0)
  const opacityMultiplier = ref(0.9)
  
  // 相机动画参数
  const currentRotationX = ref(0)
  const currentRotationY = ref(0)
  const baseRadius = ref(8)
  
  // 动画状态
  const isPlaying = ref(false)
  const currentPhase = ref('')
  const animationProgress = ref(0)
  const currentAnimationName = ref('')
  
  // 时间线控制
  const timeline = ref(null)
  const animationManager = ref(null)
  
  // 事件监听器
  const eventListeners = ref({})
  
  // ===== 计算属性 =====
  
  const animationInfo = computed(() => ({
    isPlaying: isPlaying.value,
    currentPhase: currentPhase.value,
    progress: animationProgress.value,
    currentAnimation: currentAnimationName.value,
    cubeSize: cubeSizeMultiplier.value,
    gapSize: gapSizeMultiplier.value,
    opacity: opacityMultiplier.value
  }))
  
  const cameraPosition = computed(() => ({
    rotationX: currentRotationX.value,
    rotationY: currentRotationY.value,
    radius: baseRadius.value
  }))
  
  // ===== 事件管理 =====
  
  /**
   * 添加事件监听器
   */
  function on(eventName, listener) {
    if (!eventListeners.value[eventName]) {
      eventListeners.value[eventName] = []
    }
    eventListeners.value[eventName].push(listener)
  }
  
  /**
   * 移除事件监听器
   */
  function off(eventName, listener) {
    if (eventListeners.value[eventName]) {
      const index = eventListeners.value[eventName].indexOf(listener)
      if (index > -1) {
        eventListeners.value[eventName].splice(index, 1)
      }
    }
  }
  
  /**
   * 发出事件
   */
  function emit(eventName, data) {
    if (eventListeners.value[eventName]) {
      eventListeners.value[eventName].forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Store事件监听器执行错误: ${eventName}`, error)
        }
      })
    }
  }
  
  // ===== 操作方法 =====
  
  /**
   * 设置时间线实例
   */
  function setTimeline(timelineInstance) {
    timeline.value = timelineInstance
  }
  
  /**
   * 设置动画管理器实例
   */
  function setAnimationManager(managerInstance) {
    animationManager.value = managerInstance
    
    // 监听动画管理器的事件
    if (animationManager.value) {
      // 监听动画更新事件
      animationManager.value.on('animationUpdate', (data) => {
        // 更新store中的状态
        if (data.cubeSizeMultiplier !== undefined) {
          updateCubeSize(data.cubeSizeMultiplier)
        }
        if (data.gapSizeMultiplier !== undefined) {
          updateGapSize(data.gapSizeMultiplier)
        }
        if (data.currentRotationX !== undefined) {
          updateCameraRotation(data.currentRotationX, currentRotationY.value)
        }
        if (data.phase) {
          currentPhase.value = data.phase
        }
        
        // 发出粒子更新事件，通知组件
        emit('particleUpdate', data)
      })
      
      // 监听动画完成事件
      animationManager.value.on('animationComplete', (data) => {
        isPlaying.value = false
        currentPhase.value = ''
        emit('animationComplete', data)
      })
      
      // 监听动画步骤事件
      animationManager.value.on('animationStep', (data) => {
        currentAnimationName.value = data.name
        emit('animationStep', data)
      })
      
      // 监听动画错误事件
      animationManager.value.on('animationError', (data) => {
        isPlaying.value = false
        console.error('动画执行错误:', data.error)
        emit('animationError', data)
      })
    }
  }
  
  /**
   * 更新立方体大小
   */
  function updateCubeSize(newSize) {
    cubeSizeMultiplier.value = newSize
  }
  
  /**
   * 更新间距大小
   */
  function updateGapSize(newGap) {
    gapSizeMultiplier.value = newGap
  }
  
  /**
   * 更新透明度
   */
  function updateOpacity(newOpacity) {
    opacityMultiplier.value = newOpacity
  }
  
  /**
   * 更新相机旋转
   */
  function updateCameraRotation(rotationX, rotationY) {
    currentRotationX.value = rotationX
    currentRotationY.value = rotationY
  }
  
  /**
   * 更新相机半径
   */
  function updateCameraRadius(newRadius) {
    baseRadius.value = newRadius
  }
  
  /**
   * 更新动画状态
   */
  function updateAnimationState(state) {
    isPlaying.value = state.isPlaying || false
    currentPhase.value = state.phase || ''
    animationProgress.value = state.progress || 0
    currentAnimationName.value = state.name || ''
  }
  
  /**
   * 开始立方体动画
   */
  function startCubeAnimation() {
    if (!animationManager.value) {
      console.warn('动画管理器未初始化')
      return
    }
    
    if (!timeline.value) {
      console.warn('时间线未初始化')
      return
    }
    
    isPlaying.value = true
    currentAnimationName.value = '立方体动画'
    
    // 调用动画管理器的立方体动画时间线（用于点击开始按钮后的动画）
    animationManager.value.setupCubeAnimationTimeline()
  }
  
  /**
   * 暂停动画
   */
  function pauseAnimation() {
    if (timeline.value) {
      timeline.value.pause()
      isPlaying.value = false
    }
  }
  
  /**
   * 停止动画
   */
  function stopAnimation() {
    if (timeline.value) {
      timeline.value.stop()
      isPlaying.value = false
      currentPhase.value = ''
      animationProgress.value = 0
    }
  }
  
  /**
   * 重置动画
   */
  function resetAnimation() {
    if (timeline.value) {
      timeline.value.reset()
      isPlaying.value = false
      currentPhase.value = ''
      animationProgress.value = 0
      
      // 重置参数到初始值
      updateCubeSize(60)
      updateGapSize(4)
      updateOpacity(0.9)
      updateCameraRotation(0, 0)
    }
  }
  
  /**
   * 切换循环播放
   */
  function toggleLoop() {
    if (timeline.value) {
      const currentLoopState = timeline.value.getInfo().isLooping
      timeline.value.setLoop(!currentLoopState)
      console.log(`循环播放已${!currentLoopState ? '开启' : '关闭'}`)
    }
  }
  
  /**
   * 获取时间线信息
   */
  function getTimelineInfo() {
    if (timeline.value) {
      return timeline.value.getInfo()
    }
    return {
      isPlaying: false,
      isLooping: false,
      currentItem: null,
      progress: 0
    }
  }
  
  // ===== 导出 =====
  
  return {
    // 状态
    cubeSizeMultiplier,
    gapSizeMultiplier,
    opacityMultiplier,
    currentRotationX,
    currentRotationY,
    baseRadius,
    isPlaying,
    currentPhase,
    animationProgress,
    currentAnimationName,
    timeline,
    animationManager,
    
    // 计算属性
    animationInfo,
    cameraPosition,
    
    // 事件管理
    on,
    off,
    emit,
    
    // 方法
    setTimeline,
    setAnimationManager,
    updateCubeSize,
    updateGapSize,
    updateOpacity,
    updateCameraRotation,
    updateCameraRadius,
    updateAnimationState,
    startCubeAnimation,
    pauseAnimation,
    stopAnimation,
    resetAnimation,
    toggleLoop,
    getTimelineInfo
  }
})
