<script setup>
import { useRotationQueueStore } from "../stores/rotationQueue";
import { useCubeStore } from "../stores/cube";
import { computed } from "vue";

const rotationQueueStore = useRotationQueueStore();
const cubeStore = useCubeStore();

const scramble = () => {
	cubeStore.scrambleCube();
}
const solve = () =>{
	console.log(cubeStore.solve(),"!!!!!!")
}



// 定义点击处理函数
const handleRotate = (face, direction = 1) => {
	rotationQueueStore.addRotationToQueue(face, direction);
};

// 旋转按钮配置 - 上下两行布局
const topRowButtons = [
	{ face: 'U', direction: 1, label: 'U', color: '#FFD700' },
	{ face: 'U', direction: -1, label: "U'", color: '#FFD700' },
	{ face: 'D', direction: 1, label: 'D', color: '#FFFFFF' },
	{ face: 'D', direction: -1, label: "D'", color: '#FFFFFF' },
	{ face: 'L', direction: 1, label: 'L', color: '#FF8C00' },
	{ face: 'L', direction: -1, label: "L'", color: '#FF8C00' },
];

const bottomRowButtons = [
	{ face: 'R', direction: 1, label: 'R', color: '#FF0000' },
	{ face: 'R', direction: -1, label: "R'", color: '#FF0000' },
	{ face: 'F', direction: 1, label: 'F', color: '#00FF00' },
	{ face: 'F', direction: -1, label: "F'", color: '#00FF00' },
	{ face: 'B', direction: 1, label: 'B', color: '#0000FF' },
	{ face: 'B', direction: -1, label: "B'", color: '#0000FF' },
];

// 计算属性
const queueLength = computed(() => rotationQueueStore.queueLength());
const animationStatus = computed(() => rotationQueueStore.getAnimationEngineStatus());
const hasCurrentRotation = computed(() => rotationQueueStore.hasCurrentRotation());
</script>

<template>
	<div class="rotation-menu">
		<!-- 标题 -->
		<div class="menu-header">
			<h3 class="menu-title">魔方控制</h3>
					<div class="menu-status">
			<span class="queue-info" v-if="queueLength > 0">
				队列: {{ queueLength }}
			</span>
			<span class="animation-status" :class="{ 
				'status-running': animationStatus.isRunning,
				'status-paused': animationStatus.isPaused,
				'status-idle': !animationStatus.isRunning && !animationStatus.isPaused
			}">
				{{ animationStatus.isPaused ? '已暂停' : 
				   animationStatus.isRunning ? '运行中' : '空闲' }}
			</span>
			<span class="rotation-status" v-if="hasCurrentRotation">
				🔄 旋转中
			</span>
		</div>
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
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	max-width: 800px;
	margin: 0 auto;
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

.rotation-container {
	margin-bottom: 16px;
}

.rotation-row {
	display: flex;
	justify-content: center;
	gap: 16px;
	margin-bottom: 8px;
}

.rotation-row:last-child {
	margin-bottom: 0;
}

.rotation-btn {
	position: relative;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
	border: 2px solid rgba(255, 255, 255, 0.2);
	border-radius: 12px;
	padding: 20px 12px;
	color: white;
	font-weight: 600;
	font-size: 1.1rem;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	min-height: 70px;
	min-width: 70px;
}

.rotation-btn::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(45deg, var(--btn-color), transparent);
	opacity: 0.3;
	transition: opacity 0.3s ease;
}

.rotation-btn:hover::before {
	opacity: 0.5;
}

.rotation-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	border-color: rgba(255, 255, 255, 0.4);
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
	font-size: 1.4rem;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.btn-primary {
	border-color: rgba(255, 255, 255, 0.3);
}

.btn-secondary {
	border-color: rgba(255, 255, 255, 0.2);
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
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



.btn-icon {
	font-size: 1rem;
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
	}
	
	.rotation-row {
		gap: 10px;
		margin-bottom: 6px;
	}
	
	.rotation-btn {
		padding: 16px 8px;
		min-height: 60px;
		min-width: 60px;
		flex: 1;
		max-width: 70px;
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
