# 来源日报定时触发样例

目标：把 `lead-source-daily-digest` 从“已能生成 payload / workflow / Worker 模板”，再推进到“可直接照抄挂到定时器”。

适用入口：
- `outputs/lead-source-daily-automation-guide.md`：说明如何接 n8n / Worker / 飞书机器人
- 本文件：给出 **本地 cron / GitHub Actions / Vercel Cron** 三种最小定时样例

---

## 0. 先准备一个接收端

推荐优先用以下任一接收端：

1. **Cloudflare Worker 中转**
   - 页面里可直接复制“来源日报 Cloudflare Worker 模板”
   - 适合接飞书机器人，顺便处理 CORS / Authorization
2. **n8n Webhook**
   - 页面里可直接复制“来源日报 n8n Workflow JSON”
   - 适合后续继续分流到邮件、表格、数据库

假设你的接收端 URL 为：

```bash
https://example.com/webhook/lead-source-daily-digest
```

若需要鉴权，假设 token 为：

```bash
Bearer replace-me
```

---

## 1. 最小 cURL 模板

这是最小可定时触发请求。真正部署时，把 `payload.summary / markdown / report` 替换成你自己的生成结果；若你已有上游服务负责生成完整日报，也可以直接复用同结构。

```bash
curl -X POST "https://example.com/webhook/lead-source-daily-digest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer replace-me" \
  --data-binary @- <<'JSON'
{
  "source": "passive-income-lab",
  "kind": "lead-source-daily-digest",
  "generatedAt": "2026-04-17T06:00:00.000Z",
  "payload": {
    "summary": "Passive Income Lab 来源日报\n- 总线索：12\n- 可推进：5\n- 当前最热产品：micro-saas\n- 当前最有效来源：public-inquiry:feishu-dm\n- 建议动作：优先继续加推飞书私聊入口，并先清理已报价未跟进线索。",
    "markdown": "# Passive Income Lab 来源日报\n\n- 总线索：12\n- 可推进：5\n- 当前最热产品：micro-saas\n- 当前最有效来源：public-inquiry:feishu-dm\n- 建议动作：优先继续加推飞书私聊入口，并先清理已报价未跟进线索。",
    "recommendation": "优先继续加推飞书私聊入口，并先清理已报价未跟进线索。",
    "sourceHighlights": [
      {
        "source": "public-inquiry:feishu-dm",
        "leadCount": 5,
        "quotedCount": 2,
        "paidCount": 1
      }
    ],
    "report": {
      "topProduct": "micro-saas",
      "topSource": "public-inquiry:feishu-dm"
    }
  }
}
JSON
```

---

## 2. 本地 / Linux / macOS cron 样例

适合：
- 先快速验证每天定时能不能打通
- 有一台长期在线机器
- 想先用最简单方式跑起来

### 2.1 建议把请求保存为脚本

新建 `scripts/send-lead-source-daily.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="https://example.com/webhook/lead-source-daily-digest"
AUTH_HEADER="Authorization: Bearer replace-me"
NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

curl -sS -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  --data-binary @- <<JSON
{
  "source": "passive-income-lab",
  "kind": "lead-source-daily-digest",
  "generatedAt": "$NOW_UTC",
  "payload": {
    "summary": "Passive Income Lab 来源日报（定时样例）",
    "markdown": "# Passive Income Lab 来源日报\n\n这是 cron 定时样例。",
    "recommendation": "先确认定时链路打通，再替换成真实日报生成逻辑。",
    "sourceHighlights": [],
    "report": {}
  }
}
JSON
```

给执行权限：

```bash
chmod +x scripts/send-lead-source-daily.sh
```

### 2.2 crontab 样例

每天上午 9:00（Asia/Shanghai）执行：

```cron
CRON_TZ=Asia/Shanghai
0 9 * * * cd /path/to/passive-income-lab && ./scripts/send-lead-source-daily.sh >> /tmp/passive-income-lab-source-daily.log 2>&1
```

