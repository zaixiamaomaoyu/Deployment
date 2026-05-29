import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
})

export interface Content {
  id: number
  domain: 'build' | 'platform' | 'server' | 'automation' | 'domain' | 'container'
  level: number
  title: string
  description?: string
  content?: string
  examples?: unknown[]
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ContentsResponse {
  code: string
  data: {
    contents: Content[]
    total: number
    page: number
    totalPages: number
  }
  message: string
}

export async function getContents(
  domain?: string,
  level?: number,
  page = 1,
  limit = 20,
  signal?: AbortSignal
): Promise<ContentsResponse> {
  const params: Record<string, string | number> = { page, limit }
  if (domain) {
    params.domain = domain
  }
  if (level !== undefined) {
    params.level = level
  }
  const res = await api.get('/contents', { params, signal })
  return res.data
}

export async function getContentById(id: number): Promise<{ code: string; data: Content; message: string }> {
  const res = await api.get(`/contents/${id}`)
  return res.data
}
