<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import NavBar from '@/components/NavBar.vue'

const userStore = useUserStore()

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
