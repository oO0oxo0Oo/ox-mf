import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { useScramble } from "../composable/useScramble.js";
import { useRotationQueueStore } from "../stores/rotationQueue.js";

export function useCube(scene) {
	// 几何配置 - 调整为二阶魔方
	const geometry = {
		pieceSize: 1 / 2, // 二阶魔方块大小，每个块大小为1
		pieceCornerRadius: 0.12,
		edgeCornerRoundness: 0.15,
		edgeScale: 0.82,
		edgeDepth: 0.01,
	};

	const pieces = [];
	const edges = [];
	const positions = [];

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

	// 生成位置数据 - 修改为二阶魔方（只有角块）
	function generatePositions() {
		positions.length = 0;

		// 这些位置是块的中心位置，块会紧密排列
		const cornerPositions = [
			[-0.25, -0.25, -0.25], // 0: 左下后
			[0.25, -0.25, -0.25], // 1: 右下后
			[-0.25, 0.25, -0.25], // 2: 左上后
			[0.25, 0.25, -0.25], // 3: 右上后
			[-0.25, -0.25, 0.25], // 4: 左下前
			[0.25, -0.25, 0.25], // 5: 右下前
			[-0.25, 0.25, 0.25], // 6: 左上前
			[0.25, 0.25, 0.25], // 7: 右上前
		];

		cornerPositions.forEach((pos, index) => {
			let position = new THREE.Vector3(pos[0], pos[1], pos[2]);
			let edges = [];

			// 根据位置确定哪些面有颜色
			if (pos[0] < 0) edges.push(0); // 左面
			if (pos[0] > 0) edges.push(1); // 右面
			if (pos[1] < 0) edges.push(2); // 下面
			if (pos[1] > 0) edges.push(3); // 上面
			if (pos[2] < 0) edges.push(4); // 后面
			if (pos[2] > 0) edges.push(5); // 前面

			position.edges = edges;
			positions.push(position);
		});
	}

	// 生成魔方模型 - 修改为二阶魔方
	function generateModel() {
		pieces.length = 0;
		edges.length = 0;

		const pieceSize = 1 / 2;
		const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry(pieceSize, geometry.pieceCornerRadius, 2),
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

			piece.position.copy(position);
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

	// ========== 从 useControls 移过来的魔方操作方法 ==========

	// 获取魔方块在世界坐标下的位置
	function getPiecePosition(piece) {
		if (!piece || !piece.matrixWorld) return new THREE.Vector3();

		let position = new THREE.Vector3()
			.setFromMatrixPosition(piece.matrixWorld)
			.multiplyScalar(4); // 二阶魔方不需要额外缩放

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

	// 获取某一层的所有块 - 修改为二阶魔方逻辑
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

	// 根据面获取对应的层 - 修改为二阶魔方逻辑
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

	// ========== 打乱相关方法（从 useControls 移过来） ==========

	// 魔方打乱动画
	function scrambleCube() {
		const queue = useScramble();
		const rotationQueueStore = useRotationQueueStore();
		isScrambling = true;
		rotationQueueStore.rotationQueue(queue);
	}

	// 简化的打乱逻辑已使用 rotationQueue

	// 获取打乱状态
	function getScrambleState() {
		return isScrambling;
	}

	// 停止打乱
	function stopScramble() {
		isScrambling = false;
		if (rotationTween) {
			rotationTween.stop();
		}
		const rotationQueueStore = useRotationQueueStore();
		rotationQueueStore.clearRotationQueue();
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
		checkIsSolved,
		getLayerGroup,
		addLayerGroup,
		removeLayerGroup,

		// 打乱相关方法
		scrambleCube,
		getScrambleState,
		stopScramble,
	};
}
