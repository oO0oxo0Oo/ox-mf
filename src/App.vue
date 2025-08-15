<template>
  <div id="app" :style="appStyle">
    <transition name="fade">
      <Begin 
        v-if="showBegin" 
        @animation-complete="handleAnimationComplete"
        key="begin"
      />
      <Cube
        v-else
        key="cube-demo"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Begin from './components/Begin.vue'
import Cube from './components/Cube.vue'

// 控制组件显示状态
const showBegin = ref(true)

// 响应式背景样式计算
const appStyle = computed(() => ({
  background: showBegin.value 
    ? '#0a0a0a' 
    : 'linear-gradient(135deg, #87CEEB 0%, #00BFFF 50%, #1E90FF 100%)',
  transition: 'background 1.2s ease-in-out'
}))

// 处理动画完成事件
function handleAnimationComplete() {
  showBegin.value = false
}

</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* WebGL友好的过渡动画 */
.fade-enter-active {
  transition: opacity 0.8s ease-out;
}

.fade-leave-active {
  transition: opacity 0.4s ease-in;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #0a0a0a;
}

html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
