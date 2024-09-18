import {useSelectV2Store} from "./SelectV2Store.ts";
import {computed, unref, MaybeRef} from "vue";
import {SelectItem} from "./types.ts";


export interface ListItemDeps {
    item: MaybeRef<SelectItem>;
    index: MaybeRef<number>;
}

export function useSelectV2ListItem(props: ListItemDeps) {
    const {
        isItemSelected, isActiveItem, toggleItem, activeDown, activeUp, activeCycle, activeConfirm,
        width,
    } = useSelectV2Store();

    const isSelected = computed(() => isItemSelected(unref(props.item)));
    const isActive = computed(() => isActiveItem(unref(props.index)));
    const maxWidth = computed(() => width.value - 80);
    const classNames = computed(() => (['select-list-item', {'select-list-item--selected': isSelected.value}]));


    let keydownPromise: Promise<void> | undefined;

    const handleClick = async (_event: MouseEvent | KeyboardEvent) => {
        // both click and keydown event is fired even when is 'Enter' press with focus on item, click event is fired first
        // so we defer the click event and wait for keydown event to finish first if it was fired
        // this is Vuetify behavior
        setTimeout(async () => {
            if (keydownPromise) {
                await keydownPromise;
                keydownPromise = undefined;
                return;
            }
            toggleItem(unref(props.index));
        }, 10);
    }

    const handleListKeyDown = (event: KeyboardEvent) => {
        keydownPromise = new Promise<void>((resolve) => {
            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    activeDown();
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    activeUp();
                    break;
                case "Tab":
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    activeCycle();
                    break;
                case "Enter":
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    activeConfirm();
                    break;
            }
            resolve();
        })
    };

    // NOTE: It would be nice to have a ripple effect but since the issue with the click handler above the ripple effect is fired on wrong item and being really confusing
    const ripple = false;

    return {
        props: computed(() => ({
            class: classNames.value,
            active: isActive.value,
            onClick: handleClick,
            onKeydown: handleListKeyDown,
            'data-index': unref(props.index),
            ripple,
        })),
        isSelected,
        isActive,
        maxWidth,
    } as const;
}