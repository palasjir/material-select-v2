<script lang="ts" setup>
import {VChip, VSheet, VTooltip} from "vuetify/components";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {ComponentExposed} from "vue-component-type-helpers";

const {removeSelectedItem, selectedItemsSet, width} = useSelectV2Store()

const listRef = ref<HTMLElement | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();
const maxChipWidth = computed(() => `${width.value - 80}px`);
const maxWidth = computed(() => `${width.value}px`);

const fixSize = async () => {
  await nextTick();
  const el = listRef.value;
  const sheetEl = sheetRef.value?.$el;
  if (!el || !sheetEl) return;
  const {height, width} = el.getBoundingClientRect();

  const style = `width: ${width}px; height: ${height}px;`

  // once the submenu is open we fixate its width and height, so that when we start removing chips it doesn't change its size
  el.setAttribute('style', style);
}

onMounted(() => {
  fixSize();
});

watch(width, () => {
  fixSize()
});
</script>

<template>
  <VSheet ref="sheetRef" class="d-flex flex-column more-chips-menu">
    <div ref="listRef" class="d-flex flex-wrap align-start ga-2 pa-4 __inner-list">
      <VChip
          v-for="[,selectedItem] in selectedItemsSet"
          :key="selectedItem.value"
          class="flex-grow-0 align-self-start"
          closable
          @click:close="removeSelectedItem(selectedItem)"
      >
        <VTooltip location="top left" :open-delay="300" transition="none" :max-width="maxChipWidth">
          <template #activator="{ props: activatorProps }">
            <div v-bind="activatorProps" class="text-truncate __title">
              {{ selectedItem.title }}
            </div>
          </template>
          <div>{{ selectedItem.title }}</div>
        </VTooltip>
      </VChip>
    </div>
  </VSheet>
</template>

<style scoped>
.more-chips-menu {
  transform: translate(25px, 10px) ;
}

.__inner-list {
  max-width: v-bind(maxWidth)
}

.__title {
  max-width: v-bind(maxChipWidth);
}
</style>