import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface UserInfo {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = computed(() => userInfo.value !== null)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  async function fetchUserInfo(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        userInfo.value = await res.json()
        return true
      }
      userInfo.value = null
      return false
    } catch {
      userInfo.value = null
      return false
    }
  }

  function setUser(info: UserInfo) {
    userInfo.value = info
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    userInfo.value = null
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
