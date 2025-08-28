<template>
  <div class="cube-selection">
    <div class="selection-container">
      <!-- 移动端：创意的选择布局 -->
      <div class="mobile-only">
        <div class="creative-selection-container">
          <!-- 魔方类型选择器 - 网格卡片式 -->
          <div class="selection-group">
            <h3 class="creative-label">选择魔方类型</h3>
            <div class="type-grid">
              <div 
                v-for="type in cubeTypes" 
                :key="type.id"
                class="type-card"
                :class="{ 'active': selectedType === type.id }"
                @click="selectType(type.id)"
              >
                <div class="type-info">
                  <h4 class="type-name">{{ type.name }}</h4>
                </div>
              </div>
            </div>
          </div>

          <!-- 魔方主题选择器 - 滑动卡片式 -->
          <div class="selection-group">
            <h3 class="creative-label">选择魔方主题</h3>
            <div class="card-slider">
              <div class="slider-container">
                <div 
                  v-for="(theme, index) in availableThemes" 
                  :key="theme.key"
                  class="slider-card"
                  :class="{ 'active': selectedTheme === theme.key }"
                  :style="{ '--card-index': index }"
                  @click="selectTheme(theme.key)"
                >
                  <div class="theme-preview">
                    <div class="theme-colors">
                      <div 
                        v-for="(color, face) in theme.colors" 
                        :key="face"
                        class="color-swatch"
                        :style="{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }"
                      ></div>
                    </div>
                  </div>
                  <div class="card-content">
                    <h4>{{ theme.name }}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div class="action-section">
          <button 
            @click="confirmSelection" 
            class="confirm-btn creative-btn"
            :disabled="!selectedType || !selectedTheme"
          >
            <span class="btn-content">
              <span class="btn-text">{{ (!selectedType || !selectedTheme) ? '请完成选择' : '开始游戏' }}</span>
            </span>
            <div class="btn-glow"></div>
          </button>
        </div>
      </div>

      <!-- 桌面端：保持原有布局 -->
      <div class="desktop-only">
      <h2 class="selection-title">选择你的魔方</h2>
      
      <!-- 主要选择区域 - 响应式布局 -->
      <div class="main-selection">
        <!-- 魔方类型选择 -->
        <div class="selection-section">
          <h3 class="section-title">魔方类型</h3>
          
          <!-- 桌面端：网格布局 -->
            <div class="cube-type-grid">
            <div 
              v-for="type in cubeTypes" 
              :key="type.id"
              class="cube-type-card"
              :class="{ 'selected': selectedType === type.id }"
              @click="selectType(type.id)"
            >
              <div class="card-content">
                <h4 class="card-title">{{ type.name }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- 魔方主题选择 -->
        <div class="selection-section">
          <h3 class="section-title">魔方主题</h3>
          
          <!-- 桌面端：网格布局 -->
            <div class="cube-theme-grid">
            <div 
              v-for="theme in availableThemes" 
              :key="theme.key"
              class="cube-theme-card"
              :class="{ 'selected': selectedTheme === theme.key }"
              @click="selectTheme(theme.key)"
            >
              <div class="theme-preview">
                <div class="theme-colors">
                  <div 
                    v-for="(color, face) in theme.colors" 
                    :key="face"
                    class="color-swatch"
                    :style="{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }"
                    :title="getFaceName(face)"
                  ></div>
                </div>
              </div>
              <div class="card-content">
                <h4 class="card-title">{{ theme.name }}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="action-section">
        <button 
          @click="confirmSelection" 
          class="confirm-btn creative-btn"
          :disabled="!selectedType || !selectedTheme"
        >
          <span class="btn-content">
            <span class="btn-text">{{ (!selectedType || !selectedTheme) ? '请完成选择' : '开始游戏' }}</span>
          </span>
          <div class="btn-glow"></div>
        </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useCubeStore } from '../stores/cube'
import { getAvailableThemes } from '../config/themes'

// 定义组件事件
const emit = defineEmits(['selection-confirmed'])

const cubeStore = useCubeStore()

// 响应式数据
const selectedType = ref(null)
const selectedTheme = ref(null)

// 下拉选择器状态 - 使用RotationMenu的命名
const isThemeDropdownOpen = ref(false)
const isCubeTypeDropdownOpen = ref(false)

// 从主题文件获取所有可用主题
const availableThemes = ref([])

// 魔方类型配置
const cubeTypes = ref([
  {
    id: 'cube2',
    name: '2阶魔方'
  },
  {
    id: 'cube3',
    name: '3阶魔方'
  },
  {
    id: 'cube4',
    name: '4阶魔方'
  }
])

// 计算属性 - 使用RotationMenu的逻辑
const availableCubeTypes = computed(() => cubeStore.availableCubeTypes)
const currentThemeName = computed(() => {
  const theme = availableThemes.value.find(t => t.key === selectedTheme.value);
  return theme ? theme.name : '主题';
});

// 初始化主题数据
onMounted(() => {
  availableThemes.value = getAvailableThemes()
})

