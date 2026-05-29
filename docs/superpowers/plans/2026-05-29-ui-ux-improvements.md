# Washi Portfolio UI/UX 改进 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Washi Portfolio 增加页面切换过渡动画、导航活跃指示器、微交互系统（Ripple/Toast升级/滚动进度/暗色过渡），并将 2048 游戏以 Liquid Glass 风格嵌入主站 SPA。

**Architecture:** 纯 CSS 动画 + 增量 JS 修改，不引入新依赖。所有改动局限在 `index.html`、`src/js/app.js`、`src/css/washi.css` 三个文件。

**Tech Stack:** HTML5 + CSS3 (自定义属性、@keyframes、backdrop-filter) + 原生 ES6 JS

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `index.html` | 添加 tab-indicator DOM 元素、game2048 页面结构、导航 tab、滚动进度条 | 修改 |
| `src/js/app.js` | 改造 switchPage() 过渡逻辑、updateTabIndicator()、Toast 升级、滚动进度、2048 游戏逻辑 | 修改 |
| `src/css/washi.css` | 页面过渡动画、tab 指示器、ripple、toast 升级、进度条、暗色过渡、2048 Liquid Glass | 修改 |

---

### Task 1: 页面切换 Fade+Scale 过渡 (CSS)

**Files:**
- Modify: `src/css/washi.css:394-408`

- [ ] **Step 1.1: 在 .page 区块后添加过渡动画 keyframes 和类**

  找到 `src/css/washi.css` 中 `.page.active { display: block; opacity: 1; }`（约第 404 行），在其后追加：

  ```css
  /* ===== Page Transitions ===== */
  .page-exit {
    animation: pageExit 0.2s ease-out forwards;
    pointer-events: none;
  }
  .page-enter {
    animation: pageEnter 0.3s ease-out forwards;
  }
  @keyframes pageExit {
    to { opacity: 0; transform: scale(0.95); }
  }
  @keyframes pageEnter {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .page-exit, .page-enter { animation: none !important; }
    .page-exit { opacity: 0; }
    .page-enter { opacity: 1; }
  }
  ```

- [ ] **Step 1.2: 验证语法**

  没有额外步骤，CSS 不需要编译。

---

### Task 2: 改造 switchPage() 支持过渡动画

**Files:**
- Modify: `src/js/app.js:10-30` (添加 _animating 属性)
- Modify: `src/js/app.js:819-838` (改造 switchPage)

- [ ] **Step 2.1: 在 App 对象中添加 `_animating` 属性**

  找到 App 对象定义处（约第 10-30 行），在 `_ossBusy: false` 之后添加：

  ```js
  _animating: false,
  ```

- [ ] **Step 2.2: 重写 switchPage() 方法**

  将原有 `switchPage(name)`（第 819-838 行）替换为：

  ```js
  switchPage(name) {
    if (this._animating) return;
    const cur = document.querySelector('.page.active');
    if (!cur || cur.id === 'page-'+name) return;

    this._animating = true;

    // Exit: animate current page out
    cur.classList.add('page-exit');

    setTimeout(() => {
      // Swap pages
      cur.classList.remove('active', 'page-exit');
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      const pg = $('page-'+name);
      if (pg) {
        pg.classList.add('active');
        pg.classList.add('page-enter');
      }

      // Update UI immediately (tabs, mobile menu)
      document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
      document.querySelectorAll('.mobile-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
      this.closeMobileMenu();
      this.updateTabIndicator();

      // Enter animation cleanup
      setTimeout(() => {
        if (pg) pg.classList.remove('page-enter');
        this._animating = false;

        // Page-specific init AFTER transition
        if (name === 'gallery') { this.renderGallery(); this.initPoetryCarousel(); }
        if (name === 'about') this.renderAboutExtras();
        if (name === 'calendar') this.initCalendar();
        if (name === 'game2048') this.initGame2048();
      }, 300);
    }, 200);
  },
  ```

  注意：原代码中 `if (name === 'dino')` / `if (name === 'tetris')` / `if (name === 'breakout')` 三行已被去掉，因为这些游戏页面已删除（git status 显示它们被删除）。`game2048` 的处理在后续任务中添加。

- [ ] **Step 2.3: 在 init() 中初始化页面时静默跳过动画**

  找到 `init()` 方法中的 `this.switchPage('home')`（约第 99 行），在其之前添加：
  ```js
  this._animating = false;  // 确保初始加载无动画
  ```
  原有 `this.switchPage('home')` 不变。

