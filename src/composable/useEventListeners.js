import { onMounted, onUnmounted } from 'vue'

/**
 * Vue 3 事件监听器管理 composable
 * 自动处理事件监听器的添加和移除，避免内存泄漏
 */
export function useEventListeners() {
  const listeners = []

  /**
   * 添加事件监听器
   * @param {EventTarget} target - 事件目标（如 window, document, element）
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 事件选项
   */
  const addListener = (target, event, handler, options = {}) => {
    target.addEventListener(event, handler, options)
    listeners.push({ target, event, handler, options })
  }

  /**
   * 移除事件监听器
   * @param {EventTarget} target - 事件目标
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  const removeListener = (target, event, handler) => {
    target.removeEventListener(event, handler)
    const index = listeners.findIndex(
      listener => listener.target === target && 
                 listener.event === event && 
                 listener.handler === handler
    )
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 清理所有事件监听器
   */
  const cleanup = () => {
    listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options)
    })
    listeners.length = 0
  }

  /**
   * 获取当前监听器状态
   */
  const getStatus = () => ({
    count: listeners.length,
    listeners: listeners.map(({ target, event }) => ({ target, event }))
  })

  // 自动清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    addListener,
    removeListener,
    cleanup,
    getStatus
  }
}

/**
 * 专门用于窗口事件的 composable
 */
export function useWindowEvents() {
  const { addListener, removeListener, cleanup, getStatus } = useEventListeners()

  /**
   * 添加窗口事件监听器
   */
  const addWindowListener = (event, handler, options = {}) => {
    addListener(window, event, handler, options)
  }

  /**
   * 移除窗口事件监听器
   */
  const removeWindowListener = (event, handler) => {
    removeListener(window, event, handler)
  }

  return {
    addWindowListener,
    removeWindowListener,
    cleanup,
    getStatus
  }
}

/**
 * 专门用于 DOM 元素事件的 composable
 */
export function useElementEvents() {
  const { addListener, removeListener, cleanup, getStatus } = useEventListeners()

  /**
   * 添加元素事件监听器
   */
  const addElementListener = (element, event, handler, options = {}) => {
    if (element) {
      addListener(element, event, handler, options)
    }
  }

  /**
   * 移除元素事件监听器
   */
  const removeElementListener = (element, event, handler) => {
    if (element) {
      removeListener(element, event, handler)
    }
  }

  return {
    addElementListener,
    removeElementListener,
    cleanup,
    getStatus
  }
}
