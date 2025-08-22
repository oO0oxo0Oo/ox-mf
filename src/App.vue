<template>
  <div id="app" :style="appStyle">
    <transition name="fade">
      <Begin 
        v-if="showBegin" 
        @animation-complete="handleAnimationComplete"
        @navigate-to-cube="handleNavigateToCube"
        key="begin"
      />
      <Cube
        v-else
        :cube-config="cubeConfig"
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

// 魔方配置状态
const cubeConfig = ref({
  type: 'cube3',  // 默认3阶魔方
  style: 'classic' // 默认经典风格
})

// 响应式背景样式计算
const appStyle = computed(() => ({
  background: '#FFB1A4',
  transition: 'background 1.2s ease-in-out'
}))

// 处理动画完成事件
function handleAnimationComplete() {
  showBegin.value = false
}

// 处理导航到魔方页面事件
function handleNavigateToCube(selection) {
  cubeConfig.value = {
    type: selection.type,
    theme: selection.style  // 将 style 映射到 theme
  }  
  // 切换到魔方页面
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
