<script lang="ts" setup>
import {VListItem} from "vuetify/components";
import {toRefs} from "vue";
import {SelectItem} from "./types.ts";
import {useSelectV2ListItem} from "./useSelectV2ListItem.ts";
import SelectV2ListItemTitle from "./SelectV2ItemTitle.vue";

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
      <SelectV2ListItemTitle :item="item" :state="state" />
    </template>
  </VListItem>
</template>

<style scoped>
@import "./select-list-item.scss";
</style>