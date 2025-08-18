import { onUnmounted } from 'vue'

/**
 * 现代Vue 3事件监听器管理
 * 使用AbortController自动清理所有监听器
 */
export function useEventListeners() {
  const controller = new AbortController()
  
  const addListener = (target, event, handler, options = {}) => {
    target.addEventListener(event, handler, {
      ...options,
      signal: controller.signal
    })
  }

  const cleanup = () => controller.abort()

  onUnmounted(cleanup)

  return { addListener, cleanup }
}

/**
 * 窗口事件监听器
 */
export function useWindowEvents() {
  const controller = new AbortController()
  
  const addWindowListener = (event, handler, options = {}) => {
    window.addEventListener(event, handler, {
      ...options,
      signal: controller.signal
    })
  }

  const cleanup = () => controller.abort()

  onUnmounted(cleanup)

  return { addWindowListener, cleanup }
}

/**
 * DOM元素事件监听器
 */
export function useElementEvents() {
  const controller = new AbortController()
  
  const addElementListener = (element, event, handler, options = {}) => {
    if (element) {
      element.addEventListener(event, handler, {
        ...options,
        signal: controller.signal
      })
    }
  }

  const cleanup = () => controller.abort()

  onUnmounted(cleanup)

  return { addElementListener, cleanup }
}
