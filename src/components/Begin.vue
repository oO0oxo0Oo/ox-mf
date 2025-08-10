<template>
    <!-- 主容器 - 包含所有粒子效果和UI元素 -->
    <div ref="container" class="particle-container">
      <!-- 背景光晕效果 -->
      <div class="glow"></div>
      <!-- 模式名称显示 -->
      <div id="patternName" :style="{ opacity: patternNameOpacity }">{{ currentPatternName }}</div>
      <!-- 操作提示 -->
      <div id="instructions" @click="triggerParticleFlyAway">Hover to interact</div>
      
      <!-- 添加间隙控制器 -->
      <div class="gap-controller">
        <label>间隙大小: {{ gapSizeMultiplier.toFixed(1) }}</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.1" 
          :value="gapSizeMultiplier"
          @input="updateGapSize(parseFloat($event.target.value))"
        />
        <button @click="updateGapSize(4.0)">重置</button>
      </div>

      <!-- 添加大正方体边长控制器 -->
      <div class="gap-controller" style="top: 80px;">
        <label>正方体边长: {{ cubeSizeMultiplier.toFixed(1) }}</label>
        <input 
          type="range" 
          min="20" 
          max="300" 
          step="1" 
          :value="cubeSizeMultiplier"
          @input="updateCubeSize(parseFloat($event.target.value))"
        />
        <button @click="updateCubeSize(60.0)">重置</button>
      </div>

      <!-- 添加透明度控制器 -->
      <div class="gap-controller" style="top: 140px;">
        <label>透明度: {{ opacityMultiplier.toFixed(2) }}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          :value="opacityMultiplier"
          @input="updateOpacity(parseFloat($event.target.value))"
        />
        <button @click="updateOpacity(0.9)">重置</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  
  // Three.js 核心库导入
  import * as THREE from 'three'
  
  // Three.js 后处理效果导入
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
  import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
  
  // 导入统一的动画系统
  import { useAnimation } from '../composable/useAnimation.js'
  
  // ===== Vue 响应式数据 =====
  const container = ref(null)                    // DOM容器引用
  const currentPatternName = ref('Stardust Grid') // 当前模式名称
  const patternNameOpacity = ref(0)              // 模式名称透明度
  
  // ===== Three.js 核心变量 =====
  let scene, camera, renderer, particles  // 场景、相机、渲染器、粒子系统（移除stars）
  let composer                                   // 后处理效果组合器
  let time = 0                                   // 动画时间计数器
  let currentPattern = 0                         // 当前模式索引
  
  // ===== 鼠标交互变量 =====
  const screenMouse = new THREE.Vector2(10000, 10000)  // 屏幕鼠标坐标（初始值远离屏幕）
  const worldMouse = new THREE.Vector3()               // 3D世界鼠标坐标
  const lastWorldMouse = new THREE.Vector3()           // 上一帧的3D鼠标坐标

  // ===== 手动旋转控制变量 =====
  let isMouseDown = false                              // 鼠标是否按下
  let mouseDownPosition = new THREE.Vector2()          // 鼠标按下时的位置
  let currentRotationX = 0                             // 当前X轴旋转角度
  let currentRotationY = 0                             // 当前Y轴旋转角度
  let targetRotationX = 0                              // 目标X轴旋转角度
  let targetRotationY = 0                              // 目标Y轴旋转角度
  const rotationSpeed = 0.1                            // 旋转速度
  const baseRadius = 100                               // 相机基础距离
  
  // ===== 初始旋转角度设置 =====
  const initialRotationX = Math.PI / 4                 // 初始X轴旋转角度（45度）
  const initialRotationY = Math.PI / 6                 // 初始Y轴旋转角度（30度）
  
  // ===== 核心参数配置 =====
  const particleCount = 25000      // 主粒子数量 - 影响性能和视觉效果
  const starCount = 6000           // 背景星空数量 - 影响背景密度
  const patternNames = ["Stardust Grid"]  // 模式名称数组（当前只有一个模式）
  
  let gapSizeMultiplier = 4.0  // 间隙倍数
  let cubeSizeMultiplier = 60.0  // 大正方体边长倍数
  let opacityMultiplier = 0.9  // 粒子透明度倍数

  // 在变量声明部分添加
  // 修改createGrid函数，让间隙独立于立方体边长
  function createGrid(i, count) {
    // 计算立方体的边长（向上取整确保能容纳所有粒子）
    const sideLength = Math.ceil(Math.cbrt(count))  // 25000 -> 29
    
    // 计算网格间距（总网格大小使用动态值）
    const spacing = cubeSizeMultiplier / sideLength
    
    // 计算网格中心偏移量，使网格中心对齐到原点
    const halfGrid = (sideLength - 1) * spacing / 2
    
    // 将粒子索引转换为3D网格坐标
    const iz = Math.floor(i / (sideLength * sideLength))  // Z层索引（最外层）
    const iy = Math.floor((i % (sideLength * sideLength)) / sideLength)  // Y行索引（中间层）
    const ix = i % sideLength  // X列索引（最内层）
    
    // 魔方效果：将29x29x29的网格分成27个小块
    const cubeSize = Math.ceil(sideLength / 3)  // 每个小块的边长 = 10 (29/3向上取整)
    const gapSize = gapSizeMultiplier  // 使用固定的间隙大小，不受spacing影响
    
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
  
  // 形态函数数组 - 当前只包含立方网格分布函数
  const patterns = [createGrid]
  
  // ===== 颜色调色板配置 =====
  // 立方网格配色方案 - 蓝色系渐变
  // 包含4种不同深浅的蓝色，用于粒子的颜色变化
  const colorPalettes = [
    [
      new THREE.Color(0x0077ff),  // 深蓝色
      new THREE.Color(0x00aaff),  // 中蓝色
      new THREE.Color(0x44ccff),  // 浅蓝色
      new THREE.Color(0x0055cc)   // 深蓝紫色
    ]
  ]
  
  // ===== 主粒子系统 =====
  /**
   * 创建主粒子系统 - 生成主要的粒子效果
   * 功能：
   * 1. 根据立方网格分布函数生成粒子位置
   * 2. 为每个粒子分配颜色、大小和类型
   * 3. 使用着色器实现粒子的动画和交互效果
   * 
   * @returns {THREE.Points} 粒子对象
   */
  function createParticleSystem() {
    // 创建几何体
    const geometry = new THREE.BufferGeometry()
    
    // 创建数据数组
    const positions = new Float32Array(particleCount * 3)  // 位置数据 (x, y, z)
    const colors = new Float32Array(particleCount * 3)     // 颜色数据 (r, g, b)
    const sizes = new Float32Array(particleCount)          // 大小数据
    const indices = new Float32Array(particleCount)        // 索引数据（用于动画）
    const particleTypes = new Float32Array(particleCount)  // 粒子类型（用于不同渲染效果）
    
    // 获取初始模式和颜色调色板
    const initialPattern = patterns[0]      // 立方网格分布函数
    const initialPalette = colorPalettes[0] // 蓝色系颜色调色板
  
    // 为每个粒子生成数据
    for (let i = 0; i < particleCount; i++) {
      indices[i] = i  // 粒子索引（用于动画计算）
      particleTypes[i] = Math.floor(Math.random() * 3)  // 随机分配粒子类型（0, 1, 2）
      
      // 根据分布函数计算粒子位置
      const pos = initialPattern(i, particleCount)
      positions[i * 3] = pos.x     // X坐标
      positions[i * 3 + 1] = pos.y // Y坐标
      positions[i * 3 + 2] = pos.z // Z坐标
  
      // 为粒子分配颜色（从调色板中随机选择并添加变化）
      const colorIndex = Math.floor(Math.random() * initialPalette.length)
      const baseColor = initialPalette[colorIndex]
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
  
    // 创建粒子着色器材质
    const material = new THREE.ShaderMaterial({
      // 着色器统一变量
      uniforms: {
        time: { value: 0 },                                    // 时间变量（用于动画）
        mousePos: { value: new THREE.Vector3(10000, 10000, 0) }, // 鼠标位置（初始值远离屏幕）
        opacity: { value: opacityMultiplier }                  // 添加透明度统一变量
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
  
  // ===== 场景初始化 =====
  /**
   * 初始化Three.js场景 - 设置场景、相机、渲染器和后处理效果
   * 功能：
   * 1. 创建Three.js核心对象（场景、相机、渲染器）
   * 2. 配置渲染器和相机参数
   * 3. 设置后处理效果（泛光等）
   * 4. 创建并添加粒子系统
   */
  function init() {
    // 创建场景
    scene = new THREE.Scene()
    
    // 创建透视相机
    // 参数：视野角度(75°), 宽高比, 近裁剪面(0.1), 远裁剪面(1000)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    
    // 设置初始旋转角度
    currentRotationX = initialRotationX
    currentRotationY = initialRotationY
    targetRotationX = initialRotationX
    targetRotationY = initialRotationY
    
    // 根据初始角度设置相机位置
    camera.position.x = Math.sin(currentRotationX) * Math.cos(currentRotationY) * baseRadius
    camera.position.y = Math.sin(currentRotationY) * baseRadius
    camera.position.z = Math.cos(currentRotationX) * Math.cos(currentRotationY) * baseRadius
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
    
    // ===== 后处理效果配置 =====
    // 创建泛光效果（模拟真实的光晕和发光效果）
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),  // 渲染尺寸
      0.25,  // 泛光强度 - 控制整体亮度，值越大越亮
      0.3,   // 泛光半径 - 控制光晕扩散范围
      0.65   // 泛光阈值 - 控制哪些像素产生泛光，值越大泛光越少
    )
    composer.addPass(bloomPass)
    
    // 添加输出通道（处理最终的颜色空间转换）
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
    
    // 创建粒子系统（移除星空背景）
    particles = createParticleSystem()
    scene.add(particles)
    
    // 设置初始模式名称
    updatePatternName(patternNames[0], true)
  }
  
  // ===== 窗口响应式处理 =====
  /**
   * 窗口大小调整处理 - 更新相机和渲染器尺寸
   */
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
  }
  
  // ===== 交互事件处理 =====
  /**
   * 更新屏幕鼠标坐标 - 将屏幕坐标转换为标准化坐标
   * @param {number} clientX - 鼠标X坐标
   * @param {number} clientY - 鼠标Y坐标
   */
  function updateScreenMouse(clientX, clientY) {
    screenMouse.x = (clientX / window.innerWidth) * 2 - 1
    screenMouse.y = -(clientY / window.innerHeight) * 2 + 1
  }
  
  function onMouseMove(event) {
    updateScreenMouse(event.clientX, event.clientY)
    
    // 如果鼠标按下，处理旋转
    if (isMouseDown) {
      const deltaX = event.clientX - mouseDownPosition.x
      const deltaY = event.clientY - mouseDownPosition.y
      
      // 修正旋转方向：反转deltaX，保持deltaY的符号
      targetRotationX -= deltaX * 0.01  // 水平旋转（反转方向）
      targetRotationY += deltaY * 0.01  // 垂直旋转（保持原方向）
      
      // 限制垂直旋转范围，防止相机翻转
      targetRotationY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationY))
      
      // 更新鼠标按下位置
      mouseDownPosition.set(event.clientX, event.clientY)
    }
  }
  
  function onMouseDown(event) {
    // 只响应左键
    if (event.button === 0) {
      isMouseDown = true
      mouseDownPosition.set(event.clientX, event.clientY)
    }
  }
  
  function onMouseUp(event) {
    // 只响应左键
    if (event.button === 0) {
      isMouseDown = false
    }
  }
  
  function onTouchMove(event) {
    event.preventDefault()
    if (event.touches.length > 0) {
      updateScreenMouse(event.touches[0].clientX, event.touches[0].clientY)
    }
  }
  
  function onTouchStart(event) {
    event.preventDefault()
    if (event.touches.length > 0) {
      isMouseDown = true
      mouseDownPosition.set(event.touches[0].clientX, event.touches[0].clientY)
    }
  }
  
  function onTouchEnd(event) {
    event.preventDefault()
    isMouseDown = false
  }
  
  // ===== 模式切换系统 =====
  /**
   *  触发粒子形态变换
   */
  function forcePatternChange() {
    // 只有一个模式，不需要切换
    return
  }
  
  function updatePatternName(name, instant = false) {
    currentPatternName.value = name
    if (instant) {
      patternNameOpacity.value = 1
    } else {
      patternNameOpacity.value = 1
      setTimeout(() => {
        patternNameOpacity.value = 0
      }, 2500)
    }
  }

  function triggerParticleFlyAway() {
    console.log("triggerParticleFlyAway")
  }
  
  // ===== 动画循环系统 =====
  /**
   * 动画更新函数 - 处理所有动态效果和交互
   * 功能：
   * 1. 更新时间和动画参数
   * 2. 更新粒子的着色器统一变量
   * 3. 处理鼠标交互（将2D鼠标坐标转换为3D坐标）
   * 4. 更新相机位置（手动旋转）
   * 5. 渲染场景
   */
  function animateUpdate(delta) {
    // 使用精确的delta时间（delta已经是毫秒）
    time += delta * 0.001
    
    // 更新粒子系统
    if (particles && particles.material) {
      particles.material.uniforms.time.value = time  // 传递时间给粒子着色器
      
      // 鼠标交互处理
      camera.updateMatrixWorld()  // 更新相机矩阵（确保射线投射正确）
      const raycaster = new THREE.Raycaster()  // 创建射线投射器
      raycaster.setFromCamera(screenMouse, camera)  // 从相机发射射线到鼠标位置
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)  // 创建Z=0平面
      raycaster.ray.intersectPlane(plane, worldMouse)               // 计算射线与平面的交点（鼠标在3D空间中的位置）
      particles.material.uniforms.mousePos.value.copy(worldMouse)   // 传递鼠标位置给粒子着色器
      
      // 只有一个模式，不需要过渡动画处理
    }
    
    // ===== 手动旋转相机控制 =====
    // 平滑插值到目标旋转角度
    currentRotationX += (targetRotationX - currentRotationX) * rotationSpeed
    currentRotationY += (targetRotationY - currentRotationY) * rotationSpeed
    
    // 计算相机位置（球面坐标转换为笛卡尔坐标）
    camera.position.x = Math.sin(currentRotationX) * Math.cos(currentRotationY) * baseRadius
    camera.position.y = Math.sin(currentRotationY) * baseRadius
    camera.position.z = Math.cos(currentRotationX) * Math.cos(currentRotationY) * baseRadius
    camera.lookAt(0, 0, 0)  // 相机始终看向原点
  
    // 渲染场景（使用后处理效果）
    composer.render()
  }
  
  // 使用统一的动画系统
  const { start: startAnim, stop: stopAnim } = useAnimation(animateUpdate)
  
  // 事件监听器
  
  // 生命周期钩子
  onMounted(async () => {
    await nextTick()
    init()
    
    // 添加事件监听器
    window.addEventListener('resize', onWindowResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
         // 移除 window.addEventListener('keydown', onKeyDown)
     window.addEventListener('touchstart', onTouchStart, { passive: false })
     window.addEventListener('touchmove', onTouchMove, { passive: false })
     window.addEventListener('touchend', onTouchEnd, { passive: false })
     
     // 开始动画
     startAnim()
  })
  
  onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('resize', onWindowResize)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseUp)
    // 移除 window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    
         // 停止动画
     stopAnim()
     
     // 清理Three.js资源
     if (renderer) {
       renderer.dispose()
     }
     if (container.value && renderer) {
       container.value.removeChild(renderer.domElement)
     }
  })

  // 添加更新函数
  function updateGapSize(newValue) {
    gapSizeMultiplier = newValue
    // 重新创建粒子系统
    if (particles) {
      scene.remove(particles)
      particles.geometry.dispose()
      particles.material.dispose()
    }
    particles = createParticleSystem()
    scene.add(particles)
  }

  // 添加大正方体边长更新函数
  function updateCubeSize(newValue) {
    cubeSizeMultiplier = newValue
    // 重新创建粒子系统
    if (particles) {
      scene.remove(particles)
      particles.geometry.dispose()
      particles.material.dispose()
    }
    particles = createParticleSystem()
    scene.add(particles)
  }

  // 添加透明度更新函数
  function updateOpacity(newValue) {
    opacityMultiplier = newValue
    // 更新材质中的透明度统一变量
    if (particles && particles.material) {
      particles.material.uniforms.opacity.value = newValue
    }
  }

  // 移除onKeyDown函数
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
  
  /* 模式名称显示样式 */
  #patternName {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-family: sans-serif;
    font-size: 16px;
    pointer-events: auto;
    z-index: 100;
    transition: opacity 0.5s ease;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.4);
    padding: 8px 18px;
    border-radius: 25px;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
  
  /* 操作提示样式 */
  #instructions {
    position: fixed;
    bottom: 15px;
    left: 15px;
    color: rgba(255, 255, 255, 0.7);
    font-family: sans-serif;
    font-size: 12px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 5px 10px;
    border-radius: 3px;
    z-index: 100;
    pointer-events: auto;
    line-height: 1.4;
  }

  /* 间隙控制器样式 */
  .gap-controller {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.4);
    padding: 10px;
    border-radius: 8px;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gap-controller label {
    color: white;
    font-size: 14px;
    font-family: sans-serif;
  }

  .gap-controller input[type="range"] {
    /* -webkit-appearance: none; */
    width: 100px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    outline: none;
    opacity: 0.7;
  }

  .gap-controller input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: white;
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  .gap-controller button {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-family: sans-serif;
    transition: background-color 0.3s ease;
  }

  .gap-controller button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  </style> 