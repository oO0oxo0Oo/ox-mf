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

  // 配置方法
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
    }
  }

  function setPieceSize(size) {
    config.pieceSize = size
    cubeInstance?.updatePieceSize?.(size)
  }

  function setPieceCornerRadius(radius) {
    config.pieceCornerRadius = radius
    cubeInstance?.updatePieceCornerRadius?.(radius)
  }

  function setEdgeCornerRoundness(roundness) {
    config.edgeCornerRoundness = roundness
    cubeInstance?.updateEdgeCornerRoundness?.(roundness)
  }

  function setEdgeScale(scale) {
    config.edgeScale = scale
    cubeInstance?.updateEdgeScale?.(scale)
  }

  function getAvailableCubeTypes() {
    return ['cube3', 'cube2']
  }

  function getCubeConfig() {
    return { ...config }
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
    setPieceCornerRadius,
    setEdgeCornerRoundness,
    setEdgeScale,
    getAvailableCubeTypes,
    solve,
    getCubeConfig,
    
    // 获取实例
    getCubeInstance: () => cubeInstance
  }
})