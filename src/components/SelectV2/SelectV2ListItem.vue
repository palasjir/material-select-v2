<script lang="ts" setup>
import { VirtualItem } from '@tanstack/vue-virtual';
import { computed } from 'vue';

interface Props {
  row: Pick<VirtualItem, 'size' | 'start'>;
}
const props = defineProps<Props>();
const height = computed(() => `${props.row.size}px`);
const transform = computed(() => `translateY(${props.row.start}px)`);
</script>

<template>
  <div class="list__row" role="listitem">
    <slot />
  </div>
</template>

<style scoped>
.list__row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: v-bind(height);
  transform: v-bind(transform);
}
</style>
