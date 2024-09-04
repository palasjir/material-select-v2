<script setup lang="ts">
import SelectV2 from "./components/SelectV2/SelectV2.vue";
import {cities} from "./examples/cities.ts";
import {ref} from "vue";
import {take} from "lodash";
import ExampleInfiniteScroll from "./examples/ExampleInfiniteScroll.vue";
import ExampleAsyncLoading from "./examples/ExampleAsyncLoading.vue";

const variant = ref('underlined')

let counter = 10_000;

const createItem = (value: string) => {
  const item = {id: counter, title: value};
  counter += 1;
  return item;
}


</script>

<template>
  <v-app class="">
    <v-container class="d-flex flex-column ga-4" max-width="90ch">
      <v-sheet class="d-flex flex-column pa-2 ga-4">
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

      <v-divider/>

      <v-sheet class="d-flex flex-column pa-2 ga-4">
        <header class="mb-4">
          <h2>Single</h2>
          <p class="text-caption">
            - Allows to select only single item.<br>
          </p>
        </header>

        <section>
          <header class="mb-4">
            <h3>Without search (10 items)</h3>
            <p class="text-caption">
              - Shows only first 10 items.<br>
              - For selects with more items we should always include search
            </p>
          </header>
          <SelectV2
              :items="take(cities, 10)"
              :variant="variant"
              select-placeholder="Select city ..."
              search-placeholder="Search city ..."
          />
        </section>

        <section>
          <header class="mb-4">
            <h3>With search</h3>
          </header>
          <SelectV2
              :variant="variant"
              :items="cities"
              search-enabled
              select-placeholder="Select city ..."
              search-placeholder="Search city ..."
          />
        </section>

        <section>
          <header class="mb-4">
            <h3>With search and create item</h3>
          </header>

          <SelectV2
              :items="cities"
              search-enabled
              creation-enabled
              :variant="variant"
              select-placeholder="Select city ..."
              search-placeholder="Search city ..."
          />
        </section>

      </v-sheet>

      <v-divider/>

      <v-sheet class="d-flex flex-column pa-2 ga-4">
        <header class="mb-4">
          <h2>Multi</h2>
          <p class="text-caption">
            - Allows to select multiple items.<br>
          </p>
        </header>

        <section>
          <header class="mb-4">
            <h3>Without search</h3>
            <p class="text-caption">
              - Shows only first 10 items.<br>
              - For selects with more items we should always include search
            </p>
          </header>
          <SelectV2
              multiple
              :items="take(cities, 10)"
              :variant="variant"
              select-placeholder="Select cities ..."
              search-placeholder="Search cities ..."
          />
        </section>

        <section>
          <header class="mb-4">
            <h3>With search</h3>
          </header>
          <SelectV2
              multiple
              :items="cities"
              search-enabled
              :variant="variant"
              select-placeholder="Select cities ..."
              search-placeholder="Search cities ..."
          />
        </section>

        <section>
          <header class="mb-4">
            <h3>With search and create item</h3>
            <p class="text-caption">
              This example allows to add values that are not in the list
            </p>
          </header>

          <SelectV2
              multiple
              :items="cities"
              search-enabled
              creation-enabled
              :on-create="createItem"
              :variant="variant"
              select-placeholder="Select cities ..."
              search-placeholder="Search cities ..."
          />
        </section>


        <ExampleAsyncLoading :variant="variant"/>


        <ExampleInfiniteScroll :variant="variant"/>

      </v-sheet>

      <!-- Adding some extra space so it's possible to scroll down to test menu placements. -->
      <div style="height: 800px">

      </div>
    </v-container>
  </v-app>
</template>

<style scoped></style>
