// Divana Employment Application receiver.
// Deploy this as a Google Apps Script Web App - see README.md for setup steps.

// ตั้งค่า (ไม่บังคับ): Folder ID ปลายทางเก็บเอกสารใบสมัครใน Google Drive
var TARGET_FOLDER_ID = '';
// ตั้งค่า (ไม่บังคับ): Spreadsheet ID สำหรับบันทึกสรุปแต่ละใบสมัครเป็นแถวเพิ่มเติม
var LOG_SPREADSHEET_ID = '';

var SECTION_FIELDS = [
  { title: 'ตำแหน่งที่สมัคร / Position', fields: [
    ['positionApplied', 'ตำแหน่งที่ต้องการสมัคร / Position Applied'],
    ['expectedSalary', 'เงินเดือนที่ต้องการ / Expected Salary'],
    ['dateAvailable', 'วันที่สามารถเริ่มงานได้ / Date Available'],
  ]},
  { title: 'ข้อมูลส่วนบุคคล / Personal Data', fields: [
    ['titleThai', 'คำนำหน้า (ไทย)'], ['firstNameThai', 'ชื่อ (ไทย)'], ['lastNameThai', 'นามสกุล (ไทย)'],
    ['nickname', 'ชื่อเล่น / Nickname'],
    ['titleEnglish', 'Title (English)'], ['firstNameEnglish', 'First Name'], ['lastNameEnglish', 'Last Name'],
    ['idNo', 'เลขบัตรประชาชน/Passport No.'], ['idExpiry', 'วันหมดอายุบัตร'],
    ['dob', 'วันเดือนปีเกิด'], ['age', 'อายุ'], ['citizenship', 'สัญชาติ'],
    ['religion', 'ศาสนา'], ['height', 'ส่วนสูง (ซม.)'], ['weight', 'น้ำหนัก (กก.)'],
    ['birthProvince', 'จังหวัดที่เกิด'], ['birthCountry', 'ประเทศที่เกิด'],
    ['mobile', 'เบอร์โทรศัพท์'], ['email', 'อีเมล'],
  ]},
  { title: 'สถานภาพ / Status', fields: [
    ['militaryStatus', 'สถานภาพทางทหาร'],
    ['maritalStatus', 'สถานภาพสมรส'], ['maritalStatusOther', 'สถานภาพสมรส (อื่นๆ)'],
    ['spouseName', 'ชื่อคู่สมรส'], ['spouseContact', 'เบอร์ติดต่อคู่สมรส'],
    ['child1Name', 'บุตรคนที่ 1 ชื่อ'], ['child1Age', 'บุตรคนที่ 1 อายุ'],
    ['child2Name', 'บุตรคนที่ 2 ชื่อ'], ['child2Age', 'บุตรคนที่ 2 อายุ'],
    ['child3Name', 'บุตรคนที่ 3 ชื่อ'], ['child3Age', 'บุตรคนที่ 3 อายุ'],
  ]},
  { title: 'ที่อยู่ปัจจุบัน / Present Address', fields: [
    ['presentHouseNo', 'บ้านเลขที่'], ['presentStreet', 'ถนน/ซอย'],
    ['presentSubdistrict', 'ตำบล/แขวง'], ['presentDistrict', 'อำเภอ/เขต'],
    ['presentProvince', 'จังหวัด'], ['presentPostcode', 'รหัสไปรษณีย์'], ['presentCountry', 'ประเทศ'],
  ]},
  { title: 'ที่อยู่ตามทะเบียนบ้าน / Registered Address', fields: [
    ['regHouseNo', 'บ้านเลขที่'], ['regStreet', 'ถนน/ซอย'],
    ['regSubdistrict', 'ตำบล/แขวง'], ['regDistrict', 'อำเภอ/เขต'],
    ['regProvince', 'จังหวัด'], ['regPostcode', 'รหัสไปรษณีย์'], ['regCountry', 'ประเทศ'],
  ]},
  { title: 'บุคคลติดต่อกรณีฉุกเฉิน / Emergency Contact', fields: [
    ['emergencyName', 'ชื่อ-สกุล'], ['emergencyRelationship', 'ความสัมพันธ์'], ['emergencyMobile', 'เบอร์โทรศัพท์'],
  ]},
  { title: 'ความสามารถอื่นๆ / Other Abilities', fields: [
    ['computerSkills', 'ความสามารถด้านคอมพิวเตอร์'], ['otherAbilities', 'ความสามารถอื่นๆ'],
    ['canDriveCar', 'ขับรถยนต์ได้หรือไม่'], ['carLicenseNo', 'เลขใบขับขี่รถยนต์'],
    ['canDriveMotorcycle', 'ขับรถจักรยานยนต์ได้หรือไม่'], ['motorcycleLicenseNo', 'เลขใบขับขี่รถจักรยานยนต์'],
  ]},
  { title: 'การรับรองข้อมูล / Certification', fields: [
    ['agreeCertification', 'ยืนยันข้อมูลถูกต้อง'], ['signature', 'ลายเซ็นผู้สมัคร'],
  ]},
];

