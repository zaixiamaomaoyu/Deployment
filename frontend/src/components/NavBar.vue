<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

async function handleLogout() {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <el-header class="navbar">
    <div class="brand" @click="router.push('/')">
      <span class="logo">Deployment</span>
    </div>

    <div class="actions">
      <template v-if="userStore.isLoggedIn">
        <el-dropdown>
          <span class="user-info">
            <el-avatar
              :size="32"
              :src="userStore.userInfo?.avatar_url || undefined"
              :icon="!userStore.userInfo?.avatar_url ? 'UserFilled' : undefined"
            />
            <span class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin')">
                管理后台
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <el-button type="primary" @click="router.push('/login')">
          登录
        </el-button>
      </template>
    </div>
  </el-header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  height: 60px;
}
.brand {
  cursor: pointer;
  user-select: none;
}
.logo {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f5f7fa;
}
.nickname {
  font-size: 14px;
  color: #606266;
}
</style>
