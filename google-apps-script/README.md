# บันทึกใบสมัครงานลง Google Docs อัตโนมัติ

สคริปต์นี้รับข้อมูลจากฟอร์ม `index.html` แล้วสร้าง Google Docs ใบใหม่ (ตั้งชื่อตามชื่อผู้สมัคร + วันเวลา) โดยอัตโนมัติทุกครั้งที่มีคนกดส่งใบสมัคร

การเชื่อมต่อ Google Docs ต้องใช้บัญชี Google ของคุณเอง จึงต้องทำ 2 ขั้นตอนต่อไปนี้ด้วยตัวเอง (ใช้เวลาประมาณ 5-10 นาที):

## ขั้นตอนที่ 1: สร้างและ Deploy Google Apps Script

1. ไปที่ [script.google.com](https://script.google.com) แล้วกด **New project**
2. ลบโค้ดเริ่มต้นทั้งหมด แล้วคัดลอกเนื้อหาทั้งหมดจากไฟล์ [`Code.gs`](./Code.gs) ในโฟลเดอร์นี้ไปวางแทน
3. (ไม่บังคับ) หากต้องการเก็บเอกสารใบสมัครไว้ในโฟลเดอร์ Google Drive เฉพาะ:
   - สร้างโฟลเดอร์ใน Google Drive แล้วคัดลอก Folder ID จาก URL (ส่วนหลัง `/folders/`)
   - นำไปใส่ในตัวแปร `TARGET_FOLDER_ID` บรรทัดบนสุดของ `Code.gs`
4. (ไม่บังคับ) หากต้องการให้บันทึกสรุปแต่ละใบสมัครเป็นแถวใน Google Sheet ด้วย (นอกเหนือจาก Google Docs):
   - สร้าง Google Sheet เปล่า แล้วคัดลอก Spreadsheet ID จาก URL
   - นำไปใส่ในตัวแปร `LOG_SPREADSHEET_ID`
5. กด **Deploy > New deployment**
6. เลือกประเภท (ไอคอนรูปเฟือง) เป็น **Web app**
7. ตั้งค่า:
   - **Execute as:** Me (บัญชีของคุณ)
   - **Who has access:** Anyone
8. กด **Deploy** แล้วกด **Authorize access** ยืนยันสิทธิ์การเข้าถึง Google Docs/Drive/Sheets ของบัญชีคุณ (จะมีหน้าเตือนว่าแอปยังไม่ได้ยืนยันจาก Google ให้กด Advanced > Go to [ชื่อโปรเจกต์] (unsafe) เนื่องจากเป็นสคริปต์ของคุณเอง)
9. คัดลอก **Web app URL** ที่ได้ (รูปแบบ `https://script.google.com/macros/s/xxxxx/exec`)

## ขั้นตอนที่ 2: เชื่อมฟอร์มเข้ากับ Web App

เปิดไฟล์ `assets/js/config.js` แล้วนำ URL ที่ได้ไปวางแทนค่าว่าง:

```js
window.APP_CONFIG = {
  GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/xxxxx/exec',
};
```

บันทึกไฟล์ แล้ว commit/push (หรือแจ้ง URL ให้ฉันช่วยใส่และ push ให้ก็ได้)

## ทดสอบ

เปิดฟอร์มบนเว็บ กรอกข้อมูลแล้วกดส่งใบสมัคร ระบบจะ:

1. ส่งข้อมูลไปที่ Google Apps Script
2. สร้าง Google Docs ใบใหม่ในบัญชี Google Drive ของคุณ (หรือในโฟลเดอร์ที่ตั้งค่าไว้)
3. แสดงลิงก์เอกสารที่สร้างในหน้าฟอร์มเมื่อสำเร็จ

หากต้องการแก้ไขข้อความ/หัวข้อในเอกสารที่สร้าง สามารถแก้ได้ที่ฟังก์ชัน `createApplicationDoc` ใน `Code.gs`
