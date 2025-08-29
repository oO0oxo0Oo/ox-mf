<script setup>
// ===== 导入语句 =====
// Vue 核心
import { computed, ref, watch, onMounted, onUnmounted } from "vue";

// 组合式函数和store
import { useRotationQueue } from "../composable/useRotationQueue";
import { useCubeStore } from "../stores/cube";

// 配置和工具
import { getThemeColors } from "../config/themes.js";

// UI 图标
import { 
	Check, 
	Close, 
	Refresh, 
	View, 
	Delete, 
	Remove 
} from '@element-plus/icons-vue';

// ===== 核心依赖 =====
const rotationQueue = useRotationQueue();
const cubeStore = useCubeStore();

// ===== 事件定义 =====
const emit = defineEmits(['toggle-dragging', 'reset-cube', 'reset-world-rotation']);

// ===== 响应式数据 =====
// 控制状态
const isDraggingEnabled = ref(true);

// 下拉菜单状态
const isThemeDropdownOpen = ref(false);
const isCubeTypeDropdownOpen = ref(false);

// 主题相关状态
const currentTheme = ref(cubeStore.getCurrentTheme());
const currentCubeType = ref(cubeStore.config.cubeType);

// ===== 计算属性 =====
// 旋转状态
const isRotating = computed(() => rotationQueue.isRotating());
const showRotation = computed(() => cubeStore.config.cubeType !== 'cube4');

// 主题相关
const availableThemes = computed(() => cubeStore.getAvailableThemes());
const availableCubeTypes = computed(() => cubeStore.availableCubeTypes);
const currentThemeName = computed(() => {
  const theme = availableThemes.value.find(t => t.key === currentTheme.value);
  return theme ? theme.name : '经典';
});

// 旋转按钮配置
const topRowButtons = computed(() => [
	{ face: 'U', direction: 1, label: 'U', color: getFaceColor('U') },
	{ face: 'D', direction: 1, label: 'D', color: getFaceColor('D') },
	{ face: 'L', direction: 1, label: 'L', color: getFaceColor('L') },
	{ face: 'R', direction: 1, label: 'R', color: getFaceColor('R') },
	{ face: 'F', direction: 1, label: 'F', color: getFaceColor('F') },
	{ face: 'B', direction: 1, label: 'B', color: getFaceColor('B') },
]);

const bottomRowButtons = computed(() => [
	{ face: 'U', direction: -1, label: "U'", color: getFaceColor('U') },
	{ face: 'D', direction: -1, label: "D'", color: getFaceColor('D') },
	{ face: 'L', direction: -1, label: "L'", color: getFaceColor('L') },
	{ face: 'R', direction: -1, label: "R'", color: getFaceColor('R') },
	{ face: 'F', direction: -1, label: "F'", color: getFaceColor('F') },
	{ face: 'B', direction: -1, label: "B'", color: getFaceColor('B') },
]);

// ===== 工具函数 =====
// 根据当前主题获取面颜色
function getFaceColor(face) {
	const currentTheme = cubeStore.getCurrentTheme();
	const colors = getThemeColors(currentTheme);
	const hexColor = colors[face];
	
	const colorHex = `#${hexColor.toString(16).padStart(6, '0')}`;
	
	if (face === 'U' || face === 'D') {
		return `${colorHex}CC`; // 80% 透明度
	} else {
		return `${colorHex}99`; // 60% 透明度
	}
}

// ===== 核心操作方法 =====
// 魔方操作
const scramble = () => {
	cubeStore.scrambleCube(rotationQueue);
}

const solve = () => {
	console.log(cubeStore.solve(), "!!!!!!")
}

const clearRotationQueue = () => {
	if (rotationQueue.queueLength() > 1) {
		rotationQueue.animationQueue().splice(1);
	} 
	return
};

// 旋转操作
const handleRotate = (face, direction = 1) => {
	rotationQueue.addRotationToQueue(face, direction);
};

// 控制操作
const toggleDragging = () => {
	isDraggingEnabled.value = !isDraggingEnabled.value;
	emit('toggle-dragging', isDraggingEnabled.value);
}

const resetCube = () => {
	emit('reset-cube');
}

const resetWorldRotation = () => {
	emit('reset-world-rotation');
}

// ===== 主题和类型切换 =====
const handleThemeChange = (themeKey) => {
    currentTheme.value = themeKey;
    cubeStore.setTheme(themeKey);
    isThemeDropdownOpen.value = false;
};

