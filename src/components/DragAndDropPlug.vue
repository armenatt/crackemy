<template>
  <div class="drag-and-drop">
    <div
      :class="{
        'drag-and-drop__square': true,
        'drag-and-drop__square--over': dragOver,
      }"
      @dragover="onDragOver"
      @dragleave="dragOver = false"
      @drop="onDrop"
    >
      Скиньте сюда папку с курсом
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const dragOver = ref(false);

const onDragOver = (event: DragEvent) => {
  event.preventDefault();

  dragOver.value = true;
  //   console.log(event);
};

const onDrop = async (event: DragEvent) => {
  event.preventDefault();
  const path = window.api.getPathForFile(event.dataTransfer?.files[0]);
  await window.api.send("directory-dropped", path);
  dragOver.value = false;
};
</script>

<style>
.drag-and-drop {
  height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-and-drop__square {
  height: 20vh;
  width: 20vw;
  border: 2px dashed darkgray;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-and-drop__square--over {
  border: 3px dashed gray;
}
</style>
