// Easing 缓动函数集合，包含多种常用的缓动算法
export const Easing = {
	// 幂函数缓动（Power）
	Power: {
		// 先加速后减速（缓入）
		In: (power) => {
			// 默认幂为1，向下取整
			power = Math.round(power || 1);

			// 返回缓入函数，t为当前进度（0~1）
			return (t) => Math.pow(t, power);
		},

		// 先减速后加速（缓出）
		Out: (power) => {
			power = Math.round(power || 1);

			// 返回缓出函数
			return (t) => 1 - Math.abs(Math.pow(t - 1, power));
		},

		// 先加速后减速（缓入缓出）
		InOut: (power) => {
			power = Math.round(power || 1);

			// 返回缓入缓出函数
			return (t) =>
				t < 0.5
					? Math.pow(t * 2, power) / 2 // 前半段缓入
					: (1 - Math.abs(Math.pow(t * 2 - 1 - 1, power))) / 2 + 0.5; // 后半段缓出
		},
	},

	// 正弦缓动（Sine）
	Sine: {
		// 正弦缓入
		In: () => (t) => 1 + Math.sin((Math.PI / 2) * t - Math.PI / 2),

		// 正弦缓出
		Out: () => (t) => Math.sin((Math.PI / 2) * t),

		// 正弦缓入缓出
		InOut: () => (t) => (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2,
	},

	// 回退缓动（Back）
	Back: {
		// 回退缓出，带有回弹效果
		Out: (s) => {
			// s 控制回弹幅度，默认1.70158
			s = s || 1.70158;

			return (t) => {
				// t -= 1 使曲线从1回弹到0
				return (t -= 1) * t * ((s + 1) * t + s) + 1;
			};
		},

		// 回退缓入，带有回弹效果
		In: (s) => {
			s = s || 1.70158;

			return (t) => {
				return t * t * ((s + 1) * t - s);
			};
		},
	},

	// 弹性缓动（Elastic）
	Elastic: {
		// 弹性缓出，带有弹跳效果
		Out: (amplitude, period) => {
			// PI2 表示2π
			let PI2 = Math.PI * 2;

			// p1: 振幅，p2: 周期，p3: 相位偏移
			let p1 = amplitude >= 1 ? amplitude : 1;
			let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1);
			let p3 = (p2 / PI2) * (Math.asin(1 / p1) || 0);

			p2 = PI2 / p2;

			// 返回弹性缓出函数
			return (t) => {
				return p1 * Math.pow(2, -10 * t) * Math.sin((t - p3) * p2) + 1;
			};
		},

		// 弹性缓入，带有弹跳效果
		In: (amplitude, period) => {
			let PI2 = Math.PI * 2;
			let p1 = amplitude >= 1 ? amplitude : 1;
			let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1);
			let p3 = (p2 / PI2) * (Math.asin(1 / p1) || 0);

			p2 = PI2 / p2;

			return (t) => {
				return -p1 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - p3) * p2);
			};
		},

		// 弹性缓入缓出
		InOut: (amplitude, period) => {
			let PI2 = Math.PI * 2;
			let p1 = amplitude >= 1 ? amplitude : 1;
			let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1);
			let p3 = (p2 / PI2) * (Math.asin(1 / p1) || 0);

			p2 = PI2 / p2;

			return (t) => {
				if (t < 0.5) {
					return -p1 / 2 * Math.pow(2, 10 * (t * 2 - 1)) * Math.sin((t * 2 - p3) * p2);
				} else {
					return p1 / 2 * Math.pow(2, -10 * ((t * 2 - 1) - 1)) * Math.sin(((t * 2 - 1) - p3) * p2) + 1;
				}
			};
		},
	},

	// 二次缓动（Quad）
	Quad: {
		In: () => (t) => t * t,
		Out: () => (t) => t * (2 - t),
		InOut: () => (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
	},

	// 三次缓动（Cubic）
	Cubic: {
		In: () => (t) => t * t * t,
		Out: () => (t) => (--t) * t * t + 1,
		InOut: () => (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
	},

	// 四次缓动（Quart）
	Quart: {
		In: () => (t) => t * t * t * t,
		Out: () => (t) => 1 - (--t) * t * t * t,
		InOut: () => (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
	},

	// 指数缓动（Expo）
	Expo: {
		In: () => (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
		Out: () => (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
		InOut: () => (t) => {
			if (t === 0) return 0;
			if (t === 1) return 1;
			if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
			return (2 - Math.pow(2, -20 * t + 10)) / 2;
		},
	},

	// 圆形缓动（Circ）
	Circ: {
		In: () => (t) => 1 - Math.sqrt(1 - t * t),
		Out: () => (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
		InOut: () => (t) => {
			if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
			return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
		},
	},

	// 平滑缓动（Smooth）
	Smooth: {
		// 平滑缓入缓出，类似二次缓动但更平滑
		InOut: () => (t) => {
			return t < 0.5 
				? 2 * t * t 
				: 1 - Math.pow(-2 * t + 2, 2) / 2;
		},

		// 平滑缓入
		In: () => (t) => t * t * (3 - 2 * t),

		// 平滑缓出
		Out: () => (t) => 1 - (1 - t) * (1 - t) * (3 - 2 * (1 - t)),
	},

	// 弹跳缓动（Bounce）
	Bounce: {
		Out: () => (t) => {
			if (t < 1 / 2.75) {
				return 7.5625 * t * t;
			} else if (t < 2 / 2.75) {
				return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
			} else if (t < 2.5 / 2.75) {
				return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
			} else {
				return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
			}
		},

		In: () => (t) => 1 - Easing.Bounce.Out()(1 - t),

		InOut: () => (t) => {
			if (t < 0.5) {
				return Easing.Bounce.In()(t * 2) / 2;
			} else {
				return Easing.Bounce.Out()(t * 2 - 1) / 2 + 0.5;
			}
		},
	},
};

/**
 * 缓动函数使用示例和说明
 * 
 * 基本用法：
 * const easing = Easing.Power.Out(3);  // 创建缓动函数
 * const easedValue = easing(progress); // 使用缓动函数，progress 为 0-1 的进度值
 * 
 * 常用缓动函数推荐：
 * 
 * 1. 自然运动：
 *   - Easing.Power.Out(2)     // 二次缓出，最自然的减速效果
 *   - Easing.Power.Out(3)     // 三次缓出，更平滑的减速
 *   - Easing.Sine.InOut()     // 正弦缓入缓出，非常平滑
 * 
 * 2. 弹性效果：
 *   - Easing.Elastic.Out(1.2, 0.3)  // 弹性缓出，适合弹跳效果
 *   - Easing.Back.Out(1.7)           // 回退缓出，轻微回弹
 * 
 * 3. 快速开始，慢速结束：
 *   - Easing.Power.In(2)      // 二次缓入
 *   - Easing.Power.In(3)      // 三次缓入
 * 
 * 4. 平滑过渡：
 *   - Easing.Smooth.InOut()   // 平滑缓入缓出
 *   - Easing.Cubic.InOut()    // 三次缓入缓出
 * 
 * 5. 特殊效果：
 *   - Easing.Bounce.Out()     // 弹跳效果
 *   - Easing.Expo.Out()       // 指数衰减
 * 
 * 参数说明：
 * - Power.In/Out/InOut(power): power 控制曲线陡峭程度，越大越陡峭
 * - Elastic.Out(amplitude, period): amplitude 控制振幅，period 控制周期
 * - Back.Out(s): s 控制回弹幅度，默认 1.70158
 * 
 * 性能提示：
 * - 对于频繁调用的动画，建议缓存缓动函数实例
 * - 避免在动画循环中重复创建缓动函数
 */
