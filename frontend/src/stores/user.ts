import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getCurrentUser,
  logout as apiLogout,
  type UserInfo,
} from '@/api/auth'

export type { UserInfo }

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = computed(() => userInfo.value !== null)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  async function fetchUserInfo(): Promise<boolean> {
    try {
      userInfo.value = await getCurrentUser()
      return true
    } catch (err: any) {
      // M9 — 仅 401（未登录/会话失效）才清空状态，网络错误/500 保留状态避免误踢
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        userInfo.value = null
        return false
      }
      // 网络错误/服务器错误时保留现有 userInfo，避免登录用户被误踢
      return userInfo.value !== null
    }
  }

  function setUser(info: UserInfo) {
    userInfo.value = info
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      userInfo.value = null
    }
  }

  return {
    userInfo,
    isLoggedIn,
    isAdmin,
    fetchUserInfo,
    setUser,
    logout,
  }
})
