document.addEventListener('DOMContentLoaded', () => {
  const sheetId = '1UMu2Cvx6c-jwA_Bvf6kPSQolS9B-am3TbV46qvkmy6Q';
  let allStudentsData = [];

  const gradeSelect = document.getElementById('gradeSelect');
  const gradeTitle = document.getElementById('currentGradeTitle');
  const statusText = document.getElementById('studentStatus');
  const listContainer = document.getElementById('studentList');

 // 1. 自動從 Google 試算表讀取 CSV 資料（使用發佈到網路的 CSV 網址）
  async function loadSheetData() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1UMu2Cvx6c-jwA_Bvf6kPSQolS9B-am3TbV46qvkmy6Q/edit?usp=sharing';
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('無法存取試算表');
      const csvText = await response.text();
      allStudentsData = parseCSV(csvText);

      // 資料載入成功後，若選單已選擇年級，自動觸發更新
      if (gradeSelect && gradeSelect.value) {
        gradeSelect.dispatchEvent(new Event('change'));
      } else if (statusText) {
        statusText.style.display = 'block';
        statusText.textContent = '請從上方下拉選單選擇年級查看名單。';
      }
    } catch (error) {
      if (statusText) {
        statusText.style.display = 'block';
        statusText.textContent = '資料載入失敗，請確認試算表已開啟發佈權限。';
      }
      console.error(error);
    }
  }
  
 // 2. 解析 CSV 並固定抓取 C 欄 (索引 2) 為姓名、E 欄 (索引 4) 為年級
  function parseCSV(text) {
    const lines = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    if (lines.length === 0) return [];
    const parseRow = line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    const data = [];
    // 從第 2 行 (索引 1) 開始讀取資料列，跳過標題行
    for (let i = 1; i < lines.length; i++) {const cols = parseRow(lines[i]);const name = cols[2] || '';  // C 欄const grade = cols[4] || ''; // E 欄
    if (name && name !== '函數保留格') {data.push({ name, grade });}}return data;}

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

        gradeTitle.textContent = selectedGrade;
      
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

  // 計算人數統計
function calculateStats(data) {
  // 定義幼兒與小學的年級標籤
  const kindergartenGrades = ['幼幼', '幼小', '幼中', '幼大'];
  const elementaryGrades = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];

  let elementaryCount = 0;
  let kindergartenCount = 0;

  data.forEach(student => {
    const grade = student.grade.trim();
    if (elementaryGrades.includes(grade)) {
      elementaryCount++;
    } else if (kindergartenGrades.includes(grade)) {
      kindergartenCount++;
    }
  });

  const totalCount = elementaryCount + kindergartenCount;

  // 渲染至 HTML DOM 元素
  const elElementary = document.getElementById('statElementary');
  const elKindergarten = document.getElementById('statKindergarten');
  const elTotal = document.getElementById('statTotal');

  if (elElementary) elElementary.textContent = elementaryCount;
  if (elKindergarten) elKindergarten.textContent = kindergartenCount;
  if (elTotal) elTotal.textContent = totalCount;
}

  loadSheetData();
});
