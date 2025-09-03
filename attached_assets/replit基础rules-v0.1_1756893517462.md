# replit基础rules-v0.1

## 项目概述
本项目是一个基于 Node.js 和 React 的全栈 Web 应用程序，采用现代化的技术栈，并集成了AI特色能力。项目使用 TypeScript 开发，具备完整的身份验证、数据管理、文件处理等功能。

## 全局优先级规范（工具与策略）
- 数据库优先级：PostgreSQL > MySQL > SQLite > Supabase（仅在明确要求云后端时使用）
- 身份验证优先级：JWT（Access Token + Refresh Token）> Cookie Session
- 包管理器优先级：pnpm > npm > yarn
- ORM：Drizzle ORM（默认）
- 默认生成器：pnpm + Drizzle + PostgreSQL + JWT；若本地未配置数据库，自动降级为 SQLite，并提供迁移脚本便于后续切换到 PostgreSQL/MySQL。

## 前端技术栈

### 核心框架与构建工具
- **React 18.3.1** - 现代化的前端框架，使用函数组件和 Hooks
- **TypeScript 5.6.3** - 类型安全的 JavaScript 超集
- **Vite 5.4.19** - 现代化的前端构建工具，快速开发服务器
- **Wouter 3.3.5** - 轻量级的 React 路由库

### UI 组件库与样式
- **Tailwind CSS 3.4.17** - 实用优先的 CSS 框架
- **Radix UI** - 无样式的高质量 React 组件库
  - react-accordion, react-dialog, react-dropdown-menu
  - react-select, react-tabs, react-toast 等 20+ 组件
- **Framer Motion 11.13.1** - 动画库
- **Lucide React 0.453.0** - 图标库
- **React Icons 5.4.0** - 图标集合，包含公司 logo
- **Next Themes 0.4.6** - 主题切换支持

### 表单处理与验证
- **React Hook Form 7.55.0** - 高性能的表单库
- **@hookform/resolvers 3.10.0** - 表单验证解析器
- **Zod 3.24.2** - TypeScript 优先的架构验证库
- **Input OTP 1.4.2** - OTP 输入组件

### 数据管理与状态
- **TanStack React Query 5.60.5** - 数据获取和缓存库
- **Zod Validation Error 3.4.0** - Zod 错误处理增强

### 图表与可视化
- **Chart.js 4.5.0** - 图表库
- **Recharts 2.15.2** - React 图表组件
- **React Day Picker 8.10.1** - 日期选择器

### 文件上传
- **Uppy** - AI增强的文件上传库套件
  - @uppy/core, @uppy/dashboard, @uppy/react
  - @uppy/aws-s3, @uppy/drag-drop, @uppy/file-input
  - **AI特色功能**：
    - 多种上传方式：支持拖拽上传、点击上传、批量上传
    - 文件类型验证：自动检测和限制文件类型
    - 大文件分片：大文件自动分片上传，提升稳定性
    - 上传进度：实时显示上传进度和状态

### 其他前端工具
- **Date-fns 3.6.0** - 日期处理库
- **CLSX 2.1.1** & **Class Variance Authority 0.7.1** - 条件类名工具
- **Embla Carousel React 8.6.0** - 轮播组件
- **React Resizable Panels 2.1.7** - 可调整大小的面板
- **XLSX 0.18.5** - Excel 文件处理

## 后端技术栈

### 核心框架
- **Node.js** - 服务器运行时环境
- **Express 4.21.2** - Web 应用框架
- **TypeScript 5.6.3** - 类型安全的服务器端开发

### 身份验证与令牌管理
- **jsonwebtoken 9.x** - JWT 令牌签发与校验
- **cookie-parser 1.x（可选）** - 若将 Refresh Token 放入 httpOnly Cookie
- **bcryptjs 2.x 或 Node.js Crypto.scrypt** - 安全密码哈希
- **helmet 7.x、cors 2.x、express-rate-limit 7.x** - 安全与限流

#### 身份认证系统
- **双重登录支持**：
  - 邮箱登录：支持标准邮箱地址验证和登录
  - 手机号登录：支持手机号码格式验证
  - 统一密码策略：使用 Node.js crypto 模块的 scrypt 算法进行安全哈希
- **令牌管理**：
  - Access Token：短时（15-30 分钟），通过 Authorization: Bearer 头传递
  - Refresh Token：长时（7-30 天），存储于数据库或 Redis；可放入 httpOnly Cookie 以降低 XSS 风险
  - 刷新流程：/auth/refresh 接口根据有效 Refresh Token 颁发新的 Access Token
