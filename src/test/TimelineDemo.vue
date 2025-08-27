<template>
  <div class="timeline-demo">
    <div class="controls">
      <h2>时间线动画演示</h2>
      <div class="button-group">
        <button @click="playTimeline" :disabled="isPlaying">播放动画</button>
        <button @click="pauseTimeline" :disabled="!isPlaying">暂停</button>
        <button @click="stopTimeline">停止</button>
        <button @click="resetTimeline">重置</button>
        <button @click="toggleLoop">{{ isLooping ? '关闭循环' : '开启循环' }}</button>
      </div>
      
      <div class="info">
        <p>状态: {{ isPlaying ? '播放中' : '已停止' }}</p>
        <p>当前动画: {{ currentAnimationName }}</p>
        <p>进度: {{ currentIndex + 1 }} / {{ totalItems }}</p>
        <p>总时长: {{ totalDuration }}ms</p>
      </div>
    </div>

    <div class="animation-container">
      <!-- 动画A: 方块移动 -->
      <div 
        ref="boxA" 
        class="animation-box box-a"
        :style="{ 
          transform: `translate(${boxAPosition.x}px, ${boxAPosition.y}px) rotate(${boxARotation}deg)`,
          opacity: boxAOpacity,
          backgroundColor: boxAColor
        }"
      >
        A
      </div>

      <!-- 动画B: 圆形缩放 -->
      <div 
        ref="boxB" 
        class="animation-box box-b"
        :style="{ 
          transform: `translate(${boxBPosition.x}px, ${boxBPosition.y}px) scale(${boxBScale})`,
          opacity: boxBOpacity,
          backgroundColor: boxBColor
        }"
      >
        B
      </div>

      <!-- 动画C: 三角形旋转 -->
      <div 
        ref="boxC" 
        class="animation-box box-c"
        :style="{ 
          transform: `translate(${boxCPosition.x}px, ${boxCPosition.y}px) rotate(${boxCRotation}deg)`,
          opacity: boxCOpacity,
          backgroundColor: boxCColor
        }"
      >
        C
      </div>

      <!-- 时间线指示器 -->
      <div class="timeline-indicator">
        <div 
          v-for="(item, index) in timelineItems" 
          :key="index"
          class="timeline-item"
          :class="{ 
            'active': index === currentIndex && isPlaying,
            'completed': index < currentIndex
          }"
          @click="seekTo(index)"
        >
          <div class="item-name">{{ item.name }}</div>
          <div class="item-duration">{{ item.duration }}ms</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useTimeline } from '../composable/useTimeline.js';

// 时间线实例
const timeline = useTimeline();

// 响应式状态
const isPlaying = ref(false);
const currentIndex = ref(0);
const totalItems = ref(0);
const totalDuration = ref(0);
const currentAnimationName = ref('');
const isLooping = ref(false);

// 动画元素引用
const boxA = ref(null);
const boxB = ref(null);
const boxC = ref(null);

// 动画状态
const boxAPosition = reactive({ x: 0, y: 0 });
const boxARotation = ref(0);
const boxAOpacity = ref(0.3);
const boxAColor = ref('#ff6b6b');

const boxBPosition = reactive({ x: 0, y: 0 });
const boxBScale = ref(0.5);
const boxBOpacity = ref(0.3);
const boxBColor = ref('#4ecdc4');

const boxCPosition = reactive({ x: 0, y: 0 });
const boxCRotation = ref(0);
const boxCOpacity = ref(0.3);
const boxCColor = ref('#45b7d1');

// 时间线项目
const timelineItems = ref([]);

// 初始化时间线
onMounted(() => {
  setupTimeline();
});

