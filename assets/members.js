/* 義工成員：讀取「發布為 CSV」的試算表，分成「成員名單」與「生日月曆」。
 * 用法：<div data-members data-csv="CSV網址"> 裡放 .m-groups 和 .m-birthdays 兩個容器。
 * CSV 需要的欄位標題：綽號、部門、服事狀態、生日（欄位順序不拘，多的欄位會被忽略）。
 */
(() => {
  const box = document.querySelector('[data-members]');
  if (!box) return;
  const GROUPS = ['同工', '小學', '幼兒', '實習生', '其他'];   // 顯示順序
  const NORMAL = ['服事中'];                                    // 這些狀態視同「沒有狀態」，仍依部門分類
  const SKIP = ['已退出', '過期資料'];                          // 這些狀態的列完全不顯示
  const SORT_BY = 'birthday';                                   // 各分類內的順序：'birthday'＝依生日月日（1/1→12/31）；'age'＝依年齡
  const OLDEST_FIRST = true;                                    // 只在 SORT_BY 是 'age' 時使用：true＝年長在前；false＝年輕在前
  const list = box.querySelector('.m-groups'), cal = box.querySelector('.m-birthdays');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pad = n => String(n).padStart(2, '0');

  function parse(t) {
    const rows = []; let r = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { r.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; rows.push(r); r = []; }
      else f += c;
    }
    if (f !== '' || r.length) { r.push(f); rows.push(r); }
    return rows;
  }

  function bday(s) {                                            // 回傳 [月, 日, 年]；沒有年份時年＝0（年份不會顯示出來）
    s = (s || '').trim();
    const m = s.match(/(?:(\d{4})[\/.\-])?(\d{1,2})[\/.\-](\d{1,2})$/);
    if (m && +m[2] >= 1 && +m[2] <= 12) return [+m[2], +m[3], m[1] ? +m[1] : 0];
    const z = s.match(/(\d{1,2})月(\d{1,2})/);
    return z && +z[1] >= 1 && +z[1] <= 12 ? [+z[1], +z[2], 0] : null;
  }

  function render(rows) {
    const head = rows[0].map(h => h.trim());
    const col = n => head.indexOf(n);
    const get = (r, n) => (col(n) < 0 ? '' : (r[col(n)] || '').trim());
    const people = new Map();                                   // 同一綽號重複填寫時，以最後一筆為準
    rows.slice(1).forEach(r => {
      const name = get(r, '綽號'); if (!name) return;
      if (SKIP.includes(get(r, '服事狀態'))) return;
      const o = people.get(name) || { name, b: null };
      o.dept = get(r, '部門'); o.status = get(r, '服事狀態');
      const b = bday(get(r, '生日')); if (b) o.b = b;
      people.set(name, o);
    });
    const members = [...people.values()].map((p, i) => {
      p.i = i;                                                  // 記下在試算表裡的先後
      if (p.status && !NORMAL.includes(p.status)) { p.g = '其他'; p.tag = p.status; }     // 有服事狀態：優先歸「其他」
      else if (['同工', '小學', '幼兒', '實習生'].includes(p.dept)) { p.g = p.dept; p.tag = ''; }
      else { p.g = '其他'; p.tag = p.dept; }                                                // 信息或其他部門
      return p;
    });
       // 排序：沒有生日的排最後。'birthday'＝依月、日由 1/1 排到 12/31；'age'＝依年齡（有年份比完整生日，只有月日時沿用試算表順序）
    const dir = OLDEST_FIRST ? 1 : -1;
    const ageCmp = (a, b) => (a.b[2] && b.b[2])
      ? (a.b[2] - b.b[2]) || (a.b[0] - b.b[0]) || (a.b[1] - b.b[1]) || (a.i - b.i) : a.i - b.i;
    const mdCmp = (a, b) => (a.b[0] - b.b[0]) || (a.b[1] - b.b[1]) || (a.i - b.i);
    members.sort((a, b) => (!a.b - !b.b) || (!a.b ? a.i - b.i : SORT_BY === 'age' ? dir * ageCmp(a, b) : mdCmp(a, b)));

    list.innerHTML = GROUPS.map(g => {
      const l = members.filter(p => p.g === g); if (!l.length) return '';
      return `<section class="mgrp"><h3>${g}<small>${l.length} 人</small></h3><ul class="chips">${
        l.map(p => `<li>${esc(p.name)}${p.tag ? `<small>${esc(p.tag)}</small>` : ''}</li>`).join('')}</ul></section>`;
    }).join('') || '<p class="callout">目前沒有資料。</p>';

    const now = new Date(), M = now.getMonth() + 1, D = now.getDate();
    const byM = Array.from({ length: 12 }, () => []);
    members.filter(p => p.b).forEach(p => byM[p.b[0] - 1].push(p));
    byM.forEach(a => a.sort((x, y) => x.b[1] - y.b[1]));
    const li = (p, cls) => `<li class="${cls}"><span>${pad(p.b[0])}/${pad(p.b[1])}</span>${esc(p.name)}</li>`;
    const isToday = (p, m) => m === M && p.b[1] === D;
    const star = byM[M - 1];
    cal.innerHTML = `<div class="bd-now"><b>🎂 ${M} 月壽星</b>${star.length
      ? `<ul>${star.map(p => li(p, isToday(p, M) ? 'today' : '')).join('')}</ul>`
      : '<p>這個月沒有壽星。</p>'}</div>
      <div class="bd-grid">${byM.map((a, i) => `<section class="bd-m${i + 1 === M ? ' now' : ''}">
        <h3>${i + 1} 月<small>${a.length ? a.length + ' 人' : ''}</small></h3>
        ${a.length ? `<ul>${a.map(p => li(p, isToday(p, i + 1) ? 'today' : '')).join('')}</ul>` : '<p class="none">—</p>'}</section>`).join('')}</div>`;
  }

  list.innerHTML = '<p class="sheet-note">載入中…</p>';
  fetch(box.dataset.csv, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => render(parse(t)))
    .catch(() => { list.innerHTML = '<p class="callout">資料暫時無法載入，請稍後再試。</p>'; });
})();
