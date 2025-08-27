<template>
  <!-- 主容器 - 包含所有粒子效果和UI元素 -->
  <div ref="container" class="particle-container">
    <!-- 背景光晕效果 -->
    <div class="glow"></div>
    
    <!-- 动画控制按钮 -->
    <div class="animation-controls">
            <button 
        v-show="!isFirstPhaseComplete && !isButtonClicked" 
        @click="startAnimation" 
        class="start-btn"
      >
        𝑮 𝑶
        <!-- 开始 -->
      </button>
      
      <!-- 第一阶段完成后显示魔方选择组件 -->
      <CubeSelection 
        v-if="isFirstPhaseComplete" 
        @selection-confirmed="onSelectionConfirmed"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import CubeSelection from './CubeSelection.vue'

// Three.js 核心库导入
import * as THREE from 'three'

// Three.js 后处理效果导入
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

// 导入粒子着色器
import { particleShaderConfig } from '../shaders/particleShaders.js'

// 导入统一的动画系统
import { useAnimation } from '../composable/useAnimation.js'
import { useTimeline } from '../composable/useTimeline.js'
import { TimelineAnimationManager } from '../animations/timelineAnimations.js'
import { useAnimationStore } from '../stores/animation.js'
import { useCubeStore } from '../stores/cube.js'
import { useWindowEvents } from '../composable/useEventListeners.js'
import { useDraggable } from '../composable/useDraggable.js'

// 定义组件事件
const emit = defineEmits(['animation-complete', 'navigate-to-cube'])

// ===== Vue 响应式数据 =====
const container = ref(null)// DOM容器引用
const isFirstPhaseComplete = ref(false) // 第一阶段是否完成
const selectedCubeConfig = ref(null) // 保存用户选择的魔方配置
const isButtonClicked = ref(false) // 控制按钮点击后的透明度

// ===== 时间线动画系统 =====
const timeline = useTimeline()
const animationStore = useAnimationStore()
const cubeStore = useCubeStore()

// ===== 窗口事件管理 =====
const { addWindowListener, cleanup: cleanupWindowEvents } = useWindowEvents()

// ===== 拖拽系统 =====
let dragSystem = null

// 初始化拖拽系统（延迟到 DOM 准备好后）
function initDragSystem() {
  if (container.value && !dragSystem) {
    dragSystem = useDraggable(container, {
      calcDelta: true,
      onDragStart: (pos) => {
        // 拖拽开始时可以添加视觉反馈
      },
      onDragMove: (pos) => {
        // 处理相机旋转
        if (pos.delta) {
          // 修正旋转方向：反转deltaX，保持deltaY的符号
          targetRotationX.value -= pos.delta.x * 0.01  // 水平旋转（反转方向）
          targetRotationY.value += pos.delta.y * 0.01  // 垂直旋转（保持原方向）
          
          // 恢复垂直角度限制，防止相机翻转
          targetRotationY.value = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationY.value))
        }
        
        // 更新鼠标位置用于粒子交互
        updateScreenMouse(pos.current.x, pos.current.y)
      },
      onDragEnd: (pos) => {
        // 拖拽结束时可以添加动画效果
      }
    })
    
    // 启用拖拽系统
    if (dragSystem && dragSystem.enable) {
      dragSystem.enable()
    }
  }
}

// ===== 本地状态变量（保留原有定义） =====
const gapSizeMultiplier = ref(0.0)  // 间隙倍数，从0开始
const cubeSizeMultiplier = ref(60.0)  // 大正方体边长倍数
const opacityMultiplier = ref(0.9)  // 粒子透明度倍数

// 移动端透明度优化 - 让手机端更亮
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  opacityMultiplier.value = 1.2  // 移动端提高透明度 (从0.9到1.0)
  cubeSizeMultiplier.value = 55.0  // 移动端立方体更小
}

// ===== Three.js 核心变量 =====
let scene, camera, renderer, particles         // Three.js 核心对象
let composer                                   // 后处理效果组合器
let time = 0                                   // 动画时间计数器

