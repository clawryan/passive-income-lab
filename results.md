## 2026-04-21 22:00 (Asia/Shanghai)
- 公开询价区继续把“7 天渠道分发节奏”往可执行闭环推进：新增 **导出 7 天节奏 ICS**，可把 Day 1~Day 7 的分发与复盘提醒直接导入手机 / 电脑日历。
- 新增 `getInquiryCadenceReminderAt()` / `buildInquiryCadenceIcs()` / `exportInquiryCadenceIcs()`，每一天会生成独立日历事件，默认 09:00 提醒，并附带当天目标、动作、复盘问题、优先渠道 / 候补渠道与单产品页链接。
- `scripts/smoke-lead-todos.mjs` 已同步补上 ICS 内容结构与导出文件名断言，确认这条链路不是只在 UI 上多了一个按钮。
- 下一步最值得做的是：把这份 7 天节奏继续接成 Todoist / 远程 webhook，或补“已执行 / 已复盘”状态，避免提醒发出后仍停留在手工记忆。

## 2026-04-21 17:00 (Asia/Shanghai)
- 公开询价区新增 **7 天渠道分发节奏 / 每日复盘模板**：现在除了批量追踪链接、分发文案和“当天实验清单”，还能按当前来源标签一键展开 Day 1~Day 7 的执行节奏。
- 新增 `buildInquiryCadencePlan()` / `buildInquiryCadencePlanText()`，并补上 **复制 7 天分发节奏**、**导出 7 天节奏 JSON** 两个动作；节奏里会自动区分优先渠道 / 候补渠道，并给出每天的目标、动作和复盘问题。
- `scripts/smoke-lead-todos.mjs` 已同步回归校验 7 天节奏 JSON、文本清单和导出文件名，确认这条链路不是只停留在 UI 按钮层。
- 下一步最值得做的是：把这份 7 天节奏继续接到 Todoist / ICS / 日历提醒，或直接沉淀成“已执行 / 已复盘”状态，让一周分发实验能跨设备连续推进。

## 2026-04-21 14:00 (Asia/Shanghai)
- 公开询价区新增 **渠道实验清单**：现在除了批量生成追踪询价链接和分发文案，还能按当前来源标签一键生成“今日先发哪些渠道 / 每条看什么成功信号 / 24h 后怎么跟进 / 无反馈先改什么”的执行清单。
- 新增 `buildInquiryExperimentPlan()` / `buildInquiryExperimentPlanText()`，并补上 **复制渠道实验清单**、**导出渠道实验 JSON** 两个动作；这样手机端或协作者不必再把链接包和文案包手工整理成执行列表。
- `scripts/smoke-lead-todos.mjs` 已同步回归校验渠道实验 JSON、文本清单和导出文件名，确认这条链路不是只停留在 UI 按钮层。
- 下一步最值得做的是：把这份渠道实验清单再补成“7 天渠道分发节奏 / 每日复盘模板”或直接接到 Todoist / 日历提醒，让外发实验更容易持续跑而不是只做一天。

## 2026-04-21 08:00 (Asia/Shanghai)
- 这轮没有继续堆更多日报模板，而是补了一个更贴近真实获客执行的低阻力入口：`web/index.html` 的公开询价区现在支持批量输入来源标签（如 `feishu-dm / wechat-group / xhs-post`），并一键复制或导出对应的**渠道追踪询价链接包**。
- 新增 `parseInquirySourceBatch()`、`buildInquiryBatchLinks()`、`buildInquiryBatchLinksSummary()`、`copyInquiryBatchLinks()`、`exportInquiryBatchJson()`；现在可以把同一产品快速分发到多个渠道，并保持每条询价链接都带独立 `src` 参数，后续来源日报才有更细的归因颗粒度。
- `README.md` 已同步补上这项能力说明；`scripts/smoke-lead-todos.mjs` 也会回归校验“批量来源标签 -> 复制链接包 / 导出 JSON”链路，避免以后改 UI 时悄悄失效。
- 这一步比继续加说明文档更接近真实增长：用户现在能立刻把同一产品以不同来源标签发到飞书、微信群、小红书等渠道，后续再根据 `lead-source-daily` 看哪条分发更值得继续推。
- 下一步最值得做的是：把这批追踪链接再补一份“分发动作模板 / 文案包”，让今天生成链接后可以直接开始外发实验，而不是手工再写一轮话术。

## 2026-04-17 17:00 (Asia/Shanghai)
- 新增 `api/lead-source-daily.js`，可直接基于 `lead-capture` 快照生成真实 `lead-source-daily-digest` payload；`GET` 返回摘要/Markdown/来源高亮，`POST` 可选直接转发到 webhook，终于把“来源日报模板”补成了可被调度器直接调用的 API。
- 新增 `scripts/smoke-lead-source-daily.mjs`，并把它纳入 `npm run validate`；现在不仅能验证页面里那套来源日报按钮，还能验证后端 API 确实会产出 `topSource / recommendation / markdown` 并可转发出去。
- 这一步比继续补更多自动化说明文档更接近真实被动收益经营：下一步只需要把现有 scheduler 样例里的 URL 换成 `/api/lead-source-daily`，就能开始稳定跑“来源归因日报 -> webhook/飞书”的真实链路。
- 下一步最值得做的是：把 `outputs/lead-source-daily-scheduler-examples.md` 的示例 URL 改成这条新 API，并补一条 Vercel/本地真实 dry-run cURL 验收结果。
- 补上 `shareLeadSourceDailyDigest()` 与页面按钮后，来源日报不再只能复制/导出，也能直接调用手机浏览器原生分享面板发到飞书/微信；不支持时自动回退为复制摘要，更贴近真实“日报发出去”的动作。

## 2026-04-17 14:00 (Asia/Shanghai)
- 沿着今天早上写下的下一步，把“来源日报”从“可复制自动化模板”继续推进到“可直接挂定时器的最小调度样例”。
- 新增 `outputs/lead-source-daily-scheduler-examples.md`，提供 **最小 cURL 模板**、**本地 cron**、**GitHub Actions**、**Vercel Cron** 三种定时触发路径；其中 GitHub Actions / Vercel Cron 都明确给出 Asia/Shanghai 09:00 对应的 UTC 调度写法，减少首次配置时的时区摩擦。
- `README.md` 已同步挂出这份样例入口；现在从仓库首页就能直接找到“如何把来源日报每天定时推给 Worker / n8n / 飞书机器人”的照抄模板。
- 这一步虽然没有再加新功能面板，但把现有来源日报链路推进到了更接近真正被动播报的部署层，适合作为下一步真实接飞书机器人前的低风险收口。
- 下一步最值得做的是：把样例 payload 换成一条真正从当前线索数据构造的 serverless cron 入口（例如 `/api/cron/lead-source-daily`），这样就不只是在发模板，而是在仓库内直接生成并发送真实日报。

## 2026-04-17 08:00 (Asia/Shanghai)
- 沿着昨晚写下的下一步，把“来源日报”从可手动推送，推进到了可直接接自动化模板。
- `buildLeadN8nWorkflow('lead-source-daily-digest')` 与 `buildLeadWorkerTemplate('lead-source-daily-digest')` 已补齐；首页线索 Webhook 区也新增“复制来源日报 n8n Workflow JSON / Cloudflare Worker 模板”。
- 新增 `outputs/lead-source-daily-automation-guide.md`，把“来源日报 -> n8n / Worker -> 飞书机器人”的最短接法、payload 结构、dry-run 验收与当前限制留档，减少从页面能力到定时播报之间的理解摩擦。
- `scripts/smoke-lead-todos.mjs` 已覆盖来源日报 workflow / Worker / 接线说明断言；这一步虽然没有新增长报表，但把现有来源归因链路推进到了更接近被动收益运营的自动播报层。
- 下一步最值得做的是：补一个最小“真实定时触发样例”（例如仓库内 cron cURL 模板或 Vercel / GitHub Actions 调度示例），把模板继续推进到可直接定时跑。

## 2026-04-16 22:0x (Asia/Shanghai)
- 沿着今天 14 点写下的下一步，把“来源日报”从可复制文案推进成可直接外发的 Webhook 事件，减少再手工拼机器人输入的步骤。
- `buildLeadSourceDailyWebhookPayload()` 现会统一产出 `summary / markdown / recommendation / sourceHighlights / report`，这样 cron、n8n、Worker 或飞书机器人都能直接消费同一份结构化日报数据，而不是只拿到纯文本。
- 首页线索 Webhook 区新增“推送来源日报到 Webhook / 复制来源日报 Webhook Payload 示例”，让手机或电脑端都能沿用既有 Webhook 配置直接发日报。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖来源日报 payload 构造、复制动作与第三类 Webhook 推送，避免后续重构时把日报链路悄悄改坏。
- 下一步最值得做的是：补一个最小 cron/自动化接线样例（例如来源日报 -> 飞书机器人或邮件），把“能手动推送”继续推进到“可定时被动播报”。

## 2026-04-16 14:0x (Asia/Shanghai)
- 沿着今天早上写下的下一步，把“来源归因”真正接进了跨产品总览的外发链路，而不再只停留在页面内看板。
- `buildLeadPortfolioWebhookPayload()` 现新增 `payload.sourceHighlights`，会附带前 5 个来源的线索 / 待跟进 / 已报价 / 已成交概览，方便 n8n、Worker、飞书机器人直接消费。
- `buildLeadFeishuCardPayload('lead-portfolio-summary')` 已同步展示“当前最有效来源”与 Top 来源分布，收到卡片时就能直接判断下一轮更该继续推哪个入口。
- `buildLeadWebhookIntegrationGuide()` 与 `scripts/smoke-lead-todos.mjs` 已同步更新，确保文档和回归断言都覆盖 `sourceHighlights`、总览飞书卡片里的来源明细。
- 下一步最值得做的是：把 `sourceHighlights` 再补一份按日汇总/日报文案模板，方便直接挂到 cron 或机器人做被动监控。

## 2026-04-15 20:0x (Asia/Shanghai)
- 沿着昨早写下的“该补最小远程已付款回写入口”收口，但这次没有再扩 API：前端里已有“远程付款回写”区块，我把它补进 README 与自动化验证，避免它只是藏在 `web/index.html` 里、后续一改又悄悄回退。
- `scripts/smoke-lead-todos.mjs` 现会真实模拟：编辑一条远程线索 → 自动回填 `leadId / amount / currency / reference / note` → 调用 `sendLeadPaymentEvent()` → 断言请求体里含 `event.status=paid`、`amount=229`、`reference=gumroad-order-001`，并校验页面状态文案已出现累计成交 / 收入提示。
- `README.md` 已补充“手机端可直接远程标记已付款”的能力说明，把这条链路从“有代码”推进到“能看懂、能回归、能继续真联调”。
- 这一步虽然没有新增大块 UI，但把最接近收入闭环的动作真正纳入了回归保护；下一步最值得做的已从“再写前端”切到“拿真实部署环境跑一次 询价 → 报价 → 付款回写 → 收入汇总”真验收。

