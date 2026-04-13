/** ==========================
 *  CONFIG (ใช้ค่าจากไฟล์หลัก/Code.gs ถ้ามี)
 *  ========================== */
const R500_CACHE_KEY = "REPORT500_OPTIONS_V6";
const R500_CACHE_SEC = 300;

/** ==========================
 *  MAIN SHEET HEADERS
 *  ========================== */
const REPORT500_HEADER_MAP = {
  timestamp: "วันเวลาบันทึก",
  formType: "ประเภทฟอร์ม",
  refNo: "เลขอ้างอิง",
  lps: "ผู้บันทึก",

  reportedBy: "รายงานโดย",
  reporterPosition: "ตำแหน่งผู้รายงาน",
  reporterPositionOther: "ตำแหน่งผู้รายงานอื่นๆ",
  reportDate: "วันที่รายงาน",

  branch: "สาขา",
  branchOther: "สาขาอื่นๆ",
  subject: "เรื่อง",

  reportTypesText: "ประเภทรายงาน",
  reportTypesJson: "ประเภทรายงาน JSON",

  urgencyText: "ระดับความเร่งด่วน",
  urgencyJson: "ระดับความเร่งด่วน JSON",

  notifyToText: "ผู้รับทราบ",
  notifyToJson: "ผู้รับทราบ JSON",

  incidentDate: "วันที่เกิดเหตุ",
  incidentTime: "เวลาเกิดเหตุ",
  incidentDateTime: "วันเวลาเกิดเหตุเต็ม",

  whereDidItHappen: "สถานที่เกิดเหตุหลัก",
  whereTypeText: "ประเภทสถานที่เกิดเหตุ",
  whereTypeJson: "ประเภทสถานที่เกิดเหตุ JSON",
  area: "Area/บริเวณ",

  whatHappen: "เหตุที่เกิด",

  involvedPersonsText: "ผู้เกี่ยวข้อง",
  involvedPersonsJson: "ผู้เกี่ยวข้อง JSON",

  damagesText: "ความเสียหาย",
  damagesJson: "ความเสียหาย JSON",

  stepTakensText: "การดำเนินการ",
  stepTakensJson: "การดำเนินการ JSON",

  offenderStatement: "คำให้การของผู้กระทำผิด",

  evidencesText: "หลักฐานที่พบ",
  evidencesJson: "หลักฐานที่พบ JSON",

  summaryText: "สรุป",

  causesText: "สาเหตุของเหตุการณ์",
  causesJson: "สาเหตุของเหตุการณ์ JSON",

  preventionsText: "การป้องกันเกิดเหตุซ้ำ/เสนอแนะ",
  preventionsJson: "การป้องกันเกิดเหตุซ้ำ/เสนอแนะ JSON",

  learningsText: "ได้อะไรจากการสอบสวน/ข้อขัดข้อง",
  learningsJson: "ได้อะไรจากการสอบสวน/ข้อขัดข้อง JSON",

  imageIds: "รูปภาพ",
  emailRecipients: "อีเมลผู้รับ",

  disciplineEmployeeCode: "รหัสพนักงานค้นหาวินัย",
  disciplineEmployeeName: "ชื่อพนักงานอ้างอิงวินัย",
  disciplineMatchCount: "จำนวนประวัติวินัย",
  disciplineReferenceJson: "ข้อมูลอ้างอิงวินัย",

  pdfFileId: "ไฟล์PDF",
  pdfUrl: "ลิงก์PDF",
  emailSendStatus: "สถานะส่งอีเมล",
  emailSentAt: "เวลาส่งอีเมล"
};

const REPORT500_HEADERS = Object.values(REPORT500_HEADER_MAP);

/** ==========================
 *  MASTER SHEETS
 *  ========================== */
