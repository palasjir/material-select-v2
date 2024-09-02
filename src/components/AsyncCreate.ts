import {ref, Ref} from "vue";


export type CreationResult<T> = {
    state: 'success';
    value: T;
} | { state: 'error'};

export class AsyncCreate<T> {

    private _result: Ref<CreationResult<T> | undefined>;
    private _loading = ref(false);

    constructor(private fn: (search: string) => Promise<CreationResult<T>>) {
        this._result = ref(undefined);
    }

    get result() {
        return this._result;
    }

    get loading() {
        return this._loading;
    }


    async execute(search: string): Promise<CreationResult<T>> {
        this._loading.value = true;
        const result =  await this.fn(search);
        this._result.value = result;
        this._loading.value = false;
        return result;
    }
}