<script lang="ts" setup>
import {nextTick, ref} from "vue";
import { ComponentExposed } from 'vue-component-type-helpers';
import {VSheet, VMenu, VChip} from "vuetify/components";
import SelectV2MoreChipsMenuList from "./SelectV2MoreChipsMenuList.vue";

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

const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();

</script>

<template>
  <VMenu open-on-hover transition="none" :close-on-content-click="false">
    <template #activator="{ props: activatorProps }">
      <div v-bind="activatorProps">
        <VChip
            v-show="count"
            variant="tonal"
            color="primary"
            @click.prevent.stop
        >
          <div>+{{ count }}</div>
        </VChip>
      </div>
    </template>

    <VSheet ref="sheetRef" class="d-flex flex-column more-chips-menu">
      <SelectV2MoreChipsMenuList :items="items" @closeItem="$emit('closeItem', $event)" :max-width="width"  />
    </VSheet>
  </VMenu>
</template>

<style scoped>
.more-chips-menu {
  transform: translateX(25px);
}
</style>