const handleCubeTypeChange = (cubeType) => {
  currentCubeType.value = cubeType;
  cubeStore.setCubeType(cubeType);
  isCubeTypeDropdownOpen.value = false;
};

// ===== 下拉菜单控制 =====
const toggleThemeDropdown = () => {
  isThemeDropdownOpen.value = !isThemeDropdownOpen.value;
  if (isThemeDropdownOpen.value) {
    isCubeTypeDropdownOpen.value = false;
  }
};

const toggleCubeTypeDropdown = () => {
  isCubeTypeDropdownOpen.value = !isCubeTypeDropdownOpen.value;
  if (isCubeTypeDropdownOpen.value) {
    isThemeDropdownOpen.value = false;
  }
};

const closeDropdowns = () => {
  isThemeDropdownOpen.value = false;
  isCubeTypeDropdownOpen.value = false;
};

// ===== 全局事件处理 =====
const handleGlobalClick = (event) => {
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (themeToggle && !themeToggle.contains(event.target)) {
    closeDropdowns();
  }
};

// ===== 生命周期钩子 =====
onMounted(() => {
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});

// ===== 监听器 =====
watch(() => cubeStore.config.theme, (newTheme) => {
  console.log('主题变化监听器触发，新主题:', newTheme);
  currentTheme.value = newTheme;
}, { immediate: true });

watch(() => cubeStore.config.cubeType, (newCubeType) => {
  console.log('魔方类型变化监听器触发，新类型:', newCubeType);
  currentCubeType.value = newCubeType;
}, { immediate: true });
</script>

<template>
	<!-- 主题切换下拉菜单 - 左上角 -->
	<div class="theme-toggle">
		<!-- 主题选择器 -->
		<div class="custom-select" style="--select-index: 0">
			<button 
				@click="toggleThemeDropdown"
				class="select-trigger"
				:title="`当前主题: ${currentThemeName}`"
			>
				<span class="select-value">{{ currentThemeName }}</span>
				<span class="select-arrow" :class="{ 'open': isThemeDropdownOpen }">▼</span>
			</button>
			
			<div 
				v-if="isThemeDropdownOpen" 
				class="select-dropdown"
			>
				<div 
					v-for="theme in availableThemes" 
					:key="theme.key"
					@click="handleThemeChange(theme.key)"
					class="select-option"
					:class="{ 'active': currentTheme === theme.key }"
				>
					{{ theme.name }}
				</div>
			</div>
		</div>

		<!-- 魔方类型选择器 -->
		<div class="custom-select" style="--select-index: 1">
			<button 
				@click="toggleCubeTypeDropdown"
				class="select-trigger"
				:title="`当前魔方类型: ${currentCubeType}`"
			>
				<span class="select-value">{{ currentCubeType }}</span>
				<span class="select-arrow" :class="{ 'open': isCubeTypeDropdownOpen }">▼</span>
			</button>
			
			<div 
				v-if="isCubeTypeDropdownOpen" 
				class="select-dropdown"
			>
				<div 
					v-for="cubeType in availableCubeTypes" 
					:key="cubeType"
					@click="handleCubeTypeChange(cubeType)"
					class="select-option"
					:class="{ 'active': currentCubeType === cubeType }"
				>
					{{ cubeType }}
				</div>
			</div>
		</div>
	</div>

	<!-- 控制按钮 - 右上角 -->
	<div class="control-toggle">
		<el-tooltip content="拖拽控制" placement="bottom" :open-delay="100" :auto-close="1000">
			<button 
				@click="toggleDragging"
				:class="{ 'disabled': !isDraggingEnabled }"
				class="control-btn"
				style="--btn-index: 0"
			>
				<Check v-if="isDraggingEnabled" />
				<Close v-else />
			</button>
		</el-tooltip>
		
		<el-tooltip content="还原魔方" placement="bottom" :open-delay="100" :auto-close="600">
			<button 
				@click="resetCube"
				:disabled="!cubeStore.isOperationEnabled"
				class="control-btn"
				style="--btn-index: 1"
			>
				<Refresh />
			</button>
		</el-tooltip>
		
		<el-tooltip content="重置视角" placement="bottom" :open-delay="100" :auto-close="600">
			<button 
				@click="resetWorldRotation"
				:disabled="!cubeStore.isOperationEnabled"
				class="control-btn"
				style="--btn-index: 2"
			>
				<View />
			</button>
		</el-tooltip>
		
		<el-tooltip content="打乱魔方" placement="bottom" :open-delay="100" :auto-close="600" v-if="showRotation">
			<button 
				@click="scramble"
				class="control-btn"
				style="--btn-index: 3"
			>
				<Delete />
			</button>
		</el-tooltip>
		
		<el-tooltip content="清空旋转队列" placement="bottom" :open-delay="100" :auto-close="600" v-if="showRotation">
			<button 
				@click="clearRotationQueue"
				class="control-btn"
				style="--btn-index: 4"
			>
				<Remove />
			</button>
		</el-tooltip>
	</div>

	<!-- 旋转菜单 - 底部中央 -->
	<div class="rotation-menu" v-if="showRotation">
		<!-- 旋转按钮 - 上下两行布局 -->
		<div class="rotation-container">
			<!-- 上排按钮 -->
			<div class="rotation-row top-row">
				<el-button
					v-for="(btn, index) in topRowButtons"
					:key="`${btn.face}-${btn.direction}`"
					:type="btn.direction === 1 ? 'primary' : 'success'"
					:style="{ 
						'--btn-color': btn.color,
						'background-color': btn.color,
						'border-color': btn.color,
						'color': '#000',
						'--btn-index': index,
						'width': '2.8rem',
					}"
					@click="handleRotate(btn.face, btn.direction)"
					class="rotation-btn"
					:disabled="isRotating"
				>
					{{ btn.label }}
				</el-button>
			</div>

			<!-- 下排按钮 -->
			<div class="rotation-row bottom-row">
				<el-button
					v-for="(btn, index) in bottomRowButtons"
					:key="`${btn.face}-${btn.direction}`"
					:type="btn.direction === 1 ? 'primary' : 'success'"
					:style="{ 
						'--btn-color': btn.color,
						'background-color': btn.color,
						'border-color': btn.color,
						'color': '#000',
						'--btn-index': index + 6,
						'width': '2.8rem',
					}"
					@click="handleRotate(btn.face, btn.direction)"
					class="rotation-btn"
					:disabled="isRotating"
					:class="{ 'rotating': isRotating }"
				>
					{{ btn.label }}
				</el-button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* 主题切换下拉菜单样式 - 左上角 */
