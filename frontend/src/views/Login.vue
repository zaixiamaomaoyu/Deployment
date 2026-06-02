<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { login, getCaptcha } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaUrl = ref('')
const passwordVisible = ref(false)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false,
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为4位', trigger: 'blur' },
  ],
}

async function refreshCaptcha() {
  try {
    captchaUrl.value = await getCaptcha(captchaUrl.value)
  } catch {
    ElMessage.error('验证码加载失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const user = await login({
      username: form.username,
      password: form.password,
      captcha: form.captcha,
      remember: form.remember,
    })
    // M8 — 登录接口已返回完整 user，直接信任 setUser，无需再调用 fetchUserInfo
    userStore.setUser(user)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '登录失败'
    ElMessage.error(msg)
    await refreshCaptcha()
    form.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})

// L1 — 组件卸载时清理 blob URL
onBeforeUnmount(() => {
  if (captchaUrl.value) {
    URL.revokeObjectURL(captchaUrl.value)
    captchaUrl.value = ''
  }
})
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="logo">
        <h1>Deployment Learning</h1>
        <p class="subtitle">部署知识学习平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码"
            size="large"
            clearable
          >
            <template #suffix>
              <el-icon @click="passwordVisible = !passwordVisible" class="toggle-icon">
                <View v-if="passwordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="form.captcha"
              placeholder="请输入验证码"
              size="large"
              maxlength="4"
              class="captcha-input"
            />
            <img
              v-if="captchaUrl"
              :src="captchaUrl"
              alt="验证码"
              class="captcha-img"
              @click="refreshCaptcha"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="extra-links">
        <span>还没有账号？</span>
        <el-link type="primary" @click="router.push('/register')">立即注册</el-link>
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
.login-form {
  text-align: left;
}
.toggle-icon {
  cursor: pointer;
  color: #909399;
}
.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.captcha-input {
  flex: 1;
}
.captcha-img {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  object-fit: contain;
  background: #fff;
}
.submit-btn {
  width: 100%;
}
.extra-links {
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}
</style>
