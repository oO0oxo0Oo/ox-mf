import { defineStore } from "pinia"
import * as THREE from 'three';
import { useTween } from '../composable/useTween';
import { Easing } from "../composable/Easing"

export const useRotationQueueStore = defineStore("rotationQueue", () => {
  // 配置
  const DURATION = 500;
  const faceConfig = {
    U: { axis: "y", value: 1, angle: Math.PI / 2 },
    D: { axis: "y", value: -1, angle: Math.PI / 2 },
    L: { axis: "x", value: -1, angle: Math.PI / 2 },
    R: { axis: "x", value: 1, angle: Math.PI / 2 },
    F: { axis: "z", value: 1, angle: Math.PI / 2 },
    B: { axis: "z", value: -1, angle: Math.PI / 2 },
  }

  // 动画队列和状态管理
  let animationQueue = [];
  let isRotating = false;
  let currentTween = null;
  let cubeInstance = null;

  // 设置魔方实例
  function setCubeInstance(instance) {
    cubeInstance = instance;
  }

  let rotationAxis = new THREE.Vector3();

  // 根据魔方当前朝向获取旋转轴
  function getRotationAxisForFace(face) {
    if (!cubeInstance || !cubeInstance.object) {
      // 如果没有魔方实例，返回默认轴
      let rotationAxis = new THREE.Vector3();
      switch (face) {
        case 'U':
        case 'D':
          rotationAxis.set(0, 1, 0);
          break;
        case 'L':
        case 'R':
          rotationAxis.set(1, 0, 0);
          break;
        case 'F':
        case 'B':
          rotationAxis.set(0, 0, 1);
          break;
        default:
          rotationAxis.set(0, 0, 0);
      }
      return rotationAxis;
    }

    // 根据魔方当前朝向计算旋转轴
    let rotationAxis = new THREE.Vector3();
    
    // 获取魔方对象的世界矩阵
    const worldMatrix = cubeInstance.object.matrixWorld;
    
    switch (face) {
      case 'U':
      case 'D':
        rotationAxis.set(0, 1, 0); // Y轴
        break;
      case 'L':
      case 'R':
        rotationAxis.set(1, 0, 0); // X轴
        break;
      case 'F':
      case 'B':
        rotationAxis.set(0, 0, 1); // Z轴
        break;
      default:
        rotationAxis.set(0, 0, 0);
    }
    
    return rotationAxis;
  }


  // 旋转队列管理方法
  function addRotationToQueue(face, direction = 1) {
    if (!cubeInstance) return;
    
    // 将旋转操作添加到队列
    animationQueue.push({ face, direction });
    console.log(`添加旋转到队列: ${face}${direction > 0 ? '' : 'p'}, 队列长度: ${animationQueue.length}`);
    
    // 如果当前没有动画在运行，开始处理队列
    if (!isRotating) {
      processQueue();
    }
  }

  function processQueue() {
    if (animationQueue.length === 0) {
      isRotating = false;
      console.log('队列处理完成');
      return;
    }

    isRotating = true;
    let { face, direction } = animationQueue.shift();
    console.log(`执行旋转: ${face}${direction > 0 ? '' : 'p'}, 剩余队列: ${animationQueue.length}`);

    let layer = cubeInstance.getLayerByCurrentOrientation(face);
    
    let config = faceConfig[face];
    
    // 根据魔方当前朝向计算旋转轴
    let rotationAxis = getRotationAxisForFace(face);
    
    let angle = config.angle * direction;

    executeRotation(layer, angle, rotationAxis);
  }

  function executeRotation(layer, angle, rotationAxis) {
    cubeInstance.addLayerGroup();
    cubeInstance.selectLayer(layer);
    const layerGroup = cubeInstance.getLayerGroup();

    currentTween = useTween({
      easing: Easing.Sine.Out(),
      duration: DURATION,
      onUpdate: (tween) => {        
        // 使用世界坐标系旋转
        layerGroup.rotateOnWorldAxis(rotationAxis, tween.delta * angle);

      },
      onComplete: () => {
        cubeInstance.deselectLayer(layer);
        currentTween = null;
        // 动画完成后，等待 DURATION 时间再处理下一个队列项
        setTimeout(() => {
          processQueue();
        }, DURATION);
      }
    });
  }

  function clearRotationQueue() {
    animationQueue = [];
    if (currentTween && currentTween.stop) {
      currentTween.stop();
    }
    isRotating = false;
  }

  // 便捷的旋转方法
  const rotateU = () => addRotationToQueue('U', 1);
  const rotateUp = () => addRotationToQueue('U', -1);
  const rotateD = () => addRotationToQueue('D', 1);
  const rotateDp = () => addRotationToQueue('D', -1);
  const rotateL = () => addRotationToQueue('L', 1);
  const rotateLp = () => addRotationToQueue('L', -1);
  const rotateR = () => addRotationToQueue('R', 1);
  const rotateRp = () => addRotationToQueue('R', -1);
  const rotateF = () => addRotationToQueue('F', 1);
  const rotateFp = () => addRotationToQueue('F', -1);
  const rotateB = () => addRotationToQueue('B', 1);
  const rotateBp = () => addRotationToQueue('B', -1);

  function rotationQueue(queue) {
    queue.forEach(item => {
        switch (item) {
            case 'U':
                rotateU();
                break;
            case 'U\'':
                rotateUp();
                break;
            case 'D':
                rotateD();
                break;
            case 'D\'':
                rotateDp();
                break;
            case 'L':
                rotateL();
                break;
            case 'L\'':
                rotateLp();
                break;
            case 'R':
                rotateR();
                break;
            case 'R\'':
                rotateRp();
                break;
            case 'F':
                rotateF();
                break;
            case 'F\'':
                rotateFp();
                break;
            case 'B':
                rotateB();
                break;
            case 'B\'':
                rotateBp();
                break;
            default:
                break;
        }
    })
  }

  return {
    // 状态
    isRotating: () => isRotating,
    queueLength: () => animationQueue.length,
    
    // 方法
    setCubeInstance,
    addRotationToQueue,
    clearRotationQueue,
    
    // 便捷旋转方法
    rotateU,
    rotateUp,
    rotateD,
    rotateDp,
    rotateL,
    rotateLp,
    rotateR,
    rotateRp,
    rotateF,
    rotateFp,
    rotateB,
    rotateBp,
    rotationQueue,
  }
})
