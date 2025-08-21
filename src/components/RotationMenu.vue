<script setup>
import { useRotationQueueStore } from "../stores/rotationQueue";
import { useCubeStore } from "../stores/cube";
import { useGameStore } from "../stores/game";
import { computed, ref, watch } from "vue";
import { getThemeColors } from "../config/themes.js";

const rotationQueueStore = useRotationQueueStore();
const cubeStore = useCubeStore();
const gameStore = useGameStore();

// 控制状态
const isDraggingEnabled = ref(true);

// 定义事件
const emit = defineEmits(['toggle-dragging', 'reset-cube']);

const scramble = () => {
	cubeStore.scrambleCube();
}
const solve = () =>{
	console.log(cubeStore.solve(),"!!!!!!")
}

// 禁用/启用拖拽
const toggleDragging = () => {
	isDraggingEnabled.value = !isDraggingEnabled.value;
	emit('toggle-dragging', isDraggingEnabled.value);
}

// 还原魔方
const resetCube = () => {
	emit('reset-cube');
}


// 定义点击处理函数
const handleRotate = (face, direction = 1) => {
	rotationQueueStore.addRotationToQueue(face, direction);
};

// 旋转按钮配置 - 上下两行布局
const topRowButtons = computed(() => [
	{ face: 'U', direction: 1, label: 'U', color: getFaceColor('U') },
	{ face: 'U', direction: -1, label: "U'", color: getFaceColor('U') },
	{ face: 'D', direction: 1, label: 'D', color: getFaceColor('D') },
	{ face: 'D', direction: -1, label: "D'", color: getFaceColor('D') },
	{ face: 'L', direction: 1, label: 'L', color: getFaceColor('L') },
	{ face: 'L', direction: -1, label: "L'", color: getFaceColor('L') },
]);

const bottomRowButtons = computed(() => [
	{ face: 'R', direction: 1, label: 'R', color: getFaceColor('R') },
	{ face: 'R', direction: -1, label: "R'", color: getFaceColor('R') },
	{ face: 'F', direction: 1, label: 'F', color: getFaceColor('F') },
	{ face: 'F', direction: -1, label: "F'", color: getFaceColor('F') },
	{ face: 'B', direction: 1, label: 'B', color: getFaceColor('B') },
	{ face: 'B', direction: -1, label: "B'", color: getFaceColor('B') },
]);

// 根据当前主题获取面颜色的函数
function getFaceColor(face) {
	const currentTheme = cubeStore.getCurrentTheme();
	// 从主题配置获取颜色
	const colors = getThemeColors(currentTheme);
	const hexColor = colors[face];
	
	// 将十六进制颜色转换为CSS颜色格式，并添加透明度让颜色更接近魔方
	const colorHex = `#${hexColor.toString(16).padStart(6, '0')}`;
	
	// 根据颜色亮度调整透明度，让按钮颜色更接近魔方
	if (face === 'U' || face === 'D') {
		// 白色和黄色使用较低透明度
		return `${colorHex}CC`; // 80% 透明度
	} else {
		// 其他颜色使用中等透明度
		return `${colorHex}99`; // 60% 透明度
	}
}

// 计算属性
const queueLength = computed(() => rotationQueueStore.queueLength());
const animationStatus = computed(() => rotationQueueStore.getAnimationEngineStatus());
const hasCurrentRotation = computed(() => rotationQueueStore.hasCurrentRotation());
const isRotating = computed(() => rotationQueueStore.hasCurrentRotation());

// 主题相关
const currentTheme = ref(cubeStore.getCurrentTheme());
const availableThemes = computed(() => cubeStore.getAvailableThemes());
const currentThemeName = computed(() => {
  const theme = availableThemes.value.find(t => t.key === currentTheme.value);
  return theme ? theme.name : '经典';
});

// 主题切换处理函数
const handleThemeChange = () => {
  console.log('尝试切换主题到:', currentTheme.value);
  console.log('可用主题:', availableThemes.value);
  
  const success = cubeStore.setTheme(currentTheme.value);
  if (!success) {
    console.error('主题切换失败:', currentTheme.value);
    // 如果切换失败，恢复原来的主题
    currentTheme.value = cubeStore.getCurrentTheme();
  } else {
    console.log('主题切换成功:', currentTheme.value);
  }
};