const REPORT500_MASTER_SHEETS = [
  {
    name: "R500_Master_Branch",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "SKDC", ""],
      ["Y", 2, "BBT", ""],
      ["Y", 3, "WNDC", ""],
      ["Y", 4, "LLK", ""],
      ["Y", 5, "KKR", ""],
      ["Y", 6, "LPRDC", ""],
      ["Y", 7, "SRDC", ""],
      ["Y", 8, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_ReportType",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "Situation Report", ""],
      ["Y", 2, "Incident Report", ""],
      ["Y", 3, "Accident Report", ""]
    ]
  },
  {
    name: "R500_Master_Urgency",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "Immediate", ""],
      ["Y", 2, "Urgent", ""],
      ["Y", 3, "Normal", ""]
    ]
  },
  {
    name: "R500_Master_NotifyTo",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "GM. SKDC", ""],
      ["Y", 2, "OM. SKDC", ""],
      ["Y", 3, "OSM. SKDC", ""],
      ["Y", 4, "HR. Manager", ""],
      ["Y", 5, "S&LP Manager", ""],
      ["Y", 6, "FM. Manager", ""],
      ["Y", 7, "Safety Manager", ""],
      ["Y", 8, "System Manager", ""]
    ]
  },
  {
    name: "R500_Master_Location",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "30/1 หมู่ 6 ตำบลคลองควาย อำเภอสามโคก จังหวัดปทุมธานี", ""],
      ["Y", 2, "99/9 หมู่ 2 ตำบลบางกระดี อำเภอเมืองปทุมธานี จังหวัดปทุมธานี", ""]
    ]
  },
  {
    name: "R500_Master_WhereType",
    headers: ["Active", "Sort", "Value", "NeedSuffixInput", "Note"],
    rows: [
      ["Y", 1, "Head Office", "FALSE", ""],
      ["Y", 2, "Distribution Centre Samkhok", "FALSE", ""],
      ["Y", 3, "Hypermarket Store", "TRUE", ""],
      ["Y", 4, "Super market Store", "TRUE", ""],
      ["Y", 5, "Value Store", "TRUE", ""],
      ["Y", 6, "Express Store", "TRUE", ""]
    ]
  },
  {
    name: "R500_Master_PersonPosition",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "Supervisor", ""],
      ["Y", 2, "Officer", ""],
      ["Y", 3, "Staff", ""],
      ["Y", 4, "Employee", ""],
      ["Y", 5, "Security", ""],
      ["Y", 6, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_PersonDepartment",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "S&LP", ""],
      ["Y", 2, "Operation", ""],
      ["Y", 3, "HR", ""],
      ["Y", 4, "Safety", ""],
      ["Y", 5, "Warehouse", ""],
      ["Y", 6, "Transport", ""],
      ["Y", 7, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_PersonRemark",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "Witness", ""],
      ["Y", 2, "Reporter", ""],
      ["Y", 3, "Offender", ""],
      ["Y", 4, "Related Person", ""],
      ["Y", 5, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_ActionType",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "ตรวจสารเสพติดเมทแอเฟตามีน", ""],
      ["Y", 2, "ตรวจวัดปริมาณแอลกอฮอล์", ""],
      ["Y", 3, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_ReporterPosition",
    headers: ["Active", "Sort", "Value", "Note"],
    rows: [
      ["Y", 1, "S&LP Supervisor", ""],
      ["Y", 2, "S&LP Officer", ""],
      ["Y", 3, "OM", ""],
      ["Y", 4, "OSM", ""],
      ["Y", 5, "Safety Officer", ""],
      ["Y", 6, "อื่นๆ", ""]
    ]
  },
  {
    name: "R500_Master_Email",
    headers: ["Active", "Sort", "Value", "Label", "Note"],
    rows: [
      ["Y", 1, "example1@company.com", "ตัวอย่าง 1", ""],
      ["Y", 2, "example2@company.com", "ตัวอย่าง 2", ""]
    ]
  }
];

/** ==========================
 *  OPTIONS
 *  ========================== */
function getReport500Options_() {
  const cache = CacheService.getScriptCache();

  try {
    const cached = cache.get(R500_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const ss = SpreadsheetApp.openById(REPORT500_SPREADSHEET_ID);
  ensureReport500MastersIfMissing_(ss);

  const branchList = readReport500MasterValues_(ss, "R500_Master_Branch");
  const reportTypeList = readReport500MasterValues_(ss, "R500_Master_ReportType");
  const urgencyList = readReport500MasterValues_(ss, "R500_Master_Urgency");
  const notifyToList = readReport500MasterValues_(ss, "R500_Master_NotifyTo");
  const locationList = readReport500MasterValues_(ss, "R500_Master_Location");
  const whereTypeList = readReport500WhereTypeOptions_(ss);
  const personPositionList = readReport500MasterValues_(ss, "R500_Master_PersonPosition");
  const personDepartmentList = readReport500MasterValues_(ss, "R500_Master_PersonDepartment");
  const personRemarkList = readReport500MasterValues_(ss, "R500_Master_PersonRemark");
  const actionTypeList = readReport500MasterValues_(ss, "R500_Master_ActionType");
  const reporterPositionList = readReport500MasterValues_(ss, "R500_Master_ReporterPosition");
  const emailList = readReport500MasterValues_(ss, "R500_Master_Email");

  const result = {
    ok: true,
    data: {
      branchList: branchList,
      reportTypeList: reportTypeList,
      urgencyList: urgencyList,
      notifyToList: notifyToList,

      locationList: locationList,
      whereDidItHappenDefault: locationList.length ? locationList[0] : "",
      whereTypeList: whereTypeList,

      personPositionList: personPositionList,
      personDepartmentList: personDepartmentList,
      personRemarkList: personRemarkList,

      actionTypeList: actionTypeList,
      alcoholResultList: ["พบ", "ไม่พบ"],
      reporterPositionList: reporterPositionList,

      emailList: emailList
    }
  };

  try {
    cache.put(R500_CACHE_KEY, JSON.stringify(result), R500_CACHE_SEC);
  } catch (e) {}

  return result;
}

/** ==========================
 *  SUBMIT
 *  ========================== */
function submitReport500_(payload, files) {
  const ctx = ensureReport500Setup_();
  const sh = ctx.mainSheet;
  ensureHeaders_(sh, REPORT500_HEADERS);

  const now = new Date();
  const ts = Utilities.formatDate(now, ctx.cfg.timezone || REPORT500_TIMEZONE, "dd/MM/yyyy HH:mm:ss");

  const p = payload || {};
  const disciplineSnapshot = normalizeReport500DisciplinePayload_(p);

  const lpsName = norm_(p.lps || p.reportedBy);
  if (!lpsName) throw new Error("ไม่พบชื่อผู้ใช้งานจากระบบเข้าสู่ระบบ");

  const refNo = norm_(p.refNo) || "NOREF";
  const reportDate = report500NormalizeDateText_(p.reportDate) || ts;
  const incidentDate = report500NormalizeDateText_(p.incidentDate);
  const incidentTime = report500NormalizeTimeText_(p.incidentTime);
  const incidentDateTime = report500CombineDateTime_(incidentDate, incidentTime, p.incidentDateTime);

  const branchResolved = report500ResolveSingleWithOther_(p.branch, p.branchOther);
  const reportTypes = report500NormalizeCheckedOptionArray_(p.reportTypes || []);
  const urgencyTypes = report500NormalizeCheckedOptionArray_(p.urgencyTypes || []);
  const notifyTo = report500NormalizeCheckedOptionArray_(p.notifyTo || []);

  const whereDidItHappen = norm_(p.whereDidItHappen);
  const whereTypeSelections = report500NormalizeWhereTypeSelections_(p.whereTypeSelections || []);

  const involvedPersons = report500NormalizeInvolvedPersons_(p.involvedPersons || []);
  const damages = report500NormalizeIndexedTextRows_(p.damages || []);
  const stepTakens = report500NormalizeStepTakens_(p.stepTakens || []);
  const evidences = report500NormalizeIndexedTextRows_(p.evidences || []);
  const causes = report500NormalizeIndexedTextRows_(p.causes || []);
  const preventions = report500NormalizeIndexedTextRows_(p.preventions || []);
  const learnings = report500NormalizeIndexedTextRows_(p.learnings || []);

  const selectedEmails = uniqueValidEmails_(
    []
      .concat(Array.isArray(p.emailRecipients) ? p.emailRecipients : [])
      .concat(splitReport500OtherEmails_(p.emailOther))
  );

  const rowObj = {
    timestamp: ts,
    formType: "Report500",
    refNo: refNo,
    lps: lpsName,

    reportedBy: norm_(p.reportedBy || lpsName),
    reporterPosition: norm_(p.reporterPosition),
    reporterPositionOther: norm_(p.reporterPositionOther),
    reportDate: reportDate,

    branch: branchResolved.value,
    branchOther: branchResolved.otherText,
    subject: norm_(p.subject),

    reportTypesText: report500FormatCheckedOptionSummary_(reportTypes),
    reportTypesJson: JSON.stringify(reportTypes),

    urgencyText: report500FormatCheckedOptionSummary_(urgencyTypes),
    urgencyJson: JSON.stringify(urgencyTypes),

    notifyToText: report500FormatCheckedOptionSummary_(notifyTo),
    notifyToJson: JSON.stringify(notifyTo),

    incidentDate: incidentDate,
    incidentTime: incidentTime,
    incidentDateTime: incidentDateTime,

    whereDidItHappen: whereDidItHappen,
    whereTypeText: report500FormatWhereTypeSummary_(whereTypeSelections),
    whereTypeJson: JSON.stringify(whereTypeSelections),
    area: norm_(p.area),

    whatHappen: norm_(p.whatHappen),

    involvedPersonsText: report500FormatInvolvedPersonsSummary_(involvedPersons),
    involvedPersonsJson: JSON.stringify(involvedPersons),

    damagesText: report500FormatIndexedRowsSummary_(damages),
    damagesJson: JSON.stringify(damages),

    stepTakensText: report500FormatStepTakensSummary_(stepTakens),
    stepTakensJson: JSON.stringify(stepTakens),

    offenderStatement: norm_(p.offenderStatement),

    evidencesText: report500FormatIndexedRowsSummary_(evidences),
    evidencesJson: JSON.stringify(evidences),

    summaryText: norm_(p.summaryText),

    causesText: report500FormatIndexedRowsSummary_(causes),
    causesJson: JSON.stringify(causes),

    preventionsText: report500FormatIndexedRowsSummary_(preventions),
    preventionsJson: JSON.stringify(preventions),

    learningsText: report500FormatIndexedRowsSummary_(learnings),
    learningsJson: JSON.stringify(learnings),

    imageIds: "",
    emailRecipients: selectedEmails.join(", "),

    disciplineEmployeeCode: disciplineSnapshot.disciplineEmployeeCode,
    disciplineEmployeeName: disciplineSnapshot.disciplineEmployeeName,
    disciplineMatchCount: disciplineSnapshot.disciplineMatchCount,
    disciplineReferenceJson: disciplineSnapshot.disciplineReferenceJson,

    pdfFileId: "",
    pdfUrl: "",
    emailSendStatus: selectedEmails.length ? "PENDING" : "SKIPPED",
    emailSentAt: ""
  };

  const rowValues = REPORT500_HEADERS.map(function (header) {
    var key = report500FindKeyByHeader_(header);
    return toSheetTextValue_(rowObj[key]);
  });

  sh.appendRow(rowValues);
  var newRow = sh.getLastRow();

  var savedImages = [];
  var pdfRes = { pdfFileId: "", pdfUrl: "", pdfSizeBytes: 0, error: "" };
  var emailResult = { ok: false, skipped: !selectedEmails.length, recipients: selectedEmails };
  var folderId = "";

  try {
    var rootFolder = resolveReport500WritableRootFolder_(ctx.cfg);
    var caseFolder = getOrCreateSubFolderSafe_(rootFolder, sanitize_(refNo + "_" + REPORT500_FORM_TYPE));
    var imageFolder = getOrCreateSubFolderSafe_(caseFolder, "images");
    var pdfFolder = getOrCreateSubFolderSafe_(caseFolder, "pdf");
    folderId = caseFolder.getId();

    savedImages = saveReport500Images_(imageFolder, files || []);
    if (savedImages.length) {
      rowObj.imageIds = savedImages.map(function (x) { return x.id; }).join("|");
      updateReport500RowFields_(sh, newRow, { imageIds: rowObj.imageIds });
    }

    try {
      var pdfAccessUrl = "";
      if (typeof buildReport500PdfAccessUrl_ === "function") {
        pdfAccessUrl = buildReport500PdfAccessUrl_(rowObj.refNo);
      }

      var out = createReport500PdfViaHtml_({
        refNo: rowObj.refNo,
        data: Object.assign({}, rowObj, {
          imagesJson: JSON.stringify(savedImages)
        }),
        images: savedImages,
        pdfFolder: pdfFolder,
        pdfAccessUrl: pdfAccessUrl
      }) || {};

      if (out.pdfFileId) {
        pdfRes.pdfFileId = norm_(out.pdfFileId);
        pdfRes.pdfUrl = norm_(out.pdfUrl);
        pdfRes.pdfSizeBytes = Number(out.pdfSizeBytes || 0);
        pdfRes.pdfName = norm_(out.pdfName || "");

        updateReport500RowFields_(sh, newRow, {
          pdfFileId: pdfRes.pdfFileId,
          pdfUrl: pdfRes.pdfUrl
        });
      } else {
        pdfRes.error = "สร้างไฟล์ PDF ของ Report500 ไม่สำเร็จ";
      }
    } catch (pdfErr) {
      pdfRes.error = report500DescribeErr_(pdfErr);
    }

    if (selectedEmails.length) {
      if (pdfRes.pdfFileId) {
        emailResult = sendReport500Email_({
          recipients: selectedEmails,
          pdfFileId: pdfRes.pdfFileId,
          pdfUrl: pdfRes.pdfUrl,
          refNo: rowObj.refNo,
          subjectText: rowObj.subject,
          incidentDateTime: rowObj.incidentDateTime,
          reportedBy: rowObj.reportedBy,
          branch: rowObj.branch,
          pdfSizeBytes: pdfRes.pdfSizeBytes
        });

        updateReport500RowFields_(sh, newRow, {
          emailSendStatus: emailResult.ok
            ? (emailResult.attachmentMode === "LINK_ONLY"
                ? "SENT_LINK_ONLY (" + emailResult.recipients.length + ")"
                : "SENT (" + emailResult.recipients.length + ")")
            : "FAILED: " + (emailResult.error || "Unknown error"),
          emailSentAt: emailResult.ok ? ts : ""
        });
      } else {
        emailResult = {
          ok: false,
          skipped: false,
          recipients: selectedEmails,
          error: "ไม่ได้ส่งอีเมล เพราะสร้าง PDF ไม่สำเร็จ"
        };
        updateReport500RowFields_(sh, newRow, {
          emailSendStatus: "FAILED: PDF_NOT_READY",
          emailSentAt: ""
        });
      }
    }

  } catch (driveErr) {
    var driveMsg = report500DescribeErr_(driveErr);

    updateReport500RowFields_(sh, newRow, {
      emailSendStatus: selectedEmails.length ? "FAILED: " + driveMsg : "SKIPPED"
    });

    return {
      ok: true,
      partial: true,
      saveCompleted: false,
      message: "บันทึกข้อมูลหลักไม่สำเร็จ เนื่องจากระบบจัดเก็บไฟล์มีปัญหา",
      timestamp: ts,
      refNo: rowObj.refNo,
      lpsName: lpsName,
      folderId: "",
      imageCount: 0,
      imageIds: [],
      pdfFileId: "",
      pdfUrl: "",
      pdfSizeBytes: 0,
      pdfSizeText: formatBytes_(0),
      pdfError: driveMsg,
      emailResult: {
        ok: false,
        skipped: !selectedEmails.length,
        recipients: selectedEmails,
        error: driveMsg
      }
    };
  }

  try { CacheService.getScriptCache().remove(R500_CACHE_KEY); } catch (e) {}

  var saveCompleted = !!pdfRes.pdfFileId;
  var message = saveCompleted
    ? (selectedEmails.length
        ? (emailResult.ok
            ? "บันทึกข้อมูลและสร้าง PDF สำเร็จ พร้อมส่งอีเมลเรียบร้อย"
            : "บันทึกข้อมูลและสร้าง PDF สำเร็จ แต่ส่งอีเมลไม่สำเร็จ")
        : "บันทึกข้อมูลและสร้าง PDF สำเร็จ")
    : "บันทึกข้อมูลสำเร็จ แต่สร้าง PDF ไม่สำเร็จ";

  return {
    ok: true,
    partial: !saveCompleted,
    saveCompleted: saveCompleted,
    message: message,
    timestamp: ts,
    refNo: rowObj.refNo,
    lpsName: lpsName,
    folderId: folderId,
    imageCount: savedImages.length,
    imageIds: savedImages.map(function (x) { return x.id; }),
    pdfFileId: pdfRes.pdfFileId,
    pdfUrl: pdfRes.pdfUrl,
    pdfSizeBytes: pdfRes.pdfSizeBytes,
    pdfSizeText: formatBytes_(pdfRes.pdfSizeBytes),
    pdfError: pdfRes.error || "",
    emailResult: emailResult
  };
}

/** ==========================
 *  PDF OPEN
 *  ========================== */
function openReport500PdfByRef_(refNo) {
  var ref = norm_(refNo);
  if (!ref) return { ok: false, error: "กรุณาระบุ Ref No." };

  var ss = SpreadsheetApp.openById(REPORT500_SPREADSHEET_ID);
  var sh = ss.getSheetByName(REPORT500_MAIN_SHEET_NAME);
  if (!sh) return { ok: false, error: "ไม่พบชีท Report500" };

  ensureHeaders_(sh, REPORT500_HEADERS);

  var data = sh.getDataRange().getDisplayValues();
  if (data.length < 2) return { ok: false, error: "ยังไม่มีข้อมูลในชีท Report500" };

  var headerMap = report500HeaderIndexMap_(sh);
  var refCol = headerMap[REPORT500_HEADER_MAP.refNo];
  var pdfCol = headerMap[REPORT500_HEADER_MAP.pdfUrl];

  if (!refCol || !pdfCol) return { ok: false, error: "ไม่พบคอลัมน์ Ref หรือ PDF URL" };

  for (var r = 2; r <= data.length; r++) {
    var row = data[r - 1];
    if (norm_(row[refCol - 1]) === ref) {
      var pdfUrl = norm_(row[pdfCol - 1]);
      if (!pdfUrl) return { ok: false, error: "ยังไม่พบไฟล์ PDF ของ Ref นี้" };
      return { ok: true, refNo: ref, pdfUrl: pdfUrl };
    }
  }

  return { ok: false, error: "ไม่พบข้อมูล Ref นี้" };
}

/** ==========================
 *  SETUP
 *  ========================== */
function ensureReport500Setup_() {
  var cfg = getReport500Config_();
  var ss = SpreadsheetApp.openById(cfg.spreadsheetId);
  ensureReport500MasterSheets_(ss);

  var mainSheet = ss.getSheetByName(cfg.mainSheetName);
  if (!mainSheet) mainSheet = ss.insertSheet(cfg.mainSheetName);
  ensureHeaders_(mainSheet, REPORT500_HEADERS);

  return {
    cfg: cfg,
    ss: ss,
    mainSheet: mainSheet
  };
}

function ensureReport500MastersIfMissing_(ss) {
  var existing = {};
  ss.getSheets().forEach(function (sh) {
    existing[String(sh.getName() || "").trim()] = true;
  });

  var needsCreate = REPORT500_MASTER_SHEETS.some(function (def) {
    return !existing[String(def.name || "").trim()];
  });

  if (needsCreate) ensureReport500MasterSheets_(ss);
}

function ensureReport500MasterSheets_(ss) {
  REPORT500_MASTER_SHEETS.forEach(function (def) {
    var name = String(def.name || "").trim();
    if (!name) return;

    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);

    var headers = Array.isArray(def.headers) ? def.headers : [];
    ensureHeaders_(sh, headers);

    if (sh.getLastRow() < 2 && Array.isArray(def.rows) && def.rows.length) {
      sh.getRange(2, 1, def.rows.length, headers.length).setValues(def.rows);
    }
  });
}

/** ==========================
 *  MASTER READERS
 *  ========================== */
function readReport500MasterValues_(ss, sheetName) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return [];

  var values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (x) { return norm_(x); });
  var idxActive = headers.indexOf("Active");
  var idxValue = headers.indexOf("Value");
  var idxSort = headers.indexOf("Sort");

  if (idxValue < 0) return [];

  var rows = values.slice(1).map(function (row) {
    return {
      active: idxActive >= 0 ? isActiveSheetValue_(row[idxActive]) : true,
      value: norm_(row[idxValue]),
      sort: idxSort >= 0 ? Number(row[idxSort] || 999999) : 999999
    };
  });

  return rows
    .filter(function (x) { return x.active && x.value; })
    .sort(function (a, b) { return a.sort - b.sort || String(a.value).localeCompare(String(b.value), "th"); })
    .map(function (x) { return x.value; });
}

function readReport500WhereTypeOptions_(ss) {
  var sh = ss.getSheetByName("R500_Master_WhereType");
  if (!sh) return [];

  var values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (x) { return norm_(x); });
  var idxActive = headers.indexOf("Active");
  var idxSort = headers.indexOf("Sort");
  var idxValue = headers.indexOf("Value");
  var idxNeed = headers.indexOf("NeedSuffixInput");

  if (idxValue < 0) return [];

  var rows = values.slice(1).map(function (row) {
    return {
      active: idxActive >= 0 ? isActiveSheetValue_(row[idxActive]) : true,
      sort: idxSort >= 0 ? Number(row[idxSort] || 999999) : 999999,
      value: norm_(row[idxValue]),
      needSuffixInput: idxNeed >= 0 ? isTrueLike_(row[idxNeed]) : false
    };
  });

  return rows
    .filter(function (x) { return x.active && x.value; })
    .sort(function (a, b) { return a.sort - b.sort || String(a.value).localeCompare(String(b.value), "th"); })
    .map(function (x) {
      return {
        value: x.value,
        needSuffixInput: !!x.needSuffixInput
      };
    });
}

