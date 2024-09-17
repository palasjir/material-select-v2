<script lang="ts" setup>
import {VChip, VTooltip} from "vuetify/components";
import {SelectItem} from "./types.ts";

interface Props {
  item: SelectItem;
  selectWidth: number;
}

defineProps<Props>();

</script>

<template>
  <VChip
      class="flex-shrink-1"
      ref="chipRef"
  >
    <template #default>
      <VTooltip location="top left" :open-delay="300" transition="none">
        <template #activator="{props: activatorProps}">
          <div v-bind="activatorProps" class="select-chip select-chip--single text-truncate">
            {{ item.title }}
          </div>
        </template>
        <div :style="{maxWidth: `${selectWidth - 60}px`}">{{ item.title }}</div>
      </VTooltip>
    </template>
  </VChip>
</template>

<style lang="scss" scoped>
:deep(.v-chip__underlay) {
  background: transparent;
}
</style>