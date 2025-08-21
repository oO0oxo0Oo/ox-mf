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

	// ========== 四阶魔方特有的层选择方法 ==========

	// 覆盖通用的getPiecePosition方法 - 四阶魔方版本
	cube.getPiecePosition = function(piece) {
		if (!piece || !piece.matrixWorld) return new THREE.Vector3();

		// 四阶魔方：直接使用piece的position，不需要乘以getScaleMultiplier
		// 因为generateModel中已经正确设置了position
		let position = piece.position.clone();
		
		// 将位置值除以pieceSize，得到标准化的位置坐标
		const pieceSize = cube.geometry.pieceSize;
		position.divideScalar(pieceSize);
		
		// 四舍五入到最接近的0.5的倍数，避免浮点数精度问题
		position.x = Math.round(position.x * 2) / 2;
		position.y = Math.round(position.y * 2) / 2;
		position.z = Math.round(position.z * 2) / 2;
		
		return position;
	};

	// 覆盖通用的getLayer方法 - 四阶魔方版本
	cube.getLayer = function(position, flipAxis = null, dragIntersectObject = null) {
		const layer = [];
		let axis;

		if (position === false) {
			if (!flipAxis || !dragIntersectObject) return [];
			axis = cube.getMainAxis(flipAxis);
			position = cube.getPiecePosition(dragIntersectObject);
		} else {
			axis = cube.getMainAxis(position);
		}

		// 四阶魔方：位置值应该是 -1.5, -0.5, 0.5, 1.5
		// 使用精确比较，因为现在位置值已经标准化
		const targetValue = position[axis];
		
		// 调试信息
		console.log(`选择层: 轴=${axis}, 目标值=${targetValue}`);
		console.log(`完整位置对象:`, position);
		
		// 获取该轴上所有可能的层值
		const allLayerValues = cube.getLayerValues(axis);
		console.log(`轴 ${axis} 上的所有层值:`, allLayerValues);
		
		// 找到最接近目标值的层值
		let closestLayerValue = allLayerValues[0];
		let minDistance = Math.abs(allLayerValues[0] - targetValue);
		
		allLayerValues.forEach(value => {
			const distance = Math.abs(value - targetValue);
			if (distance < minDistance) {
				minDistance = distance;
				closestLayerValue = value;
			}
		});
		
		console.log(`最接近目标值 ${targetValue} 的层值: ${closestLayerValue}`);
		
		// 使用精确比较，因为位置值已经标准化
		this.pieces.forEach((piece) => {
			const piecePosition = cube.getPiecePosition(piece);
			const pieceValue = piecePosition[axis];
			
			// 检查是否在目标层上（使用精确比较）
			if (pieceValue === closestLayerValue) {
				layer.push(piece.name);
				console.log(`选中块 ${piece.name}: ${axis}=${pieceValue} (目标层值: ${closestLayerValue})`);
			}
		});

		console.log(`层选择完成，共选中 ${layer.length} 个块`);
		
		// 验证选择的块是否都在正确的层上
		if (layer.length > 0) {
			const isValid = cube.validateLayerSelection(layer, axis, closestLayerValue);
			console.log(`层选择验证结果: ${isValid ? '通过' : '失败'}`);
		}
		
		return layer;
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

	// 新增：根据拖拽位置动态选择层
	cube.getLayerByDragPosition = function(dragPosition, axis) {
		if (!this.pieces || this.pieces.length === 0) return [];

		// 获取该轴上所有可能的层值
		const allLayerValues = cube.getLayerValues(axis);
		if (allLayerValues.length === 0) return [];

		// 找到最接近拖拽位置的层值
		let closestLayerValue = allLayerValues[0];
		let minDistance = Math.abs(allLayerValues[0] - dragPosition);

		allLayerValues.forEach(value => {
			const distance = Math.abs(value - dragPosition);
			if (distance < minDistance) {
				minDistance = distance;
				closestLayerValue = value;
			}
		});

		console.log(`拖拽位置 ${dragPosition} 最接近的层值: ${closestLayerValue}`);

		// 创建虚拟位置对象
		const virtualPosition = {};
		virtualPosition[axis] = closestLayerValue;

		// 使用getLayer方法选择层
		return cube.getLayer(virtualPosition);
	};

	// 新增：获取指定轴上的所有层值（用于调试）
	cube.getLayerValues = function(axis) {
		const values = new Set();
		
		// 四阶魔方：现在位置值应该是 -1.5, -0.5, 0.5, 1.5
		this.pieces.forEach((piece) => {
			const piecePosition = cube.getPiecePosition(piece);
			const rawValue = piecePosition[axis];
			
			// 验证值是否在预期范围内
			const expectedValues = [-1.5, -0.5, 0.5, 1.5];
			if (expectedValues.includes(rawValue)) {
				values.add(rawValue);
			} else {
				console.warn(`警告: 块 ${piece.name} 在轴 ${axis} 上的值 ${rawValue} 不在预期范围内`);
			}
		});
		
		const sortedValues = Array.from(values).sort((a, b) => a - b);
		console.log(`轴 ${axis} 上的标准化层值:`, sortedValues);
		
		return sortedValues;
	};

	// 新增：验证层选择的准确性
	cube.validateLayerSelection = function(layer, axis, targetValue) {
		if (!layer || layer.length === 0) return false;
		
		// 使用精确比较，因为位置值已经标准化
		let isValid = true;
		
		layer.forEach((pieceIndex) => {
			const piece = this.pieces[pieceIndex];
			if (piece) {
				const piecePosition = cube.getPiecePosition(piece);
				const pieceValue = piecePosition[axis];
				
				// 使用精确比较
				if (pieceValue !== targetValue) {
					console.warn(`警告: 块 ${pieceIndex} 不在目标层上! ${axis}=${pieceValue}, 目标=${targetValue}`);
					isValid = false;
				}
			}
		});
		
		// 验证块数量（四阶魔方每层应该是16个块）
		if (layer.length !== 16) {
			console.warn(`警告: 层选择块数量不正确! 期望16个，实际${layer.length}个`);
			isValid = false;
		}
		
		return isValid;
	};

	// 新增：测试四阶魔方位置数据
	cube.testPositions = function() {
		console.log("=== 四阶魔方位置数据测试 ===");
		
		// 测试位置数据
		console.log("位置数据总数:", positions.length);
		console.log("预期位置数据总数: 64 (4×4×4)");
		
		// 检查每个轴上的层值
		['x', 'y', 'z'].forEach(axis => {
			const layerValues = cube.getLayerValues(axis);
			console.log(`轴 ${axis} 上的层值:`, layerValues);
			console.log(`轴 ${axis} 上的层数:`, layerValues.length);
			console.log(`预期层数: 4`);
		});
		
		// 检查位置范围
		const xValues = positions.map(p => p.x);
		const yValues = positions.map(p => p.y);
		const zValues = positions.map(p => p.z);
		
		console.log("X轴位置范围:", Math.min(...xValues), "到", Math.max(...xValues));
		console.log("Y轴位置范围:", Math.min(...yValues), "到", Math.max(...yValues));
		console.log("Z轴位置范围:", Math.min(...zValues), "到", Math.max(...zValues));
		
		// 四阶魔方：位置值应该是 -1.5, -0.5, 0.5, 1.5
		const expectedRange = [-1.5, -0.5, 0.5, 1.5];
		console.log("预期位置值:", expectedRange);
		
		// 验证每个位置是否在预期范围内
		let validPositions = 0;
		positions.forEach((pos, index) => {
			const xValid = expectedRange.includes(pos.x);
			const yValid = expectedRange.includes(pos.y);
			const zValid = expectedRange.includes(pos.z);
			
			if (xValid && yValid && zValid) {
				validPositions++;
			} else {
				console.warn(`位置 ${index} 无效: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
			}
		});
		
		console.log(`有效位置数: ${validPositions}/${positions.length}`);
		
		// 测试实际块的位置值
		console.log("=== 实际块位置测试 ===");
		if (this.pieces.length > 0) {
			const firstPiece = this.pieces[0];
			const piecePosition = cube.getPiecePosition(firstPiece);
			console.log(`第一个块的位置:`, piecePosition);
		}
		
		console.log("=== 测试完成 ===");
	};

	// 新增：测试所有层的选择
	cube.testAllLayers = function() {
		console.log("=== 四阶魔方层选择测试 ===");
		
		// 测试所有轴上的层选择
		['x', 'y', 'z'].forEach(axis => {
			console.log(`\n--- 测试轴 ${axis} ---`);
			
			const allLayerValues = cube.getLayerValues(axis);
			console.log(`轴 ${axis} 上的所有层值:`, allLayerValues);
			
			allLayerValues.forEach(layerValue => {
				const virtualPosition = {};
				virtualPosition[axis] = layerValue;
				
				const layer = cube.getLayer(virtualPosition);
				console.log(`层值 ${layerValue}: 选中 ${layer.length} 个块`);
				
				// 验证选择的块数量
				if (layer.length !== 16) {
					console.warn(`警告: 层值 ${layerValue} 选择的块数量不正确! 期望16个，实际${layer.length}个`);
				}
			});
		});
		
		// 测试面层选择
		console.log("\n--- 测试面层选择 ---");
		const faces = ['U', 'D', 'L', 'R', 'F', 'B', 'U2', 'D2', 'L2', 'R2', 'F2', 'B2'];
		
		faces.forEach(face => {
			const layer = cube.getLayerForFace(face);
			console.log(`面 ${face}: 选中 ${layer.length} 个块`);
		});
		
		console.log("=== 层选择测试完成 ===");
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

		// 四阶魔方特有的调试方法
		getLayerValues: cube.getLayerValues.bind(cube),
		validateLayerSelection: cube.validateLayerSelection.bind(cube),
		testPositions: cube.testPositions.bind(cube),
		getLayerByDragPosition: cube.getLayerByDragPosition.bind(cube),
		testAllLayers: cube.testAllLayers.bind(cube),

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
