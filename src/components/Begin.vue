<template>
  <!-- 主容器 - 包含所有粒子效果和UI元素 -->
  <div ref="container" class="particle-container">
    <!-- 背景光晕效果 -->
    <div class="glow"></div>
    
    <!-- 动画控制按钮 -->
    <div class="animation-controls">
      <button 
        v-if="!isFirstPhaseComplete" 
        @click="startAnimation" 
        class="start-btn"
      >
        开始动画
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
import { ref, onMounted, onUnmounted } from 'vue'
import CubeSelection from './CubeSelection.vue'

// Three.js 核心库导入
import * as THREE from 'three'

// Three.js 后处理效果导入
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

// 导入统一的动画系统
import { useAnimation } from '../composable/useAnimation.js'
import { useTimeline } from '../composable/useTimeline.js'
import { TimelineAnimationManager } from '../animations/timelineAnimations.js'
import { useAnimationStore } from '../stores/animation.js'
import { useWindowEvents } from '../composable/useEventListeners.js'
import { useDraggable } from '../composable/useDraggable.js'

// 定义组件事件
const emit = defineEmits(['animation-complete', 'navigate-to-cube'])

// ===== Vue 响应式数据 =====
const container = ref(null)// DOM容器引用
const isFirstPhaseComplete = ref(false) // 第一阶段是否完成
const selectedCubeConfig = ref(null) // 保存用户选择的魔方配置

