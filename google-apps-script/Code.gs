// Divana Employment Application receiver.
// Deploy this as a Google Apps Script Web App - see README.md for setup steps.
// Generated Google Docs follow the layout/section order of the official
// "ใบสมัครงาน / Application for Employment - divana" paper form template.

// ตั้งค่า (ไม่บังคับ): Folder ID ปลายทางเก็บเอกสารใบสมัครใน Google Drive
var TARGET_FOLDER_ID = '';
// ตั้งค่า (ไม่บังคับ): Spreadsheet ID สำหรับบันทึกสรุปแต่ละใบสมัครเป็นแถวเพิ่มเติม
var LOG_SPREADSHEET_ID = '';

// การจำกัดรูปแบบข้อมูลที่รับเข้ามา (server-side validation)
var REQUIRED_FIELDS = ['positionApplied', 'firstNameThai', 'lastNameThai', 'idNo', 'mobile', 'email', 'signature'];
var MAX_FIELD_LENGTH = 2000;
var MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // 8 MB ต่อคำขอ
var MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB ต่อรูปภาพ (ก่อนเข้ารหัส base64)
var ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var MOBILE_PATTERN = /^0[0-9]{8,9}$/;
var ID_PATTERN = /^[A-Za-z0-9]{6,20}$/;

// ตัวเลือกแบบ checkbox ตามฟอร์มต้นฉบับ
var MILITARY_OPTIONS = [
  { value: 'exempted', th: 'ได้รับการยกเว้น', en: 'Exempted' },
  { value: 'reserved', th: 'ปลดกองหนุน', en: 'Reserved' },
  { value: 'not-recruited', th: 'ยังไม่ผ่านการเกณฑ์', en: 'Will be Recruited' },
];
var MARITAL_OPTIONS = [
  { value: 'single', th: 'โสด', en: 'Single' },
  { value: 'married', th: 'สมรส', en: 'Married' },
  { value: 'divorced', th: 'หย่าร้าง', en: 'Divorced' },
  { value: 'other', th: 'อื่นๆ', en: 'Other' },
];
var DRIVE_OPTIONS = [
  { value: 'no', th: 'ไม่ได้', en: 'No' },
  { value: 'yes', th: 'ได้', en: 'Yes' },
];
var QA_YESNO_OPTIONS = [
  { value: 'yes', th: 'มี', en: 'Yes' },
  { value: 'no', th: 'ไม่มี', en: 'No' },
];
var QA_YESNO_TEMP_OPTIONS = [
  { value: 'yes', th: 'ได้', en: 'Yes' },
  { value: 'no', th: 'ไม่ได้', en: 'No' },
  { value: 'temporary', th: 'ชั่วคราว', en: 'Temporary' },
];

var EDUCATION_LEVELS = [
  'ประถมศึกษา / Primary School', 'มัธยมศึกษา / Secondary', 'อาชีวศึกษา / Vocational',
  'ปริญญาตรี / Bachelor', 'ปริญญาโท / Master', 'อื่นๆ / Other',
];
var EDUCATION_COLS = ['fromYear', 'toYear', 'institute', 'degree', 'major', 'gpa'];
var EDUCATION_HEADER = [
  'ระดับการศึกษา\nEducation', 'ปีที่เข้า\nFrom Year', 'ปีที่จบ\nTo Year',
  "สถาบันการศึกษา\nInstitute's Name", 'วุฒิการศึกษา\nDegree', 'สาขา\nMajor Subject', 'เกรดเฉลี่ย\nGPA',
];

var WORK_HEADER = [
  'ว/ด/ปี ที่เข้า\nFrom D/M/Y', 'ถึง ว/ด/ปี\nTo D/M/Y', "ชื่อบริษัท\nCompany's Name",
  'ตำแหน่ง\nPosition', 'ลักษณะงานที่ทำ\nMain Duties', 'เงินเดือน\nLast Salary', 'เหตุผลที่ลาออก\nReason for Leaving',
];
var TRAINING_HEADER = ['หลักสูตร\nCourses', 'สถาบัน\nInstitute', 'ปีที่เรียน\nYear', 'วุฒิบัตร\nCertificate'];
var REFERENCE_HEADER = ['ชื่อ-สกุล\nName-Surname', 'อาชีพ\nOccupation', 'เบอร์ติดต่อ\nMobile', 'ความสัมพันธ์\nRelationship'];

