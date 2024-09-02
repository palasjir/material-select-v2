<script lang="ts" setup>
import {onMounted, ref, defineEmits, onBeforeUnmount, inject} from "vue";
import {debounce} from 'lodash'

type State = 'unchecked' | 'overflowing' | 'ok';

const chipRef = ref(null);
const state = ref<State>('unchecked');

const props = defineProps<{
  index: number;
  item: any;
  bound: number;
}>();

type Emits = {
  (e: "close", item: any): void;
  (e: "overflowing", payload: { id: number; isOverflowing: boolean }): void;
};

const emit = defineEmits<Emits>();

const {registerChip, unregisterChip} = inject('select-v2');


const check = debounce(() => {
  const el = chipRef.value?.$el;
  if (!el) {
    emit("overflowing", {
      id: props.item.id,
      isOverflowing: false,
    });
    return;
  }
  const {right} = el.getBoundingClientRect();
  const isOverflowing = right + 70 >= props.bound;
  state.value = isOverflowing ? 'overflowing' : 'ok';

  emit("overflowing", {
    id: props.item.id,
    isOverflowing,
  });
}, 10);


onMounted(() => {
  if (!chipRef.value) return;
  registerChip({id: props.item.id, api: {check}});
  check();
});

onBeforeUnmount(() => {
  unregisterChip(props.item.id);
  emit("overflowing", {id: props.item.id, isOverflowing: false});
});
</script>

<template>
  <v-chip
      class="flex-shrink-1"
      :class="{
          ok: state === 'ok',
          unchecked: state === 'unchecked',
          overflowing: state === 'overflowing',
      }"
      closable ref="chipRef"
      @click:close="$emit('close', item)"
  >
    <template #default>
      <v-tooltip location="top left" :open-delay="300" transition="none">
        <template #activator="{props: activatorProps}">
          <div v-bind="activatorProps" class="select-chip text-truncate">
            {{ item.title }}
          </div>
        </template>
        <div>{{ item.title }}</div>
      </v-tooltip>
    </template>
  </v-chip>
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
