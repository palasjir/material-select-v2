import {ref, Ref} from "vue";

export class AsyncValue<T> {

    private _value: Ref<T | undefined> = ref();
    private _loading: Ref<boolean>;

    constructor(private fn: (search: string) => Promise<T>, initialValue: T) {
        this._value.value = initialValue;
        this._loading = ref(false);

    }

    get value() {
        return this._value;
    }

    get loading() {
        return this._loading;
    }

    async execute(search: string) {
        this._loading.value = true;
        const result = await this.fn(search);
        this._value.value = result;
        this._loading.value = false;
    }
}