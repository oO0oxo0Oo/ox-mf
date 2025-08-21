import { Easing } from '../composable/Easing.js'
import { useCubeStore } from '../stores/cube.js'
import { useAnimationStore } from '../stores/animation.js'

/**
 * 时间线动画管理器
 * 负责管理粒子系统和魔方的动画序列
 */
export class TimelineAnimationManager {
  constructor(timeline, scene, camera, particles, baseRadius, initialRotationX, initialRotationY, cubeInstance = null, animationStore = null) {
    this.timeline = timeline
    this.scene = scene
    this.camera = camera
    this.particles = particles
    this.baseRadius = baseRadius
    this.initialRotationX = initialRotationX
    this.initialRotationY = initialRotationY
    this.cubeInstance = cubeInstance
    this.animationStore = animationStore
    this.finalAdjustmentEmitted = false // 标记是否已发出最终调整完成事件
    
    // 直接获取 store 引用
    this.cubeStore = useCubeStore()
    this.animationStore = useAnimationStore()
  }

  setCubeInstance(cubeInstance) {
    this.cubeInstance = cubeInstance
  }

  // 获取魔方配置
  getCubeConfig() {
    return this.cubeStore.getCubeConfig()
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
      
      // 直接修改store的响应式数据，实现自动联动
      this.animationStore.particleParams.sizeMultiplier = newCubeSize
      this.animationStore.particleParams.gapMultiplier = newGapSize
      this.animationStore.cameraParams.rotationX = currentRotationX
      this.animationStore.animationState.currentPhase = '页面初始化入场动画'
      this.animationStore.animationState.progress = progress
      
      // 触发动画更新事件
      this.animationStore.triggerAnimationUpdate({
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
      const targetRotationY = -Math.PI / 2 
      const currentRotationX = this.initialRotationX + (targetRotationX - this.initialRotationX) * easedProgress
      const currentRotationY = this.initialRotationY + (targetRotationY - this.initialRotationY) * easedProgress

      
      // 更新摄像机位置
      this.updateCameraPosition(currentRotationX, currentRotationY)
        
      if (this.particles?.material) {
        const smoothScale = 1 + (1.2 - 1) * easedProgress
        this.particles.scale.setScalar(smoothScale)
        this.particles.rotation.y = Math.PI * 3 * easedProgress
      }
      
      // 直接修改store的响应式数据
      this.animationStore.particleParams.sizeMultiplier = newCubeSize
      this.animationStore.particleParams.gapMultiplier = newGapSize
      this.animationStore.cameraParams.rotationX = currentRotationX
      this.animationStore.cameraParams.rotationY = currentRotationY
      this.animationStore.animationState.currentPhase = '急速拓展动画'
      this.animationStore.animationState.progress = progress
      
      // 触发动画更新事件
      this.animationStore.triggerAnimationUpdate({
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

      // 直接修改store的响应式数据
      this.animationStore.particleParams.sizeMultiplier = newCubeSize
      this.animationStore.particleParams.gapMultiplier = newGapSize
      this.animationStore.cameraParams.rotationX = currentRotationX
      this.animationStore.cameraParams.rotationY = currentRotationY
      this.animationStore.animationState.currentPhase = '最终调整动画'
      this.animationStore.animationState.progress = progress
      
      // 触发动画更新事件
      this.animationStore.triggerAnimationUpdate({
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
      
      if (progress >= 0.9 && !this.finalAdjustmentEmitted) {
        this.finalAdjustmentEmitted = true
        if (this.animationStore && this.animationStore.triggerAnimationComplete) {
          this.animationStore.triggerAnimationComplete({ 
            phase: 'finalAdjustmentComplete',
            animationType: 'finalAdjustment',
            nextAction: 'cubeEntrance',
            isEarlyComplete: true // 标记为提前完成
          })
        }
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
      if (this.animationStore && this.animationStore.triggerAnimationError) {
        this.animationStore.triggerAnimationError({ error: '魔方实例未提供' })
      }
      return
    }

    // 获取最新的魔方配置
    const cubeConfig = this.getCubeConfig()

    this.timeline.reset()
    this.setupCubeInitialState(cubeInstance)

    this.timeline.addCustom((progress) => {
      // 使用调整后的弹性缓动函数，保持动态效果但减少数值跳跃
      const easedProgress = Easing.Elastic.Out(1.1, 0.4)(progress)
      const { newSize, newRadius, newColor, stickerOpacity } = this.calculateCubeEntranceValues(progress, easedProgress, cubeConfig)
      
      this.updateCubeGeometry(cubeInstance, newSize, newRadius, newColor, stickerOpacity)
      
      // 调整尺寸乘数，将最大值控制在75以下
      const sizeMultiplier = (newSize / cubeConfig.pieceSize) * (cubeConfig.type === 'cube2' ? 80 : 60)
      this.animationStore.particleParams.sizeMultiplier = sizeMultiplier
      this.animationStore.particleParams.gapMultiplier = cubeConfig.type === 'cube2' ? 0.1 : 0
      this.animationStore.cameraParams.rotationX = this.initialRotationX
      this.animationStore.animationState.currentPhase = '魔方出场动画'
      this.animationStore.animationState.progress = progress
      
      // 直接修改cube store的响应式数据
      this.cubeStore.config.pieceSize = newSize
      this.cubeStore.config.pieceCornerRadius = newRadius
      
      // 触发动画更新事件
      this.animationStore.triggerAnimationUpdate({
        cubeSizeMultiplier: sizeMultiplier,
        gapSizeMultiplier: cubeConfig.type === 'cube2' ? 0.1 : 0,
        currentRotationX: this.initialRotationX,

        cornerRadius: newRadius,
        pieceSize: newSize,
        currentColor: newColor,
        stickerOpacity: stickerOpacity,
        phase: '魔方出场动画',
        progress: progress,
        isCubeEntrance: true,
        cubeType: cubeConfig.type,
        cubeOrder: cubeConfig.cubeOrder
      })
    }, {
      duration: 1500,
      name: '魔方出场动画',
      easing: Easing.Elastic.Out(1.1, 0.4) // 调整弹性缓动参数，减少数值跳跃
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
      
      // 直接调用store的触发方法
      if (this.animationStore && this.animationStore.triggerAnimationComplete) {
        this.animationStore.triggerAnimationComplete({ 
          phase: phaseMap[animationType],
          animationType: animationType,
          nextAction: this.getNextAction(animationType)
        })
      }
      
      if (onComplete) onComplete()
      if (onCompleteExtra) onCompleteExtra()
    })

    this.timeline.on('step', (item, index) => {
      // 直接调用store的触发方法
      if (this.animationStore && this.animationStore.triggerAnimationStep) {
        this.animationStore.triggerAnimationStep({ 
          name: item.name, 
          index: index,
          animationType: animationType
        })
      }
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
      // 确保初始状态与动画计算的起始值完全一致
      const initialSize = 0.05
      const initialRadius = 0.5
      const initialColor = 0x41aac8
      
      cubeInstance.regenerateModel(initialSize)
      cubeInstance.updatePieceCornerRadius(initialRadius)
      cubeInstance.updateMainColor(initialColor)
      cubeInstance.hideEdges()
      
      // 同时更新store中的初始值，确保一致性
      if (this.cubeStore) {
        this.cubeStore.config.pieceSize = initialSize
        this.cubeStore.config.pieceCornerRadius = initialRadius
      }
    } catch (error) {
      console.error('设置魔方初始状态失败:', error)
      if (this.animationStore && this.animationStore.triggerAnimationError) {
        this.animationStore.triggerAnimationError({ error: error.message })
      }
    }
  }

  calculateCubeEntranceValues(progress, easedProgress, cubeConfig) {
    // 修复边长计算逻辑，确保从小到大的平滑过渡
    const startSize = 0.05  // 起始尺寸保持很小
    const defaultPieceSize = cubeConfig?.pieceSize || 1/3
    const newSize = startSize + (defaultPieceSize - startSize) * easedProgress

    // 修复圆角半径计算，确保平滑过渡
    const startRadius = 0.5
    const defaultCornerRadius = cubeConfig?.pieceCornerRadius || 0.12
    const newRadius = startRadius + (defaultCornerRadius - startRadius) * easedProgress

    // 颜色过渡保持原有逻辑
    const colorTransitionDuration = 0.6
    const colorProgress = Math.min(progress / colorTransitionDuration, 1)
    const easedColorProgress = Easing.Smooth.InOut()(colorProgress)
    const newColor = this.interpolateColor(0x41aac8, 0x1a1a2e, easedColorProgress)

    // 贴片透明度过渡
    const stickerStartThreshold = 0.4
    const stickerEndThreshold = 0.9
    let stickerOpacity = 0
    
    if (progress > stickerStartThreshold && progress <= stickerEndThreshold) {
      const stickerProgress = (progress - stickerStartThreshold) / (stickerEndThreshold - stickerStartThreshold)
      stickerOpacity = Easing.Smooth.InOut()(stickerProgress) * 0.85
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
      if (this.animationStore && this.animationStore.triggerAnimationError) {
        this.animationStore.triggerAnimationError({ error: error.message })
      }
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
  // 使用统一的 Easing 库，不再需要自定义缓动函数

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