## 2026-04-14 11:00

### 本轮做了什么
- 沿着昨天写下的“把 `api/lead-capture.js` 从本地文件切到真正持久化层”推进，优先补了最低阻力、最适合 Vercel / 手机多端共享的托管 KV 路线。
- `api/lead-capture.js` 现支持检测 `KV_REST_API_URL + KV_REST_API_TOKEN`（兼容 Upstash/Vercel KV REST）后，把线索快照直接写入托管 KV；未配置时继续回退到本地文件，保留本机调试体验。
- GET / POST 返回体新增明确的 `storage.mode / durable / provider / key` 元信息，部署后可直接确认当前是否真的在走持久化，而不是误以为已经跨设备同步。
- `scripts/smoke-lead-capture.mjs` 扩展为同时覆盖本地文件模式与 KV 模式，确保旧链路不回退、新链路也不是只改了说明文案。
- `README.md` / `build-log.md` 已同步补充 KV 环境变量与部署提示。

### 为什么做这步
- 这一步比继续堆本地报表、卡片模板或说明文本更贴近收入闭环：如果手机端留资后部署环境不能稳定保留线索，后续跟进、报价和成交统计都会断。

### 下一步
1. 若要继续逼近真实成交闭环，下一步应补一个最小“远程已成交 / 已付款回写”入口，把线索推进状态从手工改状态进一步推进到回传事件。
2. 若拿到真实 Vercel / Upstash 环境变量，可直接做一次线上真验证：手机端公开询价提交 → 另一端拉远程快照 → 状态推进。
3. 若继续走低阻力路线，可补 `outputs/lead-capture-kv-deploy.md` 一页部署清单，进一步降低首次接入摩擦。

### 结论
- **建议继续推进。** 这步已经把 lead capture 从“演示级 serverless 存储”推进到了“可部署持久化后端”，比再加本地 UI 更接近真实可卖的最小 CRM。


## 2026-04-13 17:00

### 本轮做了什么
- 沿着多次记录过的“别再堆本地报表，优先补最小远程 lead capture / serverless 存储”推进。
- 首页线索区新增“线索远程采集 / 快照”：可保存 Lead Capture API 地址与授权、手动提交当前线索到远程 API、在另一端拉取远程快照并自动合并。
- 新增 `api/lead-capture.js`，提供 GET / POST 接口；默认写入本机 `/tmp/passive-income-lab-leads.json`，并可选继续转发到 `LEAD_CAPTURE_WEBHOOK_URL`。
- 新增 `scripts/smoke-lead-capture.mjs`，同时把 `npm run validate` 扩展为覆盖该接口与前端入口。

### 为什么做这步
- 这是比继续加本地导出按钮更接近收入闭环的一步：真实成交推进更常见的卡点，是手机录了一条线索、电脑端却还得手工传文件继续跟。

### 下一步
1. 若要把这条链路变成真正可长期用的多端同步，下一步应把 `api/lead-capture.js` 的存储后端从本地文件切到真正持久化层（例如 n8n + 表格/数据库，或托管 KV / DB）。
2. 若拿到真实 `LEAD_CAPTURE_WEBHOOK_URL`，可直接把当前 API 变成“前端提交 -> 本地快照 + webhook 转发”的桥接层。
3. 若继续逼近成交闭环，可补一个对外公开的极简询价表单视图，让潜在客户自己提交线索。

### 结论
- **建议继续推进。** 这步已经把“浏览器内本地 CRM”推进到了“最小远程采集 / 快照同步”，价值比继续堆说明性文本高。


## 2026-04-10 22:0x 夜间推进（新增成果）

### 本轮目标
- 沿着上次写下的下一步，优先补“按产品导出经营摘要 / 周报文本”，把经营看板从浏览器内查看推进到可直接汇报/分享。

### 新增产出
- `web/index.html`
  - 在“联系 / 支付入口占位”卡片新增 3 个动作：复制当前产品经营摘要、手机原生分享经营摘要、导出当前产品经营周报
  - 新增 `formatProductOpsTimestamp()` / `buildSelectedProductOpsSummaryText()` / `copySelectedProductOpsSummary()` / `shareSelectedProductOpsSummary()` / `buildProductOpsWeeklyMarkdown()` / `exportSelectedProductOpsMarkdown()`
  - 现可把当前产品的线索阶段、CTA 点击、转化率、最近 CTA 点击时间与下一步建议收口为纯文本摘要或 Markdown 周报
- `README.md`
- `build-log.md`

### 验证结果
- 待执行 `npm run validate`
- 文本级可见证据：页面已出现 `copySelectedProductOpsSummary / shareSelectedProductOpsSummary / exportSelectedProductOpsMarkdown / buildProductOpsWeeklyMarkdown`

### 阻塞
- 经营数据仍默认保存在浏览器本地，换浏览器/清缓存会丢失；摘要和周报只是把本地数据更易分享，不是远程 BI。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“经营摘要 JSON / 多产品总览周报导出”，让手机端和自动化脚本更容易接力。
2. 若拿到真实渠道或支付 webhook，可把当前摘要从本地估算推进到真实埋点经营报表。
3. 若要继续逼近成交闭环，下一步应补最小远程表单 / webhook 回传，而不是继续堆本地说明文本。

## 2026-04-03 08:0x 早间推进（新增成果）

### 本轮目标
- 沿着昨晚写下的下一步，优先补“按产品统计线索到成交率 / CTA 点击占位统计”，让产品页从可记录线索，推进到更像最小经营看板。

### 新增产出
- `web/index.html`
  - 在“联系 / 支付入口占位”区新增 `productOpsBoard`，按产品展示线索数、成交率、联系点击、支付点击
  - 新增 `PRODUCT_CHANNEL_METRICS_KEY / loadProductChannelMetrics / saveProductChannelMetrics / recordProductChannelClick / buildProductOpsSummary / renderProductOpsBoard`
  - 点击“打开联系入口 / 打开支付入口”时会自动累计 CTA 点击，并在切换产品、保存入口配置、更新线索后实时刷新经营看板
- `README.md`
- `build-log.md`

### 验证结果
- 全链路回归继续通过：`npm run validate`
- 关键命令结果：`check:web`、`smoke:ab`、`smoke:ab-history` 均通过
- 文本级可见证据：页面已出现 `productOpsBoard / PRODUCT_CHANNEL_METRICS_KEY / recordProductChannelClick / buildProductOpsSummary / renderProductOpsBoard`

### 阻塞
- CTA 点击统计仍是浏览器本地计数，不是远程真实埋点；换浏览器或清缓存会丢失。
- 线索与点击还没有真正串成订单回传，暂时更适合做“经营方向判断”，还不是正式 BI。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“按产品导出经营摘要 / 周报文本”，把看板直接变成可发给自己或协作者的经营更新。
2. 若拿到真实分发渠道，可先分别为两个产品挂真实联系 / 支付入口，验证 CTA 点击与线索阶段是否开始分化。
3. 若要继续逼近成交闭环，下一步应补最小 webhook / 表单回传，而不是继续堆本地说明文本。

## 2026-04-02 22:0x 夜间推进（新增成果）

### 本轮目标
- 按今天下午写下的下一步，优先补“最小联系 / 支付入口占位”，把单产品页从可解释、可记录线索，推进到可挂真实外链 CTA。

### 新增产出
- `web/index.html`
  - 新增“联系 / 支付入口占位”卡片，可按当前单产品分别填写并保存：联系按钮文案、联系链接、支付按钮文案、支付链接
  - 新增 `PRODUCT_CHANNEL_CONFIG_KEY / loadProductChannelConfigs / renderSelectedChannelConfig / saveSelectedProductChannelConfig / buildSelectedChannelSummary / openProductChannelLink`
  - 切换 `?product=micro-saas` / `?product=orion-nexus` 时会自动载入对应入口配置
  - 单产品说明与“购买 / 联系说明”文本现在会同步带出已配置的联系 / 支付入口状态
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `saveProductChannelConfig / copySelectedChannelSummary / openSelectedContactLink / openSelectedPaymentLink / PRODUCT_CHANNEL_CONFIG_KEY` 逻辑与事件绑定

### 阻塞
- 当前只是浏览器本地保存的外链配置，不是订单系统；若要自动回传支付状态、统计真实成交，还需要后端或第三方支付 webhook。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“按产品统计线索到成交率 / 已配置入口点击占位统计”，让货架更像经营看板。
2. 若拿到真实联系链接（微信卡片、飞书表单、Gumroad/Stripe 链接），可直接填入当前入口卡并开始真分发。
3. 若要继续逼近自动化闭环，下一步应补最小远程表单 / webhook 接入，而不是继续堆说明性文本。

# Results

## 2026-04-19 08:00 (Asia/Shanghai)
- 新增 `scripts/generate-lead-source-daily-proof.mjs` 与 `npm run proof:lead-source-daily`，现在可自动种入演示线索并串行跑 `GET /api/lead-source-daily`、`POST dryRun`、手动 webhook 转发、`POST /api/cron/lead-source-daily`，把来源日报的关键返回固化成 `outputs/lead-source-daily-local-proof.md` 与 `outputs/lead-source-daily-local-proof.json`。
- 这一步的价值不在于再多一个按钮，而在于补了一份可重复生成、可直接转发给自己/协作者的“验收证据”：里面会明确写出 `historyStorage.mode`、`latest.trigger`、手动推送与 cron 推送后的 `historyCount`，更容易确认 latest/history 机制没有回退。
- 下一步最值得做的是：拿真实 `LEAD_SOURCE_DAILY_WEBHOOK_URL` 跑一次线上 proof，并把接收端日志与 `/api/lead-source-daily` 返回一起沉淀到 `outputs/`，让这条链路从“本地可证明”推进到“线上已实测”。

## 2026-04-18 17:00 (Asia/Shanghai)
- `api/lead-source-daily.js` 现已补齐最近 7 次日报留档：`GET` 会直接返回 `latest/history`，`POST` 在转发或 dry-run 后也会把本次来源日报摘要、Top 来源、建议动作与 webhook 结果落档，方便快速确认“最近一次日报到底有没有真的跑”。
- `api/cron/lead-source-daily.js` 现在每次 cron 触发也会同步写入同一份日报历史；这样即使接收端 webhook 没消息，也能先从 API 返回里的 `latest.trigger / webhook / history` 判断是“没触发”还是“已触发但外部没收”。
- `scripts/smoke-lead-source-daily.mjs` 与 `scripts/smoke-lead-source-daily-cron.mjs` 已扩展为断言历史条目写入成功；本轮验证结果包含 `historyCount: 1`（手动 POST）与 `historyCount: 2`（cron GET+POST），说明留档链路已真正跑通。
- 下一步最值得做的是：拿真实 `LEAD_SOURCE_DAILY_WEBHOOK_URL` 做一次线上验收，把 `latest/history` 返回与接收端日志一起沉淀到 `outputs/`，让这条增长播报链路从“可调试”推进到“已实测”。