function setupTimeline() {
  // 动画A: 方块从左到右移动并旋转
  timeline.addCustom((progress) => {
    boxAPosition.x = progress * 300;
    boxARotation.value = progress * 360;
    boxAOpacity.value = 0.3 + progress * 0.7;
    boxAColor.value = `hsl(${progress * 60}, 70%, 60%)`;
  }, {
    name: '方块移动',
    duration: 1500,
    easing: (t) => t * t * (3 - 2 * t) // 平滑缓动
  });

  // 动画B: 圆形缩放和颜色变化
  timeline.addCustom((progress) => {
    boxBScale.value = 0.5 + progress * 1.5;
    boxBOpacity.value = 0.3 + progress * 0.7;
    boxBColor.value = `hsl(${120 + progress * 60}, 70%, 60%)`;
  }, {
    name: '圆形缩放',
    duration: 1200,
    delay: 200, // 延迟200ms开始
    easing: (t) => 1 - Math.pow(1 - t, 3) // 缓出效果
  });

  // 动画C: 三角形旋转和弹跳
  timeline.addCustom((progress) => {
    boxCPosition.y = Math.sin(progress * Math.PI * 4) * 50 * (1 - progress);
    boxCRotation.value = progress * 720;
    boxCOpacity.value = 0.3 + progress * 0.7;
    boxCColor.value = `hsl(${240 + progress * 60}, 70%, 60%)`;
  }, {
    name: '三角形旋转',
    duration: 2000,
    delay: 500, // 延迟500ms开始
    easing: (t) => {
      // 弹跳效果
      if (t < 0.5) {
        return 2 * t * t;
      } else {
        return 1 - Math.pow(-2 * t + 2, 2) / 2;
      }
    }
  });

  // 设置回调
  timeline.on('start', () => {
    isPlaying.value = true;
  });

  timeline.on('step', (item, index) => {
    currentIndex.value = index;
    currentAnimationName.value = item.name;
  });

  timeline.on('update', (state, item, index) => {
    // 可以在这里添加额外的更新逻辑
  });

  timeline.on('complete', () => {
    isPlaying.value = false;
  });

  // 获取时间线信息
  const info = timeline.getInfo();
  totalItems.value = info.totalItems;
  totalDuration.value = info.totalDuration;
  
  // 获取时间线项目用于显示
  timelineItems.value = timeline.getTimelineItems();
}

// 控制函数
function playTimeline() {
  timeline.play();
}

function pauseTimeline() {
  timeline.pause();
  isPlaying.value = false;
}

function stopTimeline() {
  timeline.stop();
  isPlaying.value = false;
  currentIndex.value = 0;
  currentAnimationName.value = '';
}

function resetTimeline() {
  timeline.reset();
  setupTimeline();
  isPlaying.value = false;
  currentIndex.value = 0;
  currentAnimationName.value = '';
  
  // 重置动画状态
  Object.assign(boxAPosition, { x: 0, y: 0 });
  boxARotation.value = 0;
  boxAOpacity.value = 0.3;
  boxAColor.value = '#ff6b6b';
  
  Object.assign(boxBPosition, { x: 0, y: 0 });
  boxBScale.value = 0.5;
  boxBOpacity.value = 0.3;
  boxBColor.value = '#4ecdc4';
  
  Object.assign(boxCPosition, { x: 0, y: 0 });
  boxCRotation.value = 0;
  boxCOpacity.value = 0.3;
  boxCColor.value = '#45b7d1';
}

function toggleLoop() {
  isLooping.value = !isLooping.value;
  timeline.setLoop(isLooping.value);
}

function seekTo(index) {
  timeline.seek(index);
}
</script>

<style scoped>
.timeline-demo {
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.controls {
  margin-bottom: 30px;
  text-align: center;
}

.controls h2 {
  color: #333;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.button-group button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.button-group button:hover:not(:disabled) {
  background: #0056b3;
}

.button-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.info p {
  margin: 5px 0;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
}

.animation-container {
  position: relative;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 30px;
}

.animation-box {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 24px;
  color: white;
  border-radius: 8px;
  transition: all 0.1s ease;
  user-select: none;
}

.box-a {
  width: 80px;
  height: 80px;
  left: 50px;
  top: 50%;
  transform: translateY(-50%);
}

.box-b {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.box-c {
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 70px solid currentColor;
  left: calc(100% - 150px);
  top: 50%;
  transform: translateY(-50%);
  background: transparent !important;
}

.timeline-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.timeline-item:hover {
  background: rgba(0, 123, 255, 0.1);
}

.timeline-item.active {
  background: rgba(0, 123, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
}

.timeline-item.completed {
  background: rgba(40, 167, 69, 0.2);
}

.item-name {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 5px;
}

.item-duration {
  font-size: 10px;
  color: #666;
}

@media (max-width: 480px) {
  .button-group {
    flex-direction: column;
    align-items: center;
  }
  
  .timeline-indicator {
    flex-direction: column;
    gap: 10px;
  }
  
  .animation-container {
    height: 300px;
  }
}
</style>
