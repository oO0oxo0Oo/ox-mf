<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { useAnimation } from '../composable/useAnimation';

defineOptions({
    name: 'World'
});

const props = defineProps({
    fov: {
        type: Number,
        default: 10
    },
    stage: {
        type: Object,
        default: () => ({ width: 2, height: 3 })
    },
    background: {
        type: [Number, String],
        default: null
    },
    enableShadows: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['resize']);

const containerRef = ref(null);

let scene, camera, renderer, lights;

onMounted(() => {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(2,1,0.1,10000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.value.appendChild(renderer.domElement);

    renderer.render(scene, camera);

    // 创建灯光
    createLights();

    // 场景已准备好，等待魔方初始化
    console.log('World场景已初始化，等待魔方组件');

    resize();
    window.addEventListener('resize', resize);

    if(props.enableShadows) enableShadows();
    
    // 启动动画循环
    startAnim();
})

onUnmounted(() => {
    window.removeEventListener('resize', resize);
    // 停止并销毁动画循环
    stopAnim();
    destroyAnim();
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss && renderer.forceContextLoss();
        renderer.domElement && renderer.domElement.remove();
    }
});

function update(){
    renderer.render(scene, camera);
}
const { start: startAnim, stop: stopAnim, destroy: destroyAnim } = useAnimation(update);

function resize(){
    const width = containerRef.value.offsetWidth;
    const height = containerRef.value.offsetHeight;
    renderer.setSize(width, height);

    camera.fov =props.fov;
    camera.aspect = width / height;

    const aspect = props.stage.width / props.stage.height; // 宽高比
    const fovRad = props.fov * THREE.MathUtils.DEG2RAD; // 视角转换为弧度

    let distance  = 
        aspect < camera.aspect
        ? props.stage.height / 2 / Math.tan(fovRad / 2)
        : props.stage.width / camera.aspect / (2 * Math.tan(fovRad / 2));
    
    distance *= 0.5;

    camera.position.set(distance, distance, distance);
    camera.lookAt(scene.position);
    camera.updateProjectionMatrix();

    const docFontSize =
        aspect < camera.aspect
        ? (height / 100) * aspect
        : width / 100;
    // document.documentElement.style.fontSize = docFontSize + "px";
    containerRef.value.style.fontSize = docFontSize + "px";

    emit('resize',{
        width,
        height,
        camera,
        renderer
    });
}

function createLights() {
    lights = {
        holder: new THREE.Object3D(),
        ambient: new THREE.AmbientLight(0xffffff, 0.69),
        front: new THREE.DirectionalLight(0xffffff, 0.36),
        back: new THREE.DirectionalLight(0xffffff, 0.19),
    };

    lights.front.position.set(1.5, 5, 3);
    lights.back.position.set(-1.5, -5, -3);

    lights.holder.add(lights.ambient);
    lights.holder.add(lights.front);
    lights.holder.add(lights.back);

    scene.add(lights.holder);

    return lights;
}

function enableShadows() {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    lights.front.castShadow = true;

    lights.front.shadow.mapSize.width = 512;
    lights.front.shadow.mapSize.height = 512;

    var d = 1.5;

    lights.front.shadow.camera.left = -d;
    lights.front.shadow.camera.right = d;
    lights.front.shadow.camera.top = d;
    lights.front.shadow.camera.bottom = -d;

    lights.front.shadow.camera.near = 1;
    lights.front.shadow.camera.far = 9;
}

// 暴露方法给父组件调用
function setupCubeShadows(cube) {
  if (cube && cube.holder) {
    cube.holder.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }
}

defineExpose({
  get scene() { return scene; },
  get camera() { return camera; },
  get renderer() { return renderer; },
  get lights() { return lights; },
  setupCubeShadows, // 暴露设置魔方阴影的方法
  startAnim, // 暴露启动动画方法
  stopAnim // 暴露停止动画方法
});

// 3. watch props.fov 和 props.stage，变化时自动 resize
watch(() => props.fov, () => {
    resize();
});
watch(() => props.stage, () => {
    resize();
}, { deep: true });
</script>

<template>
    <div ref="containerRef" class="world"></div>
</template>

<style scoped>
.world {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>