const API_BASE = "https://bol.somchaibutphon.workers.dev";

/** ==========================
 *  SHARED PROGRESS UI
 *  ใช้ร่วมกันทั้ง Error_BOL และ Report500
 *  ========================== */
const ProgressUI = (() => {
  const stageIds = ["validate", "upload", "save", "pdf", "email"];

  const el = {
    overlay: () => $("progressOverlay"),
    card: () => $("progressCard"),
    title: () => $("progressTitle"),
    subtitle: () => $("progressSubtitle"),
    percent: () => $("progressPercentText"),
    step: () => $("progressStepText"),
    bar: () => $("progressBarFill"),
    hint: () => $("progressHint")
  };

  function safeRow(stageKey) {
    return document.getElementById(`stage-${stageKey}`);
  }

  function reset() {
    el.card()?.classList.remove("success", "error");
    setProgress(0, "เริ่มต้น...");
    stageIds.forEach((id) => {
      const row = safeRow(id);
      if (!row) return;
      row.classList.remove("active", "done", "error");
      const st = row.querySelector(".stage-status");
      if (st) st.textContent = "รอ";
    });
    setHint("กรุณาอย่าปิดหน้าจอหรือรีเฟรชระหว่างการบันทึก");
  }

  function show(title = "กำลังบันทึกข้อมูล", subtitle = "โปรดรอสักครู่ ระบบกำลังประมวลผล") {
    reset();
    if (el.title()) el.title().textContent = title;
    if (el.subtitle()) el.subtitle().textContent = subtitle;
    el.overlay()?.classList.remove("hidden");
    document.body.classList.add("progress-lock");
  }

  function hide(delay = 0) {
    setTimeout(() => {
      el.overlay()?.classList.add("hidden");
      document.body.classList.remove("progress-lock");
    }, delay);
  }

  function setProgress(percent, stepText) {
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    if (el.percent()) el.percent().textContent = `${safe}%`;
    if (el.bar()) el.bar().style.width = `${safe}%`;
    if (stepText && el.step()) el.step().textContent = stepText;
  }

  function setHint(text) {
    if (el.hint()) el.hint().textContent = text || "";
  }

  function setStageState(stageKey, state, text) {
    const row = safeRow(stageKey);
    if (!row) return;
    row.classList.remove("active", "done", "error");
    if (state) row.classList.add(state);

    const st = row.querySelector(".stage-status");
    if (!st) return;

    st.textContent = text || (
      state === "done" ? "เสร็จแล้ว" :
      state === "active" ? "กำลังดำเนินการ" :
      state === "error" ? "เกิดข้อผิดพลาด" :
      "รอ"
    );
  }

  function activateOnly(stageKey, percent, stepText) {
    stageIds.forEach((id) => {
      const row = safeRow(id);
      if (!row) return;
      if (!row.classList.contains("done")) {
        row.classList.remove("active");
        const st = row.querySelector(".stage-status");
        if (st && !row.classList.contains("error")) st.textContent = "รอ";
      }
    });
    setStageState(stageKey, "active");
    if (percent != null) setProgress(percent, stepText || "");
  }

  function markDone(stageKey, percent, stepText, customText) {
    setStageState(stageKey, "done", customText || "เสร็จแล้ว");
    if (percent != null) setProgress(percent, stepText || "");
  }

  function markError(stageKey, message, percent = null) {
    setStageState(stageKey, "error", message || "เกิดข้อผิดพลาด");
    if (percent != null) setProgress(percent);
    el.card()?.classList.remove("success");
    el.card()?.classList.add("error");
  }

  function success(title = "บันทึกสำเร็จ", subtitle = "ข้อมูลถูกบันทึกเรียบร้อยแล้ว") {
    el.card()?.classList.remove("error");
    el.card()?.classList.add("success");
    if (el.title()) el.title().textContent = title;
    if (el.subtitle()) el.subtitle().textContent = subtitle;
    setProgress(100, "เสร็จสมบูรณ์");
  }

  return {
    show,
    hide,
    reset,
    setProgress,
    setHint,
    setStageState,
    activateOnly,
    markDone,
    markError,
    success
  };
})();

window.ProgressUI = ProgressUI;

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 0));
}

function estimateUploadProgressByFiles(fileCount, baseStart = 16, baseEnd = 42) {
  const count = Math.max(1, Number(fileCount) || 1);
  return {
    start: baseStart,
    next: (currentIndex) => {
      const ratio = Math.max(0, Math.min(1, currentIndex / count));
      return Math.round(baseStart + ((baseEnd - baseStart) * ratio));
    },
    end: baseEnd
  };
}

function buildEmailStatusSummary_(json) {
  const emailResult = json?.emailResult || {};
  const emailStatus = String(emailResult.error || json?.emailSendStatus || "").trim();
  const emailOk = !!(emailResult.ok || /SENT/i.test(emailStatus));
  const emailSkipped = !!(emailResult.skipped || /SKIPPED/i.test(emailStatus));
  const attachmentMode = String(emailResult.attachmentMode || "").trim();

  let emailModeText = "ส่งอีเมลเรียบร้อย";
  if (attachmentMode === "LINK_ONLY") emailModeText = "ส่งอีเมลแบบลิงก์ PDF";
  if (attachmentMode === "ATTACHED") emailModeText = "ส่งอีเมลพร้อมไฟล์ PDF";

  return {
    emailResult,
    emailStatus,
    emailOk,
    emailSkipped,
    attachmentMode,
    emailModeText
  };
}

const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
const ITEM_LOOKUP_MIN_LEN = 3;
const ITEM_LOOKUP_DEBOUNCE_MS = 420;
const APP_LOGO_URL = "https://lh5.googleusercontent.com/d/1758AOZ5E3JbnzwrFA4u2kH8nZUPrr8iP";

/** ==========================
 *  STATE
 *  ========================== */
let OPTIONS = {
  errorList: [],
  auditList: [],
  emailList: [],
  osmList: [],
  otmList: [],
  confirmCauseList: [],
  nationalityList: []
};

let AUTH = { name: "", pass: "" };

let ITEM_LOOKUP_STATE = {
  item: "",
  description: "",
  displayText: "",
  found: false,
  loading: false
};

const ITEM_LOCAL_CACHE = new Map();
let itemLookupTimer = null;
const EDITED_UPLOAD_STORE = new WeakMap();

function buildEditedImageBadgeHtml(file) {
  const sizeKb = file?.size ? Math.round(file.size / 1024) : 0;
  return `ไฟล์แก้ไขแล้ว: ${file?.name || "edited-image.jpg"} (${sizeKb} KB)`;
}

function ensureEditButtonForUploadBox(box, inputId) {
  if (!box) return null;

  let btn = box.querySelector(".btnEditImage");
  if (btn) return btn;

  const topRow = box.firstElementChild;
  if (!topRow) return null;

  btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn ghost btnEditImage";
  btn.textContent = "แก้ไขภาพ";

  topRow.appendChild(btn);

  btn.addEventListener("click", async () => {
    const input = $(inputId);
    if (!input) return;

    const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
    const raw = input.files && input.files[0] ? input.files[0] : null;
    const file = edited || raw;

    if (!file) {
      await Swal.fire({
        icon: "info",
        title: "ยังไม่มีรูปภาพ",
        text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
      });
      return;
    }

    await openEditorForUploadInput(input, box);
  });

  return btn;
}

function updateUploadPreviewFromFile(input, box, file, messageText) {
  if (!input || !box || !file) return;

  const img = box.querySelector(".previewImg");
  const txt = box.querySelector(".small");

  if (txt) {
    txt.textContent = messageText || buildEditedImageBadgeHtml(file);
  }

  if (img) {
    if (img.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
    }
    const url = URL.createObjectURL(file);
    img.src = url;
    img.dataset.objectUrl = url;
  }
}

async function openEditorForUploadInput(input, box) {
  if (!window.ImageEditorX || typeof window.ImageEditorX.open !== "function") {
    await Swal.fire({
      icon: "error",
      title: "ยังไม่พร้อมใช้งาน",
      text: "ไม่พบ image-editor.js หรือยังไม่ได้โหลด modal ของ image editor"
    });
    return;
  }

  const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
  const raw = input.files && input.files[0] ? input.files[0] : null;
  const sourceFile = edited || raw;

  if (!sourceFile) return;

  const result = await window.ImageEditorX.open(sourceFile, {
    strokeColor: "#dc2626",
    strokeWidth: 3
  });

  if (!result?.ok || !result.file) return;

  EDITED_UPLOAD_STORE.set(input, {
    edited: true,
    file: result.file,
    filename: result.filename || result.file.name,
    dataUrl: result.dataUrl || ""
  });

  updateUploadPreviewFromFile(
    input,
    box,
    result.file,
    buildEditedImageBadgeHtml(result.file)
  );
}

