# 楠溪智游首版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可在浏览器完整演示“创建需求—工具规划—生成行程—阵雨后动态重排—导出结果”的楠溪智游首版。

**Architecture:** React 单页应用负责创建行程和驾驶舱交互，领域层使用纯 TypeScript 工具完成景点筛选、路线估算、预算和规则校验，编排层统一记录工具轨迹并支持局部重排。Netlify Functions 代理天气与模型调用，正式部署使用 Netlify Blobs 保存分享行程；本地开发提供明确标记的演示适配器。

**Tech Stack:** React 18、TypeScript 5、Vite 5、Vitest、Testing Library、Playwright、Netlify Functions、Netlify Blobs、jsPDF。

**Spec:** `docs/superpowers/specs/2026-09-12-nanxi-smart-travel-design.md`

## Global Constraints

- 默认使用中文界面，桌面优先并适配 390px 手机宽度。
- 首版只覆盖一日和两日自由行，不实现真实支付或预订。
- 实时数据失败时必须显示缓存时间或“非实时”，不得伪造结果。
- 路程结果统一标记为估算，并提供外部地图导航入口。
- 页面只展示任务摘要和工具结果，不展示模型隐藏推理过程。
- 所有演示情境必须标注“演示情境”。
- 不执行 git add、commit、push 或创建分支。

---

## File Map

- `package.json`：脚本与依赖。
- `vite.config.ts`、`vitest.config.ts`、`tsconfig*.json`：构建和测试配置。
- `src/domain/types.ts`：跨模块领域类型。
- `src/domain/constraints.ts`：输入标准化与缺失项判断。
- `src/data/pois.ts`：带来源和更新时间的永嘉公开点位数据。
- `src/tools/*.ts`：景点、天气、路线、预算、开放时间、适老和校验工具。
- `src/agent/planner.ts`：首轮行程编排。
- `src/agent/replanner.ts`：保留已完成节点的局部重排。
- `src/demo/demo-adapters.ts`：明确标记的稳定演示数据适配器。
- `src/components/*.tsx`：创建行程、执行轨迹、驾驶舱和重排对比。
- `src/services/export.ts`：PDF 与 ICS 导出。
- `src/services/storage.ts`：本地与远程行程存储接口。
- `netlify/functions/*.ts`：天气、模型规划和分享行程接口。
- `tests/unit/*.test.ts`、`tests/components/*.test.tsx`：领域与组件测试。
- `e2e/core-flow.spec.ts`：评委固定场景端到端验证。

---

