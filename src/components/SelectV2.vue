<script lang="ts" setup>
import {v4} from "uuid";
import {ref, watch, nextTick, onMounted, computed, onBeforeUnmount, provide} from "vue";
import SelectV2Chip from "./SelectV2Chip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";

type OverflowingChipApi = {
  check(): void;
}

const props = withDefaults(
    defineProps<{
      id?: string;
      multiple?: boolean;
      searchEnabled?: boolean;
      creationEnabled?: boolean;
      items: any[];
      variant: 'outlined' | 'underlined';
    }>(),
    {
      id: () => `select-${v4()}`,
      multiple: false,
      searchEnabled: false,
      variant: "underlined",
    }
);

const NEW_VALUE_INDEX = -1;
const minIndex = computed(() => props.creationEnabled ? NEW_VALUE_INDEX : 0);

const id = ref(props.id);
const open = ref(false);
const selectRef = ref(null);
const menuRef = ref(null);
const textField = ref(null);
const sheetRef = ref(null);
const width = ref(0);
const bound = ref(0);
const search = ref("");
const active = ref(minIndex.value);
const selectedItemsSet = ref(new Set());

let counter = 10000;
const registeredChips = new Map<number, OverflowingChipApi>();
const overflowingChips = ref(new Set<number>());

const filteredItems = computed(() => {
  const searchValue = search.value.toLocaleLowerCase();
  return props.items.filter((it) =>
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

const addItem = () => {
  const title = search.value.trim();
  if (title) {
    const item = {id: counter, title};
    selectedItemsSet.value.add(item);
    search.value = "";
    counter += 1;
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

const removeSelectedItem = (selectedItem) => {
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

watch(search, () => {
  active.value = minIndex.value;
});

watch(open, (value) => {
  if (!value) {
    active.value = minIndex.value;
    search.value = "";
  }
});

watch(active, (value) => {
  const parent = sheetRef.value?.$el;
  const el = parent?.querySelector(`[data-index="${value}"]`) as HTMLElement;
  el.scrollIntoView({block: "nearest"});
});

let observer: ResizeObserver | undefined;

onMounted(() => {
  const el = selectRef.value?.$el as HTMLElement | undefined;
  if (el) {
    updateDimensions(el);

    const observer = new ResizeObserver(() => {
      updateDimensions(el);
      updateOverflowingChips();
    });
    observer.observe(el);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
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
        placeholder="Select city ..."
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
            placeholder="Search city ..."
            density="comfortable"
            hide-details
            @click.prevent.stop
            @keydown="searchKeyDown"
            variant="underlined"
            color="primary"
        />
        <v-list density="compact" max-height="30vh">
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
                  <v-tooltip location="top" :open-delay="300" transition="none">
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

            <template v-else>
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
