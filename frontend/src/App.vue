<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import NavBar from '@/components/NavBar.vue'
import AIChatButton from '@/components/AIChatButton.vue'
import AIChat from '@/components/AIChat.vue'

const userStore = useUserStore()
const showAIChat = ref(false)

onMounted(() => {
  userStore.fetchUserInfo()
})
</script>

<template>
  <div class="app-wrapper">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <AIChatButton @click="showAIChat = !showAIChat" />
    <AIChat v-model:visible="showAIChat" />
  </div>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content {
  flex: 1;
}
</style>