### Task 1: 工程基础与领域契约

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/domain/types.ts`
- Create: `src/domain/constraints.ts`
- Test: `tests/unit/constraints.test.ts`

**Interfaces:**
- Produces: `TripRequest`, `NormalizedTripRequest`, `Poi`, `WeatherSnapshot`, `ToolTrace`, `ItineraryStop`, `PlanResult`, `ReplanEvent`。
- Produces: `normalizeTripRequest(input: TripRequest): NormalizedTripRequest`。
- Produces: `findMissingConstraints(input: TripRequest): string[]`。

- [ ] **Step 1: 创建工程配置与测试脚本**

`package.json` 使用以下脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 2: 先写约束标准化失败测试**

```ts
it('normalizes the fixed judge scenario', () => {
  expect(normalizeTripRequest({
    start: '温州南站', days: 1, adults: 2, children: 1,
    seniors: 1, budget: 1200, preferences: ['山水', '古村'],
    walkingLevel: 'low'
  })).toMatchObject({ budget: 1200, partySize: 4, walkingLevel: 'low' })
})
```

- [ ] **Step 3: 运行测试确认因缺少实现而失败**

Run: `npm test -- tests/unit/constraints.test.ts`

Expected: FAIL，提示 `normalizeTripRequest` 不存在。

- [ ] **Step 4: 实现最小领域类型和标准化函数**

关键枚举固定为：`WalkingLevel = 'low' | 'medium' | 'high'`，`WeatherSuitability = 'outdoor' | 'indoor' | 'all-weather'`，`ReplanEvent['type'] = 'rain' | 'closure' | 'traffic' | 'fatigue' | 'budget'`。

- [ ] **Step 5: 运行单元测试和类型检查**

Run: `npm test -- tests/unit/constraints.test.ts`

Run: `npm run build`

Expected: PASS，空应用成功构建。

---

### Task 2: 永嘉点位数据与可解释工具

**Files:**
- Create: `src/data/pois.ts`
- Create: `src/tools/poi-search.ts`
- Create: `src/tools/route-estimate.ts`
- Create: `src/tools/budget-calculator.ts`
- Create: `src/tools/rules.ts`
- Create: `src/tools/itinerary-validator.ts`
- Test: `tests/unit/tools.test.ts`

**Interfaces:**
- Consumes: `Poi`, `NormalizedTripRequest`, `ItineraryStop`, `PlanResult`。
- Produces: `searchPois(request, pois): Poi[]`。
- Produces: `estimateRoute(start, pois): RouteEstimate`。
- Produces: `calculateBudget(request, stops): BudgetBreakdown`。
- Produces: `validateItinerary(request, stops, weather): ValidationIssue[]`。

- [ ] **Step 1: 写景点筛选、预算和规则校验失败测试**

测试必须验证：低步行强度排除高强度点位；雨天优先室内或全天候点位；预计总额不超过 1200 元；闭馆点位产生 `OPENING_HOURS_CONFLICT`。

- [ ] **Step 2: 运行工具测试确认失败**

Run: `npm test -- tests/unit/tools.test.ts`

Expected: FAIL，提示工具模块不存在。

- [ ] **Step 3: 建立不少于 25 条的带来源数据集**

首批实体固定包含：温州南站、永嘉站、石桅岩、龙湾潭、崖下库、十二峰、陶公洞、狮子岩、丽水古街、芙蓉古村、苍坡古村、林坑古村、埭头古村、大若岩、永嘉书院、百丈瀑、茗岙梯田、四海山、红十三军军部旧址、太平岩、岩头镇、永嘉麦饼、楠溪素面、沙岗粉干、永嘉田鱼、乌牛早茶。

每条记录都填写 `sourceUrl`、`sourceUpdatedAt`、坐标、费用区间、推荐时长、步行强度、天气适配和适老人群；无法从公开来源确认的费用或开放时间使用 `null`，界面显示“出发前请复核”。

- [ ] **Step 4: 实现纯函数工具**

路线采用最近邻排序和道路修正系数生成估算值；预算按交通、门票、餐饮和 10% 预留金分别计算；规则校验返回机器可读的错误码与中文说明。

- [ ] **Step 5: 运行工具测试**

Run: `npm test -- tests/unit/tools.test.ts`

Expected: PASS。

---

### Task 3: 天气适配器、行程编排与动态重排

**Files:**
- Create: `src/tools/weather.ts`
- Create: `src/agent/planner.ts`
- Create: `src/agent/replanner.ts`
- Create: `src/demo/demo-adapters.ts`
- Test: `tests/unit/planner.test.ts`
- Test: `tests/unit/replanner.test.ts`

**Interfaces:**
- Produces: `WeatherProvider.getForecast(date, latitude, longitude): Promise<WeatherSnapshot>`。
- Produces: `planTrip(request, dependencies): Promise<PlanResult>`。
- Produces: `replanTrip(plan, event, dependencies): Promise<PlanResult>`。
- `PlanResult.traces` 依次包含 `constraints`、`weather`、`poi_search`、`route`、`budget`、`validation`。

- [ ] **Step 1: 写固定评委场景规划失败测试**

断言输出存在 3–5 个节点、总预算不超过 1200 元、每个节点有来源，且工具轨迹顺序完整。

- [ ] **Step 2: 写阵雨重排失败测试**

```ts
expect(replanned.stops.filter(stop => stop.completed))
  .toEqual(original.stops.filter(stop => stop.completed))
