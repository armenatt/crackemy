<template>
  <div class="section-item">
    <div class="section-item__title" @click="emit('toggle')">
      <div class="section-item__label">
        Section {{ index + 1 }}: {{ section.name }}
      </div>
      <div class="section-item__duration">
        {{ getTimeFromSeconds(sectionDuration) }}
      </div>
    </div>

    <div v-if="!collapsed" class="section-item__lessons">
      <div
        v-for="(lesson, index) in section.lessons"
        :class="{
          lesson: true,
          'lesson--active': lesson.name === currentLessonName,
        }"
        :data-id="'lesson-' + index"
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
import { computed } from "vue";
import { TLesson, TSection } from "../Config";
import { getTimeFromSeconds } from "../helpers/getTimeFromSeconds";

const emit = defineEmits(["select-lesson", "check"]);

const props = defineProps<{
  section: TSection;
  lastLesson?: TLesson;
  index: number;
  currentLessonName?: string;
  collapsed: boolean;
}>();

const sectionDuration = computed(() => {
  let dur = 0;
  props.section.lessons.map((sec) => {
    dur += sec.duration;
  });

  return dur;
});
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
