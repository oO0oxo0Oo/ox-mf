import { defineStore } from "pinia"
import { ref, reactive, markRaw } from 'vue'
import { cubeFactory } from '../models/CubeFactory.js'
import { useRotationQueueStore } from './rotationQueue.js'
import { useScramble } from "../composable/useScramble.js";

export const useCubeStore = defineStore("cube", () => {
  // 核心状态
  const isInitialized = ref(false)
  const isAnimating = ref(false)
  const state = ref('idle') // idle, rotating, scrambling, solved
  
  // 配置
  const config = reactive({
    size: 3,
    theme: 'default',
    animationSpeed: 1.0,
    cubeType: 'cube3',
    pieceSize: 1/3,  // 小立方体边长，默认 1/3
    customPieceSize: null,  // 自定义小立方体边长，用于generateModel函数
    pieceCornerRadius: 0.12,  // 魔方块角半径
    edgeCornerRoundness: 0.08,  // 边缘圆润度
    edgeScale: 1.0  // 边缘缩放比例
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
    
    try {
      cubeInstance = markRaw(cubeFactory.createCube(config.cubeType, scene))
      if (!cubeInstance) {
        console.error(`无法创建魔方类型: ${config.cubeType}`)
        return
      }
      
      cubeInstance.init()
      isInitialized.value = true
      state.value = 'idle'
      
      // 设置旋转队列 store 的魔方实例
      const rotationQueueStore = useRotationQueueStore()
      rotationQueueStore.setCubeInstance(cubeInstance)
      
      console.log(`成功初始化魔方类型: ${config.cubeType}`)
    } catch (error) {
      console.error('魔方初始化失败:', error)
    }
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
      queue = useScramble(); // 如果没有传入队列，使用默认打乱
    }
    rotationQueueStore.rotationQueue(queue);
    // state.value = 'scrambling'
  }

  function solve() {
    // 获取当前魔方状态
    const currentState = cubeInstance.getCubeState();  
    
    return currentState;
  }

  // 配置方法
  function setCubeType(type) {
    config.cubeType = type
  }

  function setPieceSize(size) {
    config.pieceSize = size
    // 如果魔方已经初始化，重新生成模型
    if (cubeInstance && cubeInstance.updatePieceSize) {
      cubeInstance.updatePieceSize(size)
    }
  }

  function setCustomPieceSize(size) {
    config.customPieceSize = size
    // 如果魔方已经初始化，重新生成位置和模型
    if (cubeInstance && cubeInstance.regenerateModel) {
      cubeInstance.regenerateModel(size)
    }
  }

  function setPieceCornerRadius(radius) {
    config.pieceCornerRadius = radius
    // 如果魔方已经初始化，更新角半径
    if (cubeInstance && cubeInstance.updatePieceCornerRadius) {
      cubeInstance.updatePieceCornerRadius(radius)
    }
  }

  function setEdgeCornerRoundness(roundness) {
    config.edgeCornerRoundness = roundness
    // 如果魔方已经初始化，更新边缘圆润度
    if (cubeInstance && cubeInstance.updateEdgeCornerRoundness) {
      cubeInstance.updateEdgeCornerRoundness(roundness)
    }
  }

  function setEdgeScale(scale) {
    config.edgeScale = scale
    // 如果魔方已经初始化，更新边缘缩放
    if (cubeInstance && cubeInstance.updateEdgeScale) {
      cubeInstance.updateEdgeScale(scale)
    }
  }

  function getAvailableCubeTypes() {
    return ['cube3', 'cube2']
  }

  // ===== 新增：便利的参数获取方法 =====

  /**
   * 获取当前魔方的所有几何参数
   */
  function getCubeGeometry() {
    return {
      pieceSize: config.pieceSize,
      customPieceSize: config.customPieceSize,
      pieceCornerRadius: config.pieceCornerRadius,
      edgeCornerRoundness: config.edgeCornerRoundness,
      edgeScale: config.edgeScale
    }
  }

  /**
   * 批量更新魔方几何参数
   */
  function updateCubeGeometry(updates) {
    let hasChanges = false
    
    if (updates.pieceSize !== undefined) {
      setPieceSize(updates.pieceSize)
      hasChanges = true
    }
    
    if (updates.customPieceSize !== undefined) {
      setCustomPieceSize(updates.customPieceSize)
      hasChanges = true
    }
    
    if (updates.pieceCornerRadius !== undefined) {
      setPieceCornerRadius(updates.pieceCornerRadius)
      hasChanges = true
    }
    
    if (updates.edgeCornerRoundness !== undefined) {
      setEdgeCornerRoundness(updates.edgeCornerRoundness)
      hasChanges = true
    }
    
    if (updates.edgeScale !== undefined) {
      setEdgeScale(updates.edgeScale)
      hasChanges = true
    }
    
    if (hasChanges) {
      console.log('魔方几何参数已批量更新:', updates)
    }
    
    return hasChanges
  }

  /**
   * 同步魔方实例的当前状态到配置
   */
  function syncFromInstance() {
    if (cubeInstance && cubeInstance.geometry) {
      const geometry = cubeInstance.geometry
      config.pieceSize = geometry.pieceSize || config.pieceSize
      config.pieceCornerRadius = geometry.pieceCornerRadius || config.pieceCornerRadius
      config.edgeCornerRoundness = geometry.edgeCornerRoundness || config.edgeCornerRoundness
      config.edgeScale = geometry.edgeScale || config.edgeScale
      console.log('已从魔方实例同步配置')
    }
  }

  return {
    // 状态
    isInitialized,
    isAnimating,
    state,
    config,
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
    setCubeType,
    setPieceSize,
    setCustomPieceSize,
    setPieceCornerRadius,
    setEdgeCornerRoundness,
    setEdgeScale,
    getAvailableCubeTypes,
    solve,
    
    // 新增：几何参数管理方法
    getCubeGeometry,
    updateCubeGeometry,
    syncFromInstance,
    
    // 获取实例
    getCubeInstance: () => cubeInstance
  }
})