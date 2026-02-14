<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    startTime: Date | string
    running?: boolean
  }>(),
  {
    running: false,
  },
)

const emit = defineEmits<{
  tick: [elapsed: number]
}>()

const elapsed = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const startDate = computed(() => {
  return props.startTime instanceof Date ? props.startTime : new Date(props.startTime)
})

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(elapsed.value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
})

function updateElapsed() {
  elapsed.value = Date.now() - startDate.value.getTime()
  emit('tick', elapsed.value)
}

function startTimer() {
  stopTimer()
  updateElapsed()
  intervalId = setInterval(updateElapsed, 1000)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

watch(
  () => props.running,
  (isRunning) => {
    if (isRunning) {
      startTimer()
    } else {
      stopTimer()
      // Do one final update to capture the stopped time
      updateElapsed()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="inline-flex items-center gap-1.5 font-mono text-sm">
    <UIcon
      v-if="running"
      name="i-lucide-timer"
      class="text-indigo-500 animate-pulse"
    />
    <UIcon
      v-else
      name="i-lucide-clock"
      class="text-gray-500 dark:text-gray-400"
    />
    <span
      :class="[
        running
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-gray-700 dark:text-gray-300',
      ]"
    >
      {{ formattedTime }}
    </span>
  </div>
</template>