// 选择魔方类型
function selectType(typeId) {
  selectedType.value = typeId
}

// 从下拉菜单选择魔方类型 - 使用RotationMenu的逻辑
function selectTypeFromDropdown(typeId) {
  selectedType.value = typeId
  isCubeTypeDropdownOpen.value = false
}

// 选择魔方主题
function selectTheme(themeKey) {
  selectedTheme.value = themeKey
}

// 从下拉菜单选择魔方主题 - 使用RotationMenu的逻辑
function selectThemeFromDropdown(themeKey) {
  selectedTheme.value = themeKey
  isThemeDropdownOpen.value = false
}

// 切换类型下拉菜单 - 使用RotationMenu的逻辑
function toggleTypeDropdown() {
  isCubeTypeDropdownOpen.value = !isCubeTypeDropdownOpen.value
  if (isCubeTypeDropdownOpen.value) {
    isThemeDropdownOpen.value = false
  }
}

// 切换主题下拉菜单 - 使用RotationMenu的逻辑
function toggleThemeDropdown() {
  isThemeDropdownOpen.value = !isThemeDropdownOpen.value
  if (isThemeDropdownOpen.value) {
    isCubeTypeDropdownOpen.value = false
  }
}

// 点击外部关闭下拉菜单 - 使用RotationMenu的逻辑
const closeDropdowns = () => {
  isThemeDropdownOpen.value = false
  isCubeTypeDropdownOpen.value = false
}

// 全局点击事件处理 - 使用RotationMenu的逻辑
const handleGlobalClick = (event) => {
  // 检查点击是否在CubeSelection组件的下拉菜单区域外部
  const cubeSelection = document.querySelector('.cube-selection')
  
  if (cubeSelection && !cubeSelection.contains(event.target)) {
    // 如果点击在CubeSelection组件外，关闭所有下拉菜单
    closeDropdowns()
  }
}

// 获取类型名称
function getTypeName(typeId) {
  const type = cubeTypes.value.find(t => t.id === typeId)
  return type ? type.name : ''
}

// 获取主题名称
function getThemeName(themeKey) {
  const theme = availableThemes.value.find(t => t.key === themeKey)
  return theme ? theme.name : ''
}

// 获取主题描述
function getThemeDescription(themeKey) {
  const descriptions = {
    classic: '传统配色，经典体验',
    coolBlue: '科技感十足，蓝色主题',
    warmOrange: '温暖橙色，活力四射',
    forest: '清新绿色，自然和谐'
  }
  return descriptions[themeKey] || '独特配色，个性体验'
}

// 获取面名称
function getFaceName(face) {
  const faceNames = {
    U: '上',
    D: '下',
    F: '前',
    B: '后',
    L: '左',
    R: '右'
  }
  return faceNames[face] || face
}

// 组件挂载时添加全局点击监听 - 使用RotationMenu的逻辑
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

// 组件卸载时移除全局点击监听 - 使用RotationMenu的逻辑
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})

// 确认选择
function confirmSelection() {
  // 获取选择的详细信息
  const selectedTypeInfo = cubeTypes.value.find(type => type.id === selectedType.value)
  const selectedThemeInfo = availableThemes.value.find(theme => theme.key === selectedTheme.value)

  // 直接设置魔方类型和大小
  cubeStore.setCubeType(selectedType.value)
  
  // 设置主题 
  cubeStore.setTheme(selectedTheme.value)
  
  // 验证设置是否成功
  const currentConfig = cubeStore.getCubeConfig()
  
  const selectionData = {
    type: selectedType.value,
    theme: selectedTheme.value,
    typeInfo: selectedTypeInfo,
    themeInfo: selectedThemeInfo,
    config: {
      cubeOrder: selectedType.value === 'cube2' ? 2 : selectedType.value === 'cube3' ? 3 : 4,
      theme: selectedTheme.value
    }
  }
  
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

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  position: relative;
  padding-left: 1rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 0;
  text-align: center;
}


/* 桌面端样式 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

.cube-type-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cube-theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.cube-type-card,
.cube-theme-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  z-index: 10;
  text-align: center;
  width: 10rem;
}

.cube-type-card::before,
.cube-theme-card::before {
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
.cube-theme-card:hover::before {
  left: 100%;
}

.cube-type-card:hover,
.cube-theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.cube-type-card.selected,
.cube-theme-card.selected {
  border-color: #667eea !important;
  background: rgba(102, 126, 234, 0.8) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5) !important;
}

.card-icon,
.theme-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  height: 60px;
}

/* 主题颜色预览 */
.theme-colors {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 60px;
  height: 60px;
}

