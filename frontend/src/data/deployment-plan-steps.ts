// Story 3-5: 部署方案步骤指南数据
// 数据维护规则：
//   1. planId 必须与 deploymentPlans 中的 key 严格对齐
//   2. 每个方案 3-8 个步骤
//   3. title/description 必填，command/estimatedMinutes 可选
//   4. command 中若包含占位符（如 yourname），需在 description 中说明替换方式
//   5. 文案使用简体中文
//   6. 修改后必须通过 deployment-plan-steps.spec.ts 全部用例

import { deploymentPlans } from '@/data/deployment-plans'
import type { DeploymentStep } from '@/types/deployment-plan'

/**
 * 各部署方案的详细步骤指南。
 *
 * 维护规则：
 * - 新增方案时，先在 deploymentPlans 中注册，再在此添加步骤
 * - 每个 planId 至少 3 个步骤，最多 8 个
 * - title ≤ 30 字符，description ≤ 200 字符
 * - command 为真实可执行的命令或配置片段
 * - estimatedMinutes 为大于 0 的整数
 */
export const deploymentPlanSteps: Record<keyof typeof deploymentPlans, DeploymentStep[]> = {
  'github-pages': [
    {
      title: '添加远程仓库',
      description: '在 GitHub 新建公开仓库后，将本地项目与远程仓库关联。',
      command: 'git remote add origin https://github.com/yourname/your-repo.git',
      estimatedMinutes: 2,
    },
    {
      title: '推送到 main 分支',
      description: '将本地代码推送到 GitHub 的 main 分支。',
      command: 'git push -u origin main',
      estimatedMinutes: 3,
    },
    {
      title: '启用 GitHub Pages',
      description: '进入仓库 Settings → Pages，选择 main 分支和 /(root) 作为发布源。',
      estimatedMinutes: 3,
    },
    {
      title: '等待构建并访问',
      description: 'GitHub Actions 自动部署后，通过 https://yourname.github.io/your-repo 访问。',
      estimatedMinutes: 5,
    },
  ],

  'vercel-static': [
    {
      title: '注册并导入项目',
      description: '访问 vercel.com，使用 GitHub 账号登录，导入目标仓库。',
      estimatedMinutes: 3,
    },
    {
      title: '配置构建命令',
      description: '在项目设置中确认 Framework Preset 为对应框架，构建命令通常为 npm run build。',
      command: 'npm run build',
      estimatedMinutes: 2,
    },
    {
      title: '部署并查看域名',
      description: 'Vercel 自动完成首次部署，页面会显示默认的 .vercel.app 域名。',
      estimatedMinutes: 3,
    },
    {
      title: '绑定自定义域名（可选）',
      description: '在 Project Settings → Domains 中添加自己的域名，并按提示配置 DNS。',
      estimatedMinutes: 10,
    },
  ],

  'cloudflare-pages': [
    {
      title: '登录 Cloudflare Dashboard',
      description: '访问 dash.cloudflare.com，使用已有账号登录或注册。',
      estimatedMinutes: 3,
    },
    {
      title: '连接 Git 仓库',
      description: '在 Pages 页面点击「创建项目」，选择 GitHub 仓库并授权。',
      estimatedMinutes: 3,
    },
    {
      title: '配置构建设置',
      description: '设置构建命令和输出目录，例如构建命令 npm run build，输出目录 dist。',
      command: 'npm run build',
      estimatedMinutes: 2,
    },
    {
      title: '保存并部署',
      description: '点击「保存并部署」，Cloudflare 会自动构建并发布到全球边缘网络。',
      estimatedMinutes: 5,
    },
  ],

  'netlify-free': [
    {
      title: '登录 Netlify',
      description: '访问 netlify.com 并使用 GitHub/GitLab 账号登录。',
      estimatedMinutes: 3,
    },
    {
      title: '导入仓库',
      description: '点击「Add new site」→「Import an existing project」，选择仓库。',
      estimatedMinutes: 3,
    },
    {
      title: '确认构建设置',
      description: 'Netlify 会自动识别框架，确认 Build command 和 Publish directory 正确。',
      command: 'npm run build',
      estimatedMinutes: 2,
    },
    {
      title: '部署站点',
      description: '点击「Deploy site」，等待构建完成后访问自动分配的 .netlify.app 域名。',
      estimatedMinutes: 5,
    },
  ],

  'vercel-serverless': [
    {
      title: '准备前后端同仓项目',
      description: '确保项目根目录包含 api/ 目录或 pages/api/ 目录用于存放 Serverless Functions。',
      command: 'mkdir api && touch api/hello.ts',
      estimatedMinutes: 5,
    },
    {
      title: '编写函数入口',
      description: '在 api/ 目录下创建 hello.ts 文件，写入以下默认处理器代码：\n\nexport default function handler(req, res) {\n  res.status(200).json({ message: "Hello" })\n}',
      estimatedMinutes: 5,
    },
    {
      title: '推送到 Git 并导入 Vercel',
      description: '将代码推送到 GitHub，在 Vercel 导入项目，框架预设会自动识别函数目录。',
      estimatedMinutes: 5,
    },
    {
      title: '测试函数接口',
      description: '部署完成后访问 https://your-project.vercel.app/api/hello 验证函数响应。',
      estimatedMinutes: 3,
    },
  ],

  'railway-free': [
    {
      title: '注册 Railway 账号',
      description: '访问 railway.app，使用 GitHub 账号注册并验证邮箱。',
      estimatedMinutes: 5,
    },
    {
      title: '新建项目并部署',
      description: '点击「New Project」→「Deploy from GitHub repo」，选择目标仓库。',
      estimatedMinutes: 5,
    },
    {
      title: '查看部署日志',
      description: 'Railway 自动检测启动命令，可在 Deployments 页面查看构建和运行日志。',
      estimatedMinutes: 5,
    },
    {
      title: '生成域名并访问',
      description: '部署成功后，Railway 会自动生成 .up.railway.app 域名。',
      estimatedMinutes: 2,
    },
  ],

  'railway': [
    {
      title: '绑定支付方式',
      description: '在 Railway 账单页面绑定信用卡或 PayPal，用于按用量付费。',
      estimatedMinutes: 5,
    },
    {
      title: '添加数据库服务',
      description: '在项目内点击「New」→「Database」→「Add PostgreSQL」，等待数据库就绪。',
      estimatedMinutes: 5,
    },
    {
      title: '配置环境变量',
      description: '在 Railway 项目的 Variables 页面添加 DATABASE_URL 环境变量，值可从已创建的 Postgres 服务详情中复制。',
      estimatedMinutes: 5,
    },
    {
      title: '扩缩容与监控',
      description: '根据流量调整服务实例数，并通过 Railway 面板查看资源使用情况。',
      estimatedMinutes: 5,
    },
  ],

  'render': [
    {
      title: '注册 Render 账号',
      description: '访问 render.com，使用 GitHub/GitLab 账号登录。',
      estimatedMinutes: 3,
    },
    {
      title: '创建 Web Service',
      description: '点击「New +」→「Web Service」，选择目标 Git 仓库。',
      estimatedMinutes: 3,
    },
    {
      title: '配置启动命令',
      description: '填写 Build Command 和 Start Command，例如 npm run build 和 npm start。',
      command: 'npm run build',
      estimatedMinutes: 3,
    },
    {
      title: '添加 PostgreSQL',
      description: '点击「New +」→「PostgreSQL」，创建后在内网连接字符串中复制 DATABASE_URL。',
      estimatedMinutes: 5,
    },
    {
      title: '部署并访问',
      description: '保存设置后 Render 自动构建部署，访问 .onrender.com 域名查看效果。',
      estimatedMinutes: 5,
    },
  ],

  'vps-baota': [
    {
      title: '购买 VPS 并获取 SSH 信息',
      description: '在阿里云/腾讯云/轻量应用服务器等购买 VPS，记录 IP、用户名和密码。',
      estimatedMinutes: 10,
    },
    {
      title: 'SSH 连接服务器',
      description: '使用终端通过 SSH 登录到服务器。',
      command: 'ssh root@your-server-ip',
      estimatedMinutes: 3,
    },
    {
      title: '安装宝塔面板',
      description: '在 CentOS/RHEL 系列服务器上执行宝塔官方安装脚本。（Debian/Ubuntu 用户请使用 apt 安装 wget 后执行相同脚本）',
      command: 'yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh',
      estimatedMinutes: 10,
    },
    {
      title: '登录宝塔并安装 LNMP',
      description: '通过安装完成后提示的面板地址登录，一键安装 Nginx + MySQL + PHP。',
      estimatedMinutes: 15,
    },
    {
      title: '上传项目并配置站点',
      description: '在宝塔「网站」中添加站点，上传构建产物到站点根目录，配置 Nginx 伪静态规则。',
      estimatedMinutes: 15,
    },
  ],

  'vps-docker': [
    {
      title: '准备 VPS 环境',
      description: '购买 VPS 并安装 Docker 和 Docker Compose。',
      command: 'sudo apt update && sudo apt install -y docker.io docker-compose',
      estimatedMinutes: 10,
    },
    {
      title: '编写 Dockerfile',
      description: '在项目根目录创建名为 Dockerfile 的文件，写入以下内容定义应用镜像：\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install && npm run build\nCMD ["npm", "start"]',
      estimatedMinutes: 10,
    },
    {
      title: '编写 docker-compose.yml',
      description: '在项目根目录创建名为 docker-compose.yml 的文件，写入以下内容定义服务：\n\nversion: "3.8"\nservices:\n  web:\n    build: .\n    ports:\n      - "80:3000"',
      estimatedMinutes: 10,
    },
    {
      title: '构建并启动服务',
      description: '在服务器上拉取代码后执行 docker-compose up 启动所有服务。',
      command: 'docker-compose up -d --build',
      estimatedMinutes: 10,
    },
    {
      title: '配置 Nginx 反向代理',
      description: '安装 Nginx 后，在 /etc/nginx/sites-available/default 或对应配置文件中写入以下内容，将请求反向代理到 Docker 容器端口：\n\nserver { listen 80; location / { proxy_pass http://127.0.0.1:3000; } }',
      estimatedMinutes: 10,
    },
  ],

  'fly-io': [
    {
      title: '安装 flyctl',
      description: '在本地安装 Fly.io 官方命令行工具。',
      command: 'curl -L https://fly.io/install.sh | sh',
      estimatedMinutes: 3,
    },
    {
      title: '登录 Fly.io',
      description: '执行 flyctl auth signup 或 flyctl auth login 完成认证。',
      command: 'flyctl auth login',
      estimatedMinutes: 3,
    },
    {
      title: '初始化应用',
      description: '在项目根目录执行 flyctl launch，按提示选择区域和配置。',
      command: 'flyctl launch',
      estimatedMinutes: 5,
    },
    {
      title: '部署应用',
      description: '执行 flyctl deploy 将应用构建并部署到 Fly.io 全球边缘。',
      command: 'flyctl deploy',
      estimatedMinutes: 10,
    },
    {
      title: '查看应用状态',
      description: '通过 flyctl status 查看实例状态，通过 flyctl open 打开应用。',
      command: 'flyctl status',
      estimatedMinutes: 2,
    },
  ],

  'self-hosted-k8s': [
    {
      title: '准备服务器集群',
      description: '准备至少 3 台服务器（1 Master + 2 Worker），安装兼容的 Linux 系统。',
      estimatedMinutes: 30,
    },
    {
      title: '安装容器运行时',
      description: '在所有节点安装 containerd 或 Docker 作为容器运行时。',
      command: 'sudo apt update && sudo apt install -y containerd',
      estimatedMinutes: 10,
    },
    {
      title: '初始化 Kubernetes 集群',
      description: '在 Master 节点使用 kubeadm 初始化集群。',
      command: 'sudo kubeadm init --pod-network-cidr=10.244.0.0/16',
      estimatedMinutes: 15,
    },
    {
      title: '创建 .kube 目录',
      description: '在当前用户目录下创建 .kube 文件夹，用于存放 kubectl 配置文件。',
      command: 'mkdir -p $HOME/.kube',
      estimatedMinutes: 1,
    },
    {
      title: '复制集群证书',
      description: '将 kubeadm 生成的 admin 配置文件复制到当前用户目录。',
      command: 'sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config',
      estimatedMinutes: 1,
    },
    {
      title: '修改文件权限',
      description: '将 kubectl 配置文件的所有者改为当前用户，避免权限问题。',
      command: 'sudo chown $(id -u):$(id -g) $HOME/.kube/config',
      estimatedMinutes: 1,
    },
    {
      title: '安装网络插件',
      description: '部署 Flannel 网络插件，使 Pod 间可以通信。建议从 Flannel 官方 release 页面获取最新稳定版本 YAML。',
      command: 'kubectl apply -f https://github.com/flannel-io/flannel/releases/download/v0.25.0/kube-flannel.yml',
      estimatedMinutes: 5,
    },
    {
      title: '部署应用',
      description: '编写 Deployment 和 Service YAML 并应用到集群。',
      command: 'kubectl apply -f k8s/',
      estimatedMinutes: 10,
    },
  ],
}
