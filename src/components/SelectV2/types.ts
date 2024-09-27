import {InfiniteData, UseInfiniteQueryReturnType, UseMutationReturnType, UseQueryReturnType} from "@tanstack/vue-query";

export type SelectItem<T = unknown> = {
    value: number | string;
    title: string;
    /**
     * Additional user data. Not used by select component.
     */
    data?: T
    isCustom?: boolean;
};

export type FilteredSelectItem<T = unknown> = {type: 'category', title: string} | {type: 'item'} & SelectItem<T> | {type: 'not-found'};


export type InfiniteRecord<T> = UseInfiniteQueryReturnType<InfiniteData<{
    page: number;
    items: SelectItem<T>[];
}, unknown>, Error>;

export type AsyncQuery<T> = UseQueryReturnType<SelectItem<T>[], Error>

export type MutationQuery<T> = UseMutationReturnType<SelectItem<T>, Error, string, unknown>;

export type CreateItemFn<T> = (searchValue: string) => Promise<SelectItem<T>> | SelectItem<T>;

export type OverflowingChipApi = {
    check(): void;
}

export type OverflowingPayload = {
    id: number;
    isOverflowing: boolean;
};