expect(replanned.changeSummary.reason).toContain('阵雨')
expect(replanned.validationIssues).toHaveLength(0)
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- tests/unit/planner.test.ts tests/unit/replanner.test.ts`

Expected: FAIL，提示 `planTrip` 和 `replanTrip` 不存在。

- [ ] **Step 4: 实现编排器与演示适配器**

演示适配器固定返回“23–29℃、午后阵雨概率 35%”并设置 `source: 'demo'`；真实适配器必须设置 `source: 'live' | 'cache'` 和 `fetchedAt`。重排只处理当前时间之后的节点。

- [ ] **Step 5: 运行规划测试**

Run: `npm test -- tests/unit/planner.test.ts tests/unit/replanner.test.ts`

Expected: PASS。

---

### Task 4: 创建行程页与执行过程

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/TripBuilder.tsx`
- Create: `src/components/PlanningTrace.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Modify: `src/App.tsx`
- Test: `tests/components/trip-builder.test.tsx`

**Interfaces:**
- Consumes: `TripRequest`, `ToolTrace`, `planTrip`。
- Produces: `TripBuilder.onSubmit(request: TripRequest)`。
- Produces: `PlanningTrace({ traces, status })`。

- [ ] **Step 1: 写固定需求提交失败测试**

测试填写温州南站、1 天、2 名成人、1 名儿童、1 名老人、预算 1200 元、低步行强度，点击“生成行程”后触发规范化请求。

- [ ] **Step 2: 运行组件测试确认失败**

Run: `npm test -- tests/components/trip-builder.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现应用外壳、输入页和执行轨迹**

执行轨迹每一步显示名称、输入摘要、耗时、状态和结果摘要；错误步骤显示可恢复操作。视觉使用山水绿色、暖金提示色和中文无衬线字体。

- [ ] **Step 4: 运行组件测试与构建**

Run: `npm test -- tests/components/trip-builder.test.tsx`

Run: `npm run build`

Expected: PASS。

---

### Task 5: A 版行程驾驶舱与重排对比

**Files:**
- Create: `src/components/JourneyCockpit.tsx`
- Create: `src/components/RouteMap.tsx`
- Create: `src/components/ItineraryTimeline.tsx`
- Create: `src/components/ReplanPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/components/cockpit.test.tsx`

**Interfaces:**
- Consumes: `PlanResult`, `ReplanEvent`, `replanTrip`。
- Produces: `JourneyCockpit({ plan, onReplan })`。
- Produces: `ReplanPanel` 的五种事件操作和新旧差异视图。

- [ ] **Step 1: 写驾驶舱渲染与重排失败测试**

断言地图示意、时间轴、预算、工具轨迹同时存在；点击“午后阵雨”后显示“演示情境”、替换原因和预算差异。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/components/cockpit.test.tsx`

Expected: FAIL，驾驶舱组件不存在。

- [ ] **Step 3: 实现 A 布局和响应式降级**

桌面使用左导航、中间地图时间轴、右工具轨迹；手机宽度改为顶部导航，工具轨迹折叠但保留入口。地图使用本地坐标绘制的路线示意，不请求未授权地图瓦片。

- [ ] **Step 4: 实现动态重排对比**

新旧节点分别标记“保留”“替换”“新增”，并显示时间与预算变化；演示事件不得修改原始计划对象。

- [ ] **Step 5: 运行组件测试和全部单元测试**

Run: `npm test`

Expected: PASS。

---

### Task 6: 保存、分享、PDF 与日历导出

**Files:**
- Create: `src/services/storage.ts`
- Create: `src/services/export.ts`
- Create: `src/components/TripActions.tsx`
- Test: `tests/unit/export.test.ts`
- Test: `tests/components/trip-actions.test.tsx`

**Interfaces:**
- Produces: `TripRepository.save(plan): Promise<string>`。
- Produces: `buildIcs(plan): string`。
- Produces: `exportPdf(plan): Promise<Blob>`。
- Produces: `buildSharePayload(plan): ShareableTrip`，移除姓名、电话和自由文本中的敏感字段。

- [ ] **Step 1: 写 ICS 与分享脱敏失败测试**

断言 ICS 包含 `BEGIN:VCALENDAR`、全部行程节点和 Asia/Shanghai 时区；分享数据不包含 `phone`、`name`、`notes`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/unit/export.test.ts tests/components/trip-actions.test.tsx`

