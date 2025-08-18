import { Easing } from '../composable/Easing.js'

/**
 * 时间线动画管理器
 * 负责管理粒子系统和魔方的动画序列
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
    this.finalAdjustmentEmitted = false // 标记是否已发出最终调整完成事件
  }

  // ===== 事件系统 =====
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

  // ===== 动画时间线设置 =====

  /**
   * 页面初始化入场动画
   */
  setupInitializationTimeline() {
    this.timeline.reset()
    
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Elastic.Out(1.2, 0.3)(progress)
      const newGapSize = 5 * easedProgress
      const newCubeSize = 60
      const rotationAngle = (360 * Math.PI / 180) * easedProgress
      const currentRotationX = this.initialRotationX + rotationAngle
      
      if (this.particles?.material) {
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
    
    this.timeline.play()
  }

  /**
   * 急速拓展动画 - 第一阶段
   */
  setupRapidExpansionAnimation(onComplete = null) {
    this.timeline.reset()
    
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Power.Out(3)(progress)
            const newCubeSize = 60 + (800 - 60) * easedProgress
      const newGapSize = 8 + (12 - 8) * easedProgress
      
      // 视角调整：逐渐调整到向上看（朝向头顶）
      const targetRotationX = this.initialRotationX // 保持X轴角度不变
      const targetRotationY = -Math.PI / 2 // 目标Y轴角度：-60度，向上看（朝向头顶）
      const currentRotationX = this.initialRotationX + (targetRotationX - this.initialRotationX) * easedProgress
      const currentRotationY = this.initialRotationY + (targetRotationY - this.initialRotationY) * easedProgress
      
      // 更新摄像机位置
      this.updateCameraPosition(currentRotationX, currentRotationY)
        
      if (this.particles?.material) {
        const smoothScale = 1 + (1.2 - 1) * easedProgress
        this.particles.scale.setScalar(smoothScale)
        this.particles.rotation.y = Math.PI * 3 * easedProgress
      }
      
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: currentRotationX,
        currentRotationY: currentRotationY,
        phase: '急速拓展动画',
        progress: progress,
        animationType: 'rapidExpansion'
      })
    }, {
      duration: 800,
      name: '急速拓展动画',
      easing: Easing.Power.Out(3)
    })
    
    this.setupTimelineEvents('rapidExpansion', onComplete)
    this.timeline.play()
  }

  /**
   * 最终调整动画 - 第二阶段
   */
  setupFinalAdjustmentAnimation(onComplete = null) {
    this.timeline.reset()
    this.finalAdjustmentEmitted = false // 重置标记，确保每次动画都能正确触发
    
    this.timeline.addCustom((progress) => {
      const easedProgress = Easing.Power.InOut(2)(progress)
      const newCubeSize = 800 + (1 - 800) * easedProgress
      const newGapSize = 12 + (0 - 12) * easedProgress
      
      // 保持第一阶段结束时的相机位置（向上看的位置）
      const firstPhaseEndRotationX = this.initialRotationX // X轴保持45度
      const firstPhaseEndRotationY = -Math.PI / 2 // Y轴保持-90度（向上看）
      const currentRotationX = firstPhaseEndRotationX
      const currentRotationY = firstPhaseEndRotationY
      
      // 魔方加速旋转：从慢到快的水平旋转效果
      const rotationSpeed = 1 + (easedProgress * 4) // 旋转速度从1倍加速到5倍
      const totalRotation = Math.PI * 2 * rotationSpeed * easedProgress * 5 // 总旋转角度，转5圈
      
      // 通过粒子系统旋转来模拟魔方旋转效果
      if (this.particles) {
        this.particles.rotation.y = totalRotation
      }
      
      this.updateParticlesForFinalAdjustment(easedProgress)

      // 提前发出动画更新事件
      this.emit('animationUpdate', {
        cubeSizeMultiplier: newCubeSize,
        gapSizeMultiplier: newGapSize,
        currentRotationX: currentRotationX,
        currentRotationY: currentRotationY,
        cubeRotationY: totalRotation, // 魔方Y轴旋转角度
        rotationSpeed: rotationSpeed, // 当前旋转速度倍数
        phase: '最终调整动画',
        progress: progress,
        animationType: 'finalAdjustment'
      })
      
      // 在动画进行到80%时提前发出完成事件，让动画继续运行
      if (progress >= 0.9 && !this.finalAdjustmentEmitted) {
        this.finalAdjustmentEmitted = true
        this.emit('animationComplete', { 
          phase: 'finalAdjustmentComplete',
          animationType: 'finalAdjustment',
          nextAction: 'cubeEntrance',
          isEarlyComplete: true // 标记为提前完成
        })
      }
    }, {
      duration: 1000,
      name: '最终调整动画',
      easing: Easing.Power.InOut(2)
    })
    
    this.setupTimelineEvents('finalAdjustment', onComplete)
    this.timeline.play()
  }

  /**
   * 魔方出场动画
   */
  setupCubeEntranceTimeline(cubeInstance) {
    if (!cubeInstance) {
      console.error('魔方实例未提供，无法启动出场动画')
      this.emit('animationError', { error: '魔方实例未提供' })
      return
    }

    this.timeline.reset()
    this.setupCubeInitialState(cubeInstance)

    this.timeline.addCustom((progress) => {
      const easedProgress = this.elasticEasing(progress)
      
      const { newSize, newRadius, newColor, stickerOpacity } = this.calculateCubeEntranceValues(progress, easedProgress)
      
      this.updateCubeGeometry(cubeInstance, newSize, newRadius, newColor, stickerOpacity)
      
      this.emit('animationUpdate', {
        cubeSizeMultiplier: (newSize / (1/3)) * 60,
        gapSizeMultiplier: 0,
        currentRotationX: this.initialRotationX,
        cornerRadius: newRadius,
        pieceSize: newSize,
        currentColor: newColor,
        stickerOpacity: stickerOpacity,
        phase: '魔方出场动画',
        progress: progress,
        isCubeEntrance: true
      })
    }, {
      duration: 2000,
      name: '魔方出场动画',
      easing: this.elasticEasing
    })

    this.setupTimelineEvents('cubeEntrance', null, () => {
      cubeInstance.showEdges()
      this.updateStickerOpacity(cubeInstance, 1.0)
    })
    
    this.timeline.play()
  }

  // ===== 辅助方法 =====

  setupTimelineEvents(animationType, onComplete, onCompleteExtra = null) {
    this.timeline.on('complete', () => {
      const phaseMap = {
        rapidExpansion: 'rapidExpansionComplete',
        finalAdjustment: 'finalAdjustmentComplete',
        cubeEntrance: 'cubeEntranceComplete'
      }
      
      this.emit('animationComplete', { 
        phase: phaseMap[animationType],
        animationType: animationType,
        nextAction: this.getNextAction(animationType)
      })
      
      if (onComplete) onComplete()
      if (onCompleteExtra) onCompleteExtra()
    })

    this.timeline.on('step', (item, index) => {
      this.emit('animationStep', { 
        name: item.name, 
        index: index,
        animationType: animationType
      })
    })
  }

  getNextAction(animationType) {
    const actionMap = {
      rapidExpansion: 'waitForUserInput',
      finalAdjustment: 'cubeEntrance',
      cubeEntrance: 'animationComplete'
    }
    return actionMap[animationType]
  }

  updateCameraPosition(rotationX, rotationY) {
    if (!this.camera) return
    
    // 使用球坐标系计算相机位置
    const cameraX = Math.sin(rotationX) * Math.cos(rotationY) * this.baseRadius
    const cameraY = Math.sin(rotationY) * this.baseRadius
    const cameraZ = Math.cos(rotationX) * Math.cos(rotationY) * this.baseRadius
    
    // 设置相机位置
    this.camera.position.set(cameraX, cameraY, cameraZ)
    
    // 让相机始终看向原点
    this.camera.lookAt(0, 0, 0)
  }

  updateParticlesForFinalAdjustment(progress) {
    if (!this.particles?.material) return
    
    const finalParticleScale = 1.2 + (0.8 - 1.2) * progress
    this.particles.scale.setScalar(finalParticleScale)
    
    const particleOpacity = 1.0 - (0.3 * progress)
    if (this.particles.material.opacity !== undefined) {
      this.particles.material.opacity = particleOpacity
    }
  }

  setupCubeInitialState(cubeInstance) {
    try {
      cubeInstance.regenerateModel(0.05)
      cubeInstance.updatePieceCornerRadius(0.5)
      cubeInstance.updateMainColor(0x41aac8)
      cubeInstance.hideEdges()
    } catch (error) {
      console.error('设置魔方初始状态失败:', error)
      this.emit('animationError', { error: error.message })
    }
  }

  calculateCubeEntranceValues(progress, easedProgress) {
    const startSize = 0.05
    const defaultPieceSize = 1/3
    const newSize = startSize + (defaultPieceSize - startSize) * easedProgress

    const startRadius = 0.5
    const defaultCornerRadius = 0.12
    const newRadius = startRadius + (defaultCornerRadius - startRadius) * easedProgress

    const colorTransitionDuration = 0.6
    const colorProgress = Math.min(progress / colorTransitionDuration, 1)
    const easedColorProgress = this.smoothEasing(colorProgress)
    const newColor = this.interpolateColor(0x41aac8, 0x1a1a2e, easedColorProgress)

    const stickerStartThreshold = 0.4
    const stickerEndThreshold = 0.9
    let stickerOpacity = 0
    
    if (progress > stickerStartThreshold && progress <= stickerEndThreshold) {
      const stickerProgress = (progress - stickerStartThreshold) / (stickerEndThreshold - stickerStartThreshold)
      stickerOpacity = this.smoothEasing(stickerProgress) * 0.85
    } else if (progress > stickerEndThreshold) {
      stickerOpacity = 1.0
    }

    return { newSize, newRadius, newColor, stickerOpacity }
  }

  updateCubeGeometry(cubeInstance, newSize, newRadius, newColor, stickerOpacity) {
    try {
      cubeInstance.regenerateModel(newSize)
      cubeInstance.updatePieceCornerRadius(newRadius)
      cubeInstance.updateMainColor(newColor)
      this.updateStickerOpacity(cubeInstance, stickerOpacity)
    } catch (error) {
      console.error('更新魔方几何体失败:', error)
      this.emit('animationError', { error: error.message })
    }
  }

  updateStickerOpacity(cubeInstance, opacity) {
    if (!cubeInstance?.edges) return
    
    cubeInstance.edges.forEach(edge => {
      if (edge?.material) {
        if (!edge.material.transparent) {
          edge.material.transparent = true
          edge.material.needsUpdate = true
        }
        
        edge.visible = opacity > 0
        edge.material.opacity = opacity
      }
    })
  }

  // ===== 缓动函数 =====
  elasticEasing(progress) {
    const p = 0.3
    return Math.pow(2, -10 * progress) * Math.sin((progress - p / 4) * (2 * Math.PI) / p) + 1
  }

  smoothEasing(progress) {
    return progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
  }

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