// ===== 常量定义（必须先声明） =====
const initialRotationX = Math.PI / 4                 // 初始角度（45度）
const initialRotationY = Math.PI / 6                 // 初始角度（30度）
const rotationSpeed = 0.1                            // 旋转速度
const baseRadius = 100                               // 相机距离
const particleCount = 25000                          // 粒子数量

// ===== 响应式事件状态 =====
const currentRotationX = ref(initialRotationX)              // 当前旋转角度
const currentRotationY = ref(initialRotationY)               
const targetRotationX = ref(initialRotationX)               // 目标旋转角度
const targetRotationY = ref(initialRotationY)

// ===== 鼠标交互变量 =====
const screenMouse = ref(new THREE.Vector2(10000, 10000))  // 屏幕鼠标坐标
const worldMouse = ref(new THREE.Vector3())               // 3D世界鼠标坐标



//  生成立方体网格位置 - 将粒子排列成魔方的形状
function createGrid(i, count) {
  // 计算立方体的边长（向上取整确保能容纳所有粒子）
  const sideLength = Math.ceil(Math.cbrt(count))  // 25000 -> 29
  
  // 计算网格间距（总网格大小使用动态值）
  const spacing = cubeSizeMultiplier.value / sideLength
  
  // 计算网格中心偏移量，使网格中心对齐到原点
  const halfGrid = (sideLength - 1) * spacing / 2
  
  // 将粒子索引转换为3D网格坐标
  const iz = Math.floor(i / (sideLength * sideLength))  // Z层索引（最外层）
  const iy = Math.floor((i % (sideLength * sideLength)) / sideLength)  // Y行索引（中间层）
  const ix = i % sideLength  // X列索引（最内层）
  
  // 魔方效果：将29x29x29的网格分成27个小块
  const cubeSize = Math.ceil(sideLength / 3)  // 每个小块的边长 = 10 (29/3向上取整)
  const gapSize = Math.max(0, gapSizeMultiplier.value)  // 使用固定的间隙大小，不受spacing影响，确保不小于0
  
  // 计算当前粒子属于哪个小块 (0-26)
  const cubeZ = Math.floor(iz / cubeSize)  // 小块在Z方向的位置 (0,1,2)
  const cubeY = Math.floor(iy / cubeSize)  // 小块在Y方向的位置 (0,1,2)
  const cubeX = Math.floor(ix / cubeSize)  // 小块在X方向的位置 (0,1,2)
  
  // 计算粒子在小块内的相对位置
  const localZ = iz % cubeSize  // 粒子在小块内的Z位置
  const localY = iy % cubeSize  // 粒子在小块内的Y位置
  const localX = ix % cubeSize  // 粒子在小块内的X位置
  
  // 计算小块的中心位置（让整个魔方以原点为中心）
  const cubeCenterX = (cubeX - 1) * (cubeSize * spacing + gapSize)
  const cubeCenterY = (cubeY - 1) * (cubeSize * spacing + gapSize)
  const cubeCenterZ = (cubeZ - 1) * (cubeSize * spacing + gapSize)
  
  // 计算粒子在小块内的相对位置（相对于小块中心）
  const localOffsetX = (localX - (cubeSize - 1) / 2) * spacing
  const localOffsetY = (localY - (cubeSize - 1) / 2) * spacing
  const localOffsetZ = (localZ - (cubeSize - 1) / 2) * spacing
  
  // 最终位置 = 小块中心位置 + 粒子在小块内的相对位置
  const finalX = cubeCenterX + localOffsetX
  const finalY = cubeCenterY + localOffsetY
  const finalZ = cubeCenterZ + localOffsetZ
  
  return new THREE.Vector3(finalX, finalY, finalZ)
}

// 蓝色系颜色调色板 - 用于粒子颜色变化
const colorPalette = [
  new THREE.Color(0x0077ff),  // 深蓝色
  new THREE.Color(0x00aaff),  // 中蓝色
  new THREE.Color(0x44ccff),  // 浅蓝色
  new THREE.Color(0x0055cc)   // 深蓝紫色
]

