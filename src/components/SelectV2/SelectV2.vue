<script lang="ts" setup generic="T">
import {v4} from "uuid";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {ComponentExposed} from 'vue-component-type-helpers';
import {VMenu, VSelect, VSheet, VTextField} from "vuetify/components";
import SelectV2Chip from "./SelectV2ItemMultipleChip.vue";
import SelectV2MoreChipsMenu from "./SelectV2MoreChipsMenu.vue";
import {AsyncQuery, CreateItemFn, InfiniteRecord, SelectItem} from "./types.ts";
import {provideSelectV2Store} from "./SelectV2Store.ts";
import SelectV2SingleChip from "./SelectV2ItemSingleChip.vue";
import SelectV2List from "./SelectV2List.vue";
import {debounce} from "lodash";
import {useEventListener} from '@vueuse/core'

type Props = {
  id?: string;
  multiple?: boolean;

  /**
   * Search for items is enabled: Default: true. We want to encourage usage of search.
   */
  searchEnabled?: boolean;

  items:
      SelectItem<T>[] |
      AsyncQuery |
      InfiniteRecord;

  /**
   * Placeholder text in select
   */
  selectPlaceholder: string;
  /**
   * Placeholder text in search
   */
  searchPlaceholder: string;

  onCreate?: CreateItemFn;

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
      searchEnabled: true,
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
} = provideSelectV2Store<T>(props, {
  onSearchUpdate: (value) => emit('update:search', value),
});

let observer: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;

const id = ref<string>(props.id);
const menuRef = ref<ComponentExposed<typeof VMenu> | undefined>();
const textFieldRef = ref<ComponentExposed<typeof VTextField> | undefined>();
const sheetRef = ref<ComponentExposed<typeof VSheet> | undefined>();

const openedInDirection = ref<'down' | 'up' | undefined>('down');

const offset = computed(() => {
  return props.variant === 'underlined' ? [5, 0] : [15, 15];
});

const location = computed(()=> {
   return openedInDirection.value === 'up' ? 'top left' : 'bottom left';
})

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

// not used keeping for reference for other potential uses
// const infiniteLoaderRef = ref<ComponentExposed<typeof VListItem> | undefined>();
// const listRef = ref<ComponentExposed<typeof VList> | undefined>();
// const setupInfiniteScroll = () => {
//   const _items = props.items;
//
//   if (props.infinite && isInfiniteQuery(_items)) {
//     const infiniteLoaderElement = infiniteLoaderRef.value?.$el as HTMLElement | undefined;
//     const listElement = listRef.value?.$el as HTMLElement | undefined;
//     if (infiniteLoaderElement && listElement) {
//       const ioOptions = {
//         root: listElement,
//         threshold: 0.4
//       }
//       const io = new IntersectionObserver((entries) => {
//         const entry = entries[0];
//         if (entry.isIntersecting) {
//           _items.fetchNextPage();
//         }
//       }, ioOptions);
//       io.observe(infiniteLoaderElement)
//     }
//   }
// }

// watch(isOpen, async (value) => {
//   if (value) {
//     await nextTick();
//     // setupInfiniteScroll();
//   }
// });

watch(
    () => textFieldRef.value,
    async () => {
      await nextTick();
      const field = textFieldRef.value;
      if (field) {
        setTimeout(() => {
          field?.focus();
        }, 200);
      }
    }
);



watch(active, (value) => {
  const parent = sheetRef.value?.$el;
  const el = parent?.querySelector(`[data-index="${value}"]`) as HTMLElement | undefined;
  el?.scrollIntoView({block: "nearest"});
});

const checkPopupPosition = debounce(async () => {
  if(!isOpen.value) return;
  let loopCounter = 0;
  let {y: sheetTop} = sheetRef.value?.$el.getBoundingClientRect();
  let {y: selectTop} = selectRef.value?.$el.getBoundingClientRect();

  while (sheetTop < 0 && loopCounter < 10) {
    await nextTick();
    sheetTop = sheetRef.value?.$el.getBoundingClientRect()?.y ?? -1;
    // just in case, prevent infinite loop if things go wrong somehow
    loopCounter++;
  }

  // fixate the position of sheet
  if (sheetTop < selectTop) {
    openedInDirection.value = 'up';
  } else {
    openedInDirection.value = 'down';
  }
}, 5);

watch(sheetRef, async (sheet) => {
  if (sheet) {
    await nextTick();
    // check popup position with some delay
    checkPopupPosition();
  }
})

useEventListener('scroll', checkPopupPosition);

onMounted(() => {
  const selectElement = selectRef.value?.$el as HTMLElement | undefined;
  if (selectElement) {
    updateDimensions();
    updateOverflowingChips();

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
        <SelectV2SingleChip v-else :item="selectedItems[0]"/>
      </template>
      <template #append-inner>
        <SelectV2MoreChipsMenu/>
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
        :location="location"
        opacity="0.5"
        @update:model-value="setOpen"
    >
      <VSheet
          v-if="isOpen"
          ref="sheetRef" class="d-flex flex-column"
          :class="{
              'flex-column': openedInDirection === 'down',
              'flex-column-reverse': openedInDirection === 'up'}"
          :elevation="1"
          :width="width"
          rounded
          border
      >
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
