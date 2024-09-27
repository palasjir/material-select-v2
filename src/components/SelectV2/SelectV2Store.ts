import {computed, ComputedRef, DeepReadonly, inject, provide, readonly, ref, Ref, watch} from "vue";
import {
    AsyncQuery,
    CreateItemFn,
    FilteredSelectItem,
    InfiniteRecord,
    OverflowingChipApi,
    OverflowingPayload,
    SelectItem
} from "./types.ts";
import {isAsyncQuery, isInfiniteQuery} from "./utils.ts";
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
    creationEnabled: Readonly<Ref<boolean>>;

    selectedItemsSet: Ref<Map<SelectItem['value'], SelectItem>>;
    selectedItems: ComputedRef<SelectItem[]>;
    filteredItems: ComputedRef<FilteredSelectItem[]>;

    selectRef: Ref<VSelect | null>;
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
    removeItem(item: SelectItem): Promise<void>;

    creatingIndicator: Readonly<Ref<boolean>>;
    loadingIndicator: Readonly<Ref<boolean>>;

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

const STORE_KEY = Symbol('select-v2');

type Deps<T> = {
    multiple: boolean;
    items:
        SelectItem<T>[] |
        AsyncQuery<T> |
        InfiniteRecord<T>;
    onCreate?: CreateItemFn<T>;
}

type Options = {
    onSearchUpdate?: (value: string) => void;
}

