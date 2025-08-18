import * as THREE from "three";

export function useDraggable(targetRef, options={}) {
    const position = {
        current: new THREE.Vector2(),
        start: new THREE.Vector2(),
        delta: new THREE.Vector2(),
        old: new THREE.Vector2(),
        drag: new THREE.Vector2(), 
    }

    options = Object.assign(
        {
            calcDelta: false, // 是否计算拖拽增量
        },
        options || {}
    );
    const container = targetRef.value;
    let touch = null;
    
    const {
        calcDelta = false,
        onDragStart = () => {},
        onDragMove = () => {},
        onDragEnd = () => {}
    } = options;
    
    const drag = {
        start: (event) => {
            
            if (event.type == "mousedown" && event.which != 1) return;
            if (event.type == "touchstart" && event.touches.length > 1) return;

            getPositionCurrent(event);

            if (calcDelta) {
                position.start = position.current.clone();
                position.delta.set(0, 0);
                position.drag.set(0, 0); // 修复：使用正确的属性名
            }

            touch = event.type == "touchstart";

            onDragStart(position);

            window.addEventListener(touch ? "touchmove" : "mousemove", drag.move, false);
            window.addEventListener(touch ? "touchend" : "mouseup", drag.end, false);
        },
        move: (event) => {
            if (calcDelta) {
                position.old = position.current.clone();
            }

            getPositionCurrent(event);

            if(calcDelta) {
                position.delta = position.current.clone().sub(position.old);
                position.drag = position.current.clone().sub(position.start); // 修复：使用正确的属性名
            }

            onDragMove(position);
        },
        end: (event) => {
            getPositionCurrent(event);

            onDragEnd(position);

            window.removeEventListener(touch ? "touchmove" : "mousemove", drag.move, false);
            window.removeEventListener(touch ? "touchend" : "mouseup", drag.end, false);
        }
    }

    function enable() {
        container.addEventListener("touchstart", drag.start, false);
        container.addEventListener("mousedown", drag.start, false);   
    }

    function disable() {
        container.removeEventListener("touchstart", drag.start, false);
        container.removeEventListener("mousedown", drag.start, false);
    }

    function getPositionCurrent(event) {
        const dragEvent = event.touches
        ? event.touches[0] || event.changedTouches[0]
        : event;

        position.current.set(dragEvent.clientX, dragEvent.clientY);
    }

    function convertPosition(position) {
        const rect = container.getBoundingClientRect();
        position.x = ((position.x - rect.left) / rect.width) * 2 - 1;
        position.y = -((position.y - rect.top) / rect.height) * 2 + 1;

        return position;
    }

    return {
        position,
        enable,
        disable,
        convertPosition
    }
}