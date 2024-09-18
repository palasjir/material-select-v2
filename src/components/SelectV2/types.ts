import {InfiniteData, UseInfiniteQueryReturnType, UseMutationReturnType, UseQueryReturnType} from "@tanstack/vue-query";

export type SelectItem = {
    value: number;
    title: string;
};

export type InfiniteRecord = UseInfiniteQueryReturnType<InfiniteData<{
    page: number;
    items: SelectItem[];
}, unknown>, Error>;

export type AsyncQuery = UseQueryReturnType<SelectItem[], Error>

export type MutationQuery = UseMutationReturnType<SelectItem, Error, string, unknown>;

export type CreateItemFn = (searchValue: string) => Promise<SelectItem>;

export type OverflowingChipApi = {
    check(): void;
}

export type OverflowingPayload = {
    id: number;
    isOverflowing: boolean;
};