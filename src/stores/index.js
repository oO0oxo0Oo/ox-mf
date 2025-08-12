// 统一导出所有store
export { useGameStore } from './game'
export { useCubeStore } from './cube'
export { useAnimationStore } from './animation'

// 也可以在这里添加一些store的组合使用
export function useStores() {
  return {
    game: useGameStore(),
    cube: useCubeStore(),
    animation: useAnimationStore(),
  }
} 