### 2.3 验收

```bash
tail -n 20 /tmp/passive-income-lab-source-daily.log
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
      - name: Post lead source daily digest
        env:
          WEBHOOK_URL: ${{ secrets.LEAD_SOURCE_DAILY_WEBHOOK_URL }}
          AUTH_TOKEN: ${{ secrets.LEAD_SOURCE_DAILY_AUTH_TOKEN }}
        run: |
          NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
          curl -sS -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            --data-binary @- <<JSON
          {
            "source": "passive-income-lab",
            "kind": "lead-source-daily-digest",
            "generatedAt": "$NOW_UTC",
            "payload": {
              "summary": "Passive Income Lab 来源日报（GitHub Actions 定时样例）",
              "markdown": "# Passive Income Lab 来源日报\n\n这是 GitHub Actions 定时样例。",
              "recommendation": "先验证 workflow 可稳定触发，再替换为真实来源日报生成逻辑。",
              "sourceHighlights": [],
              "report": {}
            }
          }
          JSON
```

### 需要配置的 GitHub Secrets

- `LEAD_SOURCE_DAILY_WEBHOOK_URL`
- `LEAD_SOURCE_DAILY_AUTH_TOKEN`

### 验收

- 手动点 `Run workflow`
- 查看 Actions 日志里 `curl` 是否返回 2xx
- 确认接收端收到 `kind=lead-source-daily-digest`

---

## 4. Vercel Cron 样例

适合：
- 已部署在 Vercel
- 想把 cron 和 serverless 放一起
- 后续可能直接在 Vercel 里生成日报

### 4.1 vercel.json 样例

如果你已有一个可接收 cron 的接口，比如：

```text
/api/cron/lead-source-daily
```

可在 `vercel.json` 增加：

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

> `0 1 * * *` 为 UTC 01:00，对应 Asia/Shanghai 09:00。

### 4.2 接口最小逻辑建议

你的 `/api/cron/lead-source-daily` 可以做两件事：

1. 生成 `lead-source-daily-digest` payload
2. 再转发到 Worker / n8n / 飞书机器人中转

伪代码：

```js
export default async function handler(req, res) {
  const payload = {
    source: 'passive-income-lab',
    kind: 'lead-source-daily-digest',
    generatedAt: new Date().toISOString(),
    payload: {
      summary: 'Passive Income Lab 来源日报（Vercel Cron 样例）',
      markdown: '# Passive Income Lab 来源日报\n\n这是 Vercel Cron 定时样例。',
      recommendation: '先确认 cron 能稳定命中，再替换成真实日报。',
      sourceHighlights: [],
      report: {}
    }
  };

  const response = await fetch(process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.LEAD_SOURCE_DAILY_AUTH_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  res.status(response.ok ? 200 : 500).json({ ok: response.ok });
}
```

### 需要配置的环境变量

- `LEAD_SOURCE_DAILY_WEBHOOK_URL`
- `LEAD_SOURCE_DAILY_AUTH_TOKEN`

---

## 5. 推荐落地顺序

如果现在目标是 **最低阻力尽快跑通**，建议顺序：

1. **先用 Cloudflare Worker / n8n 接收**
2. **再用本地 cron 或 GitHub Actions 定时 POST 样例 payload**
3. **确认飞书能稳定收到**
4. **最后再把样例 payload 替换成真实来源日报生成逻辑**

这样能避免一开始就把“调度 + 数据生成 + 消息格式 + 鉴权”四件事绑死在一起。

---

## 6. 最小验收标准

只要满足以下 4 条，就算这条自动化链路已经跑通：

- 接收端收到 `kind=lead-source-daily-digest`
- 消息里能看到 `Passive Income Lab 来源日报`
- 定时器每天能稳定触发一次
- 飞书 / 中转日志中没有 401 / 403 / 5xx

若先跑样例 payload 成功，再继续把真实 `sourceHighlights / recommendation / report` 接进去，阻力会最低。