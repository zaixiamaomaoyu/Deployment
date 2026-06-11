<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getContents, type Content } from '@/api/contents'
import ContentCard from '@/components/ContentCard.vue'
const router = useRouter()

const contents = ref<Content[]>([])
const loading = ref(false)
const searchQuery = ref('')

const domainLabels: Record<string, string> = {
  build: '构建',
  platform: '平台',
  server: '服务器',
  automation: '自动化',
  domain: '域名',
  container: '容器',
}

const domainMeta: Record<string, { bg: string; icon: string; desc: string }> = {
  build: { bg: '#409eff', icon: '🏗️', desc: 'Webpack / Vite / 打包优化' },
  platform: { bg: '#67c23a', icon: '🚀', desc: 'Vercel / Netlify / Cloudflare' },
  server: { bg: '#e6a23c', icon: '🖥️', desc: 'Nginx / Apache / 反向代理' },
  automation: { bg: '#909399', icon: '⚙️', desc: 'CI/CD / GitHub Actions' },
  domain: { bg: '#f56c6c', icon: '🌐', desc: 'DNS / 备案 / HTTPS' },
  container: { bg: '#8e44ad', icon: '📦', desc: 'Docker / K8s / 镜像' },
}

const domainKeys = Object.keys(domainLabels)

const recentContents = computed(() => contents.value.slice(0, 8))

async function loadContents() {
  loading.value = true
  try {
    const res = await getContents(undefined, undefined, undefined, 1, 8)
    contents.value = res.data.contents
  } catch (err) {
    console.error('加载内容失败:', err)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/contents',
      query: { search: searchQuery.value },
    })
  }
}

function handleDomainClick(domain: string) {
  router.push({
    path: '/contents',
    query: { domain },
  })
}

function goToContents() {
  router.push('/contents')
}

onMounted(() => {
  loadContents()
})
</script>

<template>
  <div class="home">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg">
        <div class="bg-grid" />
        <div class="bg-glow bg-glow--1" />
        <div class="bg-glow bg-glow--2" />
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot" />
          <span>从零到部署上线 · 全流程实战</span>
        </div>
        <h1 class="hero-title">
          <span class="gradient-text">前端部署</span>
          <span class="title-sub">实战学习平台</span>
        </h1>
        <p class="hero-subtitle">
          覆盖 <strong>构建 · 平台 · 服务器 · 自动化 · 域名 · 容器</strong> 6 大核心领域<br />
          帮助零基础开发者从「第 0 步」掌握前端部署技能
        </p>
        <div class="hero-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索知识内容、技术栈、部署方案..."
            size="large"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">6</span>
            <span class="stat-label">知识领域</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">5</span>
            <span class="stat-label">难度层级</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">30<sup>+</sup></span>
            <span class="stat-label">知识点</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">100<sup>%</sup></span>
            <span class="stat-label">免费实战</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 领域分类 -->
    <section class="domains-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-bar" />
          选择你的学习方向
        </h2>
        <p class="section-desc">点击卡片进入对应领域，开启专注学习之旅</p>
      </div>
      <div class="domains-grid">
        <div
          v-for="(key, idx) in domainKeys"
          :key="key"
          class="domain-card"
          :style="{
            '--domain-color': domainMeta[key].bg,
            '--domain-color-soft': domainMeta[key].bg + '14',
            '--domain-color-deep': domainMeta[key].bg + 'e6',
          }"
          @click="handleDomainClick(key)"
        >
          <div class="domain-card__bg" />
          <div class="domain-card__num">{{ String(idx + 1).padStart(2, '0') }}</div>
          <div class="domain-icon-wrap">
            <div class="domain-icon-bg" />
            <div class="domain-icon">{{ domainMeta[key].icon }}</div>
          </div>
          <div class="domain-name">{{ domainLabels[key] }}</div>
          <div class="domain-desc">{{ domainMeta[key].desc }}</div>
          <div class="domain-meta">
            <span class="domain-tag">领域</span>
            <span class="domain-arrow">
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 最新内容 -->
    <section class="contents-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-bar" />
          最新知识内容
        </h2>
        <el-button text type="primary" @click="goToContents">
          查看全部
          <el-icon class="btn-icon"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div v-loading="loading" class="contents-grid">
        <el-empty v-if="!loading && recentContents.length === 0" description="暂无内容" />
        <ContentCard
          v-for="content in recentContents"
          :key="content.id"
          :content="content"
        />
      </div>
    </section>

    <!-- 底部 CTA -->
    <section class="cta-section">
      <div class="cta-content">
        <div class="cta-icon">🚀</div>
        <h2>准备好开始你的部署之旅了吗？</h2>
        <p>通过决策树找到最适合你的部署方案，跟着步骤指南一步步完成上线</p>
        <div class="cta-actions">
          <el-button type="primary" size="large" @click="router.push('/contents')">
            开始学习
            <el-icon class="btn-icon"><ArrowRight /></el-icon>
          </el-button>
          <el-button size="large" @click="router.push('/contents')">
            浏览知识库
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ============ Hero 区域 ============ */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 480px;
  padding: 64px 32px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%);
  overflow: hidden;
  text-align: center;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 179, 237, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 179, 237, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.bg-glow--1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, #409eff, transparent 70%);
}