async function handlePickedImageForUpload(input, box) {
  const f = input?.files && input.files[0] ? input.files[0] : null;
  if (!f) return;

  if (!/^image\//i.test(f.type || "")) {
    input.value = "";
    EDITED_UPLOAD_STORE.delete(input);

    await Swal.fire({
      icon: "warning",
      title: "ไฟล์ไม่ถูกต้อง",
      text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
    });
    return;
  }

  // เปลี่ยนรูปใหม่ ให้ล้างสถานะไฟล์ที่เคยแก้ไว้ก่อน
  EDITED_UPLOAD_STORE.delete(input);

  ensureEditButtonForUploadBox(box, input.id);
updateUploadPreviewFromFile(
  input,
  box,
  f,
  `ไฟล์ที่เลือก: ${f.name} (${Math.round((f.size || 0) / 1024)} KB)`
);
}
const $ = (id) => document.getElementById(id);

/** ==========================
 *  URL / BASIC HELPERS
 *  ========================== */
function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

function norm(v) {
  return String(v == null ? "" : v).trim();
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCurrentThaiBuddhistYearNumber() {
  return new Date().getFullYear() + 543;
}

function driveImgUrl(id) {
  return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
}

function formatDateToDisplay(value) {
  const s = String(value || "").trim();
  if (!s) return "";

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return s;

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return s;
}

function safeSetLoginMsg(msg) {
  const el = $("loginMsg");
  if (el) el.textContent = msg || "";
}

function todayIsoLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function applyStaticLogos() {
  document.querySelectorAll(".brandLogoImg, .loginHeroLogo").forEach((img) => {
    img.setAttribute("src", APP_LOGO_URL);
    img.setAttribute("referrerpolicy", "no-referrer");
    img.setAttribute("loading", "eager");
    img.setAttribute("alt", "S&LP Logo");
  });
}

window.apiUrl = apiUrl;
window.safeSetLoginMsg = safeSetLoginMsg;
window.AUTH = AUTH;
window.API_BASE = API_BASE;

/** ==========================
 *  REF HELPERS
 *  ========================== */
function buildYearOptionsForSelect(selectEl) {
  if (!selectEl) return;
  const currentYear = getCurrentThaiBuddhistYearNumber();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  selectEl.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  selectEl.value = String(currentYear);
}

function bindRefInputs() {
  bindRefPair_("refNo", "refYear");
  bindRefPair_("rptRefNo", "rptRefYear");

  bindDuplicateRefCheck_("refNo", "refYear", "error_bol");
  bindDuplicateRefCheck_("rptRefNo", "rptRefYear", "report500");
}

function bindRefPair_(runningId, yearId) {
  const runningEl = $(runningId);
  const yearEl = $(yearId);
  if (!runningEl || !yearEl) return;
  buildYearOptionsForSelect(yearEl);
  runningEl.addEventListener("input", () => {
    runningEl.value = String(runningEl.value || "").replace(/[^\d]/g, "");
  });
}

function buildRefNo_(runningId, yearId) {
  const running = String($(runningId)?.value || "").replace(/[^\d]/g, "").trim();
  const year = String($(yearId)?.value || "").trim() || String(getCurrentThaiBuddhistYearNumber());
  if (!running) return "";
  return `${running}-${year}`;
}

function getRefNoValue() {
  return buildRefNo_("refNo", "refYear");
}

function getRptRefNoValue() {
  return buildRefNo_("rptRefNo", "rptRefYear");
}
/** ==========================
 *  REF DUPLICATE CHECK HELPERS
 *  เพิ่มใน app.js
 *  ========================== */

const REF_DUPLICATE_STATE = {
  errorBol: {
    lastRefNo: "",
    duplicated: false,
    checked: false,
    result: null
  },
  report500: {
    lastRefNo: "",
    duplicated: false,
    checked: false,
    result: null
  }
};

function getRefDuplicateState_(formType) {
  return formType === "report500"
    ? REF_DUPLICATE_STATE.report500
    : REF_DUPLICATE_STATE.errorBol;
}

function normalizeFrontendRefNo_(value) {
  return String(value || "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

function getErrorBolRefHintEl_() {
  return document.getElementById("refDuplicateHint");
}

function getErrorBolRefWrapEl_() {
  return document.getElementById("refDuplicateWrap");
}

function getReportRefHintEl_() {
  return document.getElementById("rptRefDuplicateHint");
}

function getReportRefWrapEl_() {
  return document.getElementById("rptRefDuplicateWrap");
}

function setRefDuplicateHint_(formType, message, isError = false) {
  const el = formType === "report500"
    ? getReportRefHintEl_()
    : getErrorBolRefHintEl_();

  const wrap = formType === "report500"
    ? getReportRefWrapEl_()
    : getErrorBolRefWrapEl_();

  if (!el || !wrap) return;

  const raw = String(message || "").trim();

  if (!raw) {
    el.innerHTML = "";
    wrap.classList.add("hidden");
    return;
  }

  const formatted = raw
    .replace(/^เลขอ้างอิงซ้ำ\s*/i, "")
    .replace(/Ref ที่กรอก:/g, "||Ref ที่กรอก:")
    .replace(/Ref มาตรฐาน:/g, "||Ref มาตรฐาน:")
    .replace(/ซ้ำกับเอกสาร Error_BOL เดิม:/g, "||ซ้ำกับเอกสาร Error_BOL เดิม:")
    .replace(/ซ้ำกับ Report เดิม:/g, "||ซ้ำกับ Report เดิม:")
    .split("||")
    .map(s => s.trim())
    .filter(Boolean);

  el.innerHTML = formatted.map((line, idx) => {
    const cls = idx < 2 ? "refDupLine refDupMain" : "refDupLine refDupMeta";
    const block = idx === 2 ? " refDupBlock" : "";
    return `<span class="${cls}${block}">${escapeHtml(line)}</span>`;
  }).join("");

  wrap.classList.remove("hidden");
}
function setRefFieldInvalidState_(formType, invalid) {
  const runningEl = formType === "report500"
    ? document.getElementById("rptRefNo")
    : document.getElementById("refNo");

  const yearEl = formType === "report500"
    ? document.getElementById("rptRefYear")
    : document.getElementById("refYear");

  [runningEl, yearEl].forEach((el) => {
    if (!el) return;
    el.classList.toggle("is-invalid", !!invalid);
  });
}

function resetRefDuplicateUi_(formType) {
  const state = getRefDuplicateState_(formType);
  state.lastRefNo = "";
  state.duplicated = false;
  state.checked = false;
  state.result = null;

  const hintEl = formType === "report500"
    ? getReportRefHintEl_()
    : getErrorBolRefHintEl_();

  const wrapEl = formType === "report500"
    ? getReportRefWrapEl_()
    : getErrorBolRefWrapEl_();

  if (hintEl) hintEl.innerHTML = "";
  if (wrapEl) wrapEl.classList.add("hidden");

  setRefFieldInvalidState_(formType, false);
}
function buildDuplicateDetailHtml_(result) {
  const matched = result?.matched || {};
  const sourceSystem = String(matched?.sourceSystem || result?.system || "").trim().toUpperCase();

  const systemLabel = sourceSystem === "REPORT500" ? "Report500" : "Error_BOL";
  const titleText = sourceSystem === "REPORT500"
    ? "พบเลขอ้างอิงซ้ำกับเอกสารในระบบ Report"
    : "พบเลขอ้างอิงซ้ำกับเอกสารในระบบ Error_BOL";

  const commonTop = `
    <div class="swalKv"><div class="swalKvLabel">ระบบที่พบข้อมูลซ้ำ</div><div class="swalKvValue">${escapeHtml(systemLabel)}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref ที่กรอก</div><div class="swalKvValue">${escapeHtml(result?.inputRefNo || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref มาตรฐาน</div><div class="swalKvValue">${escapeHtml(result?.rootRefComparable || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref เดิม</div><div class="swalKvValue">${escapeHtml(matched.refNo || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(matched.revisionLabel || "-")}</div></div>
  `;

  const detailHtml = sourceSystem === "REPORT500"
    ? `
      <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(matched.subject || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">Reported by</div><div class="swalKvValue">${escapeHtml(matched.reportedBy || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.incidentDate || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">สถานที่</div><div class="swalKvValue">${escapeHtml(matched.whereDidItHappen || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">สาขา</div><div class="swalKvValue">${escapeHtml(matched.branch || "-")}</div></div>
    `
    : `
      <div class="swalKv"><div class="swalKvLabel">พนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeName || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">รหัสพนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeCode || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">สาเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorReason || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorDate || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">ผู้บันทึก</div><div class="swalKvValue">${escapeHtml(matched.lps || "-")}</div></div>
    `;

  return `
    <div class="swalSummary" style="text-align:left">
      <div class="swalSection">
        <div class="swalSectionTitle">${escapeHtml(titleText)}</div>
        <div class="swalKvGrid">
          ${commonTop}
          ${detailHtml}
        </div>
      </div>
    </div>
  `;
}

  return `<div style="text-align:left;white-space:pre-wrap">${escapeHtml(result?.message || "เลขอ้างอิงซ้ำ")}</div>`;
}

async function checkRefDuplicate_(formType, refNo, opts = {}) {
  const state = getRefDuplicateState_(formType);
  const normalizedRef = normalizeFrontendRefNo_(refNo);

  if (!normalizedRef) {
    resetRefDuplicateUi_(formType);
    return {
      ok: true,
      duplicated: false,
      skipped: true,
      result: null
    };
  }

  if (!opts.force && state.checked && state.lastRefNo === normalizedRef && state.result) {
    if (state.duplicated) {
      setRefDuplicateHint_(formType, state.result.message || "เลขอ้างอิงซ้ำ", true);
      setRefFieldInvalidState_(formType, true);
    } else {
      resetRefDuplicateUi_(formType);
    }
    return {
      ok: true,
      duplicated: state.duplicated,
      cached: true,
      result: state.result
    };
  }

  const url = `${apiUrl("/checkRefDuplicate")}?formType=${encodeURIComponent(formType)}&refNo=${encodeURIComponent(normalizedRef)}`;

  let json = {};
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch (_) {
    throw new Error("Backend ตอบกลับไม่ใช่ JSON");
  }

  if (!res.ok || !json.ok) {
    throw new Error(json?.message || json?.error || `ตรวจสอบ Ref ไม่สำเร็จ (HTTP ${res.status})`);
  }

  state.lastRefNo = normalizedRef;
  state.duplicated = !!json.duplicated;
  state.checked = true;
  state.result = json;

  if (json.duplicated) {
    setRefDuplicateHint_(formType, json.message || "เลขอ้างอิงซ้ำ", true);
    setRefFieldInvalidState_(formType, true);
  } else {
    resetRefDuplicateUi_(formType);
  }

  return {
    ok: true,
    duplicated: !!json.duplicated,
    result: json
  };
}

async function showDuplicateRefAlert_(result) {
  await Swal.fire({
    icon: "warning",
    title: "เลขอ้างอิงซ้ำ",
    html: buildDuplicateDetailHtml_(result),
    width: 920,
    confirmButtonText: "กลับไปแก้ไข Ref"
  });
}

function bindDuplicateRefCheck_(runningId, yearId, formType) {
  const runningEl = document.getElementById(runningId);
  const yearEl = document.getElementById(yearId);
  if (!runningEl || !yearEl) return;

  let timer = null;

  const schedule = () => {
    if (timer) clearTimeout(timer);

    const refNo = formType === "report500"
      ? (typeof window.getRptRefNoValue === "function" ? window.getRptRefNoValue() : "")
      : (typeof window.getRefNoValue === "function" ? window.getRefNoValue() : "");

    if (!normalizeFrontendRefNo_(refNo)) {
      resetRefDuplicateUi_(formType);
      return;
    }

    timer = setTimeout(async () => {
      try {
        await checkRefDuplicate_(formType, refNo, { force: true });
      } catch (err) {
        console.error("checkRefDuplicate failed:", err);
      }
    }, 320);
  };

  runningEl.addEventListener("input", schedule);
  runningEl.addEventListener("change", schedule);
  yearEl.addEventListener("change", schedule);
}
/** ==========================
 *  GALLERY
 *  ========================== */
function renderGalleryHtml(imageIds = []) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

  const cards = imageIds.map((id, i) => {
    const url = driveImgUrl(id);
    return `
      <button type="button" class="galItem" data-url="${url}" aria-label="ดูรูปที่ ${i + 1}">
        <div class="galThumbWrap">
          <img class="galThumb" src="${url}" alt="รูปที่ ${i + 1}" loading="lazy">
          <div class="galBadge">${i + 1}</div>
        </div>
        <div class="galCap">รูปภาพแนบ ${i + 1}</div>
      </button>
    `;
  }).join("");

  return `
    <div style="margin-top:10px">
      <div style="font-weight:900;margin-bottom:6px">รูปภาพที่แนบ (${imageIds.length})</div>
      <div class="galGrid">${cards}</div>
      <div style="margin-top:8px;color:#94a3b8;font-size:12px">แตะ/คลิกรูปเพื่อดูขนาดเต็ม</div>
    </div>
  `;
}

function bindGalleryClickInSwal() {
  const root = Swal.getHtmlContainer();
  if (!root) return;
  const items = root.querySelectorAll(".galItem");
  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (!url) return;
      Swal.fire({
        title: "ดูรูปภาพแนบ",
        html: `
          <div style="text-align:center">
            <img
              src="${url}"
              style="width:100%;max-height:72vh;object-fit:contain;border-radius:16px;border:1px solid #d7ddea;background:#fff"
              alt="รูปภาพแนบ"
            />
          </div>
        `,
        confirmButtonText: "ปิด",
        confirmButtonColor: "#2563eb",
        width: 900
      });
    });
  });
}

