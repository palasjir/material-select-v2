<script setup lang="ts">
import SelectV2 from "./components/SelectV2.vue";
import { cities } from "./components/cities";
import {ref} from "vue";

const variant = ref('underlined')

</script>

<template>
  <v-app>
    <v-container class="d-flex flex-column ga-4">
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

      <div>
        <label>
          Variant:
        <v-select v-model="variant" :items="['outlined', 'underlined']" />

        </label>
      </div>

      <article class="d-flex flex-column ga-4">
        <header>
          <h2>Single select</h2>
        </header>

        <section>
          <header>
            <h3>With search</h3>
          </header>
          <SelectV2 :variant="variant" :items="cities" search-enabled />
        </section>
      </article>

      <article class="d-flex flex-column ga-4">
        <header>
          <h2>Multi select</h2>
        </header>

        <section>
          <header>
            <h3>With search</h3>
          </header>
          <SelectV2 multiple :items="cities" search-enabled :variant="variant" />
        </section>

        <section>
          <header>
            <h3>With search and create item</h3>
          </header>

          <SelectV2 multiple :items="cities" search-enabled creation-enabled :variant="variant" />
        </section>
      </article>

      <div style="height: 800px">

      </div>
    </v-container>
  </v-app>
</template>

<style scoped></style>
