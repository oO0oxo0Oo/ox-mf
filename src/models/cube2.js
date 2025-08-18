import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { CubeInterface } from "./CubeInterface.js";

export function useCube(scene) {
	// 继承通用魔方接口
	const cube = new CubeInterface(scene);
	
	// 覆盖几何配置 - 调整为二阶魔方
	cube.geometry = {
		pieceSize: 1 / 2, 
		pieceCornerRadius: 0.12,
		edgeCornerRoundness: 0.15,
		edgeScale: 0.82,
		edgeDepth: 0.01,
	};

	// 获取引用
	const { pieces, edges, positions, holder, object, animator, group } = cube;

	// ========== 二阶魔方特有的抽象方法实现 ==========

	// 获取缩放倍数（二阶魔方为4）
	cube.getScaleMultiplier = function() {
		return 4;
	};

	// 获取魔方维度（二阶魔方为2）
	cube.getDimensions = function() {
		return 2;
	};

	// 生成位置数据 - 二阶魔方（只有角块）
	cube.generatePositions = function(customPieceSize = null) {
		positions.length = 0;

		// 这些位置是块的中心位置，块会紧密排列
		// 二阶魔方：每个块边长是1/2，所以块的中心在±0.25位置
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
	};

	// 生成魔方模型 - 二阶魔方
	cube.generateModel = function(customPieceSize = null) {
		pieces.length = 0;
		edges.length = 0;

		const pieceSize = customPieceSize || cube.geometry.pieceSize;
		const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry(pieceSize, cube.geometry.pieceCornerRadius, 2),
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

		// 打乱相关方法 - 继承自CubeInterface
		scrambleCube: cube.scrambleCube.bind(cube),
		getScrambleState: cube.getScrambleState.bind(cube),
		stopScramble: cube.stopScramble.bind(cube),

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
	};
}
