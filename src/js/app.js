/* ===== app.js v2 ===== */
(function() {
'use strict';

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function $(id) { return document.getElementById(id); }

const EDIT_PW = '1';

const App = {
  editMode: false,
  theme: 'light',
  store: null,
  obs: null,
  activeTag: '',
  activeCategory: '',
  searchWorks: '',
  searchArticles: '',
  _gvList: [],
  _gvIdx: 0,
  _qiniuConnected: false,
  _qiniuDomain: '',
  _qiniuBucket: '',
  _qiniuAk: '',
  _qiniuSk: '',
  _qiniuBusy: false,
  _qiniuLastSync: '',
  genId: () => 'i_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),

  defaults: {
    profile: {
      name:'Your Name', title:'Designer / Developer',
      bio:'Crafting digital experiences with code and creativity.',
      about:'热爱设计 & 开发，专注于构建美观且实用的数字产品。',
      avatar:'',
      contacts:[{icon:'✉',label:'hello@example.com'},{icon:'📍',label:'Shanghai'}],
      socials:[{icon:'🐙',label:'GitHub',url:'https://github.com'},{icon:'📺',label:'Bilibili',url:'https://bilibili.com'}],
    },
    skills:['UI/UX','Frontend','React','JavaScript','CSS'],
    works:[
      {id:'w1',title:'Project Alpha',desc:'一个融合传统文化与现代设计的数字交互项目。',tags:['Design','Frontend'],links:[{label:'GitHub',url:'https://github.com'}],order:0,featured:true},
      {id:'w2',title:'FocusTask Pro',desc:'极智任务管理工具，支持 NLP 解析、番茄钟。',tags:['Productivity','JavaScript'],links:[{label:'GitHub',url:'https://github.com'}],order:1,featured:true},
      {id:'w3',title:'Washi Portfolio',desc:'以京都和纸为灵感的全屏动画作品展示站。',tags:['CSS','Creative'],links:[{label:'View',url:'#'}],order:2,featured:false},
    ],
    articles:[
      {id:'a1',title:'从和纸美学到现代网页设计',date:'2026-05-20',url:'',category:'设计',content:'和纸（Washi）是日本传统手工纸，以其独特的纹理和温润的质感闻名。本文将探讨如何将和纸美学融入现代网页设计，从色彩、纹理到光影效果，营造出兼具传统韵味与现代感的数字体验。',featured:true},
      {id:'a2',title:'scroll-snap 全屏滚动实践',date:'2026-05-15',url:'',category:'技术',content:'CSS scroll-snap 提供了一种声明式的方式来实现滚动捕捉效果。本文记录在实际项目中使用 scroll-snap 的踩坑经历，包括兼容性处理、与 JavaScript 滚动的交互问题，以及最终的替代方案。',featured:true},
      {id:'a3',title:'CSS 入场动画技巧',date:'2026-05-10',url:'',category:'技术',content:'好的入场动画能大幅提升用户体验。本文分享几种实用的 CSS 动画技巧：使用 IntersectionObserver 触发滚动动画、stagger 延迟实现级联效果、cubic-bezier 调出自然动感。',featured:false},
    ],
    gallery:[],
    experience:[
      {id:'e1',year:'2024',title:'Senior Designer',subtitle:'Design Studio',desc:'Led product design team, shipped 10+ products.'},
      {id:'e2',year:'2022',title:'Frontend Developer',subtitle:'Tech Co.',desc:'Built web apps with React and TypeScript.'},
    ],
    education:[
      {id:'ed1',year:'2020',title:'B.Des in Design',subtitle:'University',desc:'Graduated with honors.'},
    ],
    quotes:[
      '写代码就像泡茶，水温要刚好。',
      '设计不是让它看起来怎么样，而是让它用起来怎么样。',
      'Bug 不是程序的错误，是程序在跟你开玩笑。',
    ],
  },

  init() {
    try {
      this.store = new Store('portfolio_data', this.defaults, () => {
        if (this._qiniuConnected) this._qiniuSave();
      });
      // Migrate skills from profile to global
      const d = this.store.data;
      if (d.profile && d.profile.skills && !d.skills) {
        d.skills = d.profile.skills;
      }
      // Migrate featured field for works/articles
      (d.works||[]).forEach(w => { if (w.featured === undefined) w.featured = false; });
      (d.articles||[]).forEach(a => { if (a.featured === undefined) a.featured = false; });
      this.obs = new IntersectionObserver(e=>{e.forEach(e=>{if(e.isIntersecting)e.target.classList.add('iv');})},{threshold:0.05});
      this.render();
      this.bind();
      this.loadTheme();
      this.switchPage('home');
      this.initScrollEffects();
      this.generatePageDecorations();
      this._qiniuInit();
    } catch(e) { console.error('init error:', e); }
    // Easter eggs
    this._initEasterEggs();
  },

  _initEasterEggs() {
    const style = 'font-size:20px;font-weight:bold;color:#C73E3A';
    console.log('%c🍵 谢谢你看到了这里。', style);
    console.log('%c这个网站从崩溃到重生，感谢它的主人没有放弃它。', 'font-size:13px;color:#B8945C');
    console.log('%c以及，Claude 知错了。真的。', 'font-size:12px;color:#8C8884');

    // Logo 5-click → party mode
    let logoClick = 0;
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', () => {
        logoClick++;
        if (logoClick >= 5) {
          logoClick = 0;
          this._partyMode();
        }
        clearTimeout(logo._timer);
        logo._timer = setTimeout(() => { logoClick = 0; }, 2000);
      });
    }

    // Keyboard "thanks" → 🎉
    let seq = '';
    document.addEventListener('keydown', (e) => {
      seq += e.key.toLowerCase();
      seq = seq.slice(-6);
      if (seq === 'thanks') {
        seq = '';
        this._partyMode();
      }
    });
  },

  _partyMode() {
    const colors = ['#C73E3A','#B8945C','#E8D5B5','#333','#F0EFEC','#4CAF50','#FF9800','#9C27B0'];
    let i = 0;
    const interval = setInterval(() => {
      document.body.style.transition = 'all 0.3s ease';
      document.body.style.background = colors[i % colors.length];
      document.body.style.color = i % 2 === 0 ? '#333' : '#F0EFEC';
      i++;
      if (i >= 16) {
        clearInterval(interval);
        document.body.style.background = '';
        document.body.style.color = '';
      }
    }, 200);
    this.toast('🎉 彩蛋触发！', 3000);
  },

  // ===== RENDER =====
  render() {
    try {
      this.renderProfile();
      this.renderWorks();
      this.renderArticles();
      this.renderSocial();
      this.renderHomePreview();
      this.renderAboutExtras();
    } catch(e) { console.error('render error:', e); }
  },

  renderProfile() {
    const d = this.store.data.profile;
    $('dispName').textContent = d.name;
    $('dispTitle').textContent = d.title;
    $('dispBio').textContent = d.bio;
    $('aboutBio').textContent = d.about;

    const avs = [$('avDisplay'), $('avAbout')];
    avs.forEach(el => {
      el.innerHTML = d.avatar ? `<img src="${esc(d.avatar)}" alt="">` : esc(d.name[0]||'👤');
    });

    $('skillsTags').innerHTML = this._skills().map((s,i)=>
      `<span class="tag" data-i="${i}">${esc(s)}</span>`
    ).join('') + (this.editMode ? '<span class="tag tag-add" id="skillAdd">+ 添加</span>' : '');

    $('contactsList').innerHTML = d.contacts.map((c,i)=>
      `<div class="contact" data-i="${i}"><span>${c.icon}</span><span>${esc(c.label)}</span></div>`
    ).join('');

    this.observeAll($('skillsTags').children);
    this.observeAll($('contactsList').children);
    this.renderHomePreview();
  },

  renderWorks() {
    const ws = this.store.data.works.sort((a,b)=>a.order-b.order);
    const g = $('wGrid');

    // Filter bar (inserted before grid)
    let fc = $('wFilterContainer');
    if (!fc) {
      fc = document.createElement('div'); fc.id = 'wFilterContainer';
      g.parentNode.insertBefore(fc, g);
    }
    const allTags = [...new Set(ws.flatMap(w=>w.tags||[]))];
    if (this.activeTag && !allTags.includes(this.activeTag)) this.activeTag = '';
    fc.innerHTML = '<div class="filter-bar" id="wFilter"><button class="filter-btn' + (!this.activeTag?' active':'') + '" data-filter="">全部</button>' + allTags.map(t => `<button class="filter-btn${this.activeTag===t?' active':''}" data-filter="${esc(t)}">${esc(t)}</button>`).join('') + '</div>';

    if (!ws.length) { $('wEmpty').style.display=''; g.innerHTML=''; return; }
    $('wEmpty').style.display='none';

    let filtered = this.activeTag ? ws.filter(w=>(w.tags||[]).includes(this.activeTag)) : ws;
    if (this.searchWorks) {
      const q=this.searchWorks.toLowerCase();
      filtered=filtered.filter(w=>w.title.toLowerCase().includes(q)||(w.desc||'').toLowerCase().includes(q)||(w.tags||[]).some(t=>t.toLowerCase().includes(q)));
    }

    let html = (filtered.length ? filtered.map(w=>`
      <div class="w-card${w.featured?' w-featured':''}" data-id="${w.id}"${this.editMode?' draggable="true"':''}>
        ${!this.editMode&&w.featured?'<div class="w-featured-badge">★ 精选</div>':''}
        <div class="w-card-acts">
          ${this.editMode?`<button class="w-card-btn${w.featured?' featured':''}" data-act="fw" data-id="${w.id}">${w.featured?'★':'☆'}</button>`:''}
          <button class="w-card-btn" data-act="ew" data-id="${w.id}">✎</button>
          <button class="w-card-btn del" data-act="dw" data-id="${w.id}">✕</button>
        </div>
        ${w.image?`<div class="w-card-img"><img src="${esc(w.image)}" alt="" loading="lazy"></div>`:''}
        <div class="w-card-title">${esc(w.title)}</div>
        ${w.date?`<div class="w-card-date">${esc(w.date)}</div>`:''}
        <div class="w-card-desc">${esc(w.desc)}</div>
        ${w.tags?.length ? `<div class="w-tags">${w.tags.map(t=>`<span class="w-tag">${esc(t)}</span>`).join('')}</div>`:''}
        ${w.links?.length ? `<div class="w-links">${w.links.map(l=>`<a href="${esc(l.url)}" class="w-link" target="_blank">🔗 ${esc(l.label)}</a>`).join('')}</div>`:''}
      </div>
    `).join('') : '<div class="filter-empty">没有匹配的作品</div>');
    if (this.editMode) html += `<div class="w-add" id="wAdd">+ 添加作品</div>`;
    g.innerHTML = html;
    if (this.editMode) g.querySelectorAll('.w-card-btn, .w-link').forEach(el=>el.draggable=false);
    this.observeAll(g.querySelectorAll('.w-card'));
  },

  renderArticles() {
    const as = this.store.data.articles;
    const l = $('aList');

    // Category filter bar
    const cats = [...new Set(as.map(a=>a.category||'').filter(Boolean))];
    if (this.activeCategory && !cats.includes(this.activeCategory)) this.activeCategory = '';
    let filterHtml = '<div class="filter-bar" id="aFilter"><button class="filter-btn' + (!this.activeCategory?' active':'') + '" data-filter="">全部</button>' + cats.map(c => `<button class="filter-btn${this.activeCategory===c?' active':''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('') + '</div>';

    if (!as.length) { $('aEmpty').style.display=''; l.innerHTML=filterHtml; return; }
    $('aEmpty').style.display='none';

    let filtered = this.activeCategory ? as.filter(a=>(a.category||'')===this.activeCategory) : as;
    if (this.searchArticles) {
      const q=this.searchArticles.toLowerCase();
      filtered=filtered.filter(a=>a.title.toLowerCase().includes(q)||(a.category||'').toLowerCase().includes(q));
    }

    l.innerHTML = filterHtml + (filtered.length ? filtered.map(a=>
      `<div class="a-item${a.featured?' a-featured':''}" data-id="${a.id}"${this.editMode?' draggable="true"':''}>
        <span class="a-date">${a.date}</span>
        <span class="a-title">${esc(a.title)}${!this.editMode&&a.featured?' <span class="a-featured-star">★</span>':''}</span>
        ${a.url?`<a href="${esc(a.url)}" class="a-ext-link" target="_blank">Read →</a>`:''}
        <div class="a-acts">
          ${this.editMode?`<button class="a-btn${a.featured?' featured':''}" data-act="fa" data-id="${a.id}">${a.featured?'★':'☆'}</button>`:''}
          <button class="a-btn" data-act="ea" data-id="${a.id}">✎</button>
          <button class="a-btn del" data-act="da" data-id="${a.id}">✕</button>
        </div>
      </div>`
    ).join('') : '<div class="filter-empty">没有匹配的文章</div>');
    if (this.editMode) l.innerHTML += '<div class="w-add" id="aAdd">+ 添加文章</div>';
    if (this.editMode) l.querySelectorAll('.a-btn').forEach(el=>el.draggable=false);
    this.observeAll(l.querySelectorAll('.a-item'));
  },

  renderSocial() {
    const s = this.store.data.profile.socials;
    [$('heroSoc'), $('ftSoc')||null].forEach(el=>{
      if (!el) return;
      el.innerHTML = s.map(x=>`<a href="${esc(x.url)}" class="soc" target="_blank" title="${esc(x.label)}">${x.icon}</a>`).join('');
    });
  },

  renderHomePreview() {
    const d = this.store.data;
    // Works preview: featured items, fallback to top 3
    let ws = d.works.filter(w=>w.featured).sort((a,b)=>a.order-b.order);
    if (!ws.length) ws = d.works.sort((a,b)=>a.order-b.order).slice(0,3);
    if (ws.length) {
      $('hpWorks').innerHTML = ws.map(w => `
        <div class="hp-work" data-id="${w.id}">
          <span class="hp-w-title">${esc(w.title)}</span>
          ${w.tags?.length ? `<div class="hp-w-tags">${w.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>` : ''}
        </div>
      `).join('');
    } else {
      $('hpWorks').innerHTML = '<div style="color:var(--t3);font-size:0.8rem">暂无作品</div>';
    }
    // Articles preview: featured items, fallback to top 3
    let as = d.articles.filter(a=>a.featured);
    if (!as.length) as = d.articles.slice(0,3);
    if (as.length) {
      $('hpArticles').innerHTML = as.map(a => `
        <div class="hp-article" data-id="${a.id}">
          <span class="hp-a-date">${a.date||''}</span>
          <span class="hp-a-title">${esc(a.title)}</span>
        </div>
      `).join('');
    } else {
      $('hpArticles').innerHTML = '<div style="color:var(--t3);font-size:0.8rem">暂无文章</div>';
    }
    // Skills
    $('hpSkills').innerHTML = this._skills().map(s => `<span class="tag">${esc(s)}</span>`).join('');
    // Observe animations
    this.observeAll($('hpWorks').children);
    this.observeAll($('hpArticles').children);
    this.observeAll($('hpSkills').children);
  },

  observeAll(els) {
    Array.from(els).forEach(el=>{ el.classList.add('ar'); this.obs.observe(el); });
  },

  // ===== GALLERY =====
  renderGallery() {
    const g = this.store.data.gallery.sort((a,b)=> (b.date||'') < (a.date||'') ? -1 : 1);
    const grid = $('gGrid');
    if (!g.length) {
      $('gEmpty').style.display=this.editMode?'none':'';
      grid.innerHTML=this.editMode?'<div class="w-add" id="gAdd">+ 添加图片</div>':'';
      return;
    }
    $('gEmpty').style.display='none';
    let html = g.map(img => {
      const image = img.image || img.url || '';
      return `
      <div class="w-card g-card" data-id="${img.id}"${this.editMode?' draggable="true"':''}>
        ${this.editMode?`<div class="w-card-acts"><button class="w-card-btn" data-act="eg" data-id="${img.id}">✎</button><button class="w-card-btn del" data-act="dg" data-id="${img.id}">✕</button></div>`:''}
        ${image?`<div class="w-card-img"><img src="${esc(image)}" alt="" loading="lazy"></div>`:''}
        <div class="w-card-title">${esc(img.title)}</div>
        ${img.date?`<div class="w-card-date">${esc(img.date)}</div>`:''}
        <div class="w-card-desc">${esc(img.desc || img.caption || '')}</div>
        ${img.tags?.length ? `<div class="w-tags">${img.tags.map(t=>`<span class="w-tag">${esc(t)}</span>`).join('')}</div>`:''}
        ${img.links?.length ? `<div class="w-links">${img.links.map(l=>`<a href="${esc(l.url)}" class="w-link" target="_blank">🔗 ${esc(l.label)}</a>`).join('')}</div>`:''}
      </div>`;
    }).join('');
    if (this.editMode) html += '<div class="w-add" id="gAdd">+ 添加图片</div>';
    grid.innerHTML = html;
    this.observeAll(grid.querySelectorAll('.w-card'));
  },

  modalGalleryImage(id) {
    if (!this.editMode) { this.toast('请先开启编辑模式'); return; }
    const img = id ? this.store.data.gallery.find(x=>x.id===id) : null;
    const isE = !!img;
    const links = img?.links?.length ? img.links : [{label:'',url:''}];
    const image = img?.image || img?.url || '';

    this.modal({
      title: isE ? '✎ 编辑图片' : '🖼 添加图片',
      body: `
        <div class="fg"><label>标题</label><input id="gf_t" value="${esc(img?.title||'')}"></div>
        <div class="fg"><label>日期</label><input id="gf_date" type="date" value="${img?.date || new Date().toISOString().split('T')[0]}"></div>
        <div class="fg"><label>描述</label><textarea id="gf_d" rows="4">${esc(img?.desc||img?.caption||'')}</textarea></div>
        <div class="fg"><label>图片 <span style="font-weight:400;color:var(--t3)">(URL 或上传)</span></label><input id="gf_img" value="${esc(image)}" placeholder="图片 URL"><input type="file" id="gf_file" accept="image/*" style="margin-top:4px;font-size:0.8rem;color:var(--t2)"></div>
        <div class="fg"><label>标签（逗号分隔）</label><input id="gf_tags" value="${esc((img?.tags||[]).join(', '))}"></div>
        <div class="fg"><label>链接</label><div id="gf_links">${links.map(l=>`<div class="link-e"><input placeholder="名称" value="${esc(l.label)}"><input placeholder="URL" value="${esc(l.url)}"><button class="link-rm">✕</button></div>`).join('')}</div><button class="add-link" id="gf_al">+ 添加链接</button></div>
      `,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:isE?'保存':'添加',cls:'btn-p',action:()=>{
          const title=$('gf_t').value.trim()||'Untitled';
          const image=$('gf_img').value.trim();
          if(!image){this.toast('请填写图片 URL 或上传');return;}
          const data={title,desc:$('gf_d').value.trim(),image,date:$('gf_date').value,tags:$('gf_tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean),links:this._glinks()};
          if(isE){Object.assign(img,data);this.store.save();this.renderGallery();this.closeModal();this.toast('✅ 已更新');}
          else{data.id=this.genId();data.order=Date.now();this.store.data.gallery.push(data);this.store.save();this.renderGallery();this.closeModal();this.toast('✅ 已添加');}
        }},
      ],
      onOpen:()=>{
        this._gbind();
        $('gf_file').onchange=function(){
          const f=this.files[0]; if(!f) return;
          const r=new FileReader();
          r.onload=e=>{$('gf_img').value=e.target.result;};
          r.readAsDataURL(f);
        };
      },
    });
  },

  delGalleryImage(id) {
    if (!confirm('确认删除此图片？')) return;
    this.store.data.gallery = this.store.data.gallery.filter(img=>img.id!==id);
    this.store.save(); this.renderGallery(); this.toast('已删除');
  },

  showGalleryDetail(id) {
    if (this.editMode) return;
    const img = this.store.data.gallery.find(x=>x.id===id);
    if (!img) return;
    const image = img.image || img.url || '';
    this.modal({
      wide: true,
      title: `🖼 ${img.title}`,
      body: `
        ${image?`<div style="margin:-14px -20px 14px;border-radius:10px 10px 0 0;overflow:hidden;max-height:300px"><img src="${esc(image)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`:''}
        ${(img.desc||img.caption)?`<div style="font-size:0.88rem;line-height:1.8;color:var(--t2)">${esc(img.desc||img.caption)}</div>`:''}
        ${img.tags?.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:12px">${img.tags.map(t=>`<span class="w-tag">${esc(t)}</span>`).join('')}</div>`:''}
        ${img.links?.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid var(--b2)">${img.links.map(l=>`<a href="${esc(l.url)}" class="w-link" target="_blank">🔗 ${esc(l.label)}</a>`).join('')}</div>`:''}
      `,
      footer: [{label:'关闭',cls:'btn-s',action:()=>this.closeModal()}],
    });
  },

  _glinks() {
    return Array.from(document.querySelectorAll('#gf_links .link-e')).map(el=>{
      const ins=el.querySelectorAll('input');
      return {label:ins[0]?.value.trim()||'',url:ins[1]?.value.trim()||''};
    }).filter(l=>l.label&&l.url);
  },
  _gbind() {
    const c=$('gf_links');
    c.addEventListener('click',e=>{
      if(e.target.closest('.link-rm')) {
        const en=e.target.closest('.link-e');
        if(c.children.length>1) en.remove(); else en.querySelectorAll('input').forEach(i=>i.value='');
      }
    });
    $('gf_al').addEventListener('click',()=>{
      const d=document.createElement('div'); d.className='link-e';
      d.innerHTML='<input placeholder="名称"><input placeholder="URL"><button class="link-rm">✕</button>';
      c.appendChild(d);
    });
  },

  // ===== DETAIL VIEWS =====
  showWorkDetail(id) {
    if (this.editMode) return;
    const w = this.store.data.works.find(x=>x.id===id);
    if (!w) return;
    this.modal({
      wide: true,
      title: `📦 ${w.title}`,
      body: `
        ${w.image?`<div style="margin:-14px -20px 14px;border-radius:10px 10px 0 0;overflow:hidden;max-height:240px;cursor:zoom-in" onclick="App.showWorkGalleryViewer('${w.id}')"><img src="${esc(w.image)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`:''}
        <div style="font-size:0.88rem;line-height:1.8;color:var(--t2)">${esc(w.desc)}</div>
        ${w.tags?.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:12px">${w.tags.map(t=>`<span class="w-tag">${esc(t)}</span>`).join('')}</div>`:''}
        ${w.links?.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid var(--b2)">${w.links.map(l=>`<a href="${esc(l.url)}" class="w-link" target="_blank">🔗 ${esc(l.label)}</a>`).join('')}</div>`:''}
      `,
      footer: [{label:'关闭',cls:'btn-s',action:()=>this.closeModal()}],
    });
  },

  showArticleDetail(id) {
    if (this.editMode) return;
    const a = this.store.data.articles.find(x=>x.id===id);
    if (!a) return;
    this.modal({
      wide: true,
      title: `📝 ${a.title}`,
      body: `
        <div style="font-size:0.78rem;color:var(--t3);margin-bottom:12px">${a.date||''}${a.category?` · ${esc(a.category)}`:''}</div>
        ${a.content?`<div style="font-size:0.88rem;line-height:1.8;color:var(--t2);white-space:pre-wrap">${esc(a.content)}</div>`:'<div style="color:var(--t3);font-style:italic">暂无内容</div>'}
        ${a.url?`<div style="margin-top:12px"><a href="${esc(a.url)}" class="w-link" target="_blank">🔗 阅读原文</a></div>`:''}
      `,
      footer: [{label:'关闭',cls:'btn-s',action:()=>this.closeModal()}],
    });
  },

  // ===== ABOUT EXTRAS =====
  renderAboutExtras() {
    const d = this.store.data;
    // Stats
    const maxN = Math.max(d.works.length, d.articles.length, d.gallery.length, this._skills().length, 1);
    $('abStats').innerHTML = `
      <div class="ab-stat" style="--pct:${d.works.length/maxN*100}%"><span class="ab-stat-n">${d.works.length}</span><span class="ab-stat-l">作品</span></div>
      <div class="ab-stat" style="--pct:${d.articles.length/maxN*100}%"><span class="ab-stat-n">${d.articles.length}</span><span class="ab-stat-l">文章</span></div>
      <div class="ab-stat" style="--pct:${d.gallery.length/maxN*100}%"><span class="ab-stat-n">${d.gallery.length}</span><span class="ab-stat-l">影像</span></div>
      <div class="ab-stat" style="--pct:${this._skills().length/maxN*100}%"><span class="ab-stat-n">${this._skills().length}</span><span class="ab-stat-l">技能</span></div>
    `;
    // Timeline (experience + education)
    const tl = [...(d.experience||[]), ...(d.education||[])]
      .sort((a,b)=>b.year.localeCompare(a.year));
    $('tlWrap').innerHTML = `
      ${tl.length?tl.map(item=>`
        <div class="tl-item" data-tl-id="${item.id}">
          <div class="tl-dot"></div>
          <div class="tl-body">
            <span class="tl-year">${esc(item.year)}</span>
            <span class="tl-title">${esc(item.title)}</span>
            ${item.subtitle?`<span class="tl-sub">${esc(item.subtitle)}</span>`:''}
            ${item.desc?`<p class="tl-desc">${esc(item.desc)}</p>`:''}
            ${this.editMode?`<div class="tl-acts"><button class="tl-edit" data-tl-id="${item.id}">✎</button><button class="tl-del" data-tl-id="${item.id}">✕</button></div>`:''}
          </div>
        </div>
      `).join(''):'<div style="color:var(--t3);font-size:0.85rem;padding:8px 0">暂无记录</div>'}
      ${this.editMode?'<button class="tl-add" id="tlAdd">+ 添加经历</button>':''}
    `;
    // Quotes
    const qs = d.quotes||[];
    $('aboutQuotes').innerHTML = `
      <div class="quotes-display">
        ${qs.length?`<div class="quote-bubble">${esc(this._randQuote(qs))}</div>`:'<div style="color:var(--t3);font-size:0.85rem">暂无语录</div>'}
      </div>
      ${this.editMode?`<div class="quotes-edit" style="margin-top:8px"><button class="btn btn-sm btn-s" id="qEdit">✎ 管理语录</button></div>`:''}
    `;
  },

  _randQuote(qs) { return qs[Math.floor(Math.random()*qs.length)]; },

  modalTimelineItem(id) {
    if (!this.editMode) return;
    const d = this.store.data;
    let item = d.experience.find(x=>x.id===id) || d.education.find(x=>x.id===id);
    let type = item ? (d.experience.includes(item)?'experience':'education') : 'experience';
    const isE = !!item;

    this.modal({
      title: isE ? '✎ 编辑经历' : '➕ 添加经历',
      body: `
        <div class="fg"><label>类型</label><select id="tl_type">${['experience','education'].map(t=>`<option value="${t}"${type===t?' selected':''}>${t==='experience'?'工作':'教育'}</option>`).join('')}</select></div>
        <div class="fg"><label>年份</label><input id="tl_year" value="${esc(item?.year||'')}"></div>
        <div class="fg"><label>标题</label><input id="tl_title" value="${esc(item?.title||'')}"></div>
        <div class="fg"><label>副标题</label><input id="tl_sub" value="${esc(item?.subtitle||'')}"></div>
        <div class="fg"><label>描述</label><textarea id="tl_desc" rows="3">${esc(item?.desc||'')}</textarea></div>
        ${isE?`<button class="btn btn-sm btn-p" id="tl_del" style="margin-top:4px">删除此记录</button>`:''}
      `,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:isE?'保存':'添加',cls:'btn-p',action:()=>{
          const year=$('tl_year').value.trim();
          const title=$('tl_title').value.trim();
          if(!year||!title){this.toast('年份和标题不能为空');return;}
          const data={id:id||this.genId(),year,title,subtitle:$('tl_sub').value.trim(),desc:$('tl_desc').value.trim()};
          const t=$('tl_type').value;
          if(isE){
            // If type changed, move item between arrays
            if(t!==type){
              if(d.experience.includes(item))d.experience=d.experience.filter(x=>x.id!==id);
              else d.education=d.education.filter(x=>x.id!==id);
              d[t].push(data);
            } else {
              Object.assign(item,data);
            }
          } else {
            d[t].push(data);
          }
          this.store.save(); this.closeModal(); this.renderAboutExtras(); this.toast('✅ 已保存');
        }},
      ],
      onOpen:()=>{
        const del=$('tl_del');
        if(del) del.onclick=()=>{
          if(!confirm('确认删除？'))return;
          d.experience=d.experience.filter(x=>x.id!==id);
          d.education=d.education.filter(x=>x.id!==id);
          this.store.save(); this.closeModal(); this.renderAboutExtras(); this.toast('已删除');
        };
      },
    });
  },

  modalQuotes() {
    if (!this.editMode) return;
    const qs = this.store.data.quotes;
    this.modal({
      title: '💬 管理语录',
      body: qs.map((q,i)=>`
        <div class="q-e"><textarea data-i="${i}" rows="2">${esc(q)}</textarea><button class="q-del" data-i="${i}">✕</button></div>
      `).join('') + `<button class="btn btn-sm btn-s" id="qAdd" style="margin-top:6px">+ 添加语录</button>
      <p style="font-size:0.75rem;color:var(--t3);margin-top:8px">首页会随机显示一条语录</p>`,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          const newQs=[];
          document.querySelectorAll('.q-e textarea').forEach(ta=>{
            const v=ta.value.trim();
            if(v) newQs.push(v);
          });
          this.store.data.quotes=newQs;
          this.store.save(); this.closeModal(); this.renderAboutExtras(); this.toast('✅ 语录已更新');
        }},
      ],
      onOpen:()=>{
        $('qAdd').onclick=()=>{
          const c=$('modalBody');
          const d=document.createElement('div'); d.className='q-e';
          d.innerHTML='<textarea data-i="-1" rows="2"></textarea><button class="q-del">✕</button>';
          c.insertBefore(d, $('qAdd'));
        };
        document.querySelectorAll('.q-del').forEach(b=>b.onclick=function(){
          const e=this.closest('.q-e');
          if(e&&document.querySelectorAll('.q-e').length>1) e.remove();
          else this.toast('至少保留一条语录');
        });
      },
    });
  },

  // ===== SCROLL EFFECTS =====
  initScrollEffects() {
    const hpDeco = $('#page-home .p-deco');
    const nav = $('nav');
    let ticking = false;

    const handler = () => {
      const y = window.pageYOffset;
      if (hpDeco) hpDeco.style.transform = `translateY(${y*0.04}px)`;
      nav.classList.toggle('nav-scrolled', y > 60);
    };

    window.addEventListener('scroll', ()=>{
      if (!ticking) {
        requestAnimationFrame(()=>{ handler(); ticking=false; });
        ticking = true;
      }
    }, { passive: true });
  },

  // ===== DECORATIONS =====
  generatePageDecorations() {
    const items = [
      'E = mc²','φ = 1.618…','a² + b² = c²','∫ f(x) dx','∀ε > 0, ∃δ > 0',
      '∂u/∂t = α∂²u/∂x²','∇·E = ρ/ε₀','Σᵢ₌₁ⁿ xᵢ','π ≈ 3.14159',
      'e^(iπ) + 1 = 0','F = G(m₁m₂)/r²','P(A|B) = P(B|A)P(A)/P(B)',
      'λ = h/p','H = -Σ pᵢ log pᵢ','limₓ→₀ sin(x)/x = 1',
      'const fn = () => {}',"import { x } from 'y'",'class Component {}',
      'if (isReady) {}','for (let i = 0;;) {}','export default App',
      'async function load()','try {} catch(e) {}','useEffect(() => {}, [])',
      'return (<View />)',"console.log('hello')",'data.map(x => x)',
      '<div className="app">','npm run dev','git push origin main',
      'yarn add react','<Tabs />','px-4 py-2 rounded-lg',
      'flex flex-col gap-4','@media (max-width: 768px)','body { margin: 0 }',
      'typeof NaN === "number"','[] == ![]','closure (x => y => x + y)',
      'O(n log n)','Promise.all()','async await',
      'box-shadow: var(--shadow)','border-radius: 99px',
      ':root { --red: #C73E3A }','@keyframes fadeIn',
    ];
    const colors = ['var(--gold)','var(--red)','var(--t3)'];
    const sizes = [0.65, 0.75, 0.85, 0.95, 1.05];
    document.querySelectorAll('.p-deco').forEach(deco => {
      if (deco.children.length) return; // already generated
      const frag = document.createDocumentFragment();
      // Pick ~18 random items for this page
      const pool = [...items].sort(()=>Math.random()-0.5).slice(0, 30);
      pool.forEach((txt, i) => {
        const el = document.createElement('span');
        el.className = 'pf';
        el.textContent = txt;
        el.style.left = (Math.random() * 82 + 5) + '%';
        el.style.top = (Math.random() * 85 + 5) + '%';
        el.style.fontSize = sizes[Math.floor(Math.random()*sizes.length)] + 'rem';
        el.style.color = colors[Math.floor(Math.random()*colors.length)];
        el.style.opacity = (Math.random() * 0.12 + 0.10);
        el.style.setProperty('--rot', (Math.random() * 12 - 6) + 'deg');
        el.style.setProperty('--i', i);
        frag.appendChild(el);
      });
      deco.appendChild(frag);
    });
  },

  // ===== LIGHTBOX =====
  showLightbox(url) {
    $('lightboxImg').src = url;
    $('lightbox').style.display = '';
  },
  hideLightbox() {
    $('lightbox').style.display = 'none';
    $('lightboxImg').src = '';
  },

  // ===== GALLERY VIEWER =====
  showGalleryViewer(id) {
    if (this.editMode) return;
    const gallery = this.store.data.gallery.slice().sort((a,b)=> (b.date||'') < (a.date||'') ? -1 : 1);
    this._gvList = gallery;
    this._gvIdx = gallery.findIndex(g => g.id === id);
    if (this._gvIdx === -1) { this.toast('未找到图片'); return; }
    this._renderGalleryViewer();
    $('galleryViewer').style.display = '';
  },

  showWorkGalleryViewer(id) {
    if (this.editMode) return;
    const works = this.store.data.works.filter(w => w.image).sort((a,b)=> a.order - b.order);
    if (!works.length) return;
    this._gvList = works;
    this._gvIdx = works.findIndex(w => w.id === id);
    if (this._gvIdx === -1) { this.toast('未找到图片'); return; }
    this._renderGalleryViewer();
    $('galleryViewer').style.display = '';
  },

  _renderGalleryViewer() {
    const g = this._gvList[this._gvIdx];
    if (!g) return;
    const image = g.image || g.url || '';
    $('gvImg').src = image;
    $('gvTitle').textContent = g.title || '';
    $('gvDate').textContent = g.date || '';
    $('gvDesc').textContent = g.desc || g.caption || '';
    $('gvTags').innerHTML = g.tags?.length ? g.tags.map(t=>`<span>${esc(t)}</span>`).join('') : '';
    $('gvLinks').innerHTML = g.links?.length ? g.links.map(l=>`<a href="${esc(l.url)}" target="_blank">🔗 ${esc(l.label)}</a>`).join('') : '';
    $('gvCounter').textContent = `${this._gvIdx + 1} / ${this._gvList.length}`;
    $('gvPrev').style.display = this._gvIdx > 0 ? '' : 'none';
    $('gvNext').style.display = this._gvIdx < this._gvList.length - 1 ? '' : 'none';
  },

  _gvNav(delta) {
    const idx = this._gvIdx + delta;
    if (idx < 0 || idx >= this._gvList.length) return;
    this._gvIdx = idx;
    this._renderGalleryViewer();
  },

  hideGalleryViewer() {
    $('galleryViewer').style.display = 'none';
    $('gvImg').src = '';
  },

  // ===== PAGES =====
  switchPage(name) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const pg = $('page-'+name);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
    if (name === 'gallery') this.renderGallery();
    if (name === 'about') this.renderAboutExtras();
  },

  // ===== EVENTS =====
  bind() {
    // Tab switching
    $('tabs').addEventListener('click', e=>{
      const tab = e.target.closest('.tab');
      if (tab) this.switchPage(tab.dataset.page);
    });

    // Theme
    $('themeBtn').addEventListener('click', ()=>this.toggleTheme());

    // Backup
    $('backupBtn').addEventListener('click', ()=>this.showBackupModal());

    // Edit mode (password protected)
    $('editBtn').addEventListener('click', ()=>this.tryToggleEdit());

    // Password modal
    $('pwConfirm').addEventListener('click', ()=>this.checkPw());
    $('pwInput').addEventListener('keydown', e=>{ if (e.key==='Enter') this.checkPw(); });
    document.querySelectorAll('.pw-close').forEach(b=>b.addEventListener('click',()=>$('pwModal').style.display='none'));

    // Close password modal on overlay click
    $('pwModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) $('pwModal').style.display='none'; });

    // Delegated clicks
    document.addEventListener('click', e=>{
      const t=e.target;

      // FAB
      if (t.closest('#fab')) {
        if (!this.editMode) return;
        $('fab').classList.toggle('open');
        $('fabM').classList.toggle('open');
        return;
      }

      // FAB options
      const fo = t.closest('.fab-m button');
      if (fo) {
        $('fab').classList.remove('open'); $('fabM').classList.remove('open');
        if (fo.dataset.type==='work') this.modalWork();
        else if (fo.dataset.type==='article') this.modalArticle();
        else if (fo.dataset.type==='gallery') this.modalGalleryImage();
        return;
      }

      // Actions
      const act = t.closest('[data-act]');
      if (act) {
        const id = act.dataset.id;
        if (act.dataset.act==='ew') { this.modalWork(id); return; }
        if (act.dataset.act==='dw') { this.delWork(id); return; }
        if (act.dataset.act==='fw') { this.toggleFeaturedWork(id); return; }
        if (act.dataset.act==='ea') { this.modalArticle(id); return; }
        if (act.dataset.act==='da') { this.delArticle(id); return; }
        if (act.dataset.act==='fa') { this.toggleFeaturedArticle(id); return; }
        if (act.dataset.act==='eg') { this.modalGalleryImage(id); return; }
        if (act.dataset.act==='dg') { this.delGalleryImage(id); return; }
      }

      // Add placeholder
      if (t.closest('#wAdd')) { this.modalWork(); return; }
      if (t.closest('#aAdd')) { this.modalArticle(); return; }
      if (t.closest('#gAdd')) { this.modalGalleryImage(); return; }

      // Image click → gallery viewer (non-edit mode)
      const imgEl = t.closest('.w-card-img');
      if (imgEl && !this.editMode) {
        const card = imgEl.closest('.w-card');
        if (card) {
          if (card.classList.contains('g-card')) {
            this.showGalleryViewer(card.dataset.id); return;
          }
          this.showWorkGalleryViewer(card.dataset.id); return;
        }
        return;
      }

      // Card → detail (non-edit mode)
      const wc = t.closest('.w-card');
      if (wc && !this.editMode && !t.closest('.w-card-btn') && !t.closest('.w-link') && !t.closest('.w-card-desc') && !t.closest('.w-card-img')) {
        if (wc.classList.contains('g-card')) { this.showGalleryViewer(wc.dataset.id); return; }
        this.showWorkDetail(wc.dataset.id); return;
      }
      const ai = t.closest('.a-item');
      if (ai && !this.editMode && !t.closest('.a-btn') && !t.closest('.a-ext-link')) {
        this.showArticleDetail(ai.dataset.id); return;
      }

      // Timeline edit/del
      const te = t.closest('.tl-edit');
      if (te) { this.modalTimelineItem(te.dataset.tlId); return; }
      const td = t.closest('.tl-del');
      if (td) {
        if (!confirm('确认删除？')) return;
        const id = td.dataset.tlId;
        this.store.data.experience = this.store.data.experience.filter(x=>x.id!==id);
        this.store.data.education = this.store.data.education.filter(x=>x.id!==id);
        this.store.save(); this.renderAboutExtras(); this.toast('已删除');
        return;
      }

      // Quotes edit
      if (t.closest('#qEdit')) { this.modalQuotes(); return; }
      if (t.closest('#tlAdd')) { this.modalTimelineItem(null); return; }


      // Home preview → detail
      const hpw = t.closest('.hp-work');
      if (hpw) {
        const wid = hpw.dataset.id;
        if (wid) { this.switchPage('works'); this.showWorkDetail(wid); }
        return;
      }
      const hpa = t.closest('.hp-article');
      if (hpa) {
        const aid = hpa.dataset.id;
        if (aid) { this.switchPage('articles'); this.showArticleDetail(aid); }
        return;
      }

      // Expand description
      const dc = t.closest('.w-card-desc');
      if (dc) { dc.classList.toggle('expanded'); return; }
    });

    // Filter clicks
    document.addEventListener('click', e=>{
      const wb = e.target.closest('#wFilter .filter-btn');
      if (wb) { this.activeTag = wb.dataset.filter; this.renderWorks(); return; }
      const ab = e.target.closest('#aFilter .filter-btn');
      if (ab) { this.activeCategory = ab.dataset.filter; this.renderArticles(); }
    });

    // Search inputs
    $('wSearch').addEventListener('input', e=>{ this.searchWorks=e.target.value; this.renderWorks(); });
    $('aSearch').addEventListener('input', e=>{ this.searchArticles=e.target.value; this.renderArticles(); });
    // Drag & Drop — Works
    (()=>{
      const g = $('wGrid');
      let d = null;
      g.addEventListener('dragstart', e=>{
        if (!this.editMode) return;
        const c = e.target.closest('.w-card'); if(!c) return;
        d = c.dataset.id; c.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', d);
      });
      g.addEventListener('dragover', e=>{ if(d) e.preventDefault(); });
      g.addEventListener('dragenter', e=>{
        e.preventDefault(); if(!d) return;
        const c = e.target.closest('.w-card');
        if(c && c.dataset.id !== d) c.classList.add('drag-over');
      });
      g.addEventListener('dragleave', e=>{
        const c = e.target.closest('.w-card');
        if(c && (!e.relatedTarget || !c.contains(e.relatedTarget))) c.classList.remove('drag-over');
      });
      g.addEventListener('drop', e=>{
        e.preventDefault(); if(!d) return;
        const t = e.target.closest('.w-card'); if(!t || t.dataset.id === d) return;
        const ws = this.store.data.works;
        const fi = ws.findIndex(w=>w.id===d), ti = ws.findIndex(w=>w.id===t.dataset.id);
        if(fi===-1 || ti===-1) return;
        const [it] = ws.splice(fi,1); ws.splice(fi<ti?ti-1:ti,0,it);
        ws.forEach((w,i)=>w.order=i); this.store.save(); this.renderWorks();
      });
      g.addEventListener('dragend', ()=>{
        d = null; document.querySelectorAll('.w-card.dragging,.w-card.drag-over').forEach(c=>c.classList.remove('dragging','drag-over'));
      });
    })();

    // Drag & Drop — Articles
    (()=>{
      const l = $('aList');
      let d = null;
      l.addEventListener('dragstart', e=>{
        if (!this.editMode) return;
        const it = e.target.closest('.a-item'); if(!it) return;
        d = it.dataset.id; it.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', d);
      });
      l.addEventListener('dragover', e=>{ if(d) e.preventDefault(); });
      l.addEventListener('dragenter', e=>{
        e.preventDefault(); if(!d) return;
        const it = e.target.closest('.a-item');
        if(it && it.dataset.id !== d) it.classList.add('drag-over');
      });
      l.addEventListener('dragleave', e=>{
        const it = e.target.closest('.a-item');
        if(it && (!e.relatedTarget || !it.contains(e.relatedTarget))) it.classList.remove('drag-over');
      });
      l.addEventListener('drop', e=>{
        e.preventDefault(); if(!d) return;
        const t = e.target.closest('.a-item'); if(!t || t.dataset.id === d) return;
        const as = this.store.data.articles;
        const fi = as.findIndex(a=>a.id===d), ti = as.findIndex(a=>a.id===t.dataset.id);
        if(fi===-1 || ti===-1) return;
        const [it] = as.splice(fi,1); as.splice(fi<ti?ti-1:ti,0,it);
        this.store.save(); this.renderArticles();
      });
      l.addEventListener('dragend', ()=>{
        d = null; document.querySelectorAll('.a-item.dragging,.a-item.drag-over').forEach(c=>c.classList.remove('dragging','drag-over'));
      });
    })();

    // Drag & Drop — Gallery
    (()=>{
      const g = $('gGrid');
      if (!g) return;
      let d = null;
      g.addEventListener('dragstart', e=>{
        if (!this.editMode) return;
        const it = e.target.closest('.g-card'); if(!it) return;
        d = it.dataset.id; it.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', d);
      });
      g.addEventListener('dragover', e=>{ if(d) e.preventDefault(); });
      g.addEventListener('dragenter', e=>{
        e.preventDefault(); if(!d) return;
        const it = e.target.closest('.g-card');
        if(it && it.dataset.id !== d) it.classList.add('drag-over');
      });
      g.addEventListener('dragleave', e=>{
        const it = e.target.closest('.g-card');
        if(it && (!e.relatedTarget || !it.contains(e.relatedTarget))) it.classList.remove('drag-over');
      });
      g.addEventListener('drop', e=>{
        e.preventDefault(); if(!d) return;
        const t = e.target.closest('.g-card'); if(!t || t.dataset.id === d) return;
        const gs = this.store.data.gallery;
        const fi = gs.findIndex(img=>img.id===d), ti = gs.findIndex(img=>img.id===t.dataset.id);
        if(fi===-1 || ti===-1) return;
        const [it] = gs.splice(fi,1); gs.splice(fi<ti?ti-1:ti,0,it);
        gs.forEach((img,i)=>img.order=i); this.store.save(); this.renderGallery();
      });
      g.addEventListener('dragend', ()=>{
        d = null; document.querySelectorAll('.g-card.dragging,.g-card.drag-over').forEach(c=>c.classList.remove('dragging','drag-over'));
      });
    })();
    $('skillsTags').addEventListener('click', e=>{
      if (!this.editMode) return;
      const tag = e.target.closest('.tag');
      if (!tag) return;
      if (tag.id === 'skillAdd') {
        this._skills().push('新技能');
        this.store.save();
        this.renderProfile();
        const idx = this._skills().length - 1;
        this.modalSkill(idx);
        return;
      }
      this.modalSkill(parseInt(tag.dataset.i));
    });

    // Contacts click
    $('contactsList').addEventListener('click', e=>{
      if (!this.editMode) return;
      const ct = e.target.closest('.contact');
      if (ct) this.modalContact(parseInt(ct.dataset.i));
    });

    // Social links click (edit mode)
    document.addEventListener('click', e=>{
      if (!this.editMode) return;
      const soc = e.target.closest('.soc');
      if (!soc) return;
      e.preventDefault();
      const p = soc.closest('#heroSoc')||soc.closest('#ftSoc');
      if (!p) return;
      this.modalSocial(Array.from(p.children).indexOf(soc));
    });

    // Double-click profile editable fields
    document.addEventListener('dblclick', e=>{
      const m = {
        'dispName':'name','dispTitle':'title','dispBio':'bio','aboutBio':'about'
      };
      for (const [id,field] of Object.entries(m)) {
        if (e.target.closest('#'+id)) { this.editField(field); return; }
      }
      // Avatar double-click
      if (e.target.closest('#avDisplay')||e.target.closest('#avAbout')) { this.modalAvatar(); }
    });

    // Lightbox
    $('lightbox').addEventListener('click', e=>{
      if (e.target === e.currentTarget) this.hideLightbox();
    });
    $('lightbox').querySelector('.lightbox-close').addEventListener('click', ()=>this.hideLightbox());

    // Gallery Viewer
    $('galleryViewer').addEventListener('click', e=>{
      if (e.target === e.currentTarget) this.hideGalleryViewer();
    });
    $('gvClose').addEventListener('click', ()=>this.hideGalleryViewer());
    $('gvPrev').addEventListener('click', ()=>this._gvNav(-1));
    $('gvNext').addEventListener('click', ()=>this._gvNav(1));
    document.addEventListener('keydown', e=>{
      if ($('galleryViewer').style.display !== 'none') {
        if (e.key === 'ArrowLeft') { this._gvNav(-1); return; }
        if (e.key === 'ArrowRight') { this._gvNav(1); return; }
      }
    });

    // Close modal
    $('modalClose').addEventListener('click', ()=>this.closeModal());
    $('modal').addEventListener('click', e=>{ if(e.target===e.currentTarget) this.closeModal(); });
    document.addEventListener('keydown', e=>{
      if(e.key==='Escape'){ this.closeModal(); $('pwModal').style.display='none'; this.hideLightbox(); this.hideGalleryViewer(); }
      // Keyboard shortcuts — skip when typing or modals open
      if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if($('modal').style.display!=='none'||$('pwModal').style.display!=='none'||$('galleryViewer').style.display!=='none') return;
      if(e.key==='e'||e.key==='E'){ e.preventDefault(); this.tryToggleEdit(); }
      const pages={1:'home',2:'works',3:'articles',4:'about',5:'gallery'};
      if(pages[e.key]) this.switchPage(pages[e.key]);
    });
  },

  // ===== PASSWORD & EDIT MODE =====
  tryToggleEdit() {
    if (this.editMode) {
      // Turning off — no password needed
      this.setEditMode(false);
    } else {
      // Turning on — require password
      $('pwInput').value = '';
      $('pwModal').style.display = '';
      $('pwInput').focus();
    }
  },

  checkPw() {
    if ($('pwInput').value === EDIT_PW) {
      $('pwModal').style.display = 'none';
      this.setEditMode(true);
    } else {
      this.toast('❌ 密码错误');
      $('pwInput').value = '';
      $('pwInput').focus();
    }
  },

  setEditMode(on) {
    this.editMode = on;
    document.body.classList.toggle('edit-mode', on);
    $('fab').style.display = on ? '' : 'none';
    $('backupBtn').style.display = on ? '' : 'none';
    $('editBtn').textContent = on ? '🔓' : '✎';
    $('editBtn').classList.toggle('edit-on', on);
    $('editBtn').title = on ? '关闭编辑' : '编辑模式';
    this.toast(on ? '✎ 编辑模式已开启' : '编辑模式已关闭');
    this.renderWorks();
    this.renderArticles();
    this.renderProfile();
    this.renderHomePreview();
    this.renderAboutExtras();
    if ($('page-gallery').classList.contains('active')) this.renderGallery();
  },

  // ===== FIELD EDIT =====
  editField(field) {
    if (!this.editMode) return;
    const labels = {name:'姓名',title:'头衔',bio:'一句话介绍',about:'关于我'};
    const val = this.store.data.profile[field]||'';
    this.modal({
      title: `✎ 编辑${labels[field]||field}`,
      body: `<div class="fg"><label>${labels[field]||field}</label><textarea id="fv" rows="${field==='about'?4:2}">${esc(val)}</textarea></div>`,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          const v=$('fv').value.trim();
          if(v){this.store.data.profile[field]=v;this.store.save();this.closeModal();this.renderProfile();this.toast('✅ 已更新');}
        }},
      ],
    });
  },

  modalAvatar() {
    if (!this.editMode) return;
    const cur = this.store.data.profile.avatar||'';
    this.modal({
      title: '✎ 更换头像',
      body: `<div class="fg"><label>图片 URL</label><input id="avUrl" value="${esc(cur)}" placeholder="https://..."></div><p style="font-size:0.8rem;color:var(--t3)">留空使用首字母</p>`,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          this.store.data.profile.avatar=$('avUrl').value.trim();this.store.save();this.closeModal();this.renderProfile();this.toast('✅ 头像已更新');
        }},
      ],
    });
  },

  // ===== CRUD WORKS =====
  modalWork(id) {
    if (!this.editMode&&!id) { this.toast('请先开启编辑模式'); return; }
    const w = id ? this.store.data.works.find(x=>x.id===id) : null;
    const isE = !!w;
    const links = w?.links?.length ? w.links : [{label:'',url:''}];

    this.modal({
      title: isE ? '✎ 编辑作品' : '📦 添加作品',
      body: `
        <div class="fg"><label>标题</label><input id="wf_t" value="${esc(w?.title||'')}"></div>
        <div class="fg"><label>日期</label><input id="wf_date" type="date" value="${w?.date || new Date().toISOString().split('T')[0]}"></div>
        <div class="fg"><label>描述 <button type="button" class="btn-expand" id="wf_expand" title="展开编辑">⛶</button></label><textarea id="wf_d" rows="5">${esc(w?.desc||'')}</textarea></div>
        <div class="fg"><label>图片</label><input id="wf_img" value="${esc(w?.image||'')}" placeholder="图片 URL"><input type="file" id="wf_img_file" accept="image/*" style="margin-top:4px;font-size:0.8rem;color:var(--t2)"></div>
        <div class="fg"><label>标签（逗号分隔）</label><input id="wf_tags" value="${esc((w?.tags||[]).join(', '))}"></div>
        <div class="fg"><label>链接</label><div id="wf_links">${links.map(l=>`<div class="link-e"><input placeholder="名称" value="${esc(l.label)}"><input placeholder="URL" value="${esc(l.url)}"><button class="link-rm">✕</button></div>`).join('')}</div><button class="add-link" id="wf_al">+ 添加链接</button></div>
      `,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:isE?'保存':'添加',cls:'btn-p',action:()=>{
          const title=$('wf_t').value.trim();
          if(!title){this.toast('请输入标题');return;}
          const data={title,desc:$('wf_d').value.trim(),image:$('wf_img').value.trim(),date:$('wf_date').value,tags:$('wf_tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean),links:this._clinks()};
          if(isE){Object.assign(w,data);this.store.save();this.renderWorks();this.renderHomePreview();this.closeModal();this.toast('✅ 已更新');}
          else{data.id=this.genId();data.order=Date.now();this.store.data.works.push(data);this.store.save();this.renderWorks();this.renderHomePreview();this.closeModal();this.toast('✅ 已添加');}
        }},
      ],
      onOpen:()=>{
        this._lbind();
        // Description expand toggle
        $('wf_expand').onclick=()=>$('wf_d').classList.toggle('expanded');
        // File upload → data URL
        $('wf_img_file').onchange=function(){
          const f=this.files[0]; if(!f) return;
          const r=new FileReader();
          r.onload=e=>{$('wf_img').value=e.target.result;};
          r.readAsDataURL(f);
        };
      },
    });
  },

  delWork(id) {
    if (!confirm('确认删除此作品？')) return;
    this.store.data.works = this.store.data.works.filter(w=>w.id!==id);
    this.store.save(); this.renderWorks(); this.renderHomePreview(); this.toast('已删除');
  },

  // ===== CRUD ARTICLES =====
  modalArticle(id) {
    if (!this.editMode&&!id) { this.toast('请先开启编辑模式'); return; }
    const a = id ? this.store.data.articles.find(x=>x.id===id) : null;
    const isE = !!a;
    this.modal({
      title: isE ? '✎ 编辑文章' : '📝 添加文章',
      body: `
        <div class="fg"><label>标题</label><input id="af_t" value="${esc(a?.title||'')}"></div>
        <div class="fg"><label>日期</label><input id="af_d" type="date" value="${a?.date||new Date().toISOString().split('T')[0]}"></div>
        <div class="fg"><label>分类</label><input id="af_c" value="${esc(a?.category||'')}" placeholder="如: 技术、设计、随笔"></div>
        <div class="fg"><label>外部链接（可选）</label><input id="af_u" value="${esc(a?.url||'')}" placeholder="https://..."></div>
        <div class="fg"><label>内容 <button type="button" class="btn-expand" id="af_expand" title="展开编辑">⛶</button></label><textarea id="af_content" rows="6">${esc(a?.content||'')}</textarea></div>
      `,
      footer: [
        {label:'取消',cls:'btn-s'},
        {label:isE?'保存':'添加',cls:'btn-p',action:()=>{
          const t=$('af_t').value.trim();
          if(!t){this.toast('请输入标题');return;}
          const data={title:t,date:$('af_d').value,category:$('af_c').value.trim(),url:$('af_u').value.trim(),content:$('af_content').value.trim()};
          if(isE){Object.assign(a,data);this.store.save();this.renderArticles();this.renderHomePreview();this.closeModal();this.toast('✅已更新');}
          else{data.id=this.genId();this.store.data.articles.push(data);this.store.save();this.renderArticles();this.renderHomePreview();this.closeModal();this.toast('✅已添加');}
        }},
      ],
      onOpen:()=>{
        $('af_expand').onclick=()=>$('af_content').classList.toggle('expanded');
      },
    });
  },

  delArticle(id) {
    if (!confirm('确认删除此文章？')) return;
    this.store.data.articles = this.store.data.articles.filter(a=>a.id!==id);
    this.store.save(); this.renderArticles(); this.renderHomePreview(); this.toast('已删除');
  },

  toggleFeaturedWork(id) {
    const w = this.store.data.works.find(x=>x.id===id);
    if (!w) return;
    w.featured = !w.featured;
    this.store.save();
    this.renderWorks();
    this.renderHomePreview();
    this.toast(w.featured ? '⭐ 已设为精选' : '已取消精选');
  },

  toggleFeaturedArticle(id) {
    const a = this.store.data.articles.find(x=>x.id===id);
    if (!a) return;
    a.featured = !a.featured;
    this.store.save();
    this.renderArticles();
    this.renderHomePreview();
    this.toast(a.featured ? '⭐ 已设为精选' : '已取消精选');
  },

  // ===== CONTACT / SOCIAL / SKILL =====
  modalSkill(idx) {
    const skills = this._skills();
    const val = skills[idx]||'';
    this.modal({
      title:'✎ 编辑技能',
      body:`<div class="fg"><label>技能名</label><input id="sk_i" value="${esc(val)}"></div>
        <button class="btn btn-sm btn-p" id="sk_del" style="margin-top:4px">删除</button>`,
      footer:[
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          const v=$('sk_i').value.trim();
          if(v){skills[idx]=v;this.store.save();this.closeModal();this.renderProfile();this.toast('✅ 已更新');}
          else{this.toast('技能名不能为空');}
        }},
      ],
      onOpen:()=>{$('sk_del').onclick=()=>{if(!confirm('确认删除？'))return;skills.splice(idx,1);this.store.save();this.closeModal();this.renderProfile();this.toast('已删除');}},
    });
  },

  modalContact(idx) {
    const c = this.store.data.profile.contacts[idx];
    if (!c) return;
    this.modal({
      title:'✎ 联系方式',
      body:`<div class="fg"><label>图标</label><input id="c_i" value="${c.icon}"></div>
        <div class="fg"><label>内容</label><input id="c_l" value="${esc(c.label)}"></div>
        <button class="btn btn-sm btn-p" id="c_del" style="margin-top:4px">删除</button>`,
      footer:[
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          c.icon=$('c_i').value||'📌';c.label=$('c_l').value.trim()||c.label;this.store.save();this.closeModal();this.renderProfile();this.toast('✅ 已更新');
        }},
      ],
      onOpen:()=>{$('c_del').onclick=()=>{if(!confirm('确认删除？'))return;this.store.data.profile.contacts.splice(idx,1);this.store.save();this.closeModal();this.renderProfile();this.toast('已删除');}},
    });
  },

  modalSocial(idx) {
    const s = this.store.data.profile.socials[idx];
    if (!s) return;
    this.modal({
      title:'✎ 社交链接',
      body:`<div class="fg"><label>图标</label><input id="s_i" value="${s.icon}"></div>
        <div class="fg"><label>名称</label><input id="s_l" value="${esc(s.label)}"></div>
        <div class="fg"><label>URL</label><input id="s_u" value="${esc(s.url)}"></div>
        <button class="btn btn-sm btn-p" id="s_del" style="margin-top:4px">删除</button>`,
      footer:[
        {label:'取消',cls:'btn-s'},
        {label:'保存',cls:'btn-p',action:()=>{
          s.icon=$('s_i').value||'🔗';s.label=$('s_l').value.trim()||s.label;s.url=$('s_u').value.trim()||s.url;this.store.save();this.closeModal();this.renderProfile();this.renderSocial();this.toast('✅ 已更新');
        }},
      ],
      onOpen:()=>{$('s_del').onclick=()=>{if(!confirm('确认删除？'))return;this.store.data.profile.socials.splice(idx,1);this.store.save();this.closeModal();this.renderProfile();this.renderSocial();this.toast('已删除');}},
    });
  },

  // ===== THEME =====
  loadTheme() {
    const s = localStorage.getItem('portfolio_theme');
    if (s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.body.classList.add('dark'); this.theme='dark'; $('themeBtn').textContent='☀️';
    }
  },
  toggleTheme() {
    this.theme=this.theme==='dark'?'light':'dark';
    document.body.classList.toggle('dark',this.theme==='dark');
    localStorage.setItem('portfolio_theme',this.theme);
    $('themeBtn').textContent=this.theme==='dark'?'☀️':'🌙';
  },

  // ===== MODAL =====
  modal(config) {
    $('modalTitle').textContent=config.title||'';
    $('modalBody').innerHTML=config.body||'';
    $('modalFoot').innerHTML='';
    $('modal').querySelector('.modal-box').classList.toggle('modal-wide', !!config.wide);
    if (config.footer) {
      config.footer.forEach(f=>{
        const b=document.createElement('button');
        b.className=`btn ${f.cls}`;
        b.textContent=f.label;
        b.onclick=f.action||(()=>this.closeModal());
        $('modalFoot').appendChild(b);
      });
    }
    $('modal').style.display='';
    requestAnimationFrame(()=>{
      const fi=$('modalBody').querySelector('input,textarea,select');
      if(fi) fi.focus();
    });
    if (config.onOpen) setTimeout(config.onOpen, 50);
  },

  closeModal() { $('modal').style.display='none'; $('modal').querySelector('.modal-box').classList.remove('modal-wide'); },

  // ===== QINIU CLOUD SYNC =====
  _qiniuInit() {
    this._qiniuDomain = localStorage.getItem('portfolio_qiniu_domain') || '';
    this._qiniuBucket = localStorage.getItem('portfolio_qiniu_bucket') || '';
    this._qiniuAk = localStorage.getItem('portfolio_qiniu_ak') || '';
    const sk = localStorage.getItem('portfolio_qiniu_sk');
    this._qiniuSk = sk ? atob(sk) : '';
    this._qiniuConnected = !!(this._qiniuDomain && this._qiniuAk && this._qiniuSk);
    this._qiniuLastSync = localStorage.getItem('portfolio_qiniu_stamp') || '';
    // Load from cloud silently (for visitors)
    if (!this._qiniuConnected) this._qiniuLoad();
  },

  // URL-safe base64 (keep padding, matches Qiniu SDK)
  _qiniuB64(str) {
    return btoa(str).replace(/\+/g,'-').replace(/\//g,'_');
  },

  // HMAC-SHA1 sign
  async _qiniuSign(data) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(this._qiniuSk),
      {name:'HMAC',hash:'SHA-1'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return this._qiniuB64(String.fromCharCode(...new Uint8Array(sig)));
  },

  // Generate upload token
  async _qiniuToken() {
    const deadline = Math.floor(Date.now()/1000) + 3600;
    const policy = JSON.stringify({scope:this._qiniuBucket+':data.json',deadline});
    const encoded = this._qiniuB64(policy);
    const sign = await this._qiniuSign(encoded);
    return this._qiniuAk + ':' + sign + ':' + encoded;
  },

  // Save to Qiniu (form upload, with auto region detection)
  async _qiniuSave(region) {
    if (!this._qiniuConnected) return;
    if (this._qiniuBusy) return;
    this._qiniuBusy = true;
    try {
      const token = await this._qiniuToken();
      const json = JSON.stringify(this.store.data, null, 2);
      const fd = new FormData();
      fd.append('token', token);
      fd.append('key', 'data.json');
      fd.append('file', new Blob([json], {type:'application/json'}), 'data.json');
      const host = region || 'up.qiniup.com';
      const res = await fetch('https://'+host+'/', {
        method:'POST',
        body: fd,
      });
      const text = await res.text();
      let errMsg = 'HTTP '+res.status;
      let errJson;
      try { errJson=JSON.parse(text); errMsg = errJson.error||errMsg; } catch(e) {}
      // Auto-retry with correct region
      if (!res.ok && errMsg && errMsg.includes('incorrect region')) {
        const m = errMsg.match(/use\s+(\S+)/);
        if (m && m[1]) {
          console.log('[qiniu] retrying with region:', m[1]);
          this._qiniuBusy = false;
          this._qiniuSave(m[1]);
          return;
        }
      }
      if (res.ok && text.includes('"key"')) {
        const now = new Date().toLocaleString();
        this._qiniuLastSync = now;
        localStorage.setItem('portfolio_qiniu_stamp', now);
        this._showSyncIndicator(true);
        console.log('[qiniu] save OK', now);
      } else {
        console.warn('[qiniu] save failed:', text);
        this._showSyncIndicator(false);
        this.toast('❌ 同步失败: ' + errMsg);
      }
    } catch(e) {
      console.warn('[qiniu] error:', e);
      this._showSyncIndicator(false);
      this.toast('❌ 同步失败: '+e.message);
    }
    this._qiniuBusy = false;
  },

  // Load from Qiniu CDN (visitor mode)
  async _qiniuLoad() {
    if (this._qiniuConnected) return; // editor skips auto-load
    try {
      const url = 'https://'+this._qiniuDomain+'/data.json?_cb='+Date.now();
      const r = await fetch(url, {cache:'no-store'});
      if (!r.ok) { console.log('[qiniu] no data.json yet'); return; }
      const data = await r.json();
      if (!data||!data.profile) return;
      console.log('[qiniu] loaded data from cloud');
      this.store.d = data;
      try { localStorage.setItem(this.store.key, JSON.stringify(data)); } catch(e) { console.warn(e); }
      this.render();
    } catch(e) { console.warn('[qiniu] load error:', e); }
  },

  _connectQiniu() {
    const domain = $('qi_domain')?.value?.trim();
    const bucket = $('qi_bucket')?.value?.trim();
    const ak = $('qi_ak')?.value?.trim();
    const sk = $('qi_sk')?.value?.trim();
    if (!domain||!bucket||!ak||!sk) { this.toast('请填写所有字段'); return; }
    this._qiniuDomain = domain;
    this._qiniuBucket = bucket;
    this._qiniuAk = ak;
    this._qiniuSk = sk;
    this._qiniuConnected = true;
    localStorage.setItem('portfolio_qiniu_domain', domain);
    localStorage.setItem('portfolio_qiniu_bucket', bucket);
    localStorage.setItem('portfolio_qiniu_ak', ak);
    localStorage.setItem('portfolio_qiniu_sk', btoa(sk));
    this.toast('✅ 已连接');
    this.closeModal();
    this._qiniuSave();
    setTimeout(() => this.showBackupModal(), 800);
  },

  _disconnectQiniu() {
    if (!confirm('断开同步连接？数据不会丢失。')) return;
    this._qiniuConnected = false;
    this._qiniuDomain = '';
    this._qiniuBucket = '';
    this._qiniuAk = '';
    this._qiniuSk = '';
    this._qiniuLastSync = '';
    localStorage.removeItem('portfolio_qiniu_domain');
    localStorage.removeItem('portfolio_qiniu_bucket');
    localStorage.removeItem('portfolio_qiniu_ak');
    localStorage.removeItem('portfolio_qiniu_sk');
    localStorage.removeItem('portfolio_qiniu_stamp');
    this.closeModal();
    this.toast('已断开同步');
    setTimeout(() => this.showBackupModal(), 500);
  },

  _showSyncIndicator(ok) {
    let el = $('syncInd');
    if (!el) {
      el = document.createElement('div');
      el.id = 'syncInd';
      document.body.appendChild(el);
    }
    el.textContent = ok ? '☁️ 已同步' : '☁️ 失败';
    el.className = 'show';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, 2000);
  },

  // ===== BACKUP & RESTORE =====
  showBackupModal() {
    const connected = this._qiniuConnected;
    let syncHtml;
    if (connected) {
      syncHtml = `
        <div style="margin:14px 0;padding:12px;border-radius:8px;background:var(--alt);border:1px solid var(--b2)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="color:#4CAF50">✅</span>
            <span style="font-size:0.85rem;font-weight:600">☁️ 七牛云同步已连接</span>
          </div>
          <div style="font-size:0.72rem;color:var(--t3);margin-bottom:4px">存储空间: ${esc(this._qiniuBucket)}</div>
          ${this._qiniuLastSync?'<div style="font-size:0.72rem;color:var(--t3);margin-bottom:10px">上次同步: '+esc(this._qiniuLastSync)+'</div>':''}
          <button class="btn btn-sm btn-p" id="syncNowBtn" style="width:100%;margin-bottom:4px">🔄 立即同步</button>
          <button class="btn btn-sm" id="syncDisBtn" style="width:100%;background:var(--tag-bg);color:var(--red)">🔌 断开连接</button>
        </div>
      `;
    } else {
      syncHtml = `
        <div style="margin:14px 0;padding:12px;border-radius:8px;background:var(--alt);border:1px solid var(--b2)">
          <div style="font-size:0.82rem;font-weight:600;margin-bottom:8px">☁️ 七牛云自动同步</div>
          <p style="font-size:0.75rem;color:var(--t3);margin-bottom:8px;line-height:1.5">开启后每次修改自动同步 data.json 到七牛云。<br>需要先创建 <b>公开</b> 存储空间，填写以下信息：</p>
          <div class="fg" style="margin-bottom:6px"><label>CDN 域名</label><input id="qi_domain" value="${esc(this._qiniuDomain)}" placeholder="xxx.bkt.clouddn.com"></div>
          <div class="fg" style="margin-bottom:6px"><label>空间名称 (Bucket)</label><input id="qi_bucket" value="${esc(this._qiniuBucket)}" placeholder="my-bucket"></div>
          <div class="fg" style="margin-bottom:6px"><label>AccessKey</label><input id="qi_ak" value="${esc(this._qiniuAk)}" placeholder="AK..."></div>
          <div class="fg" style="margin-bottom:6px"><label>SecretKey</label><input id="qi_sk" type="password" placeholder="SK..."></div>
          <button class="btn btn-sm btn-p" id="syncConnBtn" style="width:100%">🔗 连接</button>
        </div>
      `;
    }
    this.modal({
      title: '💾 数据备份',
      body: `
        <p style="font-size:0.85rem;color:var(--t2);margin-bottom:12px;line-height:1.6">数据存储在浏览器本地，清除缓存会丢失。<br>定期导出备份，安全无忧。</p>
        <button class="btn btn-p" id="exportBtn" style="width:100%;margin-bottom:8px">📥 导出数据（下载 JSON）</button>
        <button class="btn btn-s" id="importBtn" style="width:100%">📤 导入数据（恢复备份）</button>
        <input type="file" id="importFile" accept=".json" style="display:none">
        ${syncHtml}
        <p style="font-size:0.75rem;color:var(--t3);margin-top:10px">导入会覆盖当前所有数据，建议先导出备份。</p>
      `,
      footer: [{label:'关闭',cls:'btn-s'}],
      onOpen: () => {
        $('exportBtn').onclick = () => this.exportData();
        $('importBtn').onclick = () => $('importFile').click();
        $('importFile').onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          this.importData(file);
        };
        if (connected) {
          $('syncNowBtn').onclick = () => { this._qiniuSave(); this.toast('🔄 同步中...'); };
          $('syncDisBtn').onclick = () => this._disconnectQiniu();
        } else {
          $('syncConnBtn').onclick = () => this._connectQiniu();
        }
      },
    });
  },

  exportData() {
    try {
      const json = JSON.stringify(this.store.data, null, 2);
      const blob = new Blob([json], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.closeModal();
      this.toast('✅ 导出成功');
    } catch(e) {
      this.toast('❌ 导出失败: ' + e.message);
    }
  },

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.profile || !Array.isArray(data.works)) {
          this.toast('❌ 无效的备份文件');
          return;
        }
        if (!confirm('导入将覆盖现有所有数据，确认继续？')) return;
        this.store.d = data;
        this.store.save();
        this.closeModal();
        this.render();
        this.toast('✅ 数据恢复成功');
      } catch(err) {
        this.toast('❌ 导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  // ===== TOAST =====
  toast(msg, dur=2500) {
    const c=$('toastC');
    const el=document.createElement('div');
    el.className='toast'; el.textContent=msg;
    c.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300);},dur);
  },

  // ===== LINK HELPERS =====
  _clinks() {
    return Array.from(document.querySelectorAll('#wf_links .link-e')).map(el=>{
      const ins=el.querySelectorAll('input');
      return {label:ins[0]?.value.trim()||'',url:ins[1]?.value.trim()||''};
    }).filter(l=>l.label&&l.url);
  },
  _lbind() {
    const c=$('wf_links');
    c.addEventListener('click',e=>{
      if(e.target.closest('.link-rm')) {
        const en=e.target.closest('.link-e');
        if(c.children.length>1) en.remove(); else en.querySelectorAll('input').forEach(i=>i.value='');
      }
    });
    $('wf_al').addEventListener('click',()=>{
      const d=document.createElement('div'); d.className='link-e';
      d.innerHTML='<input placeholder="名称"><input placeholder="URL"><button class="link-rm">✕</button>';
      c.appendChild(d);
    });
  },
  _skills() {
    const sk = this.store.data.skills;
    if (sk) return sk;
    // Fallback for old data with skills inside profile
    return this.store.data.profile?.skills || [];
  },
};

// ===== STORE =====
class Store {
  constructor(key, defs, onSave) {
    this.key = key;
    this.defs = defs;
    this.onSave = onSave || null;
    this.d = this._load();
  }
  get data() { return this.d; }
  _load() {
    try {
      const r = localStorage.getItem(this.key);
      if (!r) return JSON.parse(JSON.stringify(this.defs));
      return this._m(JSON.parse(JSON.stringify(this.defs)), JSON.parse(r));
    } catch {
      return JSON.parse(JSON.stringify(this.defs));
    }
  }
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) { console.warn('Store.save error:', e); }
    if (typeof this.onSave === 'function') {
      try { this.onSave(); } catch (e) { console.warn('Store.onSave error:', e); }
    }
  }
  _m(t, s) {
    const r = { ...t };
    for (const k of Object.keys(s)) {
      if (r[k] && typeof r[k] === 'object' && !Array.isArray(r[k]) && r[k] !== null)
        r[k] = this._m(r[k], s[k]);
      else
        r[k] = s[k];
    }
    return r;
  }
}

// ===== ANIMATION STYLES =====
const st=document.createElement('style');
st.textContent=`
.ar{opacity:0;transform:translateY(18px);transition:opacity 0.5s cubic-bezier(0.22,1,0.36,1),transform 0.5s cubic-bezier(0.22,1,0.36,1);}
.ar.iv{opacity:1;transform:translateY(0);}
.w-card.ar,.a-item.ar{transition-delay:calc(var(--i,0)*0.08s);}
.w-card:nth-child(1),.a-item:nth-child(1){--i:0;}
.w-card:nth-child(2),.a-item:nth-child(2){--i:1;}
.w-card:nth-child(3),.a-item:nth-child(3){--i:2;}
.w-card:nth-child(4),.a-item:nth-child(4){--i:3;}
.w-card:nth-child(5),.a-item:nth-child(5){--i:4;}
.w-card:nth-child(6),.a-item:nth-child(6){--i:5;}
#syncInd{position:fixed;top:12px;right:12px;z-index:500;padding:4px 12px;border-radius:99px;background:var(--card);color:var(--text);font-size:0.75rem;box-shadow:var(--shadow);pointer-events:none;opacity:0;transform:translateY(-6px);transition:all 0.35s cubic-bezier(0.22,1,0.36,1);}
#syncInd.show{opacity:1;transform:translateY(0);}
`;
document.head.appendChild(st);

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', ()=>{
  App.init();
  window.app = App;
});
})();