var EDUCATION_LEVELS = [
  'ประถมศึกษา / Primary School', 'มัธยมศึกษา / Secondary', 'อาชีวศึกษา / Vocational',
  'ปริญญาตรี / Bachelor', 'ปริญญาโท / Master', 'อื่นๆ / Other',
];
var EDUCATION_COLS = ['fromYear', 'toYear', 'institute', 'degree', 'major', 'gpa'];
var EDUCATION_COL_LABELS = ['ปีที่เข้า', 'ปีที่จบ', 'สถาบันการศึกษา', 'วุฒิการศึกษา', 'สาขา', 'เกรดเฉลี่ย'];

var WORK_COLS = ['ว/ด/ปี ที่เข้า', 'ถึง ว/ด/ปี', 'ชื่อบริษัท', 'ตำแหน่ง', 'ลักษณะงาน', 'เงินเดือน', 'เหตุผลที่ลาออก'];
var TRAINING_COLS = ['หลักสูตร', 'สถาบัน', 'ปีที่เรียน', 'วุฒิบัตร'];
var REFERENCE_COLS = ['ชื่อ-สกุล', 'อาชีพ', 'เบอร์ติดต่อ', 'ความสัมพันธ์'];

var LANGUAGES = ['ไทย / Thai', 'อังกฤษ / English', 'จีน / Chinese', 'อื่นๆ / Other'];
var LANG_SKILLS = ['listening', 'speaking', 'reading', 'writing'];
var LANG_SKILL_LABELS = { listening: 'ฟัง', speaking: 'พูด', reading: 'อ่าน', writing: 'เขียน' };

var QUESTIONS = [
  ['q_relatives', 'มีญาติ/เพื่อนทำงานในบริษัทนี้หรือไม่'],
  ['q_dismissed', 'เคยถูกปลดออกจากงานหรือไม่'],
  ['q_criminal', 'เคยถูกจับกุม/มีประวัติอาชญากรรมหรือไม่'],
  ['q_health', 'มีความบกพร่องทางร่างกาย/จิตใจ หรือโรคประจำตัวหรือไม่'],
  ['q_shift', 'สามารถทำงานเป็นกะ/กลางคืนได้หรือไม่'],
  ['q_relocate', 'สามารถทำงานต่างจังหวัดได้หรือไม่'],
  ['q_abroad', 'สามารถทำงานต่างประเทศได้หรือไม่'],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    var doc = createApplicationDoc(data);
    logToSheet(data, doc.getUrl());
    return jsonResponse({ status: 'ok', docUrl: doc.getUrl() });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Divana application receiver is running.' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function createApplicationDoc(data) {
  var applicantName =
    [data.firstNameThai, data.lastNameThai].filter(Boolean).join(' ') ||
    [data.firstNameEnglish, data.lastNameEnglish].filter(Boolean).join(' ') ||
    'ไม่ระบุชื่อ';
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyy-MM-dd HH:mm');
  var doc = DocumentApp.create('ใบสมัครงาน - ' + applicantName + ' - ' + timestamp);
  var body = doc.getBody();
  body.clear();

  body.appendParagraph('ใบสมัครงาน / Application for Employment - divana').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('บันทึกเมื่อ / Submitted: ' + timestamp).setItalic(true);

  appendApplicantPhoto(body, data);

  SECTION_FIELDS.forEach(function (section) {
    appendSectionHeading(body, section.title);
    section.fields.forEach(function (pair) {
      appendKeyValue(body, pair[1], data[pair[0]]);
    });
  });

  appendSectionHeading(body, 'ประวัติการศึกษา / Academic Background');
  var anyEducation = false;
  EDUCATION_LEVELS.forEach(function (levelLabel, i) {
    var hasAny = EDUCATION_COLS.some(function (col) { return data['edu_' + i + '_' + col]; });
    if (!hasAny) return;
    anyEducation = true;
    body.appendParagraph(levelLabel).setBold(true);
    EDUCATION_COLS.forEach(function (col, ci) {
      appendKeyValue(body, EDUCATION_COL_LABELS[ci], data['edu_' + i + '_' + col]);
    });
  });
  if (!anyEducation) body.appendParagraph('- ไม่มีข้อมูล / None -').setItalic(true);

  appendSectionHeading(body, 'ประวัติการทำงาน / Work Experience');
  appendDynamicTable(body, data, 'workTable', WORK_COLS);

  appendSectionHeading(body, 'ประวัติการฝึกอบรม / Training');
  appendDynamicTable(body, data, 'trainingTable', TRAINING_COLS);

  appendSectionHeading(body, 'ความสามารถด้านภาษา / Language Proficiency');
  var anyLanguage = false;
  LANGUAGES.forEach(function (langLabel, i) {
    var name = data['lang_' + i + '_name'] || langLabel;
    var native = data['lang_' + i + '_native'];
    var skillParts = LANG_SKILLS.map(function (skill) {
      var val = data['lang_' + i + '_' + skill];
      return val ? LANG_SKILL_LABELS[skill] + ': ' + val : null;
    }).filter(Boolean);
    if (!native && skillParts.length === 0) return;
    anyLanguage = true;
    body.appendParagraph(name + (native ? ' (เจ้าของภาษา)' : '')).setBold(true);
    if (skillParts.length) body.appendParagraph(skillParts.join(' | '));
  });
  if (!anyLanguage) body.appendParagraph('- ไม่มีข้อมูล / None -').setItalic(true);

  appendSectionHeading(body, 'บุคคลอ้างอิง / References');
  appendDynamicTable(body, data, 'referenceTable', REFERENCE_COLS);

  appendSectionHeading(body, 'ข้อมูลอื่นๆ / Other Information');
  QUESTIONS.forEach(function (q) {
    var answer = data[q[0]] || '-';
    var detail = data[q[0] + '_detail'];
    appendKeyValue(body, q[1], answer + (detail ? ' (' + detail + ')' : ''));
  });

  doc.saveAndClose();

  if (TARGET_FOLDER_ID) {
    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }
  return doc;
}

