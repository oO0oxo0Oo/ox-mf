import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { useScramble } from "../composable/useScramble.js";
import { useRotationQueueStore } from "../stores/rotationQueue.js";
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

	// 设置对象名称
	object.name = "cubeObject";
	group.name = "layerGroup";

	// 打乱相关状态
	let isScrambling = false;
	let scrambleCallback = null;
	let rotationTween = null;

	// 初始化魔方
	function init(customPieceSize = null) {
		// 对象已经在声明时创建，只需要设置层级关系
		holder.add(animator);
		animator.add(object);

		generatePositions(customPieceSize);
		generateModel(customPieceSize);

		pieces.forEach((piece) => {
			object.add(piece);
		});

		holder.traverse((node) => {
			if (node.frustumCulled) node.frustumCulled = false;
		});

		scene.add(holder);
	}

	// 重置魔方
	function reset() {
		holder.rotation.set(0, 0, 0);
		object.rotation.set(0, 0, 0);
		animator.rotation.set(0, 0, 0);

		pieces.forEach((piece) => {
			piece.position.copy(piece.userData.start.position);
			piece.rotation.copy(piece.userData.start.rotation);
		});
	}

	// 生成位置数据
	function generatePositions(customPieceSize = null) {
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
	}

	// 生成魔方模型
	function generateModel(customPieceSize = null) {
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
				// 为每个面设置不同的颜色
				const colors = [
					0xff0000, 0xff8c00, 0xffff00, 0x00ff00, 0x0000ff, 0xffffff,
				]; // 红橙黄绿蓝白
				const edgeMaterial = new THREE.MeshLambertMaterial({
					color: colors[position],
				});
				const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
				const name = ["L", "R", "D", "U", "B", "F"][position];
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
	}

	// 获取魔方块在世界坐标下的位置
	function getPiecePosition(piece) {
		if (!piece || !piece.matrixWorld) return new THREE.Vector3();

		let position = new THREE.Vector3()
			.setFromMatrixPosition(piece.matrixWorld)
			.multiplyScalar(4);

		if (!object || !animator) {
			return position.round();
		}

		return object.worldToLocal(position.sub(animator.position)).round();
	}

	// 获取向量的主轴
	function getMainAxis(vector) {
		return Object.keys(vector).reduce((a, b) =>
			Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
		);
	}

	// 获取某一层的所有块（完全贴近源码实现）
	function getLayer(position, flipAxis = null, dragIntersectObject = null) {
		const layer = [];
		let axis;

		if (position === false) {
			// 源码风格：需要外部传入flipAxis和dragIntersectObject
			if (!flipAxis || !dragIntersectObject) return [];
			axis = getMainAxis(flipAxis);
			position = getPiecePosition(dragIntersectObject);
		} else {
			axis = getMainAxis(position);
		}

		pieces.forEach((piece) => {
			const piecePosition = getPiecePosition(piece);
			// 完全贴近源码：返回piece.name
			if (piecePosition[axis] === position[axis]) layer.push(piece.name);
		});

		return layer;
	}

	// 魔方块在不同父对象间移动
	function movePieces(layer, from, to) {
		if (!layer || layer.length === 0 || !from || !to) return;

		from.updateMatrixWorld();
		to.updateMatrixWorld();

		layer.forEach((index) => {
			if (!pieces || !pieces[index]) return;

			const piece = pieces[index];
			piece.applyMatrix4(from.matrixWorld);
			from.remove(piece);
			const inverseMatrix = new THREE.Matrix4().copy(to.matrixWorld).invert();
			piece.applyMatrix4(inverseMatrix);
			to.add(piece);
		});
	}

	// 选中某一层
	function selectLayer(layer) {
		// 先清空层组
		if (group.children.length > 0) {
			const currentLayer = [];
			group.children.forEach((child) => {
				const index = parseInt(child.name);
				if (!isNaN(index)) {
					currentLayer.push(index);
				}
			});
			deselectLayer(currentLayer);
		}

		group.rotation.set(0, 0, 0);
		movePieces(layer, object, group);
	}

	// 取消选中某一层
	function deselectLayer(layer) {
		if (!layer) return;
		movePieces(layer, group, object);
	}

	// 根据面获取对应的层
	function getLayerForFace(face) {
		if (!pieces || pieces.length === 0) return [];

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

		return getLayer(faceConfig.axis, virtualPosition);
	}

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

	// 检查魔方是否还原
	function checkIsSolved() {
		// 这里可以添加检查逻辑
		return false;
	}

	// 获取层旋转组
	function getLayerGroup() {
		return group;
	}

	// 将层组添加到对象
	function addLayerGroup() {
		if (!object.children.includes(group)) {
			object.add(group);
		}
	}

	// 从对象移除层组
	function removeLayerGroup() {
		object.remove(group);
	}

	// 魔方打乱动画
	function scrambleCube() {
		const queue = useScramble();
		const rotationQueueStore = useRotationQueueStore();
		cube.isScrambling = true;
		rotationQueueStore.rotationQueue(queue);
		
	}

	// isScrambling

	// 获取打乱状态
	function getScrambleState() {
		return cube.isScrambling;
	}

	function getCubeState(){
		console.log("=== 魔方状态信息 ===");
		
		// 生成魔方状态字符串
		const stateString = getCubeStateString();
		// console.log(`\n魔方状态字符串: ${stateString}`);
		// console.log(`长度: ${stateString.length} (应该是54)`);
		
		// 使用新的getFaceOrientationInfo函数获取详细信息
		const orientationInfo = getFaceOrientationInfo();
		
		orientationInfo.forEach((pieceInfo) => {
			// console.log(`\n--- 魔方小块 ${pieceInfo.pieceIndex} ---`);
			// console.log(`位置: (${pieceInfo.position.x}, ${pieceInfo.position.y}, ${pieceInfo.position.z})`);
			
			if (pieceInfo.faces.length > 0) {
				console.log("面的信息:");
				pieceInfo.faces.forEach((face) => {
					// console.log(`  ${face.originalName} → ${face.currentOrientation} (${face.displayName}): ${face.color} (0x${face.hexColor.toString(16)})`);
					// console.log(`    位置: (${face.position.x.toFixed(3)}, ${face.position.y.toFixed(3)}, ${face.position.z.toFixed(3)})`);
					// console.log(`    旋转: (${face.rotation.x.toFixed(3)}, ${face.rotation.y.toFixed(3)}, ${face.rotation.z.toFixed(3)})`);
					// console.log(`    世界法向量: (${face.worldNormal.x.toFixed(3)}, ${face.worldNormal.y.toFixed(3)}, ${face.worldNormal.z.toFixed(3)})`);
				});
			} else {
				// console.log("  这是一个中心块，没有彩色面");
			}
		});
		
		console.log("\n=== 原始数据对比 ===");
		pieces.forEach((piece, index) => {
			let piecePosition = getPiecePosition(piece);
			// console.log(`小块 ${index}:`, {
			// 	position: piecePosition,
			// 	edges: piece.userData.edges,
			// 	childrenCount: piece.children.length
			// });
		});
		
		// 返回魔方状态字符串
		return stateString;
	}

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

		// 初始化6个面的数组，每个面9个位置
		const faces = {
			'U': new Array(9).fill(''),
			'R': new Array(9).fill(''),
			'F': new Array(9).fill(''),
			'D': new Array(9).fill(''),
			'L': new Array(9).fill(''),
			'B': new Array(9).fill('')
		};

		// 遍历所有魔方小块
		pieces.forEach((piece) => {
			const piecePosition = getPiecePosition(piece);
			
			// 遍历每个小块的面
			piece.children.forEach((face) => {
				if (face.name && faceMap[face.name]) {
					// 获取面的当前朝向（世界坐标系）
					const currentOrientation = getCurrentFaceOrientation(piece, face);
					
					if (currentOrientation && faceMap[currentOrientation]) {
						// 根据小块位置确定在面中的索引
						const faceIndex = getFaceIndex(piecePosition, currentOrientation);
						
						if (faceIndex !== -1) {
							// 获取颜色字符
							const colorChar = faceMap[face.name].char;
							faces[currentOrientation][faceIndex] = colorChar;
						}
					}
				}
			});
		});

		// 按顺序拼接：U R F D L B
		const stateString = faces.U.join('') + faces.R.join('') + faces.F.join('') + 
						   faces.D.join('') + faces.L.join('') + faces.B.join('');
		
		return stateString;
	}

	// 根据小块位置和面朝向确定在面中的索引
	function getFaceIndex(piecePosition, faceOrientation) {
		// 面的索引映射（从左上角开始，按行排列）
		// 0 1 2
		// 3 4 5
		// 6 7 8
		
		const x = piecePosition.x;
		const y = piecePosition.y;
		const z = piecePosition.z;
		
		switch (faceOrientation) {
			case 'U': // 上面 (y = 1)
				if (y !== 1) return -1;
				return (1 - z) * 3 + (x + 1);
			case 'D': // 下面 (y = -1)
				if (y !== -1) return -1;
				return (z + 1) * 3 + (x + 1);
			case 'L': // 左面 (x = -1)
				if (x !== -1) return -1;
				return (1 - z) * 3 + (y + 1);
			case 'R': // 右面 (x = 1)
				if (x !== 1) return -1;
				return (z + 1) * 3 + (y + 1);
			case 'F': // 前面 (z = 1)
				if (z !== 1) return -1;
				return (1 - y) * 3 + (x + 1);
			case 'B': // 后面 (z = -1)
				if (z !== -1) return -1;
				return (y + 1) * 3 + (1 - x);
			default:
				return -1;
		}
	}

	// 只缩放小方块边长，不改变位置
	function regenerateModel(customPieceSize = null) {
		const pieceSize = customPieceSize || cube.geometry.pieceSize;
		
		// 只更新每个piece的几何体大小
		pieces.forEach((piece) => {
			// 更新立方体几何体
			if (piece.userData.cube) {
				const newGeometry = new RoundedBoxGeometry(pieceSize, cube.geometry.pieceCornerRadius, 3);
				piece.userData.cube.geometry.dispose();
				piece.userData.cube.geometry = newGeometry;
			}
			
			// 更新边缘几何体
			piece.children.forEach((child) => {
				if (child.name && ['L', 'R', 'D', 'U', 'B', 'F'].includes(child.name)) {
					const newEdgeGeometry = RoundedPlaneGeometry(
						pieceSize,
						cube.geometry.edgeCornerRoundness,
						cube.geometry.edgeDepth
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

	return {
		// 状态
		geometry: cube.geometry,
		pieces,
		edges,
		positions,
		holder,
		object,
		animator,

		// 基础方法
		init,
		reset,
		generatePositions,
		generateModel,

		// 魔方操作方法（从 useControls 移过来）
		getPiecePosition,
		getMainAxis,
		getLayer,
		movePieces,
		selectLayer,
		deselectLayer,
		getLayerForFace,
		getLayerByCurrentOrientation,
		checkIsSolved,
		getLayerGroup,
		addLayerGroup,
		removeLayerGroup,
		getCubeState,

		// 打乱相关方法
		scrambleCube,
		getScrambleState,
		getFaceOrientationInfo,
		getCubeStateString,

		// 贴片可见性控制 - 使用继承的方法
		hideEdges: cube.hideEdges.bind(cube),
		showEdges: cube.showEdges.bind(cube),
		toggleEdges: cube.toggleEdges.bind(cube),
		getEdgesVisibility: cube.getEdgesVisibility.bind(cube),

		// 边长控制 - 使用继承的方法
		updatePieceSize: cube.updatePieceSize.bind(cube),
		regenerateModel,
		updatePieceCornerRadius: cube.updatePieceCornerRadius.bind(cube),
		updateEdgeCornerRoundness: cube.updateEdgeCornerRoundness.bind(cube),
		updateEdgeScale: cube.updateEdgeScale.bind(cube),

		// 主体颜色控制 - 使用继承的方法
		updateMainColor: cube.updateMainColor.bind(cube),
		getMainColor: cube.getMainColor.bind(cube),
	};
}