/** ==========================
 *  ROW HELPERS
 *  ========================== */
function report500HeaderIndexMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var map = {};
  headers.forEach(function (h, i) {
    map[String(h || "").trim()] = i + 1;
  });
  return map;
}

function updateReport500RowFields_(sheet, rowNumber, patchObj) {
  if (!sheet || !rowNumber || rowNumber < 2 || !patchObj) return;

  var headerMap = report500HeaderIndexMap_(sheet);

  Object.keys(patchObj).forEach(function (key) {
    var headerName = REPORT500_HEADER_MAP[key];
    if (!headerName) return;

    var col = headerMap[headerName];
    if (!col) return;

    sheet.getRange(rowNumber, col).setValue(toSheetTextValue_(patchObj[key]));
  });
}

function report500FindKeyByHeader_(headerName) {
  var h = norm_(headerName);
  for (var k in REPORT500_HEADER_MAP) {
    if (REPORT500_HEADER_MAP[k] === h) return k;
  }
  return "";
}

/** ==========================
 *  NORMALIZERS
 *  ========================== */
function report500ResolveSingleWithOther_(value, otherText) {
  var v = norm_(value);
  var other = norm_(otherText);

  if (report500IsOther_(v)) {
    return { value: v, otherText: other };
  }
  return { value: v, otherText: other };
}

