<script lang="ts" setup>
import {VChip, VMenu} from "vuetify/components";
import SelectV2MoreChipsMenuList from "./SelectV2MoreChipsMenuList.vue";

interface Props {
  count: number;
  width: number;
}

defineProps<Props>();


</script>

<template>
  <VMenu open-on-hover transition="none" :close-on-content-click="false">
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
    <SelectV2MoreChipsMenuList :max-width="width"  />
  </VMenu>
</template>

<style scoped>
.__placeholder {
  height: 24px;
  width: 40px;
}
.more-chips-menu {
  transform: translateX(25px);
}
</style>