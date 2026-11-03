# Bee Kids 協作網站

純靜態網站（HTML / CSS / JS），不需要建置，可直接用 GitHub Pages 發佈。

## 發佈
1. 建立 GitHub repository，將本資料夾內容放在根目錄並 push。
2. Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`。
3. 幾分鐘後即可從 `https://<帳號>.github.io/<repo>/` 開啟。

## 結構
- `index.html`：首頁
- `assets/site.css`：全站樣式（色彩在最上方 `:root`）
- `assets/site.js`：選單、麵包屑、本頁目錄、頁尾；**選單項目都在檔案開頭的 `NAV`**
- `_template.html`：新頁面範本
- 其餘資料夾對應原 Google Sites 的選單結構

## 新增頁面
1. 複製 `_template.html` 到目標資料夾，改檔名與內容；`href` 的 `../` 層數要等於資料夾深度。
2. 在 `assets/site.js` 的 `NAV` 加一行 `{ t: '名稱', p: '路徑/檔名.html' }`。

## 圖片
放在 `assets/img/`，在頁面以 `<img src="…/assets/img/檔名.png" alt="說明">` 引用。

## 注意
Repository 若為公開，請勿放入密碼、學生個資或名單；這類資料請繼續放在權限控管的雲端硬碟，再用連結指向。
