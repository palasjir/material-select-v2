<script lang="ts" setup>
import {onMounted, ref, defineEmits, onBeforeUnmount, inject} from "vue";
import { debounce} from 'lodash'

const chipRef = ref(null);
const isOverflowing = ref(false);

const props = defineProps<{
  index: number;
  item: any;
  bound: number;
}>();

type Emits = {
  (e: "overflowing", payload: { id: number; isOverflowing: boolean }): void;
};

const emit = defineEmits<Emits>();

const {registerChip, unregisterChip} = inject('select-v2');

const id = ref<number>(0);

const check = debounce(() => {
  const el = chipRef.value?.$el;
  if(!el) {
    emit("overflowing", {
      id: id.value,
      isOverflowing: false,
    });
    return;
  }
  const {right} = el.getBoundingClientRect();
  isOverflowing.value = right + 70 >= props.bound;

  console.log('check');

  emit("overflowing", {
    id: id.value,
    isOverflowing: isOverflowing.value,
  });
}, 10);



onMounted(() => {
  id.value = props.item.raw.id;
  if (!chipRef.value) return;
  registerChip({id: id.value, api:{ check }});
  check();
});

onBeforeUnmount(() => {
  unregisterChip(id.value);
  emit("overflowing", { id: id.value, isOverflowing: false });
});
</script>

<template>
  <v-chip class="flex-shrink-1" :class="{ overflowing: isOverflowing }" ref="chipRef">
    <template #default>
      <span class="select-chip text-truncate">{{ item.title }}</span>
    </template>
  </v-chip>
</template>

<style scoped>
.select-chip {
  max-width: 200px;
}
.overflowing {
  opacity: 0;
  pointer-events: none;
}
</style>