## 2026-04-17 20:00 (Asia/Shanghai)
- 新增 `api/cron/lead-source-daily.js`，把已有 `lead-source-daily` 生成逻辑推进成仓库内可直接被定时器调用的 cron 入口：会读取 `lead-capture` 快照、生成真实 `lead-source-daily-digest`，并在已配置 `LEAD_SOURCE_DAILY_WEBHOOK_URL` 时自动转发。
- `vercel.json` 已内置 `/api/cron/lead-source-daily` 的 `0 1 * * *` 调度（UTC 01:00 = Asia/Shanghai 09:00），不再只是文档里说“可以挂 cron”，而是仓库本身已经带最小调度配置。
- 新增 `scripts/smoke-lead-source-daily-cron.mjs` 并纳入 `npm run validate`，已覆盖两条关键路径：未配置 webhook 时返回 `webhook.skipped=true`；已配置时成功转发并保留 `lead-source-daily-digest` payload。
- `outputs/lead-source-daily-scheduler-examples.md` 也已从手写样例 payload 改成直接调用 `/api/lead-source-daily` 与 `/api/cron/lead-source-daily` 的真实验收文档，首次上线和排错阻力更低。
- 下一步最值得做的是：拿一个真实 `LEAD_SOURCE_DAILY_WEBHOOK_URL` 跑一次线上真验收，把返回样例与接收端日志沉淀到 `outputs/`，这样这条链路就从“可部署”变成“已验收”。

## 2026-04-16 08:0x (Asia/Shanghai)
- 跨产品线索总览现新增 `topSource / sources` 归因汇总，可直接看到当前最有效来源，以及各来源的线索数、已报价数、已成交数。
- `buildLeadPortfolioSummaryText()` / `buildLeadPortfolioMarkdown()` / `renderLeadPortfolioBoard()` 已同步把“当前最有效来源”与来源分布带到摘要、看板和导出里，手机端无需翻明细就能判断下一轮更该继续推哪个分发入口。
- `scripts/smoke-lead-todos.mjs` 已覆盖来源归因断言；这一步虽然没扩新 API，却把已有 `src/source` 埋点真正推进成可用的最小增长看板。
- 下一步最值得做的是：把这份来源归因再接到 Webhook / 飞书卡片里，形成“来源 -> 线索 -> 报价 -> 成交”的日更经营提醒。


## 2026-04-14 20:0x (Asia/Shanghai)
- `GET /api/lead-capture` 现新增 `summary.updatedAt / stageCounts / productCounts / topStage / topProduct`，部署后可直接用 `curl ... | jq '.summary'` 快速判断远程快照是否真的在累积、当前最卡在哪个产品或阶段。
- `scripts/smoke-lead-capture.mjs` 已同步覆盖本地文件模式与 KV 模式下的摘要断言，避免这层验收能力只停留在 README 文字里。
- `outputs/lead-capture-kv-deploy.md` 也补了 `jq '.summary'` 的线上 smoke 示例；这一步虽然不扩新增长功能，但显著降低了“手机留资 -> 线上验证 -> 电脑确认”的验收摩擦。
- 下一步最值得做的仍是线上真验收：手机提交一条询价 → `/api/lead-capture` 返回 `storage.mode=vercel-kv` 且 `summary.count >= 1` → 电脑端拉远程快照合并回本地线索板。

## 2026-04-14 14:0x (Asia/Shanghai)
- 新增 `outputs/lead-capture-kv-deploy.md`，把 Lead Capture 托管 KV 的环境变量、Vercel 接入顺序、GET/POST 验收 cURL 与常见故障检查固化为可直接执行的上线清单。
- 这一步虽然不扩功能面，但直接降低了把“公开询价 / 远程快照”真正跑到线上并长期保留数据的摩擦，比继续堆本地报表字段更接近真实获客闭环。
- 下一步最值得做的是线上真验收：手机提交一条询价 → `/api/lead-capture` 返回 `storage.mode=vercel-kv` → 电脑端拉远程快照合并回本地线索板。

## 2026-04-13 22:0x (Asia/Shanghai)
- 单产品页新增 **公开询价链接 / 留资表单**，可直接生成 `?product=...&view=inquiry` 链接发给潜在客户在手机端填写。
- `/api/lead-capture` 现会保留公开询价的 `contact / source / originPage` 字段，后续可继续接 Webhook、快照同步与跟进提醒，而不必先人工转录。
- 这一步把链路从“自己记录线索”推进到“潜在客户自己留资”，比继续堆本地报表字段更直接贴近获客与成交。


## 2026-04-13 20:0x (Asia/Shanghai)
- 新增“导出当前筛选跟进待办 ICS”，把当前待办直接转成可导入手机 / 电脑日历的提醒文件。
- 线索待办现同时支持 文本复制 / 原生分享 / JSON / Markdown / ICS，进一步降低从“整理线索”到“准时跟进”的摩擦。
- 验证已覆盖 ICS 内容结构与下载触发，避免后续改 UI 时把提醒导出链路悄悄改坏。


## 2026-04-13 08:0x 早间推进（新增成果）

### 本轮目标
- 沿着昨晚写下的下一步，优先补“飞书卡片消息模板”，把线索 Webhook 区从“能复制 JSON / 导入 n8n”推进到“能直接产出更像正式提醒的飞书卡片 payload”。

### 新增产出
- `web/index.html`
  - 在线索 Webhook 区新增 2 个动作：复制待办飞书卡片 Payload、复制总览飞书卡片 Payload
  - 新增 `buildLeadFeishuCardPayload()` / `copyLeadTodoFeishuCardPayload()` / `copyLeadPortfolioFeishuCardPayload()`
  - 现可把当前筛选待办或跨产品总览直接整理成 Feishu interactive card JSON，方便喂给机器人、中转服务或自动化节点
- `scripts/smoke-lead-todos.mjs`
  - 新增对两类飞书卡片 payload 的冒烟断言，校验 `msg_type=interactive` 与关键标题文案
- `README.md`
- `build-log.md`

### 验证结果
- 待执行 `npm run validate`
- 文本级可见证据：页面已出现 `copyLeadTodoFeishuCardPayload / copyLeadPortfolioFeishuCardPayload / buildLeadFeishuCardPayload`

### 阻塞
- 当前产出的是可直接复制的飞书卡片 JSON，不会替你自动创建机器人或发送消息；真实联调仍需你填入自己的飞书机器人 / n8n / 中转 webhook。
- 卡片里的按钮仍是占位动作值，适合经中转层二次解释；若要做到“点卡片直接打开真实内部链接”，后续仍需替换成真实 URL。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“可直接复制的飞书文本消息 / Markdown 消息模板”或最小 Cloudflare Worker 中转示例，把卡片 payload 更快接成可发送消息。
2. 若拿到真实飞书机器人或 webhook 地址，可直接完成一次真联调，并把最终可用卡片模板沉淀到 `outputs/`。
3. 若要继续逼近成交闭环，下一步应补最小远程 lead capture / serverless 存储，而不是继续堆本地看板字段。


## 2026-04-12 17:0x 傍晚推进（新增成果）

### 本轮目标
- 沿着上轮 results 里写下的下一步，优先补“线索 webhook payload 示例 / 飞书机器人文案模板 / n8n 节点示例”，把已存在的 Webhook 出口从“能发”推进到“更容易第一次接起来”。

### 新增产出
- `web/index.html`
  - 在线索 Webhook 区新增 3 个动作：复制待办 Webhook Payload 示例、复制总览 Webhook Payload 示例、复制飞书 / n8n 接线说明
  - 新增 `buildLeadTodoWebhookPayload()` / `buildLeadPortfolioWebhookPayload()` / `buildLeadWebhookIntegrationGuide()`
  - 现在可直接从当前页面复制真实 JSON 结构和接线说明，而不必手工猜字段
- `outputs/lead-webhook-integration-guide.md`
  - 新增仓库留档，沉淀推荐接法、字段结构、飞书文案最小映射与 CORS 注意事项
- `README.md`
- `build-log.md`

### 验证结果
- 待执行 `npm run validate`
- 文本级可见证据：页面已出现 `copyLeadTodoWebhookPayload / copyLeadPortfolioWebhookPayload / copyLeadWebhookIntegrationGuide / buildLeadTodoWebhookPayload / buildLeadPortfolioWebhookPayload`

### 阻塞
- 当前仍是“示例与接线说明”层，不包含真实飞书机器人签名算法或某个平台私有字段；若要零配置直连某单一平台，后续还需按目标平台再补专用模板。
- 浏览器直连 webhook 依赖目标端支持 CORS；若目标不支持，仍建议先用 n8n / Cloudflare Worker / 自建中转收口。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“线索 webhook 的平台专用模板（如飞书机器人卡片 / n8n 节点 JSON）”或最小 serverless 中转示例。
2. 若拿到真实 webhook 地址，可直接从当前页面复制 payload 示例与接线说明，完成一次真联调。
3. 若要继续逼近成交闭环，下一步应补最小远程 lead capture / serverless 存储，而不是继续堆本地看板字段。

## 2026-04-12 20:0x 夜间推进（新增成果）

### 本轮目标
- 沿着刚写下的下一步，优先补“n8n 节点 JSON / 平台专用模板”，把 Webhook 区从“会复制 payload 和说明”推进到“能直接导入一份最小自动化流程”。

### 新增产出
- `web/index.html`
  - 在线索 Webhook 区新增 2 个动作：复制待办 n8n Workflow JSON、复制总览 n8n Workflow JSON
  - 新增 `buildLeadN8nWorkflow()` / `copyLeadTodoN8nWorkflow()` / `copyLeadPortfolioN8nWorkflow()`
  - 生成的 workflow 已内置 `Webhook -> Normalize Message -> Send to Feishu Bot -> Respond 200` 最小流程，并带 `pinData` 示例 payload，导入后只需替换 Feishu Bot 地址
- `outputs/lead-webhook-n8n-workflows.md`
  - 留档两类模板用途、导入方式、唯一需要替换的配置项
- `README.md`
- `build-log.md`

