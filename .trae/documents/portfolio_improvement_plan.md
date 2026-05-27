# 个人作品集网站优化计划

## 一、需求总结

### 1.1 画廊查看器滑动修复
- **问题**：点击图片查看时，文字描述区域无法滚动阅读
- **目标**：允许用户滚动查看长文字描述

### 1.2 诗词轮播添加人物形象
- **目标**：为诗词轮播添加古典人物插图/emoji，增加趣味性
- **实现方式**：使用 emoji 或 CSS 绘制的简单人物图形

### 1.3 首页精选展示优化
- **目标**：
  - "欢迎来到我的作品网页" 用漫画气泡样式
  - 作品精选用黄色实心五角星 ⭐ 标记
  - 不遮挡内部文字
- **实现**：优化 `.hp-work` 和 `.hp-article` 样式

### 1.4 文章详情支持图片
- **目标**：文章详情弹窗支持显示图片
- **实现**：修改 `showArticleDetail` 函数，渲染 `<img>` 标签
- **支持**：本地 base64 图片和 URL 图片

### 1.5 About 页面改进建议
- **建议添加**：
  1. **技能熟练度条** - 可视化技能等级
  2. **个人成就徽章** - 展示获得的证书/奖项
  3. **项目统计** - 作品总数、文章数量等可视化
  4. **工作时间线** - 展示工作时间轴
  5. **性格特点/爱好** - 更展示个人魅力
  6. **音乐/阅读/游戏** - 展示个人兴趣

---

## 二、当前状态分析

### 2.1 画廊查看器问题定位
**文件**：`src/css/washi.css` (L692-L722)
```css
.gv-meta {
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 14px 20px;
  max-width: 600px;
  width: 100%;
  text-align: center;
}
```
**问题**：`gv-meta` 固定了高度但没有设置 overflow，用户无法滚动长文字

### 2.2 首页精选展示
**文件**：`src/js/app.js` (L283-L317) - `renderHomePreview`
**文件**：`src/css/washi.css` (L145-L178)
- 当前没有特殊标记区分精选和非精选
- 需要添加五角星标记

### 2.3 文章详情
**文件**：`src/js/app.js` (L454-L468) - `showArticleDetail`
- 当前只渲染纯文本
- 需要支持图片渲染

---

## 三、实施计划

### 3.1 画廊查看器滑动修复

**文件**：`src/css/washi.css`

**修改内容**：
```css
.gv-meta {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 14px 20px;
  max-width: 600px;
  width: 100%;
  max-height: 200px; /* 新增：限制最大高度 */
  overflow-y: auto;   /* 新增：允许垂直滚动 */
  text-align: center;
  /* 新增：美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) transparent;
}
```

### 3.2 诗词轮播添加人物形象

**文件**：`src/js/app.js`

**修改内容**：
1. 在 HTML 中添加人物容器：
```html
<div class="poetry-carousel" id="poetryCarousel">
  <div class="poetry-character">👘</div>  <!-- 新增 -->
  <div class="poetry-content">
    ...
  </div>
  ...
</div>
```

