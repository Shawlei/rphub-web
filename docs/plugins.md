# RP-Hub 插件开发指南

> 适用：宿主 API **v2**（App versionCode 45 及以上）。插件页那行小字会显示当前宿主版本。
> 插件跑在页面里，权限等同你自己在浏览器控制台敲代码——只影响你自己的设备，碰不到服务器。

---

## 1. 插件是什么

一个 `.json` 文件，里面装一段 JS。导入后默认**不启用**，打开开关就执行。

```json
{
  "format": "rphub-plugin",
  "formatVersion": 1,
  "id": "your.name",
  "name": "插件显示名",
  "version": "1.0.0",
  "author": "你的名字",
  "description": "一句话说明它干什么",
  "api": 2,
  "hooks": ["appReady"],
  "code": "api.toast('你好');"
}
```

`code` 里拿到一个入参 `api`，其余就是普通浏览器 JS：`document`、`fetch`、`setInterval` 全都能用。

---

## 2. 三分钟上手

1. 新建 `hello.json`，内容：

```json
{
  "format": "rphub-plugin", "formatVersion": 1,
  "id": "demo.hello", "name": "我的第一个插件", "version": "1.0.0",
  "author": "我", "description": "弹一句问候", "api": 2,
  "hooks": ["appReady"],
  "code": "api.toast('跑起来了', 'success');"
}
```

2. 插件页 → 右上角导入 → 选这个文件
3. 打开列表里的开关 → 屏幕上弹提示
4. 改 `code` 后重新导入，或者点右上角刷新按钮（不用退出 App）

---

## 3. 包格式

### 单个插件（`format: "rphub-plugin"`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `format` | string | 是 | 固定 `rphub-plugin` |
| `formatVersion` | number | 是 | 包格式版本，目前 `1` |
| `id` | string | 建议 | `[A-Za-z0-9_.-]`，3–64 字符。不合法会自动生成 |
| `name` | string | 是 | 列表显示名 |
| `version` | string | 否 | 插件自身版本，默认 `1.0.0` |
| `author` | string | 否 | 作者 |
| `description` | string | 否 | 说明，列表里可点开看全文 |
| `api` | number | 否 | 需要的宿主 API 版本，默认 `1`。写 `2` 表示用到 `on/off/style` |
| `hooks` | string[] | 否 | 声明用到的钩子，默认 `["appReady"]` |
| `code` | string | 是 | JS 代码体 |

### 整包（`format: "rphub-plugins-bundle"`）

```json
{ "format": "rphub-plugins-bundle", "formatVersion": 1, "plugins": [ {...}, {...} ] }
```

导入时两种格式都能识别，写错格式会提示「没有可识别的插件」。

**冲突规则**：`id` 和已有插件重复时，新导入的会自动换一个新 id，不会覆盖原有插件。

**版本规则**：`api` 大于当前宿主版本时，插件会显示「需要插件宿主 vX，当前 vY，请先升级 App」，不会傻跑一半挂掉。

---

## 4. API 参考

### `api.on(hook, handler)`

注册钩子。返回 `true` 表示注册成功。

```js
api.on('renderMessage', (text, ctx) => text.replace(/xxx/g, 'yyy'));
```

### `api.off(hook, handler)`

注销钩子，需要传回同一个函数引用。

### `api.style(css)`

注入一段全局 CSS（插到 `<head>`，被打上 `data-plugin-style="你的id"`）。返回一个移除函数。

```js
const removeStyle = api.style('.foo{color:red}');
// 想撤掉时：removeStyle();
```

### `api.toast(message, type)`

页面底部吐司。`type`：`success` / `error` / `warning` / `info`。

### `api.log(...args)`

控制台日志，自动带 `[plugin:你的id]` 前缀，方便过滤。

### `api.storage.get(key)` / `api.storage.set(key, value)`

按插件隔离的 IndexedDB 存储，`key` 会自动加前缀，不会和别的插件或宿主数据打架。两个都是异步。

```js
const pos = await api.storage.get('pos');
await api.storage.set('pos', { left: '20px', top: '300px' });
```

### `api.utils`

`window.RPHubUtils` 全套工具（`generateUUID`、`compressImage`、`defaultAvatar` 等）。

### 只读属性

`api.id` / `api.name` / `api.version` / `api.hooks`

---

## 5. 钩子

