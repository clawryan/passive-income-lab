# 来源日报自动化接线说明

目标：把 `lead-source-daily-digest` 从“手动点按钮推送”推进到“可定时被动播报”。

## 可直接使用的页面能力

在 `web/index.html` 的线索 Webhook 区，现可直接复制：

- 来源日报摘要
- 来源日报 Webhook Payload 示例
- 来源日报飞书卡片 Payload
- 来源日报 n8n Workflow JSON
- 来源日报 Cloudflare Worker 模板

## 方案 A：n8n -> 飞书机器人

### 适合场景
- 想最快做定时播报
- 已有 n8n
- 需要后续继续分流到邮件 / 表格 / 数据库

### 最短路径
1. 在页面点击 **复制来源日报 n8n Workflow JSON**
2. 导入到 n8n
3. 把 `Send to Feishu Bot` 节点里的 webhook 地址替换成你自己的飞书机器人地址
4. 在前面加一个 `Schedule Trigger`（例如每天 09:00）
5. 用 HTTP Request 或你自己的数据源，把 `lead-source-daily-digest` payload POST 到该 workflow 的 Webhook 节点

### 关键路由
- `kind` 必须是：`lead-source-daily-digest`
- 推荐直接发：`payload.summary`
- 若想发长文：改用 `payload.markdown`
- 若想做卡片：可改为消费 `sourceHighlights / recommendation / report`

## 方案 B：Cloudflare Worker -> 飞书机器人

### 适合场景
- 需要一个轻量、长期在线的中转层
- 浏览器直连机器人会遇到 CORS
- 想先做 dry-run 再接真实机器人

### 最短路径
1. 在页面点击 **复制来源日报 Cloudflare Worker 模板**
2. 新建 Worker，粘贴模板
3. 配置环境变量：
   - `RELAY_TOKEN`：可选，用于校验 Authorization
   - `FEISHU_BOT_WEBHOOK`：飞书机器人 webhook
4. 部署后，把 Worker URL 填回页面的 Lead Webhook URL
5. 页面端推送 `lead-source-daily-digest`，或由 cron / n8n 定时 POST 到 Worker

### dry-run 验收
若只配置 `RELAY_TOKEN`，未配置 `FEISHU_BOT_WEBHOOK`，Worker 会返回：
- `ok: true`
- `dryRun: true`
- `preview`

这样可以先确认结构没问题，再接真实机器人。

## 推荐 payload 最小结构

```json
{
  "source": "passive-income-lab",
  "kind": "lead-source-daily-digest",
  "generatedAt": "2026-04-17T00:00:00.000Z",
  "payload": {
    "summary": "Passive Income Lab 来源日报...",
    "markdown": "# Passive Income Lab 来源日报 ...",
    "recommendation": "优先继续加推 ...",
    "sourceHighlights": [],
    "report": {}
  }
}
```

## 推荐 cron 思路

### 若已有上游快照/自动化
每天固定时间 POST 一次到：
- n8n Webhook
- Cloudflare Worker
- 或页面配置过的既有 Lead Webhook

### 若暂时没有真正后端调度
先保留页面内手动触发作为 fallback：
- 电脑端点“推送来源日报到 Webhook”
- 手机端点“复制来源日报摘要 / 飞书卡片 Payload”

## 验收清单

- 能看到 `kind=lead-source-daily-digest`
- `payload.summary` 含“Passive Income Lab 来源日报”
- `payload.sourceHighlights` 至少有 1 个来源时，消息里能看到 Top 来源
- 飞书收到消息后，能直接判断：
  - 当前最有效来源
  - 当前最热产品
  - 今天建议继续推哪个渠道

## 当前限制

- 仍依赖已有线索数据；若当天没有来源数据，只会输出空白日报模板
- 页面本身不负责创建外部 cron；当前提供的是可直接接入的自动化模板
- 若要做到真正“每天自动发”，仍需你在 n8n / Worker / 外部 cron 里补定时触发
