<script lang="ts" setup>
import {VListItem, VTooltip, VCheckbox} from "vuetify/components";
import {SelectItem} from "./types.ts";
import {useSelectV2ListItem} from "./useSelectV2ListItem.ts";
import {toRefs} from "vue";

interface Props {
  index: number;
  item: SelectItem;
}

const props = defineProps<Props>();
const state = useSelectV2ListItem(toRefs(props));
console.log('item');
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