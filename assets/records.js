/* 月會課程紀錄：讀取頁面裡的課程清單，依年份分組（新的在前），畫成卡片。
 * 清單寫在 <script type="text/plain" id="records"> 裡，一行一堂課，欄位用 | 隔開：
 *   日期 | 時間 | 課程名稱 | 老師 | 影片網址 | 講義網址
 * 日期寫 2026/04/12；影片、講義沒有就留空（但 | 要保留）。
 * 影片是 YouTube 網址會直接嵌入播放；其他影片網址會顯示成「觀看影片」按鈕。
 * 星期幾會自動算出來。以 # 開頭的行會被忽略。
 */
(() => {
  const box = document.querySelector('[data-records]');
  const src = document.getElementById('records');
  if (!box || !src) return;
  const WD = '日一二三四五六';
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const url = s => /^https?:\/\//i.test(s || '') ? s : '';          // 只接受真的網址，其餘（例如提示文字）當作沒填
  const yt = u => { const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([\w-]{11})/); return m ? m[1] : ''; };

  const rec = src.textContent.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => {
    const f = l.split('|').map(x => x.trim());
    const m = (f[0] || '').match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
    if (!m || !f[2]) return null;
    const d = new Date(+m[1], m[2] - 1, +m[3]);
    return { d, y: +m[1], title: f[2], time: f[1] || '', teacher: f[3] || '', video: url(f[4]), doc: url(f[5]),
      date: `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}（${WD[d.getDay()]}）` };
  }).filter(Boolean).sort((a, b) => b.d - a.d);

  const card = r => {
    const id = r.video && yt(r.video);
    const media = id
      ? `<div class="rec-media"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(r.title)}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
      : '';
    const btn = (href, t) => `<a class="btn solid" href="${esc(href)}" target="_blank" rel="noopener">${t}</a>`;
    const btns = (r.video && !id ? btn(r.video, '觀看影片') : '') + (r.doc ? btn(r.doc, '課程講義') : '');
    return `<section class="rec${media ? '' : ' nomedia'}">${media}<div class="rec-info"><h3>${esc(r.title)}</h3>`
      + `<dl class="facts"><dt>授課時間</dt><dd>${esc(r.date + r.time)}</dd>${r.teacher ? `<dt>授課老師</dt><dd>${esc(r.teacher)}</dd>` : ''}</dl>`
      + `${btns ? `<p class="rec-btns">${btns}</p>` : ''}</div></section>`;
  };

  const years = [...new Set(rec.map(r => r.y))];
  box.innerHTML = years.length
    ? years.map(y => `<h2>${y} 年</h2>${rec.filter(r => r.y === y).map(card).join('')}`).join('')
    : '<p class="callout">目前還沒有課程紀錄。</p>';
})();
