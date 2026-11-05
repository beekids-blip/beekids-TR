/* Bee Kids site shell: builds header, breadcrumb, in-page TOC, child cards and footer.
 *
 * 新增頁面時，只需要：
 *   1. 複製根目錄的 _template.html 到對應資料夾並修改內容
 *   2. 在下方 NAV 加入一行  { t: '頁面名稱', p: '資料夾/檔名.html' }
 * p 是「相對於網站根目錄」的路徑，不論頁面在第幾層都一樣。
 */
(() => {
  const NAV = [
    { t: '首頁', p: 'index.html' },
    { t: '義工相關', p: 'volunteers/index.html', c: [
      { t: '義工守則', p: 'volunteers/rules.html' },
      { t: '義工成員', p: 'volunteers/members.html' },
      { t: '出席請假', p: 'volunteers/service.html' },
      { t: '義工月會', p: 'volunteers/monthly-meeting.html', c: [
        { t: '月會課程紀錄', p: 'volunteers/meeting-records.html', hide: true },]},
      { t: '年度行事曆', p: 'volunteers/calendar.html' },]},
    { t: '兒童相關', p: 'children/index.html' },
    { t: '服事預備', p: 'prep/index.html' },
    { t: '尚未架設', p: 'other/other.html', c: [
      { t: '特殊專案', p: 'projects/index.html',},
      { t: '相簿', p: 'gallery.html' },
      { t: '資料索引', p: 'resources.html' },
      ]}
  ];

  const ROOT = new URL('../', document.currentScript.src);
  const href = p => new URL(p, ROOT).href;
  const path = u => decodeURIComponent(u.endsWith('/') ? u + 'index.html' : u);
  const cur = path(location.pathname);
  const isCur = n => path(new URL(n.p, ROOT).pathname) === cur;
  const find = (list, trail = []) => {
    for (const n of list) {
      const t = [...trail, n];
      if (isCur(n)) return t;
      const r = n.c && find(n.c, t);
      if (r) return r;
    }
  };
  const trail = find(NAV) || [];
  const node = trail[trail.length - 1];
  const link = n => `<a href="${href(n.p)}"${isCur(n) ? ' aria-current="page"' : ''}>${n.t}</a>`;

  // Header
  const vis = n => (n.c || []).filter(x => !x.hide);          // 只取沒隱藏的子頁
  const sub = n => vis(n).length
    ? `<li class="grp">${link(n)}<ul>${vis(n).map(sub).join('')}</ul></li>`
    : `<li>${link(n)}</li>`;
  const top = n => vis(n).length
    ? `<li class="has-sub${trail[0] === n ? ' on' : ''}">${link(n)}<ul class="sub">${vis(n).map(sub).join('')}</ul></li>`
    : `<li class="${trail[0] === n ? 'on' : ''}">${link(n)}</li>`;
  document.body.insertAdjacentHTML('afterbegin',
    `<a class="skip" href="#main">跳到主要內容</a>
     <header class="site-header"><div class="bar">
       <a class="brand" href="${href('index.html')}"><img src="${href('assets/img/純LOGO_透明.png')}" alt="Bee Kids">Bee Kids</a>
       <button class="menu-btn" aria-expanded="false" aria-controls="nav">選單</button>
       <nav id="nav" aria-label="主選單"><ul>${NAV.map(top).join('')}</ul></nav>
     </div></header>`);
  const btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  btn.addEventListener('click', () => btn.setAttribute('aria-expanded', nav.classList.toggle('open')));

  // Favicon
  document.head.insertAdjacentHTML('beforeend', `<link rel="icon" href="${href('assets/img/純LOGO_透明.png')}">`);

 const main = document.querySelector('main.page') || document.createElement('main');
 const article = main.querySelector('article') || document.createElement('article');

  // Breadcrumb
  if (trail.length > 1) {
    const crumbs = [NAV[0], ...trail.slice(0, -1)].map(link).join('<span>/</span>');
    article.insertAdjacentHTML('afterbegin', `<nav class="crumbs" aria-label="麵包屑">${crumbs}</nav>`);
  }

 // Child page cards: <div data-children></div> (current page) or data-children="root" (all sections)
document.querySelectorAll('[data-children]').forEach(el => {
  const list = el.dataset.children === 'root' ? NAV.slice(1) : ((node && node.c) || []).filter(x => !x.hide);  if (!list.length) return el.remove();
  if (el.classList.contains('btns')) {          // 放在 hero 裡：用按鈕樣式
  const brk = +el.dataset.break || 0;         // data-break="2"：第 2 顆後面換行
  el.innerHTML = list.map((n, i) =>
    `<a class="btn line" href="${href(n.p)}">${n.t}</a>` + (brk && i === brk - 1 ? '<span class="btns-br"></span>' : '')
  ).join('');
  return;
}
  el.className = 'cards';                       // 其他地方：卡片樣式
  el.innerHTML = list.map(n => `<a class="card" href="${href(n.p)}"><b>${n.t}</b></a>`).join('');
});

  // In-page TOC
  if (!main.classList.contains('no-toc')) {
    const hs = [...article.querySelectorAll('h2')];
    if (hs.length >= 3) {
      hs.forEach((h, i) => { if (!h.id) h.id = 'sec-' + (i + 1); });
      main.insertAdjacentHTML('beforeend',
        `<aside class="toc" aria-label="本頁目錄"><b>本頁內容</b>${hs.map(h =>
          `<a class="${h.tagName.toLowerCase()}" href="#${h.id}">${h.textContent}</a>`).join('')}</aside>`);
      const links = [...main.querySelectorAll('.toc a')];
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
      }), { rootMargin: '-80px 0px -70% 0px' });
      hs.forEach(h => io.observe(h));
    } else main.classList.add('solo');
  }

  // Footer
  document.body.insertAdjacentHTML('beforeend',
    `<footer class="site-footer"><div>
       <span>Bee Kids｜財團法人基督教台北真道教會</span>
       <a href="mailto:beekids@truth.org.tw">beekids@truth.org.tw</a>
     </div></footer>`);
})();
