import {AsyncQuery, InfiniteRecord, MutationQuery} from "./types.ts";

export function isAsyncQuery(x: any): x is AsyncQuery {
    return 'data' in x && 'refetch' in x && !('fetchNextPage' in x);
}

export function isInfiniteQuery(x: any): x is InfiniteRecord {
    return 'data' in x && 'fetchNextPage' in x;
}

export function isMutationQuery(x: any): x is MutationQuery {
    return x && 'mutate' in x;
}