// 粒子系统着色器代码
// 包含顶点着色器和片段着色器的完整实现

export const particleVertexShader = `
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
`

export const particleFragmentShader = `
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
`

// 导出着色器配置对象
export const particleShaderConfig = {
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    time: { value: 0 },
    mousePos: { value: null }, // 将在使用时设置
    opacity: { value: 0.9 }
  },
  attributes: {
    size: { type: 'float', itemSize: 1 },
    index: { type: 'float', itemSize: 1 },
    particleType: { type: 'float', itemSize: 1 }
  },
  materialOptions: {
    transparent: true,
    depthWrite: false,
    blending: 'AdditiveBlending',
    vertexColors: true
  }
}
