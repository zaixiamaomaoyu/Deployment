<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { register, getCaptcha } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaUrl = ref('')
const passwordVisible = ref(false)
const confirmVisible = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  captcha: '',
})

const passwordStrength = computed(() => {
  if (!form.password) return ''
  if (form.password.length < 6) return '弱'
  if (form.password.length < 10) return '中'
  return '强'
})

const strengthColor = computed(() => {
  if (passwordStrength.value === '弱') return '#f56c6c'
  if (passwordStrength.value === '中') return '#e6a23c'
  return '#67c23a'
})

const validateConfirmPassword = (_rule: any, value: string, callback: Function) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
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
    const user = await register({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
      captcha: form.captcha,
    })
    // M8 — 注册接口已返回完整 user，直接信任 setUser
    userStore.setUser(user)
    ElMessage.success('注册成功')
    router.push('/')
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '注册失败'
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
  <div class="register-page">
    <el-card class="register-card" shadow="hover">
      <div class="logo">
        <h1>Deployment Learning</h1>
        <p class="subtitle">部署知识学习平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="register-form"
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
            placeholder="请输入密码（至少6位）"
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
          <div v-if="form.password" class="strength-bar">
            <span class="strength-label">密码强度：</span>
            <span class="strength-value" :style="{ color: strengthColor }">{{ passwordStrength }}</span>
          </div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            :type="confirmVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            size="large"
            clearable
          >
            <template #suffix>
              <el-icon @click="confirmVisible = !confirmVisible" class="toggle-icon">
                <View v-if="confirmVisible" />
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
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="extra-links">
        <span>已有账号？</span>
        <el-link type="primary" @click="router.push('/login')">立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.register-card {
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
.register-form {
  text-align: left;
}
.toggle-icon {
  cursor: pointer;
  color: #909399;
}
.strength-bar {
  margin-top: 4px;
  font-size: 12px;
}
.strength-label {
  color: #909399;
}
.strength-value {
  font-weight: 600;
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