// ===== 粒子系统创建 =====
function createParticleSystem() {
  // 创建几何体
  const geometry = new THREE.BufferGeometry()
  
  // 创建数据数组
  const positions = new Float32Array(particleCount * 3)  // 位置数据 (x, y, z)
  const colors = new Float32Array(particleCount * 3)     // 颜色数据 (r, g, b)
  const sizes = new Float32Array(particleCount)          // 大小数据
  const indices = new Float32Array(particleCount)        // 索引数据（用于动画）
  const particleTypes = new Float32Array(particleCount)  // 粒子类型（用于不同渲染效果）
  
  // 为每个粒子生成数据
  for (let i = 0; i < particleCount; i++) {
    indices[i] = i  // 粒子索引（用于动画计算）
    particleTypes[i] = Math.floor(Math.random() * 3)  // 随机分配粒子类型（0, 1, 2）
    
    // 根据网格分布函数计算粒子位置
    const pos = createGrid(i, particleCount)
    positions[i * 3] = pos.x     // X坐标
    positions[i * 3 + 1] = pos.y // Y坐标
    positions[i * 3 + 2] = pos.z // Z坐标

    // 为粒子分配颜色（从调色板中随机选择并添加变化）
    const colorIndex = Math.floor(Math.random() * colorPalette.length)
    const baseColor = colorPalette[colorIndex]
    const variation = 0.85 + Math.random() * 0.3  // 颜色变化范围 [0.85, 1.15]
    const finalColor = baseColor.clone().multiplyScalar(variation)
    
    // 存储颜色数据
    colors[i * 3] = finalColor.r
    colors[i * 3 + 1] = finalColor.g
    colors[i * 3 + 2] = finalColor.b
    
    // 为粒子分配大小（随机大小范围 [1.0, 2.5]）
    sizes[i] = 1.0 + Math.random() * 1.5
  }

  // 将数据绑定到几何体属性
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))    // 位置属性
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))         // 颜色属性
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))           // 大小属性
  geometry.setAttribute('index', new THREE.BufferAttribute(indices, 1))        // 索引属性
  geometry.setAttribute('particleType', new THREE.BufferAttribute(particleTypes, 1))  // 类型属性
  geometry.userData.currentColors = new Float32Array(colors)  // 存储当前颜色数据（用于后续更新）
  
  // 计算几何体的边界框，用于动态平面检测
  geometry.computeBoundingBox()

  // 创建粒子着色器材质
  const material = new THREE.ShaderMaterial({
    // 着色器统一变量
    uniforms: {
      time: { value: 0 },                                    // 时间变量（用于动画）
      mousePos: { value: new THREE.Vector3(10000, 10000, 0) }, // 鼠标位置（初始值远离屏幕）
      opacity: { value: opacityMultiplier.value }                  // 添加透明度统一变量
    },
    // 使用导入的着色器代码
    vertexShader: particleShaderConfig.vertexShader,
    fragmentShader: particleShaderConfig.fragmentShader,
    // 材质属性设置
    transparent: true,                    // 启用透明度
    depthWrite: false,                    // 禁用深度写入（避免透明物体排序问题）
    blending: THREE.AdditiveBlending,     // 使用加法混合模式（增强光效）
    vertexColors: true                    // 启用顶点颜色
  })

  return new THREE.Points(geometry, material)
}

