<script lang="ts" setup>
import SelectV2 from "../components/SelectV2/SelectV2.vue";
import {useMutation, useQuery} from "@tanstack/vue-query";
import {cities} from "./cities.ts";
import {take} from "lodash";
import {ref} from "vue";
import {SelectItem} from "../components/SelectV2/types.ts";

interface Props {
  variant: 'underlined' | 'outlined';
}

defineProps<Props>();

let counter = 10_000;

// This simulates async search on the backend (normally we would do some API call here)
const getItems = (search: string) => {
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      if (!search) {
        return resolve(take(cities, 10));
      }
      const filtered = cities.filter(city => city.title.toLowerCase().includes(search.toLowerCase()));
      resolve(filtered);
    }, 2000)
  });
}

const search = ref('')

const asyncItems = useQuery({
  queryKey: ['cities', {search}],
  queryFn: async () => {
    return getItems(search.value);
  },
});

const createAsync = useMutation({
  mutationKey: ['createItem'],
  mutationFn: async (value: string) => {
    const item: SelectItem = {id: counter, title: value};
    counter += 1;
    return new Promise<SelectItem>((resolve) => {
      setTimeout(() => {
        resolve(item);
      }, 2000)
    });
  },
})

const updateSearch = (value: string) => {
  search.value = value;
  asyncItems.refetch();
}

</script>

<template>
  <section>
    <header class="mb-4">
      <h3>Async search and create item </h3>
      <p class="text-caption">
        - Simulates search via api call (delay set to 2000ms).<br>
        - Showcases async item creation (delay set to 2000ms).<br>
        - This example initially loads 10 items<br>
      </p>
    </header>

    <SelectV2
        multiple
        :items="asyncItems"
        search-enabled
        creation-enabled
        :on-create="createAsync"
        :variant="variant"
        select-placeholder="Select cities ..."
        search-placeholder="Search cities ..."
        @update:search="updateSearch"
    />
  </section>
</template>

<style scoped>

</style>