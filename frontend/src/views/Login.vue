<script setup lang="ts">
import WechatLoginButton from '@/components/WechatLoginButton.vue'

const wechatAppId = import.meta.env.VITE_WECHAT_APP_ID || ''
const redirectUri = `${window.location.origin}/auth/callback`
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="logo">
        <h1>Deployment Learning</h1>
        <p class="subtitle">部署知识学习平台</p>
      </div>

      <div class="login-form">
        <p class="hint">使用微信扫码登录</p>
        <WechatLoginButton
          :app-id="wechatAppId"
          :redirect-uri="redirectUri"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  padding: 40px 20px;
}
.logo h1 {
  font-size: 28px;
  color: #409eff;
  margin-bottom: 8px;
}
.subtitle {
  color: #999;
  font-size: 14px;
  margin-bottom: 32px;
}
.hint {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}
.login-form {
  margin-top: 24px;
}
</style>