// ===== Three.js 初始化 =====
function init() {
  // 创建场景
  scene = new THREE.Scene()
  // 创建透视相机
  // 参数：视野角度(75°), 宽高比, 近裁剪面(0.1), 远裁剪面(1000)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  
  // 设置初始旋转角度
  currentRotationX.value = initialRotationX
  currentRotationY.value = initialRotationY
  targetRotationX.value = initialRotationX
  targetRotationY.value = initialRotationY
  
  // 根据初始角度设置相机位置
  camera.position.x = Math.sin(currentRotationX.value) * Math.cos(currentRotationY.value) * baseRadius
  camera.position.y = Math.sin(currentRotationY.value) * baseRadius
  camera.position.z = Math.cos(currentRotationX.value) * Math.cos(currentRotationY.value) * baseRadius
  camera.lookAt(0, 0, 0)  // 相机始终看向原点
  
  // 创建WebGL渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,  // 启用抗锯齿
    alpha: true       // 启用透明度
  })
  renderer.setSize(window.innerWidth, window.innerHeight)  // 设置渲染尺寸
  
  // 移动端像素比优化 - 平衡清晰度和性能
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))  // 移动端限制像素比
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // 桌面端保持原有设置
  }
  
  renderer.setClearColor(0x000000, 0)  // 设置背景色（透明）
  
  // 将渲染器的canvas添加到DOM容器
  container.value.appendChild(renderer.domElement)
  
  // 创建后处理效果组合器
  composer = new EffectComposer(renderer)
  
  // 添加基础渲染通道
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)
  
  // 添加泛光效果
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.25,  // 泛光强度
    0.3,   // 泛光半径
    0.65   // 泛光阈值
  )
  
  // 移动端泛光优化 - 让手机端更亮
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    bloomPass.intensity = 0.35    // 提高移动端泛光强度 (从0.25到0.35)
    bloomPass.threshold = 0.55    // 降低移动端泛光阈值 (从0.65到0.55)
  }
  
  composer.addPass(bloomPass)
  
  // 添加输出通道（处理最终的颜色空间转换）
  const outputPass = new OutputPass()
  composer.addPass(outputPass)
  
  // 创建并添加粒子系统
  particles = createParticleSystem()
  scene.add(particles)
}

// 更新鼠标坐标
function updateScreenMouse(clientX, clientY) {
  screenMouse.value.x = -(clientX / window.innerWidth) * 2 + 1
  screenMouse.value.y = -(clientY / window.innerHeight) * 2 + 1
}

// ===== 事件处理函数 =====
const handleResize = () => {
  if (camera && renderer && composer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
  }
}

// 简化的渲染循环 - 只负责基础渲染
function renderLoop(delta) {
  time += delta * 0.001
  
  // 基础渲染更新
  if (particles && particles.material) {
    particles.material.uniforms.time.value = time
    updateMouseInteraction()
  }
  
  updateCameraRotation()
  composer.render()
}

// 鼠标交互处理 - 使用动态辅助平面，始终垂直于相机
function updateMouseInteraction() {
  camera.updateMatrixWorld()
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(screenMouse.value, camera)
  
  // 获取粒子系统中心
  const particleCenter = new THREE.Vector3()

  particles.geometry.boundingBox.getCenter(particleCenter)

  
  // 创建动态平面：始终垂直于相机视线，通过粒子中心
  const cameraDirection = new THREE.Vector3()
  camera.getWorldDirection(cameraDirection)
  const dynamicPlane = new THREE.Plane(cameraDirection, -cameraDirection.dot(particleCenter))
  
  // 射线与动态平面求交，获得准确的3D交点
  if (raycaster.ray.intersectPlane(dynamicPlane, worldMouse.value)) {
    particles.material.uniforms.mousePos.value.copy(worldMouse.value)
  }
}

// 相机旋转更新
function updateCameraRotation() {
  currentRotationX.value += (targetRotationX.value - currentRotationX.value) * rotationSpeed
  currentRotationY.value += (targetRotationY.value - currentRotationY.value) * rotationSpeed
  
  camera.position.x = Math.sin(currentRotationX.value) * Math.cos(currentRotationY.value) * baseRadius
  camera.position.y = Math.sin(currentRotationY.value) * baseRadius
  camera.position.z = Math.cos(currentRotationX.value) * Math.cos(currentRotationY.value) * baseRadius
  camera.lookAt(0, 0, 0)
}

// 简化的动画系统 - 只负责渲染循环
const { start: startRenderLoop, stop: stopRenderLoop, destroy: destroyRenderLoop } = useAnimation(renderLoop)

// ===== 事件监听器管理 =====
function addEventListeners() {
  // 使用新的 composable 添加窗口事件
  addWindowListener('resize', handleResize)
  
  // 添加鼠标移动监听器（仅用于粒子交互，不处理拖拽）
  addWindowListener('mousemove', (event) => {
    updateScreenMouse(event.clientX, event.clientY)
  })
  
  // 添加触摸事件处理
  addTouchEventListeners()
}

