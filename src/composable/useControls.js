import * as THREE from "three";
import { ref, reactive, computed, readonly } from "vue";
import { Easing } from "./Easing.js";
import { useTween } from "./useTween.js";
import { useDraggable } from "./useDraggable.js";
import { useGameStore, useCubeStore } from "../stores";

// 状态常量
const STILL = 0;
const PREPARING = 1;
const ROTATING = 2;
const ANIMATING = 3;

export function useControls(targetRef, cubeInstance, camera, options = {}) {
	// 获取 store 实例
	const gameStore = useGameStore();
	const cubeStore = useCubeStore();

	// 响应式状态
	const state = ref(STILL);
	const flipConfig = ref(0);
	const scramble = ref(null);
	const gettingDrag = ref(false);
	const isScrambling = ref(false);

	// 拖拽相关状态（对应原始代码中的 this.dragNormal, this.dragCurrent 等）
	const dragState = reactive({
		normal: new THREE.Vector3(0, 0, 1),
		current: new THREE.Vector3(),
		total: new THREE.Vector3(),
		delta: new THREE.Vector3(),
		direction: null,
		intersect: null,
	});

	// 旋转相关状态（对应原始代码中的 this.flipAxis, this.flipAngle 等）
	const rotationState = reactive({
		axis: new THREE.Vector3(),
		angle: 0,
		type: "cube", // 'cube' | 'layer'
		layer: null,
	});

	// 动量记录（对应原始代码中的 this.momentum）
	const momentum = ref([]);

	// 动画配置（对应原始代码中的 this.flipEasings 和 this.flipSpeeds）
	const flipEasings = [
		Easing.Power.Out(3), // 力度缓动
		Easing.Sine.Out(), // 正弦缓动
		Easing.Back.Out(2), // 回弹缓动
	];
	const flipSpeeds = [125, 200, 350];

	// Three.js 对象（对应原始代码中的 this.raycaster, this.helper, this.edges, this.group）
	const raycaster = new THREE.Raycaster();

	const helperMaterial = new THREE.MeshBasicMaterial({
		depthWrite: false,
		transparent: true,
		opacity: 0, // 设置为半透明可见
		color: 0x0033ff,
	});

	// 辅助对象
	const helper = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20),
		helperMaterial.clone()
	);
	const edges = new THREE.Mesh(
		new THREE.BoxGeometry(0.95, 0.95, 0.95),
		helperMaterial.clone()
	);

	// 添加坐标轴辅助器
	const axesHelper = new THREE.AxesHelper(2);

	// 动画实例
	let rotationTween = null;

	// 计算属性
	const isEnabled = computed(() => state.value !== STILL);
	const isAnimating = computed(() => state.value === ANIMATING);
	const isRotating = computed(() => state.value === ROTATING);
	const canScramble = computed(
		() => !isScrambling.value && state.value === STILL
	);

	// 初始化
	function init() {
		const worldMethods = gameStore.getWorldMethods();
		if (!worldMethods || !worldMethods.scene) {
			return;
		}

		// 添加到场景（对应原始代码中的 this.game.world.scene.add）
		worldMethods.scene.add(helper);
		worldMethods.scene.add(edges);
		// worldMethods.scene.add(axesHelper);

		// 设置初始位置（对应原始代码中的 this.helper.rotation.set(0, Math.PI / 4, 0)）
		helper.rotation.set(0, Math.PI / 4, 0);

		// 将层组添加到魔方对象（对应原始代码中的 this.game.cube.object.add(this.group)）
		cubeInstance.addLayerGroup();

		// 确保 edges 对象的旋转与魔方对象同步
		if (cubeInstance && cubeInstance.object) {
			edges.rotation.copy(cubeInstance.object.rotation);
			edges.updateMatrixWorld();
		}
	}

	// 拖拽事件处理（对应原始代码中的 initDraggable 方法）
	const { enable: enableDraggable, disable: disableDraggable } = useDraggable(
		targetRef,
		{
			onDragStart: handleDragStart,
			onDragMove: handleDragMove,
			onDragEnd: handleDragEnd,
		}
	);

	// 拖拽开始事件（对应原始代码中的 this.draggable.onDragStart）
	function handleDragStart(dragPosition) {
		if (
			state.value === PREPARING ||
			state.value === ROTATING ||
			isScrambling.value
		) {
			return;
		}

		// 确保 edges 对象的旋转与魔方对象同步
		if (cubeInstance && cubeInstance.object) {
			edges.rotation.copy(cubeInstance.object.rotation);
			edges.updateMatrixWorld();
		}

		gettingDrag.value = state.value === ANIMATING;

		// 判断是否点击在边界上（对应原始代码中的 edgeIntersect 检测）
		const edgeIntersect = getIntersect(dragPosition.current, edges, false);

		if (edgeIntersect !== false) {
			// 对于层级旋转，使用局部坐标系下的法线向量
			dragState.normal = edgeIntersect.face.normal.round();
			rotationState.type = "layer";

			// 为 helper 计算世界坐标系下的法线向量
			const worldNormal = edgeIntersect.face.normal.clone();
			worldNormal.applyMatrix4(edges.matrixWorld);
			worldNormal.round();
			
			attach(helper, edges);
			helper.rotation.set(0, 0, 0);
			helper.position.set(0, 0, 0);
			helper.lookAt(worldNormal);
			helper.translateZ(0.5);

			helper.updateMatrixWorld();
			detach(helper, edges);
		} else {
			dragState.normal = new THREE.Vector3(0, 0, 1);
			rotationState.type = "cube";

			helper.position.set(0, 0, 0);
			helper.rotation.set(0, Math.PI / 4, 0);
			helper.updateMatrixWorld();
		}

		// 计算拖拽起点（对应原始代码中的 planeIntersect 检测）
		const planeIntersect = getIntersect(dragPosition.current, helper, false);
		if (planeIntersect === false) return;

		dragState.current = helper.worldToLocal(planeIntersect.point);
		dragState.total = new THREE.Vector3();

		// 如果是层旋转，需要记录点击的块
		if (rotationState.type === "layer") {
			dragState.intersect = getIntersect(
				dragPosition.current,
				getCubePieces(),
				true
			);
		}

		state.value = state.value === STILL ? PREPARING : state.value;
	}

	// 拖拽移动事件（对应原始代码中的 this.draggable.onDragMove）
	function handleDragMove(dragPosition) {
		if (scramble.value !== null || isScrambling.value) return;
		if (
			state.value === STILL ||
			(state.value === ANIMATING && !gettingDrag.value)
		)
			return;

		const planeIntersect = getIntersect(dragPosition.current, helper, false);
		if (planeIntersect === false) return;

		const point = helper.worldToLocal(planeIntersect.point.clone());
		dragState.delta = point.clone().sub(dragState.current).setZ(0);
		dragState.total.add(dragState.delta);
		dragState.current = point;
		addMomentumPoint(dragState.delta);

		if (state.value === PREPARING && dragState.total.length() > 0.05) {
			dragState.direction = cubeInstance.getMainAxis(dragState.total);
			if (rotationState.type === "layer") {
				const direction = new THREE.Vector3();
				direction[dragState.direction] = 1;

				const worldDirection = helper
					.localToWorld(direction.clone())
					.sub(helper.position);
		
				const objectDirection = edges.worldToLocal(worldDirection.clone()).round();

				rotationState.axis = objectDirection.cross(dragState.normal).negate();

				// 获取拖拽交点（对应源码中的 this.dragIntersect）
				const dragIntersect = getIntersect(dragPosition.current, getCubePieces(), true);
				if (dragIntersect === false) return;

				// 更新拖拽状态（对应源码中的 this.dragIntersect）
				dragState.intersect = dragIntersect;

				// 完全贴近源码的调用方式
				const layer = cubeInstance.getLayer(false, rotationState.axis, dragIntersect.object);
				cubeInstance.selectLayer(layer);
				rotationState.layer = layer;
			} else {
				// 整体旋转时，确定旋转轴（对应原始代码中的轴选择逻辑）
				const worldMethods = gameStore.getWorldMethods();
				const containerWidth = worldMethods?.width || 800;

				const axis =
					dragState.direction !== "x"
						? dragState.direction === "y" &&
						  dragPosition.current.x > containerWidth / 2
							? "z"
							: "x"
						: "y";

				rotationState.axis = new THREE.Vector3();
				rotationState.axis[axis] = 1 * (axis === "x" ? -1 : 1);
			}

			rotationState.angle = 0;
			state.value = ROTATING;
		} else if (state.value === ROTATING) {
			const rotation = dragState.delta[dragState.direction];

			if (rotationState.type === "layer") {
				// 使用魔方的层组进行旋转
				const layerGroup = cubeInstance.getLayerGroup();
				layerGroup.rotateOnAxis(rotationState.axis, rotation);
				rotationState.angle += rotation;
			} else {
				edges.rotateOnWorldAxis(rotationState.axis, rotation);
				if (cubeInstance && cubeInstance.object) {
					cubeInstance.object.rotation.copy(edges.rotation);
				}
				rotationState.angle += rotation;
			}
		}
	}

	// 拖拽结束事件（对应原始代码中的 this.draggable.onDragEnd）
	function handleDragEnd(dragPosition) {
		if (scramble.value !== null || isScrambling.value) return;
		if (state.value !== ROTATING) {
			gettingDrag.value = false;
			state.value = STILL;
			return;
		}

		state.value = ANIMATING;

		const momentumData = getMomentum()[dragState.direction];
		const flip =
			Math.abs(momentumData) > 0.05 &&
			Math.abs(rotationState.angle) < Math.PI / 2;

		const angle = flip
			? roundAngle(
					rotationState.angle + Math.sign(rotationState.angle) * (Math.PI / 4)
			  )
			: roundAngle(rotationState.angle);

		const delta = angle - rotationState.angle;

		if (rotationState.type === "layer") {
			rotateLayer(delta, false, (layer) => {
				state.value = gettingDrag.value ? PREPARING : STILL;
				gettingDrag.value = false;
				checkIsSolved();
			});
		} else {
			rotateCube(delta, () => {
				state.value = gettingDrag.value ? PREPARING : STILL;
				gettingDrag.value = false;
			});
		}
	}

	// 层旋转动画（对应原始代码中的 rotateLayer 方法）
	function rotateLayer(rotation, isScramble, callback) {
		const config = isScramble ? 0 : flipConfig.value;
		const easing = flipEasings[config];
		const duration = flipSpeeds[config];
		const bounce = config === 2 ? bounceCube() : () => {};

		// 获取魔方的层组
		const layerGroup = cubeInstance.getLayerGroup();

		rotationTween = useTween({
			easing: easing,
			duration: duration,
			onUpdate: (tween) => {
				let deltaAngle = tween.delta * rotation;
				layerGroup.rotateOnAxis(rotationState.axis, deltaAngle);
				bounce(tween.value, deltaAngle, rotation);
			},
			onComplete: () => {
				if (!isScramble) {
					// 触发移动回调
					if (options.onMove) options.onMove();
				}

				const layer = rotationState.layer ? [...rotationState.layer] : [];

				// 自动吸附到最近的直角
				const snappedGroup = snapRotation(
					new THREE.Vector3(
						layerGroup.rotation.x,
						layerGroup.rotation.y,
						layerGroup.rotation.z
					)
				);
				layerGroup.rotation.set(snappedGroup.x, snappedGroup.y, snappedGroup.z);
				cubeInstance.deselectLayer(rotationState.layer);
				rotationState.layer = null;
				callback(layer);
			},
		});
	}

	// 回弹动画辅助（对应原始代码中的 bounceCube 方法）
	function bounceCube() {
		let fixDelta = true;

		return (progress, delta, rotation) => {
			if (progress >= 1) {
				if (fixDelta) {
					delta = (progress - 1) * rotation;
					fixDelta = false;
				}

				// 对整个魔方对象应用回弹效果
				if (cubeInstance && cubeInstance.object) {
					cubeInstance.object.rotateOnAxis(rotationState.axis, delta);
				}
			}
		};
	}

	// 整体旋转动画（对应原始代码中的 rotateCube 方法）
	function rotateCube(rotation, callback) {
		const config = flipConfig.value;
		const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][
			config
		];
		const duration = [100, 150, 350][config];

		rotationTween = useTween({
			easing: easing,
			duration: duration,
			onUpdate: (tween) => {
				edges.rotateOnWorldAxis(rotationState.axis, tween.delta * rotation);
				if (cubeInstance && cubeInstance.object) {
					cubeInstance.object.rotation.copy(edges.rotation);
				}
			},
			onComplete: () => {
				// 自动吸附到最近的直角
				edges.rotation.setFromVector3(
					snapRotation(
						new THREE.Vector3(
							edges.rotation.x,
							edges.rotation.y,
							edges.rotation.z
						)
					)
				);
				if (cubeInstance && cubeInstance.object) {
					cubeInstance.object.rotation.copy(edges.rotation);
				}
				callback();
			},
		});
	}

	// 魔方打乱动画
	function scrambleCube(length = 20) {
		if (isScrambling.value || state.value !== STILL) {
			return;
		}

		isScrambling.value = true;

		// 直接使用魔方实例的打乱方法
		cubeInstance.scrambleCube(
			length,
			() => {
				isScrambling.value = false;
				if (options.onScrambleComplete) {
					options.onScrambleComplete();
				}
			},
			(angle, rotationAxis, callback) => {
				// 设置旋转状态
				rotationState.axis = rotationAxis;
				rotationState.type = "layer";

				// 执行层旋转
				rotateLayer(angle, true, callback);
			}
		);
	}

	// 获取鼠标与物体的交点（对应原始代码中的 getIntersect 方法）
	function getIntersect(position, object, multiple) {
		if (!camera) return false;

		raycaster.setFromCamera(convertPosition(position.clone()), camera);

		const intersect = multiple
			? raycaster.intersectObjects(object)
			: raycaster.intersectObject(object);

		return intersect.length > 0 ? intersect[0] : false;
	}

	// 坐标转换（对应原始代码中的 this.draggable.convertPosition）
	function convertPosition(position) {
		if (!targetRef.value) return position;

		const rect = targetRef.value.getBoundingClientRect();
		position.x = ((position.x - rect.left) / rect.width) * 2 - 1;
		position.y = -((position.y - rect.top) / rect.height) * 2 + 1;
		return position;
	}

	// 将子对象从父对象分离（对应原始代码中的 detach 方法）
	function detach(child, parent) {
		child.applyMatrix4(parent.matrixWorld);
		parent.remove(child);
		const worldMethods = gameStore.getWorldMethods();
		if (worldMethods?.scene) {
			worldMethods.scene.add(child);
		}
	}

	// 将子对象附加到父对象（对应原始代码中的 attach 方法）
	function attach(child, parent) {
		const inverseMatrix = new THREE.Matrix4().copy(parent.matrixWorld).invert();
		
		child.applyMatrix4(inverseMatrix);
		const worldMethods = gameStore.getWorldMethods();
		if (worldMethods?.scene) {
			worldMethods.scene.remove(child);
		}
		parent.add(child);
	}

	// 添加动量点（对应原始代码中的 addMomentumPoint 方法）
	function addMomentumPoint(delta) {
		const time = Date.now();
		momentum.value = momentum.value.filter(
			(moment) => time - moment.time < 500
		);
		if (delta !== false) momentum.value.push({ delta, time });
	}

	// 计算动量（对应原始代码中的 getMomentum 方法）
	function getMomentum() {
		const points = momentum.value.length;
		const momentumVector = new THREE.Vector2();

		addMomentumPoint(false);

		momentum.value.forEach((point, index) => {
			momentumVector.add(point.delta.multiplyScalar(index / points));
		});

		return momentumVector;
	}

	// 角度四分之一圆整（对应原始代码中的 roundAngle 方法）
	function roundAngle(angle) {
		const round = Math.PI / 2;
		const rounded =
			Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
		return rounded;
	}

	// 旋转向量吸附到最近的直角（对应原始代码中的 snapRotation 方法）
	function snapRotation(angle) {
		const snapped = angle.set(
			roundAngle(angle.x),
			roundAngle(angle.y),
			roundAngle(angle.z)
		);
		return snapped;
	}

	// 检查魔方是否还原（对应原始代码中的 checkIsSolved 方法）
	function checkIsSolved() {
		// 使用魔方实例的方法
		const isSolved = cubeInstance.checkIsSolved();

		if (isSolved && options.onSolved) {
			options.onSolved();
		}
	}

	// 启用拖拽（对应原始代码中的 enable 方法）
	function enable() {
		// 如果正在打乱，不启用控制
		if (isScrambling.value) {
			return;
		}

		// 确保 edges 对象的旋转与魔方对象同步
		if (cubeInstance && cubeInstance.object) {
			edges.rotation.copy(cubeInstance.object.rotation);
			edges.updateMatrixWorld();
		}
		enableDraggable();
	}

	// 禁用拖拽（对应原始代码中的 disable 方法）
	function disable() {
		disableDraggable();
	}

	// 获取魔方对象（对应原始代码中的 this.game.cube.object）
	function getCubeObject() {
		return cubeInstance ? cubeInstance.object : null;
	}

	// 获取魔方块数组（对应原始代码中的 this.game.cube.pieces）
	function getCubePieces() {
		return cubeInstance ? cubeInstance.pieces : [];
	}

	// 清理函数
	function cleanup() {
		if (rotationTween) {
			rotationTween.stop();
		}

		// 重置打乱状态
		isScrambling.value = false;

		const worldMethods = gameStore.getWorldMethods();
		if (worldMethods?.scene) {
			worldMethods.scene.remove(helper);
			worldMethods.scene.remove(edges);
		}
	}

	return {
		// 状态
		state: readonly(state),
		isEnabled,
		isAnimating,
		isRotating,
		canScramble,
		isScrambling: readonly(isScrambling),

		// 方法
		init,
		enable,
		disable,
		cleanup,

		// 动画方法
		rotateLayer,
		rotateCube,
		scrambleCube,

		// 工具方法
		getCubeObject,
		getCubePieces,

		// 内部状态（用于调试）
		dragState: readonly(dragState),
		rotationState: readonly(rotationState),
		momentum: readonly(momentum),
	};
}
