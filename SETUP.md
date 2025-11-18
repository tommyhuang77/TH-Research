# TH-Research 设置指南

本指南将帮助你配置 TH-Research 项目并部署到 Railway。

## 项目概述

TH-Research 是一个 AI 生成的 HTML 报告存放与分享平台，允许你：
- 📤 上传 HTML 报告文件
- 🔗 自动生成公开分享链接
- 🛡️ 密码保护管理界面
- 🔄 停用、置换或删除报告

## 前置要求

- Node.js 18.x 或更高版本
- Railway 账户（Hobby Plan）
- Supabase 账户（Pro 订阅）

## 步骤 1：Supabase 配置

### 1.1 创建 Supabase 项目（如果还没有）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目或使用现有项目

### 1.2 创建数据库表

在 Supabase SQL Editor 中执行以下 SQL 语句：

```sql
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

### 1.3 创建存储桶

1. 进入 Supabase Dashboard 的 **Storage** 标签
2. 点击 **Create a new bucket**
3. 输入名称：`reports`
4. **禁用** Public 选项（我们会使用签名 URL）
5. 点击 **Create bucket**

### 1.4 获取 API 密钥

1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_KEY`（向下滚动查看）

## 步骤 2：本地开发

### 2.1 安装依赖

```bash
cd /Users/angelchang3/TH-Research
npm install
```

### 2.2 创建 `.env` 文件

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 并填入你的配置：

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

UPLOAD_PASSWORD=your_secure_password_here
MAX_FILE_SIZE=52428800
STORAGE_BUCKET=reports
APP_URL=http://localhost:3000
```

⚠️ **重要**：`UPLOAD_PASSWORD` 建议使用强密码（至少 12 个字符，包含大小写和数字）

### 2.3 本地运行

```bash
npm start
```

访问 `http://localhost:3000`

### 2.4 测试

1. 访问 `http://localhost:3000` 查看首页
2. 点击"进入管理面板"
3. 输入你在 `.env` 中设置的密码登入
4. 尝试上传一个 HTML 文件
5. 验证文件是否上传成功和网址是否可访问

## 步骤 3：部署到 Railway

### 3.1 在 Railway 中创建新项目

1. 登录 [Railway Dashboard](https://railway.app)
2. 点击 **New Project**
3. 选择 **Deploy from GitHub**（或使用 CLI）

### 3.2 使用 GitHub 连接

```bash
cd /Users/angelchang3/TH-Research

# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit: TH-Research project"

# 添加 GitHub remote（替换为你的仓库 URL）
git remote add origin https://github.com/YOUR_USERNAME/TH-Research.git
git push -u origin main
```

### 3.3 在 Railway 中配置

1. 选择你的 GitHub 仓库
2. 选择分支（通常是 `main`）
3. Railway 会自动检测到 Node.js 项目

### 3.4 设置环境变量

在 Railway Dashboard 中，进入 **Variables** 标签，添加以下环境变量：

```
PORT=3000
NODE_ENV=production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

UPLOAD_PASSWORD=your_secure_password_here
MAX_FILE_SIZE=52428800
STORAGE_BUCKET=reports
APP_URL=https://th-research.railway.app
```

⚠️ 更新 `APP_URL` 为你的实际 Railway 应用 URL

### 3.5 部署

Railway 通常会自动检测 `package.json` 的 `start` 脚本并部署。

部署完成后，你会获得一个公开 URL（例如：`th-research.railway.app`）

## 步骤 4：使用应用

### 访问管理界面

1. 访问 `https://th-research.railway.app/manage`
2. 输入你设置的 `UPLOAD_PASSWORD`
3. 登入后可以：
   - 📤 上传新的 HTML 报告
   - 📋 查看所有已上传的报告
   - 🔗 复制分享链接
   - 🚫 停用报告
   - 🔄 置换报告
   - 🗑️ 删除报告

### 分享报告

1. 在管理界面中找到要分享的报告
2. 点击"📋 复制链接"按钮
3. 将链接分享给其他人
4. 其他人可以直接打开链接查看报告（无需密码）

### 停用报告

1. 点击报告的"🚫 停用"按钮
2. 其他人将无法通过链接访问该报告
3. 报告数据仍保存在数据库中

### 置换报告

1. 点击报告的"🔄 置换"按钮
2. 选择新的 HTML 文件
3. 报告 ID 和链接保持不变，但内容会更新

### 删除报告

1. 点击报告的"🗑️ 删除"按钮
2. 确认删除
3. 报告将从数据库和存储中完全移除

## 常见问题

### Q: 如何更改密码？
A: 在 Railway Dashboard 中编辑 `UPLOAD_PASSWORD` 环境变量，然后重新部署。

### Q: 报告大小限制是多少？
A: 默认为 50MB（`MAX_FILE_SIZE=52428800`）。可在环境变量中修改。

### Q: 文件存储在哪里？
A: 所有文件存储在 Supabase Storage 的 `reports` 桶中。

### Q: 可以删除已分享的链接吗？
A: 可以。点击"🚫 停用"或"🗑️ 删除"即可。

### Q: 其他人可以上传文件吗？
A: 不可以。只有知道 `UPLOAD_PASSWORD` 的人才能访问管理界面。

### Q: 如何查看错误日志？
A: 在 Railway Dashboard 中进入 **Logs** 标签。

## 故障排除

### 应用启动失败

1. 检查 Railway 日志获取错误信息
2. 验证所有环境变量都已正确设置
3. 确保 Supabase 凭证正确

### 无法上传文件

1. 检查 Supabase Storage 中 `reports` 桶是否存在
2. 验证 `SUPABASE_SERVICE_KEY` 权限正确
3. 检查文件大小是否超过 `MAX_FILE_SIZE`

### 上传成功但无法访问报告

1. 检查 `APP_URL` 是否正确设置为你的 Railway URL
2. 验证报告的状态是否为 `active`
3. 查看浏览器控制台的网络标签获取详细错误

## 安全建议

1. **使用强密码**：`UPLOAD_PASSWORD` 应至少 12 个字符
2. **定期更新**：保持 Node.js 和依赖包最新
3. **监控日志**：定期检查 Railway 日志以发现异常活动
4. **备份数据**：定期导出 Supabase 数据

## 后续开发

如需添加新功能，请在 `server.js` 中添加新的路由，或在 `public/manage.html` 中修改管理界面。

所有代码更改可直接 push 到 GitHub，Railway 会自动检测并重新部署。

---

需要帮助？检查 Railway 和 Supabase 的官方文档或查看应用日志。
