<template>
  <div class="app">
    <!-- <ControlsDemo /> -->
    <!-- <RotationMenu /> -->
    <!-- <TimelineDemo /> -->
    <Begin />
    <!-- <CubeDemo /> -->

  </div>
</template>

<script setup>
import ControlsDemo from './test/ControlsDemo.vue'
import RotationMenu from './components/RotationMenu.vue'
import TimelineDemo from './test/TimelineDemo.vue';
import CubeDemo from './test/CubeDemo.vue';
import Begin from './components/Begin.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: transparent;
}

.app {
  min-height: 100vh;
  background: transparent;
}
</style> 