<template>
  <div class="draggable-demo">
    <h2>useDraggable 测试演示</h2>
    
    <!-- 拖拽容器 -->
    <div 
      ref="dragContainer" 
      class="drag-container"
      :class="{ 'dragging': isDragging }"
    >
      <div class="drag-area">
        <div class="drag-indicator">
          <span>拖拽区域</span>
          <p>点击并拖拽来测试</p>
        </div>
      </div>
      
      <!-- 可拖拽的元素 -->
      <div 
        ref="draggableElement" 
        class="draggable-element"
        :style="elementStyle"
      >
        <div class="element-content">
          <span>可拖拽元素</span>
          <small>拖拽我</small>
        </div>
      </div>
    </div>

    <!-- 状态信息显示 -->
    <div class="status-panel">
      <h3>拖拽状态信息</h3>
      
      <div class="status-grid">
        <div class="status-item">
          <label>拖拽状态:</label>
          <span :class="isDragging ? 'active' : 'inactive'">
            {{ isDragging ? '拖拽中' : '空闲' }}
          </span>
        </div>
        
        <div class="status-item">
          <label>当前位置:</label>
          <span>X: {{ dragState.current.x.toFixed(0) }}, Y: {{ dragState.current.y.toFixed(0) }}</span>
        </div>
        
        <div class="status-item">
          <label>拖拽增量:</label>
          <span>X: {{ dragState.delta.x.toFixed(0) }}, Y: {{ dragState.delta.y.toFixed(0) }}</span>
        </div>
        
        <div class="status-item">
          <label>总拖拽距离:</label>
          <span>X: {{ dragState.drag.x.toFixed(0) }}, Y: {{ dragState.drag.y.toFixed(0) }}</span>
        </div>
        
        <div class="status-item">
          <label>归一化坐标:</label>
          <span>X: {{ normalizedPosition.x.toFixed(3) }}, Y: {{ normalizedPosition.y.toFixed(3) }}</span>
        </div>
        
        <div class="status-item">
          <label>元素偏移:</label>
          <span>X: {{ elementPosition.offset.x.toFixed(0) }}, Y: {{ elementPosition.offset.y.toFixed(0) }}</span>
        </div>
        
        <div class="status-item">
          <label>边界约束:</label>
          <span :class="enableBoundaryConstraint ? 'active' : 'inactive'">
            {{ enableBoundaryConstraint ? '启用' : '禁用' }}
          </span>
        </div>
      </div>



      <!-- 控制按钮 -->
      <div class="controls">
        <button @click="enableDraggable" :disabled="isEnabled">启用拖拽</button>
        <button @click="disableDraggable" :disabled="!isEnabled">禁用拖拽</button>
        <button @click="resetElement">重置元素位置</button>
        <button @click="centerElement">居中元素</button>
        <button @click="toggleBoundaryConstraint" :class="{ 'active': enableBoundaryConstraint }">
          {{ enableBoundaryConstraint ? '禁用边界' : '启用边界' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useDraggable } from '../composable/useDraggable.js'
import * as THREE from 'three'

// 响应式引用
const dragContainer = ref(null)
const draggableElement = ref(null)

// 状态管理
const isDragging = ref(false)
const isEnabled = ref(false)
const enableBoundaryConstraint = ref(true) // 边界约束开关

// ==================== 拖拽数据流管理 ====================

// 拖拽实例引用
let dragInstance = null

// 拖拽状态数据
const dragState = reactive({
  // 当前鼠标/触摸位置（页面坐标）
  current: { x: 0, y: 0 },
  // 本次拖拽的增量（相对于上一帧）
  delta: { x: 0, y: 0 },
  // 本次拖拽的总距离（相对于起始位置）
  drag: { x: 0, y: 0 },
  // 拖拽起始位置
  start: { x: 0, y: 0 }
})

// 元素位置数据
const elementPosition = reactive({
  // 元素的累积偏移量
  offset: { x: 0, y: 0 },
  // 元素的归一化坐标（-1 到 1）
  normalized: { x: 0, y: 0 }
})

// ==================== 拖拽事件处理 ====================

// 初始化拖拽功能
function initDraggable() {
  if (!dragContainer.value) {
    return
  }
  
  // 创建拖拽实例
  dragInstance = useDraggable(dragContainer, {
    calcDelta: true, // 启用增量计算
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd
  })
  
  // 启用拖拽功能
  if (dragInstance && dragInstance.enable) {
    dragInstance.enable()
    isEnabled.value = true
  }
}

// 拖拽开始事件处理
function handleDragStart(pos) {
  // 更新拖拽状态
  isDragging.value = true
  
  // 同步拖拽数据
  syncDragState(pos)
}

// 拖拽移动事件处理
function handleDragMove(pos) {
  // 同步拖拽数据
  syncDragState(pos)
  
  // 更新元素位置（累加增量）
  elementPosition.offset.x += pos.delta.x
  elementPosition.offset.y += pos.delta.y
  
  // 计算归一化坐标
  updateNormalizedPosition()
  
  // 边界检测（可选）
  if (enableBoundaryConstraint.value) {
    constrainToContainer()
  }
}

// 拖拽结束事件处理
function handleDragEnd(pos) {
  // 更新拖拽状态
  isDragging.value = false
  
  // 同步拖拽数据
  syncDragState(pos)
}

// 同步拖拽状态数据
function syncDragState(pos) {
  dragState.current.x = pos.current.x
  dragState.current.y = pos.current.y
  dragState.delta.x = pos.delta.x
  dragState.delta.y = pos.delta.y
  dragState.drag.x = pos.drag.x
  dragState.drag.y = pos.drag.y
  dragState.start.x = pos.start.x
  dragState.start.y = pos.start.y
}

// 更新归一化坐标
function updateNormalizedPosition() {
  if (!dragContainer.value || !dragInstance || !dragInstance.convertPosition) {
    elementPosition.normalized = { x: 0, y: 0 }
    return
  }
  
  // 直接使用 useDraggable 提供的坐标转换方法
  const currentPos = new THREE.Vector2(dragState.current.x, dragState.current.y)
  const normalized = dragInstance.convertPosition(currentPos)
  
  elementPosition.normalized.x = normalized.x
  elementPosition.normalized.y = normalized.y
}

// ==================== 计算属性 ====================

// 元素样式计算
const elementStyle = computed(() => ({
  transform: `translate(${elementPosition.offset.x}px, ${elementPosition.offset.y}px)`
}))

// 归一化坐标计算（用于显示）
const normalizedPosition = computed(() => ({
  x: elementPosition.normalized.x,
  y: elementPosition.normalized.y
}))

// ==================== 控制方法 ====================

// 启用拖拽功能
function enableDraggable() {
  if (dragInstance && dragInstance.enable) {
    dragInstance.enable()
    isEnabled.value = true
  }
}

// 禁用拖拽功能
function disableDraggable() {
  if (dragInstance && dragInstance.disable) {
    dragInstance.disable()
    isEnabled.value = false
  }
}

// 重置元素位置
function resetElement() {
  elementPosition.offset.x = 0
  elementPosition.offset.y = 0
  elementPosition.normalized.x = 0
  elementPosition.normalized.y = 0
}

// 居中元素
function centerElement() {
  if (!dragContainer.value) return
  
  // 获取容器的实际尺寸
  const containerWidth = dragContainer.value.offsetWidth
  const containerHeight = dragContainer.value.offsetHeight
  
  // 元素尺寸（固定值）
  const elementWidth = 120
  const elementHeight = 120
  
  // 计算居中位置
  // 由于元素使用 transform: translate(-50%, -50%) 居中定位
  // 所以 offset 应该设置为 0 来让元素居中
  elementPosition.offset.x = 0
  elementPosition.offset.y = 0
  
  // 更新归一化坐标
  updateNormalizedPosition()
}

// 切换边界约束
function toggleBoundaryConstraint() {
  enableBoundaryConstraint.value = !enableBoundaryConstraint.value
}

// 边界约束（防止元素拖出容器）
function constrainToContainer() {
  if (!dragContainer.value || !draggableElement.value) return
  
  // 获取容器的实际尺寸（可拖拽区域）
  const containerWidth = dragContainer.value.offsetWidth
  const containerHeight = dragContainer.value.offsetHeight
  
  // 元素尺寸（固定值，因为元素有固定宽高）
  const elementWidth = 120  // 对应 CSS 中的 width: 120px
  const elementHeight = 120 // 对应 CSS 中的 height: 120px
  
  // 计算边界约束
  // 由于元素使用 transform: translate(-50%, -50%) 居中定位
  // 所以需要考虑元素的中心点位置
  const minX = -elementWidth / 2  // 元素左边缘不能超出容器左边界
  const maxX = containerWidth - elementWidth / 2  // 元素右边缘不能超出容器右边界
  const minY = -elementHeight / 2  // 元素上边缘不能超出容器上边界
  const maxY = containerHeight - elementHeight / 2  // 元素下边缘不能超出容器下边界
  
  // 应用约束
  elementPosition.offset.x = Math.max(minX, Math.min(maxX, elementPosition.offset.x))
  elementPosition.offset.y = Math.max(minY, Math.min(maxY, elementPosition.offset.y))
}



// 生命周期
onMounted(() => {
  // 使用 nextTick 确保 DOM 完全渲染后再初始化拖拽
  nextTick(() => {
      initDraggable()
  
  })
})

onUnmounted(() => {
  disableDraggable()
})
</script>

<style scoped>
.draggable-demo {
  padding: 20px;
  font-family: 'Arial', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.drag-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin-bottom: 30px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.drag-container.dragging {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.drag-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-indicator {
  text-align: center;
  color: #666;
  pointer-events: none;
}

.drag-indicator span {
  font-size: 18px;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.drag-indicator p {
  margin: 0;
  font-size: 14px;
}

.draggable-element {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  user-select: none;
}

.draggable-element:hover {
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.draggable-element:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(0.95);
}

.element-content {
  text-align: center;
  color: white;
}

.element-content span {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
}

.element-content small {
  opacity: 0.8;
  font-size: 12px;
}

.status-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.status-panel h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.status-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.status-item label {
  font-weight: bold;
  color: #495057;
  display: block;
  margin-bottom: 4px;
}

.status-item span {
  color: #6c757d;
  font-family: 'Courier New', monospace;
}

.status-item span.active {
  color: #28a745;
  font-weight: bold;
}

.status-item span.inactive {
  color: #6c757d;
}

.status-item span.loading {
  color: #ffc107;
  font-style: italic;
}



.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.controls button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.controls button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.controls button:nth-child(2) {
  background: #dc3545;
}

.controls button:nth-child(2):hover:not(:disabled) {
  background: #c82333;
}

.controls button:nth-child(3) {
  background: #28a745;
}

.controls button:nth-child(3):hover:not(:disabled) {
  background: #218838;
}

.controls button:nth-child(4) {
  background: #6c757d;
}

.controls button:nth-child(4):hover:not(:disabled) {
  background: #5a6268;
}

.controls button:nth-child(5) {
  background: #17a2b8;
}

.controls button:nth-child(5):hover:not(:disabled) {
  background: #138496;
}

.controls button.active {
  background: #28a745 !important;
}

.controls button.active:hover:not(:disabled) {
  background: #218838 !important;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .controls button {
    width: 100%;
  }
}
</style>
