import { defineStore } from "pinia"
import { ref, reactive, markRaw } from 'vue'
import { cubeFactory } from '../models/CubeFactory.js'
import { useRotationQueue } from '../composable/useRotationQueue.js'
import { useScramble } from "../composable/useScramble.js"
import { getThemeColors, getAvailableThemes as getThemeList } from '../config/themes.js'

export const useCubeStore = defineStore("cube", () => {
  // 核心状态
  const isInitialized = ref(false)
  const isAnimating = ref(false)
  
  // 配置 - 直接暴露响应式对象，外部可以直接修改
  const config = reactive({
    size: 3,
    theme: 'classic',
    animationSpeed: 1.0,
    cubeType: 'cube3',
    pieceSize: 1/3,
    pieceCornerRadius: 0.12,
    edgeCornerRoundness: 0.08,
    edgeScale: 1.0
  })

  // 魔方实例
  let cubeInstance = null

  // 核心方法
  function initCube(scene) {
    if (isInitialized.value) return
    
    cubeInstance = markRaw(cubeFactory.createCube(config.cubeType, scene))
    if (!cubeInstance) {
      console.error(`无法创建魔方类型: ${config.cubeType}`)
      return
    }
    
    cubeInstance.init()
    
    // 初始化后立即应用主题颜色
    if (cubeInstance.updateColors) {
      const colors = getThemeColors(config.theme)
      cubeInstance.updateColors(colors)
    }
    
    isInitialized.value = true
  }

  function resetCube() {
    if (!cubeInstance) return
    cubeInstance.reset()
  }

  function scrambleCube(rotationQueue, queue) {
    if (!queue) {
      queue = useScramble();
    }
    if (rotationQueue) {
      rotationQueue.rotationQueue(queue);
    }
  }

  function solve() {
    return cubeInstance?.getCubeState();
  }

  // 魔方类型设置 - 保留这个因为需要同时更新多个相关配置
  function setCubeType(type) {
    config.cubeType = type
    
    if (type === 'cube2') {
      config.size = 2
      config.pieceSize = 1/2
      config.pieceCornerRadius = 0.15
    } else if (type === 'cube3') {
      config.size = 3
      config.pieceSize = 1/3
      config.pieceCornerRadius = 0.12
    } else if (type === 'cube4') {
      config.size = 4
      config.pieceSize = 1/4
      config.pieceCornerRadius = 0.11
    }
  }

  // 主题管理方法
  function setTheme(themeName) {
    config.theme = themeName
    
    // 如果魔方已经初始化，更新颜色
    if (cubeInstance?.updateColors) {
      const colors = getThemeColors(themeName)
      cubeInstance.updateColors(colors)
    }
  }

  function updateCubeColors() {
    if (!cubeInstance) return
    
    const colors = getThemeColors(config.theme)
    cubeInstance.updateColors?.(colors)
  }

  // 监听配置变化，自动更新魔方实例
  function updateCubeInstanceFromConfig() {
    if (!cubeInstance) return
    
    // 自动更新魔方实例的几何属性
    cubeInstance.updatePieceSize(config.pieceSize)
    cubeInstance.updatePieceCornerRadius(config.pieceCornerRadius)
    cubeInstance.updateEdgeCornerRoundness(config.edgeCornerRoundness)
    cubeInstance.updateEdgeScale(config.edgeScale)
  }

  return {
    // 状态 - 直接暴露响应式引用
    isInitialized,
    isAnimating,
    config, // 直接暴露，外部可以直接修改
    
    // 方法
    initCube,
    resetCube,
    scrambleCube,
    setCubeType,
    solve,
    setTheme,
    updateCubeColors,
    
    // 获取实例
    getCubeInstance: () => cubeInstance,
    
    // 配置更新后的回调
    updateCubeInstanceFromConfig,
    
    // 必要的getter函数（其他地方在使用）
    getCubeConfig: () => ({ ...config }),
    getCurrentTheme: () => config.theme,
    getAvailableThemes: () => getThemeList(),
    
    // 直接暴露常量，无需包装函数
    availableCubeTypes: ['cube3', 'cube2', 'cube4']
  }
})