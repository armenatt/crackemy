<template>
  <div class="main">
    <div class="header">
      <div class="header__wrapper">
        <div class="header__logo">CRACKEMY</div>
        <div class="header__course-name">
          {{ config.courseName }}
        </div>
      </div>
      <div>
        <span>
          {{ getTimeFromSeconds(watchedSeconds) }} /
          {{ getTimeFromSeconds(fullDuration) }}
        </span>
        |
        <span>
          {{ Math.round((watchedSeconds / fullDuration) * 100) }}% / {{ 100 }}%
        </span>
      </div>
    </div>
    <div class="wrapper">
      <div class="content">
        <video v-show="currentLesson" ref="video" autoplay controls>
          <track v-if="vttUrl" :src="vttUrl" ref="sub" default />
        </video>
      </div>
      <div class="content-navigator">
        <SectionItem
          v-for="(section, index) in configCopy.sections"
          :data-id="'section-' + index"
          :section="section"
          :index="index"
          :current-lesson-name="currentLesson?.name"
          :key="section.name"
          :last-lesson="configCopy.lastLesson"
          :collapsed="collapsedSections.includes(index)"
          @toggle="onToggle(index)"
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
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { TConfig, TLesson } from "../Config";
import SectionItem from "./SectionItem.vue";
import { getTimeFromSeconds } from "../helpers/getTimeFromSeconds";

const video = useTemplateRef("video");
const sub = useTemplateRef("sub");

const vttUrl = ref();
const currentLesson = ref<TLesson>();
const collapsedSections = ref<number[]>([]);
const props = defineProps<{
  config: TConfig;
  path: string;
}>();

const configCopy = ref<TConfig>(JSON.parse(JSON.stringify(props.config)));

onMounted(async () => {
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

  if (props.config.lastLesson) {
    const index = props.config.sections.findIndex((sec) =>
      sec.lessons.find((les) => les.path === props.config.lastLesson?.path)
    );
    const res = document.querySelector(`.lesson[data-id='lesson-${index}']`);

    await nextTick();
    res?.scrollIntoView({ behavior: "smooth" });
    currentLesson.value = props.config.lastLesson;

    play(currentLesson.value.name, currentLesson.value.path);
  }
});

const initCollapsedSections = computed(() => {
  const ids = [];

  for (let i = 0; i < props.config.sections.length; i++) {
    if (
      props.config.sections[i].lessons.every(
        (les) => les.done && les.path !== props.config.lastLesson?.path
      )
    ) {
      ids.push(i);
    }
  }
  return ids;
});

const watchedSeconds = computed(() => {
  let duration = 0;

  for (const section of configCopy.value.sections) {
    section.lessons.forEach((les) => {
      if (les.done) {
        duration += les.duration;
      }
    });
  }
  return duration;
});

const fullDuration = computed(() => {
  let duration = 0;
  for (const section of configCopy.value.sections) {
    section.lessons.forEach((les) => {
      duration += les.duration;
    });
  }
  return duration;
});

watch(
  () => initCollapsedSections.value,
  () => {
    collapsedSections.value = initCollapsedSections.value;
    console.log(collapsedSections.value);
  },
  { immediate: true }
);

const onToggle = (index: number) => {
  if (collapsedSections.value.includes(index)) {
    collapsedSections.value = collapsedSections.value.filter(
      (id) => id !== index
    );
  } else {
    collapsedSections.value.push(index);
  }
};

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

const play = async (name, path) => {
  const url = getURL(path + "/" + name);
  video.value!.src = url;

  const subUrl = getURL(currentLesson.value?.subtitles!);
  const srt = await (await fetch(subUrl)).text();

  const vtt = srtToVtt(srt);
  const blob = new Blob([vtt]);
  vttUrl.value = URL.createObjectURL(blob);

  if (sub.value) {
    sub.value!.src = vttUrl.value;
  }

  configCopy.value.lastLesson = currentLesson.value;
  window.api.send("save-config", JSON.stringify(configCopy.value), props.path);
};

function srtToVtt(srt: string) {
  let vtt = "WEBVTT\n\n";

  const lines = srt.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.match(/\d{2}:\d{2}:\d{2},\d{3}/)) {
      line = line.replace(/,/g, ".");
    }

    vtt += line + "\n";
  }

  return vtt;
}

function getURL(path: string, type?: string) {
  const buffer = window.api.readFile(path);
  const blob = new Blob([buffer], { type });
  const url = URL.createObjectURL(blob);
  return url;
}
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
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header__wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
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
  height: 94vh;
  overflow-y: auto;
}
</style>