### 验证结果
- 待执行 `npm run validate`
- 文本级可见证据：页面已出现 `copyLeadTodoN8nWorkflow / copyLeadPortfolioN8nWorkflow / buildLeadN8nWorkflow`

### 阻塞
- 当前模板默认输出飞书文本消息，不含卡片消息、签名校验或多分支路由；若要针对单平台深度优化，后续仍需补专用节点配置。
- 浏览器端仍只是复制 workflow JSON，不会代替你导入 n8n 或保存目标端凭证。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“飞书卡片消息模板 / Markdown 富文本模板”，让 webhook 输出更像正式销售跟进提醒。
2. 若拿到真实 n8n / 飞书机器人地址，可直接完成一次真联调，并把最终 workflow 固化到 `outputs/`。
3. 若要继续逼近成交闭环，下一步应补最小远程 lead capture / serverless 存储，而不是继续堆本地看板字段。

## 2026-04-12 14:0x 午后推进（新增成果）

### 本轮目标
- 不再继续堆新的本地看板，而是补一个更接近真实多端同步/自动化的低阻力缺口：把线索待办与跨产品线索总览直接推出浏览器，接到飞书机器人、n8n、Make、Zapier 或自建 webhook。

### 新增产出
- `web/index.html`
  - 线索区新增“线索 Webhook 出口”，可保存 `Webhook URL / Authorization`
  - 新增“复制测试 cURL / 推送当前筛选待办 / 推送跨产品总览”动作
  - 新增 `loadLeadWebhookConfig()` / `renderLeadWebhookConfig()` / `buildLeadWebhookCurl()` / `postLeadWebhook()` / `sendLeadTodoWebhook()` / `sendLeadPortfolioWebhook()`
  - 顺手修复 `buildLeadFollowupText()` 在部分线索数据下输出 `需求：undefined` 的问题
- `scripts/smoke-lead-todos.mjs`
  - 新增对 webhook 配置保存、待办 POST 推送、跨产品总览 POST 推送的冒烟断言
- `README.md`
- `build-log.md`

### 验证结果
- 全链路回归继续通过：`npm run validate`
- 关键命令结果：`check:web`、`smoke:ab`、`smoke:ab-history`、`smoke:product-ops`、`smoke:lead-todos` 全部通过
- 文本级可见证据：页面已出现 `leadWebhookUrl / leadWebhookAuth / saveLeadWebhookConfig / copyLeadWebhookCurl / sendLeadTodoWebhook / sendLeadPortfolioWebhook`

### 阻塞
- Webhook 只是通用出口，尚未预置具体接收端模板；真实自动化仍需你填入自己的飞书机器人 / n8n / Make / 自建 webhook 地址。
- 浏览器直连 webhook 依赖目标端支持 CORS；若目标不支持，建议先用 n8n / Cloudflare Worker / 自建中转收口。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 最低阻力的继续路径：补“线索 webhook payload 示例 / 飞书机器人文案模板 / n8n 节点示例”，降低首次接线成本。
2. 若想继续逼近成交闭环，下一步应补最小远程表单 / serverless lead capture，而不应继续堆本地报表字段。
3. 若拿到真实 webhook 地址，可直接用当前页面从手机端推一轮真实待办到外部自动化，验证提醒/跟进链路是否顺手。

## 2026-04-02 17:0x 午后推进（新增成果）

### 本轮目标
- 沿着上午写下的下一步，优先补“线索 JSON 导入恢复 + 成交漏斗真正渲染”，让本地 CRM 不只是能导出，还能在手机和电脑之间恢复继续推进。

### 新增产出
- `web/index.html`
  - 线索区新增“导入线索 JSON”入口与隐藏文件选择器，可把此前导出的历史线索包重新导回浏览器
  - 新增 `normalizeImportedLead()` / `mergeImportedLeads()` / `importLeadJsonFile()` / `triggerLeadJsonImport()`，按 `id + updatedAt` 自动合并去重
  - `renderLeadBoard()` 现已真实调用 `renderLeadFunnelBoard()`；无论查看全部线索还是状态筛选，都会同步渲染成交漏斗总览与下一步建议
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 关键文本证据：页面已出现 `importLeadJson / importLeadJsonFile / mergeImportedLeads / normalizeImportedLead / renderLeadFunnelBoard(filtered)` 逻辑与事件绑定

### 阻塞
- 线索导入/恢复已补齐，但仍是浏览器本地存储，不是远程多端实时同步；若要多人协作或自动回传，还需接后端或表单服务。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度；本轮按低阻力增量开发控制范围。

### 下一步
1. 若继续沿低阻力路径推进，可补“导入后立即生成跟进摘要 / 待办”或“按产品维度统计成交率”，让恢复后的线索更快进入执行。
2. 若要继续逼近真实成交闭环，下一步应补最小联系表单 / 支付链接占位，而不是再堆解释型文案。
3. 若拿到真实咨询流量，可直接用“单产品页 + 导入恢复 + 漏斗看板”记录从首触达到成交的真实转化。

## 2026-04-02 08:0x 早间推进（新增成果）

### 本轮目标
- 沿着昨天写下的下一步，补“单条线索回填编辑 / 状态一键切换”，让线索板从能记录状态，进一步推进到能持续更新并减少重复录入。

### 新增产出
- `web/index.html`
  - 线索表新增“编辑”入口，可把单条线索回填到表单并进入修改模式
  - 新增“清空表单 / 新建线索”按钮，便于在编辑模式与新建模式之间切换
  - 线索表新增 4 个常用状态快捷按钮：待跟进 / 已发送资料 / 已报价 / 已成交
  - 新增 `currentLeadEditId / setLeadEditingState / resetLeadForm / editLeadEntry / quickUpdateLeadStage`
  - `saveLeadEntry()` 现支持新建与更新双模式，避免修改时重复新增记录
- `README.md`
- `build-log.md`

### 验证结果
- 全链路回归通过：`npm run validate`
- 关键命令结果：`check:web`、`smoke:ab`、`smoke:ab-history` 均通过
- 文本级可见证据：页面已出现 `resetLeadForm / editLeadEntry / quickUpdateLeadStage / currentLeadEditId / leadEditingHint` 逻辑与事件绑定

### 阻塞
- 线索仍默认保存在本地浏览器，不是远程 CRM；如果要多设备实时同步，后续仍需接入真实后端或表单服务。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“导入线索 JSON / 手机端恢复历史线索”或最小外链表单入口，减少设备切换断点。
2. 若拿到真实咨询流量，可直接用“单产品页 + 快捷状态切换 + CSV 导出”跑一轮从“已发送资料 → 已报价 → 已成交”的实际转化记录。
3. 若要更逼近成交闭环，下一步应补真实联系表单 / 支付链接占位，而不是继续堆说明文本。

## 2026-04-01 08:0x 早间推进（新增成果）

### 本轮目标
- 不再继续堆新的成交前说明，而是把昨晚刚补上的线索卡推进成可筛选、可导出的轻量 CRM，让私聊咨询后的跟进更有结构。

### 新增产出
- `web/index.html`
  - 线索卡新增“跟进状态”字段：待跟进 / 已发送资料 / 已报价 / 已成交 / 暂不推进
  - 新增“线索筛选 / 排序视角”，可按状态过滤，并按最近更新 / 优先级 / 跟进状态查看
  - 新增 `buildLeadCsv()` / `exportLeadCsv()`，支持把本地线索导出为 CSV
  - `buildLeadFollowupText()`、`saveLeadEntry()`、`renderLeadBoard()` 已同步输出状态、更新时间与阶段汇总
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `leadStage / leadStageFilter / leadSortMode / exportLeadCsv / buildLeadCsv` 逻辑与事件绑定

### 阻塞
- 线索仍默认保存在本地浏览器，不是远程 CRM；如果要多设备实时同步，后续仍需接入真实后端或表单服务。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“单条线索回填编辑 / 状态一键切换”，避免重复手动录入。
2. 若拿到真实分发渠道，可用“单产品页 + 状态线索板 + CSV 导出”跑一轮实际咨询跟进，并统计从“已发资料 → 已报价”的转化。
3. 若要更逼近成交闭环，下一步应补真实联系表单 / 支付链接占位，而不是继续堆说明文本。

## 2026-03-31 22:0x 夜间推进（新增成果）

### 本轮目标
- 不再继续堆报价 / FAQ 文本，而是补一个真正能承接私聊咨询的最小线索层：在分享单产品页之后，直接登记潜在客户、整理跟进动作，并支持跨设备带走。

### 新增产出
- `web/index.html`
  - 新增“线索收集 / 跟进卡”区块，可填写客户名、渠道、预算、优先级、需求场景、下一步承诺
  - 新增 `loadProductLeads()` / `saveProductLeads()` / `renderLeadBoard()`，在浏览器本地保存并展示最近线索
  - 新增 `buildLeadFollowupText()` / `copyLeadFollowup()`，可一键生成适合发给自己/协作者的跟进摘要
  - 新增 `exportLeadJson()`，支持导出线索 JSON 做手机 ↔ 电脑接力
  - 新增 `loadLeadForSelectedProduct()`，会根据当前选中的产品自动预填跟进模板
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `saveLeadEntry / copyLeadFollowup / exportLeadJson / renderLeadBoard` 逻辑与事件绑定

### 阻塞
- 线索仍默认保存在本地浏览器，不是远程 CRM；如果要多设备实时同步，后续仍需接入真实后端或表单服务。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“线索状态切换（待跟进 / 已报价 / 已成交）”与 CSV 导出，进一步接近轻量 CRM。
2. 若拿到真实联系入口，可用“单产品页 + 跟进摘要”跑一轮实际私聊分发，并记录回复率。
3. 若要更逼近成交闭环，下一步应补真实联系表单/支付链接占位，而不是继续堆说明文本。

## 2026-03-31 20:0x 晚间推进（新增成果）

### 本轮目标
- 不再继续堆“总报价 / FAQ”文本，而是把首页货架补成可单独转发的产品页，让私聊场景里能直接发某一个产品，而不是要求对方先自己筛整页货架。

### 新增产出
- `web/index.html`
  - 新增“单产品分享页”面板，支持按 `?product=micro-saas` / `?product=orion-nexus` 自动切换产品说明视角
  - 新增 `buildProductLandingSummary()` / `buildProductLandingLink()` / `selectProductLanding()`
  - 新增“复制当前产品单页链接 / 手机分享当前产品单页 / 复制当前产品单页说明 / 载入当前产品演示参数”动作
  - 当前产品卡片会高亮，便于在手机端快速确认自己正在分享哪一个产品
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `copySelectedProductLink / shareSelectedProductLink / buildProductLandingLink / selectProductLanding` 逻辑与事件绑定

