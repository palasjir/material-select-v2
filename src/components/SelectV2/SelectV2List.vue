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
    estimateSize: (i) => {
      if(filteredItems.value[i].type === 'category') {
        return 32; // depends on visual style of category title, currently: 'text-overline'
      }
      return 40
    },
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


          <div v-if="filteredItems[row.index]?.type === 'category'" class="text-overline text-decoration-underline pl-4">
            {{ filteredItems[row.index]?.title }}
          </div>


         <SelectV2MultipleItem
             v-if="multiple && filteredItems[row.index]?.type ==='item'"
             :key="row.index"
             :index="row.index"
             :item="filteredItems[row.index]"
         />
         <SelectV2SingleItem
             v-if="!multiple && filteredItems[row.index]?.type ==='item'"
             :key="row.index"
             :index="row.index"
             :item="filteredItems[row.index]"
         />

        <VListItem v-if="filteredItems[row.index]?.type ==='not-found'">
          <template #title>
            <i class="text-grey">No items matching the search found.</i>
          </template>
        </VListItem>
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list {
  overflow: auto;
  max-height: 320px; // To occupy 8 items of height 40px (value of 7 + 1 (create item) is based on psychology https://en.wikipedia.org/wiki/The_Magical_Number_Seven%2C_Plus_or_Minus_Two)
  min-height: 40px;  // 40px item height
}

.list__inner {
  width: 100%;
  position: relative;
  height: v-bind(totalSizePx);
}
</style>