(function () {
  'use strict';

  const DEFAULT_TEXT_MAXLENGTH = 200;
  const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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
      let extra = ` maxlength="${DEFAULT_TEXT_MAXLENGTH}"`;
      if (type === 'tel') extra = ' pattern="0[0-9]{8,9}" maxlength="10" inputmode="numeric"';
      else if (type === 'number') extra = '';
      html += `<td><input type="${type}" name="${tableId}_${rowIndex}_${c}" placeholder="${placeholder}"${extra}></td>`;
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

  function applyDefaultConstraints() {
    const form = document.getElementById('applicationForm');
    form.querySelectorAll('input[type="text"], input[type="tel"]').forEach((input) => {
      if (!input.hasAttribute('maxlength')) input.setAttribute('maxlength', String(DEFAULT_TEXT_MAXLENGTH));
    });
  }

  function initPhotoPreview() {
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const label = document.getElementById('photoLabel');
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        window.alert('รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG หรือ WebP เท่านั้น\nOnly JPEG, PNG, or WebP image files are allowed.');
        input.value = '';
        preview.hidden = true;
        label.hidden = false;
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        window.alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB\nThe photo file must be 5 MB or smaller.');
        input.value = '';
        preview.hidden = true;
        label.hidden = false;
        return;
      }

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

  function showResult(result, success, message) {
    result.hidden = false;
    result.classList.toggle('error', !success);
    result.textContent = message;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function readPhotoAsBase64(maxDimension) {
    const input = document.getElementById('photoInput');
    const file = input.files && input.files[0];
    if (!file) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            fileName: file.name || 'photo.jpg',
          });
        };
        img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้ / Could not read the photo file'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้ / Could not read the photo file'));
      reader.readAsDataURL(file);
    });
  }

  function initFormSubmit() {
    const form = document.getElementById('applicationForm');
    const result = document.getElementById('submitResult');
    const submitBtn = form.querySelector('button[type="submit"]');

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

      const scriptUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_APPS_SCRIPT_URL;
      if (!scriptUrl) {
        showResult(
          result,
          false,
          'ยังไม่ได้ตั้งค่าปลายทางบันทึกข้อมูลลง Google Docs (ดู google-apps-script/README.md) ' +
            'ข้อมูลด้านล่างนี้ยังไม่ถูกบันทึก:\n\n' +
            JSON.stringify(data, null, 2)
        );
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'กำลังส่งข้อมูล... / Submitting...';

      readPhotoAsBase64(1000)
        .then((photo) => {
          if (photo) {
            data.photoBase64 = photo.base64;
            data.photoMimeType = photo.mimeType;
            data.photoFileName = photo.fileName;
          }
          return fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
          });
        })
        .then((res) => res.json())
        .then((json) => {
          if (json.status === 'ok') {
            showResult(
              result,
              true,
              'ส่งใบสมัครและบันทึกลง Google Docs เรียบร้อยแล้ว ขอบคุณค่ะ\n' +
                'Application submitted and saved to Google Docs.' +
                (json.docUrl ? '\n\nเอกสาร / Document: ' + json.docUrl : '')
            );
            form.reset();
          } else {
            showResult(result, false, 'เกิดข้อผิดพลาดในการบันทึกข้อมูล / Failed to save: ' + (json.message || 'unknown error'));
          }
        })
        .catch((err) => {
          showResult(result, false, 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง / Could not submit, please try again.\n' + err.message);
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  function initPrint() {
    document.getElementById('printBtn').addEventListener('click', () => window.print());
  }

  buildEducationTable();
  buildLanguageTable();
  buildQaTable();
  initDefaultRows();
  applyDefaultConstraints();
  initPhotoPreview();
  initSameAsPresent();
  initAgeAutoCalc();
  initFormSubmit();
  initPrint();
})();