// 触摸事件处理
function addTouchEventListeners() {
  if (container.value) {
    let touchStartX = 0
    let touchStartY = 0
    let isTouching = false
    
    // 触摸开始
    container.value.addEventListener('touchstart', (e) => {
      // 检查触摸位置是否在按钮区域
      const touch = e.touches[0]
      const target = e.target
      
      // 如果触摸的是按钮，不阻止默认行为，让按钮可以正常点击
      if (target.closest('.start-btn') || target.closest('.animation-controls')) {
        return // 不阻止默认行为，让按钮可以点击
      }
      
      e.preventDefault()
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      isTouching = true
    }, { passive: false })
    
    // 触摸移动
    container.value.addEventListener('touchmove', (e) => {
      // 检查触摸位置是否在按钮区域
      const target = e.target
      if (target.closest('.start-btn') || target.closest('.animation-controls')) {
        return // 如果触摸的是按钮，不处理相机旋转
      }
      
      e.preventDefault()
      if (!isTouching) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      
      // 更新相机旋转
      targetRotationX.value -= deltaX * 0.01
      targetRotationY.value += deltaY * 0.01
      
      // 限制垂直角度
      targetRotationY.value = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationY.value))
      
      // 更新触摸位置用于粒子交互
      updateScreenMouse(touch.clientX, touch.clientY)
      
      touchStartX = touch.clientX
      touchStartY = touch.clientY
    }, { passive: false })
    
    // 触摸结束 - 清除粒子斥力效果
    container.value.addEventListener('touchend', (e) => {
      // 检查触摸位置是否在按钮区域
      const target = e.target
      if (target.closest('.start-btn') || target.closest('.animation-controls')) {
        return // 如果触摸的是按钮，不处理触摸结束逻辑
      }
      
      e.preventDefault()
      isTouching = false
      
      // 清除触摸位置，让粒子斥力消失
      clearTouchInteraction()
    }, { passive: false })
    
    // 触摸取消 - 也要清除斥力效果
    container.value.addEventListener('touchcancel', (e) => {
      // 检查触摸位置是否在按钮区域
      const target = e.target
      if (target.closest('.start-btn') || target.closest('.animation-controls')) {
        return // 如果触摸的是按钮，不处理触摸取消逻辑
      }
      
      e.preventDefault()
      isTouching = false
      
      // 清除触摸位置，让粒子斥力消失
      clearTouchInteraction()
    }, { passive: false })
  }
}

// 清除触摸交互效果
function clearTouchInteraction() {
  // 将触摸位置设置为远离屏幕的位置，清除斥力效果
  updateScreenMouse(10000, 10000)
  
  // 如果粒子材质存在，直接更新鼠标位置uniform
  if (particles && particles.material && particles.material.uniforms) {
    particles.material.uniforms.mousePos.value.set(10000, 10000, 0)
  }
}


function removeEventListeners() {
  // 使用新的 composable 清理所有窗口事件
  cleanupWindowEvents()
  
  // 禁用拖拽系统
  if (dragSystem) {
    dragSystem.disable()
    dragSystem = null
  }
  
  // 清理触摸事件监听器
  if (container.value) {
    container.value.removeEventListener('touchstart', null)
    container.value.removeEventListener('touchmove', null)
    container.value.removeEventListener('touchend', null)
    container.value.removeEventListener('touchcancel', null)
  }
}

// ===== 生命周期钩子 =====

onMounted(() => {
  init()
  // 初始化动画系统
  animationStore.setTimeline(timeline)
  
  // 添加事件监听器
  addEventListeners()
  
  // 开始渲染循环
  startRenderLoop()
  
  // 执行页面初始化动画
  playInitializationAnimation()

  initDragSystem()

})