var LANGUAGES = ['ไทย / Thai', 'อังกฤษ / English', 'จีน / Chinese', 'อื่นๆ / Other'];
var LANG_SKILLS = ['listening', 'speaking', 'reading', 'writing'];
var LANG_LEVEL_LABELS = { good: 'ดีมาก / Good', fair: 'ปานกลาง / Fair', poor: 'ไม่ดี / Poor' };
var LANG_HEADER = ['ภาษา\nLanguages', 'เจ้าของภาษา\nNative', 'ฟัง\nListening', 'พูด\nSpeaking', 'อ่าน\nReading', 'เขียน\nWriting'];

var QUESTIONS = [
  {
    key: 'q_relatives',
    th: 'ท่านมีญาติ/พี่น้อง/เพื่อน ที่ทำงานในบริษัทนี้หรือไม่ ถ้ามี กรุณาระบุ',
    en: 'Do you have any relative/friend working in this company?',
    options: QA_YESNO_OPTIONS,
  },
  {
    key: 'q_dismissed',
    th: 'ท่านเคยถูกปลดออกจากงานไม่ว่ากรณีใดหรือไม่ ถ้าเคยกรุณาระบุเหตุผล',
    en: 'Have you ever been dismissed from employment for any reasons? If yes, please explain.',
    options: QA_YESNO_OPTIONS,
  },
  {
    key: 'q_criminal',
    th: 'ท่านเคยถูกจับกุม หรือมีประวัติอาชญากรรมในคดีต่างๆ หรือไม่',
    en: 'Have you ever been arrested or had any criminal records?',
    options: QA_YESNO_OPTIONS,
  },
  {
    key: 'q_health',
    th: 'ท่านมีความบกพร่องทางร่างกายหรือจิตใจ มีโรคเรื้อรัง หรือโรคต่อไปนี้หรือไม่ (กามโรค วัณโรค เรื้อน ลมบ้าหมู หอบหืด โรคพิษสุราเรื้อรัง ไวรัสตับอักเสบ หรือความบกพร่องอื่นๆ)',
    en: 'Do you have a body or mental disorder, chronic disease, Venereal disease, tuberculosis, leprosy, epilepsy, asthma, hepatitis, addiction or other disabilities?',
    options: QA_YESNO_OPTIONS,
  },
  {
    key: 'q_shift',
    th: 'ท่านสามารถทำงานเป็นกะ / ทำงานกลางคืน ได้หรือไม่',
    en: 'Are you able to do shift-work / night shift?',
    options: QA_YESNO_TEMP_OPTIONS,
  },
  {
    key: 'q_relocate',
    th: 'ท่านสามารถทำงานต่างจังหวัด ได้หรือไม่',
    en: 'Are you able to work in other provinces?',
    options: QA_YESNO_TEMP_OPTIONS,
  },
  {
    key: 'q_abroad',
    th: 'ท่านสามารถปฏิบัติงานต่างประเทศได้หรือไม่',
    en: 'Are you able to work abroad?',
    options: QA_YESNO_TEMP_OPTIONS,
  },
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var rawContent = e.postData.contents || '';
    if (rawContent.length > MAX_PAYLOAD_BYTES) {
      return jsonResponse({ status: 'error', message: 'ขนาดข้อมูลเกินกำหนด / Payload too large' });
    }
    var data = JSON.parse(rawContent);
    var validationError = validateSubmission(data);
    if (validationError) {
      return jsonResponse({ status: 'error', message: validationError });
    }
    var doc = createApplicationDoc(data);
    logToSheet(data, doc.getUrl());
    return jsonResponse({ status: 'ok', docUrl: doc.getUrl() });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function validateSubmission(data) {
  if (!data || typeof data !== 'object') {
    return 'รูปแบบข้อมูลไม่ถูกต้อง / Invalid payload format';
  }

  for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
    var field = REQUIRED_FIELDS[i];
    if (!data[field] || String(data[field]).trim() === '') {
      return 'กรุณากรอกข้อมูลให้ครบถ้วน / Missing required field: ' + field;
    }
  }

  if (!EMAIL_PATTERN.test(String(data.email))) {
    return 'รูปแบบอีเมลไม่ถูกต้อง / Invalid email format';
  }
  if (!MOBILE_PATTERN.test(String(data.mobile))) {
    return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 ตามด้วยตัวเลข 8-9 หลัก) / Invalid mobile number format';
  }
  if (!ID_PATTERN.test(String(data.idNo))) {
    return 'รูปแบบเลขบัตรประชาชน/พาสปอร์ตไม่ถูกต้อง / Invalid ID/Passport format';
  }

  for (var key in data) {
    if (!data.hasOwnProperty(key) || key === 'photoBase64') continue;
    var value = data[key];
    if (typeof value === 'string' && value.length > MAX_FIELD_LENGTH) {
      return 'ข้อมูลในฟิลด์ ' + key + ' ยาวเกินไป / Field "' + key + '" is too long';
    }
  }

  if (data.photoBase64) {
    if (ALLOWED_PHOTO_MIME_TYPES.indexOf(data.photoMimeType) === -1) {
      return 'รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG หรือ WebP เท่านั้น / Unsupported photo type';
    }
    var approxPhotoBytes = Math.floor(data.photoBase64.length * 0.75);
    if (approxPhotoBytes > MAX_PHOTO_BYTES) {
      return 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB / Photo must be 5 MB or smaller';
    }
  }

  return null;
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

  buildHeaderSection(body, data, timestamp);
  buildPositionSection(body, data);
  buildPersonalDataSection(body, data);
  buildStatusSection(body, data);
  buildAddressSection(body, data);
  buildEmergencyContactSection(body, data);

  buildEducationSection(body, data);
  buildWorkExperienceSection(body, data);
  buildTrainingSection(body, data);

  buildSkillsSection(body, data);
  buildReferenceSection(body, data);
  buildOtherInfoSection(body, data);

  buildCertificationSection(body, data);
  buildOfficeUseSection(body);

  doc.saveAndClose();

  if (TARGET_FOLDER_ID) {
    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }
  return doc;
}

