<template>
  <div class="controls-demo">
    <div class="demo-header">
      <h2>Controls 功能测试</h2>
      <p>测试魔方控制器的基本功能</p>
    </div>

    <!-- 测试区域 -->
    <div class="test-container">
      <!-- 3D 场景容器 -->
      <div ref="worldRef" class="world-container">
        <World ref="worldComponent" />
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="panel-section">
          <h3>基础控制</h3>
          <div class="control-group">
            <button @click="enableControls" :disabled="controlsEnabled">
              启用控制
            </button>
            <button @click="resetCube" :disabled="!cubeInitialized">
              重置魔方
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h3>魔方配置</h3>
          <div class="control-group">
            <label>魔方类型:</label>
            <select v-model="localCubeType" @change="updateCubeType" :disabled="cubeInitialized">
              <option value="cube3">3x3 魔方</option>
              <option value="cube2">2x2 魔方</option>
              <!-- 未来可以添加更多类型 -->
            </select>
            <div class="info-text">
              当前类型: <strong>{{ localCubeType }}</strong>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>动画配置</h3>
          <div class="control-group">
            <label>翻转动画类型:</label>
            <select v-model="flipConfig" @change="updateFlipConfig">
              <option value="0">力度缓动 (快速)</option>
              <option value="1">正弦缓动 (平滑)</option>
              <option value="2">回弹缓动 (回弹)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import World from '../components/World.vue'
import { useControls } from '../composable/useControls'
import { useCubeStore } from '../stores'

// 组件引用
const worldRef = ref(null)
const worldComponent = ref(null)

// Store 实例
const cubeStore = useCubeStore()

// 响应式状态
const flipConfig = ref(0)
const controlsEnabled = ref(false)
const cubeInitialized = ref(false)
const isScrambling = ref(false)

// 计算属性
const controlsState = computed(() => {
  return cubeStore.controlsState?.currentState || 'idle'
})

// 本地魔方类型状态，与 store 同步
const localCubeType = ref(cubeStore.config.cubeType)

// 监听 store 中魔方类型的变化
watch(() => cubeStore.config.cubeType, (newType) => {
  localCubeType.value = newType
})

// 控制实例
let controlsInstance = null

// 控制功能
function enableControls() {
    if (!worldComponent.value) return

    cubeStore.initCube(worldComponent.value.scene)
    cubeInitialized.value = true

    // 获取 camera
    const camera = worldComponent.value.camera

    // 从 store 获取魔方实例
    const cubeInstance = cubeStore.getCubeInstance()

    // 初始化控制
    controlsInstance = useControls(worldRef, cubeInstance, camera, worldComponent.value, {
      onScrambleComplete: () => {
        isScrambling.value = false
      }
    })

    // 初始化控制
    controlsInstance.init()
    controlsInstance.enable()
    controlsEnabled.value = true

}

function updateFlipConfig() {
  if (controlsInstance) {
    cubeStore.setFlipConfig(parseInt(flipConfig.value))
  }
}

function updateCubeType() {
  cubeStore.setCubeType(localCubeType.value)
}

function resetCube() {
  // 使用 store 重置魔方
  cubeStore.resetCube()
}


// 监听器
watch(() => cubeStore.isInitialized, (initialized) => {
  cubeInitialized.value = initialized
})


// 生命周期
onMounted(() => {
  enableControls()
})

</script>

<style scoped>
.controls-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.demo-header h2 {
  margin: 0 0 10px 0;
  font-size: 2rem;
}

.demo-header p {
  margin: 0;
  opacity: 0.9;
}

.test-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
}

.world-container {
  height: 500px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.control-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.panel-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.panel-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.control-group {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: #555;
}

.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.control-group button {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.control-group button:hover:not(:disabled) {
  background: #0056b3;
}

.control-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-grid {
  display: grid;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-item .label {
  font-weight: 500;
  color: #555;
}

.status {
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.status.idle { background: #e9ecef; color: #495057; }
.status.preparing { background: #fff3cd; color: #856404; }
.status.rotating { background: #f8d7da; color: #721c24; }
.status.animating { background: #d1ecf1; color: #0c5460; }
.status.scrambling { background: #d4edda; color: #155724; }
.status.solved { background: #d4edda; color: #155724; }
.status.enabled { background: #d4edda; color: #155724; }
.status.disabled { background: #f8d7da; color: #721c24; }
.status.initialized { background: #d4edda; color: #155724; }
.status.uninitialized { background: #f8d7da; color: #721c24; }
.status.scrambling { background: #fff3cd; color: #856404; }


.log-container {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: #f8f9fa;
  margin-bottom: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;
  border-bottom: 1px solid #eee;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info { color: #007bff; }
.log-item.success { color: #28a745; }
.log-item.warning { color: #ffc107; }
.log-item.error { color: #dc3545; }

.log-time {
  font-weight: 600;
  min-width: 70px;
}

.clear-logs {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 11px;
}

.scramble-info {
  margin-top: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.scramble-info label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
  font-size: 12px;
}

.info-text {
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
}


/* 响应式设计 */
@media (max-width: 1000px) {
  .test-container {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    max-height: none;
  }
}

@media (max-width: 480px) {
  .controls-demo {
    padding: 10px;
  }
  
  .demo-header h2 {
    font-size: 1.5rem;
  }
  
  .world-container {
    height: 400px;
  }
}
</style>
