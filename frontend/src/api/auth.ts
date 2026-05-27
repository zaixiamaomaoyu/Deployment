import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
})

export interface UserInfo {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
}

export async function getCurrentUser(): Promise<UserInfo> {
  const res = await api.get('/auth/me')
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function wechatCallback(code: string): Promise<UserInfo> {
  const res = await api.get(`/auth/wechat/callback?code=${encodeURIComponent(code)}`)
  return res.data
}
