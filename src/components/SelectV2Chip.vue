<script lang="ts" setup>
import { onMounted, ref, defineEmits, onUnmounted, onBeforeUnmount } from "vue";

const chipRef = ref(null);
const isOverflowing = ref(false);

const props = defineProps<{
  index: number;
  item: any;
  bound: number;
}>();

type Emits = {
  (e: "overflowing", payload: { id: number; isOverflowing: boolean }): void;
};

const emit = defineEmits<Emits>();

onMounted(() => {
  if (!chipRef.value) return;
  const { right } = chipRef.value.$el.getBoundingClientRect();
  isOverflowing.value = right + 70 >= props.bound;

  emit("overflowing", {
    id: props.item.raw.id,
    isOverflowing: isOverflowing.value,
  });
});

onBeforeUnmount(() => {
  emit("overflowing", { id: props.item.raw.id, isOverflowing: false });
});
</script>

<template>
  <v-chip :class="{ overflowing: isOverflowing }" ref="chipRef" />
</template>

<style scoped>
.overflowing {
  opacity: 0;
  pointer-events: none;
}
</style>
