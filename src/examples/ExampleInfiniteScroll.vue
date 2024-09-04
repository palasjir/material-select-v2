<script lang="ts" setup>
import SelectV2 from "../components/SelectV2/SelectV2.vue";
import {useInfiniteQuery} from "@tanstack/vue-query";
import {cities} from "./cities.ts";

interface Props {
  variant: 'underlined' | 'outlined';
}

defineProps<Props>();

const perPage = 20;
const maxPages = Math.ceil(cities.length / perPage);

const fetchItems = async ({ pageParam = 0 }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        page: pageParam,
        items: cities.slice(pageParam * perPage, (pageParam + 1) * perPage)
      });
    }, 500);
  });
}

const infiniteQuery = useInfiniteQuery({
  initialPageParam: 0,
  maxPages: maxPages,
  queryKey: ['items'],
  queryFn: fetchItems,
  getNextPageParam: (lastPage) => lastPage.page + 1,

})

</script>

<template>
  <section>
    <header class="mb-4">
      <h3>Infinite scroll </h3>
      <p class="text-caption">
        (delay 500ms)
      </p>
    </header>

    <SelectV2
        multiple
        :variant="variant"
        :items="infiniteQuery"
        infinite
        select-placeholder="Select cities ..."
        search-placeholder="Search cities ..."
    />
  </section>
</template>

<style scoped>

</style>