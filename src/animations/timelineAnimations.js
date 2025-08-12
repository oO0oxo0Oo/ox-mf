import { Easing } from '../composable/Easing.js'

/**
 * 时间线动画管理器
 * 负责管理所有页面的动画序列
 * 使用事件驱动架构，发出动画事件而不是直接调用回调
 */
export class TimelineAnimationManager {
  constructor(timeline, scene, camera, particles, baseRadius, initialRotationX, initialRotationY) {
    this.timeline = timeline
    this.scene = scene
    this.camera = camera
    this.particles = particles
    this.baseRadius = baseRadius
    this.initialRotationX = initialRotationX
    this.initialRotationY = initialRotationY
    
    // 事件监听器数组
    this.eventListeners = {}
  }

  /**
   * 添加事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} listener - 监听器函数
   */
  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }
    this.eventListeners[eventName].push(listener)
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} listener - 监听器函数
   */
  off(eventName, listener) {
    if (this.eventListeners[eventName]) {
      const index = this.eventListeners[eventName].indexOf(listener)
      if (index > -1) {
        this.eventListeners[eventName].splice(index, 1)
      }
    }
  }

  /**
   * 发出事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   */
  emit(eventName, data) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`事件监听器执行错误: ${eventName}`, error)
        }
      })
    }
  }

  /**
   * 设置立方体动画时间线
   * 现在使用事件驱动，不再需要onUpdate回调
   */
  setupCubeTimeline() {
    console.log('setupCubeTimeline被调用')
    // 重置时间线
    this.timeline.reset()
    console.log('时间线已重置')
    
    // 第一阶段：间隙从0-5 + 顺时针旋转800度，增加阻尼感变慢
    this.timeline.addCustom((progress) => {
      // 使用弹性缓动函数增加阻尼感，开始时快，结束时慢
      const easedProgress = Easing.Elastic.Out(1.2, 0.3)(progress)
      
      // 间隙从0平滑过渡到5
      const newGapSize = 0 + (5 - 0) * easedProgress
      
      // 立方体边长保持初始值60
      const newCubeSize = 60
      
      // 顺时针旋转800度，增加阻尼感
      const rotationAngle = (360 * Math.PI / 180) * easedProgress // 转换为弧度
      const currentRotationX = this.initialRotationX + rotationAngle
      
      // 粒子系统保持初始缩放，添加旋转效果
      if (this.particles && this.particles.material) {
        this.particles.scale.setScalar(1.0)
        // 添加粒子系统的旋转效果
        this.particles.rotation.y = rotationAngle * 0.5 // 粒子系统也跟随旋转
      }
      
      // 发出动画更新事件
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: currentRotationX,
        phase: '间隙初始化动画第一阶段',
        progress: progress
      })
    }, {
      duration: 2000, // 800ms的第一阶段动画，增加阻尼感需要更多时间
      name: '间隙初始化动画第一阶段',
      easing: Easing.Elastic.Out(1.2, 0.3) // 弹性缓动，增加阻尼感
    })
    
    console.log('间隙初始化动画两个阶段已添加到时间线')
  }

  /**
   * 设置立方体动画时间线（用于点击开始按钮后的动画）
   */
  setupCubeAnimationTimeline() {
    // 重置时间线
    this.timeline.reset()
    
    // 第一阶段：急速拓展到1000，相机位置不变
    this.timeline.addCustom((progress) => {
      // 使用缓动函数让动画开始时急速，然后缓慢下来
      const easedProgress = Easing.Power.Out(3)(progress) // 开始时快，结束时慢
      
      // 立方体边长从60急速拓展到1000
      const newCubeSize = 60 + (800 - 60) * easedProgress
      
      // 间隙从8平滑过渡到12，与立方体变化协调
      const newGapSize = 8 + (12 - 8) * easedProgress
      
      // 粒子系统平滑缩放，避免突变
      if (this.particles && this.particles.material) {
        const smoothScale = 1 + (1.2 - 1) * easedProgress
        this.particles.scale.setScalar(smoothScale)
      }
      
      // 相机位置保持不变（移除所有相机运动代码）
      // 相机保持在初始位置，不进行任何移动
      
      // 发出动画更新事件
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: this.initialRotationX, // 保持初始旋转角度
        phase: '急速拓展到1000',
        progress: progress
      })
    }, {
      duration: 800,
      name: '急速拓展到1000',
      easing: Easing.Power.Out(3) // 开始时快，结束时慢
    })
    
    try {
      this.timeline.play()
      console.log('立方体动画时间线开始播放')
      
      // 添加动画完成回调
      this.timeline.on('complete', () => {
        console.log('立方体动画时间线播放完成')
        // 发出动画完成事件
        this.emit('animationComplete', { phase: 'complete' })
      })
      
      // 添加动画步骤回调
      this.timeline.on('step', (item, index) => {
        console.log(`开始播放动画: ${item.name}`)
        // 发出动画步骤事件
        this.emit('animationStep', { name: item.name, index: index })
      })
      
    } catch (error) {
      console.error('播放立方体动画时间线时出错:', error)
      // 发出错误事件
      this.emit('animationError', { error: error.message })
    }
  }

  /**
   * 设置其他类型的动画时间线
   * 可以根据需要添加更多动画类型
   */
  setupOtherTimeline(type, params) {
    switch (type) {
      case 'fade':
        this.setupFadeTimeline(params)
        break
      case 'slide':
        this.setupSlideTimeline(params)
        break
      default:
        console.warn(`未知的动画类型: ${type}`)
    }
  }

  /**
   * 淡入淡出动画
   */
  setupFadeTimeline(params) {
    // 实现淡入淡出动画逻辑
  }

  /**
   * 滑动动画
   */
  setupSlideTimeline(params) {
    // 实现滑动动画逻辑
  }
}
