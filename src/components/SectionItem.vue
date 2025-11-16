<template>
  <div class="section-item">
    <div class="section-item__title" @click="collapsed = !collapsed">
      <div class="section-item__label">
        Section {{ index + 1 }}: {{ section.name }}
      </div>
      <div class="section-item__duration">
        {{ getTimeFromSeconds(sectionDuration) }}
      </div>
    </div>

    <div v-if="!collapsed || allDone" class="section-item__lessons">
      <div
        v-for="lesson in section.lessons"
        :class="{
          lesson: true,
          'lesson--active': lesson.name === currentLessonName,
        }"
        @click="emit('select-lesson', lesson)"
      >
        <div class="lesson__left">
          <input
            type="checkbox"
            name=""
            id=""
            v-model="lesson.done"
            @click.stop="emit('check', { lesson, section })"
          />
        </div>
        <div class="lesson__right">
          <div>{{ lesson.name.split(".mp4")[0] }}</div>
          <div>{{ getTimeFromSeconds(lesson.duration) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TSection } from "../Config";

const emit = defineEmits(["select-lesson", "check"]);

const collapsed = ref(false);

const props = defineProps<{
  section: TSection;
  index: number;
  currentLessonName?: string;
}>();

const sectionDuration = computed(() => {
  let dur = 0;
  props.section.lessons.map((sec) => {
    dur += sec.duration;
  });

  return dur;
});

const allDone = computed(() => {
  return props.section.lessons.every((lesson) => lesson.done);
});

const getTimeFromSeconds = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const hours = Math.floor(minutes / 60);
  const seconds = duration % 60;

  if (hours < 1) {
    return `${minutes} min ${seconds < 10 ? "0" : ""}${seconds} seconds`;
  }
  return `${hours}hr ${seconds < 10 ? "0" : ""}${minutes % 60} min`;
};
</script>

<style>
.section-item {
  user-select: none;
}

.section-item__title {
  display: flex;
  justify-content: center;
  flex-direction: column;
  height: 70px;
  background-color: DarkGray;
  padding: 10px;
  cursor: pointer;
}

.section-item__lessons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 10px 0;
}

.lesson {
  height: 45px;
  display: flex;
  gap: 8px;
}

.lesson--active {
  background-color: Gainsboro;
}

.lesson__left {
}

.lesson__right {
}
</style>
