<script lang="ts" setup>
import {v4} from "uuid";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {ComponentExposed} from 'vue-component-type-helpers';
import {VList, VListItem, VMenu, VProgressCircular, VSelect, VSheet, VTextField} from "vuetify/components";
import {debounce} from "lodash";
import SelectV2Chip from "./SelectV2Chip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";
import {AsyncQuery, CreateItemFn, InfiniteRecord, MutationQuery, OverflowingPayload, SelectItem} from "./types.ts";
import {provideSelectV2Store} from "./SelectV2Store.ts";
import SelectV2SingleChip from "./SelectV2ItemSingleChip.vue";
import SelectV2MultipleItem from "./SelectV2ItemMultiple.vue";
import {isInfiniteQuery} from "./utils.ts";
import SelectV2CreateItem from "./SelectV2CreateItem.vue";
import SelectV2SingleItem from "./SelectV2ItemSingle.vue";

type Props = {
  id?: string;
  multiple?: boolean;
  searchEnabled?: boolean;

  items:
      SelectItem[] |
      AsyncQuery |
      InfiniteRecord;

  selectPlaceholder: string;
  searchPlaceholder: string;

  creationEnabled?: boolean;
  onCreate?: CreateItemFn | MutationQuery;

  variant?: 'outlined' | 'underlined';
  infinite?: boolean;
}

interface Emits {
  (e: 'update:search', value: string): void;
}

const props = withDefaults(
    defineProps<Props>(),
    {
      id: () => `select-${v4()}`,
      multiple: false,
      searchEnabled: false,
      variant: "underlined",
      infinite: false,
    }
);

const emit = defineEmits<Emits>();

const {
  search,
  isOpen,
  updateOverflowingChips,
  selectedItems,
  filteredItems,
  active,
  activeDown,
  activeUp,
  activeCycle,
  activeConfirm,
  open,
  activeReset,
  loadingIndicator,
  creatingIndicator
} = provideSelectV2Store(props);

const id = ref<string>(props.id);

const selectRef = ref<ComponentExposed<typeof VSelect> | undefined>();
const menuRef = ref<ComponentExposed<typeof VMenu> | undefined>();
const textField = ref<ComponentExposed<typeof VTextField> | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();
const infiniteLoaderRef = ref<ComponentExposed<typeof VListItem> | undefined>();
const listRef = ref<ComponentExposed<typeof VList> | undefined>();

const width = ref<number>(0);
const bound = ref<number>(0);

const overflowingChips = ref(new Set<number>());
const offset = computed(() => {
  return props.variant === 'underlined' ? [5, 0] : [15, 15];
});


const searchKeyDown = (event: KeyboardEvent) => {
  console.log('search keydown');
  switch (event.key) {
    case "ArrowDown":
      activeDown();
      event.preventDefault();
      event.stopPropagation();
      break;
    case "ArrowUp":
      activeUp();
      event.preventDefault();
      event.stopPropagation();
      break;
    case "Tab":
      event.preventDefault();
      event.stopPropagation();
      activeCycle();
      break;
    case "Enter":
      activeConfirm();
      event.preventDefault();
      break;
  }
};

const selectKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    open();
    return;
  }
};

const handleListKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "ArrowDown":
      activeDown();
      event.preventDefault();
      event.stopPropagation();
      break;
    case "ArrowUp":
      activeUp();
      event.preventDefault();
      event.stopPropagation();
      break;
  }
};

const handleChipOverflow = ({id, isOverflowing}: OverflowingPayload) => {
  if (isOverflowing) {
    overflowingChips.value.add(id);
  } else {
    overflowingChips.value.delete(id);
  }
};

const updateDimensions = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  width.value = rect.width;
  bound.value = rect.right;
}

const debouncedSearch = debounce((value: string) => {
  const _value = value ?? '';
  emit('update:search', _value)
}, 250);

const setupInfiniteScroll = () => {
  const _items = props.items;

  if (props.infinite && isInfiniteQuery(_items)) {
    const infiniteLoaderElement = infiniteLoaderRef.value?.$el as HTMLElement | undefined;
    const listElement = listRef.value?.$el as HTMLElement | undefined;
    if (infiniteLoaderElement && listElement) {
      const ioOptions = {
        root: listElement,
        threshold: 0.4
      }
      const io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          _items.fetchNextPage();
        }
      }, ioOptions);
      io.observe(infiniteLoaderElement)
    }
  }
}

watch(
    () => textField.value,
    async () => {
      await nextTick();
      const field = textField.value;
      if (field) {
        setTimeout(() => {
          field.focus();
        }, 200);
      }
    }
);

