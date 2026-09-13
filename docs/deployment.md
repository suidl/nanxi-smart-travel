# 部署与接口说明

## 架构

- 前端：React + Vite，生产目录为 `dist`。
- 行程理解：`POST /api/plan`，由 Netlify AI Gateway 调用 OpenAI；默认模型为 `gpt-5.4-mini`，可用 `AI_MODEL` 覆盖。
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

```bash
npx netlify login
npx netlify status
npx netlify init
npx netlify deploy --prod
```

首次生产部署后，Netlify AI Gateway 会自动注入 OpenAI 兼容的网关地址和密钥。若团队关闭了 AI Features，需要由 Team Owner 在 **Team settings → AI enablement** 中开启；若需显式指定模型，在站点环境变量中设置 `AI_MODEL`。

## 隐私边界

云端分享前会删除用户自由文本备注和饮食需求，只保存生成后的必要行程结构；服务端返回不可猜测的随机 ID。
