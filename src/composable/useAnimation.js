import { animationEngine } from '../animations/animationEngine';

export function useAnimation(updateFn) {
    let animation = {
        update: updateFn,
    };
    
    function start() {
        animationEngine.add(animation);
    }
    
    function stop() {
        animationEngine.remove(animation);
    }

    // 添加销毁方法
    function destroy() {
        stop();
        animation = null;
    }

    return {
        start,
        stop,
        destroy,
        // 获取动画引擎状态
        getStatus: () => animationEngine.getStatus()
    }
}
