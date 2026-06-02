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
    } catch {
      userInfo.value = null
      return false
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
