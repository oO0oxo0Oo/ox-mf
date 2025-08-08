import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'

export const useGameStore = defineStore('game', ()=>{
  // 游戏状态
  const isPlaying = ref(false)
  const score = ref(0)
  const level = ref(1)
  
  // World组件的引用
  const worldRef = ref(null)
  
  // 设置World组件引用
  const setWorldRef = (ref) => {
    worldRef.value = ref
  }
  
  // 获取World组件的方法
  const getWorldMethods = () => {
    if (worldRef.value) {
      return {
        scene: markRaw(worldRef.value.scene),
        camera: markRaw(worldRef.value.camera),
        renderer: markRaw(worldRef.value.renderer),
        lights: markRaw(worldRef.value.lights),
        setupCubeShadows: worldRef.value.setupCubeShadows,
        startAnim: worldRef.value.startAnim,
        stopAnim: worldRef.value.stopAnim
      }
    }
    return null
  }
  
  // 方法
  const setupShadows = () => {
    const methods = getWorldMethods()
    if (methods && methods.setupCubeShadows) {
      methods.setupCubeShadows()
    }
  }
  
  const startAnimation = () => {
    const methods = getWorldMethods()
    if (methods && methods.startAnim) {
      methods.startAnim()
      isPlaying.value = true
    }
  }
  
  const stopAnimation = () => {
    const methods = getWorldMethods()
    if (methods && methods.stopAnim) {
      methods.stopAnim()
      isPlaying.value = false
    }
  }
  
  // 游戏逻辑方法
  const startGame = () => {
    score.value = 0
    level.value = 1
    isPlaying.value = true
    startAnimation()
  }
  
  const pauseGame = () => {
    isPlaying.value = false
    stopAnimation()
  }
  
  const resetGame = () => {
    score.value = 0
    level.value = 1
    isPlaying.value = false
    stopAnimation()
  }
  
  const addScore = (points) => {
    score.value += points
  }
  
  const nextLevel = () => {
    level.value++
  }
  
  return {
    // 状态
    isPlaying,
    score,
    level,
    worldRef,
    
    // 方法
    setWorldRef,
    getWorldMethods,
    setupShadows,
    startAnimation,
    stopAnimation,
    startGame,
    pauseGame,
    resetGame,
    addScore,
    nextLevel
  }
}) 