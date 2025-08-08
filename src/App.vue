<template>
  <div class="app">
    <ControlsDemo />
    <RotationMenu />
  </div>
</template>

<script setup>
import ControlsDemo from './test/ControlsDemo.vue'
import RotationMenu from './components/RotationMenu.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
}
</style> 