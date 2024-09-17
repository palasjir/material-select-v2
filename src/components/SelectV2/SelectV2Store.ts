import {computed, ComputedRef, inject, provide, readonly, ref, Ref} from "vue";
import {AsyncQuery, CreateItemFn, InfiniteRecord, MutationQuery, OverflowingChipApi, SelectItem} from "./types.ts";
import {isAsyncQuery, isInfiniteQuery, isMutationQuery} from "./utils.ts";
import {isFunction} from "lodash";
import {NEW_VALUE_INDEX} from "./constants.ts";

type SelectV2Store = {
    isOpen: Ref<boolean>;
    open: () => void;
    close: () => void;

    search: Ref<string>;

    selectedItemsSet: Ref<Map<number, SelectItem>>;
    selectedItems: ComputedRef<SelectItem[]>;
    filteredItems: ComputedRef<SelectItem[]>;

    registerChip: (args: { id: number, api: OverflowingChipApi }) => void;
    unregisterChip: (args: { id: number }) => void;
    updateOverflowingChips: () => void;
    isItemSelected: (item: SelectItem) => boolean;
    removeSelectedItem: (item: SelectItem) => void;

    toggleItem(index: number): void;
    addItem: () => void;

    creatingIndicator: ComputedRef<boolean>;
    loadingIndicator: ComputedRef<boolean>;

    active: Readonly<Ref<number>>;
    activeUp: () => void;
    activeDown: () => void;
    activeCycle: () => void;
    activeConfirm: () => void;
    activeReset: () => void;
    isActiveItem: (index: number) => boolean;
}

const STORE_KEY = 'select-v2';

type Deps = {
    creationEnabled: boolean;
    multiple: boolean;
    items:
        SelectItem[] |
        AsyncQuery |
        InfiniteRecord;

    onCreate?: CreateItemFn | MutationQuery;
}

export function provideSelectV2Store(deps: Deps) {
    const minIndex = computed(() => deps.creationEnabled ? NEW_VALUE_INDEX : 0);

    const isOpen = ref<boolean>(false);
    const search = ref<string>("");
    const selectedItemsSet = ref(new Map<number, SelectItem>());
    const registeredChips = new Map<number, OverflowingChipApi>();
    const active = ref<number>(minIndex.value);

    const selectedItems = computed<SelectItem[]>(() => {
        return [...selectedItemsSet.value.values()];
    });

    const filteredItems = computed<SelectItem[]>(() => {
        const searchValue = search.value.toLocaleLowerCase();
        const _items = deps.items;

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

    const creatingIndicator = computed<boolean>(() => {
        const _onCreate = deps.onCreate;
        if (isMutationQuery(_onCreate)) {
            return _onCreate.isPending.value
        }
        return false;
    })

    const loadingIndicator = computed<boolean>(() => {
        const _items = deps.items;
        let temp = false;

        if (isAsyncQuery(_items) && isInfiniteQuery(_items)) {
            return _items.isFetching.value
        }

        temp = temp || creatingIndicator.value;
        return temp;
    });

    const open = () => {
        isOpen.value = true;
    }

    const close = () => {
        isOpen.value = false;
    }

    const isItemSelected = (item: SelectItem): boolean => {
        return selectedItemsSet.value.has(item.id);
    };

    const removeSelectedItem = (item: SelectItem) => {
        selectedItemsSet.value.delete(item.id);
    };

    const registerChip = ({id, api}: { id: number, api: OverflowingChipApi }) => {
        registeredChips.set(id, api);
    };

    const unregisterChip = ({id}: { id: number }) => {
        registeredChips.delete(id);
        updateOverflowingChips();
    };

    const updateOverflowingChips = () => {
        requestAnimationFrame(() => {
            for (const [_, value] of registeredChips) {
                value.check();
            }
        })
    }

    const activeDown = () => {
        console.log('activeDown', active.value);
        active.value = Math.min(filteredItems.value.length - 1, active.value + 1);
    }

    const activeUp = () => {
        console.log('activeUp', active.value);
        active.value = Math.max(minIndex.value, active.value - 1);
    }

    const activeCycle = () => {
        console.log('activeCycle', active.value);
        active.value = (active.value + 1) % filteredItems.value.length;
    }

    const activeConfirm = () => {
        console.log('activeConfirm', active.value);
        if (active.value === NEW_VALUE_INDEX) {
            addItem();
        } else {
            toggleItem(active.value);
        }
    }

    const activeReset = () => {
        console.log('activeReset', active.value);
        active.value = minIndex.value;
    }

    const isActiveItem = (index: number) => {
        return active.value === index;
    }

    const toggleItem = (index: number) => {
        console.log('toggleItem', index);
        const item = filteredItems.value[index];
        if(!item) return;
        const itemId = item.id;
        const _items = selectedItemsSet.value;

        if (!deps.multiple) {
            _items.clear();
        }

        if (_items.has(itemId)) {
            _items.delete(itemId);
        } else {
            _items.set(itemId, item);
        }
        active.value = index;
    };

    const addItem = async () => {
        const title = search.value.trim();
        const _onCreate = deps.onCreate;
        if (title && _onCreate) {
            let item: any;
            if (isMutationQuery(_onCreate)) {
                item = await _onCreate.mutateAsync(title);
            } else if (isFunction(_onCreate)) {
                item = _onCreate(title);
            }

            selectedItemsSet.value.set(item.id, item);
            search.value = "";
        }
    };

    const store: SelectV2Store = {
        search,
        isOpen,
        open,
        close,
        selectedItemsSet,
        selectedItems,
        filteredItems,
        registerChip,
        unregisterChip,
        updateOverflowingChips,
        isItemSelected,
        removeSelectedItem,

        toggleItem,
        addItem,

        creatingIndicator,
        loadingIndicator,

        active: readonly(active),
        activeUp,
        activeDown,
        activeCycle,
        activeConfirm,
        activeReset,
        isActiveItem,
    }

    provide<SelectV2Store>(STORE_KEY, store);

    return store;
}

export function useSelectV2Store() {
    return inject<SelectV2Store>(STORE_KEY)!;
}