<script lang="ts" setup>
import {VChip, VTooltip} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {computed} from "vue";

interface Props {
  item: SelectItem;
}
defineProps<Props>();

const {width} = useSelectV2Store();
const maxWidth = computed(() => `${width.value - 60}px`);
</script>

<template>
  <VChip class="flex-shrink-1" size="40px">
    <template #default>
      <VTooltip location="top left" :open-delay="300" transition="none" :max-width="maxWidth">
        <template #activator="{props: activatorProps}">
          <div v-bind="activatorProps" class="select-chip select-chip--single text-truncate">
            {{ item.title }}
          </div>
        </template>
        <div class="__title-tooltip">{{ item.title }}</div>
      </VTooltip>
    </template>
  </VChip>
</template>

<style lang="scss" scoped>
:deep(.v-chip__underlay) {
  background: transparent;
}

.__title-tooltip {
  max-width: v-bind(maxWidth);
}
</style>