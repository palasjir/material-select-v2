<script lang="ts" setup>
import {VListItem} from "vuetify/components";
import SelectV2CreateItem from "./SelectV2CreateItem.vue";
import SelectV2MultipleItem from "./SelectV2ItemMultiple.vue";
import SelectV2SingleItem from "./SelectV2ItemSingle.vue";
import {useSelectV2Store} from "./SelectV2Store.ts";
import {computed, ref} from "vue";
import {useVirtualizer} from "@tanstack/vue-virtual";
import SelectV2ListItem from "./SelectV2ListItem.vue";

interface Props {
  creationEnabled: boolean | undefined;
  multiple: boolean | undefined;
  infinite: boolean | undefined;
}

const props = defineProps<Props>();

const {filteredItems, isCreateItemVisible} = useSelectV2Store();

const listRef = ref<HTMLElement | undefined>();

const options = computed(() => {
  return {
    count: filteredItems.value.length,
    getScrollElement: () => listRef.value,
    estimateSize: () => 40,
    overscan: 5,
    paddingStart: isCreateItemVisible.value ? 40 : 0,
  };
});

const vList = useVirtualizer(options);

// const testOverrides = useTestOverrides();

const virtualRows = computed(() => {
  // todo: re-enable this in Hume
  // if (testOverrides?.disableVirtualScrolling) {
  //   return props.items.map((item, index) => ({
  //     index,
  //     size: props.itemHeight,
  //     start: index * props.itemHeight,
  //   }));
  // }
  return vList.value.getVirtualItems();
});
const totalSizePx = computed(() => {
  let totalSize = vList.value.getTotalSize();

  if(isCreateItemVisible.value) {
    totalSize += 40;
  }

  if(filteredItems.value.length === 0) {
    totalSize += 40;
  }

  return `${totalSize}px`}
);
</script>

<template>
  <div ref="listRef" role="list" class="list">
    <div class="list__inner">
      <SelectV2CreateItem v-if="isCreateItemVisible"/>

      <SelectV2ListItem v-for="row in virtualRows" :key="row.index" :row="row">
        <SelectV2MultipleItem v-if="multiple" :key="row.index" :index="row.index" :item="filteredItems[row.index]"/>
         <SelectV2SingleItem  v-if="!multiple" :key="row.index" :index="row.index" :item="filteredItems[row.index]" />
      </SelectV2ListItem>


      <!-- Infinite query support -->
<!--      <template v-if="infinite && isInfiniteQuery(items)">-->
<!--        <VListItem ref="infiniteLoaderRef" class="infinite-loader">-->
<!--          <template #title>-->
<!--            <div v-if="items.isFetching.value" class="d-flex justify-center">-->
<!--              <VProgressCircular color="primary" :size="20" indeterminate/>-->
<!--            </div>-->
<!--            <div v-if="!items.isFetching.value && !items.hasNextPage.value" class="text-gray">-->
<!--              <i>No more items.</i>-->
<!--            </div>-->
<!--          </template>-->
<!--        </VListItem>-->
<!--      </template>-->

      <template v-if="filteredItems.length === 0">
        <VListItem>
          <template #title>
            <i class="text-grey">No items matching the search found.</i>
          </template>
        </VListItem>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.list {
  overflow: auto;
  max-height: 480px;
}

.list__inner {
  width: 100%;
  position: relative;
  height: v-bind(totalSizePx);
}

</style>