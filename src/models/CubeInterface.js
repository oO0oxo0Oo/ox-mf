import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { useScramble } from "../composable/useScramble.js";

// 通用魔方接口 - 包含所有魔方类型都应该实现的方法
export class CubeInterface {
  constructor(scene) {
    this.scene = scene;
    this.pieces = [];
    this.edges = [];
    this.positions = [];
    this.holder = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.animator = new THREE.Object3D();
    this.group = new THREE.Object3D();
    
    // 几何配置
    this.geometry = {
      pieceSize: 1/3,
      pieceCornerRadius: 0.12,
      edgeCornerRoundness: 0.08,
      edgeScale: 1.0,
      edgeDepth: 0.01,
    };

    // 设置对象名称
    this.object.name = "cubeObject";
    this.group.name = "layerGroup";

    // 打乱相关状态
    this.isScrambling = false;
    this.scrambleCallback = null;
    this.rotationTween = null;
  }

  // ========== 通用初始化方法 ==========
  init(customPieceSize = null) {
    // 对象已经在声明时创建，只需要设置层级关系
    this.holder.add(this.animator);
    this.animator.add(this.object);

    this.generatePositions(customPieceSize);
    this.generateModel(customPieceSize);

    this.pieces.forEach((piece) => {
      this.object.add(piece);
    });

    this.holder.traverse((node) => {
      if (node.frustumCulled) node.frustumCulled = false;
    });

    this.scene.add(this.holder);
  }

  // ========== 通用重置方法 ==========
  reset() {
    this.holder.rotation.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.animator.rotation.set(0, 0, 0);

    this.pieces.forEach((piece) => {
      piece.position.copy(piece.userData.start.position);
      piece.rotation.copy(piece.userData.start.rotation);
    });
  }

  // ========== 通用魔方操作方法 ==========
  
  // 获取魔方块在世界坐标下的位置
  getPiecePosition(piece) {
    if (!piece || !piece.matrixWorld) return new THREE.Vector3();

    let position = new THREE.Vector3()
      .setFromMatrixPosition(piece.matrixWorld)
      .multiplyScalar(this.getScaleMultiplier());

    if (!this.object || !this.animator) {
      return position.round();
    }

    return this.object.worldToLocal(position.sub(this.animator.position)).multiplyScalar(2).round().divideScalar(2);
  }

  // 获取向量的主轴
  getMainAxis(vector) {
    return Object.keys(vector).reduce((a, b) =>
      Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
    );
  }

  // 获取某一层的所有块
  getLayer(position, flipAxis = null, dragIntersectObject = null) {
    const layer = [];
    let axis;

    if (position === false) {
      if (!flipAxis || !dragIntersectObject) return [];
      axis = this.getMainAxis(flipAxis);
      position = this.getPiecePosition(dragIntersectObject);
    } else {
      axis = this.getMainAxis(position);
    }

    this.pieces.forEach((piece) => {
      const piecePosition = this.getPiecePosition(piece);
      if (piecePosition[axis] === position[axis]) layer.push(piece.name);
    });

    return layer;
  }

  // 魔方块在不同父对象间移动
  movePieces(layer, from, to) {
    if (!layer || layer.length === 0 || !from || !to) return;

    from.updateMatrixWorld();
    to.updateMatrixWorld();

    layer.forEach((index) => {
      if (!this.pieces || !this.pieces[index]) return;

      const piece = this.pieces[index];
      piece.applyMatrix4(from.matrixWorld);
      from.remove(piece);
      const inverseMatrix = new THREE.Matrix4().copy(to.matrixWorld).invert();
      piece.applyMatrix4(inverseMatrix);
      to.add(piece);
    });
  }

  // 选中某一层
  selectLayer(layer) {
    // 先清空层组
    if (this.group.children.length > 0) {
      const currentLayer = [];
      this.group.children.forEach((child) => {
        const index = parseInt(child.name);
        if (!isNaN(index)) {
          currentLayer.push(index);
        }
      });
      this.deselectLayer(currentLayer);
    }

    this.group.rotation.set(0, 0, 0);
    this.movePieces(layer, this.object, this.group);
  }

  // 取消选中某一层
  deselectLayer(layer) {
    if (!layer) return;
    this.movePieces(layer, this.group, this.object);
  }

