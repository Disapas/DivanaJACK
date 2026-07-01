(function () {
  'use strict';

  const educationLevels = [
    { th: 'ประถมศึกษา', en: 'Primary School' },
    { th: 'มัธยมศึกษา', en: 'Secondary' },
    { th: 'อาชีวศึกษา', en: 'Vocational' },
    { th: 'ปริญญาตรี', en: 'Bachelor' },
    { th: 'ปริญญาโท', en: 'Master' },
    { th: 'อื่นๆ', en: 'Other' },
  ];

  const languages = [
    { th: 'ไทย', en: 'Thai' },
    { th: 'อังกฤษ', en: 'English' },
    { th: 'จีน', en: 'Chinese' },
    { th: 'อื่นๆ', en: 'Other', editable: true },
  ];

  const questions = [
    {
      th: 'ท่านมีญาติ/พี่น้อง/เพื่อน ที่ทำงานในบริษัทนี้หรือไม่ ถ้ามี กรุณาระบุ',
      en: 'Do you have any relative/friend working in this company?',
      name: 'q_relatives',
    },
    {
      th: 'ท่านเคยถูกปลดออกจากงานไม่ว่ากรณีใดหรือไม่ ถ้าเคยกรุณาระบุเหตุผล',
      en: 'Have you ever been dismissed from employment for any reasons? If yes, please explain.',
      name: 'q_dismissed',
    },
    {
      th: 'ท่านเคยถูกจับกุม หรือมีประวัติอาชญากรรมในคดีต่างๆ หรือไม่',
      en: 'Have you ever been arrested or had any criminal records?',
      name: 'q_criminal',
    },
    {
      th: 'ท่านมีความบกพร่องทางร่างกายหรือจิตใจ มีโรคเรื้อรัง หรือโรคต่อไปนี้หรือไม่ (กามโรค วัณโรค กุ่งกวาด ตมบำหุ หอบหืด โรคพิษสุราเรื้อรัง ไวรัสตับอักเสบ หรือความบกพร่องอื่นๆ)',
      en: 'Do you have a body or mental disorder, chronic disease, Venereal disease, tuberculosis, leprosy, epilepsy, asthma, hepatitis, addiction or other disabilities?',
      name: 'q_health',
    },
    {
      th: 'ท่านสามารถทำงานเป็นกะ / ทำงานกลางคืน ได้หรือไม่',
      en: 'Are you able to do shift-work / night shift?',
      name: 'q_shift',
      hasTemporary: true,
    },
    {
      th: 'ท่านสามารถทำงานต่างจังหวัด ได้หรือไม่',
      en: 'Are you able to work in other provinces?',
      name: 'q_relocate',
      hasTemporary: true,
    },
    {
      th: 'ท่านสามารถปฏิบัติงานต่างประเทศได้หรือไม่',
      en: 'Are you able to work abroad?',
      name: 'q_abroad',
      hasTemporary: true,
    },
  ];

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function buildEducationTable() {
    const tbody = document.querySelector('#educationTable tbody');
    educationLevels.forEach((lvl, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${lvl.th}<br><span class="en">${lvl.en}</span></td>
        <td><input type="number" name="edu_${i}_fromYear" placeholder="ปีที่เข้า"></td>
        <td><input type="number" name="edu_${i}_toYear" placeholder="ปีที่จบ"></td>
        <td><input type="text" name="edu_${i}_institute" placeholder="สถาบันการศึกษา"></td>
        <td><input type="text" name="edu_${i}_degree" placeholder="วุฒิการศึกษา"></td>
        <td><input type="text" name="edu_${i}_major" placeholder="สาขา"></td>
        <td><input type="text" name="edu_${i}_gpa" placeholder="GPA"></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function buildLanguageTable() {
    const tbody = document.getElementById('langTableBody');
    languages.forEach((lang, i) => {
      const tr = document.createElement('tr');
      const nameCell = lang.editable
        ? `<input type="text" name="lang_${i}_name" placeholder="อื่นๆ / Other" class="lang-name-input">`
        : `${lang.th} / ${lang.en}`;
      let html = `<td>${nameCell}</td><td><input type="checkbox" name="lang_${i}_native"></td>`;
      ['listening', 'speaking', 'reading', 'writing'].forEach((skill) => {
        ['good', 'fair', 'poor'].forEach((level) => {
          html += `<td><input type="radio" name="lang_${i}_${skill}" value="${level}"></td>`;
        });
      });
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  function buildQaTable() {
    const tbody = document.getElementById('qaTableBody');
    questions.forEach((q) => {
      const tr = document.createElement('tr');
      const temporaryOption = q.hasTemporary
        ? `<label><input type="radio" name="${q.name}" value="temporary"> ชั่วคราว / Temporary</label>`
        : '';
      tr.innerHTML = `
        <td>${q.th}<br><span class="en">${q.en}</span></td>
        <td>
          <div class="qa-answer-group">
            <label><input type="radio" name="${q.name}" value="yes"> มี/ได้ Yes</label>
            <label><input type="radio" name="${q.name}" value="no"> ไม่มี/ไม่ได้ No</label>
            ${temporaryOption}
          </div>
        </td>
        <td><input type="text" name="${q.name}_detail" placeholder="รายละเอียด / Particulars"></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function addTableRow(tableId, colCount, placeholders) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    const rowIndex = tbody.children.length;
    const tr = document.createElement('tr');
    let html = '';
    for (let c = 0; c < colCount; c++) {
      const type = placeholders && placeholders[c] && placeholders[c].type ? placeholders[c].type : 'text';
      const placeholder = placeholders && placeholders[c] ? placeholders[c].label : '';
      html += `<td><input type="${type}" name="${tableId}_${rowIndex}_${c}" placeholder="${placeholder}"></td>`;
    }
    html += '<td><button type="button" class="remove-row" title="ลบแถว / Remove row">&times;</button></td>';
    tr.innerHTML = html;
    tr.querySelector('.remove-row').addEventListener('click', () => tr.remove());
    tbody.appendChild(tr);
  }

  const workPlaceholders = [
    { type: 'date', label: 'From' },
    { type: 'date', label: 'To' },
    { label: 'ชื่อบริษัท' },
    { label: 'ตำแหน่ง' },
    { label: 'ลักษณะงาน' },
    { label: 'เงินเดือน' },
    { label: 'เหตุผลที่ลาออก' },
  ];
  const trainingPlaceholders = [
    { label: 'หลักสูตร' },
    { label: 'สถาบัน' },
    { type: 'number', label: 'ปีที่เรียน' },
    { label: 'วุฒิบัตร' },
  ];
  const referencePlaceholders = [
    { label: 'ชื่อ-สกุล' },
    { label: 'อาชีพ' },
    { type: 'tel', label: 'เบอร์ติดต่อ' },
    { label: 'ความสัมพันธ์' },
  ];

  function placeholdersFor(tableId) {
    if (tableId === 'workTable') return workPlaceholders;
    if (tableId === 'trainingTable') return trainingPlaceholders;
    if (tableId === 'referenceTable') return referencePlaceholders;
    return [];
  }

  document.querySelectorAll('.add-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tableId = btn.dataset.target;
      const cols = parseInt(btn.dataset.cols, 10);
      addTableRow(tableId, cols, placeholdersFor(tableId));
    });
  });

  function initDefaultRows() {
    addTableRow('workTable', 7, workPlaceholders);
    addTableRow('workTable', 7, workPlaceholders);
    addTableRow('trainingTable', 4, trainingPlaceholders);
    addTableRow('referenceTable', 4, referencePlaceholders);
    addTableRow('referenceTable', 4, referencePlaceholders);
  }

  function initPhotoPreview() {
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const label = document.getElementById('photoLabel');
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.hidden = false;
        label.hidden = true;
      };
      reader.readAsDataURL(file);
    });
  }

  function initSameAsPresent() {
    const checkbox = document.getElementById('sameAsPresent');
    const map = [
      ['presentHouseNo', 'regHouseNo'],
      ['presentStreet', 'regStreet'],
      ['presentSubdistrict', 'regSubdistrict'],
      ['presentDistrict', 'regDistrict'],
      ['presentProvince', 'regProvince'],
      ['presentPostcode', 'regPostcode'],
      ['presentCountry', 'regCountry'],
    ];
    checkbox.addEventListener('change', () => {
      map.forEach(([fromId, toId]) => {
        const toField = document.getElementById(toId);
        if (checkbox.checked) {
          toField.value = document.getElementById(fromId).value;
          toField.disabled = true;
        } else {
          toField.disabled = false;
        }
      });
    });
  }

  function initAgeAutoCalc() {
    const dob = document.getElementById('dob');
    const age = document.getElementById('age');
    dob.addEventListener('change', () => {
      if (!dob.value) return;
      const birth = new Date(dob.value);
      const diff = new Date(Date.now() - birth.getTime());
      age.value = Math.abs(diff.getUTCFullYear() - 1970);
    });
  }

  function initFormSubmit() {
    const form = document.getElementById('applicationForm');
    const result = document.getElementById('submitResult');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'photo') return;
        data[key] = value;
      });
      result.hidden = false;
      result.classList.remove('error');
      result.textContent =
        'ส่งใบสมัครเรียบร้อยแล้ว ขอบคุณค่ะ / Application submitted successfully. Thank you.\n\n' +
        JSON.stringify(data, null, 2);
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function initPrint() {
    document.getElementById('printBtn').addEventListener('click', () => window.print());
  }

  buildEducationTable();
  buildLanguageTable();
  buildQaTable();
  initDefaultRows();
  initPhotoPreview();
  initSameAsPresent();
  initAgeAutoCalc();
  initFormSubmit();
  initPrint();
})();