/** ==========================
 *  INIT
 *  ========================== */
init().catch((err) => {
  console.error(err);
  safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
});

async function init() {
  applyStaticLogos();
  bindTabs();
  bindEvents();
  bindRefInputs();
  buildInitialUploadFields();
  buildWorkAgeOptions();
  buildShiftOptions();

  try {
    await loadOptions();
    fillFormDropdowns();
    renderEmailSelector();
    renderConfirmCauseSelector();
  } catch (err) {
    console.error("loadOptions failed:", err);
    safeSetLoginMsg("โหลดตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
  }

  numericOnly($("labelCid"));
  numericOnly($("item"));
  numericOnly($("errorCaseQty"));
  alnumUpperOnly($("employeeCode"));

  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  setActiveTab("error");
  updateEmployeeConfirmPreview();
}

/** ==========================
 *  Tabs
 *  ========================== */
function bindTabs() {
  $("tabErrorBol")?.addEventListener("click", async () => {
    await setActiveTab("error");
  });

  $("tabUnder500")?.addEventListener("click", async () => {
    await setActiveTab("u500");
  });
}

async function setActiveTab(which) {
  $("tabErrorBol")?.classList.toggle("active", which === "error");
  $("tabUnder500")?.classList.toggle("active", which === "u500");

  if (!AUTH.name) {
    $("loginCard")?.classList.remove("hidden");
    $("modeTabs")?.classList.add("hidden");
    $("formCard")?.classList.add("hidden");
    $("under500Card")?.classList.add("hidden");
    return;
  }

  $("loginCard")?.classList.add("hidden");
  $("modeTabs")?.classList.remove("hidden");
  $("formCard")?.classList.toggle("hidden", which !== "error");
  $("under500Card")?.classList.toggle("hidden", which !== "u500");

  if (which === "u500") {
    try {
      if (window.Report500UI && typeof window.Report500UI.ensureReady === "function") {
        await window.Report500UI.ensureReady();
      }
    } catch (err) {
      console.error("Report500 ensureReady error:", err);
      Swal.fire({
        icon: "error",
        title: "โหลด Report500 ไม่สำเร็จ",
        text: err?.message || "ไม่สามารถโหลดตัวเลือกของ Report500 ได้"
      });
    }
  }
}

window.setActiveTab = setActiveTab;

/** ==========================
 *  Events
 *  ========================== */
function bindEvents() {
  $("btnLogin")?.addEventListener("click", onLogin);

  $("errorReason")?.addEventListener("change", onErrorReasonChange);
  $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));

  $("btnPreview")?.addEventListener("click", previewSummary);
  $("btnSubmit")?.addEventListener("click", submitForm);

  $("btnEmailCheckAll")?.addEventListener("click", () => setAllEmailChecks(true));
  $("btnEmailClearAll")?.addEventListener("click", () => setAllEmailChecks(false));

  $("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLogin();
  });

  $("item")?.addEventListener("input", onItemInputLookup);
  $("item")?.addEventListener("blur", onItemBlurLookup);

  [
    "employeeName",
    "employeeCode",
    "errorDate",
    "shift",
    "errorReason",
    "errorReasonOther",
    "errorDescription",
    "item",
    "errorCaseQty",
    "confirmCauseOther",
    "nationality"
  ].forEach((id) => {
    $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
    $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
  });
}