function report500NormalizeCheckedOptionArray_(arr) {
  var list = Array.isArray(arr) ? arr : [];
  return list.map(function (item) {
    if (typeof item === "string") {
      return { value: norm_(item), checked: true, otherText: "" };
    }
    return {
      value: norm_(item && item.value),
      checked: !!(item && (item.checked === true || String(item.checked) === "true" || String(item.checked) === "1")),
      otherText: norm_(item && (item.otherText || item.textValue))
    };
  }).filter(function (x) {
    return x.value;
  });
}

function report500NormalizeWhereTypeSelections_(arr) {
  var list = Array.isArray(arr) ? arr : [];
  return list.map(function (item, idx) {
    return {
      seq: idx + 1,
      value: norm_(item && item.value),
      checked: !!(item && (item.checked === true || String(item.checked) === "true" || String(item.checked) === "1")),
      suffixText: norm_(item && item.suffixText)
    };
  }).filter(function (x) {
    return x.value;
  });
}

function report500NormalizeInvolvedPersons_(arr) {
  var list = Array.isArray(arr) ? arr : [];
  return list.map(function (x, idx) {
    return {
      seq: Number(x && x.seq || (idx + 1)),
      who: norm_(x && x.who),
      position: norm_(x && x.position),
      positionOther: norm_(x && x.positionOther),
      department: norm_(x && x.department),
      departmentOther: norm_(x && x.departmentOther),
      remark: norm_(x && x.remark),
      remarkOther: norm_(x && x.remarkOther)
    };
  }).filter(function (x) {
    return x.who || x.position || x.positionOther || x.department || x.departmentOther || x.remark || x.remarkOther;
  });
}