// 监听store中主题的变化，同步更新本地状态
watch(() => cubeStore.config.theme, (newTheme) => {
  console.log('主题变化监听器触发，新主题:', newTheme);
  currentTheme.value = newTheme;
}, { immediate: true });
</script>

<template>
	<div class="rotation-menu">
		<!-- 主题切换下拉菜单 - 左上角 -->
		<div class="theme-toggle">
			<select 
				class="theme-select"
				v-model="currentTheme"
				@change="handleThemeChange"
				:title="`当前主题: ${currentThemeName}`"
			>
				<option 
					v-for="theme in availableThemes" 
					:key="theme.key" 
					:value="theme.key"
				>
					{{ theme.name }}
				</option>
			</select>
		</div>

		<!-- 控制按钮 - 右上角 -->
		<div class="control-toggle">
			<button 
				class="control-btn"
				@click="toggleDragging"
				:title="isDraggingEnabled ? '禁用拖拽' : '启用拖拽'"
				:class="{ 'disabled': !isDraggingEnabled }"
			>
				<span class="btn-icon">{{ isDraggingEnabled ? '👋' : '👊' }}</span>
				<span class="btn-text">{{ isDraggingEnabled ? '禁用拖拽' : '启用拖拽' }}</span>
			</button>
			<button 
				class="control-btn reset-btn"
				@click="resetCube"
				title="还原魔方"
			>
				<span class="btn-icon">↩️</span>
				<span class="btn-text">还原</span>
			</button>
		</div>

		<!-- 旋转按钮 - 上下两行布局 -->
		<div class="rotation-container">
			<!-- 上排按钮 -->
			<div class="rotation-row top-row">
				<button
					v-for="btn in topRowButtons"
					:key="`${btn.face}-${btn.direction}`"
					class="rotation-btn"
					:class="{ 
						'btn-primary': btn.direction === 1,
						'btn-secondary': btn.direction === -1
					}"
					:style="{ '--btn-color': btn.color }"
					@click="handleRotate(btn.face, btn.direction)"
				>
					<span class="btn-label">{{ btn.label }}</span>
				</button>
			</div>

			<!-- 下排按钮 -->
			<div class="rotation-row bottom-row">
				<button
					v-for="btn in bottomRowButtons"
					:key="`${btn.face}-${btn.direction}`"
					class="rotation-btn"
					:class="{ 
						'btn-primary': btn.direction === 1,
						'btn-secondary': btn.direction === -1,
						'rotating': isRotating
					}"
					:style="{ '--btn-color': btn.color }"
					@click="handleRotate(btn.face, btn.direction)"
					:disabled="isRotating"
				>
					<span class="btn-label">{{ btn.label }}</span>
				</button>
			</div>
		</div>

		<!-- 控制按钮 -->
		<div class="control-buttons">
			<button 
				class="control-btn clear-btn"
				@click="scramble"
			>
				<span class="btn-icon">🗑️</span>
				打乱
			</button>
			<button class="control-btn clear-btn" @click="solve">求解十字</button>
		</div>
	</div>
</template>

<style scoped>
.rotation-menu {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	/* background: transparent; */
	/* border-radius: 16px; */
	padding: 10px;
	/* box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2); */
	max-width: 800px;
	margin: 0 auto;
	z-index: 20;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
}

/* 主题切换下拉菜单样式 */
.theme-toggle {
	position: absolute;
	top: -60px;
	left: 0;
}

.theme-select {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	padding: 10px 16px;
	color: white;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.3s ease;
	backdrop-filter: blur(10px);
	min-width: 120px;
	appearance: none;
	background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
	background-repeat: no-repeat;
	background-position: right 12px center;
	background-size: 16px;
	padding-right: 40px;
}

.theme-select:hover {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.12));
	border-color: rgba(255, 255, 255, 0.5);
}