---

### Task 3: 导航栏活跃指示器 (Tab Indicator)

**Files:**
- Modify: `index.html:93-99` (添加指示器元素)
- Modify: `src/css/washi.css` (nav 样式区)
- Modify: `src/js/app.js` (新增方法)

- [ ] **Step 3.1: 在 index.html 的 .tabs 内添加指示器元素**

  在 `index.html` 中 `.tabs` 容器内（约第 93-99 行），在第一个 `<button>` 之前添加：
  ```html
  <div class="tab-indicator" id="tabIndicator"></div>
  ```

- [ ] **Step 3.2: 在 .tabs 上添加 position:relative 基础**

  找到 `src/css/washi.css` 中 `.tabs` 选择器（约第 175 行附近），确认其已有 `display: flex` 等，在现有规则中添加：
  ```css
  position: relative;
  ```

- [ ] **Step 3.3: 添加 .tab-indicator 样式**

  在 `.tabs` 样式附近追加：
  ```css
  .tab-indicator {
    position: absolute; bottom: 4px; left: 0;
    height: calc(100% - 8px);
    background: var(--red); opacity: 0.10;
    border-radius: 6px;
    pointer-events: none;
    transition: left 0.35s cubic-bezier(0.22,1,0.36,1), width 0.35s cubic-bezier(0.22,1,0.36,1);
    z-index: 0;
  }
  .tab { position: relative; z-index: 1; }
  ```

  注意：如果已有 `.tab` 选择器，追加 `position: relative; z-index: 1;` 即可。

- [ ] **Step 3.4: 在 App 中添加 updateTabIndicator() 方法**

  在 `switchPage()` 方法之后（约第 838 行后）添加：
  ```js
  updateTabIndicator() {
    const indicator = $('tabIndicator');
    const activeTab = document.querySelector('.tab.active');
    if (!indicator || !activeTab) return;
    indicator.style.left = activeTab.offsetLeft + 'px';
    indicator.style.width = activeTab.offsetWidth + 'px';
  },
  ```

- [ ] **Step 3.5: 绑定 resize 事件以重新计算指示器位置**

  在 `bind()` 方法中找到窗口事件绑定处（约第 2410-2420 行附近的事件绑定区），添加：
  ```js
  window.addEventListener('resize', ()=>this.updateTabIndicator());
  ```

- [ ] **Step 3.6: 初始化时调用 updateTabIndicator**

  在 `init()` 方法中，`this.switchPage('home')` 之后调用：
  ```js
  // 延迟一帧等待布局稳定
  requestAnimationFrame(() => this.updateTabIndicator());
  ```

---

### Task 4: 按钮涟漪效果 (Ripple) — 纯 CSS

**Files:**
- Modify: `src/css/washi.css` (按钮区域)

- [ ] **Step 4.1: 添加 ripple 关键帧和 .ripple 类**

  在 `src/css/washi.css` 中 `.btn` 样式附近（约第 1263 行处），添加：
  ```css
  /* ===== Ripple Effect ===== */
  .ripple {
    position: relative; overflow: hidden;
  }
  .ripple::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at var(--rx, 50%) var(--ry, 50%), rgba(255,255,255,0.35) 0%, transparent 60%);
    opacity: 0; pointer-events: none;
    transition: opacity 0s;
  }
  .ripple:active::after {
    opacity: 1;
    transition: opacity 0s;
    animation: rippleEffect 0.4s ease-out forwards;
  }
  @keyframes rippleEffect {
    0% { transform: scale(0.4); }
    100% { transform: scale(3); opacity: 0; }
  }
  ```

- [ ] **Step 4.2: 给需要 ripple 的元素添加类**

  找到 `src/css/washi.css` 中 `.tab` 选择器（约第 175 行），确保已有 `.tab` 样式，追加 `.ripple` 类（同一个选择器）或单独声明：
  ```css
  .tab { position: relative; z-index: 1; }  /* 已存在的话追加 ripple */
  ```

  不需要修改 HTML — ripple 效果通过类名控制。在 JS 中已有的动态生成的按钮元素（如作品卡片按钮、FAB 等）中，代码级添加时带上 `ripple` 类（此步在 Task 4.3 中对现有模板字符串处理）。

  实际上，最简便的方式是让 JS 中的 `bind()` 或全局样式覆盖所有 `.btn, .tab, .w-card-btn, .gv-nav, .fab, .modal-btn` 等可点击元素。

  找到 `.btn` 选择器（约 1263 行），追加 overflow: hidden：
  ```css
  .btn { padding: 7px 18px; border-radius: 99px; border: none; cursor: pointer; font-weight: 600; font-size: 0.83rem; transition: all var(--trf); overflow: hidden; position: relative; }
  ```

  在 `.fab` 样式（约 1174 行）中追加 `overflow: hidden; position: relative;`。

  在 `.tab` 样式（约 175 行）中追加 `overflow: hidden;`（已有 position，无需重复）。