function appendApplicantPhoto(body, data) {
  if (!data.photoBase64) return;
  try {
    var bytes = Utilities.base64Decode(data.photoBase64);
    var blob = Utilities.newBlob(bytes, data.photoMimeType || 'image/jpeg', data.photoFileName || 'photo.jpg');
    var image = body.appendImage(blob);
    var maxWidth = 150;
    if (image.getWidth() > maxWidth) {
      var ratio = maxWidth / image.getWidth();
      image.setWidth(maxWidth);
      image.setHeight(Math.round(image.getHeight() * ratio));
    }
  } catch (err) {
    body.appendParagraph('(ไม่สามารถแนบรูปภาพได้ / Could not attach photo: ' + err.message + ')').setItalic(true);
  }
}

function appendSectionHeading(body, text) {
  body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function appendKeyValue(body, label, value) {
  if (value === undefined || value === null || value === '') return;
  var p = body.appendParagraph('');
  p.appendText(label + ': ').setBold(true);
  p.appendText(String(value));
}

function appendDynamicTable(body, data, prefix, colLabels) {
  var rows = {};
  var re = new RegExp('^' + prefix + '_(\\d+)_(\\d+)$');
  Object.keys(data).forEach(function (key) {
    var m = key.match(re);
    if (!m) return;
    var rowIdx = Number(m[1]);
    var colIdx = Number(m[2]);
    rows[rowIdx] = rows[rowIdx] || {};
    rows[rowIdx][colIdx] = data[key];
  });
  var rowIndexes = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
  var tableData = [colLabels];
  rowIndexes.forEach(function (idx) {
    var hasRowData = colLabels.some(function (_, ci) { return rows[idx][ci]; });
    if (!hasRowData) return;
    tableData.push(colLabels.map(function (_, ci) { return rows[idx][ci] || ''; }));
  });
  if (tableData.length > 1) {
    body.appendTable(tableData);
  } else {
    body.appendParagraph('- ไม่มีข้อมูล / None -').setItalic(true);
  }
}

function logToSheet(data, docUrl) {
  if (!LOG_SPREADSHEET_ID) return;
  var ss = SpreadsheetApp.openById(LOG_SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Applications') || ss.insertSheet('Applications');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Position', 'Mobile', 'Email', 'Doc URL']);
  }
  var name = [data.firstNameThai, data.lastNameThai].filter(Boolean).join(' ');
  sheet.appendRow([new Date(), name, data.positionApplied || '', data.mobile || '', data.email || '', docUrl]);
}
