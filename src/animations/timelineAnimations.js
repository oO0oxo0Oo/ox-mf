import { Easing } from '../composable/Easing.js'

/**
 * 时间线动画管理器
 * 负责管理粒子系统的动画序列
 */
export class TimelineAnimationManager {
  constructor(timeline, scene, camera, particles, baseRadius, initialRotationX, initialRotationY, cubeInstance = null) {
    this.timeline = timeline
    this.scene = scene
    this.camera = camera
    this.particles = particles
    this.baseRadius = baseRadius
    this.initialRotationX = initialRotationX
    this.initialRotationY = initialRotationY
    this.cubeInstance = cubeInstance
    this.eventListeners = {}
  }

  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }
    this.eventListeners[eventName].push(listener)
  }

  off(eventName, listener) {
    if (this.eventListeners[eventName]) {
      const index = this.eventListeners[eventName].indexOf(listener)
      if (index > -1) {
        this.eventListeners[eventName].splice(index, 1)
      }
    }
  }

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
  
  setCubeInstance(cubeInstance) {
    this.cubeInstance = cubeInstance
  }

  /**
   * 设置初始化动画时间线 - 页面加载时的入场效果
   */
  setupInitializationTimeline() {
    this.timeline.reset()
    
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Elastic.Out(1.2, 0.3)(progress)
      const newGapSize = 5 * easedProgress
      const newCubeSize = 60
      const rotationAngle = (360 * Math.PI / 180) * easedProgress
      const currentRotationX = this.initialRotationX + rotationAngle
      
      if (this.particles && this.particles.material) {
        this.particles.scale.setScalar(1.0)
        this.particles.rotation.y = rotationAngle * 0.5
      }
      
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: currentRotationX,
        phase: '页面初始化入场动画',
        progress: progress
      })
    }, {
      duration: 2000,
      name: '页面初始化入场动画',
      easing: Easing.Elastic.Out(1.2, 0.3)
    })
    
    // 启动动画播放
    this.timeline.play()
  }

  /**
   * 设置用户触发动画时间线 - 点击开始按钮后的动画序列
   * @deprecated 此方法已被拆分为两个独立的阶段，请使用 setupRapidExpansionAnimation 和 setupFinalAdjustmentAnimation
   */
  setupUserTriggeredTimeline() {
    console.warn('setupUserTriggeredTimeline 已被废弃，请使用 setupRapidExpansionAnimation 和 setupFinalAdjustmentAnimation')
    this.setupRapidExpansionAnimation()
  }

  /**
   * 急速拓展动画 - 第一阶段独立动画
   * 从初始状态快速拓展到最大尺寸，完全独立执行
   */
  setupRapidExpansionAnimation(onComplete = null) {
    this.timeline.reset()
    
    // 急速拓展阶段：从60到800的快速扩展
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Power.Out(3)(progress)
      const newCubeSize = 60 + (800 - 60) * easedProgress
      const newGapSize = 8 + (12 - 8) * easedProgress
      
      // 粒子系统同步缩放
      if (this.particles && this.particles.material) {
        const smoothScale = 1 + (1.2 - 1) * easedProgress
        this.particles.scale.setScalar(smoothScale)
        this.particles.rotation.y = Math.PI * 0.5 * easedProgress // 添加旋转效果
      }
      
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: this.initialRotationX,
        phase: '急速拓展动画',
        progress: progress,
        animationType: 'rapidExpansion'
      })
    }, {
      duration: 800,
      name: '急速拓展动画',
      easing: Easing.Power.Out(3)
    })
    
    this.timeline.play()
    
    // 动画完成处理
    this.timeline.on('complete', () => {
      this.emit('animationStep', { 
        name: '急速拓展动画完成', 
        index: 0,
        animationType: 'rapidExpansion'
      })
      
      // 触发急速拓展完成事件
      this.emit('animationComplete', { 
        phase: 'rapidExpansionComplete',
        animationType: 'rapidExpansion',
        nextAction: 'waitForUserInput' // 明确指示需要等待用户输入
      })
      
      // 执行回调函数（如果提供）
      if (onComplete && typeof onComplete === 'function') {
        try {
          onComplete()
        } catch (error) {
          console.error('急速拓展动画完成回调执行错误:', error)
          this.emit('animationError', { error: error.message, phase: 'rapidExpansion' })
        }
      }
    })
    
    this.timeline.on('step', (item, index) => {
      this.emit('animationStep', { 
        name: item.name, 
        index: index,
        animationType: 'rapidExpansion'
      })
    })
  }

  /**
   * 最终调整动画 - 第二阶段独立动画
   * 从拓展状态调整到最终形态，包含摄像机移动和粒子调整
   */
  setupFinalAdjustmentAnimation(onComplete = null) {
    this.timeline.reset()
    
    // 最终调整阶段：从800收缩到40，添加摄像机动画和粒子效果
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Power.InOut(2)(progress)
      const newCubeSize = 800 + (40 - 800) * easedProgress
      const newGapSize = 12 + (0 - 12) * easedProgress
      
      // 摄像机旋转动画
      const finalRotationX = this.initialRotationX + Math.PI * 0.3
      const finalRotationY = this.initialRotationY + Math.PI * 0.2
      const currentRotationX = this.initialRotationX + (finalRotationX - this.initialRotationX) * easedProgress
      const currentRotationY = this.initialRotationY + (finalRotationY - this.initialRotationY) * easedProgress
      
      // 更新摄像机位置
      if (this.camera) {
        const cameraX = Math.sin(currentRotationX) * Math.cos(currentRotationY) * this.baseRadius
        const cameraY = Math.sin(currentRotationY) * this.baseRadius
        const cameraZ = Math.cos(currentRotationX) * Math.cos(currentRotationY) * this.baseRadius
        
        this.camera.position.set(cameraX, cameraY, cameraZ)
        this.camera.lookAt(0, 0, 0)
      }
      
      // 粒子系统最终调整
      if (this.particles && this.particles.material) {
        const finalParticleScale = 1.2 + (0.8 - 1.2) * easedProgress
        this.particles.scale.setScalar(finalParticleScale)
        // 粒子透明度逐渐降低，为魔方出场做准备
        const particleOpacity = 1.0 - (0.3 * easedProgress)
        if (this.particles.material.opacity !== undefined) {
          this.particles.material.opacity = particleOpacity
        }
      }
      
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: currentRotationX,
        currentRotationY: currentRotationY,
        phase: '最终调整动画',
        progress: progress,
        animationType: 'finalAdjustment'
      })
    }, {
      duration: 500,
      name: '最终调整动画',
      easing: Easing.Power.InOut(2)
    })
    
    this.timeline.play()
    
    // 动画完成处理
    this.timeline.on('complete', () => {
      this.emit('animationStep', { 
        name: '最终调整动画完成，准备魔方出场', 
        index: 0,
        animationType: 'finalAdjustment'
      })
      
      // 触发最终调整完成事件
      this.emit('animationComplete', { 
        phase: 'finalAdjustmentComplete',
        animationType: 'finalAdjustment',
        nextAction: 'cubeEntrance' // 指示下一步是魔方出场动画
      })
      
      // 执行回调函数（如果提供）
      if (onComplete && typeof onComplete === 'function') {
        try {
          onComplete()
        } catch (error) {
          console.error('最终调整动画完成回调执行错误:', error)
          this.emit('animationError', { error: error.message, phase: 'finalAdjustment' })
        }
      }
    })
    
    this.timeline.on('step', (item, index) => {
      this.emit('animationStep', { 
        name: item.name, 
        index: index,
        animationType: 'finalAdjustment'
      })
    })
  }

  /**
   * @deprecated 使用 setupFinalAdjustmentAnimation 替代
   */
  continueToSecondPhase() {
    console.warn('continueToSecondPhase 已被废弃，请使用 setupFinalAdjustmentAnimation')
    this.setupFinalAdjustmentAnimation()
  }

  /**
   * @deprecated 使用 setupFinalAdjustmentAnimation 替代
   */
  setupSecondPhaseAnimation() {
    console.warn('setupSecondPhaseAnimation 已被废弃，请使用 setupFinalAdjustmentAnimation')
    this.setupFinalAdjustmentAnimation()
  }

  /**
   * 设置魔方出场动画时间线（集成到统一系统）
   */
  setupCubeEntranceTimeline(cubeInstance) {
    if (!cubeInstance) {
      console.error('魔方实例未提供，无法启动出场动画')
      this.emit('animationError', { error: '魔方实例未提供' })
      return
    }

    this.timeline.reset()
    
    // 设置魔方初始状态
    try {
      cubeInstance.regenerateModel(0.05)
      cubeInstance.updatePieceCornerRadius(0.5)
      cubeInstance.updateMainColor(0x41aac8) // 粒子蓝色
      cubeInstance.hideEdges() // 初始隐藏所有贴面
    } catch (error) {
      console.error('设置魔方初始状态失败:', error)
      this.emit('animationError', { error: error.message })
      return
    }

    // 魔方出场动画：边长增长、角半径调整、颜色渐变和贴面显示
    this.timeline.addCustom((progress) => {
      // 使用弹性缓动函数
      const easedProgress = this.elasticEasing(progress)
      
      // 立方体边长从0.05平滑过渡到默认尺寸
      const startSize = 0.05
      const defaultPieceSize = 1/3
      const newSize = startSize + (defaultPieceSize - startSize) * easedProgress

      // 角半径从0.5平滑过渡到默认状态
      const startRadius = 0.5
      const defaultCornerRadius = 0.12
      const newRadius = startRadius + (defaultCornerRadius - startRadius) * easedProgress

      // 颜色渐变：从粒子蓝到深色
      const colorTransitionDuration = 0.6
      const colorProgress = Math.min(progress / colorTransitionDuration, 1)
      const easedColorProgress = this.smoothEasing(colorProgress)
      const newColor = this.interpolateColor(0x41aac8, 0x1a1a2e, easedColorProgress)

      // 贴面透明度控制：在动画的中后段（40%后）开始显示贴面，更早展示颜色
      const stickerStartThreshold = 0.4
      const stickerEndThreshold = 0.9
      let stickerOpacity = 0
      
      if (progress > stickerStartThreshold && progress <= stickerEndThreshold) {
        // 在40%-90%之间渐变显示贴面
        const stickerProgress = (progress - stickerStartThreshold) / (stickerEndThreshold - stickerStartThreshold)
        stickerOpacity = this.smoothEasing(stickerProgress) * 0.85 // 最大透明度设为0.85，保持一些透明感
      } else if (progress > stickerEndThreshold) {
        // 90%后完全显示
        stickerOpacity = 1.0
      }

      // 更新魔方几何体
      try {
        cubeInstance.regenerateModel(newSize)
        cubeInstance.updatePieceCornerRadius(newRadius)
        cubeInstance.updateMainColor(newColor)
        
        // 控制贴面显示
        this.updateStickerOpacity(cubeInstance, stickerOpacity)
      } catch (error) {
        console.error('更新魔方几何体失败:', error)
        this.emit('animationError', { error: error.message })
        return
      }

      // 发出动画更新事件
      this.emit('animationUpdate', {
        cubeSizeMultiplier: (newSize / defaultPieceSize) * 60,
        gapSizeMultiplier: 0,
        currentRotationX: this.initialRotationX,
        cornerRadius: newRadius,
        pieceSize: newSize,
        currentColor: newColor,
        colorProgress: easedColorProgress,
        stickerOpacity: stickerOpacity,
        phase: '魔方出场动画：边长增长、角半径调整、颜色渐变和贴面显示',
        progress: progress,
        isCubeEntrance: true // 标记为魔方出场动画
      })
    }, {
      duration: 2000,
      name: '魔方出场动画',
      easing: this.elasticEasing
    })

    this.timeline.play()

    this.timeline.on('complete', () => {
   
      cubeInstance.showEdges()
      this.updateStickerOpacity(cubeInstance, 1.0)
      
      this.emit('animationComplete', { 
        phase: 'cubeEntranceComplete',
        isCubeEntrance: true
      })
    })

    this.timeline.on('step', (item, index) => {
      this.emit('animationStep', { 
        name: item.name, 
        index: index,
        isCubeEntrance: true
      })
    })
  }

  // ===== 辅助方法 =====

  updateStickerOpacity(cubeInstance, opacity) {
    if (!cubeInstance?.edges) return
    
    cubeInstance.edges.forEach(edge => {
      if (edge?.material) {
        // 确保材质支持透明度
        if (!edge.material.transparent) {
          edge.material.transparent = true
          edge.material.needsUpdate = true
        }
        
        // 直接设置透明度
        edge.visible = opacity > 0
        edge.material.opacity = opacity
      }
    })
  }

  /**
   * 弹性缓动函数
   */
  elasticEasing(progress) {
    const p = 0.3
    return Math.pow(2, -10 * progress) * Math.sin((progress - p / 4) * (2 * Math.PI) / p) + 1
  }

  /**
   * 平滑缓动函数
   */
  smoothEasing(progress) {
    return progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
  }

  /**
   * 颜色插值函数
   */
  interpolateColor(color1, color2, factor) {
    const r1 = (color1 >> 16) & 255
    const g1 = (color1 >> 8) & 255
    const b1 = color1 & 255
    
    const r2 = (color2 >> 16) & 255
    const g2 = (color2 >> 8) & 255
    const b2 = color2 & 255
    
    const r = Math.round(r1 + (r2 - r1) * factor)
    const g = Math.round(g1 + (g2 - g1) * factor)
    const b = Math.round(b1 + (b2 - b1) * factor)
    
    return (r << 16) | (g << 8) | b
  }
}
