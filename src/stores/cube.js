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
    cubeType: 'cube3'
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

  function scrambleCube() {
    const rotationQueueStore = useRotationQueueStore();
    const queue = useScramble();
    rotationQueueStore.rotationQueue(queue);
    // state.value = 'scrambling'
  }

  // 配置方法
  function setCubeType(type) {
    config.cubeType = type
  }

  function getAvailableCubeTypes() {
    return ['cube3', 'cube2']
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
    getAvailableCubeTypes,
    

    
    // 获取实例
    getCubeInstance: () => cubeInstance
  }
})