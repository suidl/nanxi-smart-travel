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

## 隐私边界

云端分享前会删除用户自由文本备注和饮食需求，只保存生成后的必要行程结构；服务端返回不可猜测的随机 ID。
