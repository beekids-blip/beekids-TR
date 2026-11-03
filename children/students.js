document.addEventListener('DOMContentLoaded', () => {
  const sheetId = '1UMu2Cvx6c-jwA_Bvf6kPSQolS9B-am3TbV46qvkmy6Q';
  let allStudentsData = [];

  const gradeSelect = document.getElementById('gradeSelect');
  const gradeTitle = document.getElementById('currentGradeTitle');
  const statusText = document.getElementById('studentStatus');
  const listContainer = document.getElementById('studentList');

  // 1. 自動從 Google 試算表讀取 CSV 資料
  async function loadSheetData() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('無法存取試算表');
      const csvText = await response.text();
      allStudentsData = parseCSV(csvText);
      if (statusText) statusText.textContent = '請從上方下拉選單選擇年級查看名單。';
    } catch (error) {
      if (statusText) statusText.textContent = '資料載入失敗，請確認試算表已開啟「知道連結者皆可檢視」權限。';
      console.error(error);
    }
  }

  // 2. 解析 CSV 並自動偵測「姓名」與「年級」欄位
  function parseCSV(text) {
    const lines = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    if (lines.length === 0) return [];

    const parseRow = line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    const headers = parseRow(lines[0]);

    let nameIdx = headers.findIndex(h => h.includes('姓名'));
    let gradeIdx = headers.findIndex(h => h.includes('年級'));
    if (nameIdx === -1) nameIdx = 2; // 預設 115學年度資料總表 的姓名欄位 index
    if (gradeIdx === -1) gradeIdx = 4; // 預設 115學年度資料總表 的年級欄位 index

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i]);
      const name = cols[nameIdx] || '';
      const grade = cols[gradeIdx] || '';
      if (name && name !== '函數保留格') {
        data.push({ name, grade });
      }
    }
    return data;
  }

  // 3. 切換下拉選單時，僅更新 #studentList 內部的學生名單，不影響外部結構
// 3. 監聽下拉選單變更
  if (gradeSelect) {
    gradeSelect.addEventListener('change', (e) => {
      const selectedGrade = e.target.value;
      listContainer.innerHTML = '';

      if (!selectedGrade) {
        gradeTitle.textContent = '請選擇年級';
        statusText.style.display = 'block';
        statusText.textContent = '請從上方下拉選單選擇年級查看名單。';
        return;
      }

      gradeTitle.textContent = `${selectedGrade} 學生名單`;

      if (allStudentsData.length === 0) {
        statusText.style.display = 'block';
        statusText.textContent = '資料載入中，請稍後...';
        return;
      }

      // 篩選對應年級的學生
      const students = allStudentsData.filter(s => s.grade === selectedGrade);

      if (students.length === 0) {
        statusText.style.display = 'block';
        statusText.textContent = '此年級暫無學生資料。';
      } else {
        statusText.style.display = 'none';

        // 提取所有姓名，並用「、」分隔呈現成一整段文字
        const namesString = students.map(s => s.name).join('、');
        
        // 直接呈現在容器內
        listContainer.textContent = namesString;
      }
    });
  }

  loadSheetData();
});
