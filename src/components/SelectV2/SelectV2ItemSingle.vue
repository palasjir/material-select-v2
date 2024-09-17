<script lang="ts" setup>
import {VListItem} from "vuetify/components";
import {computed} from "vue";
import {SelectItem} from "./types.ts";
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
const emit = defineEmits<Emits>();

const {isItemSelected, isActiveItem, toggleItem} = useSelectV2Store();

const isSelected = computed(() => isItemSelected(props.item));
const isActive = computed(() => isActiveItem(props.index));
const maxWidth = computed(() => props.selectWidth - 80);
const handleClick = () => toggleItem(props.index);
</script>

<template>
  <VListItem
      :key="`single-${item.title}`"
      :value="item.title"
      :title="item.title"
      :class="{ selected: isSelected }"
      :active="isActive"
      @click="handleClick"
      density="compact"
      :data-index="index"
      @keydown.prevent
      @keyup.prevent
  >
    <template #title>
      <VTooltip location="top left" :open-delay="300" transition="none" :max-width="maxWidth">
        <template #activator="{props: activatorProps}">
          <div class="text-truncate" v-bind="activatorProps">{{ item.title }}</div>
        </template>
        <div> {{ item.title }}</div>
      </VTooltip>
    </template>
  </VListItem>
</template>

<style scoped>

</style>