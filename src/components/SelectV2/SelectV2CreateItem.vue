<script lang="ts" setup>
import {VListItem, VProgressCircular, VIcon} from "vuetify/components";
import {computed} from "vue";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {NEW_VALUE_INDEX} from "./constants.ts";

const {
  addItem, isActiveItem, search, creatingIndicator
} = useSelectV2Store();
const isActive = computed(() => isActiveItem(NEW_VALUE_INDEX));
const isSearchEmpty = computed(() => search.value === '');

</script>

<template>
  <VListItem
      class="select-v2__create-item"
      :value="search"
      :title="search"
      :active="isActive"
      @click="addItem"
      density="compact"
      :data-index="-1"
      :disabled="isSearchEmpty"
  >
    <template #title>
      <div class="text-grey-darken-1" v-if="isSearchEmpty">
        <i>(Type to create a new item)</i>
      </div>
      <div v-else>
        {{ search }}
      </div>
    </template>
    <template #prepend>
      <div class="mr-2 text-grey-darken-1">
        <VIcon icon="mdi-plus" density="compact" color="primary"/>
      </div>
    </template>
    <template #append>
      <VProgressCircular
          v-if="creatingIndicator"
          color="primary"
          indeterminate/>
    </template>
  </VListItem>
</template>

<style scoped>

</style>