/** ==========================
 *  Load options
 *  ========================== */
async function loadOptions() {
  const res = await fetch(apiUrl("/options"), { method: "GET" });
  const text = await res.text();

  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) {}

  if (!res.ok || !json.ok) {
    const msg = json && json.error ? json.error : `โหลดตัวเลือกไม่สำเร็จ (HTTP ${res.status})`;
    throw new Error(msg);
  }

  OPTIONS = json.data || {
    errorList: [],
    auditList: [],
    emailList: [],
    osmList: [],
    otmList: [],
    confirmCauseList: [],
    nationalityList: []
  };
}

function fillFormDropdowns() {
  const er = $("errorReason");
  const audit = $("auditName");
  const osm = $("osm");
  const otm = $("otm");
  const nationality = $("nationality");

  if (er) {
    er.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.errorList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }

  if (audit) {
    audit.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.auditList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }

  if (osm) {
    osm.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.osmList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }

  if (otm) {
    otm.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.otmList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }

  if (nationality) {
    nationality.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.nationalityList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }

  syncErrorReasonOtherVisibility();
}

function buildWorkAgeOptions() {
  const yearEl = $("workAgeYear");
  const monthEl = $("workAgeMonth");

  if (yearEl) {
    yearEl.innerHTML =
      `<option value="">-- ปี --</option>` +
      Array.from({ length: 41 }, (_, i) => `<option value="${i}">${i}</option>`).join("");
  }

  if (monthEl) {
    monthEl.innerHTML =
      `<option value="">-- เดือน --</option>` +
      Array.from({ length: 12 }, (_, i) => `<option value="${i}">${i}</option>`).join("");
  }
}

function buildShiftOptions() {
  const shift = $("shift");
  if (!shift) return;

  if (shift.options.length > 0) return;

  shift.innerHTML = `
    <option value="">-- เลือก --</option>
    <option value="Day">Day</option>
    <option value="Night">Night</option>
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
  `;
}

/** ==========================
 *  Confirm Cause / Error Reason
 *  ========================== */
function syncErrorReasonOtherVisibility() {
  const v = $("errorReason")?.value || "";
  const wrap = $("errorReasonOtherWrap");
  const input = $("errorReasonOther");

  if (!wrap) return;

  const show = v === "อื่นๆ";
  wrap.classList.toggle("hidden", !show);

  if (!show && input) {
    input.value = "";
  }
}

function syncConfirmCauseOtherVisibility() {
  const wrap = $("confirmCauseOtherWrap");
  const input = $("confirmCauseOther");
  if (!wrap) return;

  const checkedList = Array.from(document.querySelectorAll(".confirmCauseChk:checked"));

  const show = checkedList.some((el) => {
    const value = String(el.value || "").trim();
    const requiresText =
      String(el.dataset.requiresText || "").trim() === "1" ||
      String(el.dataset.requirestext || "").trim() === "1";

    return value === "อื่นๆ" || requiresText;
  });

  wrap.classList.toggle("hidden", !show);

  if (!show && input) {
    input.value = "";
  }
}

function onErrorReasonChange() {
  syncErrorReasonOtherVisibility();
  renderConfirmCauseSelector();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();
}