| 钩子 | 何时触发 | 入参 | 返回值 |
|---|---|---|---|
| `appReady` | 插件启用瞬间执行一次（不是钩子，是代码本体） | — | — |
| `renderMessage` | 每条消息**显示前**，在正则脚本之后、Markdown 渲染之前 | `(text, {role})` | 新的文本字符串；返回非字符串则忽略 |
| `beforeSend` | 你按下发送、消息入队之前 | `(text, {role:'user'})` | 新的文本字符串 |

要点：

- 多个插件注册同一钩子时**按注册顺序串联**，前一个的返回值是后一个的入参。
- 你的钩子抛异常只会记一条 `console.warn`，**不会中断页面**，也不会影响别的插件。
- `renderMessage` 的产物会经过 Markdown + DOMPurify。白名单里允许 `div / span / button / svg / details / summary / iframe` 等，所以可以注入结构，但 `onclick` 以外的内联事件会被清掉。
- `beforeSend` 只改发出去的内容，输入框里看到的还是你打的字。

---

## 6. 三种典型骨架

### A. 纯样式型（最简单）

```js
api.style(`
  .msg-bubble-glass { border-radius: 18px !important; }
  .message-content-wrapper { line-height: 1.9 !important; }
`);
api.toast('阅读模式已开启', 'success');
```

### B. 正文改写型

```js
// 1) 统一把（动作）染成灰色斜体
api.style('.plugin-action{color:#94a3b8;font-style:italic}');

// 2) 每条消息显示前处理
api.on('renderMessage', (text, { role }) => {
  if (role !== 'assistant') return text;
  return text.replace(/（([^）\n]{1,80})）/g, '<span class="plugin-action">$1</span>');
});

// 3) 发送前顺手清掉零宽字符
api.on('beforeSend', (text) => text.replace(/[\u200b-\u200f\ufeff]/g, ''));
```

### C. DOM 增强型（复杂，但能力最强）

```js
api.style('.plugin-badge{position:fixed;right:10px;bottom:80px;z-index:40;font-size:11px}');

const badge = document.createElement('div');
badge.className = 'plugin-badge';
document.body.appendChild(badge);

const sync = () => {
  const rows = document.querySelectorAll('[data-chat-index]');
  badge.textContent = `可见 ${rows.length} 条`;
};
let queued = false;
const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; sync(); });
};

new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
sync();
```

DOM 型注意事项：

1. **Vue 会重渲染，你插的节点可能被冲掉** → 用 MutationObserver 兜，插入前先查是否已存在（幂等标记，比如自己的 class）
2. **别监听 `characterData`** → 流式输出时每个字都触发一次，会卡。用 `childList` + 定时器
3. **节流**：`requestAnimationFrame` 加一个布尔闸门，防止自己插入节点又触发自己
4. **别改 Vue 管的属性**（`v-show` 控制的 `style.display` 等），会打架
5. 退出时清理：`clearInterval`、`observer.disconnect()`、移除自己的节点

---

## 7. 调试

- 控制台过滤 `[plugin:` 只看插件日志
- 插件出错会显示在列表卡片里（红色「运行错误：…」），点开卡片看详情
- 改代码 → 重新导入覆盖 → 点右上角**刷新**按钮（`location.reload()`），比退出 App 快
- 禁用开关只是停止注册新钩子，**已经注入的样式和 DOM 要刷新才消失**

---

## 8. 常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| `api.style is not a function` | 宿主版本太老（< v2） | 插件里写 `"api": 2`，装到老宿主会给出可读提示 |
| 改了代码但界面没变 | 插件已执行过，开关切换不会重跑 | 点刷新按钮 |
| DOM 节点插了又没了 | Vue 重渲染 | MutationObserver + 幂等标记 |
| 卡片在流式输出时卡顿 | 监听了 `characterData` | 只监听 `childList`，配定时器 |
| `renderMessage` 注入的 HTML 被吃掉 | DOMPurify 白名单 | 用 `div/span/button/svg/details`，别用自定义标签 |
| 导入报「没有可识别的插件」 | JSON 顶层不是对象或数组 | 检查 `format` 字段与括号 |

---

## 9. 分发

- **单插件**：把 `.json` 发给别人，对方导入即可
- **整包**：多个插件合成 `rphub-plugins-bundle`，一次导入
- 插件与开关存在**各自的浏览器本地**，服务器不保存，换设备要重新导入
- 不要执行来源不明的插件代码——它就是一段能在你页面上跑的 JS
