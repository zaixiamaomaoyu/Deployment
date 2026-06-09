<script setup lang="ts">
defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <el-button
    class="aichat-trigger"
    type="primary"
    circle
    size="large"
    data-testid="ac-trigger"
    aria-label="打开 AI 助手"
    @click="$emit('click')"
  >
    💬
  </el-button>
</template>

<style scoped>
.aichat-trigger {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  font-size: 24px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  transition: transform 0.3s, box-shadow 0.3s;
}

.aichat-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
}

@media (max-width: 768px) {
  .aichat-trigger {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