onUnmounted(() => {
  ('Begin组件开始销毁和清理资源...')
  
  // 清理事件监听器
  removeEventListeners()
  
  // 停止并销毁渲染循环
  stopRenderLoop()
  destroyRenderLoop()
  
  // 清理动画管理器
  if (animationManager) {
    // 销毁动画管理器
    animationManager.destroy && animationManager.destroy()
    animationManager = null
  }
  
  // 清理粒子系统
  if (particles) {
    if (particles.geometry) {
      particles.geometry.dispose()
    }
    if (particles.material) {
      particles.material.dispose()
    }
    if (scene) {
      scene.remove(particles)
    }
    particles = null
  }
  
  // 清理Three.js资源
  if (composer) {
    composer.dispose && composer.dispose()
    composer = null
  }
  
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    renderer = null
  }
  
  if (container.value && container.value.firstChild) {
    container.value.removeChild(container.value.firstChild)
  }
  
  // 清理场景和相机
  if (scene) {
    scene.clear()
    scene = null
  }
  camera = null
})

// ===== 动画控制函数 =====
function updateParticlePositions(newGapSize) {
  if (!particles || !particles.geometry) return
  
  // 获取位置属性
  const positionAttribute = particles.geometry.getAttribute('position')
  if (!positionAttribute) return
  
  const positions = positionAttribute.array
  const sideLength = Math.ceil(Math.cbrt(particleCount))
  const spacing = cubeSizeMultiplier.value / sideLength
  const cubeSize = Math.ceil(sideLength / 3)
  
  // 更新每个粒子的位置
  for (let i = 0; i < particleCount; i++) {
    const iz = Math.floor(i / (sideLength * sideLength))
    const iy = Math.floor((i % (sideLength * sideLength)) / sideLength)
    const ix = i % sideLength
    
    // 计算当前粒子属于哪个小块
    const cubeZ = Math.floor(iz / cubeSize)
    const cubeY = Math.floor(iy / cubeSize)
    const cubeX = Math.floor(ix / cubeSize)
    
    // 计算粒子在小块内的相对位置
    const localZ = iz % cubeSize
    const localY = iy % cubeSize
    const localX = ix % cubeSize
    
    // 计算小块的中心位置
    const cubeCenterX = (cubeX - 1) * (cubeSize * spacing + newGapSize)
    const cubeCenterY = (cubeY - 1) * (cubeSize * spacing + newGapSize)
    const cubeCenterZ = (cubeZ - 1) * (cubeSize * spacing + newGapSize)
    
    // 计算粒子在小块内的相对位置
    const localOffsetX = (localX - (cubeSize - 1) / 2) * spacing
    const localOffsetY = (localY - (cubeSize - 1) / 2) * spacing
    const localOffsetZ = (localZ - (cubeSize - 1) / 2) * spacing
    
    // 最终位置
    const finalX = cubeCenterX + localOffsetX
    const finalY = cubeCenterY + localOffsetY
    const finalZ = cubeCenterZ + localOffsetZ
    
    // 更新位置数组
    positions[i * 3] = finalX
    positions[i * 3 + 1] = finalY
    positions[i * 3 + 2] = finalZ
  }
  
  // 标记位置属性需要更新
  positionAttribute.needsUpdate = true
}

// ===== 动画管理器实例（单例模式）=====
let animationManager = null

//获取或创建动画管理器实例（单例模式）
 
function getAnimationManager(cubeInstance = null) {
  if (!animationManager) {
    // 设置时间线到store
    animationStore.setTimeline(timeline)
    
    // 创建动画管理器实例
    animationManager = new TimelineAnimationManager(
      timeline, 
      scene, 
      camera, 
      particles, 
      baseRadius, 
      initialRotationX, 
      initialRotationY,
      cubeInstance, // 可选的魔方实例
      animationStore // 传入animation store
    )
    
    // 设置到store中
    animationStore.setAnimationManager(animationManager)
  }
  
  // 如果提供了新的魔方实例，更新它
  if (cubeInstance && animationManager.setCubeInstance) {
    animationManager.setCubeInstance(cubeInstance)
  }
  
  return animationManager
}

// ===== 使用watch监听动画事件 =====

