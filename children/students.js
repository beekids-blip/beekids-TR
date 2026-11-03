document.addEventListener('DOMContentLoaded', () => {
  const sheetId = '1UMu2Cvx6c-jwA_Bvf6kPSQolS9B-am3TbV46qvkmy6Q';
  let allStudentsData = [];

  const buttons = document.querySelectorAll('.grade-btn');
  const gradeTitle = document.getElementById('currentGradeTitle');
  const statusText = document.getElementById('studentStatus');
  const listContainer = document.getElementById('studentList');

  // 讀取 Google 試算表資料
  async function loadSheetData() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('無法存取試算表');
      const csvText = await response.text();
      allStudentsData = parseCSV(csvText);
    } catch (error) {
      statusText.textContent = '資料載入失敗，請確認該試算表已開啟「知道連結者皆可檢視」權限。';
    }
  }

  // 解析 CSV（假設 A 欄姓名、B 欄年級）
  function parseCSV(text) {
    const lines = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    return lines.map(line => {
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      return { name: cols[0] || '', grade: cols[1] || '' };
    });
  }

  // 綁定點擊事件
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedGrade = btn.getAttribute('data-grade');
      gradeTitle.textContent = `${selectedGrade} 學生名單`;
      listContainer.innerHTML = '';

      if (allStudentsData.length === 0) {
        statusText.textContent = '資料載入中，請稍後...';
        return;
      }

      const students = allStudentsData.filter(s => s.grade === selectedGrade);

      if (students.length === 0) {
        statusText.style.display = 'block';
        statusText.textContent = '此年級暫無學生資料。';
      } else {
        statusText.style.display = 'none';
        students.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s.name;
          listContainer.appendChild(li);
        });
      }
    });
  });

  loadSheetData();
});
