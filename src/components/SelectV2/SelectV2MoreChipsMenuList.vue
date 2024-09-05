<script lang="ts" setup>
import {VChip, VTooltip} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {computed, onMounted, ref} from "vue";

interface Props {
  items: SelectItem[];
  maxWidth: number;
}

interface Emits {
  (e: 'closeItem', item: SelectItem): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const listRef = ref<HTMLElement | undefined>();
const maxChipWidth = computed(() => `${props.maxWidth - 80}px`);
const maxWidth = computed(() => `${props.maxWidth}px`);

onMounted(() => {
  const el = listRef.value;
  if(!el) return;
  const {height, width} = el.getBoundingClientRect();

  // once the submenu is open we fixate its width and height, so that when we start removing chips it doesn't change its size
  el.setAttribute(
      'style',
      `width: ${width}px; height: ${height}px;`);
})

</script>

<template>
  <div ref="listRef" class="d-flex flex-wrap align-start ga-2 pa-4" :style="{maxWidth}">
    <VChip
        class="flex-grow-0 align-self-start"
        v-for="selectedItem in items"
        closable
        @click:close="$emit('closeItem', selectedItem)"
    >
      <VTooltip location="top left" :open-delay="300" transition="none">
        <template #activator="{ props: activatorProps }">
          <div v-bind="activatorProps" class="text-truncate" :style="{maxWidth: maxChipWidth}">
            {{ selectedItem.title }}
          </div>
        </template>
        <div :style="{maxWidth: maxChipWidth}">{{ selectedItem.title }}</div>
      </VTooltip>
    </VChip>
  </div>
</template>