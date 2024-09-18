<script lang="ts" setup>
import {VListItem} from "vuetify/components";
import {toRefs} from "vue";
import {SelectItem} from "./types.ts";
import {useSelectV2ListItem} from "./useSelectV2ListItem.ts";

interface Props {
  index: number;
  item: SelectItem;
}

const props = defineProps<Props>();
const state = useSelectV2ListItem(toRefs(props));
</script>

<template>
  <VListItem v-bind="state.props.value">
    <template #title>
      <VTooltip location="top left" :open-delay="300" transition="none" :max-width="state.maxWidth.value">
        <template #activator="{props: activatorProps}">
          <div class="text-truncate" v-bind="activatorProps">{{ item.title }}</div>
        </template>
        <div> {{ item.title }}</div>
      </VTooltip>
    </template>
  </VListItem>
</template>

<style scoped>
@import "./select-list-item.scss";
</style>