// 监听动画更新事件
watch(() => animationStore.animationEvents.lastUpdate, (newUpdate, oldUpdate) => {
  if (newUpdate && newUpdate !== oldUpdate) {
    const data = newUpdate
    
    // 更新本地变量
    if (data.cubeSizeMultiplier !== undefined) {
      cubeSizeMultiplier.value = data.cubeSizeMultiplier
    }
    if (data.gapSizeMultiplier !== undefined) {
      gapSizeMultiplier.value = data.gapSizeMultiplier
    }
    
    // 同步相机旋转参数
    if (data.currentRotationX !== undefined) {
      currentRotationX.value = data.currentRotationX
      targetRotationX.value = data.currentRotationX
    }
    if (data.currentRotationY !== undefined) {
      currentRotationY.value = data.currentRotationY
      targetRotationY.value = data.currentRotationY
    }
    
    // 更新粒子位置以应用新的参数
    if (particles && particles.geometry) {
      if (data.gapSizeMultiplier !== undefined) {
        updateParticlePositions(data.gapSizeMultiplier)
      }
      if (data.cubeSizeMultiplier !== undefined) {
        updateParticlePositions(data.gapSizeMultiplier || gapSizeMultiplier.value)
      }
    }
  }
}, { deep: true })

// 监听动画完成事件
watch(() => animationStore.animationEvents.lastComplete, (newComplete, oldComplete) => {
  if (newComplete && newComplete !== oldComplete) {
    const data = newComplete
    
    // 检查是否是急速拓展动画完成
    if (data.phase === 'rapidExpansionComplete' && data.nextAction === 'waitForUserInput') {
      isFirstPhaseComplete.value = true
      // 不发送 animation-complete 事件，避免触发页面跳转
    } 
    // 检查是否是最终调整动画完成
    else if (data.phase === 'finalAdjustmentComplete' && data.nextAction === 'cubeEntrance') {
      // 最终调整完成时，如果有保存的配置就跳转到魔方页面，否则发送完成事件
      if (timeline) {
        timeline.reset()
      }
      
      if (selectedCubeConfig.value) {
        emit('navigate-to-cube', selectedCubeConfig.value)
      } else {
        emit('animation-complete')
      }
    }
    // 兼容旧版本事件（保留向后兼容性）
    else if (data.phase === 'firstPhaseComplete' && data.shouldPause) {
      isFirstPhaseComplete.value = true
    } else if (data.phase === 'userTriggeredComplete' && data.isSecondPhase) {
      if (timeline) {
        timeline.reset()
      }
      emit('animation-complete')
    } else {
      // 其他情况下的完成处理（如初始化动画等）
      console.log('其他动画完成:', data.phase)
    }
  }
}, { deep: true })

// 监听动画步骤事件
watch(() => animationStore.animationEvents.lastStep, (newStep, oldStep) => {
  if (newStep && newStep !== oldStep) {
    console.log('动画步骤:', newStep)
  }
}, { deep: true })

// 监听动画错误事件
watch(() => animationStore.animationEvents.lastError, (newError, oldError) => {
  if (newError && newError !== oldError) {
    console.error('动画错误:', newError)
  }
}, { deep: true })

//执行初始化动画 - 页面加载时的入场效果
function playInitializationAnimation() {
  const manager = getAnimationManager()
  manager.setupInitializationTimeline()
}

function startAnimation() {
  // 立即设置按钮为透明状态
  isButtonClicked.value = true
  
  const manager = getAnimationManager()
  // 使用新的急速拓展动画方法
  manager.setupRapidExpansionAnimation(() => {
    console.log('急速拓展动画完成，等待用户选择下一步操作')
  })
}

// 处理魔方选择确认
function onSelectionConfirmed(selection) {
  
  // 保存选择配置，稍后在最终调整动画完成后使用
  selectedCubeConfig.value = selection
  
  // 隐藏选择UI，开始最终调整动画
  isFirstPhaseComplete.value = false
  
  // 启动最终调整动画
  const manager = getAnimationManager()
  if (manager && manager.setupFinalAdjustmentAnimation) {
    manager.setupFinalAdjustmentAnimation(() => {
      emit('navigate-to-cube', selectedCubeConfig.value)
    })
  }
}