.theme-select:focus {
	outline: none;
	border-color: rgba(255, 255, 255, 0.7);
	box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.theme-select option {
	background: rgba(0, 0, 0, 0.8);
	color: white;
	border: none;
	padding: 8px;
}

.menu-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.menu-title {
	color: white;
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.menu-status {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
}



.queue-info {
	color: rgba(255, 255, 255, 0.8);
	font-size: 0.8rem;
	font-weight: 500;
}

.animation-status {
	color: rgba(255, 255, 255, 0.8);
	font-size: 0.8rem;
	font-weight: 500;
	padding: 2px 8px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.1);
}

.status-running {
	background: rgba(0, 255, 0, 0.2);
	color: #90EE90;
}

.status-paused {
	background: rgba(255, 165, 0, 0.2);
	color: #FFA500;
}

.status-idle {
	background: rgba(128, 128, 128, 0.2);
	color: rgba(255, 255, 255, 0.6);
}

.rotation-status {
	color: #FFD700;
	font-size: 0.8rem;
	font-weight: 500;
	animation: pulse 1.5s ease-in-out infinite alternate;
}

@keyframes pulse {
	from {
		opacity: 0.6;
	}
	to {
		opacity: 1;
	}
}

.rotation-row {
	display: flex;
	justify-content: center;
	gap: 12px;
	margin-bottom: 6px;
}

.rotation-row:last-child {
	margin-bottom: 0;
}

.rotation-btn {
	position: relative;
	background: var(--btn-color);
	border: 2px solid rgba(0, 0, 0, 0.3);
	border-radius: 10px;
	padding: 12px 8px;
	color: #000;
	font-weight: 700;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	min-height: 50px;
	min-width: 50px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 移除之前的伪元素样式，现在使用纯色背景 */

.rotation-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	border-color: rgba(0, 0, 0, 0.5);
	filter: brightness(1.1);
}

.rotation-btn:active {
	transform: translateY(0);
	transition: transform 0.1s ease;
}

.rotation-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.rotation-btn.rotating {
	animation: shake 0.5s ease-in-out;
}

.btn-label {
	position: relative;
	z-index: 1;
	font-size: 1.1rem;
	font-weight: 700;
	text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.btn-primary {
	border-color: rgba(255, 255, 255, 0.3);
}

.btn-secondary {
	border-color: rgba(255, 255, 255, 0.2);
	/* 移除background，让CSS变量生效 */
}

.control-buttons {
	display: flex;
	justify-content: center;
	gap: 12px;
}

.control-btn {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
	border: 2px solid rgba(255, 255, 255, 0.2);
	border-radius: 10px;
	padding: 12px 20px;
	color: white;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 8px;
}

.control-btn:hover {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
	transform: translateY(-1px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.control-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.clear-btn {
	border-color: rgba(255, 107, 107, 0.4);
}

.clear-btn:hover {
	border-color: rgba(255, 107, 107, 0.6);
	background: linear-gradient(145deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05));
}

.control-toggle {
	position: absolute;
	top: -60px;
	right: 0;
	display: flex;
	gap: 10px;
}

.control-toggle .control-btn {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	padding: 10px 16px;
	color: white;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 8px;
	backdrop-filter: blur(10px);
}

.control-toggle .control-btn:hover {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.12));
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	border-color: rgba(255, 255, 255, 0.5);
}

.control-toggle .control-btn.disabled {
	opacity: 0.6;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

.control-toggle .control-btn.disabled:hover {
	transform: none;
	box-shadow: none;
}

.control-toggle .btn-icon {
	font-size: 1.2rem;
}

.control-toggle .btn-text {
	font-size: 0.85rem;
}

.control-btn.reset-btn {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
	border: 2px solid rgba(255, 255, 255, 0.2);
	border-radius: 10px;
	padding: 12px 20px;
	color: white;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 8px;
}

.control-btn.reset-btn:hover {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
	transform: translateY(-1px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.control-btn.reset-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.btn-icon {
	font-size: 1rem;
}

.btn-text {
	font-size: 0.85rem;
}

/* 动画 */
@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-2px); }
	75% { transform: translateX(2px); }
}

/* 响应式设计 */
@media (max-width: 480px) {
	.rotation-menu {
		padding: 16px;
		max-width: 100%;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	
	.theme-toggle {
		position: static;
		top: auto;
		left: auto;
		width: 100%;
	}
	
	.theme-select {
		width: 100%;
		min-width: auto;
	}

	.control-toggle {
		position: static;
		top: auto;
		right: auto;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
	}
	
	.rotation-row {
		gap: 10px;
		margin-bottom: 6px;
	}
	
	.rotation-btn {
		padding: 10px 6px;
		min-height: 45px;
		min-width: 45px;
		flex: 1;
		max-width: 55px;
	}
	
	.btn-label {
		font-size: 1.2rem;
	}
	
	.btn-face {
		font-size: 0.8rem;
	}
	
	.menu-header {
		flex-direction: column;
		gap: 8px;
		align-items: flex-start;
	}
}
</style>
