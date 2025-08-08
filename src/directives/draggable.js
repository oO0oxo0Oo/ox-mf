import { useDraggable } from '../composable/useDraggable.js'

export default {
  mounted(el, binding) {
    // 允许通过 v-draggable="{ ...options }" 传递参数
    const options = binding.value || {}

    // 直接传递 el，不包裹 value
    el._draggable = useDraggable(el, options)
    
    // 启用拖拽功能
    if (el._draggable && el._draggable.enable) {
      el._draggable.enable()
    }
  },
  unmounted(el) {
    // 组件卸载时移除拖拽监听
    if (el._draggable && el._draggable.disable) {
      el._draggable.disable()
    }
    delete el._draggable
  }
}
