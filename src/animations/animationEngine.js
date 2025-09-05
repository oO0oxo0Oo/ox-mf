let uniqueID = 0;

/**
 * 动画引擎 - 单例模式实现
 * 负责管理所有动画的生命周期和渲染循环
 */
class AnimationEngine {
	constructor() {
		this.ids = [];
		this.animations = {};
		this.raf = 0;
		this.time = 0;
		this.isDestroyed = false;
		this.isPaused = false;
		
		// 绑定方法上下文
		this.update = this.update.bind(this);
		
		// 监听页面可见性变化
		this.setupVisibilityListener();
	}

	/**
	 * 主更新循环 - 使用 RAF 优化性能
	 */
	update() {
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

		// 倒序遍历，支持动画在更新过程中移除自身
		while (i--) {
			this.animations[this.ids[i]] &&
				this.animations[this.ids[i]].update(delta);
		}
	}

	/**
	 * 添加动画到引擎
	 */
	add(animation) {
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

	/**
	 * 从引擎移除动画
	 */
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

	/**
	 * 暂停所有动画
	 */
	pause() {
		if (this.isPaused || this.isDestroyed) return;
		this.isPaused = true;
	}

	/**
	 * 恢复所有动画
	 */
	resume() {
		if (!this.isPaused || this.isDestroyed) return;
		
		// 重置时间基准，避免时间跳跃
		this.time = performance.now();
		this.isPaused = false;
		
		// 确保RAF循环在运行
		if (this.ids.length > 0 && this.raf === 0) {
			this.raf = requestAnimationFrame(this.update);
		}
	}

	/**
	 * 销毁引擎，清理所有资源
	 */
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

	/**
	 * 获取当前状态
	 */
	getStatus() {
		return {
			activeAnimations: this.ids.length,
			isRunning: this.raf !== 0,
			isDestroyed: this.isDestroyed,
			isPaused: this.isPaused
		};
	}

	/**
	 * 设置页面可见性监听器
	 */
	setupVisibilityListener() {
		// 页面可见性API监听
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.pause();
			} else {
				this.resume();
				this.notifyPageVisible();
			}
		});

		// 窗口焦点监听（兼容性更好）
		window.addEventListener('blur', () => {
			this.pause();
		});

		window.addEventListener('focus', () => {
			this.resume();
			this.notifyPageVisible();
		});
	}

	/**
	 * 通知页面重新可见
	 */
	notifyPageVisible() {
		window.dispatchEvent(new CustomEvent('pageVisible'));
	}
}

// 单例实例 - 直接导出类实例
export const animationEngine = new AnimationEngine();