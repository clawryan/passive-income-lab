# 来源日报定时触发样例

目标：把 `lead-source-daily-digest` 从“已能生成 payload / workflow / Worker 模板”，再推进到“仓库内可直接照抄挂到定时器”。

适用入口：
- `api/lead-source-daily`：手动 GET 查看真实日报 JSON，POST 触发转发
- `api/cron/lead-source-daily`：给定时器直接调用的最小 cron 入口
- 本文件：给出 **本地 cron / GitHub Actions / Vercel Cron** 三种最小定时样例

---

## 0. 先准备环境变量

如果要真正把日报推送出去，至少准备：

```bash
LEAD_SOURCE_DAILY_WEBHOOK_URL=https://example.com/webhook/lead-source-daily-digest
LEAD_SOURCE_DAILY_WEBHOOK_AUTH=Bearer replace-me
```

若未配置 `LEAD_SOURCE_DAILY_WEBHOOK_URL`：
- `GET /api/cron/lead-source-daily` 仍会返回真实日报 JSON
- 但 `webhook.forwarded=false`，不会外发

---

## 1. 手动 dry-run / 真调用验收

### 1.1 先看真实日报 JSON

本地开发：

```bash
curl -sS "http://127.0.0.1:3000/api/lead-source-daily" | jq '{kind, topSource: .payload.report.topSource, recommendation: .payload.recommendation}'
```

Vercel 线上：

```bash
curl -sS "https://your-project.vercel.app/api/lead-source-daily" | jq '{kind, topSource: .payload.report.topSource, recommendation: .payload.recommendation}'
```

### 1.2 手动触发 cron 入口（无副作用预检）

如果还没配 webhook，先用 cron 入口确认它能生成真实 payload：

```bash
curl -sS "https://your-project.vercel.app/api/cron/lead-source-daily" | jq '{ok, triggeredBy, kind, webhook, totalLeads: .payload.report.totalLeads}'
```

预期会看到：
- `ok=true`
- `triggeredBy="cron-get"`
- `kind="lead-source-daily-digest"`
- 未配 webhook 时 `webhook.skipped=true`

### 1.3 手动真触发一次外发

当 `LEAD_SOURCE_DAILY_WEBHOOK_URL` 已配置后：

```bash
curl -sS -X POST "https://your-project.vercel.app/api/cron/lead-source-daily" | jq '{ok, triggeredBy, webhook, topSource: .payload.report.topSource}'
```

预期会看到：
- `triggeredBy="cron-post"`
- `webhook.forwarded=true`
- `webhook.status` 为接收端返回的 HTTP 状态码

---

## 2. 本地 / Linux / macOS cron 样例

适合：
- 先快速验证每天定时能不能打通
- 有一台长期在线机器
- 想先用最简单方式跑起来

### 2.1 crontab 样例

每天上午 9:00（Asia/Shanghai）触发部署好的 cron 入口：

```cron
CRON_TZ=Asia/Shanghai
0 9 * * * curl -fsS -X POST "https://your-project.vercel.app/api/cron/lead-source-daily" >> /tmp/passive-income-lab-source-daily.log 2>&1
```

### 2.2 验收

```bash
tail -n 20 /tmp/passive-income-lab-source-daily.log
```

如果只是本机调试，也可以先起本地服务后调用：

```bash
curl -sS -X POST "http://127.0.0.1:3000/api/cron/lead-source-daily"
```

---

## 3. GitHub Actions 定时样例

适合：
- 仓库已经在 GitHub
- 不想依赖本地机器常驻
- 想把定时配置留在仓库里

新建 `.github/workflows/lead-source-daily.yml`：

```yaml
name: lead-source-daily

on:
  schedule:
    - cron: '0 1 * * *' # UTC 01:00 = Asia/Shanghai 09:00
  workflow_dispatch:

jobs:
  send-daily-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger lead source daily cron endpoint
        run: |
          curl -fsS -X POST "${{ secrets.LEAD_SOURCE_DAILY_CRON_URL }}"
```

### 需要配置的 GitHub Secrets

- `LEAD_SOURCE_DAILY_CRON_URL`
  - 例如：`https://your-project.vercel.app/api/cron/lead-source-daily`

### 验收

- 手动点 `Run workflow`
- 查看 Actions 日志里 `curl` 是否返回 2xx
- 再查看接收端是否收到 `kind=lead-source-daily-digest`

---

## 4. Vercel Cron 样例

适合：
- 已部署在 Vercel
- 想把 cron 和 serverless 放一起
- 后续可能直接在 Vercel 里生成并发送真实日报

当前仓库已内置：

```json
{
  "crons": [
    {
      "path": "/api/cron/lead-source-daily",
      "schedule": "0 1 * * *"
    }
  ]
}
```

含义：
- `0 1 * * *` = UTC 01:00
- 对应 Asia/Shanghai 每天 09:00

上线后只要配置：

- `LEAD_SOURCE_DAILY_WEBHOOK_URL`
- `LEAD_SOURCE_DAILY_WEBHOOK_AUTH`（可选）

Vercel 就会每天调用：

```text
/api/cron/lead-source-daily
```

而该接口会自动：
1. 读取 `lead-capture` 快照
2. 生成真实 `lead-source-daily-digest` payload
3. 转发到 `LEAD_SOURCE_DAILY_WEBHOOK_URL`

---

## 5. 推荐落地顺序

如果现在目标是 **最低阻力尽快跑通**，建议顺序：

1. 先确认 `GET /api/lead-source-daily` 能返回真实日报 JSON
2. 再手动调用一次 `POST /api/cron/lead-source-daily`
3. 确认接收端收到 `kind=lead-source-daily-digest`
4. 最后再交给 Vercel Cron / GitHub Actions / 本地 cron 定时触发

这样能先把“数据生成”和“定时调度”拆开验收，不容易一起排错。

---

## 6. 最小验收标准

只要满足以下 4 条，就算这条自动化链路已经跑通：

- `GET /api/lead-source-daily` 能返回真实 `topSource / recommendation`
- `POST /api/cron/lead-source-daily` 返回 `ok=true`
- 接收端收到 `kind=lead-source-daily-digest`
- 日志中没有持续出现 401 / 403 / 5xx

---

## 7. 仓库内验证命令

本轮已补一条 cron 冒烟脚本，可本地回归：

```bash
npm run smoke:lead-source-daily-cron
```

预期日志类似：

```text
lead-source-daily cron 冒烟通过: {
  totalLeads: 2,
  topSource: 'public-inquiry:feishu-dm',
  forwardedUrl: 'https://example.com/cron-webhook',
  forwardedStatus: 202
}
```
