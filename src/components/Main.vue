<template>
  <div class="main">
    <div class="header">
      <div class="header__logo">CRACKEMY</div>
      <div class="header__course-name">
        {{ config.courseName }}
      </div>
    </div>
    <div class="wrapper">
      <div class="content">
        <video v-show="currentLesson" ref="video" autoplay controls></video>
      </div>
      <div class="content-navigator">
        <SectionItem
          v-for="(section, index) in configCopy.sections"
          :section="section"
          :index="index"
          :current-lesson-name="currentLesson?.name"
          :key="section.name"
          @check="onCheck"
          @select-lesson="
            async (lesson) => {
              currentLesson = lesson;
              await $nextTick();
              play(currentLesson?.name, currentLesson?.path);
            }
          "
        >
        </SectionItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { TConfig, TLesson } from "../Config";
import SectionItem from "./SectionItem.vue";

const video = useTemplateRef("video");

const currentLesson = ref<TLesson>();

const props = defineProps<{
  config: TConfig;
  path: string;
}>();

const configCopy = ref(JSON.parse(JSON.stringify(props.config)));

onMounted(() => {
  video.value!.onended = () => {
    const currentSectionIndex = props.config.sections.findIndex((sec) =>
      sec.lessons.find((les) => les.name === currentLesson.value?.name)
    );
    const currentIndex = props.config.sections[
      currentSectionIndex
    ].lessons.findIndex((les) => les.name === currentLesson.value?.name);
    configCopy.value.sections[currentSectionIndex].lessons[currentIndex].done =
      true;
    window.api.send(
      "save-config",
      JSON.stringify(configCopy.value),
      props.path
    );

    if (
      !!props.config.sections[currentSectionIndex].lessons[currentIndex + 1]
    ) {
      currentLesson.value =
        props.config.sections[currentSectionIndex].lessons[currentIndex + 1];
      play(currentLesson.value.name, currentLesson.value.path);
    } else if (!!props.config.sections[currentSectionIndex + 1]) {
      currentLesson.value =
        props.config.sections[currentSectionIndex + 1].lessons[0];
      play(currentLesson.value.name, currentLesson.value.path);
    }
  };
});

const onCheck = ({ lesson, section }) => {
  const currentSectionIndex = configCopy.value.sections.findIndex(
    (sec) => sec.name === section.name
  );
  const currentIndex = configCopy.value.sections[
    currentSectionIndex
  ].lessons.findIndex((les) => les.name === lesson.name);

  configCopy.value.sections[currentSectionIndex].lessons[currentIndex].done =
    !configCopy.value.sections[currentSectionIndex].lessons[currentIndex].done;
  window.api.send("save-config", JSON.stringify(configCopy.value), props.path);
};

const play = (name, path) => {
  const buffer = window.api.readFile(path + "/" + name);
  const blob = new Blob([buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  video.value.src = url;
};
</script>

<style>
video {
  height: 600px;
  width: auto;
}
.main {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  height: 50px;
  width: 100%;
  background-color: DimGray;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
}

.header__logo {
  text-transform: lowercase;
}

.header__course-name {
  color: white;
}

.wrapper {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.content-navigator {
  min-width: 400px;
  height: 100vh;
  overflow-y: auto;
}
</style>
