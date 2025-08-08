import { Tween } from '../utils/tween.js'
import { Easing } from '../utils/easing.js'

/**
 * 过渡动画管理类
 * 负责处理游戏中各种UI元素和3D对象的动画过渡效果
    init() - 初始化过渡动画系统，设置初始状态
    buttons() - 处理按钮的显示/隐藏动画
    cube() - 立方体的显示/隐藏动画，包含位置和旋转变化
    float() - 立方体浮动动画，产生轻微的上下浮动和旋转效果
    zoom() - 相机缩放动画，同时控制立方体旋转
    elevate() - 立方体升降动画
    complete() - 完成/最佳成绩文字的字母翻转动画
    stats() - 统计信息的显示/隐藏动画
    preferences() - 偏好设置界面的复杂动画
    title() - 标题显示/隐藏动画
    timer() - 计时器显示/隐藏动画
    splitLetters() - 将文字分割为单个字母的辅助方法
    flipLetters() - 字母翻转动画的核心实现
 */
export class Transition {
	constructor(game) {
		this.game = game;

		// 存储各种动画实例
		this.tweens = {};
		// 存储动画持续时间
		this.durations = {};
		// 默认动画数据
		this.data = {
			cubeY: -0.2,        // 立方体的Y轴位置
			cameraZoom: 0.85,   // 相机缩放值
		};

		// 当前活跃的过渡动画数量
		this.activeTransitions = 0;
	}

	init() {
		// 禁用游戏控制器
		this.game.controls.disable();

		// 设置立方体初始位置
		this.game.cube.object.position.y = this.data.cubeY;
		this.game.controls.edges.position.y = this.data.cubeY;
		this.game.cube.animator.position.y = 4;
		this.game.cube.animator.rotation.x = -Math.PI / 3;
		
		// 设置相机初始缩放
		this.game.world.camera.zoom = this.data.cameraZoom;
		this.game.world.camera.updateProjectionMatrix();

		// 初始化各种动画数组
		this.tweens.buttons = {};
		this.tweens.timer = [];
		this.tweens.title = [];
		this.tweens.best = [];
		this.tweens.complete = [];
		this.tweens.range = [];
		this.tweens.stats = [];
	}

	buttons(show, hide) {
		// 按钮动画函数
		const buttonTween = (button, show) => {
			return new Tween({
				target: button.style,
				duration: 300,
				easing: show ? Easing.Power.Out(2) : Easing.Power.In(3),
				from: { opacity: show ? 0 : 1 },
				to: { opacity: show ? 1 : 0 },
				onUpdate: (tween) => {
					const translate = show ? 1 - tween.value : tween.value;
					button.style.transform = `translate3d(0, ${translate * 1.5}em, 0)`;
				},
				onComplete: () => (button.style.pointerEvents = show ? "all" : "none"),
			});
		};

		// 先隐藏指定按钮
		hide.forEach(
			(button) =>
				(this.tweens.buttons[button] = buttonTween(
					this.game.dom.buttons[button],
					false
				))
		);

		// 延迟显示指定按钮
		setTimeout(
			() =>
				show.forEach((button) => {
					this.tweens.buttons[button] = buttonTween(
						this.game.dom.buttons[button],
						true
					);
				}),
			hide ? 500 : 0
		);
	}

	/**
	 * 立方体显示/隐藏动画
	 * @param {boolean} show - 是否显示立方体
	 */
	cube(show) {
		this.activeTransitions++;

		// 停止之前的动画
		try {
			this.tweens.cube.stop();
		} catch (e) {}
		
		const currentY = this.game.cube.animator.position.y;
		const currentRotation = this.game.cube.animator.rotation.x;

		// 创建立方体动画
		this.tweens.cube = new Tween({
			duration: show ? 3000 : 1250,
			easing: show ? Easing.Elastic.Out(0.8, 0.6) : Easing.Back.In(1),
			onUpdate: (tween) => {
				// 更新Y轴位置
				this.game.cube.animator.position.y = show
					? (1 - tween.value) * 4
					: currentY + tween.value * 4;

				// 更新X轴旋转
				this.game.cube.animator.rotation.x = show
					? ((1 - tween.value) * Math.PI) / 3
					: currentRotation + (tween.value * -Math.PI) / 3;
			},
		});

		this.durations.cube = show ? 1500 : 1500;

		setTimeout(() => this.activeTransitions--, this.durations.cube);
	}

	/**
	 * 立方体浮动动画
	 * 让立方体产生轻微的上下浮动和旋转效果
	 */
	float() {
		try {
			this.tweens.float.stop();
		} catch (e) {}
		
		this.tweens.float = new Tween({
			duration: 1500,
			easing: Easing.Sine.InOut(),
			yoyo: true, // 来回播放
			onUpdate: (tween) => {
				// 上下浮动
				this.game.cube.holder.position.y = -0.02 + tween.value * 0.04;
				// 轻微旋转
				this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
				this.game.cube.holder.rotation.z = -this.game.cube.holder.rotation.x;
				this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;
			},
		});
	}

