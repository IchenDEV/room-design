# 数据库与后端配置

栖居设计使用 **Supabase**（Postgres + Auth + Realtime）实现账号、云端同步与实时协作。前端调用 Supabase 托管 API，无需自建服务端。

## 1. 创建 Supabase 项目
1. 前往 https://supabase.com 新建项目，记下区域（建议选离用户近的）。
2. 进入 **Project Settings → API**，复制：
   - `Project URL` → 填入 `.env.local` 的 `VITE_SUPABASE_URL`
   - `anon public` key → 填入 `VITE_SUPABASE_ANON_KEY`

   这两个值在前端使用、无保密性，安全性由 RLS 保证。

## 2. 执行数据库 Schema
进入 **SQL Editor**，粘贴并执行 `db/schema.sql` 全部内容。
该脚本可重复执行（使用 `if not exists` / `drop policy if exists`），但会重置策略。

涉及的表：
- `profiles` 用户档案（用户名、昵称、头像、协作光标颜色）
- `projects` 云端方案（含 Yjs 文档 `ydoc`）
- `project_members` 协作成员（owner / editor / viewer）
- `project_invites` 邀请链接
- `project_snapshots` 版本历史（可选）
- 所有表均已启用 **行级安全（RLS）**，规则见 schema 注释。

脚本也会为 `authenticated` 显式授予前端 API 需要的表权限，以兼容 Supabase 新项目默认不自动暴露表权限的设置；实际可见行仍由 RLS 控制。

## 3. 配置登录方式
进入 **Authentication → Providers**：
- **Email**：开启即可（底层仍使用邮箱密码；应用注册时会同时写入唯一用户名，登录时支持「用户名或邮箱 + 密码」）。
- **Google**：在 Google Cloud Console 创建 OAuth 凭据，回调地址填
  `https://<你的项目>.supabase.co/auth/v1/callback`，把 client id/secret 填回 Supabase。
- **GitHub**：在 GitHub Developer Settings 创建 OAuth App，回调地址同上，填回 Supabase。

进入 **Authentication → URL Configuration**：
- **Site URL**：`https://你的域名`（生产）或 `http://localhost:5173`（本地）。
- **Redirect URLs**：同时加上本地与生产地址。

## 4. 配置 Realtime Authorization（协作必需）
实时协同通过 Supabase Realtime 的 **Broadcast 频道** `yjs:<projectId>` 传输 Yjs 更新，
需限定只有项目成员能加入频道。

`db/schema.sql` 已在 `realtime.messages` 上创建 RLS policy：
- `yjs:<projectId>` 频道的 Broadcast / Presence 读取仅允许项目 owner 或成员。
- Broadcast 写入仅允许 owner / editor，避免 viewer 通过实时广播绕过项目写权限。
- Presence 写入允许所有项目成员。

进入 **Realtime → Settings**，关闭 **Allow public access**，确保私有频道只走上述 RLS。

## 5. 部署到 Vercel
1. 导入仓库到 Vercel，框架选 Vite（`vercel.json` 已配置 SPA rewrite）。
2. 在 Vercel Project Settings → Environment Variables 配置：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 把 `rooms.idevlab.dev` 等 DNS 解析指向 Vercel（在 Vercel 后台 Domains 绑定）。
4. 原 GitHub Pages 部署已停用（`.github/workflows/deploy-pages.yml` 仅保留手动触发）。

## 本地开发
```bash
cp .env.example .env.local   # 填入你的 Supabase URL / anon key
pnpm install
pnpm dev
```

未配置 `VITE_SUPABASE_URL` 时，应用自动降级为纯本地模式（IndexedDB），不影响单机使用。
