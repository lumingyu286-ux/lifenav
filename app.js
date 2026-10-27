/* 生活健康导航 ----------------------------------------------- */
(function () {
  'use strict';

  /* 第一件事：标记脚本已启动，把 HTML 里的 .boot 兜底块藏掉。
     app.js 被拦截时这行不会执行，兜底块就留在页面上，
     访客至少看到一句解释而不是一片空白。

     注意 paintError() 注入的提示框用的是 .notice 而不是 .boot ——
     用同一个类名的话会被 .js-ok .boot{display:none} 一起藏掉，
     等于整套兜底白写。 */
  document.documentElement.className += ' js-ok';

  var FAV_KEY   = 'ln-favs';
  var THEME_KEY = 'ln-theme';
  var ADULT_KEY = 'ln-adult-ok';
  var FAV_TAB   = 'fav';

  var $ = function (id) { return document.getElementById(id); };

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); }
  }

  /* --- 主题 ----------------------------------------------
     当前主题记在模块变量里，localStorage 只当「尽力而为」的持久化。
     每次回头读存储的话，隐私模式下写入失败、再读又拿到系统值，
     用户手动选的主题会被悄悄改回去。 */

  var themeNow = 'light';
  var userPicked = false;

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  function applyTheme(t) {
    themeNow = (t === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeNow);
    var btn = $('theme');
    /* 可见文字是「切换主题」，aria-label 必须包含它，
       否则语音控制念可见文字匹配不到这个按钮（WCAG 2.5.3）。 */
    if (btn) btn.setAttribute('aria-label', '切换主题，当前' + (themeNow === 'dark' ? '深色' : '浅色'));
  }

  function initTheme() {
    var saved = load(THEME_KEY);
    userPicked = (saved === 'light' || saved === 'dark');
    applyTheme(userPicked ? saved : systemTheme());

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var follow = function () { if (!userPicked) applyTheme(systemTheme()); };
      if (mq.addEventListener) mq.addEventListener('change', follow);
      else if (mq.addListener) mq.addListener(follow);
    }

    var btn = $('theme');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = themeNow === 'dark' ? 'light' : 'dark';
      userPicked = true;
      store(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* --- 收藏 ---------------------------------------------- */

  var favs = [];

  function loadFavs() {
    try {
      var raw = JSON.parse(load(FAV_KEY) || '[]');
      favs = Object.prototype.toString.call(raw) === '[object Array]' ? raw : [];
    } catch (e) { favs = []; }
  }

  function isFav(url) {
    for (var i = 0; i < favs.length; i++) { if (favs[i] === url) return true; }
    return false;
  }

  function toggleFav(url) {
    var out = [], found = false;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i] === url) { found = true; } else { out.push(favs[i]); }
    }
    if (!found) out.push(url);
    favs = out;
    store(FAV_KEY, JSON.stringify(favs));
  }

  /* --- 条目 ----------------------------------------------
     .item 里放一个 <a> 和一个独立的收藏按钮。按钮不能嵌在
     <a> 里面 —— 嵌套可交互元素，键盘和读屏器都会出问题。 */

  var ALL = [];

  function makeItem(rec) {
    var wrap = document.createElement('div');
    wrap.className = 'item';

    var a = document.createElement('a');
    a.className = 'item-link';
    a.dataset.url = rec.url;
    a.dataset.name = rec.name;
    a.target = '_blank';
    a.rel = 'noopener';

    if (rec.adult) {
      /* 成人条目不给真 href：中键点击、右键「在新标签页打开」
         都不会触发 click 事件，有真地址就能绕过年龄确认。
         地址放 data-url，由 click 处理器确认后再 open。 */
      a.dataset.adult = '1';
      a.href = '#';
      a.removeAttribute('target');
    } else {
      a.href = rec.url;
    }

    var n = document.createElement('span');
    n.className = 'item-name';
    n.textContent = rec.name;

    if (rec.adult) {
      var b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = '18+';
      n.appendChild(b);
    }
    a.appendChild(n);

    if (rec.note) {
      var p = document.createElement('span');
      p.className = 'item-note';
      p.textContent = rec.note;
      a.appendChild(p);
    }

    var h = document.createElement('span');
    h.className = 'item-host';
    h.textContent = hostOf(rec.url);
    a.appendChild(h);

    wrap.appendChild(a);

    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    star.dataset.url = rec.url;
    star.dataset.name = rec.name;
    paintStar(star, isFav(rec.url));
    wrap.appendChild(star);

    return wrap;
  }

  function paintStar(btn, on) {
    btn.textContent = on ? '★' : '☆';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? '取消收藏 ' : '收藏 ') + (btn.dataset.name || ''));
  }

  function makePanelHead(title, glyph, count) {
    var head = document.createElement('div');
    head.className = 'panel-head';
    var h2 = document.createElement('h2');
    h2.textContent = title;
    var g = document.createElement('span');
    g.className = 'panel-glyph';
    g.textContent = glyph || '';
    g.setAttribute('aria-hidden', 'true');
    var t = document.createElement('span');
    t.className = 'tally';
    t.textContent = count + ' 个';
    head.appendChild(h2);
    head.appendChild(g);
    head.appendChild(t);
    return head;
  }

  /* --- 标签页 --------------------------------------------
     真正的 tab：一次只显示一个面板。采用自动激活
     （焦点移到哪个标签就切到哪个），面板很轻，不会卡。 */

  var tabIds = [];
  var current = '';

  function tabId(k)   { return 'tab-' + k; }
  function panelId(k) { return 'panel-' + k; }

  function selectTab(key, moveFocus) {
    if (tabIds.indexOf(key) === -1) key = tabIds[0];
    current = key;

    for (var i = 0; i < tabIds.length; i++) {
      var k = tabIds[i];
      var tab = $(tabId(k));
      var panel = $(panelId(k));
      var on = (k === key);
      if (tab) {
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;        // roving tabindex
      }
      if (panel) panel.hidden = !on;
    }

    if (moveFocus) {
      var t = $(tabId(key));
      if (t) { try { t.focus(); } catch (e) {} }
    }

    if (window.history && history.replaceState) {
      /* 用 replaceState 而不是改 location.hash：
         后者每切一次就压一条历史，返回键会被塞满。 */
      try { history.replaceState(null, '', '#' + key); } catch (e) {}
    }
  }

  function wireTabs() {
    var list = $('tablist');
    if (!list) return;

    /* 窄屏下 CSS 把标签翻成横排，aria-orientation 得跟着改，
       否则读屏器会把横排的标签播报成竖排。 */
    if (window.matchMedia) {
      var narrow = window.matchMedia('(max-width: 52rem)');
      var orient = function () {
        list.setAttribute('aria-orientation', narrow.matches ? 'horizontal' : 'vertical');
      };
      orient();
      if (narrow.addEventListener) narrow.addEventListener('change', orient);
      else if (narrow.addListener) narrow.addListener(orient);
    }

    list.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.tab') : null;
      if (!t || !t.dataset.key) return;
      selectTab(t.dataset.key, false);
    });

    list.addEventListener('keydown', function (e) {
      var i = tabIds.indexOf(current);
      if (i === -1) return;
      var next = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabIds.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabIds.length) % tabIds.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabIds.length - 1;
      if (next === -1) return;
      e.preventDefault();
      selectTab(tabIds[next], true);
    });
  }

  /* --- 渲染 ---------------------------------------------- */

  function paintAll() {
    $('brand-name').textContent = SITE.name || '生活健康导航';
    $('brand-tag').textContent = SITE.tagline || '';
    document.title = (SITE.name || '生活健康导航') + ' - 就医、心理、政务与维权网址分类';
    $('foot-note').textContent = SITE.deployedOn
      ? '本页部署在 ' + SITE.deployedOn + '，收藏只存在你这台设备上。'
      : '收藏只存在你这台设备上，换浏览器就没了。';

    var list = $('tablist');
    var host = $('panels');

    GROUPS.forEach(function (g, gi) {
      var title = g[0], glyph = g[1], rows = g[2] || [];
      var key = 'g' + gi;
      tabIds.push(key);

      list.appendChild(makeTab(key, title, glyph, rows.length));

      var panel = document.createElement('section');
      panel.className = 'panel';
      panel.id = panelId(key);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId(key));
      panel.dataset.group = title;
      panel.tabIndex = 0;
      panel.hidden = true;

      panel.appendChild(makePanelHead(title, glyph, rows.length));

      rows.forEach(function (row) {
        var rec = {
          name: row[0], url: row[1], note: row[2] || '',
          adult: row[3] === 'adult', group: title
        };
        ALL.push(rec);
        panel.appendChild(makeItem(rec));
      });

      host.appendChild(panel);
    });

    /* 「常用」固定作为最后一个标签，始终存在。
       动态增删标签会让 roving tabindex 和键盘序列变复杂，
       空的时候给一句空状态就够了。 */
    tabIds.push(FAV_TAB);
    list.appendChild(makeTab(FAV_TAB, '常用', '★', favs.length));

    var fp = document.createElement('section');
    fp.className = 'panel';
    fp.id = panelId(FAV_TAB);
    fp.setAttribute('role', 'tabpanel');
    fp.setAttribute('aria-labelledby', tabId(FAV_TAB));
    fp.tabIndex = 0;
    fp.hidden = true;
    host.appendChild(fp);

    paintFavPanel();
  }

  function makeTab(key, title, glyph, count) {
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.id = tabId(key);
    tab.dataset.key = key;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId(key));
    tab.setAttribute('aria-selected', 'false');
    tab.tabIndex = -1;

    var g = document.createElement('span');
    g.className = 'tab-glyph';
    g.textContent = glyph || '';
    g.setAttribute('aria-hidden', 'true');

    var c = document.createElement('span');
    c.className = 'tab-count';
    c.dataset.for = key;
    c.textContent = count;
    c.setAttribute('aria-hidden', 'true');

    tab.appendChild(g);
    tab.appendChild(document.createTextNode(title));
    tab.appendChild(c);
    return tab;
  }

  function paintFavPanel() {
    var panel = $(panelId(FAV_TAB));
    if (!panel) return;
    panel.textContent = '';

    var picked = [];
    for (var i = 0; i < ALL.length; i++) {
      if (isFav(ALL[i].url)) picked.push(ALL[i]);
    }

    panel.appendChild(makePanelHead('常用', '★', picked.length));

    if (!picked.length) {
      var p = document.createElement('p');
      p.className = 'empty';
      p.style.border = '0';
      p.style.padding = '1.25rem .125rem';
      p.textContent = '还没有收藏。把鼠标移到条目上，点右边的 ☆ 就能放进来。';
      panel.appendChild(p);
    } else {
      picked.forEach(function (rec) { panel.appendChild(makeItem(rec)); });
    }

    var c = document.querySelector('.tab-count[data-for="' + FAV_TAB + '"]');
    if (c) c.textContent = picked.length;
  }

  /* 收藏按钮用事件委托：条目会被重绘，逐个绑定会丢 */
  function wireStars() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.star') : null;
      if (!btn) return;
      var url = btn.dataset.url;
      var inFavPanel = !!(btn.closest && btn.closest('#' + panelId(FAV_TAB)));

      toggleFav(url);
      var all = document.querySelectorAll('.star[data-url="' + cssEscape(url) + '"]');
      for (var i = 0; i < all.length; i++) paintStar(all[i], isFav(url));

      paintFavPanel();   // 会把常用面板整个重建

      /* 在「常用」里取消收藏时，刚按下的按钮已经被重建掉了，
         焦点会掉回文档开头。

         接收焦点的元素必须是当前可见的：分类面板里同名站点的
         星标虽然存在于 DOM，但此刻整个面板是 hidden，
         对隐藏元素调 focus() 会静默失败，焦点照样丢。
         所以只在常用面板内部找，找不到就退回「常用」标签本身。 */
      if (inFavPanel && !document.contains(btn)) {
        var panel = $(panelId(FAV_TAB));
        var back = (panel && panel.querySelector('.star')) || $(tabId(FAV_TAB));
        if (back) { try { back.focus(); } catch (e2) {} }
      }
    });
  }

  function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  /* --- 成人条目确认 --------------------------------------
     只拦这一条，其余链接照常直达。整站弹门会把挂号、医保
     也锁在 18+ 警告后面，既荒唐也劝退正常访客。          */

  var pending = null;
  var adultOk = false;
  var opener = null;

  function askOpen() { return !$('ask').hidden; }

  function openAsk(from) {
    opener = from || null;
    $('ask').hidden = false;
    /* 背景设 inert：否则 Tab 能走到遮罩后面的链接，
       aria-modal 只影响读屏器，管不住键盘焦点。 */
    var shell = $('shell');
    if ('inert' in shell) shell.inert = true;
    $('ask-ok').focus();
  }

  function closeAsk() {
    $('ask').hidden = true;
    var shell = $('shell');
    if ('inert' in shell) shell.inert = false;
    pending = null;
    /* 焦点还给触发的链接。不还的话键盘用户会被丢回 <body>，
       得从文档开头重新 Tab 一遍。先解除 inert 再聚焦。 */
    if (opener && document.contains(opener)) {
      try { opener.focus(); } catch (e) {}
    }
    opener = null;
  }

  function wireAdult() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.item-link') : null;
      if (!a || a.dataset.adult !== '1') return;

      e.preventDefault();
      var url = a.dataset.url;
      if (!url) return;

      if (adultOk || load(ADULT_KEY) === '1') {
        window.open(url, '_blank', 'noopener');
        return;
      }

      pending = url;
      $('ask-name').textContent = a.dataset.name || '该站点';
      openAsk(a);
    });

    $('ask-ok').addEventListener('click', function () {
      adultOk = true;
      store(ADULT_KEY, '1');
      var url = pending;
      closeAsk();
      /* 在按钮的点击处理里 open，属于用户手势，不会被拦成弹窗 */
      if (url) window.open(url, '_blank', 'noopener');
    });

    $('ask-no').addEventListener('click', closeAsk);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && askOpen()) closeAsk();
    });
  }

  /* --- 查找 ----------------------------------------------
     有关键词时离开标签模式：藏起标签和面板，改用合并结果。
     否则会出现「选中了某个标签，却显示着全部分类」的
     自相矛盾状态，读屏器那边尤其乱。                      */

  var ENGINES = {
    baidu:  'https://www.baidu.com/s?wd=',
    bing:   'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q='
  };

  function exitSearch() {
    $('results').hidden = true;
    $('results').textContent = '';
    $('tablist').hidden = false;
    $('panels').hidden = false;
    $('empty').hidden = true;
    var layout = $('layout');
    if (layout) delete layout.dataset.mode;
    selectTab(current, false);
  }

  function filter(q) {
    /* sites.js 没加载成功时 GROUPS 不存在。不挡住的话，
       输入第一个字符就会先把 #panels（连同 paintError 注入的
       提示框）藏掉，再在 GROUPS.forEach 上抛错中断，
       结果是只剩页头页脚的白页，刷新才能恢复。 */
    if (typeof GROUPS === 'undefined') return;

    var key = q.trim().toLowerCase();

    if (!key) { exitSearch(); return; }

    $('tablist').hidden = true;
    $('panels').hidden = true;
    /* 标签栏不占位之后，两列网格会把结果挤进窄列，改成单列 */
    var layout = $('layout');
    if (layout) layout.dataset.mode = 'search';

    var box = $('results');
    box.textContent = '';

    var total = 0;

    GROUPS.forEach(function (g) {
      var title = g[0], glyph = g[1], rows = g[2] || [];
      var hits = [];

      rows.forEach(function (row) {
        var name = row[0], url = row[1], note = row[2] || '';
        var hay = (name + ' ' + note + ' ' + title + ' ' + url).toLowerCase();
        if (hay.indexOf(key) !== -1) {
          hits.push({ name: name, url: url, note: note, adult: row[3] === 'adult', group: title });
        }
      });

      if (!hits.length) return;
      total += hits.length;

      var sec = document.createElement('section');
      sec.className = 'panel';
      sec.appendChild(makePanelHead(title, glyph, hits.length));
      hits.forEach(function (rec) { sec.appendChild(makeItem(rec)); });
      box.appendChild(sec);
    });

    box.hidden = total === 0;

    var empty = $('empty');
    if (total === 0) {
      empty.textContent = '没有匹配「' + q.trim() + '」的站点。换个词，或者用上面的下拉切到百度、Bing、Google 直接搜。';
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  function wireFind() {
    var input = $('find');

    input.addEventListener('input', function () {
      if ($('engine').value === 'local') filter(input.value);
    });

    $('engine').addEventListener('change', function () {
      filter($('engine').value === 'local' ? input.value : '');
    });

    $('find-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      var eng = $('engine').value;
      if (eng === 'local') { filter(q); return; }
      if (!q) { input.focus(); return; }
      window.open(ENGINES[eng] + encodeURIComponent(q), '_blank', 'noopener');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      /* 确认框开着时别抢焦点：焦点会跳到遮罩后面看不见的输入框 */
      if (askOpen()) return;
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  /* --- 出问题时的兜底 ------------------------------------
     类名用 .notice，不能用 .boot —— .js-ok .boot 是隐藏规则，
     刚注入就会被藏掉。标签栏也要一起清，否则留下一排指向
     已被清空的面板的死标签。                              */

  function paintError(kind) {
    var list = $('tablist');
    if (list) { list.textContent = ''; list.hidden = true; }

    var host = $('panels');
    host.textContent = '';
    host.hidden = false;

    var box = document.createElement('div');
    box.className = 'notice';
    var h = document.createElement('h2');
    h.textContent = kind === 'data' ? '网址数据没能加载' : '网址数据格式有问题';
    var p = document.createElement('p');
    p.textContent = kind === 'data'
      ? '刷新一下通常就好。如果反复失败，说明 sites.js 被拦截了。'
      : '检查 sites.js 里每个分类是不是 [分类名, 角标, [条目...]] 这三项。';
    box.appendChild(h);
    box.appendChild(p);
    host.appendChild(box);
  }

  /* --- 启动 ---------------------------------------------- */

  try { initTheme(); } catch (e) {}
  try { loadFavs(); } catch (e) {}

  var problem = '';
  try {
    if (typeof SITE === 'undefined' || typeof GROUPS === 'undefined') problem = 'data';
    else paintAll();
  } catch (e) {
    problem = 'render';
  }
  if (problem) { try { paintError(problem); } catch (e) {} }

  /* 事件绑定单独兜，而且绝不能走 paintError —— 那会清空标签和
     面板，把一次本来成功的渲染抹掉，再甩出一句「检查 sites.js
     的格式」，而 sites.js 其实毫无问题。
     逐个 try 还能保证前一个绑定失败不连累后面的。 */
  try { wireStars(); } catch (e) {}
  try { wireAdult(); } catch (e) {}
  try { wireFind(); }  catch (e) {}
  try { wireTabs(); }  catch (e) {}

  if (!problem && tabIds.length) {
    var want = (location.hash || '').replace(/^#/, '');
    try { selectTab(tabIds.indexOf(want) !== -1 ? want : tabIds[0], false); } catch (e) {}
  }

  $('shell').hidden = false;
})();
