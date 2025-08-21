import { defineStore } from "pinia"
import { ref, reactive, markRaw } from 'vue'
import { cubeFactory } from '../models/CubeFactory.js'
import { useRotationQueueStore } from './rotationQueue.js'
import { useScramble } from "../composable/useScramble.js"
import { getThemeColors, getAvailableThemes as getThemeList } from '../config/themes.js'
import { useAnimationStore } from './animation.js'

export const useCubeStore = defineStore("cube", () => {
  // 核心状态
  const isInitialized = ref(false)
  const isAnimating = ref(false)
  const state = ref('idle') // idle, rotating, scrambling, solved
  
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

  // 游戏数据
  const gameData = reactive({
    moves: [],
    solveTime: 0,
    isSolved: false,
    scramble: null
  })

  // 控制状态
  const controls = reactive({
    isEnabled: false,
    flipConfig: 0
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
    state.value = 'idle'
    
    const rotationQueueStore = useRotationQueueStore()
    rotationQueueStore.setCubeInstance(cubeInstance)
  }

  function resetCube() {
    if (!cubeInstance) return
    cubeInstance.reset()
    gameData.moves = []
    gameData.isSolved = false
    gameData.scramble = null
    state.value = 'idle'
  }

  // 控制方法
  function enableControls() {
    controls.isEnabled = true
  }

  function disableControls() {
    controls.isEnabled = false
  }

  // 游戏方法
  function addMove(move) {
    gameData.moves.push(move)
  }

  function setSolved(solved) {
    gameData.isSolved = solved
  }

  function setScramble(scrambleData) {
    gameData.scramble = scrambleData
  }

  function scrambleCube(queue) {
    const rotationQueueStore = useRotationQueueStore();
    if (!queue) {
      queue = useScramble();
    }
    rotationQueueStore.rotationQueue(queue);
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
    const availableThemes = getThemeList()
    console.log('可用主题列表:', availableThemes);
    
    // 检查主题是否存在
    const themeExists = availableThemes.find(t => t.key === themeName);
    console.log('找到的主题:', themeExists);
    
    if (themeExists) {
      config.theme = themeName
      console.log('主题已设置到config:', config.theme);
      
      // 如果魔方已经初始化，更新颜色并触发动画
      if (cubeInstance && cubeInstance.updateColors) {
        const colors = getThemeColors(themeName)
        console.log('应用新主题颜色:', colors);
        cubeInstance.updateColors(colors)
        
        // 通过animationStore访问动画器
        const animationStore = useAnimationStore()
        const animationManager = animationStore.instances?.animationManager
        
        if (animationManager && animationManager.setupCubeEntranceTimeline) {
          console.log('触发主题切换动画');
          animationManager.setupCubeEntranceTimeline(cubeInstance);
        } else {
          console.warn('未找到动画管理器，无法播放主题切换动画');
        }
      } else {
        console.log('魔方实例未初始化或没有updateColors方法');
      }
      return true
    } else {
      console.error('主题不存在:', themeName);
      return false
    }
  }

  function getAvailableCubeTypes() {
    return ['cube3', 'cube2', 'cube4']
  }

  function getCubeConfig() {
    return { ...config }
  }

  function getCurrentTheme() {
    return config.theme
  }

  function getAvailableThemes() {
    return getThemeList()
  }

  function updateCubeColors() {
    if (!cubeInstance) return
    
    const colors = getThemeColors(config.theme)
    
    // 调用魔方实例的颜色更新方法
    cubeInstance.updateColors?.(colors)
  }

  // 监听配置变化，自动更新魔方实例
  function updateCubeInstanceFromConfig() {
    if (!cubeInstance) return
    
    // 自动更新魔方实例的几何属性
    if (cubeInstance.updatePieceSize) {
      cubeInstance.updatePieceSize(config.pieceSize)
    }
    if (cubeInstance.updatePieceCornerRadius) {
      cubeInstance.updatePieceCornerRadius(config.pieceCornerRadius)
    }
    if (cubeInstance.updateEdgeCornerRoundness) {
      cubeInstance.updateEdgeCornerRoundness(config.edgeCornerRoundness)
    }
    if (cubeInstance.updateEdgeScale) {
      cubeInstance.updateEdgeScale(config.edgeScale)
    }
  }

  return {
    // 状态 - 直接暴露响应式引用
    isInitialized,
    isAnimating,
    state,
    config, // 直接暴露，外部可以直接修改
    gameData,
    controls,
    
    // 方法
    initCube,
    resetCube,
    enableControls,
    disableControls,
    addMove,
    setSolved,
    setScramble,
    scrambleCube,
    setCubeType, // 保留这个因为需要同时更新多个相关配置
    getAvailableCubeTypes,
    solve,
    getCubeConfig,
    
    // 主题方法
    setTheme,
    getCurrentTheme,
    getAvailableThemes,
    updateCubeColors,
    
    // 获取实例
    getCubeInstance: () => cubeInstance,
    
    // 配置更新后的回调
    updateCubeInstanceFromConfig
  }
})