---

### Task 5: Toast 通知升级

**Files:**
- Modify: `src/js/app.js:3292-3299` (替换 toast 方法)
- Modify: `src/css/washi.css:1271-1284` (替换 toast 样式)

- [ ] **Step 5.1: 替换 toast CSS**

  找到 `src/css/washi.css` 中 `/* ===== Toast ===== */` 区块（约第 1271-1284 行），替换为：
  ```css
  /* ===== Toast ===== */
  .toast-c {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    z-index: 300; display: flex; flex-direction: column; gap: 8px; pointer-events: none;
    max-width: 90vw;
  }
  .toast {
    padding: 10px 20px; border-radius: 12px;
    background: var(--text); color: var(--bg); font-size: 0.83rem; font-weight: 500;
    box-shadow: var(--shadow-lg); pointer-events: auto;
    opacity: 0; transform: translateY(12px) scale(0.96);
    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
    display: flex; align-items: center; gap: 8px;
    min-width: 200px; max-width: 360px;
  }
  .dark .toast { background: var(--card); color: var(--text); }
  .toast.show { opacity: 1; transform: translateY(0) scale(1); }
  .toast-icon { font-size: 1rem; flex-shrink: 0; }
  .toast-text { flex: 1; }
  .toast-progress {
    position: absolute; bottom: 0; left: 0; height: 2px;
    background: currentColor; opacity: 0.25;
    border-radius: 0 0 12px 12px;
    transition: width 0.1s linear;
  }
  .toast { position: relative; overflow: hidden; }
  .toast-success .toast-icon { color: #4caf50; }
  .toast-error .toast-icon { color: #f44336; }
  .toast-info .toast-icon { color: var(--gold); }
  ```

- [ ] **Step 5.2: 替换 toast() 方法**

  找到 `app.js` 中 `toast(msg, dur=2500)` 方法（约第 3292-3299 行），替换为：
  ```js
  toast(msg, type='info', dur=3000) {
    const c = $('toastC');
    if (!c) return;

    // Limit to 3 visible toasts
    while (c.children.length >= 3) {
      const old = c.firstChild;
      old.classList.remove('show');
      setTimeout(() => old.remove(), 300);
    }

    const el = document.createElement('div');
    el.className = 'toast toast-'+type;
    const icons = { success:'✓', error:'✗', info:'●' };
    el.innerHTML = '<span class="toast-icon">'+(icons[type]||'●')+'</span><span class="toast-text">'+esc(msg)+'</span><span class="toast-progress" style="width:100%"></span>';
    c.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));

    const prog = el.querySelector('.toast-progress');
    const start = Date.now();
    const tick = () => {
      const pct = Math.max(0, 100 - (Date.now() - start) / dur * 100);
      if (prog) prog.style.width = pct + '%';
      if (pct > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, dur);
  },
  ```

- [ ] **Step 5.3: 更新所有调用处适配新签名**

  全局搜索 `this.toast(` 字符串，将旧调用 `this.toast('xxx')` 适配新签名：
  - `this.toast('xxx')` → `this.toast('xxx', 'info')`（没变化，info 是默认值）
  - 错误提示如 `this.toast('❌ 密码错误')` → 保留内容，类型保持 info（或改为 `'error'`）

  无需逐个修改，因为 `type` 参数有默认值 `'info'`。可在后续统一优化。

---

### Task 6: 滚动进度条 + 回到顶部增强

**Files:**
- Modify: `index.html` (添加进度条 DOM)
- Modify: `src/css/washi.css` (进度条样式 + 回到顶部动效)
- Modify: `src/js/app.js` (滚动进度跟踪)

- [ ] **Step 6.1: 在 index.html 的 `<body>` 开头添加进度条**

  在 `index.html` 中，`<body>` 标签之后、`<!-- 3D Decorations Layer -->` 之前添加：
  ```html
  <!-- Scroll Progress Bar -->
  <div class="scroll-progress" id="scrollProgress"></div>
  ```

