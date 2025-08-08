<template>
    <div style="width: 100vw; height: 100vh;">
      <World
        ref="worldRef"
        :fov="fov"
        :stage="stage"
        style="width: 80vw; height: 60vh; border: 1px solid #ccc;"
      />
      <div style="margin-top: 16px;">
        <button @click="fov += 5">FOV +5</button>
        <button @click="fov -= 5">FOV -5</button>
        <button @click="stage.width += 1">宽度+1</button>
        <button @click="stage.height += 1">高度+1</button>
        <button @click="stage.width -= 1">宽度-1</button>
        <button @click="stage.height -= 1">高度-1</button>
        <span style="margin-left: 16px;">当前 FOV: {{ fov }}，舞台: {{ stage.width }} x {{ stage.height }}</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue';
  import World from './components/World.vue';
  
  const worldRef = ref(null);
  const fov = ref(10);
  const stage = reactive({ width: 2, height: 3 });
  </script>
  
  