watch(search, (searchValue) => {
  activeReset();
  debouncedSearch(searchValue);
});

watch(isOpen, async (value) => {
  if (!value) {
    activeReset();
    search.value = "";
  }

  if (value) {
    await nextTick();
    setupInfiniteScroll();
  }
});

watch(active, (value) => {
  const parent = sheetRef.value?.$el;
  const el = parent?.querySelector(`[data-index="${value}"]`) as HTMLElement;
  el.scrollIntoView({block: "nearest"});
});

let observer: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;

onMounted(() => {
  const selectElement = selectRef.value?.$el as HTMLElement | undefined;
  if (selectElement) {
    updateDimensions(selectElement);

    const observer = new ResizeObserver(() => {
      updateDimensions(selectElement);
      updateOverflowingChips();
    });
    observer.observe(selectElement);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  io?.disconnect();
  observer = undefined
})

</script>

<template>
  <div class="select-v2">
    <VSelect
        class="select-v2__select"
        :id="id"
        ref="selectRef"
        :model-value="selectedItems"
        chips
        multiple
        readonly
        :placeholder="selectPlaceholder"
        persistent-placeholder
        @click.prevent.stop="open"
        @keydown.prevent="selectKeyDown"
        @keyup.prevent
        density="comfortable"
        color="primary"
        :variant="variant"
        :focused="isOpen"
    >
      <template #chip="{ index }">
        <SelectV2Chip
            v-if="multiple"
            :bound="bound"
            :index="index"
            :item="selectedItems[index]"
            :select-width="width"
            @overflowing="handleChipOverflow"
        />
        <SelectV2SingleChip
            v-else
            :item="selectedItems[0]"
            :select-width="width"
        />
      </template>
      <template #append-inner>
        <SelectV2MoreChipsMenu
            :count="overflowingChips.size"
            :width="width"
        />
      </template>
    </VSelect>

    <VMenu
        ref="menuRef"
        :activator="`#${id}`"
        :model-value="isOpen"
        :offset="offset"
        :close-on-content-click="false"
        no-click-animation
        transition="none"
        opacity="0.5"
        @update:model-value="isOpen = $event"
    >
      <VSheet ref="sheetRef" v-if="isOpen" :elevation="1" :width="width" rounded border>
        <VTextField
            v-if="searchEnabled"
            ref="textField"
            v-model="search"
            class="select-v2__text-field mx-4 mb-3"
            :placeholder="searchPlaceholder"
            density="comfortable"
            hide-details
            @click.prevent.stop
            @keydown="searchKeyDown"
            variant="plain"
            flat
            color="primary"
            :loading="loadingIndicator"
            :disabled="creatingIndicator"
            prepend-inner-icon="mdi-magnify"
        />
        <VDivider/>
        <VList ref="listRef" density="compact" max-height="30vh" :disabled="creatingIndicator" @keydown.prevent.stop="handleListKeyDown">
          <template #default>

            <SelectV2CreateItem v-if="creationEnabled"/>

            <template v-if="multiple">
              <SelectV2MultipleItem
                  v-for="(item, index) in filteredItems"
                  :key="item.id"
                  :index="index"
                  :item="item"
                  :select-width="width"
              />
            </template>

            <template v-if="!multiple">
              <SelectV2SingleItem
                  v-for="(item, index) in filteredItems"
                  :key="item.id"
                  :index="index"
                  :item="item"
                  :select-width="width"
              />
            </template>

            <template v-if="infinite && isInfiniteQuery(items)">
              <VListItem ref="infiniteLoaderRef" class="infinite-loader">
                <template #title>
                  <div v-if="items.isFetching.value" class="d-flex justify-center">
                    <VProgressCircular color="primary" :size="20" indeterminate/>
                  </div>
                  <div v-if="!items.isFetching.value && !items.hasNextPage.value" class="text-gray">
                    <i>No more items.</i>
                  </div>
                </template>
              </VListItem>
            </template>
          </template>
        </VList>
      </VSheet>
    </VMenu>
  </div>
</template>

<style lang="scss" scoped>

.select-v2__select:deep(.v-field__input) {
  flex-wrap: nowrap;
}

.select-v2__text-field:deep(.v-field__prepend-inner) {
  padding-left: 2px;
}

.select-v2__create-item:deep(.v-list-item__prepend) {
  padding-left: 2px !important;
}

.selected {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgba(var(--v-theme-primary), 0.83);
}
</style>
