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
          <track
            v-if="currentLesson?.subtitles && vttUrl"
            :src="vttUrl"
            ref="sub"
            default
          />
        </video>
        <div v-if="!currentLesson?.subtitles">Файл субтитров не обнаружен</div>
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
            async (lesson: TLesson) => {
              currentLesson = lesson;
              await $nextTick();
              await play(currentLesson?.name, currentLesson?.path);
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

  await setLastLesson();
});

const initCollapsedSections = computed(() => {
  const ids = [];

  for (let i = 0; i < configCopy.value.sections.length; i++) {
    if (
      configCopy.value.sections[i].lessons.every(
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
  },
  { immediate: true, deep: true }
);

watch(
  () => props.config,
  async () => {
    configCopy.value = JSON.parse(JSON.stringify(props.config));

    await setLastLesson();
  },
  { deep: true }
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
  saveConfig();
};

const setLastLesson = async () => {
  if (configCopy.value.lastLesson) {
    currentLesson.value = configCopy.value.lastLesson;
    const index = configCopy.value.sections.findIndex((sec) =>
      sec.lessons.find((les) => les.path === configCopy.value.lastLesson?.path)
    );
    const lessonIndex = configCopy.value.sections[index].lessons.findIndex(
      (les) => configCopy.value.lastLesson?.name === les.name
    );
    await nextTick();

    const section = document.querySelector(
      `.section-item[data-id='section-${index}']`
    );
    const lesson = section?.querySelector(
      `.lesson[data-id='lesson-${lessonIndex}']`
    );

    lesson?.scrollIntoView({ behavior: "smooth" });
    await play(currentLesson.value.name, currentLesson.value.path);
  } else {
    currentLesson.value = configCopy.value.sections[0].lessons[0];
    await play(currentLesson.value.name, currentLesson.value.path);
  }
};

const play = async (name: string, path: string) => {
  const url = getURL(window.api.resolve(path, name));

  if (url) {
    video.value!.src = url;
  }

  if (currentLesson.value?.subtitles) {
    const subUrl = getURL(currentLesson.value?.subtitles);
    if (!subUrl) {
      vttUrl.value = "";
      return;
    }
    const srt = await (await fetch(subUrl)).text();

    const vtt = srtToVtt(srt);
    const blob = new Blob([vtt]);
    vttUrl.value = URL.createObjectURL(blob);
  }

  if (sub.value) {
    sub.value.src = vttUrl.value;
  }

  configCopy.value.lastLesson = currentLesson.value;
  saveConfig();
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

function saveConfig() {
  window.api.send("save-config", JSON.stringify(configCopy.value), props.path);
}

function getURL(path: string) {
  if (!path) {
    return false;
  }
  try {
    const buffer = window.api.readFile(path);
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    return url;
  } catch (err) {
    console.log(err);
  }
}
</script>

<style>
video {
  width: calc(100vw - 30vw);
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
  width: 30vw;
  height: 94vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  video {
    width: 100%;
  }
  .wrapper {
    flex-direction: column;
  }
  .content-navigator {
    width: 100%;
  }
}
</style>