function report500NormalizeIndexedTextRows_(arr) {
  var list = Array.isArray(arr) ? arr : [];
  return list.map(function (x, idx) {
    return {
      seq: Number(x && x.seq || (idx + 1)),
      title: norm_(x && (x.title || x.text)),
      detail: norm_(x && x.detail)
    };
  }).filter(function (x) {
    return x.title || x.detail;
  });
}

function report500NormalizeStepTakens_(arr) {
  var list = Array.isArray(arr) ? arr : [];
  return list.map(function (x, idx) {
    return {
      seq: Number(x && x.seq || (idx + 1)),
      actionType: norm_(x && x.actionType),
      actionTypeOther: norm_(x && x.actionTypeOther),
      alcoholResult: norm_(x && x.alcoholResult),
      alcoholMgPercent: norm_(x && x.alcoholMgPercent),
      drugConfirmed: norm_(x && x.drugConfirmed),
      drugShortDetail: norm_(x && x.drugShortDetail),
      detail: norm_(x && x.detail)
    };
  }).filter(function (x) {
    return x.actionType || x.actionTypeOther || x.alcoholResult || x.alcoholMgPercent || x.drugConfirmed || x.drugShortDetail || x.detail;
  });
}

function report500NormalizeDateText_(v) {
  var s = norm_(v);
  if (!s) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[3] + "/" + m[2] + "/" + m[1];
  return s;
}

function report500NormalizeTimeText_(v) {
  var s = norm_(v);
  if (!s) return "";
  if (/^\d{2}:\d{2}$/.test(s)) return s + ":00";
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  return s;
}

function report500CombineDateTime_(dateText, timeText, fallback) {
  var d = norm_(dateText);
  var t = norm_(timeText);
  if (d && t) return d + " " + t;
  return norm_(fallback);
}

/** ==========================
 *  FORMATTERS
 *  ========================== */
function report500FormatCheckedOptionSummary_(arr) {
  return report500NormalizeCheckedOptionArray_(arr)
    .filter(function (x) { return x.checked; })
    .map(function (x) {
      return x.value + (x.otherText ? ": " + x.otherText : "");
    })
    .join(" | ");
}

function report500FormatWhereTypeSummary_(arr) {
  return report500NormalizeWhereTypeSelections_(arr)
    .filter(function (x) { return x.checked; })
    .map(function (x) {
      return x.value + (x.suffixText ? " " + x.suffixText : "");
    })
    .join(" | ");
}

function report500FormatInvolvedPersonsSummary_(arr) {
  return report500NormalizeInvolvedPersons_(arr).map(function (x) {
    var positionText = report500ResolveDisplayWithOther_(x.position, x.positionOther);
    var departmentText = report500ResolveDisplayWithOther_(x.department, x.departmentOther);
    var remarkText = report500ResolveDisplayWithOther_(x.remark, x.remarkOther);
    return [x.who, positionText, departmentText, remarkText].filter(Boolean).join(" / ");
  }).join(" | ");
}

function report500FormatIndexedRowsSummary_(arr) {
  return report500NormalizeIndexedTextRows_(arr).map(function (x) {
    return [x.seq + ".", x.title, x.detail].filter(Boolean).join(" ");
  }).join(" | ");
}

function report500FormatStepTakensSummary_(arr) {
  return report500NormalizeStepTakens_(arr).map(function (x) {
    var parts = [];
    var actionLabel = report500ResolveDisplayWithOther_(x.actionType, x.actionTypeOther);
    if (actionLabel) parts.push(actionLabel);
    if (x.alcoholResult) parts.push("ผลแอลกอฮอล์: " + x.alcoholResult);
    if (x.alcoholMgPercent) parts.push("Mg%: " + x.alcoholMgPercent);
    if (x.drugConfirmed) parts.push("ผลยืนยัน: " + x.drugConfirmed);
    if (x.drugShortDetail) parts.push("รายละเอียดสารเสพติด: " + x.drugShortDetail);
    if (x.detail) parts.push(x.detail);
    return x.seq + ". " + parts.join(" / ");
  }).join(" | ");
}

function report500ResolveDisplayWithOther_(value, otherText) {
  var v = norm_(value);
  var o = norm_(otherText);
  if (report500IsOther_(v) && o) return o;
  return v || o;
}

function report500IsOther_(value) {
  var s = String(value || "").trim().toLowerCase();
  return s === "อื่นๆ" || s === "other" || s === "others";
}

/** ==========================
 *  FILES / EMAIL
 *  ========================== */
function saveReport500Images_(folder, files) {
  var out = [];
  var list = Array.isArray(files) ? files : [];

  list.forEach(function (f, idx) {
    var base64 = String(f && f.base64 || "").trim();
    if (!base64) return;

    var mimeType = String(f && f.mimeType || "image/jpeg").trim() || "image/jpeg";
    var filename = sanitize_(String(f && (f.filename || f.name) || ("report500_image_" + (idx + 1) + ".jpg")));
    var caption = String(f && f.caption || "").trim();

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    var file = folder.createFile(blob);

    out.push({
      id: file.getId(),
      filename: filename,
      caption: caption,
      url: driveFileIdToViewUrl_(file.getId())
    });
  });

  return out;
}

