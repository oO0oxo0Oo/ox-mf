<script setup>
import { useRotationQueue } from "../composable/useRotationQueue";
import { useCubeStore } from "../stores/cube";
import { computed, ref, watch } from "vue";
import { getThemeColors } from "../config/themes.js";

const rotationQueue = useRotationQueue();
const cubeStore = useCubeStore();

// 控制状态
const isDraggingEnabled = ref(true);

// 定义事件
const emit = defineEmits(['toggle-dragging', 'reset-cube', 'reset-world-rotation']);

const scramble = () => {
	cubeStore.scrambleCube(rotationQueue);
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

// 重置整体旋转
const resetWorldRotation = () => {
	emit('reset-world-rotation');
}


// 定义点击处理函数
const handleRotate = (face, direction = 1) => {
	rotationQueue.addRotationToQueue(face, direction);
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
const queueLength = computed(() => rotationQueue.queueLength());
const animationStatus = computed(() => rotationQueue.getAnimationEngineStatus());
const hasCurrentRotation = computed(() => rotationQueue.hasCurrentRotation());
const isRotating = computed(() => rotationQueue.isRotating());

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
			class="control-btn icon-btn"
			@click="toggleDragging"
			:title="isDraggingEnabled ? '禁用拖拽' : '启用拖拽'"
			:class="{ 'disabled': !isDraggingEnabled }"
		>
			<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 12l2 2 4-4"/>
				<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
			</svg>
		</button>
		<button 
			class="control-btn icon-btn reset-btn"
			@click="resetCube"
			title="还原魔方"
		>
			<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
				<path d="M21 3v5h-5"/>
				<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
				<path d="M3 21v-5h5"/>
			</svg>
		</button>
		<!-- 新增：重置整体旋转按钮 -->
		<button 
			class="control-btn icon-btn reset-world-btn"
			@click="resetWorldRotation"
			title="重置视角"
		>
			<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
				<path d="M21 3v5h-5"/>
				<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
				<path d="M3 21v-5h5"/>
			</svg>
		</button>
		<!-- 打乱按钮 -->
		<button 
			class="control-btn icon-btn scramble-btn"
			@click="scramble"
			title="打乱魔方"
		>
			<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 6h18"/>
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
				<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
			</svg>
		</button>
		<!-- 求解按钮 -->
		<!-- <button 
			class="control-btn solve-btn"
			@click="solve"
			title="求解十字"
		>
			<span class="btn-icon">🎯</span>
			<span class="btn-text">求解</span>
		</button> -->
	</div>

	<!-- 旋转菜单 - 底部中央 -->
	<div class="rotation-menu">
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
	</div>
</template>

<style scoped>
/* 主题切换下拉菜单样式 - 左上角 */
.theme-toggle {
	position: absolute;
	top: 20px;
	left: 20px;
	z-index: 20;
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

/* 控制按钮样式 - 右上角 */
.control-toggle {
	position: absolute;
	top: 20px;
	right: 20px;
	display: flex;
	gap: 8px;
	z-index: 20;
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

/* 简约图标按钮样式 */
.control-toggle .icon-btn {
	padding: 12px;
	min-width: 44px;
	min-height: 44px;
	justify-content: center;
	border-radius: 50%;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
	border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-toggle .icon-btn:hover {
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	border-color: rgba(255, 255, 255, 0.4);
}

.control-toggle .icon-btn.disabled {
	opacity: 0.6;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
}

.control-toggle .icon-btn.disabled:hover {
	transform: none;
	box-shadow: none;
}

.control-toggle .btn-icon {
	font-size: 1.4rem;
	width: 20px;
	height: 20px;
	color: rgba(255, 255, 255, 0.9);
	transition: all 0.3s ease;
}

/* SVG图标悬停效果 */
.control-toggle .icon-btn:hover .btn-icon {
	color: rgba(255, 255, 255, 1);
	transform: scale(1.1);
}

/* 禁用状态的图标 */
.control-toggle .icon-btn.disabled .btn-icon {
	color: rgba(255, 255, 255, 0.5);
}

/* 旋转菜单样式 - 底部中央 */
.rotation-menu {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 10px;
	max-width: 800px;
	margin: 0 auto;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
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

.reset-world-btn {
	background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
	border-color: rgba(102, 126, 234, 0.3);
}

.reset-world-btn:hover {
	background: linear-gradient(145deg, #5a6fd8 0%, #6a4190 100%);
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

/* 打乱按钮样式 */
.scramble-btn {
	background: linear-gradient(145deg, #ff6b6b 0%, #ee5a24 100%);
	border-color: rgba(255, 107, 107, 0.3);
}

.scramble-btn:hover {
	background: linear-gradient(145deg, #ff5252 0%, #e74c3c 100%);
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
}

/* 求解按钮样式 */
.solve-btn {
	background: linear-gradient(145deg, #00b894 0%, #00a085 100%);
	border-color: rgba(0, 184, 148, 0.3);
}

.solve-btn:hover {
	background: linear-gradient(145deg, #00a085 0%, #008f7a 100%);
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0, 184, 148, 0.4);
}

/* 动画 */
@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-2px); }
	75% { transform: translateX(2px); }
}

/* 响应式设计 */
@media (max-width: 480px) {
	.theme-toggle {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	
	.theme-select {
		width: 100px;
		min-width: auto;
		font-size: 0.8rem;
		padding: 8px 12px;
	}

	.control-toggle {
		position: absolute;
		top: 10px;
		right: 10px;
		flex-direction: row;
		gap: 6px;
	}
	
	.control-toggle .icon-btn {
		padding: 10px;
		min-width: 40px;
		min-height: 40px;
	}
	
	.control-toggle .btn-icon {
		font-size: 1.2rem;
		width: 18px;
		height: 18px;
	}
	
	.control-toggle .btn-text {
		display: none; /* 在小屏幕上隐藏文字，只显示图标 */
	}
	
	.rotation-menu {
		padding: 16px;
		max-width: 100%;
		flex-direction: column;
		align-items: center;
		gap: 10px;
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