.theme-toggle {
	position: absolute;
	top: 20px;
	left: 20px;
	z-index: 20;
	display: flex;
	gap: 10px;
}

.theme-select {
	width: 140px;
}

/* 自定义下拉选择器样式 */
.custom-select {
	position: relative;
	width: 140px;
	z-index: 1000;
}

.select-trigger {
	width: 100%;
	height: 36px;
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 6px;
	color: white;
	font-size: 14px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 12px;
	transition: all 0.3s ease;
	backdrop-filter: blur(10px);
	animation: selectSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	animation-delay: calc(var(--select-index, 0) * 0.3s);
}

.select-trigger:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.5);
}

.select-trigger:focus {
	outline: none;
	border-color: rgba(255, 255, 255, 0.7);
	box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.select-value {
	flex: 1;
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.select-arrow {
	font-size: 10px;
	transition: transform 0.3s ease;
	color: rgba(255, 255, 255, 0.7);
}

.select-arrow.open {
	transform: rotate(180deg);
}

.select-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background:transparent;
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 6px;
	margin-top: 4px;
	z-index: 1000;
	max-height: 200px;
	overflow-y: auto;
}

.select-option {
	padding: 10px 12px;
	color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.select-option:last-child {
	border-bottom: none;
}

.select-option:hover {
	background: rgba(255, 255, 255, 0.1);
}

.select-option.active {
	background: rgba(255, 255, 255, 0.2);
	color: #fff;
	font-weight: 500;
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

/* 控制按钮样式 - 右上角 */
.control-toggle {
	position: absolute;
	top: 20px;
	right: 20px;
	z-index: 20;
	display: flex;
	gap: 12px;
}

.control-btn {
	width: 48px;
	height: 48px;
	background: rgba(255, 255, 255, 0.1);
	border: 2px solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	border-radius: 50%;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	outline: none;
	/* Q弹开场动画 - 使用更丝滑的缓动函数 */
	animation: controlBtnBounce 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	animation-delay: calc(var(--btn-index, 0) * 0.12s);
	/* 添加微妙的呼吸效果 */
	animation-fill-mode: both;
}

.control-btn:hover {
	transform: translateY(-4px) scale(1.08);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
	background: rgba(255, 255, 255, 0.3);
	border-color: rgba(255, 255, 255, 0.5);
	transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.control-btn:active {
	transform: translateY(-2px) scale(0.92);
	transition: all 0.08s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.control-btn:disabled {
	opacity: 0.4;
	background: rgba(255, 255, 255, 0.05);
	border-color: rgba(255, 255, 255, 0.1);
	transform: none;
}

.control-btn:disabled:hover {
	transform: none;
	box-shadow: none;
	background: rgba(255, 255, 255, 0.05);
}

/* 确保图标正确显示 */
.control-btn svg {
	width: 20px;
	height: 20px;
	color: white;
}

/* 旋转菜单样式 - 底部中央 */
.rotation-menu {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20px;
	max-width: 800px;
	margin: 0 auto;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
}

.rotation-container {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.rotation-row {
	display: flex;
	justify-content: center;
	gap: 15px;
}

.rotation-btn {
	min-width: 60px;
	height: 60px;
	font-size: 1.2rem;
	font-weight: 700;
	border-radius: 12px;
	transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	/* 旋转按钮开场动画 - 更丝滑的弹跳 */
	animation: rotationBtnBounce 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	animation-delay: calc(var(--btn-index, 0) * 0.06s);
	opacity: 0;
}

.rotation-btn:hover {
	transform: translateY(-5px) scale(1.08);
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
	filter: brightness(1.2);
	transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.rotation-btn:active {
	transform: translateY(-3px) scale(0.9);
	transition: all 0.06s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.rotation-btn.rotating {
	animation: shake 0.5s ease-in-out;
}

/* 动画效果 */
@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-5px); }
	75% { transform: translateX(5px); }
}

/* Q弹开场动画 - 更丝滑的弹跳效果 */
@keyframes controlBtnBounce {
	0% {
		transform: scale(0) rotate(-180deg);
		opacity: 0;
	}
	15% {
		transform: scale(1.2) rotate(-120deg);
		opacity: 0.5;
	}
	30% {
		transform: scale(0.8) rotate(-60deg);
		opacity: 0.7;
	}
	45% {
		transform: scale(1.1) rotate(-20deg);
		opacity: 0.85;
	}
	60% {
		transform: scale(0.9) rotate(0deg);
		opacity: 0.95;
	}
	75% {
		transform: scale(1.05) rotate(0deg);
		opacity: 1;
	}
	85% {
		transform: scale(0.97) rotate(0deg);
		opacity: 1;
	}
	95% {
		transform: scale(1.01) rotate(0deg);
		opacity: 1;
	}
	100% {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}
}

/* 微妙的呼吸效果 - 更丝滑的缓动 */
@keyframes controlBtnBreath {
	0% {
		transform: scale(1);
	}
	25% {
		transform: scale(1.02);
	}
	50% {
		transform: scale(1.05);
	}
	75% {
		transform: scale(1.02);
	}
	100% {
		transform: scale(1);
	}
}

/* 旋转按钮开场动画 - 更丝滑的弹跳效果 */
@keyframes rotationBtnBounce {
	0% {
		transform: translateY(120px) scale(0.2) ;
		opacity: 0;
	}
	12% {
		transform: translateY(-15px) scale(1.15) ;
		opacity: 0.6;
	}
	25% {
		transform: translateY(8px) scale(0.85) ;
		opacity: 0.8;
	}
	38% {
		transform: translateY(-8px) scale(1.08);
		opacity: 0.9;
	}
	50% {
		transform: translateY(4px) scale(0.92) ;
		opacity: 0.95;
	}
	62% {
		transform: translateY(-3px) scale(1.03);
		opacity: 1;
	}
	75% {
		transform: translateY(1px) scale(0.98);
		opacity: 1;
	}
	87% {
		transform: translateY(-1px) scale(1.01) ;
		opacity: 1;
	}
	100% {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
}

/* 响应式设计 */
@media (max-width: 480px) {
	.theme-toggle {
		top: 8px;
		left: 8px;
		gap: 8px;
	}
	
	.custom-select {
		width: 120px;
	}
	
	.select-trigger {
		height: 40px;
		font-size: 14px;
		padding: 0 8px;
	}
	
	.control-toggle {
		top: 8px;
		right: 8px;
		flex-direction: column;
		gap: 4px;
	}
	
	.control-btn {
		width: 46px;
		height: 46px;
	}
	
	.control-btn svg {
		width: 18px;
		height: 18px;
	}
	
	.rotation-menu {
		padding: 8px;
		margin-bottom: 2rem;
	}
	
	.rotation-container {
		gap: 6px;
	}
	
	.rotation-btn {
		min-width: 40px;
		height: 40px;
		font-size: 0.9rem;
	}
	
	.rotation-row {
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}
}
</style>
