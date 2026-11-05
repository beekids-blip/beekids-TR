/* 年度行事曆：讀取頁面裡的活動清單，畫成 12 個月卡片，並標出本月與下一個活動。
 * 活動清單寫在 <script type="text/plain" id="events"> 裡，一行一個：  日期 | 活動名稱
 * 日期寫法：月/日　或　月/日-日（連續幾天）　或　月/日-月/日（跨月）。年份取自 data-year。
 * 活動顏色依名稱自動判斷：含「月會」＝義工月會、含「Bee Day」＝Bee Day、含「營會」「出遊」＝營會與出遊，其餘＝其他。
 */
(() => {
  const box = document.querySelector('[data-calendar]');
  const src = document.getElementById('events');
  if (!box || !src) return;
  const Y = +box.dataset.year || new Date().getFullYear();
  const WD = '日一二三四五六';
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kind = t => /月會/.test(t) ? 'meeting' : /bee\s*day/i.test(t) ? 'bee' : /營會|出遊/.test(t) ? 'camp' : 'other';

  const ev = src.textContent.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => {
    const m = l.match(/^(\d{1,2})\/(\d{1,2})(?:\s*[-–~]\s*(?:(\d{1,2})\/)?(\d{1,2}))?\s*\|\s*(.+)$/);
    if (!m) return null;
    const mo = +m[1], d1 = +m[2], em = m[3] ? +m[3] : mo, d2 = m[4] ? +m[4] : d1;
    return { mo, d1, em, d2, t: m[5].trim(), k: kind(m[5]), s: new Date(Y, mo - 1, d1), e: new Date(Y, em - 1, d2) };
  }).filter(Boolean).sort((a, b) => a.s - b.s || a.e - b.e);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const M = today.getFullYear() === Y ? today.getMonth() + 1 : 0;       // 本月（不是這一年就不標）
  const single = x => x.mo === x.em && x.d1 === x.d2;
  const label = x => single(x) ? `${x.mo}/${x.d1}<small>${WD[x.s.getDay()]}</small>`
    : `${x.mo}/${x.d1}–${x.em === x.mo ? '' : x.em + '/'}${x.d2}`;

  const nx = ev.find(x => x.e >= today);
  let nextHTML = '';
  if (nx && today.getFullYear() <= Y) {
    const n = Math.round((nx.s - today) / 864e5);
    const when = n > 0 ? `還有 ${n} 天` : (nx.s.getTime() === today.getTime() ? '就是今天' : '進行中');
    nextHTML = `<div class="cal-next"><span>下一個活動</span><b>${label(nx)}　${esc(nx.t)}</b><small>${when}</small></div>`;
  }

  const grid = Array.from({ length: 12 }, (_, i) => {
    const l = ev.filter(x => x.mo === i + 1);
    return `<section class="cal-m${i + 1 === M ? ' now' : ''}"><h3>${i + 1} 月</h3>${l.length
      ? `<ul>${l.map(x => `<li class="ev ${x.k}${x.e < today ? ' past' : ''}"><span class="d">${label(x)}</span><span class="t">${esc(x.t)}</span></li>`).join('')}</ul>`
      : '<p class="none">—</p>'}</section>`;
  }).join('');

  const legend = [['meeting', '義工月會'], ['bee', 'Bee Day'], ['camp', '營會與出遊'], ['other', '其他']]
    .map(([k, n]) => `<li class="ev ${k}">${n}</li>`).join('');
  box.innerHTML = `${nextHTML}<div class="cal-grid">${grid}</div><ul class="cal-legend">${legend}</ul>`;
})();
