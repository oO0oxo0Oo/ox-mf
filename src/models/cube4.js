import { RoundedBoxGeometry, RoundedPlaneGeometry } from "../geometry/Geometry";
import * as THREE from "three";
import { CubeInterface } from "./CubeInterface.js";

export function useCube(scene) {
	// 继承通用魔方接口
	const cube = new CubeInterface(scene);
	
	// 覆盖几何配置 - 调整为四阶魔方
	cube.geometry = {
		pieceSize: 1 / 4, 
		pieceCornerRadius: 0.12,
		edgeCornerRoundness: 0.15,
		edgeScale: 0.82,
		edgeDepth: 0.01,
	};

	// 获取引用
	const { pieces, edges, positions, holder, object, animator, group } = cube;

	// ========== 四阶魔方特有的抽象方法实现 ==========

	// 获取缩放倍数（四阶魔方为4）
	cube.getScaleMultiplier = function() {
		return 4;
	};

	// 获取魔方维度（四阶魔方为4）
	cube.getDimensions = function() {
		return 4;
	};

	// 生成位置数据 - 四阶魔方（4×4×4）
	cube.generatePositions = function(customPieceSize = null) {
		positions.length = 0;

		const pieceSize = customPieceSize || cube.geometry.pieceSize;

		// 四阶魔方：生成4×4×4的网格位置
		// 位置坐标应该是 [-1.5, -0.5, 0.5, 1.5]，然后乘以pieceSize
		for (let x = 0; x < 4; x++) {
			for (let y = 0; y < 4; y++) {
				for (let z = 0; z < 4; z++) {
					// 计算块的中心位置：基于整数坐标，然后乘以pieceSize
					let posX = (x - 1.5);
					let posY = (y - 1.5);
					let posZ = (z - 1.5);
					
					let position = new THREE.Vector3(posX, posY, posZ);
					let edges = [];

					// 根据位置确定哪些面有颜色（边缘块）
					if (x == 0) edges.push(0); // 左面
					if (x == 3) edges.push(1); // 右面
					if (y == 0) edges.push(2); // 下面
					if (y == 3) edges.push(3); // 上面
					if (z == 0) edges.push(4); // 后面
					if (z == 3) edges.push(5); // 前面

					position.edges = edges;
					positions.push(position);
				}
			}
		}
	};

	// 生成魔方模型 - 四阶魔方
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

	// 覆盖通用的getLayerForFace方法 - 四阶魔方版本
	cube.getLayerForFace = function(face) {
		if (!this.pieces || this.pieces.length === 0) return [];

		// 四阶魔方：位置值应该是 -1.5, -0.5, 0.5, 1.5
		// 支持所有层，不仅仅是外层面
		const faceMap = {
			// 外层面
			U: { axis: "y", value: 1.5 },   // 最上面
			D: { axis: "y", value: -1.5 },  // 最下面
			L: { axis: "x", value: -1.5 },  // 最左面
			R: { axis: "x", value: 1.5 },   // 最右面
			F: { axis: "z", value: 1.5 },   // 最前面
			B: { axis: "z", value: -1.5 },  // 最后面
			
			// 中间层 - 支持选择任意层
			U2: { axis: "y", value: 0.5 },  // 上面第二层
			D2: { axis: "y", value: -0.5 }, // 下面第二层
			L2: { axis: "x", value: -0.5 }, // 左面第二层
			R2: { axis: "x", value: 0.5 },  // 右面第二层
			F2: { axis: "z", value: 0.5 },  // 前面第二层
			B2: { axis: "z", value: -0.5 }, // 后面第二层
		};

		const faceConfig = faceMap[face];
		if (!faceConfig) return [];

		console.log(`根据面 ${face} 选择层: 轴=${faceConfig.axis}, 值=${faceConfig.value}`);
		
		// 验证这个面值是否存在于实际的层值中
		const allLayerValues = cube.getLayerValues(faceConfig.axis);
		console.log(`面 ${face} 对应轴 ${faceConfig.axis} 上的所有层值:`, allLayerValues);
		
		// 检查目标值是否在层值范围内
		if (!allLayerValues.includes(faceConfig.value)) {
			console.warn(`警告: 面 ${face} 的目标值 ${faceConfig.value} 不在实际层值中!`);
			console.warn(`实际层值:`, allLayerValues);
		}

		// 创建一个虚拟的position对象来复用getLayer
		const virtualPosition = {};
		virtualPosition[faceConfig.axis] = faceConfig.value;

		return cube.getLayer(virtualPosition);
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

		// 主题颜色支持
		themeColors: null,
		updateColors: cube.updateColors.bind(cube)
	};
}
