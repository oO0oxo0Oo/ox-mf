# 魔方自动随机打乱功能

## 功能概述

本项目实现了魔方的自动随机打乱功能，包括：

1. **随机打乱序列生成** - 生成符合魔方打乱规则的随机序列
2. **动画执行** - 将打乱序列转换为3D动画，逐步执行每个移动
3. **用户界面** - 提供友好的控制界面，支持不同难度级别的打乱

## 核心组件

### 1. Scrambler 类 (`src/utils/Scrambler.js`)

负责生成和解析魔方打乱序列的核心工具类。

#### 主要方法：

- `scramble(steps)` - 生成指定步数的随机打乱序列
- `convert()` - 将魔方符号转换为3D旋转操作
- `getScrambleString()` - 获取打乱序列字符串
- `getConvertedMoves()` - 获取转换后的移动序列

#### 支持的魔方符号：

- **面**: U(上), D(下), L(左), R(右), F(前), B(后)
- **修饰符**: 
  - 无修饰符: 顺时针90度
  - `'`: 逆时针90度  
  - `2`: 180度

#### 示例：
```javascript
const scrambler = new Scrambler();
scrambler.scramble(20); // 生成20步随机打乱
console.log(scrambler.getScrambleString()); // 输出: "R U R' U' F2 D L' B2..."
```

### 2. useControls 组合式函数 (`src/composable/useControls.js`)

扩展了原有的控制功能，添加了打乱相关的方法。

#### 新增方法：

- `scrambleCube(callback, steps)` - 执行魔方打乱动画
- `getScrambleString()` - 获取当前打乱序列字符串
- `getScrambleMoves()` - 获取转换后的移动序列
- `isScrambling` - 计算属性，表示是否正在打乱

#### 使用示例：
```javascript
const controls = useControls(targetRef, cubeInstance, camera, {
  onScrambleComplete: () => {
    console.log('打乱完成');
  }
});

// 开始20步打乱
controls.scrambleCube(() => {
  console.log('打乱完成回调');
}, 20);
```

### 3. ControlsDemo 组件 (`src/test/ControlsDemo.vue`)

完整的演示界面，展示了打乱功能的使用方法。

#### 功能特性：

- **步数选择**: 支持10-30步的不同难度级别
- **实时状态**: 显示打乱进度和状态
- **序列显示**: 实时显示当前打乱序列
- **日志记录**: 详细的操作日志

## 使用方法

### 1. 基本使用

```javascript
import { useControls } from './composable/useControls';
import { useCube } from './models/cube';

// 初始化魔方和控制
const cubeInstance = useCube(scene);
const controls = useControls(targetRef, cubeInstance, camera);

// 执行打乱
controls.scrambleCube(() => {
  console.log('打乱完成');
}, 20);
```

### 2. 在Vue组件中使用

```vue
<template>
  <div>
    <button @click="startScramble" :disabled="isScrambling">
      {{ isScrambling ? '打乱中...' : '开始打乱' }}
    </button>
    <div v-if="scrambleString">
      打乱序列: {{ scrambleString }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useControls } from './composable/useControls';

const controls = useControls(targetRef, cubeInstance, camera);
const isScrambling = computed(() => controls.isScrambling.value);
const scrambleString = ref('');

function startScramble() {
  controls.scrambleCube(() => {
    scrambleString.value = controls.getScrambleString();
  }, 20);
}
</script>
```

## 技术实现

### 1. 打乱序列生成算法

- 随机选择魔方的六个面之一
- 随机选择旋转方向（顺时针、逆时针、180度）
- 避免连续旋转同一个面，确保打乱效果
- 支持自定义步数

### 2. 符号转换

将魔方符号转换为3D旋转操作：

```javascript
// 示例: "R'" -> 右面逆时针旋转90度
{
  position: new THREE.Vector3(1, 0, 0), // 右面位置
  axis: "x",                            // 旋转轴
  angle: -Math.PI/2,                    // 旋转角度
  name: "R'"                            // 原始符号
}
```

### 3. 动画执行

- 逐个执行转换后的移动
- 使用现有的层旋转动画系统
- 添加适当的延迟，确保动画流畅
- 支持中断和恢复

## 配置选项

### 打乱步数

- **10步**: 简单打乱，适合初学者
- **15步**: 中等难度
- **20步**: 标准打乱，符合比赛要求
- **25步**: 困难打乱
- **30步**: 专家级别

### 动画配置

可以通过 `flipConfig` 调整动画效果：

- **0**: 力度缓动 (快速)
- **1**: 正弦缓动 (平滑)  
- **2**: 回弹缓动 (回弹效果)

## 测试

项目包含完整的测试组件：

- `ScrambleTest.vue` - 打乱器功能测试
- `ControlsDemo.vue` - 完整功能演示

运行测试：
```bash
npm run dev
# 访问 http://localhost:5173/src/test/ControlsDemo.vue
```

## 注意事项

1. **性能优化**: 打乱动画会占用一定的CPU资源，建议在合适的设备上运行
2. **状态管理**: 打乱过程中会暂时禁用手动控制，避免冲突
3. **错误处理**: 包含完整的错误处理和状态检查
4. **兼容性**: 基于Three.js和Vue 3，确保环境兼容

## 扩展功能

可以进一步扩展的功能：

1. **自定义打乱序列**: 支持用户输入特定的打乱序列
2. **打乱历史**: 记录和回放打乱历史
3. **难度算法**: 根据魔方状态智能调整打乱难度
4. **多语言支持**: 支持不同语言的魔方符号
5. **统计功能**: 记录打乱时间和成功率统计 