- [ ] **Step 6.2: 添加进度条 CSS**

  在 `src/css/washi.css` 中 `.nav` 样式附近（约第 140 行处），添加：
  ```css
  /* ===== Scroll Progress ===== */
  .scroll-progress {
    position: fixed; top: 0; left: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--red));
    z-index: 1000; width: 0%;
    transition: width 0.1s linear;
    opacity: 0;
  }
  .scroll-progress.visible { opacity: 1; }
  ```

- [ ] **Step 6.3: 增强回到顶部按钮样式**

  找到 `src/css/washi.css` 中 `.back-to-top` 相关样式（搜索 `back-to-top`），替换为：
  ```css
  .back-to-top {
    position: fixed; bottom: 24px; right: 24px; z-index: 299;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--text); color: var(--bg); border: none;
    font-size: 1.2rem; cursor: pointer;
    opacity: 0; transform: scale(0.8);
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: var(--shadow-lg); pointer-events: none;
  }
  .back-to-top.show {
    opacity: 1; transform: scale(1); pointer-events: auto;
  }
  .back-to-top:hover { transform: scale(1.1); }
  .dark .back-to-top { background: var(--card); color: var(--text); }
  ```

- [ ] **Step 6.4: 在 app.js 中添加滚动进度逻辑**

  在 `initScrollEffects()` 方法（约第 661 行）中，在现有滚动监听逻辑内追加进度更新。找到 `nav.classList.toggle('nav-scrolled', y > 60);`（约第 669 行），在其后添加：

  ```js
  // Scroll progress
  const sp = $('scrollProgress');
  if (sp) {
    const maxY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const pct = maxY > 0 ? (y / maxY * 100) : 0;
    sp.style.width = pct + '%';
    sp.classList.toggle('visible', pct > 2);
  }

  // Back to top visibility
  const btt = $('backToTop');
  if (btt) btt.classList.toggle('show', y > 300);
  ```

---

### Task 7: 2048 页面 HTML 结构

**Files:**
- Modify: `index.html` (添加 game2048 page、桌面导航 tab、更新移动菜单)

- [ ] **Step 7.1: 在桌面导航中添加 2048 tab**

  在 `index.html` 的 `.tabs` 中 gallery tab 按钮之后添加：
  ```html
  <button class="tab" data-page="game2048">🔢 2048</button>
  ```

- [ ] **Step 7.2: 在 `</div><!-- pages -->` 之前添加 game2048 页面结构**

  在 calendar page 之后（约第 386 行的 `</div>` 关闭 pages 之前），添加：
  ```html
  <!-- GAME 2048 -->
  <div class="page" id="page-game2048">
    <div class="page-inner game2048-wrap">
      <div class="game2048-container">
        <div class="game2048-header">
          <div class="game2048-score-box">
            <div class="game2048-score-label">分数</div>
            <div class="game2048-score-num" id="g2048-score">0</div>
          </div>
          <div class="game2048-actions">
            <div class="game2048-timer">⏱ <span id="g2048-timer">00:00</span></div>
            <button class="btn ripple" id="g2048-newBtn">新游戏</button>
          </div>
        </div>
        <div class="game2048-board" id="g2048-board"></div>
        <div class="game2048-tip">← ↑ → ↓ 或 WASD · 手机上直接滑动</div>
        <div class="game2048-best" id="g2048-best"></div>
      </div>
    </div>
  </div>
  ```

- [ ] **Step 7.3: 更新移动菜单中的 2048 链接**

  找到 `index.html` 中约第 126 行：
  ```html
  <a href="games/2048.html" class="mobile-tab">🔢 2048</a>
  ```
  替换为：
  ```html
  <button class="mobile-tab" data-page="game2048">🔢 2048</button>
  ```

---

### Task 8: 2048 Liquid Glass CSS

**Files:**
- Modify: `src/css/washi.css` (追加 2048 全部样式)

