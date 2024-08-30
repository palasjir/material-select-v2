<script lang="ts" setup>
import {nextTick, ref} from "vue";

interface Props {
  count: number;
  items: any[];
  width: number;
}

interface Emits {
  (e: 'closeItem', item: any): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const sheetRef = ref<any>();

const  handleOpen = async () => {
  console.log('open')
  await nextTick();
  const el = sheetRef.value.$el;
  if(!el) return;

  const {width, height} = el.getBoundingClientRect();

  el.setAttribute('style', `width: ${props.width}px; height: ${height}px;`);
}
</script>

<template>
  <v-menu :close-on-content-click="false" open-on-hover transition="none" @update:model-value="handleOpen">
    <template #activator="{ props: activatorProps }">
      <div v-bind="activatorProps">
        <v-chip
            v-show="count"
            variant="tonal"
            color="primary"
            @click.prevent.stop
        >
          <span>+{{ count }}</span>
        </v-chip>
      </div>
    </template>

    <v-sheet ref="sheetRef" class="d-flex flex-column">
      <div class="flex-grow-0 d-flex flex-wrap align-start ga-2 pa-4">
        <v-chip
            class="flex-grow-0 align-self-start"
            v-for="selectedItem in items"
            closable
            @click:close="$emit('closeItem', selectedItem)"
        >
          {{ selectedItem.title }}
        </v-chip>
      </div>
    </v-sheet>
  </v-menu>
</template>

<style scoped>

</style>