// ===== 时间线动画系统 =====
const timeline = useTimeline()
const animationStore = useAnimationStore()

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
            // 顶点着色器 - 处理粒子的位置、动画和交互
      vertexShader: `
        // 统一变量（从JavaScript传入）
        uniform float time;        // 时间变量（用于动画）
        uniform vec3 mousePos;     // 鼠标在3D空间中的位置
        
        // 属性变量（每个粒子独有的数据）
        attribute float size;       // 粒子大小
        attribute float index;      // 粒子索引（用于动画计算）
        attribute float particleType; // 粒子类型（0, 1, 2，用于不同渲染效果）
        
        // 传递给片段着色器的变量
        varying vec3 vColor;        // 粒子颜色
        varying float vDistanceToMouse; // 粒子到鼠标的距离（用于交互效果）
        varying float vType;        // 粒子类型
        varying float vIndex;       // 粒子索引
        
        // 伪随机数生成函数（用于噪声效果）
        // 输入：2D坐标，输出：0-1之间的随机数
        float rand(vec2 co) {
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
        
        void main() {
          // 传递数据到片段着色器
          vColor = color;
          vType = particleType;
          vIndex = index;
          
          // 获取粒子原始位置
          vec3 pos = position;
          
          // 时间参数（控制动画速度）
          float T = time * 0.5;
          float idx = index * 0.01;  // 粒子索引归一化
          
          // 第一层噪声动画 - 创建波浪般的运动
          float noiseFactor1 = sin(idx * 30.0 + T * 15.0) * 0.4 + 0.6;  // 噪声因子 [0.2, 1.0]
          vec3 offset1 = vec3(
            cos(T * 1.2 + idx * 5.0) * noiseFactor1,  // X轴偏移
            sin(T * 0.9 + idx * 6.0) * noiseFactor1,  // Y轴偏移
            cos(T * 1.1 + idx * 7.0) * noiseFactor1   // Z轴偏移
          ) * 0.4;  // 偏移幅度
          
          // 第二层噪声动画 - 创建更细微的抖动
          float noiseFactor2 = rand(vec2(idx, idx * 0.5)) * 0.5 + 0.5;  // 随机噪声因子
          float speedFactor = 0.3;  // 速度因子（控制动画速度）
          vec3 offset2 = vec3(
            sin(T * speedFactor * 1.3 + idx * 1.1) * noiseFactor2,  // X轴抖动
            cos(T * speedFactor * 1.7 + idx * 1.2) * noiseFactor2,  // Y轴抖动
            sin(T * speedFactor * 1.1 + idx * 1.3) * noiseFactor2   // Z轴抖动
          ) * 0.8;  // 抖动幅度
          
          // 应用动画偏移
          pos += offset1 + offset2;
          
          // 鼠标交互处理
          vec3 toMouse = mousePos - pos;  // 从粒子到鼠标的向量
          float dist = length(toMouse);   // 距离
          vDistanceToMouse = 0.0;         // 默认无交互
          float interactionRadius = 30.0; // 交互半径
          float falloffStart = 5.0;       // 开始衰减的距离
          
          // 如果鼠标在交互范围内，粒子会被排斥
          if (dist < interactionRadius) {
            float influence = smoothstep(interactionRadius, falloffStart, dist);  // 平滑的交互强度
            vec3 repelDir = normalize(pos - mousePos);  // 排斥方向（远离鼠标）
            pos += repelDir * influence * 15.0;         // 应用排斥力
            vDistanceToMouse = influence;               // 传递交互强度到片段着色器
          }
          
          // 计算最终位置和大小
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);  // 模型视图变换
          gl_Position = projectionMatrix * mvPosition;         // 投影变换
          float perspectiveFactor = 700.0 / -mvPosition.z;     // 透视因子（距离越远粒子越小）
          gl_PointSize = size * perspectiveFactor * (1.0 + vDistanceToMouse * 0.5);  // 最终大小（交互时变大）
        }
      `,
            // 片段着色器 - 处理粒子的颜色、形状和视觉效果
      fragmentShader: `
        // 统一变量
        uniform float time;          // 时间变量（用于动画）
        uniform float opacity;       // 透明度变量
        
        // 从顶点着色器传来的变量
        varying vec3 vColor;         // 粒子颜色
        varying float vDistanceToMouse; // 到鼠标的距离（交互强度）
        varying float vType;         // 粒子类型（0, 1, 2）
        varying float vIndex;        // 粒子索引
        
        // RGB转HSL颜色空间转换函数
        // 输入：RGB颜色 (0-1)，输出：HSL颜色 (色相, 饱和度, 亮度)
        vec3 rgb2hsl(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        // HSL转RGB颜色空间转换函数
        // 输入：HSL颜色，输出：RGB颜色 (0-1)
        vec3 hsl2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          // 计算当前像素在粒子内的相对位置（-1到1范围）
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);  // 到粒子中心的距离
          
          // 如果像素在粒子范围外，则丢弃（不渲染）
          if (dist > 1.0) {
            discard;
          }
          
          // 初始化透明度和基础颜色
          float alpha = 0.0;
          vec3 baseColor = vColor;
          
          // 颜色动画：在HSL空间中轻微调整色相
          vec3 hsl = rgb2hsl(baseColor);
          float hueShift = sin(time * 0.05 + vIndex * 0.001) * 0.02;  // 色相偏移
          hsl.x = fract(hsl.x + hueShift);  // 确保色相在0-1范围内
          baseColor = hsl2rgb(hsl);  // 转换回RGB
          vec3 finalColor = baseColor;
          
          // 根据粒子类型渲染不同的形状
          if (vType < 0.5) {
            // 类型0：实心粒子（带光晕）
            float core = smoothstep(0.2, 0.15, dist) * 0.9;  // 实心核心
            float glow = pow(max(0.0, 1.0 - dist), 3.0) * 0.5;  // 外发光
            alpha = core + glow;
          }
          else if (vType < 1.5) {
            // 类型1：环形粒子
            float ringWidth = 0.1;    // 环的宽度
            float ringCenter = 0.65;  // 环的中心位置
            // 使用高斯函数创建环形
            float ringShape = exp(-pow(dist - ringCenter, 2.0) / (2.0 * ringWidth * ringWidth));
            alpha = smoothstep(0.1, 0.5, ringShape) * 0.8;  // 主环
            alpha += smoothstep(0.3, 0.0, dist) * 0.1;      // 中心小点
          }
          else {
            // 类型2：脉冲粒子
            float pulse = sin(dist * 5.0 - time * 2.0 + vIndex * 0.1) * 0.1 + 0.9;  // 脉冲效果
            alpha = pow(max(0.0, 1.0 - dist), 2.5) * pulse * 0.9;  // 基础形状 + 脉冲
          }
          
          // 鼠标交互效果：靠近鼠标时粒子变亮
          finalColor = mix(finalColor, finalColor * 1.3 + 0.1, vDistanceToMouse * 1.0);
          
          // 应用全局透明度
          alpha *= opacity;  // 使用统一变量控制透明度
          alpha = clamp(alpha, 0.0, 1.0);  // 确保透明度在有效范围内
          
          // 输出最终颜色
          gl_FragColor = vec4(finalColor * alpha, alpha);
        }
      `,
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // 设置像素比（限制最大值为2）
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
}


