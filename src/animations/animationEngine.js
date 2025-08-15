let uniqueID = 0;

// 使用闭包实现单例模式
class AnimationEngine {
	constructor() {
		this.ids = [];
		this.animations = {};
		this.update = this.update.bind(this);
		this.raf = 0;
		this.time = 0;
		this.isDestroyed = false;
		this.isPaused = false;
		
		// 监听页面可见性变化
		this.setupVisibilityListener();
	}

	update() {
		// 如果已销毁，停止更新
		if (this.isDestroyed) return;
		
		const now = performance.now();
		let delta = now - this.time;
		
		// 限制delta最大值，防止长时间暂停后的跳跃
		if (delta > 100) {
			delta = 16.67; // 限制为一帧的时间
		}
		
		this.time = now;

		let i = this.ids.length;

		// 只有在有动画时才继续 RAF
		this.raf = i ? requestAnimationFrame(this.update) : 0;

		// 如果暂停，不执行动画更新，但继续RAF循环
		if (this.isPaused) return;

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

	// 设置页面可见性监听器
	setupVisibilityListener() {
		// 页面可见性API监听
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.pauseAnimations();
			} else {
				this.resumeAnimations();
				this.notifyPageVisible();
			}
		});

		// 窗口焦点监听（兼容性更好）
		window.addEventListener('blur', () => {
			this.pauseAnimations();
		});

		window.addEventListener('focus', () => {
			this.resumeAnimations();
			this.notifyPageVisible();
		});
	}

	// 通知页面重新可见
	notifyPageVisible() {
		// 派发自定义事件，让其他模块知道页面重新可见
		window.dispatchEvent(new CustomEvent('pageVisible'));
	}

	// 暂停所有动画
	pauseAnimations() {
		if (this.isPaused || this.isDestroyed) return;
		this.isPaused = true;
	}

	// 恢复所有动画
	resumeAnimations() {
		if (!this.isPaused || this.isDestroyed) return;
		
		// 重置时间基准，避免时间跳跃
		this.time = performance.now();
		this.isPaused = false;
		
		// 确保RAF循环在运行
		if (this.ids.length > 0 && this.raf === 0) {
			this.raf = requestAnimationFrame(this.update);
		}
	}

	// 获取当前状态
	getStatus() {
		return {
			activeAnimations: this.ids.length,
			isRunning: this.raf !== 0,
			isDestroyed: this.isDestroyed,
			isPaused: this.isPaused
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
	
	// 暂停和恢复方法
	pause() {
		return instance ? instance.pauseAnimations() : null;
	},
	
	resume() {
		return instance ? instance.resumeAnimations() : null;
	},
	
	getStatus() {
		return instance ? instance.getStatus() : { activeAnimations: 0, isRunning: false, isDestroyed: true, isPaused: false };
	}
};