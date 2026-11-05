/* 兒童相關：學生名單、人數統計、出席平均
 * 資料來源：兩份「發布為 CSV」的 Google 試算表（學生資料、出席紀錄）
 */
document.addEventListener('DOMContentLoaded', () => {
  // ====== 設定區 ======
  const STUDENT_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpHhJIZj58uAemsVdEe4uZl89Pm7oFF9r1bDKBVFivi4oZjt68_Yd0kIGOFwzAZWH-_cZTFXGeusV6/pub?gid=688096353&single=true&output=csv';
  const ATTEND_CSV  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRyf7kjbX2aMHJZdjpVG2f_KUERFelyPvf3YQl27vfsF7gmQjK5elgthuaygbVqT3bEfkp9uEzizy7_/pub?gid=735697632&single=true&output=csv';

  // 特殊主日：自動讀取年度行事曆，活動名稱符合下面關鍵字、且落在主日的，就算特殊主日
  const CALENDAR_PAGE = '../volunteers/calendar.html';
  const SPECIAL_RE = /bee\s*day|營會|出遊|特別/i;   // 想多算哪種活動，就在這裡加關鍵字，用 | 隔開
  // 另外手動補充（選填），格式「月/日」，例：const SPECIAL = ['12/20'];
  const SPECIAL = [];

  const KINDER = ['幼幼', '幼小', '幼中', '幼大'];
  const ELEM = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];
  // ====================

  let allStudentsData = [];

  const gradeSelect = document.getElementById('gradeSelect');
  const gradeTitle = document.getElementById('currentGradeTitle');
  const statusText = document.getElementById('studentStatus');
  const listContainer = document.getElementById('studentList');
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  // 解析 CSV（支援引號與儲存格內換行）
  function parseRows(t) {
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

  // ---------- 學生名單 ----------
  // C 欄（索引 2）＝姓名、E 欄（索引 4）＝年級，第一列是標題
  function parseStudents(text) {
    return parseRows(text).slice(1).map(c => ({ name: (c[2] || '').trim(), grade: (c[4] || '').trim() }))
      .filter(s => s.name && s.name !== '函數保留格');
  }

  async function loadStudents() {
    try {
      const res = await fetch(STUDENT_CSV);
      if (!res.ok) throw new Error('無法存取試算表');
      allStudentsData = parseStudents(await res.text());
      calculateStats(allStudentsData);
      if (gradeSelect && gradeSelect.value) gradeSelect.dispatchEvent(new Event('change'));
    } catch (err) {
      if (statusText) {
        statusText.style.display = 'block';
        statusText.textContent = '資料載入失敗，請確認試算表已開啟發佈權限。';
      }
      console.error(err);
    }
  }

  if (gradeSelect) {
    gradeSelect.addEventListener('change', e => {
      const g = e.target.value;
      listContainer.innerHTML = '';
      if (!g) {
        gradeTitle.textContent = '請選擇年級';
        statusText.style.display = 'block';
        statusText.textContent = '請從上方下拉選單選擇年級查看名單。';
        return;
      }
      gradeTitle.textContent = g;
      if (!allStudentsData.length) {
        statusText.style.display = 'block';
        statusText.textContent = '資料載入中，請稍後...';
        return;
      }
      const students = allStudentsData.filter(s => s.grade === g);
      if (!students.length) {
        statusText.style.display = 'block';
        statusText.textContent = '此年級暫無學生資料。';
      } else {
        statusText.style.display = 'none';
        listContainer.textContent = students.map(s => s.name).join('、');
      }
    });
  }

  // ---------- 人數統計 ----------
  function calculateStats(data) {
    const e = data.filter(s => ELEM.includes(s.grade)).length;
    const k = data.filter(s => KINDER.includes(s.grade)).length;
    setText('statElementary', e);
    setText('statKindergarten', k);
    setText('statTotal', e + k);
  }

  // ---------- 從年度行事曆找出特殊主日 ----------
  async function loadCalendarSpecial() {
    const out = new Set();
    try {
      const res = await fetch(CALENDAR_PAGE);
      if (!res.ok) throw new Error(res.status);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const src = doc.getElementById('events'), box = doc.querySelector('[data-calendar]');
      if (!src) return out;
      const Y = +(box && box.dataset.year) || new Date().getFullYear();
      src.textContent.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').forEach(l => {
        const m = l.match(/^(\d{1,2})\/(\d{1,2})(?:\s*[-–~]\s*(?:(\d{1,2})\/)?(\d{1,2}))?\s*\|\s*(.+)$/);
        if (!m || !SPECIAL_RE.test(m[5])) return;
        const mo = +m[1], d1 = +m[2], em = m[3] ? +m[3] : mo, d2 = m[4] ? +m[4] : d1;
        for (const d = new Date(Y, mo - 1, d1), end = new Date(Y, em - 1, d2); d <= end; d.setDate(d.getDate() + 1))
          if (d.getDay() === 0) out.add(`${Y}|${d.getMonth() + 1}/${d.getDate()}`);   // 活動期間內的主日
      });
    } catch (err) { console.warn('行事曆讀取失敗，只使用手動設定的特殊主日', err); }
    return out;
  }

  // ---------- 出席平均 ----------
  // 版面：第 1 列＝月份標題、第 2 列＝日期、第 3 列＝當天總人數；
  //       另有姓名欄為「幼兒總出席」「小學總出席」的列。第 6 欄（索引 5）起是各主日。
  function calculateAttendance(rows, cal) {
    const FIRST = 5;
    const head = rows[0] || [], days = rows[1] || [];
    const rowOf = label => rows.find(r => (r[1] || '').trim() === label);
    const tRow = rows[2], kRow = rowOf('幼兒總出席'), eRow = rowOf('小學總出席');
    const num = (r, c) => { const v = parseFloat(((r && r[c]) || '').replace(/,/g, '')); return isNaN(v) ? 0 : v; };

    const normal = [], special = [];
    let month = '';
    for (let c = FIRST; c < head.length; c++) {
      if ((head[c] || '').trim()) month = head[c].replace(/\D/g, '');   // 月份只寫在每月第一欄
      const d = (days[c] || '').trim();
      if (!month || !d) continue;
      const t = num(tRow, c), k = num(kRow, c), e = num(eRow, c);
      if (!(t > 0 || k + e > 0)) continue;                              // 還沒到的主日（0 或空白）不算
      const key = `${month}/${d}`;
      const cy = new Date().getFullYear();                              // 日期落在主日的那一年，才比對行事曆（避免對到別年同月日）
      const isSpecial = SPECIAL.includes(key) ||
        [cy - 1, cy, cy + 1].some(y => new Date(y, month - 1, +d).getDay() === 0 && cal.has(`${y}|${key}`));
      (isSpecial ? special : normal).push({ t, k, e });
    }

    const avg = (list, f) => list.length ? Math.round(list.reduce((s, x) => s + f(x), 0) / list.length) : '--';
    setText('avgNormalElementary', avg(normal, x => x.e));
    setText('avgNormalKindergarten', avg(normal, x => x.k));
    setText('avgNormalTotal', avg(normal, x => x.t));
    setText('avgSpecialElementary', avg(special, x => x.e));
    setText('avgSpecialKindergarten', avg(special, x => x.k));
    setText('avgSpecialTotal', avg(special, x => x.t));
  }

  async function loadAttendance() {
    try {
      const [res, cal] = await Promise.all([fetch(ATTEND_CSV, { cache: 'no-store' }), loadCalendarSpecial()]);
      if (!res.ok) throw new Error(res.status);
      calculateAttendance(parseRows(await res.text()), cal);
    } catch (err) {
      console.error('出席紀錄載入失敗', err);
    }
  }

  loadStudents();
  loadAttendance();
});
