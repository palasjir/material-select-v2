<script lang="ts" setup>
import { v4 } from "uuid";
import {ref, watch, nextTick, onMounted, computed, onBeforeUnmount, provide} from "vue";
import SelectV2Chip from "./SelectV2Chip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";

const props = withDefaults(
  defineProps<{
    id?: string;
    multiple?: boolean;
    searchEnabled?: boolean;
    items: any[];
    variant: string;
  }>(),
  {
    id: () => `select-${v4()}`,
    multiple: false,
    variant: "underlined",
  }
);

const id = ref(props.id);
const open = ref(false);
const selectRef = ref(null);
const menuRef = ref(null);
const textField = ref(null);
const sheetRef = ref(null);
const width = ref(0);
const bound = ref(0);
const search = ref("");
const active = ref(0);
const selectedItemsSet = ref(new Set());

type OverflowingChipApi = {
   check(): void;
}

const registeredChips = new Map<number, OverflowingChipApi>();
const overflowingChips = ref(new Set<number>());

const filteredItems = computed(() => {
  const searchValue = search.value.toLocaleLowerCase();
  return props.items.filter((it) =>
    it.title.toLowerCase().includes(searchValue)
  );
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

const selectedItems = computed({
  get: () => {
    return [...selectedItemsSet.value];
  },
  set: (value) => {
    selectedItemsSet.value = new Set(value);
  },
});

const searchKeyDown = (event) => {
  console.log("down");

  if (event.key === "ArrowDown") {
    active.value = Math.min(filteredItems.value.length - 1, active.value + 1);
    return;
  }

  if (event.key === "ArrowUp") {
    active.value = Math.max(0, active.value - 1);
  }

  if (event.key === "Tab") {
    event.preventDefault();
    event.stopPropagation();
    active.value = (active.value + 1) % filteredItems.value.length;
  }

  if (event.key === "Enter") {
    toggleItem(active.value);
  }
};

const selectKeyDown = (event) => {
  if (event.key === "Enter" || event.key === " ") {
    open.value = true;
    return;
  }
};

const handleChipOverflow = ({ id, isOverflowing }) => {
  if (isOverflowing) {
    overflowingChips.value.add(id);
  } else {
    console.log("delete", id, overflowingChips.value);
    overflowingChips.value.delete(id);
  }
  console.log('overflowing', overflowingChips.value.size);
};

const removeSelectedItem = (selectedItem) => {
  selectedItemsSet.value.delete(selectedItem);
};

watch(
  () => textField.value,
  async () => {
    await nextTick();
    if (textField.value) {
      setTimeout(() => {
        textField.value.focus();
      }, 200);
    }
  }
);

watch(search, () => {
  active.value = 0;
});

watch(open, (value) => {
  if (!value) {
    active.value = 0;
    search.value = "";
  }
});

watch(active, (value) => {
  const parent = sheetRef.value?.$el;
  const el = parent?.querySelector(`[data-index="${value}"]`) as HTMLElement;
  el.scrollIntoView({ block: "nearest" });
});

let observer: ResizeObserver | undefined;

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

const registerChip = ({id, api}: {id: number, api: OverflowingChipApi}) => {
  console.log('register chip', id);
  registeredChips.set(id, api);
};

const unregisterChip = ({id}: {id: number}) => {
  console.log('unregister chip', id);
  registeredChips.delete(id);
  updateOverflowingChips();
};

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
      v-model:model-value="selectedItems"
      chips
      multiple
      readonly
      placeholder="Select city ..."
      persistent-placeholder
      @click.prevent.stop="openPopup"
      @keydown="selectKeyDown"
      @keyup.prevent.stop
      density="comfortable"
      closable-chips
      color="primary"
      :variant="variant"
      :focused="open"
    >
      <template #chip="{ index, item, props: chipProps }">
        <SelectV2Chip
          :bound="bound"
          :index="index"
          :item="item"
          v-bind="chipProps"
          @overflowing="handleChipOverflow"
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
      :offset="[15, 15]"
      :width="width"
      :close-on-content-click="false"
      no-click-animation
      transition="none"
    >
      <v-sheet ref="sheetRef" v-if="open" :elevation="2">
        <v-text-field
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
        <v-list density="compact" max-height="50vh">
          <template #default>
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
