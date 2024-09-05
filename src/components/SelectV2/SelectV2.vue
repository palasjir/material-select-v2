<script lang="ts" setup>
import {v4} from "uuid";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {ComponentExposed} from 'vue-component-type-helpers';
import {VList, VListItem, VMenu, VProgressCircular, VSelect, VSheet, VTextField} from "vuetify/components";
import {debounce, isFunction} from "lodash";
import SelectV2Chip from "./SelectV2Chip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";
import {AsyncQuery, CreateItemFn, InfiniteRecord, MutationQuery, OverflowingPayload, SelectItem} from "./types.ts";
import {provideSelectV2Store} from "./SelectV2Store.ts";
import SelectV2SingleChip from "./SelectV2SingleChip.vue";

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

function isAsyncQuery(x: any): x is AsyncQuery {
  return 'data' in x && 'refetch' in x && !('fetchNextPage' in x);
}

function isInfiniteQuery(x: any): x is InfiniteRecord {
  return 'data' in x && 'fetchNextPage' in x;
}

function isMutationQuery(x: any): x is MutationQuery {
  return x && 'mutate' in x;
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

interface Emits {
  (e: 'update:search', value: string): void;
}

const emit = defineEmits<Emits>();

const NEW_VALUE_INDEX = -1;
const minIndex = computed(() => props.creationEnabled ? NEW_VALUE_INDEX : 0);

const id = ref<string>(props.id);
const open = ref<boolean>(false);
const selectRef = ref<ComponentExposed<typeof VSelect> | undefined>();
const menuRef = ref<ComponentExposed<typeof VMenu> | undefined>();
const textField = ref<ComponentExposed<typeof VTextField> | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();
const infiniteLoaderRef = ref<ComponentExposed<typeof VListItem> | undefined>();
const listRef = ref<ComponentExposed<typeof VList> | undefined>();
const width = ref<number>(0);
const bound = ref<number>(0);
const search = ref<string>("");
const active = ref<number>(minIndex.value);
const selectedItemsSet = ref(new Set<SelectItem>());
const overflowingChips = ref(new Set<number>());

const filteredItems = computed(() => {
  const searchValue = search.value.toLocaleLowerCase();
  const _items = props.items;

  // simple array
  if (Array.isArray(_items)) {
    return _items.filter((it) =>
        it.title.toLowerCase().includes(searchValue)
    );
  }

  // async data from tanstack/vue-query
  if (isAsyncQuery(_items)) {
    return _items.data.value ?? [];
  }

  // infinite query
  if(isInfiniteQuery(_items)) {
    const _pages = _items.data.value?.pages ?? [];
    return _pages.flatMap((page) => page.items).filter((it) =>
        it.title.toLowerCase().includes(searchValue)
    );
  }

  return [];
});
const selectedItems = computed({
  get: () => {
    return [...selectedItemsSet.value];
  },
  set: (value) => {
    selectedItemsSet.value = new Set(value);
  },
});
const offset = computed(() => {
  return props.variant === 'underlined' ? [5, 0] : [15, 15];
});

const creatingIndicator = computed(() => {
  const _onCreate = props.onCreate;
  if (isMutationQuery(_onCreate)) {
    return _onCreate.isPending.value
  }
  return false;
})

const loadingIndicator = computed(() => {
  const _items = props.items;
  let temp = false;

  if (isAsyncQuery(_items) && isInfiniteQuery(_items)) {
    return _items.isFetching.value
  }

  temp = temp || creatingIndicator.value;
  return temp;
});

const openPopup = () => {
  open.value = true;
};

const toggleItem = (index: number) => {
  const item = filteredItems.value[index];
  const set = selectedItemsSet.value;

  if (!props.multiple) {
    set.clear();
  }

  if (set.has(item)) {
    set.delete(item);
  } else {
    set.add(item);
  }
  active.value = index;
};

const addItem = async () => {
  const title = search.value.trim();
  const _onCreate = props.onCreate;
  if (title && _onCreate) {
    let item: any;
    if (isMutationQuery(_onCreate)) {
      item = await _onCreate.mutateAsync(title);
    } else if (isFunction(_onCreate)) {
      item = _onCreate(title);
    }

    selectedItemsSet.value.add(item);
    search.value = "";
  }
};

const searchKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "ArrowDown":
      active.value = Math.min(filteredItems.value.length - 1, active.value + 1);
      break;
    case "ArrowUp":
      active.value = Math.max(minIndex.value, active.value - 1);
      break;
    case "Tab":
      event.preventDefault();
      event.stopPropagation();
      active.value = (active.value + 1) % filteredItems.value.length;
      break;
    case "Enter":
      if (active.value === NEW_VALUE_INDEX) {
        addItem();
      } else {
        toggleItem(active.value);
      }
      break;
  }
};

const selectKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    open.value = true;
    return;
  }
};

const handleChipOverflow = ({id, isOverflowing}: OverflowingPayload) => {
  if (isOverflowing) {
    overflowingChips.value.add(id);
  } else {
    overflowingChips.value.delete(id);
  }
};

const removeSelectedItem = (selectedItem: SelectItem) => {
  selectedItemsSet.value.delete(selectedItem);
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

const {updateOverflowingChips} = provideSelectV2Store();

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
  active.value = minIndex.value;
  debouncedSearch(searchValue);
});

watch(open, async (value) => {
  if (!value) {
    active.value = minIndex.value;
    search.value = "";
  } else {
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
        @click.prevent.stop="openPopup"
        @keydown="selectKeyDown"
        @keyup.prevent.stop
        density="comfortable"
        color="primary"
        :variant="variant"
        :focused="open"
    >
      <template #chip="{ index}">
        <SelectV2Chip
            v-if="multiple"
            :bound="bound"
            :index="index"
            :item="selectedItems[index]"
            :select-width="width"
            @overflowing="handleChipOverflow"
            @close="removeSelectedItem"
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
            :items="selectedItems"
            :width="width"
            @close-item="removeSelectedItem"
        />
      </template>
    </VSelect>

    <VMenu
        ref="menuRef"
        :activator="`#${id}`"
        v-model="open"
        :offset="offset"
        :close-on-content-click="false"
        no-click-animation
        transition="none"
        opacity="0.5"
    >
      <VSheet ref="sheetRef" v-if="open" :elevation="1" :width="width" rounded border>
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
        <VDivider />
        <VList ref="listRef" density="compact" max-height="30vh" :disabled="creatingIndicator">
          <template #default>
            <template v-if="creationEnabled">
              <VListItem
                  class="select-v2__create-item"
                  :value="search"
                  :title="search"
                  :active="active === NEW_VALUE_INDEX"
                  @click="addItem"
                  density="compact"
                  :data-index="NEW_VALUE_INDEX"
                  :disabled="!search"
              >
                <template #title>
                  <div class="text-grey-darken-1" v-if="!search">
                    <i>(Type to create a new item)</i>
                  </div>
                  <div v-else>
                    {{ search }}
                  </div>
                </template>
                <template #prepend>
                  <div class="mr-2 text-grey-darken-1">
                    <v-icon icon="mdi-plus" density="compact" color="primary"/>
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

            <template v-if="multiple">
              <v-list-item
                  v-for="(item, index) in filteredItems"
                  :key="item.title"
                  :value="item.title"
                  :title="item.title"
                  :class="{ selected: selectedItemsSet.has(item) }"
                  :active="index === active"
                  @click="toggleItem(index)"
                  density="compact"
                  :data-index="index"
              >
                <template #title>
                  <v-tooltip location="top left" :open-delay="300" transition="none" :max-width="width - 80">
                    <template #activator="{props: activatorProps}">
                      <div class="text-truncate" v-bind="activatorProps">{{ item.title }}</div>
                    </template>
                    <div> {{ item.title }}</div>
                  </v-tooltip>
                </template>
                <template #prepend>
                  <v-checkbox
                      class="mr-2"
                      :model-value="selectedItemsSet.has(item)"
                      density="compact"
                      hide-details
                  />
                </template>
              </v-list-item>
            </template>

            <template v-if="!multiple">
              <v-list-item
                  v-for="(item, index) in filteredItems"
                  :key="`single-${item.title}`"
                  :value="item.title"
                  :title="item.title"
                  :class="{ selected: selectedItemsSet.has(item) }"
                  :active="index === active"
                  @click="toggleItem(index)"
                  density="compact"
                  :data-index="index"
              >
                <template #title>
                  <v-tooltip location="top left" :open-delay="300" transition="none" :max-width="width - 80">
                    <template #activator="{props: activatorProps}">
                      <div class="text-truncate" v-bind="activatorProps">{{ item.title }}</div>
                    </template>
                    <div> {{ item.title }}</div>
                  </v-tooltip>
                </template>
                <template #prepend>
                  <v-radio
                      class="mr-2"
                      :model-value="selectedItemsSet.has(item)"
                      density="compact"
                      hide-details
                      readonly
                  />
                </template>
              </v-list-item>
            </template>

            <template v-if="infinite && isInfiniteQuery(items)">
              <VListItem ref="infiniteLoaderRef" class="infinite-loader">
                <template #title>
                  <div v-if="items.isFetching.value" class="d-flex justify-center">
                    <v-progress-circular color="primary" :size="20" indeterminate/>
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
