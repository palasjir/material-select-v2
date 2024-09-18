<script lang="ts" setup>
import {VChip, VMenu} from "vuetify/components";
import SelectV2MoreChipsMenuList from "./SelectV2MoreChipsMenuList.vue";
import {computed} from "vue";
import {useSelectV2Store} from "./SelectV2Store.ts";

const {overflowingChips} = useSelectV2Store();
const count = computed(() => overflowingChips.value.size)
</script>

<template>
  <VMenu open-on-hover transition="none" :disabled="count < 1" :close-on-content-click="false">
    <template #activator="{ props: activatorProps }">
      <div class="__placeholder" v-bind="activatorProps">
        <VChip
            v-show="count"
            variant="tonal"
            color="primary"
            @click.prevent.stop
        >
          <div>+{{ count }}</div>
        </VChip>
      </div>
    </template>
    <SelectV2MoreChipsMenuList  />
  </VMenu>
</template>

<style scoped>
.__placeholder {
  height: 24px;
  width: 40px;
}
</style>