.bg-glow--2 {
  width: 500px;
  height: 500px;
  bottom: -150px;
  left: -150px;
  background: radial-gradient(circle, #67c23a, transparent 70%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 960px;
  width: 100%;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  margin-bottom: 24px;
  background: rgba(64, 158, 255, 0.12);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 100px;
  font-size: 13px;
  color: #93c5fd;
  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
  box-shadow: 0 0 8px #409eff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 16px;
  letter-spacing: -1.5px;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gradient-text {
  background: linear-gradient(90deg, #60a5fa, #34d399, #fbbf24);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 6s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.title-sub {
  font-size: 28px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0;
}

.hero-subtitle {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin-bottom: 36px;
}

.hero-subtitle strong {
  color: #fbbf24;
  font-weight: 600;
}

.hero-search {
  max-width: 600px;
  margin: 0 auto 36px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px 0 0 12px;
  padding-left: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  height: 52px;
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 12px 12px 0;
  overflow: hidden;
}

.search-input :deep(.el-button) {
  height: 52px;
  padding: 0 28px;
  font-size: 15px;
  font-weight: 500;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-num {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(180deg, #fff, #93c5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.stat-num sup {
  font-size: 18px;
  color: #fbbf24;
  -webkit-text-fill-color: #fbbf24;
  margin-left: 2px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

/* ============ 通用 Section ============ */
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.5px;
}

.title-bar {
  display: inline-block;
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #409eff, #67c23a);
  border-radius: 2px;
}

.section-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* ============ 领域分类 ============ */
.domains-section {
  padding: 56px 32px;
}

.domains-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
}

.domain-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px 20px 18px;
  background: #fff;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.domain-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 100% 0%, var(--domain-color-soft), transparent 60%);
  opacity: 0.6;
  transition: opacity 0.4s;
  pointer-events: none;
}

.domain-card__num {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--domain-color);
  opacity: 0.5;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
  transition: opacity 0.3s;
}

.domain-icon-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.domain-icon-bg {
  position: absolute;
  inset: 0;
  background: var(--domain-color);
  border-radius: 16px;
  transform: rotate(8deg);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0.15;
}

.domain-icon {
  position: relative;
  font-size: 32px;
  z-index: 1;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.domain-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--domain-color), transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s;
}

.domain-card:hover {
  transform: translateY(-6px);
  border-color: var(--domain-color);
  box-shadow:
    0 18px 36px -10px rgba(0, 0, 0, 0.15),
    0 0 0 1px var(--domain-color-soft);
}

.domain-card:hover .domain-card__bg {
  opacity: 1;
}

.domain-card:hover .domain-card__num {
  opacity: 1;
}

.domain-card:hover .domain-icon-bg {
  transform: rotate(0deg) scale(1.1);
  opacity: 0.25;
}

.domain-card:hover .domain-icon {
  transform: scale(1.15);
}

.domain-card:hover::after {
  transform: scaleX(1);
}

.domain-card:hover .domain-arrow {
  background: var(--domain-color);
  color: #fff;
  transform: translateX(0);
}

.domain-name {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
  position: relative;
  z-index: 1;
}

.domain-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.55;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.domain-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.domain-tag {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 100px;
  letter-spacing: 0.5px;
}

.domain-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--domain-color-soft);
  color: var(--domain-color);
  border-radius: 50%;
  font-size: 12px;
  transform: translateX(-4px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}



/* ============ 内容区域 ============ */
.contents-section {
  padding: 16px 32px 56px;
}

.contents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ============ CTA 区域 ============ */
.cta-section {
  padding: 64px 32px;
  background:
    radial-gradient(circle at 20% 50%, rgba(64, 158, 255, 0.15), transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(103, 194, 58, 0.15), transparent 50%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-content {
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.cta-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: inline-block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.cta-content h2 {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.cta-content p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  line-height: 1.6;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cta-actions .el-button {
  border-radius: 10px;
  padding: 0 28px;
  font-size: 15px;
  font-weight: 500;
  height: 48px;
}

.cta-actions .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.cta-actions .el-button:not(.el-button--primary):hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-icon {
  margin-left: 4px;
}

/* ============ 响应式 ============ */
@media (max-width: 1280px) {
  .domains-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .hero-title {
    font-size: 44px;
  }
  .title-sub {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 48px 20px;
    min-height: 420px;
  }
  .hero-title {
    font-size: 34px;
  }
  .title-sub {
    font-size: 20px;
  }
  .hero-subtitle {
    font-size: 14px;
  }
  .hero-stats {
    gap: 20px;
  }
  .stat-num {
    font-size: 28px;
  }
  .domains-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .contents-grid {
    grid-template-columns: 1fr;
  }
  .domains-section,
  .contents-section {
    padding: 32px 16px;
  }
  .cta-section {
    padding: 48px 20px;
  }
  .cta-content h2 {
    font-size: 24px;
  }
  .section-title {
    font-size: 22px;
  }
}
</style>