function removeEventListeners() {
  // 使用新的 composable 清理所有窗口事件
  cleanupWindowEvents()
  
  // 禁用拖拽系统
  if (dragSystem) {
    dragSystem.disable()
    dragSystem = null
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
  console.log('Begin组件开始销毁和清理资源...')
  
  // 清理事件监听器
  removeEventListeners()
  
  // 清理动画store的事件监听器
  animationStore.off('particleUpdate', () => {})
  animationStore.off('animationComplete', () => {})
  
  // 停止并销毁渲染循环
  stopRenderLoop()
  destroyRenderLoop()
  
  // 清理动画管理器
  if (animationManager) {
    // 移除所有事件监听器
    animationManager.off && animationManager.off('animationUpdate')
    animationManager.off && animationManager.off('animationComplete')
    animationManager.off && animationManager.off('animationStep')
    
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
  
  console.log('Begin组件资源清理完成')
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
      cubeInstance // 可选的魔方实例
    )
    
    // 设置到store中
    animationStore.setAnimationManager(animationManager)
    
    // 统一设置事件监听器
    setupAnimationEventListeners()
  }
  
  // 如果提供了新的魔方实例，更新它
  if (cubeInstance && animationManager.setCubeInstance) {
    animationManager.setCubeInstance(cubeInstance)
  }
  
  return animationManager
}

