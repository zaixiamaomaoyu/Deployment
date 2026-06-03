import axios from 'axios'
import type { Content } from './contents'

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

export interface FavoriteListResponse {
  favorites: Content[]
  total: number
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

export async function listFavorites(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<{
  code: string
  data: FavoriteListResponse
  message: string
}> {
  const res = await api.get('/favorites', {
    params: { page, limit },
    signal,
  })
  return res.data
}
