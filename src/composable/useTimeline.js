import { useTween } from './useTween.js';

/**
 * 时间线动画管理器
 * 支持按顺序执行动画序列，每个动画可以设置延迟、持续时间等参数
 */
export function useTimeline() {
    // 存储时间线动画序列
    let timeline = [];
    // 当前执行的动画索引
    let currentIndex = 0;
    // 时间线状态
    let isPlaying = false;
    // 是否循环播放
    let isLooping = false;
    // 当前动画实例
    let currentTween = null;
    // 时间线总时长
    let totalDuration = 0;
    // 回调函数 - 支持多个监听器
    let callbacks = {
        onStart: [],
        onUpdate: [],
        onComplete: [],
        onStep: []
    };

    /**
     * 添加动画到时间线
     * @param {Object} animation - 动画配置
     * @param {Function} animation.update - 动画更新函数
     * @param {number} animation.duration - 动画持续时间
     * @param {number} animation.delay - 延迟时间
     * @param {Function} animation.easing - 缓动函数
     * @param {Function} animation.onComplete - 动画完成回调
     * @param {string} animation.name - 动画名称
     */
    function add(animation) {
        const timelineItem = {
            ...animation,
            id: timeline.length,
            startTime: totalDuration + (animation.delay || 0),
            endTime: totalDuration + (animation.delay || 0) + (animation.duration || 500)
        };
        
        timeline.push(timelineItem);
        totalDuration = Math.max(totalDuration, timelineItem.endTime);
        
        return timelineItem;
    }

    /**
     * 添加简单的属性动画
     * @param {Object} target - 目标对象
     * @param {Object} to - 目标属性值
     * @param {Object} options - 动画选项
     */
    function addTween(target, to, options = {}) {
        const {
            duration = 500,
            delay = 0,
            easing = (t) => t,
            name = `tween_${timeline.length}`,
            onComplete = null
        } = options;

        add({
            name,
            duration,
            delay,
            easing,
            onComplete,
            update: (progress) => {
                // 简单的线性插值
                Object.keys(to).forEach(key => {
                    if (target[key] !== undefined) {
                        const from = target[key];
                        target[key] = from + (to[key] - from) * progress;
                    }
                });
            }
        });
    }

    /**
     * 添加自定义动画
     * @param {Function} updateFn - 更新函数
     * @param {Object} options - 动画选项
     */
    function addCustom(updateFn, options = {}) {
        const {
            duration = 500,
            delay = 0,
            name = `custom_${timeline.length}`,
            onComplete = null
        } = options;

        add({
            name,
            duration,
            delay,
            onComplete,
            update: updateFn
        });
    }

    /**
     * 播放时间线
     */
    function play() {
        if (isPlaying) return;
        
        isPlaying = true;
        currentIndex = 0;
        
        callbacks.onStart.forEach(callback => callback && callback());
        
        playNext();
    }

    /**
     * 播放下一个动画
     */
    function playNext() {
        if (currentIndex >= timeline.length) {
            complete();
            return;
        }

        const item = timeline[currentIndex];
        
        callbacks.onStep.forEach(callback => callback && callback(item, currentIndex));
        
        // 创建Tween动画
        currentTween = useTween({
            duration: item.duration,
            easing: item.easing || ((t) => t),
            onUpdate: (state) => {
                item.update(state.value);
                callbacks.onUpdate.forEach(callback => callback && callback(state, item, currentIndex));
            },
            onComplete: () => {
                if (item.onComplete) item.onComplete();
                currentIndex++;
                playNext();
            }
        });
    }

    /**
     * 暂停时间线
     */
    function pause() {
        isPlaying = false;
        if (currentTween) {
            currentTween.stop();
        }
    }

    /**
     * 停止时间线
     */
    function stop() {
        isPlaying = false;
        currentIndex = 0;
        if (currentTween) {
            currentTween.stop();
            currentTween = null;
        }
    }

    /**
     * 重置时间线
     */
    function reset() {
        stop();
        timeline = [];
        totalDuration = 0;
        // 清空所有回调
        callbacks.onStart = [];
        callbacks.onUpdate = [];
        callbacks.onComplete = [];
        callbacks.onStep = [];
    }

    /**
     * 跳转到指定动画
     * @param {number} index - 动画索引
     */
    function seek(index) {
        if (index < 0 || index >= timeline.length) return;
        
        stop();
        currentIndex = index;
        play();
    }

    /**
     * 完成时间线
     */
    function complete() {
        isPlaying = false;
        currentTween = null;
        
        callbacks.onComplete.forEach(callback => callback && callback());
        
        if (isLooping) {
            currentIndex = 0;
            setTimeout(() => play(), 100);
        }
    }

    /**
     * 设置循环播放
     * @param {boolean} loop - 是否循环
     */
    function setLoop(loop) {
        isLooping = loop;
    }

    /**
     * 添加回调函数
     * @param {string} type - 回调类型
     * @param {Function} callback - 回调函数
     */
    function on(type, callback) {
        const eventType = 'on' + type.charAt(0).toUpperCase() + type.slice(1);
        if (callbacks.hasOwnProperty(eventType)) {
            callbacks[eventType].push(callback);
        }
    }

    /**
     * 移除回调函数
     * @param {string} type - 回调类型
     * @param {Function} callback - 回调函数
     */
    function off(type, callback) {
        const eventType = 'on' + type.charAt(0).toUpperCase() + type.slice(1);
        if (callbacks.hasOwnProperty(eventType)) {
            const index = callbacks[eventType].indexOf(callback);
            if (index > -1) {
                callbacks[eventType].splice(index, 1);
            }
        }
    }

    /**
     * 获取时间线信息
     */
    function getInfo() {
        return {
            isPlaying,
            currentIndex,
            totalItems: timeline.length,
            totalDuration,
            isLooping
        };
    }

    /**
     * 获取时间线项目列表
     */
    function getTimelineItems() {
        return timeline;
    }

    return {
        add,
        addTween,
        addCustom,
        play,
        pause,
        stop,
        reset,
        seek,
        setLoop,
        on,
        off,
        getInfo,
        getTimelineItems
    };
}