2. 添加 CSS 样式：
```css
.poetry-character {
  font-size: 3rem;
  margin-bottom: 8px;
  animation: characterFloat 3s ease-in-out infinite;
}
@keyframes characterFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

3. 修改 `_renderPoetry` 函数，让不同诗词显示不同人物：
- 山水诗 → 🏔️🌊
- 思乡诗 → 🌙🏠
- 爱情诗 → 💕🌹
- 其他 → 👘🎋

### 3.3 首页精选展示优化

**文件**：`src/js/app.js` (renderHomePreview)

**修改作品预览渲染逻辑**：
```javascript
// 为精选作品添加五角星标记
const workHtml = featuredWorks.map(w => `
  <div class="hp-work ${w.featured ? 'featured' : ''}">
    ${w.featured ? '<span class="star-badge">⭐</span>' : ''}
    <span class="hp-w-title">${esc(w.title)}</span>
    <div class="hp-w-tags">${w.tags.slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
  </div>
`).join('');
```

**文件**：`src/css/washi.css`

**修改欢迎气泡样式**：
```css
.speech-bubble {
  background: linear-gradient(135deg, #fff 0%, #f8f8f8 100%);
  border: 2px solid var(--gold);
  border-radius: 20px 20px 20px 4px;
  padding: 12px 20px;
  font-size: 1rem;
  color: var(--text);
  box-shadow: 0 4px 20px rgba(184,148,92,0.2);
  /* 漫画气泡效果 */
  position: relative;
  animation: bubbleBounce 2s ease-in-out infinite;
}

@keyframes bubbleBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

**添加五角星标记样式**：
```css
.star-badge {
  color: #FFD700;
  font-size: 1rem;
  text-shadow: 0 0 8px rgba(255,215,0,0.6);
  animation: starPulse 1.5s ease-in-out infinite;
}

@keyframes starPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}
```

### 3.4 文章详情支持图片

**文件**：`src/js/app.js` (showArticleDetail)

**修改函数实现**：
```javascript
showArticleDetail(id) {
  const a = this.store.data.articles.find(x => x.id === id);
  if (!a) return;

  let contentHtml = '';

  // 支持图片和文本混合渲染
  if (a.content) {
    // 检测内容中是否包含图片URL
    const imgPattern = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))|data:image\/[^;]+;base64,[^\s]+/gi;
    let lastIndex = 0;
    let match;

    while ((match = imgPattern.exec(a.content)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        contentHtml += `<p>${esc(a.content.slice(lastIndex, match.index))}</p>`;
      }
      // 添加图片
      contentHtml += `<img src="${match[0]}" alt="文章图片" style="max-width:100%;border-radius:8px;margin:12px 0;">`;
      lastIndex = match.index + match[0].length;
    }
    // 添加剩余文本
    if (lastIndex < a.content.length) {
      contentHtml += `<p>${esc(a.content.slice(lastIndex))}</p>`;
    }
  }

  this.modal({
    title: '📝 ' + esc(a.title),
    body: `
      <div style="font-size:0.8rem;color:var(--t3);margin-bottom:12px">
        ${a.date ? esc(a.date) : ''} ${a.category ? '· ' + esc(a.category) : ''}
      </div>
      <div style="line-height:1.8;font-size:0.9rem">${contentHtml}</div>
    `,
    footer: [{label:'关闭',cls:'btn-s'}],
  });
}
```

**文件**：`src/css/washi.css`

**添加文章图片样式**：
```css
.modal-b img {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}
.modal-b img:hover {
  transform: scale(1.02);
  cursor: zoom-in;
}
```

---

## 四、About 页面改进建议（可选实施）

### 4.1 技能熟练度可视化
```css
.skill-bar {
  height: 8px;
  background: var(--b2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}
.skill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--red), var(--gold));
  border-radius: 4px;
  transition: width 1s ease;
}
```

### 4.2 个人成就徽章
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--gold), #DAA520);
  color: #fff;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(184,148,92,0.3);
}
```

---

## 五、风险评估

| 风险点 | 等级 | 应对措施 |
|--------|------|----------|
| CSS 样式冲突 | 低 | 使用独立的类名，避免覆盖现有样式 |
| 图片正则匹配 | 低 | 使用可靠的 URL 检测正则表达式 |
| 动画性能影响 | 低 | 使用 transform 和 opacity 确保 GPU 加速 |
| 数据格式兼容 | 低 | 添加空值检查，确保旧数据正常显示 |

---

## 六、验证步骤

1. **画廊查看器**：打开画廊，点击图片，滚动文字描述区域
2. **诗词轮播**：切换诗词，确认人物形象正确显示
3. **首页精选**：检查作品和文章是否有五角星标记
4. **文章图片**：编辑文章添加图片 URL，确认详情页显示正常

---

## 七、文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/css/washi.css` | 样式修改 | 画廊滑动、诗词人物、精选标记、文章图片 |
| `src/js/app.js` | 功能修改 | 诗词人物渲染、精选标记、文章图片支持 |
| `index.html` | 结构修改 | 诗词模块添加人物容器 |
| `data.json` | **不修改** | 保护用户数据 |

---

## 八、注意事项

- ⚠️ **不修改 data.json** - 保护所有用户数据
- ⚠️ **不修改 OSS 逻辑** - 保持云端同步功能
- ⚠️ **不 git push** - 仅本地修改，需要用户确认后再发布
- ✅ 渐进式增强 - 降级友好，无图片时正常显示文本