- **可选会话**：仅当需求明确要求服务端会话时，才启用 Express-Session + PostgreSQL 持久化会话存储

#### 安全特性实现
```javascript
// 密码哈希算法
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// 时间安全的密码比较
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
```

### 数据库与 ORM
- **Drizzle ORM 0.39.1** - 现代化的 TypeScript ORM
- **Drizzle Zod 0.7.0** - 与 Zod 集成的类型验证
- **Drizzle Kit 0.30.4** - 数据库迁移和管理工具

### 工具库
- **Nanoid 5.1.5** - 唯一 ID 生成器
- **Memoizee 0.4.17** - 函数记忆化
- **Memory Store 1.6.7** - 内存会话存储

## 数据库

### 数据库系统
- **PostgreSQL** - 主要数据库系统
- 通过环境变量 `DATABASE_URL` 连接
- 支持自动生成 UUID 主键
- 优先使用 PostgreSQL；如不可用，按 MySQL → SQLite → Supabase 回退，并在 .env 中设置对应的 `DATABASE_URL`
- 连接字符串示例：
  - PostgreSQL: `postgres://user:pass@host:5432/db`
  - MySQL: `mysql://user:pass@host:3306/db`
  - SQLite: `file:./data/app.db`

### 数据模型设计
项目包含以下主要数据表：
- **users** - 用户表（支持邮箱/手机号登录）
- **sessions** - 会话存储表（如启用会话）或 **refresh_tokens** - 刷新令牌表（如采用 JWT 刷新策略）

## 中间件系统

### 身份验证中间件
- **令牌验证**：验证 JWT 的有效性、过期时间与签名；可选维护 Refresh Token 黑名单
- **权限检查**：`isAuthenticated`/`requireRole` 中间件保护需要登录或特定角色的路由

### 请求处理中间件
- **日志中间件**：记录 API 请求响应时间和状态
- **错误处理中间件**：统一处理和格式化错误响应
- **CORS 配置**：支持跨域请求（开发环境）
- **安全中间件**：启用 helmet、限流（express-rate-limit）、严格的 CORS 白名单

### 静态资源中间件
- **Vite 集成**：开发环境下通过 Vite 中间件服务前端资源
- **静态文件服务**：生产环境下直接服务构建后的静态文件

## 资源文件存储

### 本地资源
- **静态资源**：存储在 `attached_assets/` 目录
- **构建输出**：生产构建文件输出到 `dist/public/`
- **前端源码**：存储在 `client/src/` 目录

### 存储
- **文件上传**：通过 Uppy 组件支持拖拽上传
- **图片处理**：支持头像和产品图片上传

### 数据库存储
- **用户数据**：用户信息等结构化数据
- **JSONB 字段**：存储复杂的业务逻辑数据

## 项目架构特点

### 全栈 TypeScript
- 前后端共享类型定义（`shared/schema.ts`）
- 统一的数据验证和类型安全

### 模块化设计
- 前端组件化开发
- 后端服务模块化
- 共享业务逻辑和类型定义

### 企业级功能
- 完整的用户认证系统（支持双重登录）
- 数据库事务支持
- 实时数据同步
- 文件上传和管理
- 多角色权限系统

## 脚手架与脚本规范
- 包管理器：优先使用 pnpm；提供等价的 npm/yarn 脚本
- 推荐 scripts（根目录 package.json）：
  - `dev`：并行启动前端与后端（如 `turbo` 或 `concurrently`）
  - `build:client`、`build:server`、`build`：分别构建前端、后端与整体
  - `start:prod`：生产模式启动（先构建）
  - `db:generate`、`db:migrate`、`db:studio`：数据库生成、迁移与可视化（Drizzle Kit）
- 推荐目录结构：`client/`、`server/`、`shared/`、`scripts/`、`.env*`

# 如果需求在一开始没有特别要求需不需要用户系统，请按你自己的判断添加以下用户系统

## 1. 项目概述

用户身份认证、数据按用户隔离存储

### 1.1 核心需求
- 用户访问系统时首先进入登录页面
- 支持手机号+密码登录，系统自动创建用户账号
- 用户数据按账号ID进行隔离存储
- 如果是在原有系统上迭代新增用户系统,保持原有功能和UI布局不变

