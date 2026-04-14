# Lead Capture 托管 KV 部署清单

目标：把 `api/lead-capture.js` 从“本机 /tmp 调试”切到“部署后手机与电脑共享线索快照”的最小可用状态。

## 适用场景
- 已把仓库部署到 Vercel
- 想让 `?product=...&view=inquiry` 的公开询价表单真正持久化
- 想让另一台设备可通过远程快照拉回最新线索

## 需要的环境变量
`api/lead-capture.js` 会自动识别以下变量：

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `LEAD_CAPTURE_KV_KEY`（可选，默认 `passive-income-lab:lead-capture:snapshot`）

也兼容 Upstash 的别名变量：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

可选转发：

- `LEAD_CAPTURE_WEBHOOK_URL`
- `LEAD_CAPTURE_WEBHOOK_AUTH`

> 未配置 KV 时会自动回退到本地文件模式，仅适合本机调试，不适合线上长期保留。

## 最小部署步骤（Vercel + Upstash / Vercel KV）
1. 在 Vercel 项目里绑定 KV（或接入 Upstash REST）。
2. 把 REST URL / TOKEN 写入项目环境变量。
3. 如需多环境隔离，可为预发/正式环境使用不同 `LEAD_CAPTURE_KV_KEY`。
4. 重新部署项目。
5. 打开部署地址的 `/api/lead-capture`，确认返回体里的 `storage.mode` 已变为 `vercel-kv`（或 `vercel-kv+webhook-forward`）。

## 上线后验证

### 1) 验证存储模式
```bash
curl -s https://<your-domain>/api/lead-capture | jq
```

期望关键字段：
```json
{
  "ok": true,
  "storage": {
    "mode": "vercel-kv",
    "durable": true,
    "provider": "vercel-kv-rest"
  },
  "summary": {
    "count": 0,
    "stageCounts": {},
    "productCounts": {}
  }
}
```

### 2) 验证公开询价写入
```bash
curl -s -X POST https://<your-domain>/api/lead-capture \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "manual-smoke",
    "context": {"note": "deploy smoke"},
    "lead": {
      "id": "smoke-lead-001",
      "name": "部署验收线索",
      "contact": "wechat:demo-smoke",
      "productSlug": "micro-saas",
      "stage": "待跟进",
      "budget": "¥500-1000",
      "need": "需要 7 天冷启动包",
      "nextStep": "确认接口是否成功持久化",
      "source": "public-inquiry",
      "originPage": "https://<your-domain>/web/?product=micro-saas&view=inquiry"
    }
  }' | jq
```

期望关键字段：
- `ok: true`
- `snapshot.count >= 1`
- `storage.mode = vercel-kv`
- `lead.source = public-inquiry`

### 3) 验证另一端可读回
再次执行：
```bash
curl -s https://<your-domain>/api/lead-capture | jq '.snapshot.entries[0]'
```

应能看到刚写入的线索字段，如：
- `name`
- `contact`
- `productSlug`
- `source`
- `originPage`
- `updatedAt`

也可额外快速验收摘要层：
```bash
curl -s https://<your-domain>/api/lead-capture | jq '.summary'
```

期望至少能看到：
- `summary.count >= 1`
- `summary.topProduct.productSlug = "micro-saas"`（若你刚写的是该产品）
- `summary.topStage.stage = "待跟进"`（或你提交时的当前阶段）

## 前端联调建议
在网页线索区填写：
- Lead Capture API URL：`https://<your-domain>/api/lead-capture`
- Authorization：若你的中转层要求鉴权，再填；当前默认 API 不强制要求

推荐跑一轮最小真链路：
1. 手机打开 `?product=micro-saas&view=inquiry`
2. 提交一条测试询价
3. 电脑端打开主页面
4. 在线索区点击“拉取远程快照”
5. 确认本地线索板已合并该记录

## 常见问题

### 1. 返回 `local-file`
说明线上没有读到 KV 变量，或变量名填错。
优先检查：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- 是否重新部署

### 2. 返回 500
优先检查：
- KV token 是否有效
- REST URL 是否可访问
- KV 服务是否已启用 REST

### 3. 浏览器推 webhook 失败但 API 正常
若同时配置了 `LEAD_CAPTURE_WEBHOOK_URL`，可能是下游 webhook 返回失败；先只验证 KV，再接 webhook。

### 4. 手机端提交了，电脑端没看到
优先检查：
- 是否提交到了同一个域名的 `/api/lead-capture`
- `LEAD_CAPTURE_KV_KEY` 是否一致
- 电脑端拉取的是远程快照，不是旧本地缓存

## 建议的下一步
部署清单跑通后，下一步最值得补的是二选一：
1. **成交 / 付款状态回写入口**：把“已报价 / 已成交”从手工改状态推进到事件回传。
2. **线上真验收记录**：把一次真实 smoke 结果沉淀到 `build-log.md` / `results.md`，形成可重复上线模板。
