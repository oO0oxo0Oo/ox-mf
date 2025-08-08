import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { useScramble } from "../composable/useScramble.js";
import { useRotationQueueStore } from "../stores/rotationQueue.js";

export function useCube(scene) {
	// 几何配置
	const geometry = {
		pieceSize: 1 / 3,
		pieceCornerRadius: 0.12,
		edgeCornerRoundness: 0.15,
		edgeScale: 0.82,
		edgeDepth: 0.01,
	};

	const pieces = []; // 存储所有魔方小块的数组
	const edges = []; // 存储所有魔方贴图（彩色面）的数组
	const positions = []; // 存储魔方小块位置信息的数组

	// Three.js对象引用 - 使用 const 声明，确保引用正确
	const holder = new THREE.Object3D();
	const object = new THREE.Object3D();
	object.name = "cubeObject";
	const animator = new THREE.Object3D();

	// 层操作相关
	const group = new THREE.Object3D(); // 用于层旋转的临时组
	group.name = "layerGroup";

	// 打乱相关状态
	let isScrambling = false;
	let scrambleCallback = null;
	let rotationTween = null;

	// 初始化魔方
	function init() {
		// 对象已经在声明时创建，只需要设置层级关系
		holder.add(animator);
		animator.add(object);

		generatePositions();
		generateModel();

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
	function generatePositions() {
		positions.length = 0;

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
	function generateModel() {
		pieces.length = 0;
		edges.length = 0;

		const pieceSize = 1 / 3;
		const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry(pieceSize, geometry.pieceCornerRadius, 3),
			mainMaterial.clone()
		);

		const edgeGeometry = RoundedPlaneGeometry(
			pieceSize,
			geometry.edgeCornerRoundness,
			geometry.edgeDepth
		);

		positions.forEach((position, index) => {
			const piece = new THREE.Object3D();
			const pieceCube = pieceMesh.clone();
			const pieceEdges = [];

			piece.position.copy(position.clone().divideScalar(3));
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
					geometry.edgeScale,
					geometry.edgeScale,
					geometry.edgeScale
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

	// 获取某一层的所有块
	function getLayer(position) {
		const layer = [];
		let axis;

		if (position === false) {
			// 这里需要从外部传入 axis 和 intersect object
			return layer;
		} else {
			axis = getMainAxis(position);
		}

		pieces.forEach((piece, index) => {
			if (!piece) return;
			const piecePosition = getPiecePosition(piece);
			if (piecePosition && piecePosition[axis] === position[axis]) {
				layer.push(index);
			}
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

		pieces.forEach((piece, index) => {
			if (!piece) return;

			const piecePosition = getPiecePosition(piece);

			if (
				piecePosition &&
				piecePosition[faceConfig.axis] === faceConfig.value
			) {
				layer.push(index);
			}
		});

		return layer;
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
		isScrambling = true;
		rotationQueueStore.rotationQueue(queue);
		
	}

	// isScrambling

	// 获取打乱状态
	function getScrambleState() {
		return isScrambling;
	}


	return {
		// 状态
		geometry,
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

		// 打乱相关方法
		scrambleCube,
		getScrambleState,
	};
}
