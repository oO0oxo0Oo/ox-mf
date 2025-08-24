// 统一导出所有store
export { useCubeStore } from './cube'
export { useAnimationStore } from './animation'

export function useStores() {
  return {
    cube: useCubeStore(),
    animation: useAnimationStore(),
  }
} 