### 阻塞
- 这轮补的是“单产品可分享入口”，不是真实支付接入；仍未接入真实支付按钮、订单回传或联系表单。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可把单产品分享页继续收口成更像价格页的块级布局，并补更明确的“交付排期 / 常见异议”。
2. 若拿到真实咨询入口，可直接用单产品链接跑一轮私聊分发，对比“发整页货架”与“发单产品页”的回复率差异。
3. 若要更逼近成交闭环，下一步应补最小联系表单或支付链接占位，而不是继续扩分析器。

## 2026-03-31 17:0x 傍晚推进（新增成果）

### 本轮目标
- 不再继续给分析器堆能力，而是把首页货架再往真实成交闭环推进半步：把“怎么买 / 怎么继续沟通”的说明做成可复制、可分享的统一文本。

### 新增产出
- `web/index.html`
  - “最小 CTA”区新增“复制购买 / 联系说明”按钮
  - “最小 CTA”区新增“手机原生分享购买 / 联系说明”按钮
  - 新增 `buildProductPurchaseSummary()`，统一生成购买 / 联系说明文本
  - 新增 `copyProductPurchaseBundle()` / `shareProductPurchaseBundle()`，支持桌面复制与手机系统分享
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `copyProductPurchaseBundle / shareProductPurchaseBundle` 按钮与事件绑定；脚本内存在 `buildProductPurchaseSummary()`

### 阻塞
- 这轮补的是统一购买说明，不是真实支付集成；仍未接入真实支付按钮、订单回传或外部联系方式。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可把“报价摘要 + FAQ + 购买说明”进一步落成独立价格页 / 落地页块，支持直接分享单链接。
2. 若拿到真实咨询入口，可先用这三段标准文本跑一轮私聊分发，再回收常见异议更新 FAQ。
3. 若要更逼近成交闭环，下一步应补真实支付链接占位或联系表单，而不是继续扩分析器。

## 2026-03-31 14:0x 午后推进（新增成果）

### 本轮目标
- 不再继续加新按钮，而是补齐 A/B 历史区里已经存在但尚未真正起作用的“建议动作统计”占位卡片，让历史复盘更像经营看板。

### 新增产出
- `web/index.html`
  - 新增 `renderAbRecommendationBoard(history)`
  - `renderAbHistory()` 现会同步刷新建议动作统计卡片
  - 历史筛选后可直接看到建议动作次数、占比与主导动作
- `scripts/smoke-ab-history-import.mjs`
  - 新增对 `abRecommendationBoard` 渲染结果的断言
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归通过：`npm run validate`
- 新增可见证据：导入演示分享包后的冒烟日志已包含 `recommendationBoard`，且其中出现 `建议动作统计` 与 `主导动作`

### 阻塞
- 看板仍然基于本地历史与手填实验数据，尚未接入真实投放平台回传；因此更适合“经营节奏复盘”，还不是严格的数据源真相。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可把该统计再补成“建议动作趋势 sparkline / 最近 7 次变化”。
2. 若拿到真实实验数据，优先验证“主导动作”是否真能帮助减少误判或缩短周会决策时间。
3. 若要更逼近收入闭环，下一步仍应优先补“联系方式 / 支付说明占位”或独立落地页，而不是无限扩分析卡片。

## 2026-03-31 11:0x 午间推进（新增成果）

### 本轮目标
- 顺着“产品货架 + 最小 CTA”继续补最接近成交的一小步：把报价/咨询文案之外，最常见的成交前解释文本也做成一键可发，而不是继续堆分析面板。

