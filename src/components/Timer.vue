<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useAnimation } from '../composable/useAnimation';

defineOptions({
    name: 'Timer'
});

const deltaTime = ref(0);
const running = ref(false);

const formattedTime = computed(() => {
  const seconds = parseInt((deltaTime.value / 1000) % 60);
  const minutes = parseInt(deltaTime.value / (1000 * 60));
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});


function update(delta) {
    if (!running.value) return ;
    deltaTime.value += delta;
}

const { start: startAnim, stop: stopAnim, destroy: destroyAnim } = useAnimation(update);

function start(continueGame = false) {
    if(running.value) return;
    running.value = true;
    if(!continueGame) deltaTime.value = 0;
    startAnim();
}

function stop() {
    if(!running.value) return;
    running.value = false;
    stopAnim();
}

function reset() {
    running.value = false; 
    stopAnim();
    deltaTime.value = 0;
}

onUnmounted(() => {
    stop();
    destroyAnim();
});

defineExpose({
    start,
    stop,
    reset,
    get time() { return formattedTime.value; }//属性访问器
});

</script>

<template>
    <div class="timer">{{ formattedTime }}</div>
</template>