function sendReport500Email_(opts) {
  var recipients = uniqueValidEmails_(opts && opts.recipients || []);
  if (!recipients.length) return { ok: false, skipped: true, recipients: [] };

  var pdfFileId = norm_(opts && opts.pdfFileId);
  var pdfUrl = norm_(opts && opts.pdfUrl);
  var refNo = norm_(opts && opts.refNo);
  var subjectText = norm_(opts && opts.subjectText);
  var incidentDateTime = norm_(opts && opts.incidentDateTime);
  var reportedBy = norm_(opts && opts.reportedBy);
  var branch = norm_(opts && opts.branch);
  var pdfSizeBytes = Number(opts && opts.pdfSizeBytes || 0);

  if (!pdfFileId && !pdfUrl) {
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: "ไม่พบไฟล์ PDF หรือ URL สำหรับส่งอีเมล"
    };
  }

  var mailSubject = "[REPORT] " + (refNo || "-") + (subjectText ? (" - " + subjectText) : "");
  var htmlBody = [
    '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#111">',
      '<div style="font-size:18px;font-weight:700;margin-bottom:12px">รายงาน Report500</div>',
      '<div><b>Ref No:</b> ' + escapeHtml_(refNo || "-") + '</div>',
      '<div><b>เรื่อง:</b> ' + escapeHtml_(subjectText || "-") + '</div>',
      '<div><b>วันเวลาเกิดเหตุ:</b> ' + escapeHtml_(incidentDateTime || "-") + '</div>',
      '<div><b>รายงานโดย:</b> ' + escapeHtml_(reportedBy || "-") + '</div>',
      '<div><b>สาขา:</b> ' + escapeHtml_(branch || "-") + '</div>',
      '<div style="margin-top:14px">กรุณาดูรายละเอียดจากไฟล์ PDF แนบ หรือเปิดจากลิงก์ด้านล่าง</div>',
      pdfUrl
        ? ('<div style="margin-top:10px"><a href="' + escapeHtml_(pdfUrl) + '" target="_blank">เปิดไฟล์ PDF</a></div>')
        : '',
    '</div>'
  ].join("");

  try {
    var attachmentMode = "LINK_ONLY";
    var mailOptions = {
      htmlBody: htmlBody,
      name: "S&LP Smart Form"
    };

    if (pdfFileId) {
      try {
        var pdfFile = DriveApp.getFileById(pdfFileId);
        var blob = pdfFile.getBlob();

        // ถ้าไฟล์ไม่ใหญ่เกินไป ให้แนบไฟล์ไปด้วย
        if (blob && pdfSizeBytes > 0 && pdfSizeBytes <= 18 * 1024 * 1024) {
          mailOptions.attachments = [blob];
          attachmentMode = "ATTACHED";
        }
      } catch (attachErr) {
        attachmentMode = "LINK_ONLY";
      }
    }

    GmailApp.sendEmail(
      recipients.join(","),
      mailSubject,
      "ระบบอีเมลนี้รองรับ HTML กรุณาเปิดในอีเมลไคลเอนต์ที่เหมาะสม",
      mailOptions
    );

    return {
      ok: true,
      skipped: false,
      recipients: recipients,
      attachmentMode: attachmentMode,
      pdfUrl: pdfUrl
    };

  } catch (err) {
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: report500DescribeErr_(err)
    };
  }
}

/** ==========================
 *  CONFIG / ROOT FOLDER
 *  ========================== */
function getReport500Config_() {
  return {
    spreadsheetId: REPORT500_SPREADSHEET_ID,
    mainSheetName: REPORT500_MAIN_SHEET_NAME,
    rootFolderId: REPORT500_ROOT_FOLDER_ID,
    timezone: REPORT500_TIMEZONE,
    formType: REPORT500_FORM_TYPE,
    logoFileId: (typeof LOGO_FILE_ID !== "undefined" ? LOGO_FILE_ID : "")
  };
}

function resolveReport500WritableRootFolder_(cfg) {
  var folderId = norm_(cfg && cfg.rootFolderId);
  if (!folderId) {
    throw new Error("ยังไม่ได้ตั้งค่า REPORT500_ROOT_FOLDER_ID");
  }
  return DriveApp.getFolderById(folderId);
}

function getOrCreateSubFolderSafe_(parent, name) {
  var folderName = sanitize_(name || "folder");
  var it = parent.getFoldersByName(folderName);
  if (it.hasNext()) return it.next();
  return parent.createFolder(folderName);
}

/** ==========================
 *  DISCIPLINE SNAPSHOT
 *  ========================== */
function normalizeReport500DisciplinePayload_(payload) {
  payload = payload || {};

  var employeeCode = norm_(payload.disciplineEmployeeCode || payload.employeeCodeForDiscipline);
  var employeeName = norm_(payload.disciplineEmployeeName || payload.employeeNameForDiscipline);
  var rawRecords = payload.disciplineRecords || payload.disciplineReference || [];

  var records = Array.isArray(rawRecords) ? rawRecords : [];
  var cleaned = records.map(function (row) {
    return {
      violationDate: norm_(row && row.violationDate),
      employeeCode: norm_(row && row.employeeCode),
      employeeName: norm_(row && row.employeeName),
      department: norm_(row && row.department),
      category: norm_(row && row.category),
      subject: norm_(row && row.subject),
      docStatus: norm_(row && row.docStatus),
      result: norm_(row && row.result),
      supervisor: norm_(row && row.supervisor),
      actionDate: norm_(row && row.actionDate)
    };
  }).filter(function (row) {
    return row.employeeCode || row.employeeName || row.subject || row.result;
  });

  return {
    disciplineEmployeeCode: employeeCode,
    disciplineEmployeeName: employeeName,
    disciplineMatchCount: cleaned.length,
    disciplineReferenceJson: JSON.stringify(cleaned)
  };
}

/** ==========================
 *  OTHER EMAILS
 *  ========================== */
function splitReport500OtherEmails_(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map(function (x) { return String(x || "").trim(); })
    .filter(Boolean);
}

/** ==========================
 *  HELPERS
 *  ========================== */
function isActiveSheetValue_(value) {
  var s = String(value == null ? "" : value).trim().toLowerCase();
  return s === "y" || s === "yes" || s === "true" || s === "1";
}

function isTrueLike_(value) {
  var s = String(value == null ? "" : value).trim().toLowerCase();
  return s === "y" || s === "yes" || s === "true" || s === "1";
}

function report500DescribeErr_(err) {
  if (!err) return "Unknown error";
  return String(err && err.message ? err.message : err);
}
function report500ResolveDisplayWithOther_(value, otherText) {
  var v = norm_(value);
  var o = norm_(otherText);
  if (report500IsOther_(v) && o) return o;
  return v || o;
}

function report500IsOther_(value) {
  var s = String(value || "").trim().toLowerCase();
  return s === "อื่นๆ" || s === "other" || s === "others";
}

/** ==========================
 *  FILES / EMAIL
 *  ========================== */
function saveReport500Images_(folder, files) {
  var out = [];
  var list = Array.isArray(files) ? files : [];

  list.forEach(function (f, idx) {
    var base64 = String(f && f.base64 || "").trim();
    if (!base64) return;

    var mimeType = String(f && f.mimeType || "image/jpeg").trim() || "image/jpeg";
    var filename = sanitize_(String(f && (f.filename || f.name) || ("report500_image_" + (idx + 1) + ".jpg")));
    var caption = String(f && f.caption || "").trim();

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    var file = folder.createFile(blob);

    out.push({
      id: file.getId(),
      filename: filename,
      caption: caption,
      url: driveFileIdToViewUrl_(file.getId())
    });
  });

  return out;
}