- 如果需求没有特别定义用户系统,你需要满足:
  - 在站点合适的位置显示用户头像+用户名
  - 点击头像或用户名弹出一个气泡列表悬浮窗,包含用户名\手机号\账号管理\退出登录
  - 点击账户管理弹出个人信息管理弹窗界面,包含基本信息呈现\修改密码两个tab,默认显示基本信息tab页面内容
  - 基本信息tab,包含头像编辑\用户名编辑\手机号等显示,注意:手机号不可编辑;头像可从本地上传图表编辑.底部是取消关闭弹窗\保存按钮
  - 修改密码,包含当前密码\新密码\确认新密码输入框.底部是取消关闭弹窗\修改密码
  - 如果需求里的用户系统不够完善请参照上述描述,你按需增加相关功能
- 特别要求:如果用户系统不是完整的前后端系统,只是前端,你可以根据下面提供的方案,推荐用户将数据存入数据库,并专业熟练的帮用户检查及完善前后端逻辑.

## 2. 系统架构设计

### 2.1 整体架构

```mermaid
graph TD
    A[用户浏览器] --> B[登录页面]
    B --> C[用户认证服务]
    C --> D[主应用系统]
    D --> E[用户数据服务]
    E --> F[数据库层]
    
    G[管理员浏览器] --> H[管理后台]
    H --> I[用户管理服务]
    I --> F
    
    subgraph "前端层"
        B
        D
        H
    end
    
    subgraph "服务层"
        C
        E
        I
    end
    
    subgraph "数据层"
        F
    end
```

# 如果需求没有特别要求数据存储在前端，请务必保持数据是存入数据库的，即标准的前后端数据入库流程。

## 本地化部署与交付

### 交付目标
- 一键本地启动：前端、后端、数据库三位一体
- 开发环境热更新、生产环境稳定运行
- 数据持久化与迁移可重复
- 环境变量模板与安全基线

### 环境变量模板（示例）
- 服务器端（server/.env）
  - DATABASE_URL=postgres://user:pass@localhost:5432/app
  - JWT_ACCESS_SECRET=replace_me
  - JWT_REFRESH_SECRET=replace_me
  - PORT=5173
  - CORS_ORIGIN=http://localhost:5173
- 客户端（client/.env）
  - VITE_API_BASE_URL=http://localhost:5173/api

### 开发模式
- 安装依赖：优先 `pnpm`（根目录）
- 初始化数据库：`pnpm db:migrate`
- 启动：`pnpm dev`（并行启动前后端）

### 生产构建与运行
- 构建：`pnpm build`
- 运行：`pnpm start:prod`
- 健康检查：`/healthz` 返回 200 与版本信息

### 可选：Docker Compose（简化）
- services：db（PostgreSQL）、server、client
- 数据卷：持久化数据库与构建产物

### 验收清单
- 注册/登录/刷新令牌/登出流程完整可用
- 认证保护路由返回 401/403 合理
- 数据写入数据库，页面刷新后数据持久
- 环境变量缺失有清晰错误提示
- `pnpm dev/build/start:prod/db:migrate` 正常执行

---

## Replit 平台适配与最佳实践（新增）

本节针对 replit.com 的运行环境与资源约束，给出可直接落地的适配策略与脚本规范，确保“一键运行、一个端口、最少坑位”。

### 1) 运行模式与端口策略
- 单端口、单进程优先（强烈推荐）：
  - 开发：使用 Express 集成 Vite 中间件（dev server）提供前端与 API，同端口暴露。
  - 生产：先构建前端（Vite build），再由 Express 以静态服务方式托管 dist，并挂载 API，同端口暴露。
- 绑定端口与主机：必须使用 `process.env.PORT`，主机 `0.0.0.0`。严禁硬编码 `5173/3000` 或使用 `strictPort: true`。
- 在 Replit 默认工作区中不建议使用 `concurrently` 启动两个端口（Vite + API）。如需双进程，请在本地或其他云环境使用。

### 2) CORS、代理与 Cookie 策略
- 代理识别：启用 `app.set('trust proxy', 1)` 正确解析 X-Forwarded-* 头，获取真实协议与 IP。
- CORS：
  - 开发：允许动态白名单（含 `*.repl.co` 的预览域名），`credentials: true`，仅放行必要方法与头。
  - 生产：收敛到明确域名白名单，避免通配符。
- Cookie（如使用 httpOnly 刷新令牌）：
  - 预览域名为 HTTPS 终端：`Secure=true`、`SameSite=None`；Domain 留空或按需设置；Path 按接口范围设定。
- JWT：Access Token 建议放 Authorization Header；Refresh Token 可选放入 httpOnly Cookie（见上）。

