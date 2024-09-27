import {AsyncQuery, InfiniteRecord, MutationQuery} from "./types.ts";

export function isAsyncQuery<T>(x: any): x is AsyncQuery<T> {
    return 'data' in x && 'refetch' in x && !('fetchNextPage' in x);
}

export function isInfiniteQuery<T>(x: any): x is InfiniteRecord<T> {
    return 'data' in x && 'fetchNextPage' in x;
}

export function isMutationQuery<T>(x: any): x is MutationQuery<T> {
    return x && 'mutate' in x;
}