	/**
	 * 相机缩放动画
	 * @param {boolean} play - 是否开始游戏
	 * @param {number} time - 动画时间
	 */
	zoom(play, time) {
		this.activeTransitions++;

		const zoom = play ? 1 : this.data.cameraZoom;
		const duration = time > 0 ? Math.max(time, 1500) : 1500;
		const rotations = time > 0 ? Math.round(duration / 1500) : 1;
		const easing = Easing.Power.InOut(time > 0 ? 2 : 3);

		// 相机缩放动画
		this.tweens.zoom = new Tween({
			target: this.game.world.camera,
			duration: duration,
			easing: easing,
			to: { zoom: zoom },
			onUpdate: () => {
				this.game.world.camera.updateProjectionMatrix();
			},
		});

		// 立方体旋转动画
		this.tweens.rotate = new Tween({
			target: this.game.cube.animator.rotation,
			duration: duration,
			easing: easing,
			to: { y: -Math.PI * 2 * rotations },
			onComplete: () => {
				this.game.cube.animator.rotation.y = 0;
			},
		});

		this.durations.zoom = duration;

		setTimeout(() => this.activeTransitions--, this.durations.zoom);
	}

	/**
	 * 立方体升降动画
	 * @param {boolean} complete - 是否完成游戏
	 */
	elevate(complete) {
		this.activeTransitions++;

		const cubeY = (this.tweens.elevate = new Tween({
			target: this.game.cube.object.position,
			duration: complete ? 1500 : 0,
			easing: Easing.Power.InOut(3),
			to: { y: complete ? -0.05 : this.data.cubeY },
		}));

		this.durations.elevate = 1500;

		setTimeout(() => this.activeTransitions--, this.durations.elevate);
	}

	/**
	 * 完成/最佳成绩文字动画
	 * @param {boolean} show - 是否显示
	 * @param {boolean} best - 是否是最佳成绩
	 */
	complete(show, best) {
		this.activeTransitions++;

		const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

		// 分割文字为单个字母
		if (text.querySelector("span i") === null)
			text.querySelectorAll("span").forEach((span) => this.splitLetters(span));

		const letters = text.querySelectorAll(".icon, i");

		// 执行字母翻转动画
		this.flipLetters(best ? "best" : "complete", letters, show);

		text.style.opacity = 1;

		const duration = this.durations[best ? "best" : "complete"];

		if (!show)
			setTimeout(
				() => (this.game.dom.texts.timer.style.transform = ""),
				duration
			);

		setTimeout(() => this.activeTransitions--, duration);
	}

	/**
	 * 统计信息显示/隐藏动画
	 * @param {boolean} show - 是否显示统计信息
	 */
	stats(show) {
		if (show) this.game.scores.calcStats();

		this.activeTransitions++;

		// 停止之前的统计动画
		this.tweens.stats.forEach((tween) => {
			tween.stop();
			tween = null;
		});

		let tweenId = -1;

		const stats = this.game.dom.stats.querySelectorAll(".stats");
		const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

		// 为每个统计项创建动画
		stats.forEach((stat, index) => {
			const delay = index * (show ? 80 : 60);

			this.tweens.stats[tweenId++] = new Tween({
				delay: delay,
				duration: 400,
				easing: easing,
				onUpdate: (tween) => {
					const translate = show ? (1 - tween.value) * 2 : tween.value;
					const opacity = show ? tween.value : 1 - tween.value;

					stat.style.transform = `translate3d(0, ${translate}em, 0)`;
					stat.style.opacity = opacity;
				},
			});
		});

		this.durations.stats = 0;

		setTimeout(() => this.activeTransitions--, this.durations.stats);
	}

