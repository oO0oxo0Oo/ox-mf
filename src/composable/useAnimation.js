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

	return {
		start,
		stop,
	}
}
