# Washi Portfolio UI/UX 改进设计方案

## 概述

对 Washi Portfolio 进行 UI/UX 打磨，包含 4 个模块：页面切换过渡、导航指示器、微交互系统、2048 游戏重构。全部在现有 SPA 架构上增量改进，不引入新框架或依赖。

## 模块一：页面切换过渡

### 现状
`switchPage()` 使用 `display: none/block` 切换页面，仅有 `.page.active` 的 `fadeInUp` 动画。切换生硬，无过渡感。

### 方案
- **动画风格：** Fade + Scale
  - 旧页面：`opacity: 0` + `transform: scale(0.95)`，历时 200ms
  - 新页面：`opacity: 1` + `transform: scale(1)`，历时 300ms
- **时序：** 旧页滑出 → 切换 DOM → 新页滑入，总耗时约 350ms
- **无障碍：** 检测 `prefers-reduced-motion`，启用时跳过动画直接切换
- **防抖：** 动画执行期间禁用切换，防止快速点击导致状态错乱

### 实现要点
- CSS 定义 `.page-exit` / `.page-enter` 动画类
- 修改 `switchPage()` 方法，加入 Promise 链式控制时序
- 使用 `requestAnimationFrame` 确保动画触发

### 修改文件
- `src/js/app.js` — 修改 `switchPage()` 方法
- `src/css/washi.css` — 新增 `@keyframes` 动画类

---

## 模块二：导航栏活跃指示器

### 现状
Tab 切换仅通过文字颜色/字体粗细区分当前页，无视觉指示器。

### 方案
- 在 `.tabs` 内添加 `.tab-indicator` 元素
- 指示器为**背景色块**，圆角，跟随活跃 tab 滑动
- 每次 `switchPage()` 或窗口 resize 时重新计算位置
- 移动端同样适配

### 样式
- 背景：使用 `var(--red)` 主色，低透明度 (`opacity: 0.12`)
- 过渡：`left` + `width` 使用 `cubic-bezier(0.22, 1, 0.36, 1)` 缓动
- 在 Tab 容器 `.tabs` 上设置 `position: relative`

### 修改文件
- `src/js/app.js` — switchPage() 中加入位置更新调用，新增 `updateTabIndicator()` 方法
- `src/css/washi.css` — 新增 `.tab-indicator` 样式

---

## 模块三：微交互系统

### 3.1 按钮涟漪效果 (Ripple)

**方案：** 纯 CSS 实现，利用 `::after` 伪元素
- 在 `.btn`、`.tab` 等可点击元素上添加 ripple 类
- 点击时 `::after` 从点击位置扩散放大并淡出
- 无需 JS，零依赖

### 3.2 Toast 通知升级

**现状：** 单条淡入淡出，不支持堆叠。

**方案：**
- `Toast` 工具函数升级，支持同时显示最多 3 条
- 每条 Toast 包含：图标区 + 消息文字 + 自动消失进度条
- 类型：`success` / `error` / `info`
- 自动 3 秒消失，进度条实时缩减
- 移除时逐条淡出，后续 toast 上移填补

### 3.3 暗色模式平滑过渡

- 在 `body` 及主要容器上设置 `transition: background-color 0.4s ease, color 0.4s ease`
- 各卡片、标签、边框等组件 CSS 变量自动继承过渡效果
- 切换不再突兀

### 3.4 滚动进度 + 回到顶部

**方案：**
- 在页面顶部添加固定进度条（细线，宽度随滚动百分比变化）
- 使用 `window.scrollY / (documentHeight - viewportHeight)` 计算百分比
- 回到顶部按钮在滚动超过 300px 时显示，带缩放弹出动画
- 点击后 `window.scrollTo({ behavior: 'smooth', top: 0 })`

### 修改文件
- `src/js/app.js` — 新增 `showToast()` 升级版、`initScrollProgress()`
- `src/css/washi.css` — 新增 ripple、toast 升级、进度条、回到顶部动效相关样式

---

## 模块四：2048 游戏重构

### 现状
2048 是独立 HTML 页面 (`games/2048.html`)，内联样式和脚本，与主站设计语言无关。

### 方案
- **嵌入主站：** 在 `index.html` 中添加 `<div class="page" id="page-game2048">`，使 2048 成为 SPA 的一个页面
- **设计风格：** Apple Liquid Glass
  - 棋盘使用毛玻璃背景：`background: rgba(255,255,255,0.4)` + `backdrop-filter: blur(20px)`
  - 方块：半透明亮色毛玻璃质感，带微弱内发光
  - 边框：极细半透明白色描边
  - 阴影：柔和、多层次阴影模拟玻璃厚度
- **深色模式适配：** 暗色下玻璃变成深色半透明 (`rgba(0,0,0,0.3)`)
- **继承主站设计令牌：** 使用 `var(--bg)`, `var(--text)`, `var(--card)` 等 CSS 变量
- **微交互集成：** 按钮 ripple、Toast 通知（得分里程碑提示）
- **导航一致性：** 使用主站导航栏，不需要单独的 "返回首页" 按钮

### 游戏逻辑
保持现有纯 JS 游戏逻辑不变，仅重构 UI 渲染层。游戏逻辑从 `games/2048.html` 移植到 `app.js` 中，作为 App 对象的方法。

### 移动端
- Liquid Glass 在移动端保持效果
- 触摸滑动操作保持不变
- 响应式适配棋盘大小

### 修改文件
- `index.html` — 新增 page-game2048 的 HTML 结构
- `src/js/app.js` — 移植游戏逻辑，新增 `initGame2048()`、`renderGame2048()` 等方法
- `src/css/washi.css` — 新增 2048 Liquid Glass 样式
- `games/2048.html` — 保留但可以标注为已迁移（或不删除，留作独立访问）

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `index.html` | 修改 | 添加 game2048 page 结构，调整 pages 容器 |
| `src/js/app.js` | 修改 | switchPage 重构 + tab 指示器 + 微交互 + 2048 移植 |
| `src/css/washi.css` | 修改 | 新增动画/过渡/ripple/toast/进度条/2048 样式 |
| `games/2048.html` | 不变 | 保留独立版本 |

## 实施顺序

1. **CSS 基础** — 页面过渡动画、tab 指示器样式、ripple、toast、进度条
2. **JS 功能** — 改造 switchPage、tab 指示器逻辑、Toast 升级、滚动进度
3. **2048 移植** — HTML 结构加入主站、CSS Liquid Glass 样式、JS 逻辑移植
4. **暗色过渡** — 全局 transition 设置
5. **打磨** — 细节调整、无障碍、动画 timing 微调

---

## 不考虑的方案
- 引入 JS 动画库（GSAP/Framer Motion）：增加依赖，纯 CSS 可满足需求
- 使用 Web Components 封装 2048：过度设计，当前 SPA 架构足矣
- PWA/Service Worker：本次聚焦 UI/UX，非功能架构
