<template>
  <div class="cube-selection">
    <div class="selection-container">
      <h2 class="selection-title">选择你的魔方</h2>
      
      <!-- 主要选择区域 - 响应式布局 -->
      <div class="main-selection">
        <!-- 魔方类型选择 -->
        <div class="selection-section">
          <h3 class="section-title">魔方类型</h3>
          
          <!-- 桌面端：网格布局 -->
          <div class="cube-type-grid desktop-only">
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
          
          <!-- 移动端：下拉菜单 -->
          <div class="mobile-only">
            <div class="dropdown-container">
              <button 
                class="dropdown-trigger"
                @click="toggleTypeDropdown"
                :class="{ 'active': typeDropdownOpen }"
              >
                <span class="dropdown-text">
                  {{ selectedType ? getTypeName(selectedType) : '类型' }}
                </span>
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-show="typeDropdownOpen">
                                 <div 
                   v-for="type in cubeTypes" 
                   :key="type.id"
                   class="dropdown-item"
                   :class="{ 'selected': selectedType === type.id }"
                   @click="selectTypeFromDropdown(type.id)"
                 >
                   <span class="dropdown-item-text">{{ type.name }}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 魔方主题选择 -->
        <div class="selection-section">
          <h3 class="section-title">魔方主题</h3>
          
          <!-- 桌面端：网格布局 -->
          <div class="cube-theme-grid desktop-only">
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
                <p class="card-description">{{ getThemeDescription(theme.key) }}</p>
              </div>
            </div>
          </div>
          
          <!-- 移动端：下拉菜单 -->
          <div class="mobile-only">
            <div class="dropdown-container">
              <button 
                class="dropdown-trigger"
                @click="toggleThemeDropdown"
                :class="{ 'active': themeDropdownOpen }"
              >
                <span class="dropdown-text">
                  {{ selectedTheme ? getThemeName(selectedTheme) : '主题' }}
                </span>
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-show="themeDropdownOpen">
                                 <div 
                   v-for="theme in availableThemes" 
                   :key="theme.key"
                   class="dropdown-item"
                   :class="{ 'selected': selectedTheme === theme.key }"
                   @click="selectThemeFromDropdown(theme.key)"
                 >
                   <span class="dropdown-item-text">{{ theme.name }}</span>
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
          class="confirm-btn"
          :disabled="!selectedType || !selectedTheme"
        >
          {{ (!selectedType || !selectedTheme) ? '请完成选择' : '开始游戏' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCubeStore } from '../stores/cube'
import { getAvailableThemes } from '../config/themes'

// 定义组件事件
const emit = defineEmits(['selection-confirmed'])

const cubeStore = useCubeStore()

// 响应式数据
const selectedType = ref(null)
const selectedTheme = ref(null)
const typeDropdownOpen = ref(false)
const themeDropdownOpen = ref(false)

// 从主题文件获取所有可用主题
const availableThemes = ref([])

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
  },
  {
    id: 'cube4',
    name: '4阶魔方',
    description: '高阶挑战，考验你的耐心和技巧'
  }
])

// 初始化主题数据
onMounted(() => {
  availableThemes.value = getAvailableThemes()
})

// 选择魔方类型
function selectType(typeId) {
  selectedType.value = typeId
}

// 从下拉菜单选择魔方类型
function selectTypeFromDropdown(typeId) {
  selectedType.value = typeId
  typeDropdownOpen.value = false
}

// 选择魔方主题
function selectTheme(themeKey) {
  selectedTheme.value = themeKey
}

// 从下拉菜单选择魔方主题
function selectThemeFromDropdown(themeKey) {
  selectedTheme.value = themeKey
  themeDropdownOpen.value = false
}

// 切换类型下拉菜单
function toggleTypeDropdown() {
  typeDropdownOpen.value = !typeDropdownOpen.value
  if (themeDropdownOpen.value) {
    themeDropdownOpen.value = false
  }
}

// 切换主题下拉菜单
function toggleThemeDropdown() {
  themeDropdownOpen.value = !themeDropdownOpen.value
  if (typeDropdownOpen.value) {
    typeDropdownOpen.value = false
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

// 点击外部关闭下拉菜单
function handleClickOutside(event) {
  if (!event.target.closest('.dropdown-container')) {
    typeDropdownOpen.value = false
    themeDropdownOpen.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

/* 桌面端样式 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

.cube-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.cube-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
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

.cube-cube4::before {
  background: linear-gradient(45deg, #a55eea, #8854d0);
  box-shadow: 0 4px 15px rgba(165, 94, 234, 0.3);
}

.cube-cube4::after {
  background: linear-gradient(45deg, #fd79a8, #e84393);
  transform: translateX(8px) translateY(-8px);
  opacity: 0.8;
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

/* 移动端下拉菜单样式 */
.dropdown-container {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  text-align: left;
}

.dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.dropdown-trigger.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.dropdown-text {
  flex: 1;
  text-align: left;
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
}

.dropdown-trigger.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin-top: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.selected {
  background: rgba(102, 126, 234, 0.3);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.dropdown-item-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
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

  /* 移动端显示下拉菜单，隐藏网格 */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .section-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .confirm-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .selection-container {
    padding: 1rem;
  }

  .selection-title {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .dropdown-trigger {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }

     .dropdown-item {
     padding: 0.75rem 1.25rem;
   }

   .dropdown-item-text {
     font-size: 0.9rem;
   }

  .confirm-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>