// 继续到最终调整动画阶段
function continueToNextPhase() {
  const manager = getAnimationManager()
  if (manager && manager.setupFinalAdjustmentAnimation) {
    isFirstPhaseComplete.value = false // 隐藏中间UI
    manager.setupFinalAdjustmentAnimation(() => {
      
    })
  } else {
    console.error('动画管理器未准备好或setupFinalAdjustmentAnimation方法不存在')
  }
}


</script>

<style scoped>
/* 主容器样式 - 全屏显示粒子效果 */
.particle-container {
  position: fixed;  /* 固定定位，覆盖整个视口 */
  width: 100%;     /* 全宽 */
  height: 100%;    /* 全高 */
  background: 
    /* 卡通质感的深蓝色渐变背景 */
    linear-gradient(135deg,
      #0a0f2e 0%,      /* 顶部深蓝紫色 */
      #1a1f4a 25%,     /* 上部中蓝色 */
      #2a2f6a 50%,     /* 中间亮蓝色 */
      #1a1f4a 75%,     /* 下部中蓝色 */
      #0a0f2e 100%     /* 底部深蓝紫色 */
    ),
    /* 卡通风格的装饰性图案 */
    radial-gradient(circle at 20% 30%, rgba(100, 150, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(150, 200, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(80, 120, 200, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 90% 20%, rgba(120, 180, 255, 0.07) 0%, transparent 50%);
  overflow: hidden;  /* 隐藏溢出内容 */
  position: relative; /* 为伪元素定位 */
}

/* 添加卡通质感的装饰性元素 */
.particle-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    linear-gradient(90deg, rgba(100, 150, 255, 0.03) 1px, transparent 1px),
    linear-gradient(0deg, rgba(100, 150, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

.particle-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(2px 2px at 10% 20%, rgba(150, 200, 255, 0.8) 50%, transparent 50%),
    radial-gradient(2px 2px at 30% 60%, rgba(100, 150, 255, 0.6) 50%, transparent 50%),
    radial-gradient(3px 3px at 70% 40%, rgba(200, 220, 255, 0.7) 50%, transparent 50%),
    radial-gradient(2px 2px at 90% 80%, rgba(120, 180, 255, 0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 50% 10%, rgba(80, 120, 200, 0.6) 50%, transparent 50%);
  animation: floatLights 15s ease-in-out infinite;
  pointer-events: none;
}

/* 背景光晕效果 - 增强卡通质感氛围 */
.glow {
  position: fixed;  /* 固定定位 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;  /* 不响应鼠标事件 */
  background: 
    radial-gradient(circle at 50% 50%,
      rgba(100, 150, 255, 0.08) 0%,   
      rgba(80, 120, 200, 0.06) 30%, 
      rgba(60, 90, 150, 0.04) 60%,     
      transparent 80%                    
    ),
    radial-gradient(ellipse at 30% 20%, rgba(150, 200, 255, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(120, 180, 255, 0.04) 0%, transparent 50%);
  mix-blend-mode: screen;  
  opacity: 0.7;  /* 增强透明度 */
  animation: glowPulse 8s ease-in-out infinite; /* 添加呼吸效果 */
}

/* 动画控制按钮样式 */
.animation-controls {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 100;
  /* width: 50%; */
}

.start-btn {
  background-color: transparent;
  color: #f6f3f396;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 23px;
  font-family: sans-serif;
  z-index: 100;
  animation: slowBlink 6s ease-in-out infinite;
}

/* 第一阶段完成后的UI样式 */
.phase-complete-ui {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.6s ease-out;
}

.completion-message {
  text-align: center;
  color: white;
}

.completion-message h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.completion-message p {
  margin: 0;
  font-size: 16px;
  opacity: 0.8;
  line-height: 1.4;
}

.continue-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-family: sans-serif;
  font-weight: 500;
  transition: all 0.3s ease;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.continue-btn:active {
  transform: translateY(0);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slowBlink {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 卡通质感背景动画 */
@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes floatLights {
  0%, 100% {
    opacity: 0.6;
    transform: translateY(0px) scale(1);
  }
  25% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.1);
  }
  50% {
    opacity: 1;
    transform: translateY(-5px) scale(1.05);
  }
  75% {
    opacity: 0.7;
    transform: translateY(-15px) scale(0.95);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}
</style> 