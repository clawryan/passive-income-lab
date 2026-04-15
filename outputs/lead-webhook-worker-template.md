# Lead Webhook Cloudflare Worker 模板说明

本页对应 `web/index.html` 里的两个按钮：
- `copyLeadTodoWorkerTemplate`
- `copyLeadPortfolioWorkerTemplate`

## 适用场景

当浏览器直连 Feishu Bot / 自建 webhook 遇到 CORS、鉴权或需要隐藏机器人地址时，可先把页面发送的 payload 打到 Cloudflare Worker，再由 Worker 转发。

## 模板默认包含

- `OPTIONS` 预检与 CORS 响应
- 仅允许 `POST`
- `Authorization: Bearer <RELAY_TOKEN>` 校验占位
- `kind` 校验（分别限制 `lead-followup-todos` / `lead-portfolio-summary`）
- 未配置 `FEISHU_BOT_WEBHOOK` 时返回 dry-run 预览
- 配置后自动把 `payload.summary` / `payload.markdown` 转成飞书文本消息并转发

## 建议环境变量

- `RELAY_TOKEN`：与页面里填写的 Authorization 对齐
- `FEISHU_BOT_WEBHOOK`：飞书机器人 webhook 地址

## 最小上线步骤

1. 在页面中复制对应 Worker 模板
2. 新建 Cloudflare Worker，粘贴模板
3. 设置 `RELAY_TOKEN`（建议必填）
4. 先不填 `FEISHU_BOT_WEBHOOK`，用 dry-run 验证请求是否到达
5. 验证通过后补 `FEISHU_BOT_WEBHOOK`
6. 把页面里的 Webhook URL 改为 Worker 地址

## 验收建议

- 页面点击“复制测试 cURL”并把 URL 改成 Worker 地址
- 返回 `dryRun: true` 说明浏览器 → Worker 已通
- 配置机器人地址后再次触发，应看到 `forwarded: true`

## 注意

- 当前模板默认发飞书文本消息，优先追求低阻力联通
- 若要发 interactive card，可把 `feishuBody` 改为页面内已有的卡片 payload
- 若目标平台不是飞书，也可直接改 Worker 内的转发地址和消息格式