- [ ] **Step 8.1: 在 washi.css 末尾添加 2048 Liquid Glass 样式**

  在 `src/css/washi.css` 最后追加：
  ```css
  /* ===== 2048 Game (Liquid Glass) ===== */
  .game2048-wrap {
    display: flex; align-items: center; justify-content: center;
    min-height: calc(100vh - 62px - 48px);
    padding: 24px;
  }
  .game2048-container {
    width: 100%; max-width: 420px;
    display: flex; flex-direction: column; gap: 16px;
    animation: fadeInUp 0.6s ease-out;
  }
  .game2048-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .game2048-score-box { text-align: center; }
  .game2048-score-label {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;
    color: var(--t3); font-weight: 600;
  }
  .game2048-score-num {
    font-size: 1.8rem; font-weight: 800; line-height: 1.2;
    color: var(--text);
  }
  .game2048-actions {
    display: flex; align-items: center; gap: 12px;
  }
  .game2048-timer {
    font-size: 0.75rem; color: var(--t2); font-weight: 600; letter-spacing: 0.5px;
  }
  .game2048-board {
    width: 100%; aspect-ratio: 1;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    padding: 12px;
    border-radius: 16px;
    /* Liquid Glass */
    background: rgba(255,255,255,0.35);
    backdrop-filter: blur(24px) saturate(1.2);
    -webkit-backdrop-filter: blur(24px) saturate(1.2);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow:
      0 4px 24px rgba(0,0,0,0.06),
      inset 0 1px 0 rgba(255,255,255,0.6);
    position: relative;
  }
  .dark .game2048-board {
    background: rgba(0,0,0,0.25);
    border-color: rgba(255,255,255,0.08);
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .game2048-board .cell {
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 1.5rem;
    transition: all 0.12s;
    position: relative;
    /* Liquid Glass cells */
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
    color: var(--text);
  }
  .dark .game2048-board .cell {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.06);
    color: var(--text);
  }
  .game2048-board .cell.pop {
    animation: pop2048 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes pop2048 {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* Tile colors — same as original but with glass adaptation */
  .game2048-board .c-2  { background: rgba(238,228,218,0.85) !important; color: #776e65 !important; }
  .game2048-board .c-4  { background: rgba(237,224,200,0.85) !important; color: #776e65 !important; }
  .game2048-board .c-8  { background: rgba(242,177,121,0.85) !important; color: #f9f6f2 !important; }
  .game2048-board .c-16 { background: rgba(245,149,99,0.85) !important; color: #f9f6f2 !important; }
  .game2048-board .c-32 { background: rgba(246,124,95,0.85) !important; color: #f9f6f2 !important; }
  .game2048-board .c-64 { background: rgba(246,94,59,0.85) !important; color: #f9f6f2 !important; }
  .game2048-board .c-128 { background: rgba(237,207,114,0.85) !important; color: #f9f6f2 !important; font-size: 1.2rem !important; }
  .game2048-board .c-256 { background: rgba(237,204,97,0.85) !important; color: #f9f6f2 !important; font-size: 1.2rem !important; }
  .game2048-board .c-512 { background: rgba(237,200,80,0.85) !important; color: #f9f6f2 !important; font-size: 1.2rem !important; }
  .game2048-board .c-1024 { background: rgba(237,197,63,0.85) !important; color: #f9f6f2 !important; font-size: 1rem !important; }
  .game2048-board .c-2048 { background: rgba(237,194,46,0.85) !important; color: #f9f6f2 !important; font-size: 1rem !important; }

  .dark .game2048-board .c-2  { background: rgba(74,74,106,0.7) !important; color: #e0e0e0 !important; }
  .dark .game2048-board .c-4  { background: rgba(90,90,122,0.7) !important; color: #e0e0e0 !important; }
  .dark .game2048-board .c-8  { background: rgba(212,149,106,0.7) !important; color: #fff !important; }
  .dark .game2048-board .c-16 { background: rgba(192,133,90,0.7) !important; color: #fff !important; }
  .dark .game2048-board .c-32 { background: rgba(176,117,74,0.7) !important; color: #fff !important; }
  .dark .game2048-board .c-64 { background: rgba(160,101,58,0.7) !important; color: #fff !important; }
  .dark .game2048-board .c-128 { background: rgba(237,207,114,0.7) !important; color: #1a1a2e !important; }
  .dark .game2048-board .c-256 { background: rgba(237,204,97,0.7) !important; color: #1a1a2e !important; }
  .dark .game2048-board .c-512 { background: rgba(237,200,80,0.7) !important; color: #1a1a2e !important; }
  .dark .game2048-board .c-1024 { background: rgba(237,197,63,0.7) !important; color: #1a1a2e !important; }
  .dark .game2048-board .c-2048 { background: rgba(237,194,46,0.7) !important; color: #1a1a2e !important; }

  .game2048-board .cell.new-tile {
    animation: tileAppear 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes tileAppear {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .game2048-tip {
    font-size: 0.72rem; color: var(--t3); text-align: center;
  }
  .game2048-best {
    font-size: 0.72rem; color: var(--t3); text-align: center;
  }

  /* Game over modal within page */
  .game2048-overlay {
    position: absolute; inset: 0; z-index: 10;
    display: none; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 16px;
  }
  .game2048-overlay.show { display: flex; }
  .game2048-overlay-box {
    background: var(--card); border-radius: 16px;
    padding: 28px; text-align: center; max-width: 240px; width: 90%;
    box-shadow: var(--shadow-lg);
    animation: fadeInUp 0.3s ease-out;
  }
  .game2048-overlay-title {
    font-size: 1.3rem; font-weight: 800; margin-bottom: 8px;
  }
  .game2048-overlay-score {
    font-size: 0.9rem; color: var(--t2); margin-bottom: 4px;
  }
  .game2048-overlay-time {
    font-size: 0.8rem; color: var(--t3); margin-bottom: 14px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .game2048-board { gap: 6px; padding: 8px; }
    .game2048-board .cell { font-size: 1.2rem; }
    .game2048-board .c-128,
    .game2048-board .c-256,
    .game2048-board .c-512 { font-size: 1rem !important; }
    .game2048-board .c-1024,
    .game2048-board .c-2048 { font-size: 0.85rem !important; }
  }
  ```

