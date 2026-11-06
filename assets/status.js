/* 載入狀態標示：在頁面右下角顯示「資料載入中…」，所有資料都抓完後改成「✓ 已完成」。
 * 自動追蹤這一頁所有的 fetch / XMLHttpRequest；iframe（例如嵌入的表單）要加上 data-track 才會追蹤。
 * 這支檔案要放在 <head> 裡、而且放在其他腳本的前面，不要加 defer。
 * 手動使用：const done = BeeStatus.start();  …抓完後呼叫 done()，失敗呼叫 done(false)
 */
(() => {
  const HIDE_AFTER = 4000;          // 「已完成」顯示幾毫秒後淡出；0＝一直顯示
  let pending = 0, failed = 0, timer = 0, hideTimer = 0, el;

  function render() {
    clearTimeout(timer); clearTimeout(hideTimer);
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    }
    if (!el.isConnected) (document.body || document.documentElement).appendChild(el);
    el.hidden = false;
    if (pending > 0) { el.className = 'load-badge busy'; el.innerHTML = '<i class="spin"></i>資料載入中…'; }
    else if (failed) { el.className = 'load-badge fail'; el.textContent = '✕ 部分資料載入失敗'; }
    else {
      el.className = 'load-badge ok'; el.textContent = '✓ 已完成';
      if (HIDE_AFTER) hideTimer = setTimeout(() => { el.classList.add('out'); hideTimer = setTimeout(() => { el.hidden = true; }, 500); }, HIDE_AFTER);
    }
  }

  function start() {
    if (!pending) failed = 0;
    pending++; render();
    let over = false;
    return ok => {
      if (over) return; over = true;
      if (ok === false) failed++;
      pending--;
      if (pending > 0) render();
      else { clearTimeout(timer); timer = setTimeout(render, 300); }   // 稍等一下，避免連續請求時畫面閃動
    };
  }
  window.BeeStatus = { start };

  const _fetch = window.fetch;                                           // 追蹤 fetch：等回應內容讀完才算完成
  if (_fetch) window.fetch = function (...a) {
    const done = start();
    return _fetch.apply(this, a).then(res => {
      let fin = false, called = false;
      const end = ok => { if (!fin) { fin = true; done(ok); } };
      ['text', 'json', 'blob', 'arrayBuffer', 'formData'].forEach(m => {
        const orig = res[m]; if (!orig) return;
        res[m] = function () {
          called = true;
          return orig.apply(this, arguments).then(v => { setTimeout(() => end(res.ok), 50); return v; }, e => { end(false); throw e; });
        };
      });
      setTimeout(() => { if (!called) end(res.ok); }, 5000);               // 沒人讀內容就不要一直轉
      return res;
    }, err => { done(false); throw err; });
  };

  const _send = window.XMLHttpRequest && XMLHttpRequest.prototype.send;  // 追蹤 XMLHttpRequest
  if (_send) XMLHttpRequest.prototype.send = function () {
    const done = start();
    this.addEventListener('loadend', () => done(this.status >= 200 && this.status < 400));
    return _send.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', () => {                  // 追蹤標了 data-track 的 iframe
    document.querySelectorAll('iframe[data-track]').forEach(f => {
      const done = start();
      f.addEventListener('load', () => done(), { once: true });
      setTimeout(() => done(), 20000);
    });
  });
})();
