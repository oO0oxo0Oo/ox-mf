import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { CubeInterface } from "./CubeInterface.js";

export function useCube(scene) {
	// 继承通用魔方接口
	const cube = new CubeInterface(scene);
	
	// 覆盖几何配置
	cube.geometry = {
		pieceSize: 1 / 3,
		pieceCornerRadius: 0.12,
		edgeCornerRoundness: 0.15,
		edgeScale: 0.82,
		edgeDepth: 0.01,
	};

	// 获取引用
	const { pieces, edges, positions, holder, object, animator, group } = cube;

	// ========== 三阶魔方基础配置方法 ==========

	// 获取缩放倍数（三阶魔方为3）
	cube.getScaleMultiplier = function() {
		return 3;
	};

	// 获取魔方维度（三阶魔方为3）
	cube.getDimensions = function() {
		return 3;
	};

	// ========== 三阶魔方几何生成方法 ==========

	// 生成位置数据
	cube.generatePositions = function(customPieceSize = null) {
		positions.length = 0;

		const pieceSize = customPieceSize || cube.geometry.pieceSize;
		const spacing = pieceSize * 3; // 总间距

		for (let x = 0; x < 3; x++) {
			for (let y = 0; y < 3; y++) {
				for (let z = 0; z < 3; z++) {
					let position = new THREE.Vector3(x - 1, y - 1, z - 1);
					let edges = [];

					if (x == 0) edges.push(0);
					if (x == 2) edges.push(1);
					if (y == 0) edges.push(2);
					if (y == 2) edges.push(3);
					if (z == 0) edges.push(4);
					if (z == 2) edges.push(5);

					position.edges = edges;
					positions.push(position);
				}
			}
		}
	};

	// 生成魔方模型
	cube.generateModel = function(customPieceSize = null) {
		pieces.length = 0;
		edges.length = 0;

		const pieceSize = customPieceSize || cube.geometry.pieceSize;
		const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB }); // 天蓝色

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry(pieceSize, cube.geometry.pieceCornerRadius, 3),
			mainMaterial.clone()
		);

		const edgeGeometry = RoundedPlaneGeometry(
			pieceSize,
			cube.geometry.edgeCornerRoundness,
			cube.geometry.edgeDepth
		);

		positions.forEach((position, index) => {
			const piece = new THREE.Object3D();
			const pieceCube = pieceMesh.clone();
			const pieceEdges = [];

			// 根据pieceSize计算正确的位置
			piece.position.copy(position.clone().multiplyScalar(pieceSize));
			piece.add(pieceCube);
			piece.name = index;
			piece.edgesName = "";

			position.edges.forEach((position) => {
				// 为每个面设置不同的颜色 - 使用主题颜色或默认颜色
				const faceNames = ["L", "R", "D", "U", "B", "F"];
				const defaultColors = [
					0xff0000, 0xff8c00, 0xffff00, 0x00ff00, 0x0000ff, 0xffffff,
				]; // 红橙黄绿蓝白
				const faceName = faceNames[position];
				const color = cube.themeColors?.[faceName] || defaultColors[position];
				const edgeMaterial = new THREE.MeshLambertMaterial({
					color: color,
				});
				const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
				const name = faceName;
				const distance = pieceSize / 2;

				edge.position.set(
					distance * [-1, 1, 0, 0, 0, 0][position],
					distance * [0, 0, -1, 1, 0, 0][position],
					distance * [0, 0, 0, 0, -1, 1][position]
				);

				edge.rotation.set(
					(Math.PI / 2) * [0, 0, 1, -1, 0, 0][position],
					(Math.PI / 2) * [-1, 1, 0, 0, 2, 0][position],
					0
				);

				edge.scale.set(
					cube.geometry.edgeScale,
					cube.geometry.edgeScale,
					cube.geometry.edgeScale
				);

				edge.name = name;

				piece.add(edge);
				pieceEdges.push(name);
				edges.push(edge);
			});

			piece.userData.edges = pieceEdges;
			piece.userData.cube = pieceCube;

			piece.userData.start = {
				position: piece.position.clone(),
				rotation: piece.rotation.clone(),
			};

			pieces.push(piece);
		});
	};

	// ========== 三阶魔方层操作方法 ==========

	// 根据当前魔方朝向获取对应的层（考虑魔方旋转）
	function getLayerByCurrentOrientation(face) {
		if (!pieces || pieces.length === 0) return [];

		const layer = [];
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

		// 确保所有矩阵都是最新的
		holder.updateMatrixWorld(true);

		pieces.forEach((piece, index) => {
			if (!piece) return;

			// 获取魔方块的真正世界坐标位置
			if (!piece.matrixWorld) return;
			
			// 获取魔方块的世界坐标
			let worldPosition = new THREE.Vector3()
				.setFromMatrixPosition(piece.matrixWorld)
				.multiplyScalar(3);

			// 检查魔方块是否在指定面上
			const axisValue = Math.round(worldPosition[faceConfig.axis]);
			
			if (axisValue === faceConfig.value) {
				layer.push(index);
			}
		});

		return layer;
	}

	// ========== 三阶魔方面朝向分析方法 ==========

	// 根据面的实际朝向确定它当前代表哪个面（世界坐标系）
	function getCurrentFaceOrientation(piece, face) {
		// 获取魔方小块的世界矩阵
		piece.updateMatrixWorld();
		
		// 创建面的法向量（假设面朝Z轴正方向）
		const faceNormal = new THREE.Vector3(0, 0, 1);
		
		// 应用面的局部变换
		face.updateMatrix();
		faceNormal.applyMatrix4(face.matrix);
		
		// 应用魔方小块的世界变换
		faceNormal.applyMatrix4(piece.matrixWorld);
		
		// 根据法向量确定朝向
		const absX = Math.abs(faceNormal.x);
		const absY = Math.abs(faceNormal.y);
		const absZ = Math.abs(faceNormal.z);
		
		// 找到最大分量
		if (absX > absY && absX > absZ) {
			return faceNormal.x > 0 ? 'R' : 'L';
		} else if (absY > absX && absY > absZ) {
			return faceNormal.y > 0 ? 'U' : 'D';
		} else if (absZ > absX && absZ > absY) {
			return faceNormal.z > 0 ? 'F' : 'B';
		}
		
		return 'unknown';
	}

	// 解析面的颜色朝向信息
	function getFaceOrientationInfo() {
		const faceMap = {
			'L': { name: '左面', color: '红色', hexColor: 0xff0000 },
			'R': { name: '右面', color: '橙色', hexColor: 0xff8c00 },
			'D': { name: '下面', color: '黄色', hexColor: 0xffff00 },
			'U': { name: '上面', color: '绿色', hexColor: 0x00ff00 },
			'B': { name: '后面', color: '蓝色', hexColor: 0x0000ff },
			'F': { name: '前面', color: '白色', hexColor: 0xffffff }
		};

		const orientationInfo = [];
		
		pieces.forEach((piece, pieceIndex) => {
			const pieceInfo = {
				pieceIndex: pieceIndex,
				position: piece.position.clone().multiplyScalar(3).round(),
				faces: []
			};

			// 遍历piece的所有子对象（面）
			piece.children.forEach((child) => {
				if (child.name && faceMap[child.name]) {
					// 获取面的当前朝向（世界坐标系）
					const currentOrientation = getCurrentFaceOrientation(piece, child);
					
					const faceInfo = {
						originalName: child.name, // 原始名称
						currentOrientation: currentOrientation, // 当前朝向
						displayName: faceMap[currentOrientation] ? faceMap[currentOrientation].name : '未知',
						color: faceMap[child.name].color, // 颜色基于原始名称
						hexColor: faceMap[child.name].hexColor,
						position: child.position.clone(),
						rotation: child.rotation.clone(),
						matrix: child.matrix.clone(),
						worldNormal: new THREE.Vector3(0, 0, 1).applyMatrix4(child.matrix).applyMatrix4(piece.matrixWorld)
					};
					pieceInfo.faces.push(faceInfo);
				}
			});

			orientationInfo.push(pieceInfo);
		});

		return orientationInfo;
	}

	// ========== 三阶魔方状态管理方法 ==========

	// 生成魔方状态字符串 (UUUUUUUUURRRRRRRRRFFFFFFFFFFDDDDDDDDDLLLLLLLLLLBBBBBBBBB)
	function getCubeStateString() {
		const faceMap = {
			'L': { name: '左面', color: '红色', hexColor: 0xff0000, char: 'L' },
			'R': { name: '右面', color: '橙色', hexColor: 0xff8c00, char: 'R' },
			'D': { name: '下面', color: '黄色', hexColor: 0xffff00, char: 'D' },
			'U': { name: '上面', color: '绿色', hexColor: 0x00ff00, char: 'U' },
			'B': { name: '后面', color: '蓝色', hexColor: 0x0000ff, char: 'B' },
			'F': { name: '前面', color: '白色', hexColor: 0xffffff, char: 'F' }
		};

		const stateString = [];
		
		// 按照标准魔方状态字符串的顺序：U, R, F, D, L, B
		const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
		
		faceOrder.forEach(face => {
			const facePieces = getLayerByCurrentOrientation(face);
			facePieces.forEach(pieceIndex => {
				const piece = pieces[pieceIndex];
				if (piece && piece.children) {
					// 找到对应面的颜色
					const faceChild = piece.children.find(child => child.name === face);
					if (faceChild) {
						stateString.push(faceMap[face].char);
					}
				}
			});
		});
		
		return stateString.join('');
	}

	// 获取魔方状态
	function getCubeState(){
		// 生成魔方状态字符串
		const stateString = getCubeStateString();

		// 使用新的getFaceOrientationInfo函数获取详细信息
		const orientationInfo = getFaceOrientationInfo();
		
		orientationInfo.forEach((pieceInfo) => {
			if (pieceInfo.faces.length > 0) {
				pieceInfo.faces.forEach((face) => {
				});
			} else {
				// console.log("  这是一个中心块，没有彩色面");
			}
		});
		
		pieces.forEach((piece, index) => {
			let piecePosition = cube.getPiecePosition(piece);
		});
		
		// 返回魔方状态字符串
		return stateString;
	}

	// ========== 三阶魔方主题管理方法 ==========

	// 主题颜色支持
	let themeColors = null;
	function updateColors(colors) {
		themeColors = colors
		// 更新所有边的颜色
		if (edges && edges.length > 0) {
			const faceNames = ['L', 'R', 'D', 'U', 'B', 'F']
			edges.forEach(edge => {
				const faceIndex = faceNames.indexOf(edge.name)
				if (faceIndex !== -1 && colors[edge.name]) {
					edge.material.color.setHex(colors[edge.name])
				}
			})
		}
	}

	return {
		// 状态
		geometry: cube.geometry,
		pieces,
		edges,
		positions,
		holder,
		object,
		animator,

		// 基础方法 - 继承自CubeInterface
		init: cube.init.bind(cube),
		reset: cube.reset.bind(cube),
		generatePositions: cube.generatePositions.bind(cube),
		generateModel: cube.generateModel.bind(cube),

		// 魔方操作方法 - 继承自CubeInterface
		getPiecePosition: cube.getPiecePosition.bind(cube),
		getMainAxis: cube.getMainAxis.bind(cube),
		getLayer: cube.getLayer.bind(cube),
		movePieces: cube.movePieces.bind(cube),
		selectLayer: cube.selectLayer.bind(cube),
		deselectLayer: cube.deselectLayer.bind(cube),
		getLayerForFace: cube.getLayerForFace.bind(cube),
		checkIsSolved: cube.checkIsSolved.bind(cube),
		getLayerGroup: cube.getLayerGroup.bind(cube),
		addLayerGroup: cube.addLayerGroup.bind(cube),
		removeLayerGroup: cube.removeLayerGroup.bind(cube),

		// 三阶魔方特有的方法
		getLayerByCurrentOrientation,
		getCubeState,

		// 打乱相关方法 - 继承自CubeInterface
		scrambleCube: cube.scrambleCube.bind(cube),
		getScrambleState: cube.getScrambleState.bind(cube),
		getFaceOrientationInfo,
		getCubeStateString,

		// 贴片可见性控制 - 继承自CubeInterface
		hideEdges: cube.hideEdges.bind(cube),
		showEdges: cube.showEdges.bind(cube),
		toggleEdges: cube.toggleEdges.bind(cube),
		getEdgesVisibility: cube.getEdgesVisibility.bind(cube),

		// 边长控制 - 继承自CubeInterface
		updatePieceSize: cube.updatePieceSize.bind(cube),
		regenerateModel: cube.regenerateModel.bind(cube),
		updatePieceCornerRadius: cube.updatePieceCornerRadius.bind(cube),
		updateEdgeCornerRoundness: cube.updateEdgeCornerRoundness.bind(cube),
		updateEdgeScale: cube.updateEdgeScale.bind(cube),

		// 主体颜色控制 - 继承自CubeInterface
		updateMainColor: cube.updateMainColor.bind(cube),
		getMainColor: cube.getMainColor.bind(cube),

		// 主题颜色支持
		themeColors: null,
		updateColors: function(colors) {
			this.themeColors = colors
			// 更新所有边的颜色
			if (this.edges && this.edges.length > 0) {
				const faceNames = ['L', 'R', 'D', 'U', 'B', 'F']
				this.edges.forEach(edge => {
					const faceIndex = faceNames.indexOf(edge.name)
					if (faceIndex !== -1 && colors[edge.name]) {
						edge.material.color.setHex(colors[edge.name])
					}
				})
			}
		}
	};
}
