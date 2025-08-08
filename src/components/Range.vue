<script setup>
import { ref, computed, watch, onMounted } from 'vue';

defineOptions({
    name: 'Range'
});

const props = defineProps({
    name: String,
    title: String,
    list: { type: Array, default: () => [] },
    value: Number,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
});

const emit = defineEmits(['update:value']);

</script>

<template>
    <div class="range">
        <div class="range__label"></div>
        <div class="range__track">
            <div class="range__track-line"></div>
            <div class="range__handle"><div></div></div>
            <div class="range__list"></div>
        </div>
    </div>
</template>