<template>
  <div class="cube-selection">
    <div class="selection-container">
      <h2 class="selection-title">选择你的魔方</h2>
      
      <!-- 主要选择区域 - 左右布局 -->
      <div class="main-selection">
        <!-- 魔方类型选择 -->
        <div class="selection-section left-section">
          <h3 class="section-title">魔方类型</h3>
          <div class="cube-type-grid">
            <div 
              v-for="type in cubeTypes" 
              :key="type.id"
              class="cube-type-card"
              :class="{ 'selected': selectedType === type.id }"
              @click="selectType(type.id)"
            >
              <div class="card-icon">
                <div :class="`cube-icon cube-${type.id}`"></div>
              </div>
              <div class="card-content">
                <h4 class="card-title">{{ type.name }}</h4>
                <p class="card-description">{{ type.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 魔方风格选择 -->
        <div class="selection-section right-section">
          <h3 class="section-title">魔方风格</h3>
          <div class="cube-style-grid">
            <div 
              v-for="style in cubeStyles" 
              :key="style.id"
              class="cube-style-card"
              :class="{ 'selected': selectedStyle === style.id }"
              @click="selectStyle(style.id)"
            >
              <div class="style-preview">
                <div :class="`style-icon style-${style.id}`"></div>
              </div>
              <div class="card-content">
                <h4 class="card-title">{{ style.name }}</h4>
                <p class="card-description">{{ style.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="action-section">
        <button 
          @click="confirmSelection" 
          class="confirm-btn"
          :disabled="!selectedType || !selectedStyle"
        >
          {{ (!selectedType || !selectedStyle) ? '请完成选择' : '开始游戏' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 定义组件事件
const emit = defineEmits(['selection-confirmed'])

// 响应式数据
const selectedType = ref(null)
const selectedStyle = ref(null) // 不设置默认值，强制用户选择

// 魔方类型配置
const cubeTypes = ref([
  {
    id: 'cube2',
    name: '2阶魔方',
    description: '适合初学者，简单易上手'
  },
  {
    id: 'cube3',
    name: '3阶魔方',
    description: '经典魔方，挑战你的空间思维'
  }
])

// 魔方风格配置
const cubeStyles = ref([
  {
    id: 'classic',
    name: '经典风格',
    description: '传统配色，经典体验'
  },
  {
    id: 'coolBlue',
    name: '炫酷蓝风格',
    description: '科技感十足，蓝色主题'
  }
])

// 选择魔方类型
function selectType(typeId) {
  selectedType.value = typeId
}

// 选择魔方风格
function selectStyle(styleId) {
  console.log('选择魔方风格:', styleId)
  selectedStyle.value = styleId
  console.log('当前选中的风格:', selectedStyle.value)
}

// 确认选择
function confirmSelection() {
  console.log('确认选择被点击')
  console.log('当前选中状态:', { type: selectedType.value, style: selectedStyle.value })
  
  if (!selectedType.value || !selectedStyle.value) {
    console.log('选择不完整，无法确认')
    return
  }

  // 获取选择的详细信息
  const selectedTypeInfo = cubeTypes.value.find(type => type.id === selectedType.value)
  const selectedStyleInfo = cubeStyles.value.find(style => style.id === selectedStyle.value)

  const selectionData = {
    type: selectedType.value,
    style: selectedStyle.value,
    typeInfo: selectedTypeInfo,
    styleInfo: selectedStyleInfo,
    config: {
      cubeOrder: selectedType.value === 'cube2' ? 2 : 3,
      isClassicStyle: selectedStyle.value === 'classic',
      isCoolBlueStyle: selectedStyle.value === 'coolBlue'
    }
  }

  console.log('发送选择确认事件:', selectionData)
  emit('selection-confirmed', selectionData)
}
</script>

<style scoped>
.cube-selection {
  height: 100%;
  min-height: auto;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  /* padding: 2rem; */
  position: relative;
  overflow: hidden;
}

.cube-selection::before {
  display: none;
}

.selection-container {
  background: transparent;
  backdrop-filter: none;
  border-radius: 24px;
  padding: 2rem;
  max-width: 1000px;
  width: 100%;
  box-shadow: none;
  border: none;
  position: relative;
  z-index: 1;
}

.selection-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.main-selection {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: flex-start;
}

.selection-section {
  flex: 1;
}

.left-section {
  margin-right: 1rem;
}

.right-section {
  margin-left: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  position: relative;
  padding-left: 1rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.cube-type-grid,
.cube-style-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cube-type-card,
.cube-style-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  /* padding: 1.5rem; */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  /* 调试样式 */
  pointer-events: auto;
  z-index: 10;
}

.cube-type-card::before,
.cube-style-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.cube-type-card:hover::before,
.cube-style-card:hover::before {
  left: 100%;
}

.cube-type-card:hover,
.cube-style-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.cube-type-card.selected,
.cube-style-card.selected {
  border-color: #667eea !important;
  background: rgba(102, 126, 234, 0.8) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5) !important;
}

.card-icon,
.style-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  height: 80px;
}

.cube-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  position: relative;
  transform-style: preserve-3d;
  animation: float 3s ease-in-out infinite;
}

.cube-icon::before,
.cube-icon::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.cube-cube2::before {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.cube-cube2::after {
  background: linear-gradient(45deg, #4834d4, #686de0);
  transform: translateX(8px) translateY(-8px);
  opacity: 0.8;
}

.cube-cube3::before {
  background: linear-gradient(45deg, #26de81, #20bf6b);
  box-shadow: 0 4px 15px rgba(38, 222, 129, 0.3);
}

.cube-cube3::after {
  background: linear-gradient(45deg, #fd79a8, #e84393);
  transform: translateX(8px) translateY(-8px);
  opacity: 0.8;
}

.style-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: relative;
  animation: spin 4s linear infinite;
}

.style-classic {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.style-classic::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.style-coolBlue {
  background: linear-gradient(135deg, #00d4ff, #0066cc);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.style-coolBlue::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.style-coolBlue::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35px;
  height: 35px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  border-top-color: transparent;
  border-right-color: transparent;
}

.card-content {
  text-align: center;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.selection-status {
  text-align: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-text {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-text span {
  display: block;
  padding: 0.25rem 0;
  transition: all 0.3s ease;
}

.status-text span.completed {
  color: rgba(102, 126, 234, 1);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.action-section {
  text-align: center;
  margin-top: 1rem;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 1rem 3rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.confirm-btn:hover::before {
  left: 100%;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
}

.confirm-btn:disabled {
  background: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.confirm-btn:disabled::before {
  display: none;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cube-selection {
    padding: 1rem;
  }

  .selection-container {
    padding: 1.5rem;
    max-width: 100%;
  }

  .selection-title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .main-selection {
    flex-direction: column;
    gap: 1.5rem;
  }

  .left-section,
  .right-section {
    margin: 0;
  }

  .cube-type-card,
  .cube-style-card {
    padding: 1rem;
  }

  .confirm-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .selection-container {
    padding: 1.5rem;
  }

  .selection-title {
    font-size: 1.75rem;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>

