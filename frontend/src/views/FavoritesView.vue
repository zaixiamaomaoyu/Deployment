<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { listFavorites, toggleFavorite } from '@/api/favorites'
import { Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ContentCard from '@/components/ContentCard.vue'
import type { Content } from '@/api/contents'

const router = useRouter()
const userStore = useUserStore()

const favorites = ref<Content[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const togglingId = ref<number | null>(null)
let abortController: AbortController | null = null

async function loadFavorites(append = false) {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  loading.value = true
  try {
    const res = await listFavorites(page.value, limit.value, abortController.signal)
    if (res.code === 'SUCCESS') {
      if (append) {
        // 追加并按 id 去重，防止跨页删除导致重复
        const existingIds = new Set(favorites.value.map(f => f.id))
        const newItems = res.data.favorites.filter(f => !existingIds.has(f.id))
        favorites.value = [...favorites.value, ...newItems]
      } else {
        favorites.value = res.data.favorites
      }
      total.value = res.data.total
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return
    const status = err?.response?.status
    if (status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      // 先跳转再 logout，避免 logout 抛错导致用户停留原地
      router.push({ path: '/login', query: { redirect: '/favorites' } })
      try {
        await userStore.logout()
      } catch {
        // logout 失败不阻塞跳转
      }
    } else {
      ElMessage.error('加载失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

async function handleToggleFavorite(content: Content) {
  if (!userStore.isLoggedIn) return
  // 防竞态：同一内容正在切换中再次点击直接忽略（单按钮粒度）
  if (togglingId.value === content.id) return
  const rawContentId = content.id
  togglingId.value = rawContentId
  try {
    const res = await toggleFavorite(content.id)
    if (res.code === 'SUCCESS') {
      // 收藏列表中点击按钮的唯一语义就是取消收藏
      if (res.data.action === 'removed') {
        favorites.value = favorites.value.filter(f => f.id !== rawContentId)
        // 不本地 total--：以服务端返回为准，避免后端 TOCTOU 导致 total 错误
        // total 会在下次 loadFavorites 时刷新
        ElMessage.success('已取消收藏')
      } else {
        ElMessage.success('已收藏')
      }
    }
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      router.push({ path: '/login', query: { redirect: '/favorites' } })
      try {
        await userStore.logout()
      } catch {
        // logout 失败不阻塞跳转
      }
    } else {
      ElMessage.error('操作失败，请稍后重试')
    }
  } finally {
    togglingId.value = null
  }
}

function handleCardClick(content: Content) {
  router.push(`/contents/${content.id}`)
}

function loadMore() {
  page.value++
  loadFavorites(true)
}

onMounted(() => {
  // 路由守卫已拦截未登录访问（携带 redirect query）；此处仅处理登录用户
  loadFavorites()
})

onBeforeUnmount(() => {
  if (abortController) abortController.abort()
})
</script>

<template>
  <div class="favorites-page" v-loading="loading">
    <el-page-header @click="router.push('/contents')" style="margin-bottom: 20px;">
      <template #content>我的收藏</template>
      <template #extra>
        <el-button v-if="total === 0 && !loading" @click="router.push('/contents')">去浏览内容</el-button>
      </template>
    </el-page-header>

    <el-empty v-if="!loading && favorites.length === 0" description="您还没有收藏任何内容">
      <el-button type="primary" @click="router.push('/contents')">去浏览内容</el-button>
    </el-empty>

    <div v-else class="favorites-grid">
      <ContentCard
        v-for="fav in favorites"
        :key="fav.id"
        :content="fav"
        @click="handleCardClick(fav)"
      >
        <template #extra>
          <el-button
            type="warning"
            :icon="Star"
            :loading="togglingId === fav.id"
            :disabled="togglingId === fav.id"
            size="small"
            @click.stop="handleToggleFavorite(fav)"
          >
            取消收藏
          </el-button>
        </template>
      </ContentCard>
    </div>

    <div v-if="total > favorites.length" class="load-more">
      <el-button @click="loadMore" :loading="loading" :disabled="loading">加载更多</el-button>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
  padding: 24px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.load-more {
  margin-top: 24px;
  text-align: center;
}
</style>
