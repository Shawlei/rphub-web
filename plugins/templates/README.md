# 插件模板

三个能直接导入跑的骨架，改 `code` 就行。完整说明见 [`../../docs/plugins.md`](../../docs/plugins.md)。

| 文件 | 演示什么 |
|---|---|
| `hello-plugin.json` | 最小插件：`api.log` + `api.toast` |
| `text-rewrite-plugin.json` | `renderMessage` 改显示正文 + `beforeSend` 改发出的消息 + `api.style` |
| `dom-hud-plugin.json` | `MutationObserver` 兜 Vue 重渲染 + 节流，做一个实时悬浮统计 |

导入方式：插件页 → 右上角导入 → 选文件 → 打开开关。
