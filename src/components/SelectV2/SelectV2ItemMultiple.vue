<script lang="ts" setup generic="T">
import {VListItem, VCheckbox} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {useSelectV2ListItem} from "./useSelectV2ListItem.ts";
import {toRefs} from "vue";
import SelectV2ListItemTitle from "./SelectV2ItemTitle.vue";


interface Props {
  index: number;
  item: SelectItem<T>;
}
const props = defineProps<Props>();
defineSlots<{
  default?: (props: {item: SelectItem<T>}) => any
}>()
const state = useSelectV2ListItem(toRefs(props));
</script>

<template>
  <VListItem v-bind="state.props.value">
    <template #title>
      <SelectV2ListItemTitle :item="item" :state="state" />
    </template>
    <template #prepend>
      <VCheckbox
          class="__checkbox mr-2"
          :model-value="state.isSelected.value"
          density="compact"
          readonly
          hide-details
          aria-readonly="true"
          @keydown.prevent
          @keyup.prevent
          @click.prevent
      />
    </template>
  </VListItem>
</template>

<style lang="scss" scoped>
@import './select-list-item.scss';

.__checkbox {
  :deep(.v-selection-control) {
    min-height: 24px;
  }

  // Keeping for reference when it would be needed to edit it

  //.v-selection-control--density-compact {
  //  --v-selection-control-size: 20px;
  //}
}

</style>