export function provideSelectV2Store<T>(deps: Deps<T>, options?: Options) {
    const creationEnabled = computed(() => deps.onCreate !== undefined);
    const minIndex = computed(() => creationEnabled.value ? NEW_VALUE_INDEX : FIRST_VALUE_INDEX);

    let lock = false;
    const selectRef = ref<VSelect | null>(null);
    const isOpen = ref<boolean>(false);
    const search = ref<string>("");
    const selectedItemsMap = ref(new Map<SelectItem['value'], SelectItem>());
    const createdItemsMap = ref(new Map<SelectItem['value'], SelectItem>());
    const registeredChips = new Map<number, OverflowingChipApi>();
    const active = ref<number>(minIndex.value);
    const width = ref<number>(0);
    const bound = ref<number>(0);
    const overflowingChips = ref(new Set<number>());

    const selectedItems = computed<SelectItem[]>(() => {
        return [...selectedItemsMap.value.values()];
    });

    const filteredItems = computed<FilteredSelectItem[]>(() => {
        const searchValue = search.value.toLowerCase();

        const unfilteredItems = deps.items ?? [];
        const _items: FilteredSelectItem[]  = [];
        let notFound = true;

        if(createdItemsMap.value.size > 0) {
            createdItemsMap.value.forEach((it) => {
                const matches = it.title.toLowerCase().includes(searchValue)
                if (matches) {
                    _items.push({type: 'item', ...it});
                }
            });

            if(_items.length > 0) {
                _items.unshift({
                    type: 'category',
                    title: 'Custom',
                })
            }
        }

        if(_items.length > 0) {
            _items.push({
                type: 'category',
                title: 'Original',
            })
        }

        // simple array
        if (Array.isArray(unfilteredItems)) {
            unfilteredItems.forEach((it) => {
                const matches = it.title.toLowerCase().includes(searchValue)
                if (matches) {
                    notFound = false;
                    _items.push({type: 'item', ...it});
                }
            });
        }
        // async data from tanstack/vue-query
        else if (isAsyncQuery(unfilteredItems)) {
            const asyncItems = unfilteredItems.data.value ?? [];

            notFound = asyncItems.length === 0;

            asyncItems.forEach((it) => {
                _items.push({type: 'item', ...it});
            });
        }
        // infinite query
        else if(isInfiniteQuery(unfilteredItems)) {
            const _pages = unfilteredItems.data.value?.pages ?? [];
            const infiniteItems = _pages.flatMap((page) => page.items)
                .filter((it) =>
                it.title.toLowerCase().includes(searchValue)
            )

            notFound = infiniteItems.length === 0;

            infiniteItems.forEach((it) => {
                _items.push({type: 'item', ...it});
            });
        }

        if(notFound) {
            _items.push({type: 'not-found'})
        }

        return _items;
    });

    const creatingIndicator = ref<boolean>(false);

    const loadingIndicator = computed<boolean>(() => {
        const _items = deps.items;
        let temp = false;

        if (isAsyncQuery(_items) && isInfiniteQuery(_items)) {
            return _items.isFetching.value
        }

        temp = temp || creatingIndicator.value;
        return temp;
    });

    const isMatchingCreatedItem = computed<boolean>(() => {
        const _search = search.value;
        for (const [, item] of createdItemsMap.value) {
            if(item.title === _search) {
                return true;
            }
        }
        return false;
    })

    const isExactMatch = computed<boolean>(() => {
        const _items = filteredItems.value.filter(it => it.type === 'item');
        return _items.length === 1 && search.value === _items[0]?.title;
    })

    const isCreateItemVisible = computed(() => {
        return creationEnabled.value && !isExactMatch.value && !isMatchingCreatedItem.value;
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
        return selectedItemsMap.value.has(item.value);
    };

    const removeSelectedItem = (item: SelectItem) => {
        selectedItemsMap.value.delete(item.value);
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

    const activeDown = (): number => {
         let next = Math.min(filteredItems.value.length - 1, active.value + 1);
        // skip over non value items
        while (filteredItems.value[next]?.type !== 'item' && next < filteredItems.value.length) {
            next++;
        }
        active.value = next;

        return next;
    }

    const activeUp = (): number => {
        let prev = Math.max(minIndex.value, active.value - 1);
        // skip over non value items
        while (filteredItems.value[prev]?.type !== 'item' && prev > minIndex.value) {
            prev -= 1;
        }
        active.value = prev;

        return prev;
    }

    const activeCycle = () => {
        if(filteredItems.value.length === 0) {
            return;
        }
        active.value = (active.value + 1) % filteredItems.value.length;
    }

    const activeConfirm = async () => {
        if (isCreateItemVisible.value && active.value === NEW_VALUE_INDEX) {
            await addItem();
        } else {
            toggleItem(active.value);
        }
    }

    const activeReset = () => {
        if(isCreateItemVisible.value) {
            active.value = minIndex.value;
        } else {
            active.value = FIRST_VALUE_INDEX;
        }
    }

    const isActiveItem = (index: number) => {
        return active.value === index;
    }

    const toggleItem = (index: number) => {
        if(lock) return;
        lock = true;
        const item = filteredItems.value[index];
        if(item?.type !== 'item') return;
        const itemId = item.value;
        const _items = selectedItemsMap.value;

        if (!deps.multiple) {
            _items.clear();
        }

        if (_items.has(itemId)) {
            _items.delete(itemId);
        } else {
            _items.set(itemId, item);
        }
        active.value = index;
        if(!deps.multiple) {
            // first show the selection feedback in the list, it seemed weird without it
            setTimeout(() => {
                close();
                lock = false;
            }, 200)

        } else {
            lock = false;
        }
    };

    const addItem = async () => {
        if(lock) return;
        lock = true;
        creatingIndicator.value = true;

        const title = search.value.trim();
        const _onCreate = deps.onCreate;
        if (title && _onCreate) {
            let item: SelectItem;

            if (isFunction(_onCreate)) {
                item = await _onCreate(title);
            } else {
                throw new Error('SelectV2: onCreate must be a function!');
            }

            // only add created item if it's valid
            if(item && item.value && item.title) {
                const _item: SelectItem = {...item, isCustom: true};
                createdItemsMap.value.set(item.value, _item);
                if(!deps.multiple){
                    selectedItemsMap.value.clear();
                }
                selectedItemsMap.value.set(item.value, _item);
            } else {
               console.error('SelectV2: onCreate must return an object with value and title properties!');
            }

            search.value = "";
        }

        lock = false;
        creatingIndicator.value = false;
    };

    const removeItem = async (item: SelectItem) => {
        if(lock) return;
        lock = true;
        createdItemsMap.value.delete(item.value);
        selectedItemsMap.value.delete(item.value);
        lock = false;
    }

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

    watch(minIndex, activeReset, {immediate: true, flush: 'pre'});

    const store: SelectV2Store = {
        isExactMatch,
        isCreateItemVisible,

        search,
        setSearch,

        isOpen,
        open,
        close,
        setOpen,

        creationEnabled,
        selectedItemsSet: selectedItemsMap,
        selectedItems,
        filteredItems,
        registerChip,
        unregisterChip,
        updateOverflowingChips,
        isItemSelected,
        removeSelectedItem,

        toggleItem,
        addItem,
        removeItem,

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