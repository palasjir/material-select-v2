import {computed, ComputedRef, DeepReadonly, inject, MaybeRef, provide, readonly, ref, Ref, unref} from "vue";
import {
    AsyncQuery,
    CreateItemFn,
    InfiniteRecord,
    MutationQuery,
    OverflowingChipApi,
    OverflowingPayload,
    SelectItem
} from "./types.ts";
import {isAsyncQuery, isInfiniteQuery, isMutationQuery} from "./utils.ts";
import {debounce, isFunction} from "lodash";
import {FIRST_VALUE_INDEX, NEW_VALUE_INDEX} from "./constants.ts";
import {VSelect} from "vuetify/components";

type SelectV2Store = {
    isOpen: Ref<boolean>;
    open: () => void;
    close: () => void;
    setOpen: (value: boolean) => void;

    search: Ref<string>;
    setSearch: (value: string) => void;
    isExactMatch: ComputedRef<boolean>;
    isCreateItemVisible: ComputedRef<boolean>;

    selectedItemsSet: Ref<Map<number, SelectItem>>;
    selectedItems: ComputedRef<SelectItem[]>;
    filteredItems: ComputedRef<SelectItem[]>;

    selectRef: Ref<any>;
    width: DeepReadonly<Ref<number>>;
    bound: DeepReadonly<Ref<number>>;
    updateDimensions: () => void;

    registerChip(args: { id: number, api: OverflowingChipApi }): void;
    unregisterChip: (args: { id: number }) => void;
    updateOverflowingChips: () => void;
    isItemSelected: (value: SelectItem) => boolean;
    removeSelectedItem: (item: SelectItem) => void;

    toggleItem(index: number): void;
    addItem(): void;

    creatingIndicator: ComputedRef<boolean>;
    loadingIndicator: ComputedRef<boolean>;

    active: Readonly<Ref<number>>;
    activeUp: () => void;
    activeDown: () => void;
    activeCycle: () => void;
    activeConfirm: () => void;
    activeReset: () => void;
    isActiveItem: (index: number) => boolean;

    overflowingChips: Ref<Set<number>>;
    setOverflowingChip({id, isOverflowing}: OverflowingPayload): void;

}

const STORE_KEY = 'select-v2';

type Deps = {
    creationEnabled: MaybeRef<boolean>;
    multiple: boolean;
    items:
        SelectItem[] |
        AsyncQuery |
        InfiniteRecord;

    onCreate?: CreateItemFn | MutationQuery;
}

type Options = {
    onSearchUpdate?: (value: string) => void;
}

export function provideSelectV2Store(deps: Deps, options?: Options) {
    const _creationEnabled = computed(() => unref(deps.creationEnabled));
    const minIndex = computed(() => deps.creationEnabled ? NEW_VALUE_INDEX : FIRST_VALUE_INDEX);

    const selectRef = ref<VSelect | undefined>();
    const isOpen = ref<boolean>(false);
    const search = ref<string>("");
    const selectedItemsSet = ref(new Map<number, SelectItem>());
    const registeredChips = new Map<number, OverflowingChipApi>();
    const active = ref<number>(minIndex.value);
    const width = ref<number>(0);
    const bound = ref<number>(0);
    const overflowingChips = ref(new Set<number>());

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

    const isExactMatch = computed<boolean>(() => {
        return filteredItems.value.length === 1 && search.value === filteredItems.value[0].title;
    })

    const isCreateItemVisible = computed(() => {
        return _creationEnabled.value && !isExactMatch.value;
    });

    const open = () => {
        isOpen.value = true;
        reset();
    }

    const close = () => {
        isOpen.value = false;
        reset();
    }

    const setOpen = (value: boolean) => {
        if(value) {
            open();
        } else {
            close();
        }
    }

    const reset = () => {
        search.value = "";
        activeReset();
    }

    const isItemSelected = (item: SelectItem): boolean => {
        return selectedItemsSet.value.has(item.value);
    };

    const removeSelectedItem = (item: SelectItem) => {
        selectedItemsSet.value.delete(item.value);
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
        active.value = Math.min(filteredItems.value.length - 1, active.value + 1);
    }

    const activeUp = () => {
        active.value = Math.max(minIndex.value, active.value - 1);
    }

    const activeCycle = () => {
        active.value = (active.value + 1) % filteredItems.value.length;
    }

    const activeConfirm = async () => {
        if (active.value === NEW_VALUE_INDEX) {
            await addItem();
        } else {
            toggleItem(active.value);
        }
    }

    const activeReset = () => {
        if(isCreateItemVisible.value) {
            active.value = FIRST_VALUE_INDEX;
        } else {
            active.value = minIndex.value;
        }
    }

    const isActiveItem = (index: number) => {
        return active.value === index;
    }

    const toggleItem = (index: number) => {
        const item = filteredItems.value[index];
        if(!item) return;
        const itemId = item.value;
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

    const updateDimensions = () => {
        const el = selectRef.value?.$el as HTMLElement | undefined;
        if(el) {
            const rect = el.getBoundingClientRect();
            width.value = rect.width;
            bound.value = rect.right;
        }
    }

    const setOverflowingChip = ({id, isOverflowing}: OverflowingPayload) => {
        if (isOverflowing) {
            overflowingChips.value.add(id);
        } else {
            overflowingChips.value.delete(id);
        }
    };

    const setSearch = (value: string) => {
        search.value = value;
        activeReset();
        debouncedSearch(value);
        options?.onSearchUpdate?.(value);
    }

    const debouncedSearch = debounce((value: string) => {
        const _value = value ?? '';
        options?.onSearchUpdate?.(_value);
    }, 250);

    const store: SelectV2Store = {
        isExactMatch,
        isCreateItemVisible,

        search,
        setSearch,

        isOpen,
        open,
        close,
        setOpen,

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

        selectRef,
        width: readonly(width),
        bound: readonly(bound),
        updateDimensions,

        overflowingChips,
        setOverflowingChip,
    }

    provide<SelectV2Store>(STORE_KEY, store);

    return store;
}

export function useSelectV2Store() {
    return inject<SelectV2Store>(STORE_KEY)!;
}