# ox-mf

一个基于 Three.js 和 Vue 3 的现代化3D魔方动画项目，提供丰富的交互体验和视觉效果。

## ✨ 项目特性

- 🎯 **多阶魔方支持** - 支持2阶、3阶、4阶魔方
- 🎨 **主题系统** - 经典、炫酷蓝、闪亮橙、森林绿等多种主题
- ⚡ **高性能动画引擎** - 基于时间线的动画管理系统
- 🎮 **交互式控制** - 拖拽旋转、触摸支持、键盘控制
- 🎭 **粒子系统效果** - 炫酷的粒子动画和光效
- 🔄 **魔方操作** - 打乱、重置、求解等核心功能
- 📱 **响应式设计** - 支持各种设备和屏幕尺寸
- 🎨 **现代化UI** - 基于Element Plus的优雅界面

## 🚀 快速开始

### 环境要求
- Node.js 16+
- pnpm 或 npm

### 安装依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 启动开发服务器
```bash
pnpm dev
# 或
npm run dev
```

### 构建生产版本
```bash
pnpm build
# 或
npm run build
```

### 预览构建结果
```bash
pnpm preview
# 或
npm run preview
```

## 🏗️ 项目架构

### 技术栈
- **前端框架**: Vue 3 + Composition API
- **3D 渲染**: Three.js 0.178+
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **构建工具**: Vite 7
- **包管理**: pnpm
- **魔方算法**: cubejs + rubik-cube-solver

### 魔方操作
- **旋转控制**: 支持拖拽、触摸、键盘操作
- **打乱功能**: 随机打乱魔方状态
- **重置功能**: 一键恢复魔方到初始状态
- **求解功能**: 集成魔方求解算法

### 动画系统
- **时间线管理**: 精确控制动画时序
- **缓动函数**: 丰富的缓动效果库
- **粒子效果**: 炫酷的粒子动画
- **过渡动画**: 平滑的页面切换效果

## 📁 项目结构

```
src/
├── animations/          # 动画引擎和时间线管理
│   ├── animationEngine.js
│   └── timelineAnimations.js
├── components/          # Vue 组件
│   ├── Begin.vue       # 启动页面
│   ├── Cube.vue        # 主魔方组件
│   ├── CubeSelection.vue # 魔方选择
│   ├── RotationMenu.vue # 旋转控制菜单
│   └── World.vue       # 3D世界容器
├── composable/          # 组合式函数
│   ├── Easing.js       # 缓动函数库
│   ├── useAnimation.js # 动画控制
│   ├── useControls.js  # 交互控制
│   ├── useDraggable.js # 拖拽功能
│   ├── useEventListeners.js # 事件监听
│   ├── useRotationQueue.js # 旋转队列
│   ├── useScramble.js  # 魔方打乱
│   ├── useTimeline.js  # 时间线管理
│   └── useTween.js     # 补间动画
├── config/              # 配置文件
│   └── themes.js       # 主题配置
├── geometry/            # 几何体相关
│   └── Geometry.js
├── models/              # 魔方模型
│   ├── CubeFactory.js  # 魔方工厂
│   ├── CubeInterface.js # 魔方接口
│   ├── cube2.js        # 2阶魔方
│   ├── cube3.js        # 3阶魔方
│   └── cube4.js        # 4阶魔方
├── shaders/             # 着色器
│   └── particleShaders.js
├── stores/              # 状态管理
│   ├── animation.js    # 动画状态
│   ├── cube.js         # 魔方状态
│   └── index.js        # 状态入口
├── test/                # 测试组件
├── App.vue             # 主应用组件
├── main.js             # 应用入口
└── style.css           # 全局样式
```
## 🌐 部署

项目已配置 GitHub Pages 部署，访问地址：https://oo0o-x-o0oo.cn

⭐ 如果这个项目对你喜欢，请给它一个星标！
