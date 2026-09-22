# 部署与接口说明

## 架构

- 前端：React + Vite，生产目录为 `dist`。
- 行程理解：`POST /api/plan`，通过 OpenAI 兼容的 Chat Completions 接口调用第三方模型；默认模型为 `deepseek-flash`，可用 `AI_MODEL` 覆盖。
- 实时天气：`GET /api/weather`，服务端代理 Open-Meteo，并用 Netlify Blobs 缓存。
- 云端分享：`POST /api/trips` 创建脱敏行程，`GET /api/trips/:id` 读取。
- 容错：模型或天气接口不可用时自动回退到本地规则与演示天气，核心演示仍可完成。

## 本地验证

```bash
npm install
npm test
npm run build
npm run build:functions
npm run e2e
```

## Netlify 发布

使用 Netlify CLI 从本地直接部署（不依赖代码仓库自动构建）：

```bash
npx netlify login
npx netlify link            # 选择已有的 nanxi-smart-travel 站点
npx netlify deploy --prod --build
```

> `--build` 会先执行 `npm run build` 生成 `dist`，并自动用 esbuild 打包 `netlify/functions` 下的 TypeScript 函数。

### 环境变量（必须在部署后、线上 AI 生效前配置）

在 **Netlify 控制台 → 站点配置 → Environment variables** 中手动添加（密钥不要写进命令或仓库）：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `YONGJIA` | 你的模型服务 API Key | 函数优先读取；旧的 `OPENAI_API_KEY` / AI Gateway 变量保留为兜底 |
| `YONGJIA_BASE_URL` | `https://api.deepseek.com` | 独立变量，避免与 AI Gateway 自动注入的 `OPENAI_BASE_URL` 冲突；阿里百炼用 `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `AI_MODEL` | `deepseek-flash` | 阿里百炼可填 `qwen-turbo` / `qwen-plus` / `qwen-max` |

配置环境变量后需重新部署（或在 Deploys 页触发一次 retry deploy）才会对线上函数生效。

## Cloudflare Workers 发布

前端静态资源与 `/api/*` 接口由同一个 Worker 承载（`wrangler.jsonc` + `worker/index.ts`，Vite ≥ 6 + `@cloudflare/vite-plugin`）：

```bash
npm run build          # 产出 dist/client（静态资源）与 dist/nanxi_smart_travel（Worker）
npx wrangler secret put YONGJIA   # API Key 以 secret 注入，只执行一次
npx wrangler deploy
```

- 线上地址：<https://nanxi-smart-travel.suidl.workers.dev>
- KV 绑定：`WEATHER_CACHE`（天气缓存）、`SHARED_TRIPS`（云端分享），ID 已写入 `wrangler.jsonc`；若在其他账号部署需重新执行 `npx wrangler kv namespace create <BINDING>` 并替换 ID。
- 非密钥变量 `YONGJIA_BASE_URL` / `AI_MODEL` 直接写在 `wrangler.jsonc` 的 `vars` 中；本地开发可用 `.dev.vars`（已 gitignore）。
- Netlify 函数保留作兼容：共享逻辑仍在 `netlify/functions/_shared`，`worker/index.ts` 直接复用各 handler 工厂（依赖注入形式），新增接口时两处同步接入。
- CI（Cloudflare 构建）中 Build command 建议设为 `vite build`（`wrangler deploy` 会自动触发构建；`tsc -b` 的类型检查放在本地或独立测试流水线）。
- 本地 `wrangler dev` 若日志获取 `Request.cf` 超时或天气 503，多为网络代理（fake-IP）拦截出站所致，不代表线上失败。

## 隐私边界

云端分享前会删除用户自由文本备注和饮食需求，只保存生成后的必要行程结构；服务端返回不可猜测的随机 ID。
