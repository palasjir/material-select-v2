<script lang="ts" setup>
import {v4} from "uuid";
import {ref, watch, nextTick, onMounted, computed, onBeforeUnmount, provide} from "vue";
import SelectV2Chip from "./SelectV2Chip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";
import {AsyncValue} from "./AsyncValue.ts";
import {debounce} from "lodash";
import {AsyncCreate} from "./AsyncCreate.ts";
import {InfiniteData, UseInfiniteQueryReturnType, UseQueryReturnType} from "@tanstack/vue-query";

type Item = { id: number; title: string };

type InfiniteRecord<T> = UseInfiniteQueryReturnType<InfiniteData<{
  page: number
  items: T[]
}, unknown>, Error>;

type AsyncQuery<T> = UseQueryReturnType<T[], Error>

type OverflowingChipApi = {
  check(): void;
}

function isAsyncQuery(x: any): x is AsyncQuery<Item> {
  return 'data' in x && 'refetch' in x && !('fetchNextPage' in x);
}

const props = withDefaults(
    defineProps<{
      id?: string;
      multiple?: boolean;
      searchEnabled?: boolean;
      items: Item[] | AsyncValue<Item[]> | InfiniteRecord<Item> | AsyncQuery<Item>;
      variant: 'outlined' | 'underlined';
      selectPlaceholder: string;
      searchPlaceholder: string;

      creationEnabled?: boolean;
      onCreate?: ((searchValue: string) => any) | AsyncCreate<any>;

      infinite?: boolean;
    }>(),
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
const selectRef = ref(null);
const menuRef = ref(null);
const textField = ref(null);
const sheetRef = ref(null);
const infiniteLoaderRef = ref(null);
const listRef = ref(null);
const width = ref<number>(0);
const bound = ref<number>(0);
const search = ref<string>("");
const active = ref<number>(minIndex.value);
const selectedItemsSet = ref(new Set<Item>());

const registeredChips = new Map<number, OverflowingChipApi>();
const overflowingChips = ref(new Set<number>());

const filteredItems = computed(() => {
  const searchValue = search.value.toLocaleLowerCase();
  const _items = props.items;

  // async data
  if (_items instanceof AsyncValue) {
    return _items.value.value ?? [];
  }

  // simple array
  if (Array.isArray(_items)) {
    return _items.filter((it) =>
        it.title.toLowerCase().includes(searchValue)
    );
  }

  // handle tanstack query
  if(isAsyncQuery(_items)) {
    return _items.data.value ?? [];
  }

  // infinite query
  const _pages = _items.data.value?.pages ?? [];
  return _pages.flatMap((page) => page.items).filter((it) =>
      it.title.toLowerCase().includes(searchValue)
  );
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
const creating = computed(() => {
  if (props.onCreate && props.onCreate instanceof AsyncCreate) {
    return props.onCreate.loading.value;
  }
  return false;
})
const loading = computed(() => {
  const _items = props.items;
  let temp = false;

  if (_items instanceof AsyncValue) {
    temp = temp || _items.loading.value;
  }

  if(isAsyncQuery(_items)) {
    return _items.isFetching.value
  }

  temp = temp || creating.value;
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
    if (_onCreate instanceof AsyncCreate) {
      item = await _onCreate.execute(title);
      selectedItemsSet.value.add(item);
    } else {
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

const handleChipOverflow = ({id, isOverflowing}) => {
  if (isOverflowing) {
    overflowingChips.value.add(id);
  } else {
    overflowingChips.value.delete(id);
  }
};

const removeSelectedItem = (selectedItem: Item) => {
  selectedItemsSet.value.delete(selectedItem);
};

const updateDimensions = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  width.value = rect.width;
  bound.value = rect.right;
}

const updateOverflowingChips = () => {
  requestAnimationFrame(() => {
    for (const [_, value] of registeredChips) {
      value.check();
    }
  })
}

const registerChip = ({id, api}: { id: number, api: OverflowingChipApi }) => {
  registeredChips.set(id, api);
};

const unregisterChip = ({id}: { id: number }) => {
  registeredChips.delete(id);
  updateOverflowingChips();
};

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

const debouncedSearch = debounce((value: string) => {
  const _value = value ?? '';
  if (props.items instanceof AsyncValue) {
    props.items.execute(_value);
  }
  emit('update:search', _value)
}, 250);

watch(search, (searchValue) => {
  active.value = minIndex.value;
  debouncedSearch(searchValue);
});

watch(open, async (value) => {
  if (!value) {
    active.value = minIndex.value;
    search.value = "";
  } else {
    if (props.items instanceof AsyncValue) {
      props.items.execute(search.value ?? '');
    }

    await nextTick();

    if (props.infinite) {
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
            props.items.fetchNextPage();
          }
        }, ioOptions);
        io.observe(infiniteLoaderElement)
      }
    }
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

provide('select-v2', {
  registerChip,
  unregisterChip
});

</script>

<template>
  <div>
    <v-select
        class="my-select"
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
            :bound="bound"
            :index="index"
            :item="selectedItems[index]"
            @overflowing="handleChipOverflow"
            @close="removeSelectedItem"
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
    </v-select>

    <v-menu
        ref="menuRef"
        :activator="`#${id}`"
        v-model="open"
        :offset="offset"
        :width="width"
        :close-on-content-click="false"
        no-click-animation
        transition="none"
    >
      <v-sheet ref="sheetRef" v-if="open" :elevation="2">
        <v-text-field
            v-if="searchEnabled"
            ref="textField"
            v-model="search"
            class="px-4 py-2"
            :placeholder="searchPlaceholder"
            density="comfortable"
            hide-details
            @click.prevent.stop
            @keydown="searchKeyDown"
            variant="underlined"
            flat
            color="primary"
            :loading="loading"
            :disabled="creating"
        />
        <v-list ref="listRef" density="compact" max-height="30vh" :disabled="creating">
          <template #default>
            <template v-if="creationEnabled">
              <v-list-item
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
                  <div class="pl-1 mr-2 text-grey-darken-1">
                    <v-icon icon="mdi-plus" density="compact" color="primary"/>
                  </div>
                </template>
                <template #append>
                  <v-progress-circular
                      v-if="creating"
                      color="primary"
                      indeterminate/>
                </template>
              </v-list-item>
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

            <template v-if="infinite">
              <v-list-item ref="infiniteLoaderRef" class="infinite-loader">
                <template #title>
                  <div v-if="items.isFetching.value" class="d-flex justify-center">
                    <v-progress-circular color="primary" :size="20" indeterminate/>
                  </div>
                  <div v-if="!items.isFetching.value && !items.hasNextPage.value" class="text-gray">
                    <i>No more items.</i>
                  </div>
                </template>
              </v-list-item>
            </template>
          </template>
        </v-list>
      </v-sheet>
    </v-menu>
  </div>
</template>

<style scoped>
.selected {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgba(var(--v-theme-primary), 0.83);
}

.my-select:deep(.v-field__input) {
  flex-wrap: nowrap;
}
</style>