function sendReport500Email_(opts) {
  var recipients = uniqueValidEmails_(opts && opts.recipients || []);
  if (!recipients.length) return { ok: false, skipped: true, recipients: [] };

  var pdfFileId = norm_(opts && opts.pdfFileId);
  var pdfUrl = norm_(opts && opts.pdfUrl);
  var refNo = norm_(opts && opts.refNo);
  var subjectText = norm_(opts && opts.subjectText);
  var incidentDateTime = norm_(opts && opts.incidentDateTime);
  var reportedBy = norm_(opts && opts.reportedBy);
  var branch = norm_(opts && opts.branch);
  var pdfSizeBytes = Number(opts && opts.pdfSizeBytes || 0);

  if (!pdfFileId && !pdfUrl) {
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: "ไม่พบไฟล์ PDF หรือ URL สำหรับส่งอีเมล"
    };
  }

  var mailSubject = "[REPORT] " + (refNo || "-") + (subjectText ? (" - " + subjectText) : "");
  var htmlBody = [
    '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#111">',
      '<div style="font-size:18px;font-weight:700;margin-bottom:12px">รายงาน Report500</div>',
      '<div><b>Ref No:</b> ' + escapeHtml_(refNo || "-") + '</div>',
      '<div><b>เรื่อง:</b> ' + escapeHtml_(subjectText || "-") + '</div>',
      '<div><b>วันเวลาเกิดเหตุ:</b> ' + escapeHtml_(incidentDateTime || "-") + '</div>',
      '<div><b>รายงานโดย:</b> ' + escapeHtml_(reportedBy || "-") + '</div>',
      '<div><b>สาขา:</b> ' + escapeHtml_(branch || "-") + '</div>',
      '<div style="margin-top:14px">กรุณาดูรายละเอียดจากไฟล์ PDF แนบ หรือเปิดจากลิงก์ด้านล่าง</div>',
      pdfUrl
        ? ('<div style="margin-top:10px"><a href="' + escapeHtml_(pdfUrl) + '" target="_blank">เปิดไฟล์ PDF</a></div>')
        : '',
    '</div>'
  ].join("");

  try {
    var attachmentMode = "LINK_ONLY";
    var mailOptions = {
      htmlBody: htmlBody,
      name: "S&LP Smart Form"
    };

    if (pdfFileId) {
      try {
        var pdfFile = DriveApp.getFileById(pdfFileId);
        var blob = pdfFile.getBlob();

        if (blob && pdfSizeBytes > 0 && pdfSizeBytes <= 18 * 1024 * 1024) {
          mailOptions.attachments = [blob];
          attachmentMode = "ATTACHED";
        }
      } catch (attachErr) {
        attachmentMode = "LINK_ONLY";
      }
    }

    GmailApp.sendEmail(
      recipients.join(","),
      mailSubject,
      "ระบบอีเมลนี้รองรับ HTML กรุณาเปิดในอีเมลไคลเอนต์ที่เหมาะสม",
      mailOptions
    );

    return {
      ok: true,
      skipped: false,
      recipients: recipients,
      attachmentMode: attachmentMode,
      pdfUrl: pdfUrl
    };

  } catch (err) {
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: report500DescribeErr_(err)
    };
  }
}

/** ==========================
 *  CONFIG / ROOT FOLDER
 *  ========================== */
function getReport500Config_() {
  return {
    spreadsheetId: REPORT500_SPREADSHEET_ID,
    mainSheetName: REPORT500_MAIN_SHEET_NAME,
    rootFolderId: REPORT500_ROOT_FOLDER_ID,
    timezone: REPORT500_TIMEZONE,
    formType: REPORT500_FORM_TYPE,
    logoFileId: (typeof LOGO_FILE_ID !== "undefined" ? LOGO_FILE_ID : "")
  };
}

function resolveReport500WritableRootFolder_(cfg) {
  var candidates = [
    norm_(cfg && cfg.rootFolderId),
    (typeof REPORT500_ROOT_FOLDER_ID !== "undefined" ? norm_(REPORT500_ROOT_FOLDER_ID) : ""),
    (typeof ROOT_FOLDER_ID !== "undefined" ? norm_(ROOT_FOLDER_ID) : "")
  ].filter(Boolean);

  var tried = [];
  for (var i = 0; i < candidates.length; i++) {
    var id = candidates[i];
    try {
      var folder = DriveApp.getFolderById(id);
      folder.getName();
      return folder;
    } catch (err) {
      tried.push(id + " => " + report500DescribeErr_(err));
    }
  }

  throw new Error(
    "ไม่สามารถเข้าถึงโฟลเดอร์ปลายทางได้ กรุณาตรวจสอบ REPORT500_ROOT_FOLDER_ID / ROOT_FOLDER_ID และสิทธิ์ของ Apps Script | " +
    tried.join(" | ")
  );
}

function getOrCreateSubFolderSafe_(parent, name) {
  if (!parent) throw new Error("parent folder is missing");
  var folderName = String(name || "").trim() || "Folder";
  try {
    var found = parent.getFoldersByName(folderName);
    if (found.hasNext()) return found.next();
    return parent.createFolder(folderName);
  } catch (err) {
    throw new Error("สร้าง/เข้าถึงโฟลเดอร์ย่อยไม่สำเร็จ [" + folderName + "] : " + report500DescribeErr_(err));
  }
}