function renderConfirmCauseSelector() {
  const root = $("confirmCauseSelector");
  if (!root) return;

  const selectedBefore = getSelectedConfirmCauses();
  const currentReason = String($("errorReason")?.value || "").trim();

  const allItems = Array.isArray(OPTIONS.confirmCauseList) ? OPTIONS.confirmCauseList : [];
  const filtered = allItems.filter((item) => {
    const targets = Array.isArray(item.mainReasons) ? item.mainReasons : ["*"];
    if (!targets.length || targets.includes("*")) return true;
    return currentReason ? targets.includes(currentReason) : true;
  });

  if (!filtered.length) {
    root.innerHTML = `<div class="confirmCauseEmpty">ไม่พบรายการสาเหตุประกอบในชีท Confirm_Cause</div>`;
    syncConfirmCauseOtherVisibility();
    return;
  }

  const groups = {};
  filtered.forEach((item) => {
    const g = item.group || "อื่นๆ";
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  root.innerHTML = Object.keys(groups).map((group) => {
    const cards = groups[group].map((item) => {
      const checked = selectedBefore.includes(item.text) ? "checked" : "";
      const requiresText = item.requiresText ? "1" : "0";

      return `
        <label class="confirmCauseCard">
          <input
            type="checkbox"
            class="confirmCauseChk"
            value="${escapeHtml(item.text)}"
            data-requires-text="${requiresText}"
            ${checked}
          >
          <span class="confirmCauseMark"></span>
          <span class="confirmCauseText">${escapeHtml(item.text)}</span>
        </label>
      `;
    }).join("");

    return `
      <div class="confirmCauseGroup">
        <div class="confirmCauseGroupTitle">${escapeHtml(group)}</div>
        <div class="confirmCauseGrid">${cards}</div>
      </div>
    `;
  }).join("");

  root.querySelectorAll(".confirmCauseChk").forEach((chk) => {
    chk.addEventListener("change", () => {
      syncConfirmCauseOtherVisibility();
      updateEmployeeConfirmPreview();
    });
  });

  syncConfirmCauseOtherVisibility();
}

function getSelectedConfirmCauses() {
  return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
    .map(el => String(el.value || "").trim())
    .filter(Boolean);
}

function getSelectedConfirmCausesForNarrative() {
  return getSelectedConfirmCauses().filter((v) => String(v || "").trim() !== "อื่นๆ");
}

function composeConfirmCauseSummary(selected, otherText) {
  const list = (Array.isArray(selected) ? selected : [])
    .filter(Boolean)
    .map(v => String(v).trim())
    .filter(v => v && v !== "อื่นๆ");

  const other = String(otherText || "").trim();
  const out = list.slice();
  if (other) out.push("อื่นๆ: " + other);
  return out.join(" | ");
}

/** ==========================
 *  Email Selector
 *  ========================== */
function renderEmailSelector() {
  const root = $("emailSelector");
  if (!root) return;

  const emails = Array.isArray(OPTIONS.emailList) ? OPTIONS.emailList : [];
  if (!emails.length) {
    root.innerHTML = `<div class="emailEmpty">ไม่พบรายการอีเมลในชีท Email</div>`;
    return;
  }

  root.innerHTML = emails.map((email) => `
    <label class="emailItem">
      <input type="checkbox" class="emailChk" value="${escapeHtml(email)}">
      <span class="emailCheckBox"></span>
      <span class="emailText">${escapeHtml(email)}</span>
    </label>
  `).join("");
}

function getSelectedEmails() {
  return Array.from(document.querySelectorAll(".emailChk:checked"))
    .map(el => String(el.value || "").trim())
    .filter(Boolean);
}

function setAllEmailChecks(flag) {
  document.querySelectorAll(".emailChk").forEach(chk => {
    chk.checked = !!flag;
  });
}

/** ==========================
 *  Login
 *  ========================== */
async function onLogin() {
  safeSetLoginMsg("");
  const pass = norm($("loginPass")?.value);

  if (!pass) {
    safeSetLoginMsg("กรุณากรอกรหัสผ่าน");
    return;
  }

  let json;
  try {
    const res = await fetch(apiUrl("/auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass })
    });

    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch (_) {
      safeSetLoginMsg("Backend ตอบกลับไม่ใช่ JSON");
      return;
    }

    if (!res.ok || !json.ok) {
      safeSetLoginMsg(json?.error || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
  } catch (err) {
    console.error("LOGIN FETCH ERROR:", err);
    safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
    return;
  }

  const lpsName = String(json.name || "").trim();
  if (!lpsName) {
    safeSetLoginMsg("ไม่พบชื่อผู้ใช้งานจากระบบ");
    return;
  }

  AUTH = { name: lpsName, pass };
  window.AUTH = AUTH;

  setLpsFromLogin(lpsName);

  if ($("rptReportedBy")) {
    $("rptReportedBy").value = lpsName || "";
  }

  safeSetLoginMsg("");

  try {
    setActiveTab("error");
  } catch (err) {
    console.error("setActiveTab error:", err);
  }

  if (window.Report500UI && typeof window.Report500UI.ensureReady === "function") {
    window.Report500UI.ensureReady().catch(err => {
      console.error("Report500 preload failed:", err);
    });
  }
}

function setLpsFromLogin(lpsName) {
  if ($("lps")) $("lps").value = lpsName || "";
  if ($("topLoginUserName")) $("topLoginUserName").textContent = lpsName || "-";
  $("topLoginUserWrap")?.classList.toggle("hidden", !lpsName);
}

/** ==========================
 *  Basic sanitizers
 *  ========================== */
function numericOnly(el) {
  if (!el) return;
  el.addEventListener("input", () => {
    el.value = String(el.value || "").replace(/[^\d]/g, "");
  });
}

function alnumUpperOnly(el) {
  if (!el) return;

  const sanitize = () => {
    const v = String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (el.value !== v) el.value = v;
  };

  el.addEventListener("input", sanitize);
  el.addEventListener("paste", () => setTimeout(sanitize, 0));
  el.addEventListener("blur", sanitize);
}

/** ==========================
 *  ITEM LOOKUP
 *  ========================== */
function onItemInputLookup() {
  const item = String($("item")?.value || "").replace(/[^\d]/g, "").trim();

  if (itemLookupTimer) clearTimeout(itemLookupTimer);

  if (!item) {
    ITEM_LOOKUP_STATE = {
      item: "",
      description: "",
      displayText: "",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  if (item.length < ITEM_LOOKUP_MIN_LEN) {
    renderItemLookupState({
      item,
      description: "",
      displayText: item,
      found: false,
      loading: false
    });
    updateEmployeeConfirmPreview();
    return;
  }

  if (ITEM_LOCAL_CACHE.has(item)) {
    const cached = ITEM_LOCAL_CACHE.get(item);
    ITEM_LOOKUP_STATE = { ...cached, loading: false };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  renderItemLookupState({
    item,
    description: "",
    displayText: item,
    found: false,
    loading: true
  });

  itemLookupTimer = setTimeout(() => {
    lookupItemRealtime(item).catch((err) => {
      console.error("lookupItemRealtime error:", err);

      ITEM_LOOKUP_STATE = {
        item,
        description: ITEM_NOT_FOUND_TEXT,
        displayText: `${item} | ${ITEM_NOT_FOUND_TEXT}`,
        found: false,
        loading: false
      };

      ITEM_LOCAL_CACHE.set(item, { ...ITEM_LOOKUP_STATE });
      renderItemLookupState({ ...ITEM_LOOKUP_STATE, apiError: true });
      updateEmployeeConfirmPreview();
    });
  }, ITEM_LOOKUP_DEBOUNCE_MS);
}

async function onItemBlurLookup() {
  const item = String($("item")?.value || "").replace(/[^\d]/g, "").trim();
  if (!item) return;

  if (ITEM_LOCAL_CACHE.has(item)) {
    const cached = ITEM_LOCAL_CACHE.get(item);
    ITEM_LOOKUP_STATE = { ...cached, loading: false };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  await lookupItemRealtime(item, true).catch(() => {});
}

async function lookupItemRealtime(item, immediate = false) {
  const clean = String(item || "").replace(/[^\d]/g, "").trim();
  if (!clean) return;

  if (!immediate && ITEM_LOOKUP_STATE.item === clean && ITEM_LOOKUP_STATE.description) {
    return;
  }

  if (ITEM_LOCAL_CACHE.has(clean)) {
    const cached = ITEM_LOCAL_CACHE.get(clean);
    ITEM_LOOKUP_STATE = { ...cached, loading: false };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  renderItemLookupState({
    item: clean,
    description: "",
    displayText: clean,
    found: false,
    loading: true
  });

  const url = apiUrl(`/itemLookup?item=${encodeURIComponent(clean)}`);
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();

  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) {
    throw new Error("Backend itemLookup ตอบกลับไม่ใช่ JSON");
  }

  if (!res.ok || !json.ok) {
    throw new Error(json.error || `itemLookup HTTP ${res.status}`);
  }

  ITEM_LOOKUP_STATE = {
    item: json.item || clean,
    description: json.description || ITEM_NOT_FOUND_TEXT,
    displayText: json.displayText || `${clean} | ${ITEM_NOT_FOUND_TEXT}`,
    found: !!json.found,
    loading: false
  };

  ITEM_LOCAL_CACHE.set(clean, { ...ITEM_LOOKUP_STATE });
  renderItemLookupState(ITEM_LOOKUP_STATE);
  updateEmployeeConfirmPreview();
}

function renderItemLookupState(state) {
  const hint = $("itemLookupHint");
  const display = $("itemDisplay");
  if (!hint && !display) return;

  const item = String(state?.item || "").trim();
  const desc = String(state?.description || "").trim();
  const displayText = String(state?.displayText || "").trim();
  const loading = !!state?.loading;
  const found = !!state?.found;
  const apiError = !!state?.apiError;

  if (!item) {
    if (hint) hint.textContent = "";
    if (display) display.value = "";
    return;
  }

  if (loading) {
    if (hint) hint.textContent = `กำลังค้นหา Item ${item} ...`;
    if (display) display.value = item;
    return;
  }

  if (found && desc && desc !== ITEM_NOT_FOUND_TEXT) {
    if (hint) hint.textContent = "พบข้อมูลสินค้า";
    if (display) display.value = displayText || `${item} | ${desc}`;
    return;
  }

  if (hint) {
    hint.textContent = apiError
      ? "เชื่อมต่อค้นหาสินค้าไม่ได้ หรือไม่พบข้อมูล"
      : "ไม่พบข้อมูลสินค้า";
  }
  if (display) {
    display.value = displayText || `${item} | ${ITEM_NOT_FOUND_TEXT}`;
  }
}

function getItemDisplayText() {
  if (ITEM_LOOKUP_STATE && ITEM_LOOKUP_STATE.displayText) {
    return ITEM_LOOKUP_STATE.displayText;
  }
  return ($("itemDisplay")?.value || $("item")?.value || "").trim();
}

/** ==========================
 *  Upload fields
 *  ========================== */
function buildInitialUploadFields() {
  const list = $("uploadList");
  if (!list) return;

  list.innerHTML = "";
  addUploadField("บัตรพนักงาน", { removable: false });
  addUploadField("รูปพนักงาน", { removable: false });
}

function addUploadField(label, opts = {}) {
  const { removable = true } = opts;

  const list = $("uploadList");
  if (!list) return;

  const id = "file_" + Math.random().toString(16).slice(2);
  const box = document.createElement("div");
  box.className = "uploadBox";

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <div class="cap">${escapeHtml(label)}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button type="button" class="btn ghost btnEditImage" style="padding:6px 10px;border-radius:999px">แก้ไขภาพ</button>
        ${removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${id}">ลบ</button>` : ``}
      </div>
    </div>
    <input type="file" accept="image/*" id="${id}">
    <img class="previewImg" id="${id}_img" alt="" style="display:block;max-width:100%;max-height:220px;border-radius:12px;border:1px solid #d9e4f1;padding:4px;margin-top:8px;">
    <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
  `;

  list.appendChild(box);

  if (removable) {
    const btn = box.querySelector(`[data-remove="${id}"]`);
    btn?.addEventListener("click", () => {
      const input = $(id);
      const img = $(`${id}_img`);

      if (img && img.dataset.objectUrl) {
        try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      }

      if (input) {
        EDITED_UPLOAD_STORE.delete(input);
      }

      box.remove();
    });
  }

  const fileInput = $(id);
  const img = $(`${id}_img`);
  const txt = $(`${id}_txt`);
  const btnEdit = box.querySelector(".btnEditImage");

  btnEdit?.addEventListener("click", async () => {
    if (!fileInput) return;

    const edited = EDITED_UPLOAD_STORE.get(fileInput)?.file || null;
    const raw = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const sourceFile = edited || raw;

    if (!sourceFile) {
      await Swal.fire({
        icon: "info",
        title: "ยังไม่มีรูปภาพ",
        text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
      });
      return;
    }

    await openEditorForUploadInput(fileInput, box);
  });

  fileInput?.addEventListener("change", async () => {
    const f = fileInput.files && fileInput.files[0];

    EDITED_UPLOAD_STORE.delete(fileInput);

    if (!f) {
      if (txt) txt.textContent = "ยังไม่เลือกรูป";
      if (img) {
        if (img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
        }
        img.removeAttribute("src");
        img.dataset.objectUrl = "";
      }
      return;
    }

    if (!/^image\//.test(f.type)) {
      fileInput.value = "";
      if (txt) txt.textContent = "ไฟล์ไม่ถูกต้อง (ต้องเป็นรูปภาพเท่านั้น)";
      if (img) img.removeAttribute("src");
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
      });
      return;
    }

    if (txt) txt.textContent = `ไฟล์: ${f.name} (${Math.round(f.size / 1024)} KB)`;

    if (img) {
      if (img.dataset.objectUrl) {
        try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      }
      const url = URL.createObjectURL(f);
      img.src = url;
      img.dataset.objectUrl = url;
    }

    await handlePickedImageForUpload(fileInput, box);
  });
}

/** ==========================
 *  Payload
 *  ========================== */
function collectPayloadBase() {
  return {
    refNo: getRefNoValue(),
    labelCid: norm($("labelCid")?.value),
    errorReason: norm($("errorReason")?.value),
    errorReasonOther: norm($("errorReasonOther")?.value),
    errorDescription: norm($("errorDescription")?.value),
    errorDate: norm($("errorDate")?.value),
    item: norm($("item")?.value),
    itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
    itemDisplay: ITEM_LOOKUP_STATE.displayText || "",
    errorCaseQty: norm($("errorCaseQty")?.value),
    employeeName: norm($("employeeName")?.value),
    employeeCode: norm($("employeeCode")?.value),
    workAgeYear: norm($("workAgeYear")?.value),
    workAgeMonth: norm($("workAgeMonth")?.value),
    nationality: norm($("nationality")?.value),
    shift: norm($("shift")?.value),
    osm: norm($("osm")?.value),
    otm: norm($("otm")?.value),
    interpreterName: norm($("interpreterName")?.value),
    auditName: norm($("auditName")?.value),
    emailRecipients: getSelectedEmails()
  };
}

function buildEmployeeConfirmText(payload) {
  const employeeName = String(payload.employeeName || "").trim() || "-";
  const employeeCode = String(payload.employeeCode || "").trim() || "-";
  const errorDate = formatDateToDisplay(payload.errorDate) || "-";
  const shift = String(payload.shift || "").trim() || "-";
  const refNo = String(payload.refNo || "").trim() || "-";
  const errorReason = String(payload.errorReason || "").trim() || "-";

  const itemDisplayRaw = String(
    payload.itemDisplay ||
    ITEM_LOOKUP_STATE.displayText ||
    getItemDisplayText() ||
    ""
  ).trim();

  const itemDisplay = itemDisplayRaw || "ยังไม่พบรายละเอียดสินค้า";
  const errorCaseQty = String(payload.errorCaseQty || "").trim() || "-";

  const selected = Array.isArray(payload.confirmCauseSelected)
    ? payload.confirmCauseSelected
        .filter(Boolean)
        .map(v => String(v).trim())
        .filter(v => v && v !== "อื่นๆ")
    : [];

  const other = String(payload.confirmCauseOther || "").trim();

  const lines = [];
  selected.forEach((t, i) => lines.push(`${i + 1}) ${t}`));
  if (other) lines.push(`${lines.length + 1}) ${other}`);

  const factText = lines.length
    ? lines.join("\n")
    : "1) ข้าพเจ้ายืนยันว่ารับทราบข้อเท็จจริงตามเอกสารฉบับนี้";

  return [
    `ข้าพเจ้า ${employeeName} รหัสพนักงาน ${employeeCode} ปฏิบัติงานวันที่ ${errorDate} ในกะ ${shift} ขอรับรองว่าได้รับทราบรายละเอียดการเบิกสินค้า Error ตามเอกสารเลขที่อ้างอิง ${refNo} แล้ว`,
    `โดยมีสาเหตุหลักคือ ${errorReason} รายการสินค้า ${itemDisplay} และจำนวนที่เกิดข้อผิดพลาด ${errorCaseQty} เคส`,
    `ข้าพเจ้าขอยืนยันข้อเท็จจริงดังต่อไปนี้`,
    factText,
    `ข้าพเจ้าขอรับรองว่าข้อความดังกล่าวเป็นข้อมูลตามที่ได้ชี้แจงไว้จริง และยินยอมให้ใช้เอกสารฉบับนี้เป็นหลักฐานประกอบการตรวจสอบภายใน และการดำเนินการตามระเบียบของบริษัทต่อไป`
  ].join("\n");
}

function updateEmployeeConfirmPreview() {
  const preview = $("employeeConfirmText");
  if (!preview) return;

  const p = collectPayloadBase();
  p.confirmCauseSelected = getSelectedConfirmCausesForNarrative();
  p.confirmCauseOther = norm($("confirmCauseOther")?.value);
  p.errorDate = formatDateToDisplay(p.errorDate);
  p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
  p.employeeConfirmText = buildEmployeeConfirmText(p);

  preview.value = p.employeeConfirmText;
}

function collectPayload() {
  const p = collectPayloadBase();
  p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
  p.confirmCauseSelected = getSelectedConfirmCauses();
  p.confirmCauseOther = norm($("confirmCauseOther")?.value);
  p.employeeConfirmText = buildEmployeeConfirmText({
    ...p,
    confirmCauseSelected: getSelectedConfirmCausesForNarrative(),
    confirmCauseOther: p.confirmCauseOther,
    itemDisplay: p.itemDisplay
  });
  return p;
}

function validatePayload(p) {
  const required = [
    ["refNo", "Ref:No."],
    ["labelCid", "Label CID"],
    ["errorReason", "สาเหตุ Error"],
    ["item", "Item"],
    ["errorCaseQty", "จำนวน ErrorCase"],
    ["employeeName", "ชื่อ-สกุลพนักงาน"],
    ["employeeCode", "รหัสพนักงาน"],
    ["errorDate", "วันที่เบิกสินค้า Error"],
    ["shift", "กะ"],
    ["workAgeYear", "อายุงาน (ปี)"],
    ["workAgeMonth", "อายุงาน (เดือน)"],
    ["nationality", "สัญชาติ"],
    ["osm", "OSM"],
    ["otm", "OTM"],
    ["auditName", "พนง. AUDIT"]
  ];

  for (const [k, n] of required) {
    if (!String(p[k] || "").trim()) return `กรุณากรอก ${n}`;
  }

  if (!Array.isArray(p.confirmCauseSelected) || !p.confirmCauseSelected.length) {
    return "กรุณาเลือกข้อเท็จจริง/สาเหตุประกอบอย่างน้อย 1 รายการ";
  }

  const refRunning = String($("refNo")?.value || "").trim();
  if (!/^\d+$/.test(refRunning)) return "กรุณากรอกเลข Ref เป็นตัวเลขเท่านั้น";
  if (!/^\d+-\d{4}$/.test(p.refNo)) return "Ref:No. ไม่ถูกต้อง";

  if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) {
    return "กรุณาระบุสาเหตุ (อื่นๆ)";
  }

  if (p.confirmCauseSelected.includes("อื่นๆ") && !p.confirmCauseOther.trim()) {
    return "กรุณาระบุข้อเท็จจริงเพิ่มเติมในหัวข้อ อื่นๆ";
  }

  if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";
  if (!/^[A-Z0-9]+$/.test(p.employeeCode)) return "รหัสพนักงานต้องเป็น A-Z หรือ/และ 0-9 เท่านั้น";
  if (!/^\d+$/.test(p.workAgeYear)) return "อายุงาน (ปี) ต้องเป็นตัวเลข";
  if (!/^\d+$/.test(p.workAgeMonth)) return "อายุงาน (เดือน) ต้องเป็นตัวเลข";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.errorDate)) return "รูปแบบวันที่เบิกสินค้าไม่ถูกต้อง";

  return "";
}

/** ==========================
 *  Preview
 *  ========================== */
async function previewSummary() {
  const p = collectPayload();
  const err = validatePayload(p);

  if (err) {
    return Swal.fire({
      icon: "warning",
      title: "ข้อมูลไม่ครบ",
      text: err,
      confirmButtonText: "ตกลง"
    });
  }

  const fileCount = countSelectedFiles();
  const emails = Array.isArray(p.emailRecipients) ? p.emailRecipients : [];
  const causeSummary = composeConfirmCauseSummary(p.confirmCauseSelected, p.confirmCauseOther);

  await Swal.fire({
    title: "ตรวจสอบก่อนบันทึก",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">สรุปข้อมูลก่อนบันทึก</div>
          <div class="swalHeroSub">กรุณาตรวจสอบข้อมูลสำคัญให้ครบถ้วนก่อนดำเนินการ</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
            <div class="swalPill">รูป ${fileCount} รูป</div>
            <div class="swalPill">Email ${emails.length} รายการ</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">Ref:No.</div>
              <div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Label CID</div>
              <div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">วันที่เบิกสินค้า Error</div>
              <div class="swalKvValue">${escapeHtml(formatDateToDisplay(p.errorDate) || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">กะ</div>
              <div class="swalKvValue">${escapeHtml(p.shift || "-")}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเหตุการณ์</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">สาเหตุ Error</div>
              <div class="swalKvValue">${escapeHtml(
                p.errorReason === "อื่นๆ"
                  ? ("อื่นๆ: " + (p.errorReasonOther || ""))
                  : (p.errorReason || "-")
              )}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Item</div>
              <div class="swalKvValue">${escapeHtml(getItemDisplayText() || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">จำนวน ErrorCase</div>
              <div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลพนักงาน / ผู้เกี่ยวข้อง</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">ชื่อพนักงาน</div>
              <div class="swalKvValue">${escapeHtml(p.employeeName || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">รหัสพนักงาน</div>
              <div class="swalKvValue">${escapeHtml(p.employeeCode || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">อายุงาน</div>
              <div class="swalKvValue">${escapeHtml(`${p.workAgeYear} ปี ${p.workAgeMonth} เดือน`)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">สัญชาติ</div>
              <div class="swalKvValue">${escapeHtml(p.nationality || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">OSM</div>
              <div class="swalKvValue">${escapeHtml(p.osm || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">OTM</div>
              <div class="swalKvValue">${escapeHtml(p.otm || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">ล่ามแปลภาษา</div>
              <div class="swalKvValue">${escapeHtml(p.interpreterName || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">AUDIT</div>
              <div class="swalKvValue">${escapeHtml(p.auditName || "-")}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อเท็จจริงที่พนักงานยืนยัน</div>
          <div class="swalDesc">
            <div class="swalDescLabel">รายการที่เลือก</div>
            <div class="swalDescValue">${escapeHtml(causeSummary || "-").replaceAll("|", "<br>")}</div>
          </div>

          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">คำยืนยันของพนักงาน</div>
            <div class="swalDescValue">${escapeHtml(p.employeeConfirmText || "-").replaceAll("\n", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ผู้รับอีเมล</div>
          ${
            emails.length
              ? `
                <div class="swalEmailOk" style="margin-bottom:8px;">
                  มีการเลือกผู้รับอีเมล ${emails.length} รายการ
                </div>
                <div class="swalEmailList">
                  ${emails.map(e => `<div class="swalEmailChip">${escapeHtml(e)}</div>`).join("")}
                </div>
              `
              : `<div class="swalNote">ยังไม่ได้เลือกอีเมล ระบบจะบันทึกข้อมูลและสร้าง PDF อย่างเดียว</div>`
          }
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ไฟล์แนบ</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">จำนวนรูปที่เลือก</div>
              <div class="swalKvValue">${fileCount} รูป</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">สถานะการสร้างเอกสาร</div>
              <div class="swalKvValue">ระบบจะสร้าง PDF หลังบันทึกสำเร็จ</div>
            </div>
          </div>
        </div>
      </div>
    `,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#2563eb",
    width: 920
  });
}

function countSelectedFiles() {
  const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
  return inputs.reduce((acc, el) => {
    const edited = EDITED_UPLOAD_STORE.get(el)?.file || null;
    const raw = el.files && el.files[0] ? el.files[0] : null;
    return acc + ((edited || raw) ? 1 : 0);
  }, 0);
}
/** ==========================
 *  Submit
 *  ========================== */
async function submitForm() {
  const p = collectPayload();
  const err = validatePayload(p);

  if (err) {
    return Swal.fire({
      icon: "warning",
      title: "ข้อมูลไม่ครบ",
      text: err,
      confirmButtonText: "ตกลง"
    });
  }

  try {
    const dup = await checkRefDuplicate_("error_bol", getRefNoValue(), { force: true });
    if (dup.duplicated) {
      await showDuplicateRefAlert_(dup.result);
      $("refNo")?.focus();
      return;
    }
  } catch (dupErr) {
    return Swal.fire({
      icon: "error",
      title: "ตรวจสอบ Ref ไม่สำเร็จ",
      text: dupErr?.message || String(dupErr),
      confirmButtonText: "ตกลง"
    });
  }

  let files = [];
  try {
    files = await collectFilesAsBase64({ maxFiles: 6, maxMBEach: 4 });
  } catch (fileErr) {
    console.error(fileErr);
    return;
  }

  const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
  if (!signRes.ok) {
    return;
  }

  const body = {
    pass: AUTH.pass,
    payload: p,
    files,
    signatures: {
      supervisorBase64: signRes.supervisorBase64 || "",
      employeeBase64: signRes.employeeBase64 || "",
      interpreterBase64: signRes.interpreterBase64 || ""
    }
  };

  ProgressUI.show(
    "กำลังบันทึก Error_BOL",
    "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล"
  );

  try {
    ProgressUI.activateOnly("validate", 10, "กำลังตรวจสอบ Ref และข้อมูล");

    const dupBeforeSend = await checkRefDuplicate_("error_bol", getRefNoValue(), { force: true });
    if (dupBeforeSend.duplicated) {
      ProgressUI.markError("validate", "เลขอ้างอิงซ้ำ", 10);
      ProgressUI.hide(150);
      await showDuplicateRefAlert_(dupBeforeSend.result);
      $("refNo")?.focus();
      return;
    }

    await safeDelay(140);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(180);
    ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${files.length} รูป + ลายเซ็น)`);

    ProgressUI.activateOnly("save", 56, "กำลังบันทึกข้อมูลลงระบบ");

    const res = await fetch(apiUrl("/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let json = {};

    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `บันทึกข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    ProgressUI.markDone("save", 72, "บันทึกข้อมูลลงระบบเรียบร้อย");

    ProgressUI.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF");
    await safeDelay(180);

    const pdfOk = !!(json.pdfFileId || json.pdfUrl);
    if (pdfOk) {
      const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
      ProgressUI.markDone("pdf", 94, `สร้างไฟล์ PDF เรียบร้อย${sizeText}`);
    } else {
      ProgressUI.markError("pdf", "ไม่สามารถสร้าง PDF ได้", 94);
    }

    ProgressUI.activateOnly("email", 98, "กำลังตรวจสอบผลการส่งอีเมล");
    await safeDelay(140);

    const emailInfo = buildEmailStatusSummary_(json);

    if (emailInfo.emailOk) {
      ProgressUI.markDone("email", 100, emailInfo.emailModeText, emailInfo.emailModeText);
      ProgressUI.success("บันทึกสำเร็จ", "ข้อมูล Error_BOL ถูกบันทึกเรียบร้อยแล้ว");
    } else if (emailInfo.emailSkipped) {
      ProgressUI.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
      ProgressUI.success("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
    } else {
      ProgressUI.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
      ProgressUI.success("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
      ProgressUI.setHint(emailInfo.emailStatus || "กรุณาตรวจสอบสิทธิ์อีเมลหรือขนาดไฟล์แนบ");
    }

    const galleryHtml = renderGalleryHtml(json.imageIds || []);
    const pdfSizeText = String(json.pdfSizeText || "-");

    const supSignThumb = signRes.supervisorBase64
      ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
      : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

    const empSignThumb = signRes.employeeBase64
      ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
      : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

    const intSignThumb = signRes.interpreterBase64
      ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
      : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

    ProgressUI.hide(120);

    await Swal.fire({
      icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
      title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
      showConfirmButton: false,
      width: 920,
      html: `
        <div class="swalSummary">
          <div class="swalHero">
            <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
            <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ ลายเซ็น และเอกสาร PDF เรียบร้อย</div>
            <div class="swalPillRow">
              <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
              <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
              <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Label CID</div><div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">ขนาด PDF</div><div class="swalKvValue">${escapeHtml(pdfSizeText)}</div></div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">สถานะอีเมล</div>
            ${
              emailInfo.emailSkipped
                ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
                : emailInfo.emailOk
                  ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailInfo.emailResult.count || 0)} รายการ ${emailInfo.emailResult.attachmentMode ? `• ${escapeHtml(emailInfo.emailResult.attachmentMode)}` : ""}</div>`
                  : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailResult.error || "-")}</div>`
            }
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ลายเซ็น</div>
            <div class="sigGrid">
              <div>
                <div class="sigBoxTitle">หัวหน้างาน</div>
                ${supSignThumb}
                <div class="sigName">${escapeHtml(p.otm || "-")}</div>
              </div>
              <div>
                <div class="sigBoxTitle">พนักงาน</div>
                ${empSignThumb}
                <div class="sigName">${escapeHtml(p.employeeName || "-")}</div>
              </div>
              <div>
                <div class="sigBoxTitle">ล่ามแปลภาษา</div>
                ${intSignThumb}
                <div class="sigName">${escapeHtml(p.interpreterName || "-")}</div>
              </div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">รูปภาพแนบ</div>
            ${galleryHtml || `<div class="swalNote">ไม่มีรูปภาพแนบ</div>`}
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
            ${
              json.pdfUrl
                ? `<button type="button" id="btnOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
                : ``
            }
            <button type="button" id="btnCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
          </div>
        </div>
      `,
      didOpen: () => {
        bindGalleryClickInSwal();

        const btnOpen = document.getElementById("btnOpenPdfAfterSave");
        const btnClose = document.getElementById("btnCloseAfterSave");

        if (btnOpen && json.pdfUrl) {
          btnOpen.addEventListener("click", () => {
            window.open(json.pdfUrl, "_blank", "noopener,noreferrer");
            Swal.close();
          });
        }

        if (btnClose) {
          btnClose.addEventListener("click", () => {
            Swal.close();
          });
        }
      },
      willClose: () => {
        resetRefDuplicateUi_("error_bol");
        resetForm();
      }
    });

    return json;
  } catch (err2) {
    console.error(err2);
    ProgressUI.markError("save", err2?.message || "เกิดข้อผิดพลาด", 58);
    ProgressUI.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

    await Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: err2?.message || String(err2),
      confirmButtonText: "ตกลง"
    });
  } finally {
    ProgressUI.hide(180);
  }
}

async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
  const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
  const picked = [];

  for (const el of inputs) {
    const edited = EDITED_UPLOAD_STORE.get(el)?.file || null;
    const raw = el.files && el.files[0] ? el.files[0] : null;
    const f = edited || raw;
    if (f) picked.push(f);
  }

  if (picked.length > maxFiles) {
    await Swal.fire({
      icon: "warning",
      title: "รูปเยอะเกินไป",
      text: `เลือกได้สูงสุด ${maxFiles} รูป (ตอนนี้เลือก ${picked.length})`
    });
    throw new Error("Too many files");
  }

  const out = [];
  for (const f of picked) {
    if (!/^image\//.test(f.type)) {
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์ไม่ถูกต้อง",
        text: `ไฟล์ "${f.name}" ต้องเป็นรูปภาพเท่านั้น`
      });
      throw new Error("Invalid file type");
    }

    const mb = f.size / (1024 * 1024);
    if (mb > maxMBEach) {
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์ใหญ่เกินไป",
        text: `ไฟล์ "${f.name}" มีขนาด ${mb.toFixed(1)} MB (กำหนดไว้ไม่เกิน ${maxMBEach} MB)`
      });
      throw new Error("File too large");
    }

    const base64 = await fileToBase64(f);
    out.push({ filename: f.name, base64 });
  }

  return out;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = String(r.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** ==========================
 *  Signature Flow
 *  ========================== */
async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
  const sup = await signatureModal("ลายเซ็นหัวหน้างาน", `ผู้เซ็น: ${supervisorName || "-"}`);
  if (!sup.ok) return { ok: false };

  const emp = await signatureModal("ลายเซ็นพนักงานที่เบิกสินค้า Error", `ผู้เซ็น: ${employeeName || "-"}`);
  if (!emp.ok) return { ok: false };

  const hasInterpreter = String(interpreterName || "").trim().length > 0;
  if (!hasInterpreter) {
    return {
      ok: true,
      supervisorBase64: sup.base64,
      employeeBase64: emp.base64,
      interpreterBase64: ""
    };
  }

  const intr = await signatureModal("ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${interpreterName || "-"}`);
  if (!intr.ok) return { ok: false };

  return {
    ok: true,
    supervisorBase64: sup.base64,
    employeeBase64: emp.base64,
    interpreterBase64: intr.base64
  };
}

async function signatureModal(title, subtitle) {
  const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
  const clearId = "sigClear_" + Math.random().toString(16).slice(2);

  const res = await Swal.fire({
    title,
    html: `
      <div style="text-align:left">
        <div style="font-size:13px;color:#64748b;font-weight:700;margin-bottom:10px">${escapeHtml(subtitle || "")}</div>
        <div style="border:1px solid #d7e4f3;border-radius:18px;padding:10px;background:#fff">
          <canvas id="${canvasId}" class="sigCanvasElmLarge" width="900" height="320"></canvas>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
          <div style="font-size:12px;color:#64748b">กรุณาเซ็นในช่องด้านบน</div>
          <button id="${clearId}" type="button" class="btn ghost sigBtn">ล้างลายเซ็น</button>
        </div>
      </div>
    `,
    width: 900,
    showCancelButton: true,
    confirmButtonText: "ยืนยันลายเซ็น",
    cancelButtonText: "ยกเลิก",
    didOpen: () => {
      const canvas = document.getElementById(canvasId);
      const btnClear = document.getElementById(clearId);

      enableSignature(canvas);

      btnClear?.addEventListener("click", () => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    },
    preConfirm: () => {
      const canvas = document.getElementById(canvasId);
      const isEmpty = isCanvasBlank(canvas);

      if (isEmpty) {
        Swal.showValidationMessage("กรุณาเซ็นชื่อก่อนกดยืนยัน");
        return false;
      }

      return canvas.toDataURL("image/png");
    }
  });

  if (!res.isConfirmed) return { ok: false };
  return { ok: true, base64: res.value };
}

function enableSignature(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.lineWidth = 2.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1d4ed8";

  let drawing = false;
  let last = null;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (canvas.width / rect.width),
      y: (t.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const down = (e) => {
    drawing = true;
    last = getPos(e);
    e.preventDefault();
  };

  const move = (e) => {
    if (!drawing) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    e.preventDefault();
  };

  const up = (e) => {
    drawing = false;
    last = null;
    e.preventDefault();
  };

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);

  canvas.addEventListener("touchstart", down, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", up, { passive: false });
}

function isCanvasBlank(canvas) {
  if (!canvas) return true;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
}

/** ==========================
 *  Reset / helpers
 *  ========================== */
function resetForm() {
  const ids = [
    "refNo",
    "labelCid",
    "errorReasonOther",
    "errorDescription",
    "item",
    "itemDisplay",
    "errorCaseQty",
    "employeeName",
    "errorDate",
    "employeeCode",
    "interpreterName",
    "confirmCauseOther"
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });

  ["errorReason", "auditName", "shift", "osm", "otm", "workAgeYear", "workAgeMonth", "nationality"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });

  document.querySelectorAll(".confirmCauseChk, .emailChk").forEach((el) => {
    el.checked = false;
  });

  ITEM_LOOKUP_STATE = {
    item: "",
    description: "",
    displayText: "",
    found: false,
    loading: false
  };

  renderItemLookupState(ITEM_LOOKUP_STATE);
  buildInitialUploadFields();
  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();

  if ($("lps")) $("lps").value = AUTH.name || "";
}

function buildResultActionButtons_(pdfUrl) {
  const hasPdf = !!String(pdfUrl || "").trim();

  return `
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
      ${
        hasPdf
          ? `<button type="button" id="btnOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
          : ``
      }
      <button type="button" id="btnCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
    </div>
  `;
}

function bindResultActionButtons_(pdfUrl) {
  const btnOpen = document.getElementById("btnOpenPdfAfterSave");
  const btnClose = document.getElementById("btnCloseAfterSave");

  if (btnOpen && pdfUrl) {
    btnOpen.addEventListener("click", () => {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      Swal.close();
    });
  }
}



