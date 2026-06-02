import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
})

export interface FavoriteStatus {
  isFavorited: boolean
}

export interface FavoriteToggleResult {
  action: 'added' | 'removed'
  isFavorited: boolean
}

export async function getFavoriteStatus(contentId: number): Promise<{
  code: string
  data: FavoriteStatus
  message: string
}> {
  const res = await api.get(`/favorites/${contentId}/status`)
  return res.data
}

export async function toggleFavorite(contentId: number): Promise<{
  code: string
  data: FavoriteToggleResult
  message: string
}> {
  const res = await api.post(`/favorites/${contentId}/toggle`)
  return res.data
}
