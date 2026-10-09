# RP-Hub 定制网页版

基于 **[STA1N156/RP-Hub](https://github.com/STA1N156/RP-Hub) v1.9.4** 演绎而来的**纯静态**网页版本，
去掉了 Capacitor / Cordova 原生壳依赖，可直接部署到 Cloudflare Pages，用浏览器访问。

- 上游项目：https://github.com/STA1N156/RP-Hub
- 原作者：STA1N156（以及上游贡献者）
- 本仓库是**修改版本（Adapted Material）**，已按 CC BY-NC 4.0 第 3(a)(1)(B) 条标注修改。
- 授权协议：**[CC BY-NC 4.0](LICENSE)**（署名 - 非商业性使用），与上游一致。

> 本版本仅供个人非商业用途使用，请遵守上游许可协议，保留原作者署名。

## 本版本相对上游的定制点

1. **图库 / 相册系统**：图片集中管理、相册分组、批量选择与导出删除。
2. **消息批量删除**：对话中可多选消息一次性删除。
3. **UI 模板重生成**：可基于当前界面重新生成 UI 预览模板。
4. **修复角色切换卡死**：修掉切换角色时界面卡死的问题。
5. **离线化（本次网页版新增）**：所有 JS/CSS 依赖全部本地化，不再走 CDN；补齐
   Service Worker 离线缓存（仅 https 下注册），修复原 `STATIC_ASSETS` 清单指向
   不存在文件导致 SW 安装失败的问题。
6. **浏览器降级（本次网页版新增）**：隐藏 Android 专属的"自定义导出路径"设置项，
   导出统一走浏览器 `<a download>` 下载。下载前请确认 API 提供方已允许浏览器跨域（CORS）。

## 部署到 Cloudflare Pages

本仓库**没有构建步骤**，仓库根目录即网站根目录。

1. 把本目录推到 GitHub / GitLab 仓库（根目录就是本目录，`index.html` 在根）。
2. 登录 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 选择上面的仓库，然后按下面填写：

   | 配置项 | 值 |
   | --- | --- |
   | Framework preset（框架预设） | `None` |
   | Build command（构建命令） | *留空* |
   | Build output directory（构建输出目录） | `/` |

4. **Save and Deploy**。首次部署完成后会得到形如 `https://<项目名>.pages.dev` 的地址，
   在手机上打开即可（建议"添加到主屏幕"当 App 用）。

## 更新流程

1. 修改本目录内的代码。
2. **如果改动了 `sw.js` 里 `STATIC_ASSETS` 列出的任何文件，请把 `sw.js` 顶部的
   `CACHE_NAME` 版本号递增**（例如 `rphub-web-v1` → `rphub-web-v2`），否则老用户会一直
   命中旧缓存。业务脚本因为走 `?v=<时间戳>` 请求，本身不受 SW 缓存影响。
3. `git add -A && git commit -m "..." && git push`。
4. Cloudflare Pages 检测到推送后自动重新构建发布，几十秒后生效。

## 与上游同步（已自动化）

本仓库的提交历史挂在上游之下，血缘正确：

```
* <你的定制提交>
* d312bd4 (tag: 1.9.4, upstream/main) Add files via upload
* ...

```

**上游发新版时不需要重做定制**，已由 GitHub Actions 自动处理：

- `.github/workflows/sync-upstream.yml` 每天 UTC 03:00（北京 11:00）自动检查上游
- 也支持在 Actions 页面手动触发（`workflow_dispatch`）
- 逻辑：
  - 上游没有新提交 / 已是当前历史的一部分 → 直接结束，什么都不做
  - 有更新且**能干净合并** → 更新 `upstream-base.json`，推送 `sync/upstream-<短SHA>` 分支，并**自动开 PR**
  - 有更新但**合并冲突** → 自动开一个 Issue 告警，附上冲突文件清单与人工处理指引
- **收到同步 PR 后请先点开 Cloudflare Pages 为该分支生成的预览网址验证功能**，确认无误再合并；合并后 CF 自动重新部署正式版

应用内「设置 → 最底部 → 上游同步」卡片会显示当前基准版本与上游最新状态（`已是最新` /
`上游有新版本` / `无法检查`）。

### 需要手工处理时

```bash
git fetch upstream
git merge -X ignore-cr-at-eol upstream/main
```

> ⚠️ **`-X ignore-cr-at-eol` 不能省。** 上游发布的文件用的是 CRLF，本仓库是 LF；
> 不加这个参数，git 会认为我们改动了每一行，连**我们根本没碰过**的文件（如
> `assets/js/data-services.js`）都会报冲突。已实测：不加参数 → `CONFLICT`；
> 加上 → 干净合并。
>
> 合并后只有真正被定制过的文件（`assets/js/app.js`、`assets/js/core-utils.js`、
> `assets/js/ui-components.js`、`assets/css/styles.css`、`index.html`）可能冲突，逐块取舍即可 ——
> 每个改动块的含义见 `docs/定制改动施工清单.md`（C1～C11）。

上游远程已在本地配好：
```bash
git remote -v     # upstream -> https://github.com/STA1N156/RP-Hub.git
```

## 使用说明

1. 打开网站（`https://<项目名>.pages.dev`）。
2. 进入**设置**，填写 API URL（形如 `https://api.xxx.com/v1`）与 API Key，选择模型。
3. 进入**角色**，导入角色卡（PNG / JSON），或使用内置角色开始对话。
4. 顶部的**角色卡工坊**（`/character/`）与**小说生成**（`/novel/`）是独立子页面，
   入口在应用内菜单里。

## 注意事项

- **数据存在浏览器本地**（IndexedDB / localStorage），不会上传到任何服务器。
  **清除浏览器数据 / 换设备 / 换域名会丢数据**，请定期用应用内的导出功能备份角色卡与对话记录。
- 本版本是**纯前端直连** LLM API，请求由浏览器直接发出，因此**API 提供方必须允许浏览器跨域
  （CORS）**。若接口报 CORS 错误，请换用支持 CORS 的中转地址，或自行搭建反向代理。
- 离线缓存（Service Worker）**只在 https 下启用**；本地 `file://` 直接打开或 http 调试时不会注册。
- 页面引用的 Google Fonts 属于渐进增强：网络不通时自动回退到系统字体，不影响功能。

## 目录结构

```
web/
├── index.html                # 主应用（单页，Vue 3 全局构建）
├── sw.js                     # Service Worker（离线缓存）
├── _headers                  # Cloudflare Pages 响应头配置
├── LICENSE                   # CC BY-NC 4.0（沿用上游）
├── assets/
│   ├── css/styles.css        # 主应用样式
│   └── js/                   # 业务脚本（IIFE，挂 window.RPHub*）
│       ├── app.js            # 主应用入口（Vue app）
│       ├── core-utils.js     # 通用工具 / 下载 / 存储
│       ├── api-utils.js      # LLM API 调用
│       ├── data-services.js  # 数据服务
│       ├── runtime-services.js
│       ├── ui-components.js  # 自定义 Vue 组件
│       ├── built-in-content.js # 内置角色 / 预设
│       ├── presence.js       # 在线状态
│       ├── update-check.js   # 版本检查
│       └── vendor/           # 第三方库（本地化，共 6 个）
├── libs/                     # 无重复副本的样式与工具库
│   ├── tailwind.css          # 预编译 Tailwind（主应用用）
│   ├── daisyui.min.css       # daisyUI 主题（character 页用）
│   ├── localforage.min.js    # IndexedDB 封装（character 页用）
│   ├── tailwind-character.css
│   └── tailwind-novel.css
├── character/index.html      # 角色卡工坊
└── novel/index.html          # 小说生成
```

技术栈：Vue 3（全局构建，无打包器）+ Tailwind CSS（运行时 JIT）+ daisyUI + jQuery +
marked + DOMPurify + Sortable + localforage。所有依赖以 `<script>` 顺序加载，
模块以 IIFE 形式挂载到 `window.RPHub*`。