---

### Task 9: 2048 JS 逻辑移植到 App

**Files:**
- Modify: `src/js/app.js` (添加 2048 游戏属性与方法、事件绑定)

- [ ] **Step 9.1: 在 App 对象中添加 2048 相关属性**

  找到 App 对象的属性定义区（约第 10-30 行），在 `_animating: false` 之后添加：
  ```js
  // 2048 game state
  _g2048board: null,
  _g2048score: 0,
  _g2048over: false,
  _g2048timerSec: 0,
  _g2048timerId: null,
  _g2048running: false,
  _g2048prevBest: parseInt(localStorage.getItem('s2048_best'))||0,
  _g2048milestones: [128,256,512,1024,2048],
  _g2048reached: {},
  _g2048actx: null,
  _g2048KeyHandler: null,
  _g2048TouchHandler: null,
  ```

- [ ] **Step 9.2: 添加 initGame2048() 和辅助方法**

  在 `switchPage()` 方法之后、`closeMobileMenu()` 之前（约第 839 行前），添加游戏逻辑方法：

  ```js
  // ===== 2048 Game =====
  initGame2048() {
    this._g2048board = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    this._g2048AddTile();
    this._g2048AddTile();
    this._g2048over = false;
    this._g2048score = 0;
    this._g2048running = false;
    if (this._g2048timerId) clearInterval(this._g2048timerId);
    this._g2048timerSec = 0;
    $('g2048-timer').textContent = '00:00';
    for (let i = 0; i < this._g2048milestones.length; i++) {
      this._g2048reached[this._g2048milestones[i]] = false;
    }
    $('g2048-best').textContent = this._g2048prevBest ? '🏆 最高分：'+this._g2048prevBest : '';
    this._g2048Draw();
    this._g2048BindEvents();
  },

  _g2048Blank() {
    return [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  },

  _g2048Fmt(s) {
    const m = Math.floor(s/60), sec = s%60;
    return (m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
  },

  _g2048AddTile() {
    const empty = [];
    for (let y=0; y<4; y++) for (let x=0; x<4; x++) {
      if (!this._g2048board[y][x]) empty.push({x,y});
    }
    if (!empty.length) return;
    const p = empty[Math.floor(Math.random()*empty.length)];
    this._g2048board[p.y][p.x] = Math.random()<0.9 ? 2 : 4;
  },

  _g2048Draw() {
    const boardEl = $('g2048-board');
    boardEl.innerHTML = '';
    for (let y=0; y<4; y++) for (let x=0; x<4; x++) {
      const c = document.createElement('div');
      c.className = 'cell';
      const val = this._g2048board[y][x];
      if (val) { c.textContent = val; c.classList.add('c-'+val); }
      boardEl.appendChild(c);
    }
    $('g2048-score').textContent = this._g2048score;
  },

  _g2048PlayMerge(val) {
    if (!this._g2048actx) this._g2048actx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = this._g2048actx.createOscillator();
    const gain = this._g2048actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300+Math.log2(val)*40, this._g2048actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600+Math.log2(val)*60, this._g2048actx.currentTime+0.12);
    gain.gain.setValueAtTime(0.18, this._g2048actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._g2048actx.currentTime+0.12);
    osc.connect(gain); gain.connect(this._g2048actx.destination);
    osc.start(); osc.stop(this._g2048actx.currentTime+0.12);
  },

  _g2048PlayMilestone() {
    if (!this._g2048actx) this._g2048actx = new (window.AudioContext||window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let i=0; i<notes.length; i++) {
      const osc = this._g2048actx.createOscillator();
      const gain = this._g2048actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], this._g2048actx.currentTime+i*0.1);
      gain.gain.setValueAtTime(0.15, this._g2048actx.currentTime+i*0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this._g2048actx.currentTime+i*0.1+0.25);
      osc.connect(gain); gain.connect(this._g2048actx.destination);
      osc.start(this._g2048actx.currentTime+i*0.1);
      osc.stop(this._g2048actx.currentTime+i*0.1+0.25);
    }
  },

  _g2048Move(dir) {
    if (this._g2048over) return;
    let moved = false;
    const nb = this._g2048Blank();

    if (dir==='up' || dir==='down') {
      for (let x=0; x<4; x++) {
        let col = [];
        for (let y=0; y<4; y++) if (this._g2048board[y][x]) col.push(this._g2048board[y][x]);
        if (dir==='down') col.reverse();
        col = this._g2048Merge(col);
        if (dir==='down') col.reverse();
        for (let y=0; y<4; y++) { nb[y][x]=col[y]; if (nb[y][x]!==this._g2048board[y][x]) moved=true; }
      }
    } else {
      for (let y=0; y<4; y++) {
        let row = [];
        for (let x=0; x<4; x++) if (this._g2048board[y][x]) row.push(this._g2048board[y][x]);
        if (dir==='right') row.reverse();
        row = this._g2048Merge(row);
        if (dir==='right') row.reverse();
        for (let x=0; x<4; x++) { nb[y][x]=row[x]; if (nb[y][x]!==this._g2048board[y][x]) moved=true; }
      }
    }

    if (!moved) return;
    if (!this._g2048running) {
      this._g2048running = true;
      this._g2048timerId = setInterval(() => {
        this._g2048timerSec++;
        $('g2048-timer').textContent = this._g2048Fmt(this._g2048timerSec);
      }, 1000);
    }
    this._g2048board = nb;
    this._g2048AddTile();
    this._g2048Draw();
    this._g2048Check();
  },

  _g2048Merge(arr) {
    for (let i=0; i<arr.length-1; i++) {
      if (arr[i]===arr[i+1]) {
        const val = arr[i]*2;
        arr[i] = val;
        this._g2048score += val;
        arr.splice(i+1, 1);
        this._g2048PlayMerge(val);
        for (let m=0; m<this._g2048milestones.length; m++) {
          if (val>=this._g2048milestones[m] && !this._g2048reached[this._g2048milestones[m]]) {
            this._g2048reached[this._g2048milestones[m]] = true;
            this._g2048PlayMilestone();
            this.toast('🎉 达到 '+this._g2048milestones[m]+' 分！', 'success');
          }
        }
      }
    }
    while (arr.length < 4) arr.push(0);
    return arr;
  },

  _g2048Check() {
    for (let y=0; y<4; y++) for (let x=0; x<4; x++) if (!this._g2048board[y][x]) return;
    for (let y=0; y<4; y++) for (let x=0; x<4; x++) {
      if (x<3 && this._g2048board[y][x]===this._g2048board[y][x+1]) return;
      if (y<3 && this._g2048board[y][x]===this._g2048board[y+1][x]) return;
    }
    this._g2048over = true;
    if (this._g2048timerId) clearInterval(this._g2048timerId);
    const finalScore = this._g2048score;
    if (finalScore > this._g2048prevBest) {
      localStorage.setItem('s2048_best', finalScore);
      this._g2048prevBest = finalScore;
    }
    this._g2048ShowOverlay(finalScore);
  },

  _g2048ShowOverlay(score) {
    // Remove any existing overlay
    const oldOv = document.querySelector('.game2048-overlay');
    if (oldOv) oldOv.remove();

    const board = $('g2048-board');
    const ov = document.createElement('div');
    ov.className = 'game2048-overlay show';
    ov.innerHTML =
      '<div class="game2048-overlay-box">'+
      '<div class="game2048-overlay-title">游戏结束 🎯</div>'+
      '<div class="game2048-overlay-score">得分：<strong>'+score+'</strong></div>'+
      '<div class="game2048-overlay-time">用时：'+this._g2048Fmt(this._g2048timerSec)+'</div>'+
      '<button class="btn btn-p ripple" id="g2048-retryBtn">再来一局</button>'+
      '</div>';
    board.appendChild(ov);
    $('g2048-retryBtn').onclick = () => this.initGame2048();
  },

  _g2048BindEvents() {
    // Keyboard events — only when game2048 is active
    const handler = (e) => {
      if (!document.getElementById('page-game2048')?.classList.contains('active')) return;
      const map = {
        'w':'up','ArrowUp':'up',
        's':'down','ArrowDown':'down',
        'a':'left','ArrowLeft':'left',
        'd':'right','ArrowRight':'right'
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); this._g2048Move(dir); }
    };
    document.removeEventListener('keydown', this._g2048KeyHandler);
    this._g2048KeyHandler = handler;
    document.addEventListener('keydown', handler);

    // Touch swipe
    const boardEl = $('g2048-board');
    boardEl.removeEventListener('touchstart', this._g2048TouchHandler);
    let sx=0, sy=0;
    this._g2048TouchHandler = (e) => {
      if (e.type === 'touchstart') {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      } else if (e.type === 'touchend') {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < 20) return;
        if (ax > ay) this._g2048Move(dx > 0 ? 'right' : 'left');
        else this._g2048Move(dy > 0 ? 'down' : 'up');
      }
    };
    boardEl.addEventListener('touchstart', this._g2048TouchHandler);
    boardEl.addEventListener('touchend', this._g2048TouchHandler);

    // New game button
    $('g2048-newBtn').onclick = () => this.initGame2048();
  },
  ```

