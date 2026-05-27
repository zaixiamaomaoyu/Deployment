<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.fetchUserInfo()
})
</script>

<template>
  <router-view />
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>