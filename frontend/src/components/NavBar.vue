<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search,
  ArrowDown,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const searchQuery = ref('')

async function handleLogout() {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/contents',
      query: { search: searchQuery.value },
    })
  }
}
</script>

<template>
  <el-header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <div class="brand" @click="router.push('/')">
          <div class="logo-icon">🚀</div>
          <div class="logo-texts">
            <span class="logo-text">Deployment</span>
            <span class="logo-sub">Learning</span>
          </div>
        </div>
        <nav class="nav-links">
          <a
            class="nav-link"
            :class="{ active: $route.path === '/' }"
            @click="router.push('/')"
          >
            <span class="nav-link__icon">🏠</span>
            首页
          </a>
          <a
            class="nav-link"
            :class="{ active: $route.path.startsWith('/contents') }"
            @click="router.push('/contents')"
          >
            <span class="nav-link__icon">📚</span>
            知识内容
          </a>
        </nav>
      </div>

      <div class="nav-center">
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识内容..."
          class="nav-search"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="nav-right">
        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar
                :size="34"
                :src="userStore.userInfo?.avatar_url || undefined"
                :icon="!userStore.userInfo?.avatar_url ? 'UserFilled' : undefined"
              />
              <span class="nickname">
                {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}
              </span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin')">
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <div class="guest-actions">
            <el-button link @click="router.push('/login')">登录</el-button>
            <el-button type="primary" @click="router.push('/register')">注册</el-button>
          </div>
        </template>
      </div>
    </div>
  </el-header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 32px;
  gap: 24px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s;
}

.brand:hover {
  transform: scale(1.02);
}

.logo-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
}

.logo-texts {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.logo-text {
  font-size: 18px;
  font-weight: 800;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.logo-sub {
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(90deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  margin-top: 2px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-link__icon {
  font-size: 15px;
}

.nav-link:hover {
  color: #409eff;
  background: #f5f7fa;
}

.nav-link.active {
  color: #409eff;
  background: #ecf5ff;
}

.nav-center {
  flex: 1;
  max-width: 400px;
}

.nav-search :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: #f5f7fa;
  box-shadow: none;
  transition: all 0.2s;
}

.nav-search :deep(.el-input__wrapper:hover) {
  background: #ebeef5;
}

.nav-search :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: 0 0 0 2px #409eff33;
}

.nav-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 100px;
  transition: background 0.2s;
  border: 1px solid transparent;
}

.user-info:hover {
  background: #f5f7fa;
  border-color: #e5e7eb;
}

.nickname {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  font-size: 12px;
  color: #9ca3af;
}

.guest-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1024px) {
  .nav-center {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-inner {
    padding: 0 16px;
    gap: 12px;
  }
  .nav-links {
    display: none;
  }
  .logo-sub {
    display: none;
  }
  .nickname {
    display: none;
  }
  .arrow-icon {
    display: none;
  }
}
</style>