  // 根据面获取对应的层
  getLayerForFace(face) {
    if (!this.pieces || this.pieces.length === 0) return [];

    const faceMap = {
      U: { axis: "y", value: 1 },
      D: { axis: "y", value: -1 },
      L: { axis: "x", value: -1 },
      R: { axis: "x", value: 1 },
      F: { axis: "z", value: 1 },
      B: { axis: "z", value: -1 },
    };

    const faceConfig = faceMap[face];
    if (!faceConfig) return [];

    // 创建一个虚拟的position对象来复用getLayer
    const virtualPosition = {};
    virtualPosition[faceConfig.axis] = faceConfig.value;

    return this.getLayer(faceConfig.axis, virtualPosition);
  }

  // 检查魔方是否还原
  checkIsSolved() {
    // 这里可以添加检查逻辑
    return false;
  }

  // 获取层旋转组
  getLayerGroup() {
    return this.group;
  }

  // 将层组添加到对象
  addLayerGroup() {
    if (!this.object.children.includes(this.group)) {
      this.object.add(this.group);
    }
  }

  // 从对象移除层组
  removeLayerGroup() {
    this.object.remove(this.group);
  }

  // ========== 通用打乱相关方法 ==========
  
  // 魔方打乱动画
  scrambleCube(rotationQueue) {
    const queue = useScramble();
    this.isScrambling = true;
    rotationQueue.rotationQueue(queue);
  }

  // 获取打乱状态
  getScrambleState() {
    return this.isScrambling;
  }

  // 停止打乱
  stopScramble(rotationQueue) {
    this.isScrambling = false;
    if (this.rotationTween) {
      this.rotationTween.stop();
    }
    rotationQueue.clearRotationQueue();
  }

  // ========== 通用几何更新方法 ==========

  // 更新角半径 - 通用实现
  updatePieceCornerRadius(newRadius) {
    this.geometry.pieceCornerRadius = newRadius;
    
    // 重新生成所有小方块的几何体
    this.pieces.forEach((piece) => {
      if (piece.userData.cube) {
        const pieceSize = piece.userData.cube.geometry.parameters.width;
        const newGeometry = new RoundedBoxGeometry(pieceSize, newRadius, this.getDimensions());
        piece.userData.cube.geometry.dispose();
        piece.userData.cube.geometry = newGeometry;
      }
    });
  }

  // 更新边缘圆润度 - 通用实现
  updateEdgeCornerRoundness(newRoundness) {
    this.geometry.edgeCornerRoundness = newRoundness;
    
    // 重新生成所有边缘的几何体
    this.pieces.forEach((piece) => {
      piece.children.forEach((child) => {
        if (child.name && ['L', 'R', 'D', 'U', 'B', 'F'].includes(child.name)) {
          const pieceSize = piece.userData.cube.geometry.parameters.width;
          const newEdgeGeometry = RoundedPlaneGeometry(
            pieceSize,
            newRoundness,
            this.geometry.edgeDepth
          );
          child.geometry.dispose();
          child.geometry = newEdgeGeometry;
        }
      });
    });
  }

  // 更新边缘缩放 - 通用实现
  updateEdgeScale(newScale) {
    this.geometry.edgeScale = newScale;
    
    // 重新生成所有边缘的几何体，应用新的缩放
    this.pieces.forEach((piece) => {
      piece.children.forEach((child) => {
        if (child.name && ['L', 'R', 'D', 'U', 'B', 'F'].includes(child.name)) {
          const pieceSize = piece.userData.cube.geometry.parameters.width;
          const scaledSize = pieceSize * newScale;
          const newEdgeGeometry = RoundedPlaneGeometry(
            scaledSize,
            this.geometry.edgeCornerRoundness,
            this.geometry.edgeDepth
          );
          child.geometry.dispose();
          child.geometry = newEdgeGeometry;
          
          // 更新边缘位置，考虑新的缩放
          const distance = (pieceSize / 2) * newScale;
          const edgeIndex = ['L', 'R', 'D', 'U', 'B', 'F'].indexOf(child.name);
          child.position.set(
            distance * [-1, 1, 0, 0, 0, 0][edgeIndex],
            distance * [0, 0, -1, 1, 0, 0][edgeIndex],
            distance * [0, 0, 0, 0, -1, 1][edgeIndex]
          );
        }
      });
    });
  }

