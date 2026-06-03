// Story 3-2: 部署决策树静态数据
// 数据维护规则：
//   1. 节点 id 全局唯一，格式 q1/q2/.../qn
//   2. options 中 nextId 必须指向已存在节点或为 null（叶子）
//   3. 叶子 option 必须带 result，且 result.planId 在 deploymentPlans 中存在
//   4. 修改后必须通过 decision-tree-data.spec.ts 全部用例
// 决策维度覆盖：项目类型 / 预算 / 技术水平 / 数据持久化

import type { DecisionTreeData } from '@/types/decision-tree'

export const decisionTreeData: DecisionTreeData = {
  rootId: 'q1',
  nodes: {
    // 根节点：项目类型分流
    q1: {
      id: 'q1',
      question: '你的项目是什么类型？',
      options: [
        { id: 'q1-static', label: '纯静态站点（HTML / VitePress / 静态导出）', nextId: 'q2' },
        { id: 'q1-fullstack', label: '全栈应用（含 API 与数据库）', nextId: 'q3' },
        { id: 'q1-container', label: '容器化应用（Docker / K8s）', nextId: 'q4' },
      ],
    },
    // 静态分支：按使用场景选静态托管
    q2: {
      id: 'q2',
      question: '静态站点更看重哪一点？',
      options: [
        {
          id: 'q2-docs',
          label: '文档 / 个人博客（与 Git 工作流深度集成）',
          nextId: null,
          result: { planId: 'github-pages', planName: 'GitHub Pages' },
        },
        {
          id: 'q2-marketing',
          label: '营销落地页 / JAMstack 作品集',
          nextId: null,
          result: { planId: 'netlify-free', planName: 'Netlify 免费版' },
        },
        {
          id: 'q2-global',
          label: '面向全球用户，需要边缘加速',
          nextId: null,
          result: { planId: 'cloudflare-pages', planName: 'Cloudflare Pages' },
        },
        {
          id: 'q2-framework',
          label: 'Vue / React 框架预设与预览部署',
          nextId: null,
          result: { planId: 'vercel-static', planName: 'Vercel 静态托管' },
        },
      ],
    },
    // 全栈分支：按技术水平分流
    q3: {
      id: 'q3',
      question: '你的运维技术水平？',
      options: [
        {
          id: 'q3-beginner',
          label: '新手（不熟悉 Linux 与命令行）',
          nextId: null,
          result: { planId: 'vps-baota', planName: 'VPS + 宝塔面板' },
        },
        { id: 'q3-intermediate', label: '中级（熟悉 Linux 与 Git）', nextId: 'q5' },
        { id: 'q3-advanced', label: '高级（熟悉容器与 CI/CD）', nextId: 'q6' },
      ],
    },
    // 容器分支：按规模分流
    q4: {
      id: 'q4',
      question: '容器化项目的规模与诉求？',
      options: [
        {
          id: 'q4-global',
          label: '需要全球多区域分布与低延迟',
          nextId: null,
          result: { planId: 'fly-io', planName: 'Fly.io' },
        },
        {
          id: 'q4-single',
          label: '单机部署，多服务编排',
          nextId: null,
          result: { planId: 'vps-docker', planName: 'VPS + Docker Compose' },
        },
        {
          id: 'q4-enterprise',
          label: '企业级，需高可用与弹性伸缩',
          nextId: null,
          result: { planId: 'self-hosted-k8s', planName: '自建 K8s 集群' },
        },
      ],
    },
    // 中级全栈：按数据持久化需求分流
    q5: {
      id: 'q5',
      question: '是否需要数据持久化（数据库）？',
      options: [
        {
          id: 'q5-no-persist',
          label: '不需要，仅轻量 API',
          nextId: null,
          result: { planId: 'vercel-serverless', planName: 'Vercel Serverless Functions' },
        },
        {
          id: 'q5-persist',
          label: '需要数据库与持久存储',
          nextId: null,
          result: { planId: 'railway-free', planName: 'Railway 免费版' },
        },
      ],
    },
    // 高级全栈：按预算分流
    q6: {
      id: 'q6',
      question: '你的预算区间？',
      options: [
        {
          id: 'q6-low',
          label: '低预算（按用量付费，月均几十元）',
          nextId: null,
          result: { planId: 'railway', planName: 'Railway（付费）' },
        },
        {
          id: 'q6-medium',
          label: '中预算（月均百元级，稳定优先）',
          nextId: null,
          result: { planId: 'render', planName: 'Render' },
        },
      ],
    },
  },
}
