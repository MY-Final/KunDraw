# kunDraw

一个纯前端的 AI 绘图工作台：使用 [tldraw](https://tldraw.dev/) 提供无限画布，并通过用户自己的 NewAPI / OpenAI 兼容接口生成图片。

kunDraw 没有后端、账号或计费系统。浏览器会直接请求你配置的 API 地址，生成结果可下载或添加到画布继续编辑。

## 功能

- 无限画布：平移、缩放、选择、自由绘制、橡皮擦、矩形、椭圆和文本
- 元素属性编辑：位置、尺寸、旋转、透明度、填充、描边和文本样式等
- 文生图与图生图，可添加多张参考图
- 多 NewAPI 渠道管理与连接测试
- 自动读取 `/models`，同时支持手动输入未列出的模型 ID
- 常用宽高比、512P–2048P 基准分辨率以及批量生成
- 生成结果支持添加到画布、下载、重新生成和删除
- 画布操作支持撤销与重做
- 项目名称、渠道配置、提示词草稿和生成设置保存在浏览器本地

> 项目、画布、节点关系和图片都保存在浏览器本地数据库（IndexedDB），刷新或重开浏览器后会自动恢复最近的项目。顶部“导出”入口目前尚未实现。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- shadcn/ui（Base UI）
- tldraw 5
- lucide-react
- sonner

## 本地运行

### 环境要求

- Node.js 20.19+ 或 22.12+
- npm

### 安装与启动

```bash
git clone https://github.com/MY-Final/KunDraw.git
cd KunDraw
npm install
npm run dev
```

打开终端中 Vite 输出的本地地址，通常是 <http://localhost:5173>。

## 配置图片生成渠道

1. 点击右上角的设置按钮。
2. 新增或选择一个渠道。
3. 填写渠道名称、API Base URL 和 API Key。
4. 点击“测试连接”读取模型列表。
5. 保存后，在右侧 **AI 创作** 面板中选择渠道、模式和模型并开始生成。

Base URL 应包含兼容接口的版本路径，例如：

```text
https://your-newapi.example.com/v1
```

kunDraw 使用以下 OpenAI 兼容接口：

| 用途 | 方法与路径 | 请求格式 |
| --- | --- | --- |
| 测试连接、发现模型 | `GET /models` | JSON |
| 文生图 | `POST /images/generations` | JSON |
| 图生图 | `POST /images/edits` | `multipart/form-data` |

图生图只有一张参考图时使用 `image` 字段，多张参考图时使用 `image[]`。图片响应可以返回 `b64_json` 或 `url`。

### 跨域要求

因为请求由浏览器直接发送到渠道，目标服务必须允许当前 kunDraw 地址进行跨域请求（CORS），并允许 `Authorization` 和 `Content-Type` 请求头。若连接测试或生成失败，请先检查浏览器开发者工具中的网络请求和渠道的 CORS 配置。

## 隐私与安全

- API Key 保存在当前浏览器的 IndexedDB 中，与项目数据分开存放。
- API Key 只会随请求发送到你配置的渠道，不会发送到 kunDraw 自有服务。
- 不要在共享或不受信任的设备上保存生产密钥。
- 部署公开实例时，建议使用权限受限、可轮换且设置了额度的密钥。

## 许可（License）

本仓库的代码与它依赖的第三方库适用**不同**的许可：

- 第三方依赖（含画布 SDK tldraw）保持各自的许可，公开本仓库不会改变它们。完整清单与 tldraw 许可原文见 [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md)。
- `tldraw` 与 `@tldraw/editor` 使用 tldraw license：**默认只允许开发环境**。任何面向公众或客户的生产部署（包括 GitHub Pages 之类的公开演示站）都需要 License Key——免费 hobby license（画布保留 "made with tldraw" 水印）、100 天试用，或付费商业许可。
- 使用 tldraw 时不得移除版权与许可声明、不得禁用或干扰 License Key 校验与水印，也不得把 tldraw 的代码置于比其许可更宽松的许可之下。
- 本仓库自身代码目前**未附许可文件**，如需开源请自行补充（例如 MIT）并在其中说明上面的例外。

## 可用命令

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # TypeScript 检查并构建生产版本
npm run lint      # 运行 ESLint
npm run preview   # 本地预览生产构建（http://localhost:4173/KunDraw/）
```

提交改动前请确保以下命令通过：

```bash
npm run build
npm run lint
```

## 生产部署

项目是纯静态前端，构建后可将 `dist/` 部署到任意静态托管服务：

```bash
npm run build
```

部署时请同时确认：

1. NewAPI 渠道允许生产站点域名跨域访问。
2. 站点使用 HTTPS，避免密钥在不安全连接中传输。
3. 已根据实际用途处理 [tldraw 的许可要求](https://tldraw.dev/pricing)。未配置生产许可证前，不应移除 tldraw 的许可水印。

### GitHub Pages

仓库自带 `.github/workflows/deploy-pages.yml`：推送到 `main` 后会自动构建并发布 `dist/`。启用方式是在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，然后推送一次即可。

构建默认使用 `base = /KunDraw/`（项目页地址形如 `https://<user>.github.io/KunDraw/`）；开发服务器仍从根路径 `/` 提供服务。若改用自定义域名或用户主页仓库，把它设为根路径即可：

```bash
KUN_DRAW_BASE_PATH=/ npm run build   # PowerShell: $env:KUN_DRAW_BASE_PATH='/'; npm run build
```

注意：Pages 站点是公开访问的，按 tldraw 的许可定义属于生产环境，需要相应的 License Key；同时渠道需要放行 `https://<user>.github.io` 这个来源。

## 项目结构

```text
src/
├── api/newapi/              # OpenAI 兼容客户端、图片接口与错误映射
├── components/ui/           # shadcn/ui 基础组件
├── components/workspace/    # 顶栏、工具栏、画布、状态栏与属性面板
├── features/ai/             # AI 状态、生成流程、渠道与结果组件
├── features/canvas/         # 自定义节点形状、关系线与节点命令
├── features/persistence/    # IndexedDB 项目 / 画布 / 图片持久化
├── hooks/                   # 编辑器、选区与快捷键 hooks
├── lib/                     # 通用工具（cn、文件名等）
├── App.tsx                  # 工作区布局
└── index.css                # 全局样式与 Tailwind 入口
```

## 说明

- 本项目不提供 NewAPI 服务，也不会代理请求；你需要自行准备兼容渠道。
- 模型能力由渠道决定，kunDraw 不会限制某个模型只能用于文生图或图生图。
- 远程图片下载可能受目标服务器 CORS 限制；无法直接下载时会在新标签页打开图片。
