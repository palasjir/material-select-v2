import {inject, provide} from "vue";
import {OverflowingChipApi} from "./types.ts";

type SelectV2Store = {
    registerChip: (args: { id: number, api: OverflowingChipApi }) => void;
    unregisterChip: (args: { id: number }) => void;
    updateOverflowingChips: () => void;
}

const STORE_KEY = 'select-v2';

export function provideSelectV2Store() {

    const registeredChips = new Map<number, OverflowingChipApi>();

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

    const store = {
        registerChip,
        unregisterChip,
        updateOverflowingChips,
    }

    provide<SelectV2Store>(STORE_KEY, store);

    return store;
}

export function useSelectV2Store() {
    return inject<SelectV2Store>(STORE_KEY)!;
}