// ---------- ส่วนหัวเอกสาร / Header ----------

function buildHeaderSection(body, data, timestamp) {
  body.appendParagraph('ใบสมัครงาน').setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('Application for Employment - divana').setAlignment(DocumentApp.HorizontalAlignment.CENTER).setItalic(true);
  body.appendParagraph('บันทึกเมื่อ / Submitted: ' + timestamp).setItalic(true);

  appendApplicantPhoto(body, data);

  body.appendParagraph(
    '"โปรดกรอกข้อมูลให้ครบถ้วนตามความเป็นจริง เพื่อประโยชน์ของผู้สมัครงาน บริษัทฯ จะเก็บข้อมูลนี้เป็นความลับ ' +
      'ตามกฎหมาย พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล และเป็นไปตามวัตถุประสงค์ของบริษัทฯ"'
  ).setItalic(true);
  body.appendParagraph('ข้าพเจ้าผู้สมัครงาน ขอให้ข้อมูลส่วนบุคคลของข้าพเจ้าตามความเป็นจริงดังต่อไปนี้').setItalic(true);
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

// ---------- ตำแหน่งที่ต้องการสมัคร / Position ----------

function buildPositionSection(body, data) {
  appendFormRow(body, [
    { label: 'ตำแหน่งที่ต้องการสมัคร / Position Applied', value: data.positionApplied },
    { label: 'เงินเดือนที่ต้องการ / Expected Salary', value: data.expectedSalary },
    { label: 'วันที่สามารถเริ่มงานได้ / Date Available for Employment', value: data.dateAvailable },
  ]);
}

// ---------- ข้อมูลส่วนบุคคล / Personal Data ----------

function buildPersonalDataSection(body, data) {
  appendSectionHeading(body, 'ข้อมูลส่วนบุคคล / Personal Data');

  var thaiName = [data.titleThai, data.firstNameThai, data.lastNameThai].filter(Boolean).join(' ');
  var englishName = [data.titleEnglish, data.firstNameEnglish, data.lastNameEnglish].filter(Boolean).join(' ');

  appendFormRow(body, [
    { label: 'ชื่อ-สกุล (ภาษาไทย) / Name-Surname (Thai)', value: thaiName },
    { label: 'ชื่อเล่น / Nickname', value: data.nickname },
  ]);
  appendFormRow(body, [
    { label: 'Name-Surname (English)', value: englishName },
  ]);
  appendFormRow(body, [
    { label: 'เลขบัตรประจำตัวประชาชน/Passport No. / ID / Passport No.', value: data.idNo },
    { label: 'วันหมดอายุ / Expiry Date', value: data.idExpiry },
  ]);
  appendFormRow(body, [
    { label: 'วัน เดือน ปี เกิด / Date of Birth', value: data.dob },
    { label: 'อายุ / Age', value: data.age },
    { label: 'สัญชาติ / Citizenship', value: data.citizenship },
  ]);
  appendFormRow(body, [
    { label: 'ศาสนา / Religion', value: data.religion },
    { label: 'ส่วนสูง / Height (cm)', value: data.height },
    { label: 'น้ำหนัก / Weight (kg)', value: data.weight },
  ]);
  appendFormRow(body, [
    { label: 'จังหวัดที่เกิด / Province of Birth', value: data.birthProvince },
    { label: 'ประเทศที่เกิด / Country of Birth', value: data.birthCountry },
  ]);
  appendFormRow(body, [
    { label: 'เบอร์โทรศัพท์ / Mobile No.', value: data.mobile },
    { label: 'อีเมล์ / Email', value: data.email },
  ]);
}

// ---------- สถานภาพ / Military, Marital, Children ----------

function buildStatusSection(body, data) {
  appendSectionHeading(body, 'สถานภาพการรับราชการทหาร / Military Status');
  body.appendParagraph(checkboxLine(MILITARY_OPTIONS, data.militaryStatus));

  appendSectionHeading(body, 'สถานภาพสมรส / Marital Status');
  var maritalLine = checkboxLine(MARITAL_OPTIONS, data.maritalStatus);
  if (data.maritalStatus === 'other' && data.maritalStatusOther) {
    maritalLine += '  (' + data.maritalStatusOther + ')';
  }
  body.appendParagraph(maritalLine);

  appendFormRow(body, [
    { label: 'คู่สมรส ชื่อ-สกุล / Spouse\'s Name-Surname', value: data.spouseName },
    { label: 'เบอร์ติดต่อ / Contact No.', value: data.spouseContact },
  ]);

  appendFormRow(body, [
    { label: 'บุตรคนที่ 1 ชื่อ-สกุล / Child 1 Name-Surname', value: data.child1Name },
    { label: 'อายุ / Age', value: data.child1Age },
  ]);
  appendFormRow(body, [
    { label: 'บุตรคนที่ 2 ชื่อ-สกุล / Child 2 Name-Surname', value: data.child2Name },
    { label: 'อายุ / Age', value: data.child2Age },
  ]);
  appendFormRow(body, [
    { label: 'บุตรคนที่ 3 ชื่อ-สกุล / Child 3 Name-Surname', value: data.child3Name },
    { label: 'อายุ / Age', value: data.child3Age },
  ]);
}

// ---------- ที่อยู่ / Address ----------

function buildAddressSection(body, data) {
  appendSectionHeading(body, 'ที่อยู่ปัจจุบัน / Present Address');
  appendFormRow(body, [
    { label: 'บ้านเลขที่ / House No.', value: data.presentHouseNo },
    { label: 'ถนน / ซอย / Street', value: data.presentStreet },
  ]);
  appendFormRow(body, [
    { label: 'ตำบล / แขวง / Sub-district', value: data.presentSubdistrict },
    { label: 'อำเภอ / เขต / District', value: data.presentDistrict },
  ]);
  appendFormRow(body, [
    { label: 'จังหวัด / Province', value: data.presentProvince },
    { label: 'รหัสไปรษณีย์ / Post Code', value: data.presentPostcode },
    { label: 'ประเทศ / Country', value: data.presentCountry },
  ]);

  appendSectionHeading(body, 'ที่อยู่ตามทะเบียนบ้าน / Registered Address');
  appendFormRow(body, [
    { label: 'บ้านเลขที่ / House No.', value: data.regHouseNo },
    { label: 'ถนน / ซอย / Street', value: data.regStreet },
  ]);
  appendFormRow(body, [
    { label: 'ตำบล / แขวง / Sub-district', value: data.regSubdistrict },
    { label: 'อำเภอ / เขต / District', value: data.regDistrict },
  ]);
  appendFormRow(body, [
    { label: 'จังหวัด / Province', value: data.regProvince },
    { label: 'รหัสไปรษณีย์ / Post Code', value: data.regPostcode },
    { label: 'ประเทศ / Country', value: data.regCountry },
  ]);
}

function buildEmergencyContactSection(body, data) {
  appendSectionHeading(body, 'บุคคลที่ติดต่อได้กรณีฉุกเฉิน / In Case of Emergency, Please Notify');
  appendFormRow(body, [
    { label: 'ชื่อ-สกุล / Name-Surname', value: data.emergencyName },
    { label: 'ความสัมพันธ์ / Relationship', value: data.emergencyRelationship },
    { label: 'เบอร์โทรศัพท์ / Mobile No.', value: data.emergencyMobile },
  ]);
}

// ---------- ประวัติการศึกษา / Academic Background ----------

function buildEducationSection(body, data) {
  appendSectionHeading(body, 'ประวัติการศึกษา / Academic Background');
  var tableData = [EDUCATION_HEADER];
  EDUCATION_LEVELS.forEach(function (levelLabel, i) {
    var row = [levelLabel];
    EDUCATION_COLS.forEach(function (col) {
      row.push(data['edu_' + i + '_' + col] || '-');
    });
    tableData.push(row);
  });
  var table = body.appendTable(tableData);
  table.getRow(0).editAsText().setBold(true);
}

function buildWorkExperienceSection(body, data) {
  appendSectionHeading(body, 'ประวัติการทำงาน / Work Experience');
  body.appendParagraph('เรียงจากปัจจุบันไปจนถึงที่ทำงานแรก / List Your Full-Time Employment Experiences with The Most Recent First').setItalic(true);
  appendDynamicTable(body, data, 'workTable', WORK_HEADER);
}

function buildTrainingSection(body, data) {
  appendSectionHeading(body, 'ประวัติการฝึกอบรม / Training');
  appendDynamicTable(body, data, 'trainingTable', TRAINING_HEADER);
}

// ---------- ทักษะและความสามารถ / Skill and Abilities ----------

function buildSkillsSection(body, data) {
  appendSectionHeading(body, 'ทักษะและความสามารถ / Skill and Abilities');

  body.appendParagraph('ความสามารถด้านภาษา / Language Proficiency').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  var langTableData = [LANG_HEADER];
  LANGUAGES.forEach(function (langLabel, i) {
    var name = data['lang_' + i + '_name'] || langLabel;
    var native = data['lang_' + i + '_native'] ? '✓' : '-';
    var row = [name, native];
    LANG_SKILLS.forEach(function (skill) {
      var val = data['lang_' + i + '_' + skill];
      row.push(val ? LANG_LEVEL_LABELS[val] || val : '-');
    });
    langTableData.push(row);
  });
  var langTable = body.appendTable(langTableData);
  langTable.getRow(0).editAsText().setBold(true);

  body.appendParagraph('ความสามารถด้านอื่นๆ / Other Abilities').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  appendFormRow(body, [{ label: 'ความสามารถด้านคอมพิวเตอร์ / Computer Program', value: data.computerSkills }]);
  appendFormRow(body, [{ label: 'ความสามารถด้านอื่นๆ / Other', value: data.otherAbilities }]);

  body.appendParagraph('ความสามารถในการขับขี่ / Driving Ability').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  appendFormRow(body, [
    { label: 'รถยนต์ / Car', value: checkboxLine(DRIVE_OPTIONS, data.canDriveCar) },
    { label: 'เลขใบขับขี่ / Driving License No.', value: data.carLicenseNo },
  ]);
  appendFormRow(body, [
    { label: 'รถจักรยานยนต์ / Motorcycle', value: checkboxLine(DRIVE_OPTIONS, data.canDriveMotorcycle) },
    { label: 'เลขใบขับขี่ / Driving License No.', value: data.motorcycleLicenseNo },
  ]);
}

function buildReferenceSection(body, data) {
  appendSectionHeading(body, 'บุคคลอ้างอิง / Reference (Former Colleagues or Friend)');
  appendDynamicTable(body, data, 'referenceTable', REFERENCE_HEADER);
}

function buildOtherInfoSection(body, data) {
  appendSectionHeading(body, 'ข้อมูลอื่นๆ / Other Information');
  var tableData = [['คำถาม\nQuestion', 'คำตอบ\nAnswer', 'โปรดระบุรายละเอียด\nPlease Give Particulars']];
  QUESTIONS.forEach(function (q) {
    var answer = checkboxLine(q.options, data[q.key]);
    var detail = data[q.key + '_detail'] || '-';
    tableData.push([q.th + '\n' + q.en, answer, detail]);
  });
  var table = body.appendTable(tableData);
  table.getRow(0).editAsText().setBold(true);
}

// ---------- การรับรองข้อมูล / Certification ----------

function buildCertificationSection(body, data) {
  appendSectionHeading(body, 'การรับรองข้อมูล / Certification');
  body.appendParagraph(
    'ข้าพเจ้าขอรับรองว่า ข้อความที่ได้กรอกในใบสมัครนี้หรือเอกสารอื่นใดที่เกี่ยวกับการสมัครงานนี้ เป็นความจริงทุกประการ ' +
      'หากปรากฏในภายหลังว่าข้าพเจ้าปกปิด และหรือให้ข้อมูลเท็จ ข้าพเจ้ายินดีให้บริษัทฯ พิจารณาเลิกจ้างข้าพเจ้าโดยทันที ' +
      'โดยไม่ต้องจ่ายค่าชดเชยและค่าเสียหายใดๆ ทั้งสิ้น และถ้าบริษัทฯ ได้รับความเสียหายด้วยประการใดๆ ในกรณีนี้ ' +
      'ข้าพเจ้ายินยอมที่จะชดใช้ค่าเสียหายนั้นๆ แก่บริษัทฯ จนครบถ้วน โดยไม่ยกข้อต่อสู้ใดๆ ขึ้นได้แม้แต่กับบริษัทฯ เป็นอันขาด'
  );
  body.appendParagraph(
    'I certify that the given information and document are true and correct. I acknowledge that a proven of false ' +
      'information or document, the company has right to terminate my employment immediately without compensation or ' +
      'severance pay. I agree to compensate the company for any damage incurred from the provision of the false information.'
  ).setItalic(true);

  body.appendParagraph('( ' + (data.signature || '') + ' )').setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph('ผู้สมัคร (ลงชื่อ) Applicant\'s Signature').setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
}

function buildOfficeUseSection(body) {
  appendSectionHeading(body, 'สำหรับฝ่ายบริหารทรัพยากรมนุษย์ / For Office Use Only');
  body.appendParagraph('☐ divana wellness Company Limited    ☐ divana Global Company Limited    ☐ Other ..........................');
  appendFormRow(body, [
    { label: 'Interview Date', value: '' },
    { label: 'Interview by', value: '' },
  ]);
  appendFormRow(body, [
    { label: 'Position', value: '' },
    { label: 'Department/Branch', value: '' },
  ]);
  body.appendParagraph('Interview Result   ☐ Pass    ☐ Not Pass');
  appendFormRow(body, [
    { label: 'Base Salary', value: '' },
    { label: 'Other Allowance (If any)', value: '' },
  ]);
  appendFormRow(body, [
    { label: 'Commence Date', value: '' },
    { label: 'Report to', value: '' },
  ]);
  appendFormRow(body, [
    { label: 'Comment (HR Officer)', value: '' },
    { label: 'Comment (HR Manager)', value: '' },
  ]);
  appendFormRow(body, [
    { label: 'HR Officer / Date', value: '' },
    { label: 'HR Manager / Date', value: '' },
  ]);
}

// ---------- Helpers ----------

function appendSectionHeading(body, text) {
  body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function checkboxLine(options, selectedValue) {
  return options
    .map(function (opt) {
      return (selectedValue === opt.value ? '☑' : '☐') + ' ' + opt.th + ' ' + opt.en;
    })
    .join('     ');
}

// สร้างหนึ่งแถวของฟอร์ม (ตาราง 1 แถว หลายคอลัมน์) โดย label เป็นตัวหนา ค่าอยู่บรรทัดถัดไป
function appendFormRow(body, cellSpecs) {
  var texts = cellSpecs.map(function (c) {
    return c.label + '\n' + (c.value === undefined || c.value === null || c.value === '' ? '-' : String(c.value));
  });
  var table = body.appendTable([texts]);
  var row = table.getRow(0);
  cellSpecs.forEach(function (c, i) {
    var labelLen = c.label.length;
    if (labelLen > 0) {
      var text = row.getCell(i).editAsText();
      text.setBold(0, labelLen - 1, true);
      text.setFontSize(0, labelLen - 1, 9);
    }
  });
  return table;
}

function appendDynamicTable(body, data, prefix, header) {
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
  var colCount = header.length;
  var rowIndexes = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
  var tableData = [header];
  rowIndexes.forEach(function (idx) {
    var hasRowData = false;
    for (var ci = 0; ci < colCount; ci++) {
      if (rows[idx][ci]) { hasRowData = true; break; }
    }
    if (!hasRowData) return;
    var row = [];
    for (var c = 0; c < colCount; c++) row.push(rows[idx][c] || '');
    tableData.push(row);
  });
  if (tableData.length > 1) {
    var table = body.appendTable(tableData);
    table.getRow(0).editAsText().setBold(true);
  } else {
    var table2 = body.appendTable([header, header.map(function () { return '-'; })]);
    table2.getRow(0).editAsText().setBold(true);
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