Expected: FAIL，导出服务不存在。

- [ ] **Step 3: 实现本地存储和导出操作**

首版本地使用 `localStorage` 适配器；PDF 首页包含项目名、日期、天气来源、总预算和风险提示，后续按时间顺序列出节点与导航入口。

- [ ] **Step 4: 运行导出与组件测试**

Run: `npm test -- tests/unit/export.test.ts tests/components/trip-actions.test.tsx`

Expected: PASS。

---

### Task 7: Netlify Functions 与真实外部能力

**Files:**
- Create: `netlify.toml`
- Create: `netlify/functions/weather.ts`
- Create: `netlify/functions/plan.ts`
- Create: `netlify/functions/trips.ts`
- Create: `src/services/api.ts`
- Create: `.env.example`
- Test: `tests/unit/api.test.ts`

**Interfaces:**
- `GET /.netlify/functions/weather?lat=&lon=&date=` 返回 `WeatherSnapshot`。
- `POST /.netlify/functions/plan` 接收 `TripRequest`，返回结构化约束或明确错误。
- `POST /.netlify/functions/trips` 保存脱敏 `ShareableTrip` 并返回只读 id。
- 模型环境变量：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

- [ ] **Step 1: 写 API 适配器失败测试**

测试 200、超时、无效 JSON、天气缓存回退和未配置模型密钥五种情况。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/unit/api.test.ts`

Expected: FAIL，API 适配器不存在。

- [ ] **Step 3: 实现天气代理与模型适配层**

天气响应必须包含来源和抓取时间；模型未配置时返回 `MODEL_NOT_CONFIGURED`，前端仅在用户主动开启演示模式后使用演示适配器。

- [ ] **Step 4: 实现 Netlify Blobs 分享存储**

只保存脱敏后的行程数据，分享接口不接受任意用户 HTML，读取接口返回 JSON。

- [ ] **Step 5: 运行 API 测试和生产构建**

Run: `npm test -- tests/unit/api.test.ts`

Run: `npm run build`

Expected: PASS。

---

### Task 8: 端到端验证与首版交付

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/core-flow.spec.ts`
- Create: `README.md`
- Create: `docs/deployment.md`
- Create: `docs/demo-checklist.md`

**Interfaces:**
- Consumes: 完整应用和评委固定场景。
- Produces: 可重复运行的端到端用例、部署说明和演示检查清单。

- [ ] **Step 1: 写核心端到端用例**

用例完成：打开首页、填入固定需求、生成行程、检查六段工具轨迹、触发午后阵雨、确认节点替换、下载 ICS、打开 PDF 导出操作。

- [ ] **Step 2: 运行端到端测试并记录实际失败**

Run: `npm run e2e`

Expected: 首次运行暴露尚未满足的可访问名称或交互问题。

- [ ] **Step 3: 只修复端到端暴露的问题**

修复选择器、可访问名称、下载事件或窄屏布局，不扩大产品范围。

- [ ] **Step 4: 执行最终自动验证**

Run: `npm test`

Run: `npm run build`

Run: `npm run e2e`

Expected: 全部 PASS，构建无 TypeScript 错误。

- [ ] **Step 5: 真实页面检查**

在桌面宽度和 390px 手机宽度实际完成固定场景，检查文本截断、布局重叠、工具轨迹、重排差异和下载结果；在 `docs/demo-checklist.md` 逐项记录结果。

---

## 后续独立计划

软件首版通过真实页面验证后，再单独制定参赛材料计划，使用首版真实截图和录屏生成 Logo、报名文案、16:9 PPT、五分钟演示视频、字幕、答辩稿与最终提交清单。这样可避免宣传材料与实际系统不一致。