function report500DescribeErr_(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  return String(err.message || err);
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** ==========================
 *  DISCIPLINE SNAPSHOT
 *  ========================== */
function normalizeReport500DisciplinePayload_(payload) {
  payload = payload || {};

  const employeeCode = norm_(payload.disciplineEmployeeCode);
  const employeeName = norm_(payload.disciplineEmployeeName);
  const matchCountRaw = Number(payload.disciplineMatchCount || 0);
  const matchCount = isNaN(matchCountRaw) ? 0 : Math.max(0, matchCountRaw);
  const jsonText = norm_(payload.disciplineReferenceJson);

  if (!jsonText) {
    return {
      disciplineEmployeeCode: "",
      disciplineEmployeeName: "",
      disciplineMatchCount: 0,
      disciplineReferenceJson: ""
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("ข้อมูลอ้างอิงวินัยไม่ถูกต้อง");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("ข้อมูลอ้างอิงวินัยต้องเป็นรายการแบบ array");
  }

  const normalizedRows = parsed.map(function (row) {
    row = row || {};
    return {
      violationDate: norm_(row.violationDate),
      employeeCode: norm_(row.employeeCode),
      employeeName: norm_(row.employeeName),
      department: norm_(row.department),
      category: norm_(row.category),
      subject: norm_(row.subject),
      docStatus: norm_(row.docStatus),
      result: norm_(row.result),
      supervisor: norm_(row.supervisor),
      actionDate: norm_(row.actionDate)
    };
  }).filter(function (row) {
    return row.employeeCode || row.employeeName || row.subject || row.result;
  });

  return {
    disciplineEmployeeCode: employeeCode,
    disciplineEmployeeName: employeeName,
    disciplineMatchCount: matchCount || normalizedRows.length,
    disciplineReferenceJson: JSON.stringify(normalizedRows)
  };
}
function report500ResolveDisplayWithOther_(value, otherText) {
  var v = norm_(value);
  var o = norm_(otherText);
  if (report500IsOther_(v) && o) return o;
  return v || o;
}

function report500IsOther_(value) {
  var s = String(value || "").trim().toLowerCase();
  return s === "อื่นๆ" || s === "other" || s === "others";
}

/** ==========================
 *  FILES / EMAIL
 *  ========================== */
function saveReport500Images_(folder, files) {
  var out = [];
  var list = Array.isArray(files) ? files : [];

  list.forEach(function (f, idx) {
    var base64 = String(f && f.base64 || "").trim();
    if (!base64) return;

    var mimeType = String(f && f.mimeType || "image/jpeg").trim() || "image/jpeg";
    var filename = sanitize_(String(f && (f.filename || f.name) || ("report500_image_" + (idx + 1) + ".jpg")));
    var caption = String(f && f.caption || "").trim();

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    var file = folder.createFile(blob);

    out.push({
      id: file.getId(),
      filename: filename,
      caption: caption,
      url: driveFileIdToViewUrl_(file.getId())
    });
  });

  return out;
}

function sendReport500Email_(opts) {
  var recipients = uniqueValidEmails_(opts && opts.recipients || []);
  if (!recipients.length) return { ok: false, skipped: true, recipients: [] };

  var refNo = norm_(opts && opts.refNo);
  var subjectText = norm_(opts && opts.subjectText);
  var incidentDateTime = norm_(opts && opts.incidentDateTime);
  var reportedBy = norm_(opts && opts.reportedBy);
  var branch = norm_(opts && opts.branch);
  var pdfFileId = norm_(opts && opts.pdfFileId);
  var pdfUrl = norm_(opts && opts.pdfUrl);
  var pdfName = norm_(opts && opts.pdfName);

  if (!pdfFileId) {
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: "ไม่พบไฟล์ PDF"
    };
  }

  try {
    var file = DriveApp.getFileById(pdfFileId);
    var effectivePdfName = pdfName || sanitize_((refNo || "NOREF") + "_" + (subjectText || "Report500")) + ".pdf";
    var pdfBlob = file.getBlob().setName(effectivePdfName);
    var pdfSizeBytes = Number(opts && opts.pdfSizeBytes || pdfBlob.getBytes().length || 0);
    var safeAttachmentLimit = 17 * 1024 * 1024;
    var attachPdf = pdfSizeBytes > 0 && pdfSizeBytes <= safeAttachmentLimit;

    var subject = ("[REPORT500] " + (refNo || "-") + " " + (subjectText || "")).trim();

    var htmlBody = [
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;line-height:1.65">',
        '<div style="font-size:18px;font-weight:700;margin-bottom:10px">ระบบส่งReportอัตโนมัติ</div>',
        '<div>ระบบได้บันทึกรายงานเรียบร้อยแล้ว</div>',
        '<table style="margin-top:12px;border-collapse:collapse;width:100%;max-width:760px">',
          '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:800;width:180px">Ref No.</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' + escapeHtml_(refNo || "-") + '</td></tr>',
          '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:800">เรื่อง</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' + escapeHtml_(subjectText || "-") + '</td></tr>',
          '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:800">วันเวลาเกิดเหตุ</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' + escapeHtml_(incidentDateTime || "-") + '</td></tr>',
          '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:800">รายงานโดย</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' + escapeHtml_(reportedBy || "-") + '</td></tr>',
          '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:800">สาขา</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' + escapeHtml_(branch || "-") + '</td></tr>',
        '</table>',
        (pdfUrl
          ? '<div style="margin-top:14px">เปิดไฟล์ PDF: <a href="' + escapeHtml_(pdfUrl) + '" target="_blank">' + escapeHtml_(pdfUrl) + '</a></div>'
          : ''),
        '<div style="margin-top:14px;color:#6b7280">อีเมลฉบับนี้ถูกส่งจากระบบอัตโนมัติ</div>',
      '</div>'
    ].join("");

    var mailOptions = {
      name: "S&LP Smart Form",
      htmlBody: htmlBody
    };

    if (attachPdf) {
      mailOptions.attachments = [pdfBlob];
    }

    GmailApp.sendEmail(
      recipients.join(","),
      subject,
      "ระบบได้บันทึกรายงานเรียบร้อยแล้ว",
      mailOptions
    );

    return {
      ok: true,
      skipped: false,
      recipients: recipients,
      pdfUrl: pdfUrl,
      attachmentMode: attachPdf ? "ATTACHED" : "LINK_ONLY",
      pdfSizeBytes: pdfSizeBytes,
      pdfSizeText: formatBytes_(pdfSizeBytes),
      pdfName: effectivePdfName
    };
  } catch (err) {
    var msg = String(err && err.message ? err.message : err);
    if (/script\.send_mail|MailApp|GmailApp/i.test(msg)) {
      msg = "MAIL_PERMISSION_REQUIRED: " + msg;
    }
    return {
      ok: false,
      skipped: false,
      recipients: recipients,
      error: msg
    };
  }
}

/** ==========================
 *  GENERAL HELPERS
 *  ========================== */
function getReport500Config_() {
  return {
    spreadsheetId: (typeof REPORT500_SPREADSHEET_ID !== "undefined"
      ? REPORT500_SPREADSHEET_ID
      : SPREADSHEET_ID),

    mainSheetName: (typeof REPORT500_MAIN_SHEET_NAME !== "undefined"
      ? REPORT500_MAIN_SHEET_NAME
      : "Report500"),

    rootFolderId: (typeof REPORT500_ROOT_FOLDER_ID !== "undefined"
      ? REPORT500_ROOT_FOLDER_ID
      : ROOT_FOLDER_ID),

    formType: "Report500",

    logoFileId: (typeof LOGO_FILE_ID !== "undefined" ? LOGO_FILE_ID : ""),
    timezone: (typeof REPORT500_TIMEZONE !== "undefined"
      ? REPORT500_TIMEZONE
      : (typeof TZ !== "undefined" ? TZ : "Asia/Bangkok"))
  };
}

function splitReport500OtherEmails_(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map(function (x) { return norm_(x); })
    .filter(Boolean);
}

function uniqueValidEmails_(arr) {
  var list = Array.isArray(arr) ? arr : [arr];
  var out = [];
  var seen = {};
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

  list.forEach(function (v) {
    var s = norm_(v);
    if (!s || !re.test(s)) return;
    var k = s.toLowerCase();
    if (seen[k]) return;
    seen[k] = true;
    out.push(s);
  });

  return out;
}

function ensureHeaders_(sheet, headers) {
  var list = Array.isArray(headers) ? headers : [];
  if (!sheet || !list.length) return;

  if (sheet.getMaxColumns() < list.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), list.length - sheet.getMaxColumns());
  }

  var current = sheet.getRange(1, 1, 1, list.length).getDisplayValues()[0];
  var same = current.join("||") === list.join("||");

  if (!same) {
    sheet.getRange(1, 1, 1, list.length).setValues([list]);
    sheet.getRange(1, 1, 1, list.length).setFontWeight("bold");
  }
}

function toSheetTextValue_(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function formatBytes_(bytes) {
  var n = Number(bytes || 0);
  if (!n) return "0 B";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

function driveFileIdToViewUrl_(id) {
  var fid = norm_(id);
  return fid ? ("https://drive.google.com/file/d/" + encodeURIComponent(fid) + "/view?usp=drivesdk") : "";
}

function sanitize_(s) {
  return String(s == null ? "" : s)
    .replace(/[\\/:*?"<>|#%&{}$!'@+=`~]/g, "_")
    .replace(/\s+/g, "_");
}

function norm_(v) {
  return String(v == null ? "" : v).trim();
}
