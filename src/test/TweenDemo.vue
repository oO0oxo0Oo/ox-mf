<template>
  <div style="padding: 40px; max-width: 600px;">
    <h2>useTween 动画可视化测试</h2>
    <div style="margin-bottom: 16px;">
      <label>选择缓动类型：</label>
      <select v-model="easingType">
        <option v-for="item in easingOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <button @click="startTween" style="margin-left: 10px;">开始动画</button>
      <button @click="stopTween" style="margin-left: 10px;">停止动画</button>
    </div>
    <div style="margin: 20px 0; font-size: 1.2em;">
      动画数值：<b>{{ Math.round(animatedValue) }}</b>
    </div>
    <!-- 进度条可视化 -->
    <div style="position: relative; height: 24px; background: #eee; border-radius: 12px; overflow: hidden;">
      <div
        :style="{
          width: animatedValue + '%',
          height: '100%',
          background: '#4fc08d',
          transition: 'width 0.1s linear'
        }"
      ></div>
      <!-- 小球 -->
      <div
        :style="{
          position: 'absolute',
          left: `calc(${animatedValue}% - 12px)`,
          top: '-8px',
          width: '32px',
          height: '32px',
          background: '#42b983',
          borderRadius: '50%',
          boxShadow: '0 2px 8px #aaa',
          transition: 'left 0.1s linear',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold'
        }"
      >
        {{ Math.round(animatedValue) }}
      </div>
    </div>
    <div style="margin-top: 24px; color: #888;">
      当前缓动：<b>{{ easingOptions.find(e => e.value === easingType)?.label }}</b>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTween } from '../composable/useTween'
import { Easing } from '../composable/useEasing'

const animatedValue = ref(0)
let tweenInstance = null
const target = { value: 0 }

// 缓动选项
const easingOptions = [
  { label: '线性', value: 'linear' },
  { label: '二次幂缓出 Power.Out(2)', value: 'powerOut2' },
  { label: '二次幂缓入 Power.In(2)', value: 'powerIn2' },
  { label: '正弦缓出 Sine.Out', value: 'sineOut' },
  { label: '正弦缓入 Sine.In', value: 'sineIn' },
  { label: '回弹缓出 Back.Out', value: 'backOut' },
  { label: '弹性缓出 Elastic.Out', value: 'elasticOut' }
]
const easingType = ref('powerOut2')

// 获取对应的缓动函数
function getEasing() {
  switch (easingType.value) {
    case 'linear':
      return t => t
    case 'powerOut2':
      return Easing.Power.Out(2)
    case 'powerIn2':
      return Easing.Power.In(2)
    case 'sineOut':
      return Easing.Sine.Out()
    case 'sineIn':
      return Easing.Sine.In()
    case 'backOut':
      return Easing.Back.Out()
    case 'elasticOut':
      return Easing.Elastic.Out(1, 0.3)
    default:
      return t => t
  }
}

function startTween() {
  if (tweenInstance) {
    tweenInstance.stop()
    // tweenInstance = null
  }
  target.value = 0
  animatedValue.value = 0
  tweenInstance = useTween({
    from: { value: 0 },
    to: { value: 100 },
    target,
    duration: 2000,
    easing: getEasing(),
    onUpdate: () => {
      animatedValue.value = target.value
    },
    onComplete: () => {
      // 动画完成
    }
  })
}

function stopTween() {
  if (tweenInstance) {
    tweenInstance.stop()
    // tweenInstance = null
  }
}
</script>
