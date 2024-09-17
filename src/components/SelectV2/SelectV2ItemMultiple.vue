<script lang="ts" setup>
import {VListItem, VTooltip, VCheckbox} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {computed} from "vue";
import {useSelectV2Store} from "./SelectV2Store.ts";

interface Props {
  index: number;
  item: SelectItem;
  selectWidth: number;
}

interface Emits {
  (e: 'click', index: number): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const {isItemSelected, isActiveItem, toggleItem, activeDown, activeUp, activeCycle, activeConfirm} = useSelectV2Store();

const isSelected = computed(() => {
  const selected = isItemSelected(props.item)
  console.log('selected', props.item.id, props.index, selected);
  return selected;
});
const isActive = computed(() => isActiveItem(props.index));
const maxWidth = computed(() => props.selectWidth - 80);
let isKeydown = false;

const handleClick = (event) => {
  setTimeout(() => {
    if(isKeydown) {
      isKeydown = false;
      return;
    }
    console.log('click', props.index, event);
    toggleItem(props.index);
  }, 100);

}

const handleListKeyDown = (event: KeyboardEvent) => {
  console.log('down item');
  isKeydown = true;
  switch (event.key) {
    case "ArrowDown":
      activeDown();
      event.preventDefault();
      event.stopPropagation();
      break;
    case "ArrowUp":
      activeUp();
      event.preventDefault();
      event.stopPropagation();
      break;
    case "Tab":
      event.preventDefault();
      event.stopPropagation();
      activeCycle();
      break;
    case "Enter":
      activeConfirm();
      event.preventDefault();
      break;
  }
};
</script>

<template>
  <VListItem
      :key="item.title"
      :value="item.title"
      :title="item.title"
      class="list-item"
      :class="{ selected: isSelected }"
      :active="isActive"
      @click.prevent.stop="handleClick"
      density="compact"
      :data-index="index"
      @keydown.prevent.stop="handleListKeyDown"
      @keyup.prevent.stop
  >
    <template #title>
      <VTooltip location="top left" :open-delay="300" transition="none" :max-width="maxWidth">
        <template #activator="{props: activatorProps}">
          <div class="text-truncate" v-bind="activatorProps">{{ item.title }}</div>
        </template>
        <div> {{ item.title }}</div>
      </VTooltip>
    </template>
    <template #prepend>
      <VCheckbox
          class="mr-2"
          :model-value="isSelected"
          density="compact"
          readonly
          disabled
          hide-details
          aria-readonly="true"
          @keydown.prevent.stop
          @keyup.prevent.stop
          @click.prevent
      />
    </template>
  </VListItem>
</template>

<style scoped>

@supports selector(:focus-visible) {
  .v-list-item::after {
    pointer-events: none;
    border: none;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
}

.v-list-item--active {
  border: solid 2px rgba(117, 117, 117, var(--v-medium-emphasis-opacity));
  border-radius: 4px !important;
}

.selected {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgba(var(--v-theme-primary), 0.83);
}
</style>