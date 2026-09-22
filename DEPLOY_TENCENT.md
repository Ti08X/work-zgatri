# 腾讯云部署交接

## 目标

- 域名：`work.zgatri.com`
- 运行环境：腾讯云中国大陆 Linux 服务器
- Node.js：22.13 或更高版本
- 进程仅监听 `127.0.0.1:3000`
- Nginx 对外提供 HTTPS，并反向代理到 Node.js
- 安全组只开放 SSH、80 和 443，不对公网开放 3000

## 当前架构

项目目前使用 Vinext、Cloudflare Workers 和 D1：

- `db/index.ts` 从 `cloudflare:workers` 读取 D1 绑定 `DB`
- `.openai/hosting.json` 声明了 D1
- `vite.config.ts` 使用 `@cloudflare/vite-plugin`
- 数据表迁移位于 `drizzle/`

因此当前构建产物不能直接作为普通 Node 服务部署到腾讯云。

## 部署前改造

1. 将 Vinext 构建目标改为 Node standalone，产出可由 Node.js 直接启动的服务。
2. 将 D1 数据库适配替换为服务器本机 SQLite，继续使用现有 Drizzle schema 和 migrations。
3. 数据库文件放在项目目录之外的持久化目录，例如 `/var/lib/work-zgatri/work.db`，通过环境变量配置路径。
4. 增加登录保护和服务端会话校验；所有 `/api/workbench` 读写接口都必须验证登录状态。
5. 增加数据库初始化和迁移命令。
6. 使用 systemd 或 PM2 托管 Node 进程，并设置开机启动与异常重启。
7. 配置 SQLite 每日备份，并保留最近 14 天。

## 上线检查

- `npm run lint` 通过
- `npm run build` 通过
- 待办、推进记录、CSV 销售导入和库存记录均可写入并在重启后保留
- 白天/夜间模式正常
- 未登录无法查看页面或调用写接口
- HTTPS 正常，HTTP 自动跳转 HTTPS
- Nginx 上传大小、代理请求头和超时设置正确
- 数据库及备份目录不在 Web 可访问目录内

