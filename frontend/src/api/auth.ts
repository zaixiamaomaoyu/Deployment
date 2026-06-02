import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
})

export interface UserInfo {
  id: number
  username: string
  openid?: string
  nickname: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
}

export interface LoginCredentials {
  username: string
  password: string
  captcha: string
  remember?: boolean
}

export interface RegisterData {
  username: string
  password: string
  confirmPassword: string
  captcha: string
}

export async function getCurrentUser(): Promise<UserInfo> {
  const res = await api.get('/auth/me')
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function login(credentials: LoginCredentials): Promise<UserInfo> {
  const res = await api.post('/auth/login', credentials)
  return res.data
}

export async function register(data: RegisterData): Promise<UserInfo> {
  const res = await api.post('/auth/register', data)
  return res.data
}

/**
 * 获取验证码图片，返回 blob URL。
 * 调用方负责在刷新前 revokeObjectURL 旧 URL，避免内存泄露。
 */
export async function getCaptcha(previousUrl?: string): Promise<string> {
  const res = await api.get('/auth/captcha', {
    responseType: 'blob',
  })
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl)
  }
  return URL.createObjectURL(res.data)
}
