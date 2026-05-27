<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { wechatCallback } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  const code = route.query.code as string | undefined
  const state = route.query.state as string | undefined
  const savedState = sessionStorage.getItem('wechat_oauth_state')

  if (!code) {
    ElMessage.error('授权失败：未获取到授权码')
    router.replace('/login')
    return
  }

  if (!state || state !== savedState) {
    ElMessage.error('授权失败：状态校验不通过，请重新登录')
    router.replace('/login')
    return
  }

  sessionStorage.removeItem('wechat_oauth_state')

  try {
    const user = await wechatCallback(code)
    userStore.setUser(user)
    ElMessage.success('登录成功')
    router.replace('/')
  } catch {
    ElMessage.error('登录失败，请重试')
    router.replace('/login')
  }
})
</script>

<template>
  <div v-loading.fullscreen.lock="true" element-loading-text="正在登录..." class="callback-page"></div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