function setupAnimationEventListeners() {
  // 监听动画管理器的事件
  if (animationManager) {
    // 粒子更新事件
    animationManager.on('animationUpdate', (data) => {
      // 更新本地变量
      if (data.cubeSizeMultiplier !== undefined) {
        cubeSizeMultiplier.value = data.cubeSizeMultiplier
      }
      if (data.gapSizeMultiplier !== undefined) {
        gapSizeMultiplier.value = data.gapSizeMultiplier
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
    })
    
    // 动画完成事件
    animationManager.on('animationComplete', (data) => {
      console.log('动画完成事件:', data)
      
      // 检查是否是急速拓展动画完成
      if (data.phase === 'rapidExpansionComplete' && data.nextAction === 'waitForUserInput') {
        isFirstPhaseComplete.value = true
        console.log('急速拓展动画完成，显示魔方选择UI')
        // 不发送 animation-complete 事件，避免触发页面跳转
      } 
      // 检查是否是最终调整动画完成
      else if (data.phase === 'finalAdjustmentComplete' && data.nextAction === 'cubeEntrance') {
        // 最终调整完成时，如果有保存的配置就跳转到魔方页面，否则发送完成事件
        if (timeline) {
          timeline.reset()
        }
        
        if (selectedCubeConfig.value) {
          console.log('最终调整动画完成，跳转到魔方页面')
          emit('navigate-to-cube', selectedCubeConfig.value)
        } else {
          console.log('最终调整动画完成，发送完成事件')
          emit('animation-complete')
        }
      }
      // 兼容旧版本事件（保留向后兼容性）
      else if (data.phase === 'firstPhaseComplete' && data.shouldPause) {
        isFirstPhaseComplete.value = true
        console.log('第一阶段完成，显示中间UI（兼容模式）')
      } else if (data.phase === 'userTriggeredComplete' && data.isSecondPhase) {
        if (timeline) {
          timeline.reset()
        }
        emit('animation-complete')
        console.log('第二阶段完成，发送完成事件（兼容模式）')
      } else {
        // 其他情况下的完成处理（如初始化动画等）
        console.log('其他动画完成:', data.phase)
      }
    })
    
    // 动画步骤事件
    animationManager.on('animationStep', (data) => {
      console.log('动画步骤:', data)
    })
  }
  
  // 监听store的事件（保留兼容性）
  animationStore.on('particleUpdate', (data) => {
    // 更新本地变量
    if (data.cubeSizeMultiplier !== undefined) {
      cubeSizeMultiplier.value = data.cubeSizeMultiplier
    }
    if (data.gapSizeMultiplier !== undefined) {
      gapSizeMultiplier.value = data.gapSizeMultiplier
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
  })
  
  // 监听store的动画完成事件
  animationStore.on('animationComplete', (data) => {
    console.log('Store动画完成:', data)
    
    // 只有在第二阶段完成时才通知父组件
    if (data.phase === 'userTriggeredComplete' && data.isSecondPhase) {
      emit('animation-complete')
      console.log('Store: 第二阶段完成，发送完成事件')
    } else if (data.phase === 'firstPhaseComplete') {
      console.log('Store: 第一阶段完成，不发送完成事件')
    }
  })
  
}

//执行初始化动画 - 页面加载时的入场效果
function playInitializationAnimation() {
  const manager = getAnimationManager()
  manager.setupInitializationTimeline()
}

function startAnimation() {
  const manager = getAnimationManager()
  // 使用新的急速拓展动画方法
  manager.setupRapidExpansionAnimation(() => {
    console.log('急速拓展动画完成，等待用户选择下一步操作')
  })
}

// 处理魔方选择确认
function onSelectionConfirmed(selection) {
  console.log('用户选择:', selection)
  
  // 保存选择配置，稍后在最终调整动画完成后使用
  selectedCubeConfig.value = selection
  
  // 隐藏选择UI，开始最终调整动画
  isFirstPhaseComplete.value = false
  
  // 启动最终调整动画
  const manager = getAnimationManager()
  if (manager && manager.setupFinalAdjustmentAnimation) {
    console.log('开始最终调整动画')
    manager.setupFinalAdjustmentAnimation(() => {
      console.log('最终调整动画完成，准备跳转到魔方页面')
      // 最终调整动画完成后，发送导航事件
      emit('navigate-to-cube', selectedCubeConfig.value)
    })
  } else {
    console.error('动画管理器未准备好或setupFinalAdjustmentAnimation方法不存在')
    // 如果动画系统有问题，直接跳转
    emit('navigate-to-cube', selection)
  }
}

// 继续到最终调整动画阶段
function continueToNextPhase() {
  const manager = getAnimationManager()
  if (manager && manager.setupFinalAdjustmentAnimation) {
    console.log('开始最终调整动画')
    isFirstPhaseComplete.value = false // 隐藏中间UI
    manager.setupFinalAdjustmentAnimation(() => {
      console.log('最终调整动画完成，准备魔方出场')
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
  background: linear-gradient(180deg,
      #00050a 0%,    /* 顶部深蓝色 */
      #000a14 50%,   /* 中间稍亮的蓝色 */
      #001020 100%   /* 底部更亮的蓝色 */
    );  /* 深蓝色渐变背景，营造太空氛围 */
  overflow: hidden;  /* 隐藏溢出内容 */
}

/* 背景光晕效果 - 增强整体氛围 */
.glow {
  position: fixed;  /* 固定定位 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;  /* 不响应鼠标事件 */
  background: radial-gradient(circle at 50% 50%,
      rgba(0, 100, 180, 0.02) 0%,    /* 中心蓝色光晕 */
      rgba(30, 0, 100, 0.03) 50%,    /* 中间紫色光晕 */
      transparent 75%                 /* 边缘透明 */
    );  /* 径向渐变创建光晕效果 */
  mix-blend-mode: screen;  /* 屏幕混合模式，增强光效 */
  opacity: 0.5;  /* 整体透明度 */
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
}

.start-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-family: sans-serif;
  transition: background-color 0.3s ease;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}

.start-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
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
</style> 