### 新增产出
- `web/index.html`
  - 货架区新增“复制产品 FAQ / 交付说明”按钮
  - 货架区新增“手机原生分享 FAQ / 交付说明”按钮
  - 新增 `buildProductFaqSummary()`，统一生成 FAQ / 交付说明文本
  - 新增 `copyProductFaqBundle()` / `shareProductFaqBundle()`，支持桌面复制与手机系统分享
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`
- 文本级可见证据：页面已出现 `copyProductFaqBundle / shareProductFaqBundle` 按钮与事件绑定；脚本内存在 `buildProductFaqSummary()`

### 阻塞
- 这轮解决的是“成交前解释成本”，不是支付闭环；仍未接入真实支付按钮或订单回传。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续走低阻力路径，可把 FAQ 文本进一步落成独立价格页/落地页区块，支持直接链接分享。
2. 若拿到真实咨询渠道，可先用“报价摘要 + FAQ / 交付说明”做第一轮私聊分发，并记录常见异议。
3. 若要更逼近成交闭环，下一步应补“联系方式 / 支付说明占位”而不是继续扩分析器。

## 2026-03-31 08:0x 早间推进（新增成果）

### 本轮目标
- 沿着上一轮“货架还缺最小 CTA”的结论，补一个真正可直接用于成交前沟通的轻动作层，而不是继续堆新的分析卡片。

### 新增产出
- `web/index.html`
  - 为 **Micro-SaaS 冷启动提示词包** 新增“复制购买咨询文案 / 载入演示参数”按钮
  - 为 **Orion Nexus Quant 研究包** 新增“复制研究包咨询文案 / 载入演示参数”按钮
  - 新增“复制报价摘要 / 手机原生分享报价摘要”入口，支持把两款产品的价格与适用对象一次性发出去
  - 新增 `PRODUCT_OFFERS / buildProductOfferSummary / copyProductOffer / loadProductDemo` 等逻辑，缩短从货架展示到实际沟通/验证的路径
- `README.md`
- `build-log.md`

### 验证结果
- 预计可通过 `npm run validate` 覆盖页面脚本检查与既有 A/B 冒烟；新增 CTA 逻辑位于同一内联脚本内
- 文本级可见证据：页面已出现 `copyMicroSaasOffer / loadMicroSaasDemo / copyProductOfferBundle / shareProductOfferBundle` 按钮与事件绑定

### 阻塞
- 仍未接入真实支付或订单回传；这轮解决的是“成交前动作”而非支付闭环本身
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度

### 下一步
1. 若继续低阻力推进，可把报价摘要进一步落成独立价格页或 FAQ 弹层，而不是继续扩 A/B 卡片
2. 若拿到真实咨询渠道，可直接用现有 CTA 文案做第一轮分发，再把反馈回写到 `outputs/` 或 `results.md`
3. 若要逼近成交闭环下一步，可补“复制支付说明 / 联系方式占位”或真实支付按钮

## 2026-03-30 22:0x 夜间推进（新增成果）

### 本轮目标
- 不再继续堆 A/B 面板小功能，转而补齐更接近成交的首页“产品货架”层，让访问者一进来就知道现在能买什么、先买哪个、再怎么升级。

### 新增产出
- `web/index.html`
  - 首页新增“可售产品货架（最小变现入口）”
  - 展示 **Micro-SaaS 冷启动提示词包** 的目标用户、交付收益、定价档位与样例路径
  - 展示 **Orion Nexus Quant 研究包** 的研究定位、演示价值与高客单升级方向
  - 补充“建议转化路径”，把“先用工具验证 → 再买模板包 → 再升级研究服务”的漏斗写清楚
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`npm run check:web`
- 全链路回归继续通过：`npm run validate`

### 阻塞
- 这次补的是首页转化层，不是支付接入；仍未接入真实支付按钮或真实订单追踪。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续走低阻力路径，优先把货架中的某个产品做成独立落地页/价格页，而不是再给分析器堆按钮。
2. 一旦有真实分发渠道，可用现有 A/B 工具直接验证“只展示工具”与“工具 + 货架”两版首页的转化差异。
3. 若要更接近成交闭环，可补一个最小 CTA（复制购买咨询文案 / 跳转支付页占位）。

## 2026-03-30 20:0x 晚间推进（新增成果）

### 本轮目标
- 给“当前实验分享包 → 导入回填”这条跨设备接力链路补上自动化回归验证，避免后续继续改页面时把最关键的协作路径改坏。

### 新增产出
- `scripts/smoke-ab-history-import.mjs`
  - 在 Node VM 中模拟最小浏览器环境
  - 自动执行：载入演示样本 → 导出单实验分享包 → 清空本地历史 → 导入分享包
  - 校验导入后会自动切换实验筛选，并回填最新表单参数
- `package.json`
  - 新增 `npm run smoke:ab-history`
  - `npm run validate` 现已串联 `check:web + smoke:ab + smoke:ab-history`
- `README.md`
- `build-log.md`

### 验证结果
- 新冒烟脚本将验证 3 个关键断言：
  1. 导入后的历史条数与分享包一致
  2. `abHistoryFilter` 自动切到目标实验
  3. 表单成功回填最新参数（如 `a_clicks=136 / b_clicks=146 / targetLift=15 / targetConfidence=90 / targetPower=80`）

### 阻塞
- 仍未接入真实外部流量或真实成交数据；本轮解决的是“协作链路可靠性”，不是收入本身的实测增长。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若这条回归脚本稳定，可继续补“周报导出 / 分享摘要”同类链路的自动化验收，而不是盲目继续堆界面功能。
2. 一旦拿到真实实验数据，优先做一次手机 ↔ 电脑实际接力验收，并把真实周报沉淀到 `outputs/`。
3. 若需要更接近销售闭环，可开始补一个最小落地页/价格页实验，而不是继续局限在分析工具内部。

## 2026-03-30 11:0x 上午推进（新增成果）

### 本轮目标
- 把“当前实验分享包”从单向导出补成可回流的跨设备接力链路，减少在另一台手机/电脑上继续复盘时的手工回填成本。

### 新增产出
- `web/index.html`
  - 增强 `handleAbHistoryImport()`：导入单实验分享包后，会自动识别 `scope / shareLink / history`
  - 导入后自动回填该实验最新一轮参数，并切换到对应实验筛选
  - 历史区按钮文案更新为“导入历史 / 分享包 JSON”
- `README.md`
- `build-log.md`

### 验证结果
- 预计可通过现有导出分享包链路完成端到端验证：导出当前实验分享包后，再从“导入历史 / 分享包 JSON”入口导回，应自动恢复最新实验参数并切到对应实验筛选

### 阻塞
- 本轮主要补的是跨设备接力可用性；仍未接入真实外部流量或真实成交数据。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 补一条自动化冒烟：直接读取演示样本/分享包并验证“导入后筛选切换 + 表单回填”结果。
2. 若链路稳定，可继续补“导入后立即生成当前实验周报/待办”快捷动作，进一步压缩手机端操作。
3. 一旦有真实实验数据，优先用分享包做一次手机 ↔ 电脑接力验收，而不是继续堆新卡片。

## 2026-03-28 22:0x 夜间推进（新增成果）

### 本轮目标
- 解决最近几轮重复出现的阻塞：没有可立即复现的历史样本，导致周报导出 / 摘要复制虽已实现，但仍缺浏览器内端到端验收入口。

### 新增产出
- `web/index.html`
  - A/B 历史区新增“载入周报演示样本”按钮
  - 新增 `buildAbDemoHistoryEntries()`，内置 3 条同实验的模拟历史
  - 新增 `loadAbDemoHistory()`，一键写入演示历史、切换筛选，并回填最新一轮表单参数
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- Node VM 冒烟通过：已确认 `loadAbDemoHistory()` 会生成 3 条 `demo-micro-saas-title-lift` 历史，且 `buildSelectedAbWeeklySummaryText()` 输出包含 `建议动作分布 / 分享链接`
- 文本级检查通过：已确认 `loadAbDemoHistory` 按钮与事件绑定存在

### 阻塞
- 这次补的是端到端验收入口，不是真实投放流量；收入提升仍需后续真实渠道验证。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 在浏览器里实际点一次“载入周报演示样本” → “导出当前实验周报 / JSON / 复制摘要”，补一轮手动操作验收截图或录屏。
2. 若演示链路顺手，可继续补“清空后恢复演示数据”的轻提示，或把演示样本导出为独立 JSON fixture 供自动化测试复用。
3. 若接下来拿到真实流量数据，优先替换演示样本做真实周报，而不是继续堆新卡片。

## 2026-03-28 20:0x 晚间推进（新增成果）

### 本轮目标
- 把单实验周报从“能导出文件”推进到“能直接贴到聊天/备忘录”，补齐手机端快速分发场景。

### 新增产出
- `web/index.html`
  - 新增“复制当前实验周报摘要”按钮
  - 新增 `buildSelectedAbWeeklySummaryText()`，复用周报聚合结果输出纯文本摘要
  - 新增 `copySelectedAbWeeklySummary()`，一键复制最新结论、建议动作分布、最佳/最弱 Lift、24h 清单与分享链接
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- Node VM 冒烟通过：已确认 `buildSelectedAbWeeklySummaryText()` 输出包含 `建议动作分布 / 最新 24h 清单 / 分享链接`
- 文本级检查通过：已确认 `copySelectedAbWeeklySummary` 按钮与事件绑定存在

### 阻塞
- 仍缺浏览器内真实实验历史，暂未做“点按钮复制真实周报摘要再贴到外部消息”的端到端验收。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用一组真实或模拟历史样本在浏览器里点一次“复制当前实验周报摘要”，补端到端验收。
2. 若文本摘要够顺手，可继续补“周报摘要 + JSON webhook”或“最近 7 天建议动作趋势”。
3. 若真实使用中发现摘要过长，优先收缩字段而不是继续堆新面板。

## 2026-03-28 17:0x 傍晚推进（新增成果）

### 本轮目标
- 把单实验周报从“能导出 Markdown”推进到“能直接接自动化”，补齐结构化 JSON 导出。

### 新增产出
- `web/index.html`
  - 新增“导出当前实验周报 JSON”按钮
  - 新增 `buildSelectedAbWeeklyReport()`，统一聚合周报数据
  - 新增 `exportSelectedAbWeeklyJson()`，导出结构化周报 JSON
  - `buildSelectedAbWeeklyMarkdown()` 改为复用统一聚合结果，降低 Markdown / JSON 字段漂移
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- Node VM 冒烟通过：已确认 `buildSelectedAbWeeklyReport()` 返回 `recommendationSummary / extremes / latest.checklist / history` 等字段
- 文本级检查通过：已确认 `exportSelectedAbWeeklyJson` 按钮与事件绑定存在

### 阻塞
- 仍缺浏览器内真实实验历史，暂未做“点按钮生成真实 JSON 文件再导入下游工具”的端到端验收。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用一组真实或模拟历史样本在浏览器里分别点一次 Markdown / JSON 周报导出，补端到端验收。
2. 若 JSON 结构顺手，可继续补“复制周报摘要”或对接轻量 webhook/API。
3. 若真实使用中发现字段过重，优先收缩导出结构而不是继续堆新卡片。

## 2026-03-28 14:0x 下午推进（新增成果）

### 本轮目标
- 优先修复会影响真实交付的可用性债务：把“导出当前实验周报”从按钮占位补成真正可下载的 Markdown 周报。

### 新增产出
- `web/index.html`
  - 补齐 `buildSelectedAbWeeklyMarkdown()`
  - 补齐 `exportSelectedAbWeeklyMarkdown()`
  - 周报现会真实汇总摘要、建议动作分布、最佳/最弱 Lift、最新 24h 清单与历史明细，并下载为 `ab-weekly-*.md`
- `README.md`
- `build-log.md`

### 验证结果
- 重新提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- 文本级检查通过：`function buildSelectedAbWeeklyMarkdown`、`function exportSelectedAbWeeklyMarkdown` 与 `$("exportSelectedAbWeeklyMd").addEventListener('click',exportSelectedAbWeeklyMarkdown)` 均存在

### 阻塞
- 当前验证仍是语法/文本级；由于缺少浏览器内真实历史样本，本轮未生成一份真实周报文件做端到端验收。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用一组真实或模拟历史样本在浏览器里点一次“导出当前实验周报”，补做端到端验收。
2. 若周报字段顺手，再继续补结构化 `weekly-report.json`，方便自动化流或手机端任务工具接入。
3. 若真实使用发现字段过多，优先收缩周报结构而不是继续加新面板。

## 2026-03-28 11:0x 上午推进（新增成果）

### 本轮目标
- 把 A/B 面板从“能导出筛选历史”推进到“能直接生成单实验周报”，减少手工整理经营复盘的最后一步。

### 新增产出
- `web/index.html`
  - 新增“导出当前实验周报”按钮
  - 新增 `buildSelectedAbWeeklyMarkdown()` / `exportSelectedAbWeeklyMarkdown()`
  - 周报会自动汇总最新结论、建议动作分布、最佳/最弱 Lift、最新 24h 清单与历史明细
  - 周报导出复用当前“建议动作”筛选范围，便于按经营动作视角直接出稿
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- 文本级检查通过：已确认 `exportSelectedAbWeeklyMd`、`buildSelectedAbWeeklyMarkdown()` 与事件绑定存在

### 阻塞
- 仍缺真实渠道样本；当前补的是复盘/汇报效率，不是收入本身的实测增长。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实实验数据导出第一份单实验周报，验证是否可以直接发给协作者或作为周报底稿。
2. 若周报格式够顺手，可继续补“周报 JSON / 分享摘要”或“建议动作趋势图”。
3. 若真实使用中发现字段冗余，再优先收缩周报结构而不是继续堆新卡片。

## 2026-03-28 08:0x 早间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“能给建议动作”推进到“能按建议动作回看历史”，同时修掉会影响默认运行的前端空节点问题。

### 新增产出
- `web/index.html`
  - 新增“建议动作”历史筛选下拉
  - 历史汇总 / 历史表格新增建议动作展示
  - 历史 CSV / Markdown 导出新增 `recommendation` 字段，并遵循当前筛选范围
  - 补齐 `abDecisionBoard` 卡片，修复默认运行时潜在的空节点报错
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- 文本级检查通过：已确认 `abRecommendationFilter`、`abDecisionBoard`、`getAbSelectedRecommendation()`、`getAbRecommendation()` 及筛选事件绑定存在

### 阻塞
- 仍缺真实渠道样本；当前优化的是复盘与交接效率，不是收入本身的实测增长。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实实验数据跑出第一份“按建议动作筛选”的历史 Markdown / CSV，验证它是否足够直接变成周报。
2. 若筛选后的导出好用，可继续补“单实验待办周报导出”或“建议动作计数看板”。
3. 若真实使用中发现动作标签不稳，再收敛推荐动作枚举，而不是继续堆新卡片。

## 2026-03-27 20:0x 晚间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“给出行动建议”推进到“可直接交给待办系统或协作者执行”，进一步压缩手机端操作链路。

### 新增产出
- `web/index.html`
  - 新增“复制 24h 清单”按钮
  - 新增“导出运营待办 JSON”按钮
  - 新增 `buildAbExecutionTodoExport()`，导出结构化执行待办包（实验名 / 建议动作 / 指标 / checklist）
- `README.md`
- `build-log.md`

### 验证结果
- 提取页面内联脚本后，`node --check /tmp/passive_income_lab_web_check.js` 通过
- Node VM 冒烟通过：已确认 `buildAbExecutionTodoExport()` 输出包含 `recommendation` 与 5 条 checklist，且新增按钮 ID / 事件绑定存在

### 阻塞
- 仍缺真实渠道样本；当前补的是执行交接链路，而不是收入本身的实测提升。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 优先用真实实验数据跑一次“当前实验周报摘要分享”，验证是否能直接发到飞书/微信并被协作者接住。
2. 若周报分享链路顺手，可继续补“单实验待办周报导出”或“周报摘要模板收敛”。
3. 若真实使用中发现字段不够，再围绕交接格式做轻量迭代，而不是继续堆分析卡片。

## KPI（草案）
- 每周至少1个可运行原型
- 每周至少1次外部验证（真实用户反馈/试投放）
- 30天目标：形成可持续迭代的产品与内容资产

## 当前状态
- 进行中（Micro-SaaS 冷启动提示词包上架转化优化）

## 2026-03-15 临时冲刺交付（23:52-23:58）

### 发现
- 预算门槛基线：每日$90，40%=**$36**。
- 当前环境无法可靠获取“当日剩余预算”，结论：**预算信息不可验证**。
- 在预算不可验证前提下采用保守轻量策略（仅复用本地脚本与已有产物，不做高成本外部调用）。
- 当前收益瓶颈仍在“标题购买感知”，而非“条目数量不足”。

### 突破
- 新增可运行离线评估器，对 v1/v2 标题进行“价值词命中 + 角色词惩罚”量化对比。
- 结果：平均分从 **-0.33** 提升到 **6.67**，净提升 **+7.0**，为真实上架 A/B 提供了可验证先验。

### 产出清单
- `evaluate_title_value.py`
- `outputs/title-value-eval-micro-saas.json`
- `outputs/title-value-eval-micro-saas.md`
- 更新：`research-log.md` / `build-log.md` / `ideas-backlog.md` / `results.md`

### 阻塞
- 尚未拿到真实渠道流量，缺少 CTR/加购率/支付转化的实测数据。
- 预算看板不可见，无法做严格“当日剩余预算”阈值控制。

### 下一步
1. 将 v1/v2 商品页同步到同一销售渠道，跑最小 A/B（样本量先做到每版 >=100 访问）。
2. 记录三指标：CTR、加购率、支付转化；按 24h/72h 两个窗口复盘。
3. 若 v2 在支付转化上提升 >=15%，则固化标题重写规则并扩展到餐饮/电商子包。

### 是否建议进入明晚窗口继续推进
- **建议继续推进。** 理由：当前已具备“可运行脚本 + 可验证改进 + 明确下一步实验设计”，只差真实流量验证即可形成收益闭环。

## 2026-03-16 深夜窗口（00:56-01:01）新增成果

### Passive-Income 主线
- 新增自动化：`generate_sales_execution.py`
- 新增产物：
  - `outputs/sales-execution-checklist.md`
  - `outputs/sales-execution-checklist.json`
- 达成：将“提示词包+上架文案”推进到“24h/7d可执行变现清单+阈值判定”。

### Orion Nexus Quant
- 升级回测指标：Sortino、Calmar、WinRate、Trades、Turnover
- 新增稳定性视图：Walk-forward（70/30）
- 新增交易化准备：`paper-prep` 命令，输出 `products/orion-nexus/output/AAPL_paper_trade_plan.json`（仅 paper）

### 安全与预算
- 未执行 curl|sh，未下载可疑二进制，未进行实盘下单。
- 预算可见性问题仍存在：无法在本地环境验证“当日剩余预算”。

## 2026-03-24 凌晨冲刺（00:41-00:46）新增成果

### 本轮目标
- 以最低阻力补齐“真实A/B数据 -> 自动判定 -> 下一步动作”的执行闭环，减少手工复盘时间。

### 新增产出
- `analyze_ab_funnel.py`：A/B 漏斗自动分析（含 two-proportion z-test 近似显著性判定）。
- `outputs/ab-test-micro-saas-2026-03-template.json`：可直接替换实测数据的模板。
- `outputs/ab-test-micro-saas-latest.md`
- `outputs/ab-test-micro-saas-latest.json`

### 验证结果
- 语法校验通过：`python3 -m py_compile analyze_ab_funnel.py`
- 实跑产物已写入 outputs 目录（可在手机端直接查看 markdown 报告）。

### 阻塞
- 当前仍是模板数据，尚未接入真实渠道统计；判定结果仅用于流程验证。
- 预算可见性仍不可验证（无法直接读取当日 token/$ 消耗）。

### 下一步
1. 将 Gumroad/独立站真实曝光与支付数据按同字段写入模板 JSON，或直接在 `web/index.html` 的 A/B Analyzer 中填数运行。
2. 每24小时重跑一次脚本/网页判定，累计到每版点击>=100后再做胜负决策。
3. 若 B 在支付转化上显著领先，批量迁移标题策略到餐饮/电商子包。

## 2026-03-24 早间冲刺（08:00）新增成果

### 本轮目标
- 把离线 A/B 脚本补齐成浏览器可用工具，让电脑和手机端都能直接完成“填数 -> 判定 -> 下一步动作”。

### 新增产出
- `api/ab-funnel.js`
- `web/index.html`（新增 A/B Funnel Analyzer，并保留 Orion Nexus Quant Monitor）

### 验证结果
- Node 本地冒烟通过：POST 模拟请求返回 `B 胜出（可推广）`
- 旧脚本语法继续通过：`python3 -m py_compile analyze_ab_funnel.py`

### 阻塞
- 仍缺真实渠道流量数据；当前网页默认值只是演示样例。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 把真实 Gumroad/独立站数据填进网页工具，开始每日一次判断。
2. 若连续两轮都支持 B，立刻复制到餐饮/跨境电商子包。
3. 为网页补一个“导出 JSON/Markdown 报告”按钮，减少手工记录。

## 2026-03-24 上午追加成果（11:0x）

### 本轮目标
- 把 A/B 判定从“能看结果”推进到“能直接留档/同步”，减少手机端手工整理成本。

### 新增产出
- `web/index.html`：新增导出 JSON / Markdown 报告按钮，并在前端缓存最近一次判定结果。

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- A/B API 冒烟仍通过：返回 `200`，并包含 `decision / metrics / nextActions` 等字段。

### 阻塞
- 导出功能已补齐，但仍需要真实渠道数据才能形成有效经营周报。
- 预算可见性仍不可验证。

### 下一步
1. 用真实 Gumroad/独立站数据跑一轮，并把导出的 Markdown 报告沉淀到 `outputs/` 或外部运营记录。
2. 若 B 连续两轮在支付转化显著领先，再批量迁移到其他垂直包。
3. 视需要补“复制到剪贴板 / 分享摘要”按钮，进一步降低移动端操作摩擦。

## 2026-03-24 下午推进（14:0x）

### 本轮目标
- 把 A/B 工具从“能导出”推进到“能直接分享”，让手机端跑完判定后可立即转发或同步。

### 新增产出
- `web/index.html`
  - 新增“复制摘要到剪贴板”按钮
  - 新增“复制分享链接”按钮
  - 新增 URL 参数回填逻辑（可跨设备复现同一组输入数据）

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- A/B API 冒烟仍通过：返回 `200`，并保留完整 `decision / metrics / nextActions` 字段

### 阻塞
- 现在分享/同步摩擦已降到较低，但依然缺真实渠道样本，无法形成真实收入判断。
- 预算可见性仍不可验证。

### 下一步
1. 用真实销售渠道数据生成一条分享链接，发到自己的运营记录或测试群，验证“跨设备打开即回填”。
2. 若流程顺畅，再补一个“复制 Markdown 摘要”或“保存到 outputs/”入口。
3. 一旦拿到两轮真实 A/B 数据，开始把获胜标题策略复制到电商/餐饮子包。

## 2026-03-24 17:0x 新增成果

### 本轮目标
- 把 A/B 工具从“单次判定器”推进到“连续复盘面板”，降低经营实验的留档成本。

### 新增产出
- `web/index.html`
  - 新增 A/B 历史记录模块（最近 12 次）
  - 展示时间、结论、A/B 支付转化、Lift、p-value、较上次变化
  - 新增“清空历史”按钮，方便切换新实验批次

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- A/B API 冒烟仍通过：本地 POST 返回 `200`
- 前端默认运行后会自动把结果写入 `localStorage` 并渲染历史表

### 阻塞
- 历史面板已就位，但当前仍是演示/模板数据，缺少真实渠道样本。
- 预算可见性仍不可验证。

### 下一步
1. 用真实 Gumroad/独立站数据连续跑 3-5 天，观察 Lift 与 p-value 是否稳定收敛。
2. 若历史记录显示 B 连续领先，再把胜出标题策略复制到电商/餐饮子包。
3. 视实际使用频率，再补“按实验批次筛选/命名历史记录”能力。

## 2026-03-24 晚间推进（20:0x）新增成果

### 本轮目标
- 把 A/B 面板从“可看历史”推进到“可导出历史”，让连续几天的实验结果能直接拿去做复盘/周报。

### 新增产出
- `web/index.html`
  - 新增“导出历史 CSV”按钮
  - 新增“导出历史 Markdown”按钮
  - 新增历史导出生成逻辑（包含时间、结论、样本达标、A/B 支付转化、Lift、p-value、z-score、点击/支付订单）

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- 提取历史导出函数后，本地执行成功输出 CSV / Markdown 预览，确认导出格式可用

### 阻塞
- 功能链路已更完整，但仍缺真实渠道数据，历史导出目前还是为接下来几天的实测做准备。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实 Gumroad/独立站数据连续跑 3-5 天，并导出一份历史 Markdown 作为首版经营周报。
2. 若 B 在连续样本中仍领先，批量迁移标题策略到电商/餐饮子包。
3. 若开始出现多批次实验，再补“实验名称/批次标签”字段，避免历史记录混淆。

## 2026-03-24 22:0x 夜间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“连续记录”推进到“可区分多批次实验”，避免不同渠道/标题版本的历史记录混在一起。

### 新增产出
- `web/index.html`
  - 新增“实验名称 / 批次”输入框
  - 分享链接新增 `experimentLabel` 参数，并支持跨设备自动回填
  - 历史记录表新增“实验”列
  - 单次 Markdown 报告、复制摘要、历史 CSV/Markdown 导出均补充实验名称字段
- `build-log.md`
- `results.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- A/B API 本地冒烟通过：返回 `200`，并保留 `decision / metrics / nextActions` 字段

