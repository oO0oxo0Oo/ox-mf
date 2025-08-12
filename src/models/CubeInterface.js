import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";

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
  }

  // 更新角半径 - 通用实现
  updatePieceCornerRadius(newRadius) {
    this.geometry.pieceCornerRadius = newRadius;
    
    // 重新生成所有小方块的几何体
    this.pieces.forEach((piece) => {
      if (piece.userData.cube) {
        const pieceSize = piece.userData.cube.geometry.parameters.width;
        const newGeometry = new RoundedBoxGeometry(pieceSize, newRadius, 3);
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
        const newGeometry = new RoundedBoxGeometry(newSize, this.geometry.pieceCornerRadius, 3);
        piece.userData.cube.geometry.dispose();
        piece.userData.cube.geometry = newGeometry;
      }
    });
  }

  // 重新生成模型 - 通用实现
  regenerateModel(customPieceSize = null) {
    const pieceSize = customPieceSize || this.geometry.pieceSize;
    
    // 只更新每个piece的几何体大小
    this.pieces.forEach((piece) => {
      // 更新立方体几何体
      if (piece.userData.cube) {
        const newGeometry = new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, 3);
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

  // 贴片可见性控制 - 通用实现
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

  // 基础方法 - 子类必须实现
  init() {
    throw new Error('init method must be implemented by subclass');
  }

  reset() {
    throw new Error('reset method must be implemented by subclass');
  }

  generatePositions() {
    throw new Error('generatePositions method must be implemented by subclass');
  }

  generateModel() {
    throw new Error('generateModel method must be implemented by subclass');
  }
}
