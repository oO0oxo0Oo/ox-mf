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
    // 180度旋转配置
    U2: { axis: "y", value: 1, angle: Math.PI },
    D2: { axis: "y", value: -1, angle: Math.PI },
    L2: { axis: "x", value: -1, angle: Math.PI },
    R2: { axis: "x", value: 1, angle: Math.PI },
    F2: { axis: "z", value: 1, angle: Math.PI },
    B2: { axis: "z", value: -1, angle: Math.PI },
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
        case 'U2':
        case 'D':
        case 'D2':
          rotationAxis.set(0, 1, 0);
          break;
        case 'L':
        case 'L2':
        case 'R':
        case 'R2':
          rotationAxis.set(1, 0, 0);
          break;
        case 'F':
        case 'F2':
        case 'B':
        case 'B2':
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
      case 'U2':
      case 'D':
      case 'D2':
        rotationAxis.set(0, 1, 0); // Y轴
        break;
      case 'L':
      case 'L2':
      case 'R':
      case 'R2':
        rotationAxis.set(1, 0, 0); // X轴
        break;
      case 'F':
      case 'F2':
      case 'B':
      case 'B2':
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

    let layer = cubeInstance.getLayerByCurrentOrientation(face[0]);
    
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
        // 将世界坐标轴转换到layerGroup的局部坐标系
        const localAxis = rotationAxis.clone();
        layerGroup.updateMatrixWorld();
        const inverseMatrix = new THREE.Matrix4().copy(layerGroup.matrixWorld).invert();
        localAxis.applyMatrix4(inverseMatrix).normalize();
        
        layerGroup.rotateOnAxis(localAxis, tween.delta * angle);

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
  
  // 180度旋转方法
  const rotateU2 = () => addRotationToQueue('U2', 1);
  const rotateD2 = () => addRotationToQueue('D2', 1);
  const rotateL2 = () => addRotationToQueue('L2', 1);
  const rotateR2 = () => addRotationToQueue('R2', 1);
  const rotateF2 = () => addRotationToQueue('F2', 1);
  const rotateB2 = () => addRotationToQueue('B2', 1);

  function rotationQueue(queue) {
    queue.forEach(item => {
        switch (item) {
            case 'U':
                rotateU();
                break;
            case 'U\'':
                rotateUp();
                break;
            case 'U2':
                rotateU2();
                break;
            case 'D':
                rotateD();
                break;
            case 'D\'':
                rotateDp();
                break;
            case 'D2':
                rotateD2();
                break;
            case 'L':
                rotateL();
                break;
            case 'L\'':
                rotateLp();
                break;
            case 'L2':
                rotateL2();
                break;
            case 'R':
                rotateR();
                break;
            case 'R\'':
                rotateRp();
                break;
            case 'R2':
                rotateR2();
                break;
            case 'F':
                rotateF();
                break;
            case 'F\'':
                rotateFp();
                break;
            case 'F2':
                rotateF2();
                break;
            case 'B':
                rotateB();
                break;
            case 'B\'':
                rotateBp();
                break;
            case 'B2':
                rotateB2();
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
    
    // 180度旋转方法
    rotateU2,
    rotateD2,
    rotateL2,
    rotateR2,
    rotateF2,
    rotateB2,
    
    rotationQueue,
  }
})
