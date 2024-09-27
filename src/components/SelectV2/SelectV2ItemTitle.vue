<script lang="ts" setup>
import {VBtn, VTooltip} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {SelectV2ListItemState} from "./useSelectV2ListItem.ts";

interface Props {
  item: SelectItem;
  state: SelectV2ListItemState;
}

defineProps<Props>();
defineSlots<{
  default?: (props: {item: SelectItem}) => any
}>()
</script>

<template>
  <VTooltip location="top left" :open-delay="300" transition="none" :max-width="state.maxWidth.value">
    <template #activator="{props: activatorProps}">
      <div class="d-flex flex-row align-center justify-space-between">
        <div class="text-truncate" v-bind="activatorProps">
          <slot :item="item">{{ item.title }}</slot>
        </div>
        <div v-if="item.isCustom">
          <VBtn icon="mdi-close" variant="plain" size="x-small" density="compact" @click="state.remove" />
        </div>
      </div>
    </template>
    <div>{{ item.title }}</div>
  </VTooltip>
</template>