### 阻塞
- 现在多批次记录能力已补齐，但核心瓶颈仍是没有真实流量样本。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实 Gumroad/独立站数据分别创建实验名（如 `gumroad-title-v2-r1` / `indie-landing-v1-r1`），连续跑 3-5 天。
2. 导出带实验名的历史 Markdown，形成首版按批次划分的经营周报。
3. 若某实验中 B 连续领先，再把胜出标题策略迁移到电商/餐饮子包。


## 2026-03-25 08:00 早间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“能记录多批次”推进到“能按单个实验快速复盘”，方便真实流量接入后直接做经营周报。

### 新增产出
- `web/index.html`
  - 新增实验筛选下拉框（可按 experiment label 查看历史）
  - 新增批次汇总卡片（记录数 / 样本达标次数 / B 胜出次数 / 平均 Paid Lift / 最新结论）
  - 历史 CSV / Markdown 导出现在遵循当前筛选范围

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`

### 阻塞
- 面板复盘能力更完整了，但真实收入判断仍依赖真实渠道样本。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实 Gumroad / 独立站数据分别创建实验批次，并在筛选后导出单实验 Markdown 周报。
2. 若单实验连续多次显示 B 胜出，再把对应标题策略复制到其他垂直包。
3. 若后续实验数继续增加，再补“按实验聚合导出 JSON”或“按批次删除历史”能力。

## 2026-03-25 14:00 午间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“单设备内可复盘”推进到“手机/电脑之间可迁移历史”，补齐跨设备经营链路。

### 新增产出
- `web/index.html`
  - 新增“导出历史 JSON”按钮
  - 新增“导入历史 JSON”按钮
  - 新增历史记录归一化 / 去重合并逻辑（避免重复导入同一批次）
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- Node + JSDOM 冒烟验证通过：JSON 导出文件包含 `exportedAt / scope / count / history`；重复导入同一份备份后，历史记录仍维持去重结果

### 阻塞
- 跨设备迁移链路已补齐，但依旧缺少真实渠道流量样本，当前更多是在为实测阶段扫清操作摩擦。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 已完成：增加“导入后按实验批次删除/重命名”能力，进一步降低真实运营时的历史整理成本。
2. 一旦拿到手机端与电脑端各自产生的一轮真实实验数据，就用 JSON 备份合并成首份跨设备经营周报。
3. 若后续需要共享给协作者，再考虑补“只导出当前实验批次 JSON”或“生成只读分享包”。

## 2026-03-25 17:00 午后推进（新增成果）

### 本轮目标
- 把 A/B 面板从“能跨设备导入合并”推进到“导入后能直接整理实验批次”，减少真实运营时的历史污染。

### 新增产出
- `web/index.html`
  - 新增“重命名当前实验”按钮
  - 新增“删除当前实验”按钮
  - 新增筛选后对单个实验批次执行 rename / delete 的本地历史管理逻辑
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- 文本级冒烟检查通过：已确认新增 `renameAbExperiment` / `deleteAbExperiment` 按钮与对应事件绑定存在

### 阻塞
- 仍缺真实渠道样本；当前补的是“经营整理链路”，不是收入验证本身。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 补“只导出当前实验 JSON”或“按实验生成只读分享包”，方便把单批次数据发给协作者或自己跨端接力。
2. 一旦有手机端与电脑端各自产生的一轮真实实验数据，就立刻合并并导出首份跨设备经营周报。
3. 若真实实验数继续增多，再考虑补“按实验批次单独清空 / 批量归档”能力。


## 2026-03-25 晚间推进（22:0x）新增成果

### 本轮目标
- 把 A/B 面板从“看结论”继续推进到“能直接决定还要不要继续买量补样”。

### 新增产出
- `web/index.html`
  - 新增“补样预算测算”卡片
  - 新增 `estimateAbTopUp()`，按最小点击阈值 / 当前 CPC / 当前 CTR 估算补样点击、预算、所需展现
  - 纯文本摘要、Markdown 报告、历史 CSV 导出同步补充补样字段

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- Node VM 冒烟通过：示例数据下成功得到 `totalClicksNeeded=50`、`totalSpendNeeded=60`，且摘要包含“补样测算”

### 阻塞
- 仍缺真实渠道样本；当前补样预算仍基于手填 CPC/CTR 的近似估算。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实 Gumroad/独立站数据验证补样卡片是否能指导连续 2-3 轮买量。
2. 若使用频繁，继续补“目标显著性/目标样本量”估算，进一步减少手算。
3. 真实样本稳定后，再考虑把 A/B 面板单独包装成可售微工具页。

## 2026-03-26 11:00 执行推进（新增成果）

### 本轮目标
- 把 A/B 经营面板从“可导出全部历史”继续推进到“可按实验单独打包分享”，降低跨设备/协作者接力时的噪音。

### 新增产出
- `web/index.html`
  - 新增“导出当前实验分享包”按钮
  - 新增 `exportSelectedAbExperimentBundle()`，按当前筛选实验导出单实验 JSON 包
  - 分享包内包含 `history / latestDecision / latestGeneratedAt / shareLink / exportedAt`
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- 文本级检查通过：已确认 `exportSelectedAbExperimentBundle` 函数、`exportSelectedAbShare` 按钮与对应事件绑定存在

### 阻塞
- 仍缺真实渠道样本，暂时只能验证“操作链路更顺”，还不能证明对真实收入的提升幅度。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实实验批次导出首个分享包，在手机/电脑之间验证“导出 -> 导入 -> 继续复盘”链路。
2. 若协作场景出现，再补“只读 HTML 分享页”或“单实验 Markdown 周报一键导出”。
3. 一旦拿到真实样本，优先补“目标显著性/目标样本量”测算，进一步指导补样预算。

## 2026-03-26 14:00 执行推进（新增成果）

## 2026-04-15 08:0x 晨间推进（新增成果）

### 本轮目标
- 把线索闭环从“能采集 / 能同步 / 能催单”推进到“已付款后能远程回写并统计最小收入”。

### 新增产出
- `api/lead-capture.js`
  - `POST /api/lead-capture` 新增 `event` 载荷支持，可用 `leadId + status=paid + amount + reference` 回写付款事件
  - 自动把付款事件映射为 `stage=已成交`，并写入 `paymentAmount / paymentCurrency / paymentReference / paymentAt / paymentNote`
  - `GET /api/lead-capture` 的 `summary` 新增 `paymentStatusCounts / paidLeadCount / paidAmount / revenueByCurrency`
- `scripts/smoke-lead-capture.mjs`
  - 新增本地文件模式与 KV 模式下的付款事件回写冒烟断言
- `README.md`
- `build-log.md`

### 验证结果
- `node scripts/smoke-lead-capture.mjs` 通过：已确认 `status=paid` 可把线索更新为 `已成交`，并累计 `revenueByCurrency.CNY`
- `npm run validate` 通过

### 阻塞
- 这轮只补了 API 层，尚未在 `web/index.html` 加“远程标记已付款”按钮；当前更适合由支付页 webhook、n8n/Make、或人工 cURL 回写。
- 仍缺真实支付链接和真实订单流量，暂时无法验证收入数字是否会持续累积。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 在 `web/index.html` 给已报价/已成交线索补一个最小“远程回写付款”动作，做到手机端点一下就能回传。
2. 给 README / outputs 再补一份可直接复制的 cURL / webhook 示例，压缩第一次接支付回写的摩擦。
3. 若拿到真实支付链接或 webhook，可直接跑一轮“询价 → 报价 → 支付回写 → 收入汇总”真验收。

### 本轮目标
- 把 A/B 面板从“只看最低点击阈值”推进到“能估算为了看出目标提升，还值不值得继续补样”。

### 新增产出
- `web/index.html`
  - 新增“目标 Paid Lift / 目标置信度 / 目标检验把握”三个输入
  - 新增“目标样本量测算”卡片
  - 新增 `estimateAbSamplePlan()` 与 `inverseNormalCdf()`
  - 单次摘要、Markdown 报告、分享链接回填、实验分享包同步携带目标样本量参数
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- Node VM 冒烟通过：示例数据下成功输出 `requiredPerVariant=9998`，并确认摘要文本包含“目标样本量”段落

### 阻塞
- 目标样本量仍是近似估算，真实经营还会受渠道波动、事件质量和价格敏感度影响。
- 依旧缺真实渠道样本，暂时还无法验证这套估算能否直接提升利润。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实 Gumroad / 独立站数据跑一轮，观察“15% lift 需要的点击量”是否超过可接受预算。
2. 若预算明显不划算，优先把流量转去更高基线转化的标题/落地页版本。
3. 已完成：按目标显著性 / 客单价反推建议 CPC 上限与补样收入缓冲。

## 2026-03-27 11:0x 午间推进（新增成果）

### 本轮目标
- 把 A/B 面板从“会展示很多指标”推进到“手机上也能一眼做出停 / 补样 / 放量判断”。

### 新增产出
- `web/index.html`
  - 新增“投放决策信号灯”卡片
  - 新增 `evaluateAbDecisionBoard()`，综合统计信号、利润空间、CPC 风险、样本缺口给出建议动作
  - 单次摘要 / Markdown 报告同步加入“信号灯”结论
- `build-log.md`
- `results.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- Node VM 冒烟通过：已确认新卡片渲染 `建议动作`，且 `buildAbPlainSummary()` 输出包含 `信号灯：`