.color-swatch {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.card-content {
  text-align: center;
  color: #fff;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.4rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-description {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* 移动端左右布局样式 */
.mobile-selection-row {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 2rem;
}

.mobile-select-item {
  flex: 1;
  max-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.mobile-select-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-align: center;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 移动端下拉菜单样式 - 使用RotationMenu的样式 */
.custom-select {
  position: relative;
  width: 100%;
  max-width: 140px;
  z-index: 1000;
}

.select-trigger {
  width: 8rem;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  animation: selectSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: calc(var(--select-index, 0) * 0.3s);
}

.select-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.select-trigger:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.select-value {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.select-arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8px;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin-top: 8px;
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.select-option {
  padding: 14px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.select-option.active {
  background: rgba(102, 126, 234, 0.3);
  color: #fff;
  font-weight: 600;
}

/* 下拉菜单动画 */
@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 选择器入场动画 */
@keyframes selectSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}


.action-section {
  text-align: center;
  margin-top: 4rem;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .cube-selection {
    padding: 0.5rem;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .selection-container {
    max-width: 100%;
    width: 100%;
    padding: 2rem 1rem;
  }

  /* 移动端显示创意选择器，隐藏网格 */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .creative-selection-container {
    gap: 2.5rem;
  }

  .selection-group {
    gap: 1.25rem;
  }

  .creative-label {
    font-size: 1.1rem;
  }

  .type-grid {
    max-width: 340px;
    gap: 0.875rem;
  }

  .type-card {
    padding: 1.125rem 0.875rem;
  }

  .card-icon {
    height: 50px;
  }

  .cube-icon {
    font-size: 1.5rem;
  }

  .card-slider {
    max-width: 300px;
  }

  .slider-card {
    flex: 0 0 180px;
    height: 110px;
    padding: 0.875rem;
  }

  .creative-btn {
    padding: 1rem 2.5rem;
    font-size: 1rem;
    width: 100%;
    max-width: 280px;
  }
}

@media (max-width: 480px) {
  .cube-selection {
    padding: 0.25rem;
  }

  .selection-container {
    padding: 1.5rem 0.75rem;
  }

  .creative-selection-container {
    gap: 2rem;
  }

  .selection-group {
    gap: 1rem;
  }

  .creative-label {
    font-size: 1rem;
  }

  .type-grid {
    max-width: 320px;
    gap: 0.75rem;
  }

  .type-card {
    padding: 1rem 0.75rem;
  }

  .type-icon {
    width: 45px;
    height: 45px;
  }

  .type-name {
    font-size: 0.85rem;
  }

  .type-desc {
    font-size: 0.7rem;
  }

  .card-slider {
    max-width: 280px;
  }

  .slider-card {
    flex: 0 0 160px;
    height: 100px;
    padding: 0.75rem;
  }

  .creative-btn {
    padding: 0.875rem 2rem;
    font-size: 0.95rem;
    max-width: 260px;
  }
}

@media (max-width: 360px) {
  .selection-container {
    padding: 1.25rem 0.5rem;
  }

  .creative-selection-container {
    gap: 1.75rem;
  }

  .type-grid {
    max-width: 300px;
    gap: 0.625rem;
  }

  .type-card {
    padding: 0.875rem 0.625rem;
  }

  .type-icon {
    width: 40px;
    height: 40px;
  }

  .type-name {
    font-size: 0.8rem;
  }

  .type-desc {
    font-size: 0.65rem;
  }

  .card-slider {
    max-width: 260px;
  }

  .slider-card {
    flex: 0 0 140px;
    height: 90px;
    padding: 0.625rem;
  }

  .creative-btn {
    padding: 0.75rem 1.75rem;
    font-size: 0.9rem;
    max-width: 240px;
  }
}

/* 创意选择器样式 */
.creative-selection-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
  width: 100%;
}

.selection-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.creative-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* 网格卡片式类型选择器样式 */
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 360px;
}

.type-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.25rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.type-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.type-card:hover::before {
  left: 100%;
}

.type-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.type-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.type-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.type-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.type-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 500;
}

/* 滑动卡片选择器样式 */
.card-slider {
  width: 100%;
  max-width: 320px;
  position: relative;
}

.slider-container {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 1rem 0 1rem 2rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.slider-container::-webkit-scrollbar {
  display: none;
}

.slider-card {
  flex: 0 0 15.5rem;
  height: 7.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.slider-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.slider-card:hover::before {
  left: 100%;
}

.slider-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.slider-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.theme-preview {
  display: flex;
  justify-content: center;
}

.theme-colors {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  width: 40px;
  height: 40px;
}

.color-swatch {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-info {
  text-align: center;
}

.card-info h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.25rem 0;
}

.card-info p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.3;
}

.slider-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.6);
}

.indicator.active {
  background: #667eea;
  transform: scale(1.2);
}

/* 创意按钮样式 */
.creative-btn {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  padding: 1.2rem 5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

/* 响应式按钮样式 */
@media (max-width: 480px) {
  .creative-btn {
    padding: 1.2rem 2rem;
    font-size: 1.2rem;
    border-radius: 35px;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.btn-text {
  color: white;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.creative-btn:hover .btn-glow {
  left: 100%;
}

.creative-btn:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.creative-btn:active {
  transform: translateY(-1px);
}

.creative-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  transform: none;
  box-shadow: none;
}

.creative-btn:disabled .btn-glow {
  display: none;
}

/* 动画效果 */
@keyframes checkPop {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-90deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes iconBounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}
</style>

