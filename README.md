# 楠溪智游

面向楠溪江家庭自由行游客的动态行程决策智能体。它会根据同行人、预算、天气、偏好和步行强度，依次完成约束理解、天气查询、景点筛选、路线估算、预算核算和可执行性校验；途中情况变化时，只重排尚未完成的行程。

公网体验：[https://naxi-travel-ai.netlify.app](https://naxi-travel-ai.netlify.app)

## 本地运行

环境要求：Node.js >= 22.13.0（见 `package.json` 的 `engines` 字段）。

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发环境（前端 + Netlify Functions）
npx netlify dev
```

打开 http://localhost:8888 （`netlify dev` 会同时启动前端与 Netlify Functions，并自动注入 `.env` 中的 `YONGJIA`、`YONGJIA_BASE_URL`、`AI_MODEL`；不要直接使用 `npm run dev`，该命令只启动前端，`/api/plan` 不可用会静默降级为本地演示解析）。评委演示数据已预填，直接点击“生成行程”即可。

## 固定演示流程

1. 使用默认条件：温州南站、1 名成人、1 名儿童、1 名老人、预算 1200 元、山水与古村、低步行强度。
2. 点击“生成行程”，查看中间的路线与时间轴，以及右侧 6 步 Agent 执行轨迹。
3. 点击“情况有变，重新规划”并选择“触发午后阵雨”。
4. 检查上午节点标注为“已完成 · 保留”，后续户外节点被替换，路线和预算同步更新。
5. 尝试导出 PDF、添加到日历和复制云端分享链接。

## 验证命令

```bash
# 单元测试
npm test

# 类型检查 + 前端构建
npm run build

# 构建 Netlify Functions 到 .netlify/functions
npm run build:functions

# 端到端测试：首次运行前必须先下载 Playwright 浏览器内核
npx playwright install
npm run e2e
```

> 提示：若跳过 `npx playwright install` 直接运行 `npm run e2e`，会报错
> `browserType.launch: Executable doesn't exist ...chrome-headless-shell.exe`。
> 该命令只需在首次安装或 Playwright 升级后执行一次。
> 其中 `tests/e2e/online-deploy.spec.ts` 会访问线上生产站点，需保证公网地址可达。

## 数据与可信说明

- 本版本内置 27 条永嘉公开点位数据，每条记录带来源地址和更新时间。
- 公网版使用 Open-Meteo 实时天气；接口异常时明确回退为“演示天气”。
- 路线距离为坐标估算，导航入口跳转高德地图搜索。
- 价格、开放时间不确定时显示“出发前请复核”。
- 当前版本不提供支付、预订或商家合作能力。

## 当前范围

已完成可公开访问的在线 MVP，包括实时天气代理、脱敏云端分享、AI 约束解析接口及本地规则容错。Netlify AI Features 已启用，线上行程理解由 AI Gateway 调用 DeepSeek 模型 `deepseek-flash`；模型服务异常时才会明确回退为本地规则解析。
