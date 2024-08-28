<script lang="ts" setup>
import { v4 } from "uuid";
import { ref, watch, nextTick, onMounted, computed } from "vue";
import SelectV2Chip from "./SelectV2Chip.vue";

const props = withDefaults(
  defineProps<{
    id?: string;
    multiple?: boolean;
    searchEnabled?: boolean;
    items: any[];
  }>(),
  {
    id: () => `select-${v4()}`,
    multiple: false,
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
const overflowingChips = ref(new Set());

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
    console.log("delete", id);
    overflowingChips.value.delete(id);
  }
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

onMounted(() => {
  if (selectRef.value) {
    const rect = selectRef.value.$el.getBoundingClientRect();
    width.value = rect.width;
    bound.value = rect.right;
  }
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
      density="default"
      closable-chips
      color="primary"
      variant="underlined"
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
        <v-menu :close-on-content-click="false" open-on-hover transition="none">
          <template #activator="{ props: activatorProps }">
            <div>
              <v-chip
                v-if="overflowingChips.size"
                variant="tonal"
                color="primary"
                v-bind="activatorProps"
                >+{{ overflowingChips.size }}</v-chip
              >
            </div>
          </template>

          <v-sheet class="d-flex flex-wrap ga-2 pa-4">
            <v-chip
              v-for="selectedItem in selectedItems"
              closable
              @click:close="removeSelectedItem(selectedItem)"
            >
              {{ selectedItem.title }}
            </v-chip>
          </v-sheet>
        </v-menu>
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
