<script lang="ts" setup>
import {VChip, VSheet, VTooltip} from "vuetify/components";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {ComponentExposed} from "vue-component-type-helpers";

interface Props {
  maxWidth: number;
}

const props = defineProps<Props>();

const {removeSelectedItem, selectedItemsSet} = useSelectV2Store()

const listRef = ref<HTMLElement | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();
const maxChipWidth = computed(() => `${props.maxWidth - 80}px`);
const maxWidth = computed(() => `${props.maxWidth}px`);

const fixSize = async () => {
  await nextTick();
  const el = listRef.value;
  const sheetEl = sheetRef.value?.$el;
  // console.log('el', el, sheetEl);
  //
  if (!el || !sheetEl) return;
  const {height, width} = el.getBoundingClientRect();
  console.log(sheetEl.getBoundingClientRect());

  const style = `width: ${width}px; height: ${height}px;`

  // once the submenu is open we fixate its width and height, so that when we start removing chips it doesn't change its size
  el.setAttribute(
      'style',
      style
  );
}

onMounted(() => {
  fixSize();
});

watch(() => props.maxWidth, () => {
  fixSize()
});

</script>

<template>
  <VSheet ref="sheetRef" class="d-flex flex-column more-chips-menu">
    <div ref="listRef" class="d-flex flex-wrap align-start ga-2 pa-4" :style="{maxWidth}">
      <VChip
          class="flex-grow-0 align-self-start"
          v-for="[,selectedItem] in selectedItemsSet"
          closable
          @click:close="removeSelectedItem(selectedItem)"
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
  </VSheet>
</template>

<style scoped>
.more-chips-menu {
  transform: translate(25px, 10px) ;
}
</style>