  // 更新边长 - 通用实现
  updatePieceSize(newSize) {
    this.geometry.pieceSize = newSize;
    
    // 重新生成所有小方块的几何体
    this.pieces.forEach((piece) => {
      if (piece.userData.cube) {
        const newGeometry = new RoundedBoxGeometry(newSize, this.geometry.pieceCornerRadius, this.getDimensions());
        piece.userData.cube.geometry.dispose();
        piece.userData.cube.geometry = newGeometry;
      }
    });
  }

  // 重新生成模型 - 通用实现
  regenerateModel(customPieceSize = null) {
    const pieceSize = customPieceSize;
    
    // 只更新每个piece的几何体大小
    this.pieces.forEach((piece) => {
      // 更新立方体几何体
      if (piece.userData.cube) {
        const newGeometry = new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, this.getDimensions());
        piece.userData.cube.geometry.dispose();
        piece.userData.cube.geometry = newGeometry;
      }
      
      // 更新边缘几何体
      piece.children.forEach((child) => {
        if (child.name && ['L', 'R', 'D', 'U', 'B', 'F'].includes(child.name)) {
          const newEdgeGeometry = RoundedPlaneGeometry(
            pieceSize,
            this.geometry.edgeCornerRoundness,
            this.geometry.edgeDepth
          );
          child.geometry.dispose();
          child.geometry = newEdgeGeometry;
          
          // 更新边缘位置
          const distance = pieceSize / 2;
          const edgeIndex = ['L', 'R', 'D', 'U', 'B', 'F'].indexOf(child.name);
          child.position.set(
            distance * [-1, 1, 0, 0, 0, 0][edgeIndex],
            distance * [0, 0, -1, 1, 0, 0][edgeIndex],
            distance * [0, 0, 0, 0, -1, 1][edgeIndex]
          );
        }
      });
    });
  }

  // ========== 通用贴片可见性控制 ==========
  
  hideEdges() {
    this.edges.forEach(edge => {
      edge.visible = false;
    });
    return false;
  }

  showEdges() {
    this.edges.forEach(edge => {
      edge.visible = true;
    });
    return true;
  }

  toggleEdges() {
    const isVisible = this.edges[0]?.visible || false;
    this.edges.forEach(edge => {
      edge.visible = !isVisible;
    });
    return !isVisible;
  }

  getEdgesVisibility() {
    return this.edges[0]?.visible || false;
  }

  // ========== 通用主体颜色控制 ==========
  
  updateMainColor(newColor) {
    this.pieces.forEach((piece) => {
      if (piece.userData.cube && piece.userData.cube.material) {
        piece.userData.cube.material.color.setHex(newColor);
      }
    });
    return true;
  }

  getMainColor() {
    if (this.pieces[0] && this.pieces[0].userData.cube && this.pieces[0].userData.cube.material) {
      return this.pieces[0].userData.cube.material.color.getHex();
    }
    return null;
  }

  // 更新主题颜色 - 通用实现
  updateColors(colors) {
    this.themeColors = colors;
    
    // 更新所有边的颜色
    if (this.edges && this.edges.length > 0) {
      const faceNames = ['L', 'R', 'D', 'U', 'B', 'F'];
      this.edges.forEach(edge => {
        const faceIndex = faceNames.indexOf(edge.name);
        if (faceIndex !== -1 && colors[edge.name]) {
          edge.material.color.setHex(colors[edge.name]);
        }
      });
    }
  }

  // ========== 抽象方法 - 子类必须实现 ==========
  
  // 获取缩放倍数（二阶魔方为4，三阶魔方为3）
  getScaleMultiplier() {
    throw new Error('getScaleMultiplier method must be implemented by subclass');
  }

  // 获取魔方维度（二阶魔方为2，三阶魔方为3）
  getDimensions() {
    throw new Error('getDimensions method must be implemented by subclass');
  }

  // 生成位置数据
  generatePositions(customPieceSize = null) {
    throw new Error('generatePositions method must be implemented by subclass');
  }

  // 生成魔方模型
  generateModel(customPieceSize = null) {
    throw new Error('generateModel method must be implemented by subclass');
  }
}

