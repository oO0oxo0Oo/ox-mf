# ox-mf

一个基于 Three.js 和 Vue 3 的魔方动画项目

## 项目特性

- 🎯 3D 魔方渲染和动画
- 🎨 丰富的缓动函数库
- ⚡ 高性能动画引擎
- 🎮 交互式控制
- 🎭 粒子系统效果

## 缓动函数库整合

项目已将所有缓动函数统一整合到 `src/composable/Easing.js` 中，包含以下类别：

### 基础缓动函数
- **Power**: 幂函数缓动，支持 In/Out/InOut 和自定义幂次
- **Sine**: 正弦缓动，提供平滑的周期性变化
- **Quad/Cubic/Quart**: 二次、三次、四次缓动函数
- **Expo**: 指数缓动，适合快速变化
- **Circ**: 圆形缓动，自然的加速减速效果

### 特殊效果缓动
- **Elastic**: 弹性缓动，带有弹跳效果
- **Back**: 回退缓动，轻微回弹
- **Bounce**: 弹跳缓动，模拟物理弹跳
- **Smooth**: 平滑缓动，优化的缓入缓出效果

### 使用示例

```javascript
import { Easing } from '../composable/Easing.js'

// 创建缓动函数
const easing = Easing.Power.Out(3)

// 在动画中使用
const easedValue = easing(progress) // progress 为 0-1 的进度值
```

### 推荐用法

- **自然运动**: `Easing.Power.Out(2)` 或 `Easing.Sine.InOut()`
- **弹性效果**: `Easing.Elastic.Out(1.2, 0.3)`
- **平滑过渡**: `Easing.Smooth.InOut()`
- **弹跳效果**: `Easing.Bounce.Out()`

## 开发指南

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```

### 构建生产版本
```bash
npm run build
# 或
pnpm build
```

## 项目结构

```
src/
├── animations/          # 动画引擎和时间线管理
├── components/          # Vue 组件
├── composable/          # 组合式函数，包含缓动函数库
├── directives/          # Vue 指令
├── effects/             # 特效系统
├── geometry/            # 几何体相关
├── models/              # 魔方模型
├── stores/              # 状态管理
├── transitions/         # 过渡动画
└── utils/               # 工具函数
```

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **3D 渲染**: Three.js
- **状态管理**: Pinia
- **构建工具**: Vite
- **包管理**: pnpm

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
