/* 讀取「發布為 CSV」的 Google 試算表，用網站自己的樣式畫成表格，並可選擇單週檢視。
 * 使用：<div class="sheet" data-csv="CSV網址" data-last-row="52" data-open="試算表網頁網址"></div>
 * 欄位約定：A=區塊、B=崗位、C~K=各週日期；第 2 列日期、第 3 列特別提醒、第 4 列起為內容。
 */
(() => {
  const box = document.querySelector('.sheet');
  if (!box) return;
  const COLS = 11, LAST = +box.dataset.lastRow || 999, OPEN = box.dataset.open || '#';
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const txt = s => esc(s.trim()).replace(/\n/g, '<br>');

  function parse(t) {                       // 支援引號與儲存格內換行
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

  function start(rows) {
    const year = +((rows[0].join(' ').match(/20\d\d/) || [new Date().getFullYear()])[0]);
    const dates = rows[1].slice(2).map(s => s.trim()), notes = rows[2].slice(2).map(s => s.trim());
    const when = dates.map(d => { const m = d.match(/(\d{1,2})\/(\d{1,2})/); return m ? new Date(year, m[1] - 1, m[2]) : null; });
    const items = []; let sec = '', role = '';
    rows.slice(3).forEach(r => {
      if (r[0].trim()) { sec = r[0].trim(); role = ''; }
      if (r[1].trim()) role = r[1].trim();
      const vals = r.slice(2);
      if (vals.some(v => v.trim())) items.push({ sec, role, vals });   // 整列都空的略過
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let cur = when.findIndex(w => w && w >= today);                   // 預設：最近的下一個主日
    if (cur < 0) cur = when.length - 1;
    let mode = 'week';

    box.innerHTML = `
      <div class="sheet-bar">
        <div class="seg"><button type="button" data-m="week">單週</button><button type="button" data-m="all">全部週次</button></div>
        <div class="pick"><button type="button" data-step="-1" aria-label="上一週">‹</button>
          <select aria-label="選擇日期">${dates.map((d, i) => d ? `<option value="${i}">${esc(d)}${notes[i] ? '（' + esc(notes[i]) + '）' : ''}</option>` : '').join('')}</select>
          <button type="button" data-step="1" aria-label="下一週">›</button></div>
      </div>
      <div class="sheet-out"></div>
      <p class="sheet-note">資料來自試算表，約每 5 分鐘自動更新。<a href="${OPEN}" target="_blank" rel="noopener">在新分頁開啟</a></p>`;
    const out = box.querySelector('.sheet-out'), sel = box.querySelector('select'), pick = box.querySelector('.pick');

    const PAIRED = ['彩虹城堡', '背經', '會前', '主持'];   // 這些崗位固定兩人，不加括號
    const ORDER = ['共同', '小學', '幼兒', '特殊出席&請假'];  // 單週檢視的區塊順序
    const norm = s => s.replace(/\s/g, '');
    const nm = s => `<span class="nm">${esc(s)}</span>`;          // 人名不在中間斷行

    function weekHTML() {                                       // 單週：分成四個區塊
      const blocks = {}, extra = { '特殊出席': [], '請假': [] };
      const put = (k, row) => (blocks[k] = blocks[k] || []).push(row);
      for (let i = 0; i < items.length;) {
        const x = items[i]; let j = i;
        while (items[j + 1] && items[j + 1].sec === x.sec && items[j + 1].role === x.role) j++;
        const ns = items.slice(i, j + 1).map(g => g.vals[cur].trim()).filter(v => v && v !== 'X');
        i = j + 1;
        if (!ns.length) continue;
        const sec = norm(x.sec), role = norm(x.role);
        if (extra[sec]) { extra[sec].push(...ns); continue; }    // 特殊出席、請假：同類放一起
        let k = sec;
        if (sec === '彈性項目') k = role.startsWith('幼兒') ? '幼兒' : role.startsWith('小學') ? '小學' : '共同';
        const paired = PAIRED.some(p => role.startsWith(p));
        put(k, { label: x.role, html: paired || ns.length === 1 ? ns.map(nm).join('、') : `${nm(ns[0])}（${ns.slice(1).map(nm).join('、')}）` });
      }
      blocks['特殊出席&請假'] = ['特殊出席', '請假'].map(l => ({ label: l, html: extra[l].map(nm).join('、') }));
      if (!Object.values(blocks).some(rs => rs.some(r => r.html))) return '<p class="callout">這一週還沒有排定服事。</p>';
      const keys = [...ORDER, ...Object.keys(blocks).filter(k => !ORDER.includes(k))].filter(k => blocks[k] && blocks[k].length);
      return `<p class="wk-date"><b>${txt(dates[cur])}</b>${notes[cur] ? `<small>${txt(notes[cur])}</small>` : ''}</p>
        <div class="blocks">${keys.map(k => `<section class="blk"><h3>${esc(k)}</h3><table><tbody>${blocks[k].map(r =>
          `<tr><th scope="row">${txt(r.label)}</th>${r.html ? `<td>${r.html}</td>` : '<td class="none">—</td>'}</tr>`).join('')}</tbody></table></section>`).join('')}</div>`;
    }

    function allHTML() {                                        // 全部週次：整張表
      const cols = dates.map((d, i) => i).filter(i => dates[i]);
      const span = (i, key) => { let n = 1; while (items[i + n] && key(items[i + n]) === key(items[i])) n++; return n; };
      const kSec = x => x.sec, kRole = x => x.sec + '|' + x.role;
      const head = cols.map(i => `<th>${txt(dates[i])}${notes[i] ? `<small>${txt(notes[i])}</small>` : ''}</th>`).join('');
      const body = items.map((x, i) => {
        const p = items[i - 1], newSec = !p || p.sec !== x.sec, newRole = newSec || p.role !== x.role;
        return `<tr class="${newSec ? 'sec-start ' : ''}${x.sec === '請假' ? 'leave' : ''}">`
          + (newSec ? `<td class="c1" rowspan="${span(i, kSec)}">${txt(x.sec)}</td>` : '')
          + (newRole ? `<td class="c2" rowspan="${span(i, kRole)}">${txt(x.role)}</td>` : '')
          + cols.map(c => { const v = x.vals[c]; return v.trim() === 'X' ? '<td class="none">—</td>' : `<td>${txt(v)}</td>`; }).join('')
          + '</tr>';
      }).join('');
      return `<div class="sheet-wrap"><table class="sheet-table">
        <thead><tr><th class="c1"></th><th class="c2">崗位</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }

    function draw() {
      box.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === mode));
      pick.hidden = mode !== 'week'; sel.value = cur;
      out.innerHTML = mode === 'week' ? weekHTML() : allHTML();
    }

    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) mode = b.dataset.m;
      if (b.dataset.step) {                                           // 上一週／下一週（略過空白欄）
        let n = cur + +b.dataset.step; while (dates[n] === '') n += +b.dataset.step;
        if (n >= 0 && n < dates.length) cur = n;
      }
      draw();
    });
    sel.addEventListener('change', () => { cur = +sel.value; draw(); });
    draw();
  }

  box.innerHTML = '<p class="sheet-note">表格載入中…</p>';
  fetch(box.dataset.csv, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => start(parse(t).slice(0, LAST).map(r => Array.from({ length: COLS }, (_, i) => r[i] || ''))))
    .catch(() => { box.innerHTML = `<p class="callout">表格暫時無法載入，請<a href="${OPEN}" target="_blank" rel="noopener">在新分頁開啟</a>。</p>`; });
})();
