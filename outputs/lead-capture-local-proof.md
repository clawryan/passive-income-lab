# Passive Income Lab Lead Capture 本地验收证明

- 生成时间：2026-06-07T07:30:18.713Z
- 本地快照路径：/var/folders/2z/l3smmyhd6dq2m35rjh5k_jyc0000gn/T/pil-lead-capture-proof-NSnwaQ/lead-capture-local.json
- KV Key：pil:proof:lead-capture

## 验收结论
- 本地模式初始 GET：storage.mode=local-file，count=0
- 本地线索写入：topSource=public-inquiry:feishu-dm，utmCampaign=dev-sprint-3h，nextStep=今晚发报价
- 本地报价更新：lead.stage=已报价，summary.topStage=已报价
- 本地付款回写：event.status=paid，lead.stage=已成交，paidLeadCount=1，CNY=229
- 本地最终快照：count=1，topStage=已成交，topProduct=micro-saas，topSource=public-inquiry:feishu-dm
- KV 模式初始 GET：storage.mode=vercel-kv+webhook-forward，durable=true，count=0
- KV 线索写入：topProduct=orion-nexus，webhookStatus=202
- KV 付款回写：event.status=paid，lead.stage=已成交，paidLeadCount=1，CNY=1999
- KV 最终快照：count=1，topStage=已成交，topProduct=orion-nexus，topSource=public-inquiry:wechat-group

## 关键证据
- 本地文件已落盘：是
- 本地 paymentStatusCounts：{"paid":1}
- KV paymentStatusCounts：{"paid":1}
- webhook 预览：kind=lead-event，leadId=proof-lead-kv，eventStatus=paid，paidLeadCount=1

## 下一步建议
- 拿真实线上 `/api/lead-capture` 地址跑一次手机端公开询价 → 电脑端 GET 快照 → 付款回写真验收。
- 若要把这条证据用于部署验收，可对照 `outputs/lead-capture-kv-deploy.md` 的 cURL 模板替换为线上域名。
