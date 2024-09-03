<script lang="ts" setup>
import {computed, nextTick, ref} from "vue";

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
const maxChipWidth = computed(() => `${props.width - 80}px`);

const handleOpen = async () => {
  await nextTick();
  const el = sheetRef.value.$el;
  if (!el) return;

  const {height} = el.getBoundingClientRect();

  // once the submenu is open we fixate its width and height, so that when we start removing chips it doesn't change its size
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
          <div>+{{ count }}</div>
        </v-chip>
      </div>
    </template>

    <v-sheet ref="sheetRef" class="d-flex flex-column more-chips-menu">
      <div class="d-flex flex-wrap align-start ga-2 pa-4">
        <v-chip
            class="flex-grow-0 align-self-start"
            v-for="selectedItem in items"
            closable
            @click:close="$emit('closeItem', selectedItem)"
        >
          <v-tooltip location="top left" :open-delay="300" transition="none">
            <template #activator="{ props: activatorProps }">
              <div v-bind="activatorProps" class="text-truncate" :style="{maxWidth: maxChipWidth}">
                {{ selectedItem.title }}
              </div>
            </template>
            <div>{{ selectedItem.title }}</div>
          </v-tooltip>
        </v-chip>
      </div>
    </v-sheet>
  </v-menu>
</template>

<style scoped>
.more-chips-menu {
  transform: translateX(25px);
}
</style>