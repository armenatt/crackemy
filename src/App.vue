<template>
  <div class="app">
    <Main v-if="config" :config="config" :path="coursePath" />
    <DragAndDropPlug v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Main from "./components/Main.vue";
import { TConfig } from "./Config";
import DragAndDropPlug from "./components/DragAndDropPlug.vue";

const coursePath = ref("");
const config = ref<TConfig>();

window.api.onDirectorySelected((path) => {
  coursePath.value = path;

  config.value = JSON.parse(
    window.api.readFile(coursePath.value + "/config.json", "utf-8")
  );
});
</script>

<style>
body {
  /* overflow-y: hidden; */
  /* width: 100%; */
  height: 100%;
}
body,
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