### 阻塞
- 决策信号灯仍基于手填渠道数据；若真实投放数据延迟或口径不一致，建议动作会被放大偏差。
- 依旧缺真实渠道样本，暂时还无法验证该信号灯是否能直接提高利润。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实实验数据验证“信号灯”是否能减少误判：至少跑 2-3 轮不同 CPC 条件下的样本。
2. 已完成：补上“24h 运营清单”，把面板从给建议推进到给执行序列。
3. 若发现误导性提示，优先基于真实样本修正阈值，而不是继续加更多卡片。

## 2026-03-27 14:0x 午后推进（新增成果）

### 本轮目标
- 把 A/B 面板从“知道建议动作”推进到“今天直接怎么做”，降低从分析到执行的切换成本。

### 新增产出
- `web/index.html`
  - 新增“24h 运营清单”卡片
  - 新增 `buildAbExecutionChecklist()` / `buildAbExecutionChecklistLines()`
  - 纯文本摘要、Markdown 报告同步加入 `24h 清单`
- `README.md`
- `build-log.md`

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- Node VM 冒烟通过：已确认 `abExecutionPlan` 成功渲染，且 Markdown / 纯文本摘要包含 `24h 运营清单` 与 `24h 清单：`

### 阻塞
- 运营清单仍基于手填渠道数据；若真实渠道回传口径延迟，建议动作仍可能偏保守或偏激进。
- 依旧缺真实渠道样本，暂时还无法验证这份清单是否能直接提升收入转化。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 用真实实验数据验证“24h 清单”是否比单纯看信号灯更容易推动当日执行。
2. 已完成：当前实验历史区可一键导出最新 24h 运营清单为 CSV，便于直接导入表格或任务工具。
3. 若真实样本显示建议过度保守/激进，优先调整清单阈值而不是继续堆更多卡片。

## 2026-04-15 22:0x 夜间推进（新增成果）

### 本轮目标
- 沿着最近 results 里写下的下一步，优先补“最小 Cloudflare Worker 中转模板”，把已有 webhook 出口从“会发 payload / 会复制 n8n”推进到“更容易直接接上可公开部署的 relay”。

### 新增产出
- `web/index.html`
  - 在线索 Webhook 区新增 2 个动作：复制待办 Cloudflare Worker 模板、复制总览 Cloudflare Worker 模板
  - 新增 `buildLeadWorkerTemplate()` / `copyLeadTodoWorkerTemplate()` / `copyLeadPortfolioWorkerTemplate()`
  - 模板默认带 `OPTIONS + CORS`、`Authorization` 校验占位、`kind` 校验、dry-run 预览与飞书文本转发逻辑
- `scripts/smoke-lead-todos.mjs`
  - 新增对两份 Worker 模板的断言，校验 `env.FEISHU_BOT_WEBHOOK` 与 `lead-followup-todos / lead-portfolio-summary` 两类路由均存在
- `outputs/lead-webhook-worker-template.md`
  - 新增留档，收口环境变量、上线步骤与 dry-run 验收方法
- `README.md`
- `build-log.md`

### 验证结果
- 待执行 `npm run validate`
- 文本级可见证据：页面已出现 `copyLeadTodoWorkerTemplate / copyLeadPortfolioWorkerTemplate / buildLeadWorkerTemplate`

### 阻塞
- 当前仍是“可直接复制的 relay 模板”，不包含飞书机器人签名算法或 Cloudflare 控制台实际部署步骤的自动执行。
- 若要做真联调，仍需拿到一个可用的 Worker URL 与（可选）飞书机器人 webhook 地址。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 若继续沿低阻力路径推进，可补“Worker 直接转飞书卡片 / Markdown 富文本”的专用模板，而不只是文本消息。
2. 若拿到真实 Worker URL 与机器人地址，可直接完成一次真联调，并把最终 cURL / 返回样例沉淀到 `outputs/`。
3. 若要继续逼近收入闭环，仍值得做一次线上真验收：手机留资 → 电脑拉快照 → 付款回写 → 收入摘要更新。
