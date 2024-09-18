<script lang="ts" setup>
import {v4} from "uuid";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {ComponentExposed} from 'vue-component-type-helpers';
import {VList, VListItem, VMenu, VSelect, VSheet, VTextField} from "vuetify/components";
import SelectV2Chip from "./SelectV2ItemMultipleChip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";
import {AsyncQuery, CreateItemFn, InfiniteRecord, MutationQuery, SelectItem} from "./types.ts";
import {provideSelectV2Store} from "./SelectV2Store.ts";
import SelectV2SingleChip from "./SelectV2ItemSingleChip.vue";
import {isInfiniteQuery} from "./utils.ts";
import SelectV2List from "./SelectV2List.vue";

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
  selectRef,
  search,
  isOpen,
  setOpen,
  updateOverflowingChips,
  selectedItems,
  active,
  activeDown,
  activeUp,
  activeCycle,
  activeConfirm,
  open,
  setSearch,
  loadingIndicator,
  creatingIndicator,
  updateDimensions,
  width,
} = provideSelectV2Store(props, {
  onSearchUpdate: (value) => emit('update:search', value),
});

const id = ref<string>(props.id);

const menuRef = ref<ComponentExposed<typeof VMenu> | undefined>();
const textFieldRef = ref<ComponentExposed<typeof VTextField> | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();
const infiniteLoaderRef = ref<ComponentExposed<typeof VListItem> | undefined>();
const listRef = ref<ComponentExposed<typeof VList> | undefined>();

const offset = computed(() => {
  return props.variant === 'underlined' ? [5, 0] : [15, 15];
});

const searchKeyDown = (event: KeyboardEvent) => {
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
  // Open the menu
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    open();
    return;
  }
};

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
    () => textFieldRef.value,
    async () => {
      await nextTick();
      const field = textFieldRef.value;
      if (field) {
        setTimeout(() => {
          field.focus();
        }, 200);
      }
    }
);

// watch(isOpen, async (value) => {
//   if (value) {
//     await nextTick();
//     // setupInfiniteScroll();
//   }
// });

watch(active, (value) => {
  const parent = sheetRef.value?.$el;
  const el = parent?.querySelector(`[data-index="${value}"]`) as HTMLElement | undefined;
  el?.scrollIntoView({block: "nearest"});
});

let observer: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;

onMounted(() => {
  const selectElement = selectRef.value?.$el as HTMLElement | undefined;
  if (selectElement) {
    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
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
            :index="index"
            :item="selectedItems[index]"
        />
        <SelectV2SingleChip v-else :item="selectedItems[0]" />
      </template>
      <template #append-inner>
        <SelectV2MoreChipsMenu />
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
        @update:model-value="setOpen"
    >
      <VSheet ref="sheetRef" v-if="isOpen" :elevation="1" :width="width" rounded border>
        <VTextField
            v-if="searchEnabled"
            ref="textFieldRef"
            :model-value="search"
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
            @update:model-value="setSearch"
        />
        <VDivider/>

        <SelectV2List
            :creation-enabled="creationEnabled"
            :infinite="infinite"
            :multiple="multiple"
        />

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