	/**
	 * 偏好设置界面动画
	 * @param {boolean} show - 是否显示偏好设置
	 */
	preferences(show) {
		this.activeTransitions++;

		// 停止之前的范围动画
		this.tweens.range.forEach((tween) => {
			tween.stop();
			tween = null;
		});

		let tweenId = -1;
		let listMax = 0;

		const ranges = this.game.dom.prefs.querySelectorAll(".range");
		const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

		// 为每个范围控件创建动画
		ranges.forEach((range, rangeIndex) => {
			const label = range.querySelector(".range__label");
			const track = range.querySelector(".range__track-line");
			const handle = range.querySelector(".range__handle");
			const list = range.querySelectorAll(".range__list div");

			const delay = rangeIndex * (show ? 120 : 100);

			// 设置初始状态
			label.style.opacity = show ? 0 : 1;
			track.style.opacity = show ? 0 : 1;
			handle.style.opacity = show ? 0 : 1;
			handle.style.pointerEvents = show ? "all" : "none";

			// 标签动画
			this.tweens.range[tweenId++] = new Tween({
				delay: show ? delay : delay,
				duration: 400,
				easing: easing,
				onUpdate: (tween) => {
					const translate = show ? 1 - tween.value : tween.value;
					const opacity = show ? tween.value : 1 - tween.value;

					label.style.transform = `translate3d(0, ${translate}em, 0)`;
					label.style.opacity = opacity;
				},
			});

			// 轨道动画
			this.tweens.range[tweenId++] = new Tween({
				delay: show ? delay + 100 : delay,
				duration: 400,
				easing: easing,
				onUpdate: (tween) => {
					const translate = show ? 1 - tween.value : tween.value;
					const scale = show ? tween.value : 1 - tween.value;
					const opacity = scale;

					track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`;
					track.style.opacity = opacity;
				},
			});

			// 手柄动画
			this.tweens.range[tweenId++] = new Tween({
				delay: show ? delay + 100 : delay,
				duration: 400,
				easing: easing,
				onUpdate: (tween) => {
					const translate = show ? 1 - tween.value : tween.value;
					const opacity = 1 - translate;
					const scale = 0.5 + opacity * 0.5;

					handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`;
					handle.style.opacity = opacity;
				},
			});

			// 列表项动画
			list.forEach((listItem, labelIndex) => {
				listItem.style.opacity = show ? 0 : 1;

				this.tweens.range[tweenId++] = new Tween({
					delay: show ? delay + 200 + labelIndex * 50 : delay,
					duration: 400,
					easing: easing,
					onUpdate: (tween) => {
						const translate = show ? 1 - tween.value : tween.value;
						const opacity = show ? tween.value : 1 - tween.value;

						listItem.style.transform = `translate3d(0, ${translate}em, 0)`;
						listItem.style.opacity = opacity;
					},
				});
			});

			listMax = list.length > listMax ? list.length - 1 : listMax;

			range.style.opacity = 1;
		});

		this.durations.preferences = show
			? (ranges.length - 1) * 100 + 200 + listMax * 50 + 400
			: (ranges.length - 1) * 100 + 400;

		setTimeout(() => this.activeTransitions--, this.durations.preferences);
	}

	/**
	 * 标题显示/隐藏动画
	 * @param {boolean} show - 是否显示标题
	 */
	title(show) {
		this.activeTransitions++;

		const title = this.game.dom.texts.title;

		// 分割标题文字
		if (title.querySelector("span i") === null)
			title.querySelectorAll("span").forEach((span) => this.splitLetters(span));

		const letters = title.querySelectorAll("i");

		// 执行字母翻转动画
		this.flipLetters("title", letters, show);

		title.style.opacity = 1;

		const note = this.game.dom.texts.note;

		// 注释文字动画
		this.tweens.title[letters.length] = new Tween({
			target: note.style,
			easing: Easing.Sine.InOut(),
			duration: show ? 800 : 400,
			yoyo: show ? true : null,
			from: { opacity: show ? 0 : parseFloat(getComputedStyle(note).opacity) },
			to: { opacity: show ? 1 : 0 },
		});

		setTimeout(() => this.activeTransitions--, this.durations.title);
	}

	/**
	 * 计时器显示/隐藏动画
	 * @param {boolean} show - 是否显示计时器
	 */
	timer(show) {
		this.activeTransitions++;

		const timer = this.game.dom.texts.timer;

		timer.style.opacity = 0;
		this.game.timer.convert();
		this.game.timer.setText();

		// 分割计时器文字
		this.splitLetters(timer);
		const letters = timer.querySelectorAll("i");
		this.flipLetters("timer", letters, show);

		timer.style.opacity = 1;

		setTimeout(() => this.activeTransitions--, this.durations.timer);
	}

	/**
	 * 将文字分割为单个字母
	 * @param {HTMLElement} element - 要分割的文字元素
	 */
	splitLetters(element) {
		const text = element.innerHTML;

		element.innerHTML = "";

		// 将每个字符包装在i标签中
		text.split("").forEach((letter) => {
			const i = document.createElement("i");

			i.innerHTML = letter;

			element.appendChild(i);
		});
	}

	/**
	 * 字母翻转动画
	 * @param {string} type - 动画类型
	 * @param {NodeList} letters - 字母元素列表
	 * @param {boolean} show - 是否显示
	 */
	flipLetters(type, letters, show) {
		// 停止之前的动画
		try {
			this.tweens[type].forEach((tween) => tween.stop());
		} catch (e) {}
		
		// 为每个字母创建翻转动画
		letters.forEach((letter, index) => {
			letter.style.opacity = show ? 0 : 1;

			this.tweens[type][index] = new Tween({
				easing: Easing.Sine.Out(),
				duration: show ? 800 : 400,
				delay: index * 50, // 每个字母延迟50ms
				onUpdate: (tween) => {
					const rotation = show ? (1 - tween.value) * -80 : tween.value * 80;

					letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`;
					letter.style.opacity = show ? tween.value : 1 - tween.value;
				},
			});
		});

		// 计算总动画时间
		this.durations[type] = (letters.length - 1) * 50 + (show ? 800 : 400);
	}
}