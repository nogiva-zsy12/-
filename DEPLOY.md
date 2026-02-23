# 随口记 - Vercel 部署指南

## 项目简介

随口记是一款 AI 驱动的任务管理应用，通过毒舌式激励帮助你完成任务。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite 6 + TypeScript |
| 后端 | Express.js + Node.js |
| 数据库 | Supabase (PostgreSQL) |
| AI 服务 | DeepSeek / Gemini / Kimi / 通义千问 / MiniMax |
| 语音识别 | 阿里云 NLS |

---

## 环境准备

### 1. 注册账号

- [Vercel](https://vercel.com) - 前端部署
- [Supabase](https://supabase.com) - 数据库
- [Railway](https://railway.app) - 后端部署（推荐）

### 2. 克隆项目

```bash
git clone https://github.com/nogiva-zsy12/-.git
cd -
npm install
```

---

## 后端部署（Railway 推荐）

### 步骤 1：创建 Railway 项目

1. 访问 [Railway](https://railway.app)，使用 GitHub 登录
2. 点击 `New Project` → `Deploy from GitHub repo`
3. 选择仓库 `nogiva-zsy12/-`
4. 选择 `Backend` 服务（Node.js）

### 步骤 2：配置环境变量

在 Railway 项目设置中添加以下环境变量：

```
SUPABASE_URL=https://hlzdsjtxtgjmbxrtazvm.supabase.co
SUPABASE_ANON_KEY=你的Supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的Supabase_service_role_key

# AI API Keys（至少选择一个配置）
DEEPSEEK_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
KIMI_API_KEY=xxx
QWEN_API_KEY=xxx
MINIMAX_API_KEY=xxx

# 阿里云语音识别（可选）
ALIYUN_ACCESS_KEY_ID=xxx
ALIYUN_ACCESS_KEY_SECRET=xxx
ALIYUN_APPKEY=xxx
```

### 步骤 3：获取 Supabase 密钥

1. 登录 [Supabase](https://supabase.com)
2. 进入你的项目 → `Project Settings` → `API`
3. 复制：
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 步骤 4：部署后端

1. Railway 会自动从 GitHub 拉取代码
2. 构建完成后，点击 `Deploy`
3. 记录生成的域名，例如：`https://your-app.railway.app`

---

## 前端部署（Vercel）

### 步骤 1：创建 Vercel 项目

1. 访问 [Vercel](https://vercel.com)，使用 GitHub 登录
2. 点击 `Add New` → `Project`
3. 选择仓库 `nogiva-zsy12/-`

### 步骤 2：配置构建设置

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Vite |
| Build Command | npm run build |
| Output Directory | dist |

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加：

```
VITE_API_URL=https://your-backend.railway.app
```

### 步骤 4：部署

1. 点击 `Deploy`
2. 等待构建完成
3. 获取访问域名，例如：`https://your-app.vercel.app`

---

## 修改 API 地址

部署完成后，需要修改前端代码中的 API 地址：

### 方式一：环境变量（推荐）

在 `vite.config.ts` 中修改代理配置：

```typescript
proxy: {
  '/api': {
    target: 'https://your-backend.railway.app',  // 改为你的后端地址
    changeOrigin: true,
  }
}
```

### 方式二：修改 API 请求地址

在 `App.tsx` 中修改 API 请求地址：

```typescript
// 将所有 /api/xxx 改为 https://your-backend.railway.app/api/xxx
```

---

## 验证部署

### 1. 访问前端

打开 Vercel 分配的域名，确认页面正常加载。

### 2. 测试功能

- [ ] 注册/登录
- [ ] 创建任务
- [ ] 任务列表显示
- [ ] 任务详情页
- [ ] AI 对话（如果配置了 API）

### 3. 检查网络请求

打开浏览器开发者工具 → Network 标签，确认 API 请求正常。

---

## 常见问题

### Q1: 提示 "Failed to fetch"

检查后端是否正常运行，确保 `VITE_API_URL` 配置正确。

### Q2: AI 功能无法使用

1. 确认已在后端配置 AI API Key
2. 检查 API Key 是否有效
3. 查看后端日志排查错误

### Q3: 数据库连接失败

1. 确认 Supabase URL 和 Key 正确
2. 检查 Supabase 项目的 Row Level Security (RLS) 设置

### Q4: 语音识别无法使用

1. 确认已配置阿里云 API Key
2. 检查浏览器是否授权麦克风权限

---

## 架构图

```
┌─────────────────┐      ┌─────────────────┐
│   用户浏览器    │ ───► │     Vercel      │
│  (React 前端)   │      │   (静态部署)    │
└─────────────────┘      └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Railway/Render  │
                         │  (Express 后端) │
                         └────────┬────────┘
                                  │
                                  ▼
┌─────────────────┐      ┌─────────────────┐
│   阿里云 NLS    │ ◄─── │   Supabase      │
│  (语音识别)     │      │   (数据库)       │
└─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  DeepSeek/Gemini │
                         │   /Kimi 等 AI    │
                         └─────────────────┘
```

---

## 更新部署

代码更新后：

1. 推送代码到 GitHub
2. Vercel 和 Railway 会自动触发部署
3. 等待构建完成

---

## 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app)
- [Supabase 文档](https://supabase.com/docs)
- [DeepSeek API](https://platform.deepseek.com)
- [阿里云 NLS](https://help.aliyun.com/document_detail/184383.html)
