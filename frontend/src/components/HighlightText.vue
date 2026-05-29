<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  keyword?: string
}>()

const segments = computed(() => {
  const textValue = props.text ?? ''
  if (!props.keyword) return [{ text: textValue, match: false }]
  const escaped = props.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let regex: RegExp
  try {
    regex = new RegExp(`(${escaped})`, 'gi')
  } catch {
    return [{ text: textValue, match: false }]
  }
  const parts = textValue.split(regex)
  const keywordLower = props.keyword.toLowerCase()
  return parts.map((part) => ({
    text: part,
    match: part.toLowerCase() === keywordLower,
  }))
})
</script>

<template>
  <span>
    <template v-for="(seg, i) in segments" :key="i">
      <mark v-if="seg.match" class="highlight-mark">{{ seg.text }}</mark>
      <span v-else>{{ seg.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.highlight-mark {
  background-color: #fef08a;
  color: #92400e;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