- [ ] **Step 9.3: 在 init() 中初始化 _g2048reached**

  在 `init()` 方法开头（约第 67 行），`this.store = new Store(...)` 之后添加：
  ```js
  this._g2048reached = {};
  ```

---

### Task 10: 暗色模式平滑过渡

**Files:**
- Modify: `src/css/washi.css` (body 及主要容器 transition)

- [ ] **Step 10.1: 给 body 和主要容器添加 transition**

  找到 `:root` CSS 变量定义之后的 `body` 选择器（约第 140 行附近），在现有 body 规则中添加 `transition`：
  ```css
  body {
    ...
    transition: background-color 0.4s ease, color 0.4s ease;
  }
  ```

  找到 `.nav` 选择器（约第 145 行），在现有规则中添加：
  ```css
  .nav { transition: background-color 0.4s ease, border-color 0.4s ease; }
  ```

  找到 `.card` 或相关容器选择器（搜索 `.page-inner` / `.modal-box` 等），酌情添加 `transition`。最简单的方案是在全局 `*` 上不要加，而是利用 CSS 变量继承——`:root` 的变量变化会自动触发继承元素的 transition。

  确保以下规则存在：
  ```css
  body { transition: background-color 0.4s ease, color 0.4s ease; }
  .nav { transition: background-color 0.4s ease, border-color 0.4s ease; }
  .toast { /* already has transition */ }
  .game2048-board { transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease; }
  ```

