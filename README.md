# OX-MF - 3D魔方模拟器

一个基于Vue 3 + Three.js的3D魔方模拟器，提供完整的魔方操作体验和求解功能。

## ✨ 功能特性

- 🎯 **3D魔方渲染** - 使用Three.js实现高质量的3D魔方可视化
- 🎮 **交互式操作** - 支持鼠标拖拽、旋转等直观的魔方操作
- 🔄 **旋转动画** - 流畅的魔方旋转动画效果
- 🧩 **魔方求解** - 集成cube-solver库，提供魔方求解算法
- 🎨 **现代化UI** - 基于Vue 3 Composition API的响应式界面
- 📱 **响应式设计** - 适配不同屏幕尺寸的设备
- 🎪 **粒子效果** - 炫酷的粒子动画和特效
- 🎛️ **控制面板** - 直观的操作控制界面

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **3D引擎**: Three.js
- **状态管理**: Pinia
- **魔方求解**: cube-solver
- **样式**: CSS3 + 动画

## 📦 安装

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 pnpm (推荐)
pnpm install

# 使用 yarn
yarn install
```

## 🚀 开发

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

开发服务器将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
npm run build
# 或
pnpm build
# 或
yarn build
```

### 预览生产构建

```bash
npm run preview
# 或
pnpm preview
# 或
yarn preview
```

## 📁 项目结构

```
ox-mf/
├── src/
│   ├── components/          # Vue组件
│   │   ├── RotationMenu.vue # 旋转菜单
│   │   ├── World.vue        # 3D世界组件
│   │   └── ...
│   ├── stores/              # Pinia状态管理
│   │   ├── cube.js          # 魔方状态
│   │   ├── game.js          # 游戏状态
│   │   └── rotationQueue.js # 旋转队列
│   ├── models/              # 3D模型
│   │   ├── CubeFactory.js   # 魔方工厂
│   │   └── ...
│   ├── composable/          # 组合式函数
│   │   ├── useAnimation.js  # 动画钩子
│   │   ├── useControls.js   # 控制钩子
│   │   └── ...
│   ├── effects/             # 特效
│   │   ├── Confetti.js      # 彩带效果
│   │   └── Particals.js     # 粒子效果
│   └── test/                # 测试组件
├── public/                  # 静态资源
└── ...
```

## 🎮 使用说明

1. **基本操作**
   - 鼠标拖拽：旋转整个魔方视角
   - 点击魔方面：选择要旋转的面
   - 使用旋转菜单：执行标准魔方旋转

2. **魔方求解**
   - 打乱魔方后，系统会自动计算求解步骤
   - 点击求解按钮查看解决方案

3. **动画控制**
   - 调整动画速度
   - 启用/禁用动画效果

## 🔧 开发指南

### 添加新的魔方操作

1. 在 `src/stores/rotationQueue.js` 中添加新的旋转操作
2. 在 `src/models/CubeFactory.js` 中实现对应的3D变换
3. 在UI组件中绑定操作事件

### 自定义动画

1. 在 `src/composable/useAnimation.js` 中定义新的动画函数
2. 在 `src/animations/` 目录下添加动画逻辑
3. 使用 `useAnimation` 组合式函数应用动画

### 扩展特效

1. 在 `src/effects/` 目录下创建新的特效类
2. 继承基础特效类并实现自定义逻辑
3. 在适当的时机触发特效

---

⭐ 如果这个项目对您有帮助，请给它一个星标！
