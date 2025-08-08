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
	},
};