---

### Task 11: 最终集成与验证

**Files:**
- No file changes — verification only

- [ ] **Step 11.1: 验证 index.html 结构完整性**

  确认：
  - `.tab-indicator` 存在于 `.tabs` 内
  - `#page-game2048` 存在于 `.pages` 内
  - 桌面导航包含 2048 tab
  - 移动菜单 2048 改为 `<button data-page="game2048">`
  - `#scrollProgress` 存在于 `<body>` 开头

- [ ] **Step 11.2: 验证 app.js 无语法错误**

  在浏览器中用开发者工具打开，检查 Console 无报错。
  - `switchPage()` 正常切换
  - `updateTabIndicator()` 正确定位指示器
  - 2048 页面可玩、键盘/触摸操作正常
  - Toast 支持堆叠显示
  - 滚动进度条跟随滚动

- [ ] **Step 11.3: 验证暗色模式**

  点击主题切换按钮，确认：
  - 背景/文字颜色平滑过渡（非突变）
  - 2048 棋盘适配暗色玻璃效果
  - Tab 指示器颜色在暗色下正常

- [ ] **Step 11.4: 验证 prefers-reduced-motion**

  在浏览器 DevTools Rendering 面板中开启 `prefers-reduced-motion: reduce`，切换页面确认无动画直接跳转。
