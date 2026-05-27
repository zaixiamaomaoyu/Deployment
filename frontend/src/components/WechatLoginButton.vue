<script setup lang="ts">
const props = defineProps<{
  appId: string
  redirectUri: string
}>()

function handleLogin() {
  const state = generateState()
  sessionStorage.setItem('wechat_oauth_state', state)

  const params = new URLSearchParams({
    appid: props.appId,
    redirect_uri: props.redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  })

  window.location.href = `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}
</script>

<template>
  <el-button
    type="success"
    size="large"
    class="wechat-login-btn"
    @click="handleLogin"
  >
    <span class="icon">&#xe600;</span>
    微信登录
  </el-button>
</template>

<style scoped>
.wechat-login-btn {
  background-color: #07c160;
  border-color: #07c160;
  color: #fff;
  font-size: 16px;
  padding: 0 32px;
  height: 44px;
}
.wechat-login-btn:hover {
  background-color: #06ad56;
  border-color: #06ad56;
}
.icon {
  margin-right: 8px;
}
</style>
