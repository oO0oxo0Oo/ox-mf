import { useAnimation } from "./useAnimation";

export function useTween(options) {
    // 解构参数，保持与类构造函数一致
    const {
        duration = 500,
        easing = (t) => t,
        onUpdate = () => {},
        onComplete = () => {},
        delay = false,
        yoyo = false,
        target = null,
        from = {},
        to = null
    } = options;

    // 用 let 定义可变状态，模拟类属性
    let progress = 0;
    let value = 0;
    let delta = 0;
    let values = [];
    let yoyoDirection = 1; // 1: 正向, -1: 反向
    let yoyoMode = yoyo ? true : false; // 是否启用 yoyo
    let yoyoFlag = false; // 当前是否处于反向

    if (!target || !to) {
        values = null;
        // 如果没有 target 和 to，仍然可以执行动画，只是不更新目标属性
    } else {
        if (Object.keys(from).length < 1) {
            Object.keys(to).forEach((key) => {
                from[key] = target[key];
            });
        }
        Object.keys(to).forEach((key) => {
            values.push(key);
        });
    }

    // 状态对象
    const state = {
        get progress() { return progress; },
        get value() { return value; },
        get delta() { return delta; },
        target,
        from,
        to,
        values,
        duration,
        easing,
        get yoyo() { return yoyoMode; },
        set yoyo(val) { yoyoMode = val; },
        // 兼容 yoyo 反转
        get yoyoDirection() { return yoyoDirection; },
        set yoyoDirection(val) { yoyoDirection = val; }
    };

    // 动画调度
    const { start: startAnim, stop: stopAnim } = useAnimation(update);

    // 延迟启动
    if (delay) setTimeout(() => startAnim(), delay);
    else startAnim();

    onUpdate(state);

    function update(frameDelta = 16.7) {
        // 记录旧值
        const old = value;
        // yoyo 模式下方向反转
        const direction = yoyoMode && yoyoFlag ? -1 : 1;
        yoyoDirection = direction;

        // 更新进度
        progress += (frameDelta / duration) * direction;

        // 计算当前插值
        value = easing(progress);
        delta = value - old;

        // 如果有属性插值，更新目标属性
        if (values !== null) updateFromTo();

        // yoyo 模式处理，否则正常更新或结束
        if (yoyoMode) {
            updateYoyo();
        } else if (progress <= 1) {
            onUpdate(state);
        } else {
            // 动画结束，修正进度，触发回调，停止动画
            progress = 1;
            value = 1;
            onUpdate(state);
            onComplete(state);
            stopAnim();
        }
    }

    function updateYoyo() {
        if (progress > 1 || progress < 0) {
            // 到达边界，反转方向
            value = progress = progress > 1 ? 1 : 0;
            yoyoFlag = !yoyoFlag;
        }
        // 每次都执行 onUpdate
        onUpdate(state);
    }

    // 根据 from/to/target 插值更新目标属性
    function updateFromTo() {
        values.forEach((key) => {
            target[key] = from[key] + (to[key] - from[key]) * value;
        });
    }

    // 返回与类实例类似的接口
    return {
        state,
        start: startAnim,
        stop: stopAnim
    };
}