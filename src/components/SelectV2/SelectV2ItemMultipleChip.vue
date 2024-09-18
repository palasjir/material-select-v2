<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {ComponentExposed} from 'vue-component-type-helpers';
import {debounce} from 'lodash'
import {SelectItem} from "./types.ts";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {VChip, VTooltip} from "vuetify/components";

type State = 'unchecked' | 'overflowing' | 'ok';

type Props = {
  index: number;
  item: SelectItem;
};
const props = defineProps<Props>();
const chipRef = ref<ComponentExposed<typeof VChip> | undefined>();
const state = ref<State>('unchecked');

const {registerChip, unregisterChip, removeSelectedItem, width, bound, setOverflowingChip} = useSelectV2Store();
const maxWidth = computed(() => `${width.value - 60}px`);

const check = debounce(() => {
  const el = chipRef.value?.$el;
  if (!el) {
    setOverflowingChip({
      id: props.item.value,
      isOverflowing: false,
    });
    return;
  }
  const {right} = el.getBoundingClientRect();
  const isOverflowing = right + 70 >= bound.value;
  state.value = isOverflowing ? 'overflowing' : 'ok';

  setOverflowingChip({
    id: props.item.value,
    isOverflowing,
  });
}, 10);

onMounted(() => {
  if (!chipRef.value) return;
  registerChip({id: props.item.value, api: {check}});
  check();
});

onBeforeUnmount(() => {
  unregisterChip({id: props.item.value});
  setOverflowingChip({
    id: props.item.value,
    isOverflowing: false
  });
});
</script>

<template>
  <VChip
      ref="chipRef"
      class="flex-shrink-1 mb-1"
      :class="{
          ok: state === 'ok',
          unchecked: state === 'unchecked',
          overflowing: state === 'overflowing',
      }"
      closable
      @click:close="removeSelectedItem(item)"
  >
    <template #default>
      <VTooltip location="top" :open-delay="300" transition="none" :max-width="maxWidth">
        <template #activator="{props: activatorProps}">
          <div v-bind="activatorProps" class="select-chip text-truncate">
            {{ item.title }}
          </div>
        </template>
        <div>{{ item.title }}</div>
      </VTooltip>
    </template>
  </VChip>
</template>

<style lang="scss" scoped>
.select-chip {
  max-width: 200px;
}

// render chip as invisible while it's not checked to reduce flickering
.unchecked {
  opacity: 0;
  pointer-events: auto;
}

.ok {
  opacity: 1;
  pointer-events: auto;
}

// visually hide overflowing chips (physically they are still there in the DOM)
.overflowing {
  opacity: 0;
  pointer-events: none;
}
</style>
