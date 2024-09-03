<script setup lang="ts">
import SelectV2 from "./components/SelectV2.vue";
import {cities} from "./components/cities";
import {ref} from "vue";
import {take} from "lodash";
import {AsyncValue} from "./components/AsyncValue.ts";
import {AsyncCreate} from "./components/AsyncCreate.ts";
import {useInfiniteQuery} from "@tanstack/vue-query";
import ExampleInfiniteScroll from "./ExampleInfiniteScroll.vue";

const variant = ref('underlined')

// This simulates async search on the backend (normally we would do some API call here)
const getItems = (search: string) => {
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      if(!search) {
        return resolve(take(cities, 10));
      }
      const filtered = cities.filter(city => city.title.toLowerCase().includes(search.toLowerCase()));
      resolve(filtered);
    }, 2000)
  });
}

const asyncItems = new AsyncValue(getItems, []);

let counter = 10_000;

const createItem = (value: string) => {
  const item = {id: counter, title: value};
  counter += 1;
  return item;
}

const createItemAsync = new AsyncCreate<any>(async (value: string) => {
  const item = {id: counter, title: value};
  counter += 1;
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      resolve(item);
    }, 2000)
  });
});


</script>

<template>
  <v-app>
    <v-container class="d-flex flex-column ga-4">
      <v-sheet class="d-flex flex-column pa-2 ga-4" border rounded>
        <h1>New generation select (POC)</h1>
        <div>
          <v-alert type="info" variant="outlined">
        <pre>
       Select with improved UX:
       
       Behaviour:
         - click to open, or focus and press spacebar or enter
         - use text field to filter items
         - pressing "Enter" selects currently higlighted item (gray)
         - "arrow down" and "arrow up" moves currently higligted item up and down (stops at bottom and top)
         - 'Tab' cycles trough and highlihtes items
         - clicking on item also selects it
         - 'Esc' to close
         

       Notes:
         - selected items higlighted blue
        </pre>
          </v-alert>
        </div>

        <div>
          <v-select
              label="Variant"
              variant="outlined"
              flat
              color="primary"
              v-model="variant"
              :items="['outlined', 'underlined']"
              hide-details
          />
        </div>
      </v-sheet>

      <v-sheet class="d-flex flex-column pa-2 ga-4" border rounded>
        <header>
          <h2>Single</h2>
        </header>

        <section>
          <header>
            <h3>Without search (10 items)</h3>
          </header>
          <SelectV2 :items="take(cities, 10)" :variant="variant"/>
        </section>

        <section>
          <header>
            <h3>With search</h3>
          </header>
          <SelectV2 :variant="variant" :items="cities" search-enabled/>
        </section>

        <section>
          <header>
            <h3>With search and create item</h3>
          </header>

          <SelectV2 :items="cities" search-enabled creation-enabled :variant="variant"/>
        </section>

      </v-sheet>

      <v-sheet class="d-flex flex-column pa-2 ga-4" border rounded>
        <header>
          <h2>Multi</h2>
        </header>

        <section>
          <header>
            <h3>Without search (10 items)</h3>
          </header>
          <SelectV2 multiple :items="take(cities, 10)" :variant="variant"/>
        </section>

        <section>
          <header>
            <h3>With search</h3>
          </header>
          <SelectV2 multiple :items="cities" search-enabled :variant="variant"/>
        </section>

        <section>
          <header>
            <h3>With search and create item</h3>
          </header>

          <SelectV2 multiple :items="cities" search-enabled creation-enabled :on-create="createItem" :variant="variant"/>
        </section>


        <section>
          <header>
            <h3>Async search and create item (delay 2000ms)</h3>
          </header>

          <SelectV2 multiple :items="asyncItems" search-enabled creation-enabled :on-create="createItemAsync" :variant="variant"/>
        </section>


        <ExampleInfiniteScroll :variant="variant" />

      </v-sheet>

      <!-- Adding some extra space so it's possible to scroll down to test menu placements. -->
      <div style="height: 800px">

      </div>
    </v-container>
  </v-app>
</template>

<style scoped></style>
