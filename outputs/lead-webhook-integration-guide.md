# Lead Webhook Integration Guide

适用：Passive Income Lab 首页里的“线索 Webhook 出口”。

## 推送负载结构

所有请求都为 `POST application/json`，顶层结构固定：

```json
{
  "source": "passive-income-lab",
  "kind": "lead-followup-todos",
  "generatedAt": "2026-04-12T09:00:00.000Z",
  "payload": {}
}
```

`kind` 当前有两类：

- `lead-followup-todos`：当前筛选范围内的跟进待办
- `lead-portfolio-summary`：跨产品线索总览

## 推荐接法

### 方案 A：浏览器 → n8n Webhook → 飞书机器人

适合：需要格式化消息、路由到不同群/私聊、避免目标端 CORS 问题。

1. 在 n8n 新建 Webhook 节点，方法用 `POST`
2. 把生成的 Webhook URL 填入页面里的 `Webhook URL`
3. 如需鉴权，把 `Bearer xxx` 或自定义 token 填入 `Authorization`
4. 在 n8n 后接 `Switch/IF` 节点，按 `{{$json.body.kind}}` 路由
5. 发飞书时优先取：
   - 短消息：`{{$json.body.payload.summary}}`
   - 长消息：`{{$json.body.payload.markdown}}`

### 方案 B：浏览器 → Cloudflare Worker / 自建中转 → 任意下游

适合：需要统一鉴权、日志、重试、转换到企业内部系统。

中转层建议做的事：

- 校验 `Authorization`
- 记录 `source / kind / generatedAt`
- 按 `kind` 转换为下游消息格式
- 返回 200 JSON，减少前端误报失败

## 字段建议

### `lead-followup-todos`

`payload` 关键字段：

- `filter`：当前状态筛选
- `count`：待办数量
- `items[]`：逐条待办
- `summary`：适合直接发消息的纯文本摘要

### `lead-portfolio-summary`

`payload` 关键字段：

- `report`：结构化跨产品总览
- `summary`：适合直接发消息的纯文本摘要
- `markdown`：适合沉淀到文档/周报的 Markdown

## 飞书文案最小映射

如果只想最快落地，直接把以下任一字段转发到飞书即可：

- 待办提醒：`payload.summary`
- 跨产品总览：`payload.summary`
- 长文留档：`payload.markdown`

## 注意事项

- 浏览器直连某些目标端可能遇到 CORS；优先用 n8n / Worker 中转
- 当前页面只在你主动点按钮时发请求，不会自动后台推送
- 演示数据与真实线索都走同一结构，便于先联调再接正式流量