### 3) Secrets 与环境变量
- 使用 Replit 的 Secrets 面板管理敏感信息，不提交 `.env` 到仓库。
- 启动时进行缺失项校验（仅打印是否存在，不打印值）。
- 建议的关键变量（示例）：
  - `DATABASE_URL`（推荐托管 Postgres）
  - `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`
  - `CORS_ORIGINS`（逗号分隔）或 `CORS_ORIGIN`
  - `ASSET_DIR`（本地调试上传目录，默认 `./attached_assets`）
  - `NODE_ENV`（development/production）

### 4) 数据库策略
- Replit 容器不适合自建数据库：推荐使用外部托管 Postgres（如 Neon/Supabase/Render Postgres），将连接串写入 Secrets。
- 新手或纯演示可回退 SQLite：`file:./data/app.db`。确保 `data/` 目录在项目内持久化。
- 迁移：通过 Drizzle Kit 脚本在 Replit Shell 执行 `db:generate`、`db:migrate`。

### 5) 静态资源与文件上传
- 生产：建议使用对象存储（S3 或兼容服务）+ 预签名直传（Uppy 的 AWS S3 插件）。
- 调试/小体量：使用 `ASSET_DIR` 本地目录（默认 `./attached_assets`），限制单文件大小、类型白名单与并发数，避免占用过多磁盘/内存。

### 6) 文件监听兼容
- 在容器/虚拟化环境中，Watch 需要轮询：
  - Vite、tsc、nodemon/tsx 建议开启 `usePolling: true`（或相应选项），并设置合理的轮询间隔（如 300ms）。

### 7) 日志、真实 IP 与限流
- 开启 `trust proxy` 后使用 `req.ip` 获取真实客户端 IP。
- `express-rate-limit` 基于真实 IP 生效；日志输出建议包含：`trust proxy: enabled`、CORS 白名单长度、监听端口等启动信息。

### 8) WebSocket/SSE
- 复用同一端口：如有自定义 WS/SSE，请与主 HTTP 服务器共用端口，避免额外端口。
- 开发模式下，Vite 的 HMR WS 由中间件自动处理；自定义 WS 需确认无端口冲突。

### 9) 包管理器与 Node 版本
- Replit 上优先使用 `npm`（默认可用）。如坚持 `pnpm`，需在初始化脚本中安装并注意首次安装耗时。
- 在配置中固定 Node 主版本（如 18/20 LTS），避免运行时差异。

### 10) 健康检查
- 保留 `/healthz`：返回 200 与 JSON，包含 `appVersion`、`uptimeSec`、`dbStatus`（轻量连通性检查）。
- Replit 的部署/常驻需要此端点进行探活。

### 11) Replit 推荐脚本（package.json 示意）
- `dev`：单进程开发服务（Express 集成 Vite 中间件，监听 `process.env.PORT`，host `0.0.0.0`）。
- `build:client`：`vite build`
- `build:server`：`tsc -p server` 或使用 `tsx` 直接运行 TS（按你的项目结构确定）
- `start:prod`：先构建，再由 Node 启动 Express 静态服务 `dist` + API
- `db:generate`、`db:migrate`、`db:studio`：保留 Drizzle 相关命令

示例（仅文档示意，按项目结构自行实现）：

```json
{
  "scripts": {
    "dev": "node server/dev.js",         
    "build:client": "vite build",
    "build:server": "tsc -p server",
    "build": "npm run build:client && npm run build:server",
    "start:prod": "node server/dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

> 提示：`dev` 中的 `server/dev.js` 负责创建 Express 应用、挂载 Vite 中间件并监听 `process.env.PORT`。生产模式则改为服务 `dist` 静态资源并挂载 API。

### 12) Replit 运行检查清单
- 启动日志包含：`Detected PORT from env`、`listening on 0.0.0.0:<port>`、`trust proxy: enabled`、`CORS origins count: N`。
- `/healthz` 正常返回状态与版本信息。
- 数据库迁移完成且可连接；首条查询成功。
- 上传/静态目录存在且可写（调试模式）。
- 若使用 Cookie：响应头 `Set-Cookie` 含 `Secure; SameSite=None`（在 HTTPS 终端）。

### 13) 资源与依赖体积建议
- 前端组件（如 Radix UI）按需引入；大型图表库建议懒加载。
- 生产构建开启代码分割与压缩（Vite 默认已经良好）。
- 避免引入大型二进制扩展依赖，减少冷启动与安装时间。

### 14) Docker 说明
- Replit 环境不支持 Docker/Compose；本文件前文的 Docker 章节仅适用于本地或其他云环境。

---

以上适配项默认优先于通用本地模式；如在非 Replit 环境（本地或其他云）运行，可继续使用双进程开发（Vite + API 并行）与 Docker 等方案。
