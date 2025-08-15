let uniqueID = 0;

// 使用闭包实现单例模式
class AnimationEngine {
	constructor() {
		this.ids = [];
		this.animations = {};
		this.update = this.update.bind(this);
		this.raf = 0;
		this.time = 0;
		this.isDestroyed = false; // 添加销毁标志
	}

	update() {
		// 如果已销毁，停止更新
		if (this.isDestroyed) return;
		
		const now = performance.now();
		const delta = now - this.time;
		this.time = now;

		let i = this.ids.length;

		// 只有在有动画时才继续 RAF
		this.raf = i ? requestAnimationFrame(this.update) : 0;

		while (i--)
			this.animations[this.ids[i]] &&
				this.animations[this.ids[i]].update(delta);
	}

	add(animation) {
		// 如果已销毁，不允许添加新动画
		if (this.isDestroyed) return;
		
		animation.id = uniqueID++;

		this.ids.push(animation.id);
		this.animations[animation.id] = animation;

		// 如果 RAF 未运行，启动它
		if (this.raf === 0) {
			this.time = performance.now();
			this.raf = requestAnimationFrame(this.update);
		}
	}

	remove(animation) {
		const index = this.ids.indexOf(animation.id);

		if (index < 0) return;

		this.ids.splice(index, 1);
		delete this.animations[animation.id];
		animation = null;
		
		// 如果没有动画了，停止 RAF
		if (this.ids.length === 0 && this.raf !== 0) {
			cancelAnimationFrame(this.raf);
			this.raf = 0;
		}
	}

	// 添加销毁方法
	destroy() {
		this.isDestroyed = true;
		
		// 清理所有动画
		this.ids.forEach(id => {
			if (this.animations[id]) {
				delete this.animations[id];
			}
		});
		this.ids = [];
		
		// 停止 RAF
		if (this.raf !== 0) {
			cancelAnimationFrame(this.raf);
			this.raf = 0;
		}
	}

	// 获取当前状态
	getStatus() {
		return {
			activeAnimations: this.ids.length,
			isRunning: this.raf !== 0,
			isDestroyed: this.isDestroyed
		};
	}
}

// 确保单例模式
let instance = null;

export const animationEngine = {
	getInstance() {
		if (!instance) {
			instance = new AnimationEngine();
		}
		return instance;
	},
	
	// 兼容性方法
	add(animation) {
		return this.getInstance().add(animation);
	},
	
	remove(animation) {
		return this.getInstance().remove(animation);
	},
	
	destroy() {
		if (instance) {
			instance.destroy();
			instance = null;
		}
	},
	
	getStatus() {
		return instance ? instance.getStatus() : { activeAnimations: 0, isRunning: false, isDestroyed: true };
	}
};