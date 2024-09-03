<script lang="ts" setup>
import SelectV2 from "./components/SelectV2.vue";
import {useInfiniteQuery} from "@tanstack/vue-query";
import {cities} from "./components/cities.ts";

interface Props {
  variant: 'underlined' | 'outlined';
}

defineProps<Props>();

const perPage = 20;
const maxPages = Math.ceil(cities.length / perPage);

const fetchItems = async ({ pageParam = 0 }) => {
  return {
    page: pageParam,
    items: cities.slice(pageParam * perPage, (pageParam + 1) * perPage)
  };
}

const infiniteQuery = useInfiniteQuery({
  initialPageParam: 0,
  maxPages: maxPages,
  queryKey: ['items'],
  queryFn: fetchItems,
  getNextPageParam: (lastPage, pages) => lastPage.page + 1,
})

infiniteQuery.hasNextPage

</script>

<template>
  <section>
    <header>
      <h3>Infinite scroll (delay 500ms)</h3>
    </header>

    <SelectV2 multiple :variant="variant" :items="infiniteQuery" search-enabled infinite />
  </section>
</template>

<style scoped>

</style>