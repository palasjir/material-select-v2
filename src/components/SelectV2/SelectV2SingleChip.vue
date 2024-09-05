<script lang="ts" setup>
import {VChip} from "vuetify/components";
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
      <v-tooltip location="top left" :open-delay="300" transition="none">
        <template #activator="{props: activatorProps}">
          <div v-bind="activatorProps" class="select-chip text-truncate">
            {{ item.title }}
          </div>
        </template>
        <div :style="{maxWidth: `${selectWidth - 60}px`}">{{ item.title }}</div>
      </v-tooltip>
    </template>
  </VChip>
</template>

<style scoped>

</style>