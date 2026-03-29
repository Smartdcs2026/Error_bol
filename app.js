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

window.buildEmailStatusSummary_ = buildEmailStatusSummary_;

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
window.AUTH = AUTH;

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

function getPickedOrEditedFile(input) {
  if (!input) return null;
  const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
  const raw = input.files && input.files[0] ? input.files[0] : null;
  return edited || raw || null;
}

function setEditedUploadFile(input, file, extra = {}) {
  if (!input || !file) return;
  EDITED_UPLOAD_STORE.set(input, {
    edited: true,
    file,
    filename: extra.filename || file.name || "edited-image.jpg",
    dataUrl: extra.dataUrl || ""
  });
}

function clearEditedUploadFile(input) {
  if (!input) return;
  EDITED_UPLOAD_STORE.delete(input);
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
  btn.disabled = true;

  topRow.appendChild(btn);

  btn.addEventListener("click", async () => {
    const input = $(inputId);
    if (!input) return;

    const file = getPickedOrEditedFile(input);
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
  if (!input || !box) return;

  const img = box.querySelector(".previewImg");
  const txt = box.querySelector(".small");
  const btn = box.querySelector(".btnEditImage");

  if (txt) {
    txt.textContent = file
      ? (messageText || buildEditedImageBadgeHtml(file))
      : "ยังไม่เลือกรูป";
  }

  if (img) {
    if (img.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      img.dataset.objectUrl = "";
    }

    if (file) {
      const url = URL.createObjectURL(file);
      img.src = url;
      img.dataset.objectUrl = url;
    } else {
      img.removeAttribute("src");
    }
  }

  if (btn) btn.disabled = !file;
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

  const sourceFile = getPickedOrEditedFile(input);
  if (!sourceFile) return;

  const result = await window.ImageEditorX.open(sourceFile, {
    strokeColor: "#dc2626",
    strokeWidth: 3
  });

  if (!result?.ok || !result.file) return;

  setEditedUploadFile(input, result.file, {
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

/**
 * แก้จุดกระพริบบนมือถือ:
 * เวอร์ชันนี้จะ "ไม่เปิด editor อัตโนมัติ" หลังเลือกไฟล์
 * แต่ให้ผู้ใช้กดปุ่มแก้ไขภาพเอง
 */
async function handlePickedImageForUpload(input, box) {
  const f = input?.files && input.files[0] ? input.files[0] : null;
  clearEditedUploadFile(input);

  if (!f) {
    updateUploadPreviewFromFile(input, box, null, "ยังไม่เลือกรูป");
    return;
  }

  if (!/^image\//i.test(f.type || "")) {
    input.value = "";
    updateUploadPreviewFromFile(input, box, null, "ไฟล์ไม่ถูกต้อง (ต้องเป็นรูปภาพเท่านั้น)");
    await Swal.fire({
      icon: "warning",
      title: "ไฟล์ไม่ถูกต้อง",
      text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
    });
    return;
  }

  ensureEditButtonForUploadBox(box, input.id);
  updateUploadPreviewFromFile(input, box, f, `เลือกรูปแล้ว: ${f.name}`);
}

window.UploadImageTools = {
  getPickedOrEditedFile,
  setEditedUploadFile,
  clearEditedUploadFile,
  updateUploadPreviewFromFile,
  openEditorForUploadInput,
  buildEditedImageBadgeHtml
};

const $ = (id) => document.getElementById(id);
window.$ = $;

/** ==========================
 *  URL / BASIC HELPERS
 *  ========================== */
function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}
window.apiUrl = apiUrl;

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateThaiLong(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text ?? "";
}

function setInputValue(id, value) {
  const el = $(id);
  if (el) el.value = value ?? "";
}

function showEl(id, show = true) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

function uniqueStrings(arr) {
  const seen = new Set();
  return (Array.isArray(arr) ? arr : []).filter((v) => {
    const k = String(v ?? "").trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** ==========================
 *  LOGIN
 *  ========================== */
async function doLogin() {
  const pass = String($("loginPass")?.value || "").trim();
  const loginMsg = $("loginMsg");

  if (!pass) {
    if (loginMsg) loginMsg.textContent = "กรุณากรอกรหัสผ่าน";
    return;
  }

  if (loginMsg) loginMsg.textContent = "กำลังตรวจสอบ...";

  try {
    const res = await fetch(apiUrl("/auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass })
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      if (loginMsg) loginMsg.textContent = json?.error || "เข้าสู่ระบบไม่สำเร็จ";
      return;
    }

    AUTH = { name: json.name || "", pass };
    window.AUTH = AUTH;

    if (loginMsg) loginMsg.textContent = "";
    showEl("loginCard", false);
    showEl("modeTabs", true);
    showEl("topLoginUserWrap", true);
    setText("topLoginUserName", AUTH.name || "-");
    setInputValue("lps", AUTH.name || "");

    switchMode("errorbol");

    await loadOptions();
    if (window.Report500UI?.ensureReady) {
      try { await window.Report500UI.ensureReady(); } catch (_) {}
    }
  } catch (err) {
    if (loginMsg) loginMsg.textContent = err?.message || "เชื่อมต่อระบบไม่ได้";
  }
}

/** ==========================
 *  MODES
 *  ========================== */
let CURRENT_MODE = "errorbol";

function switchMode(mode) {
  CURRENT_MODE = mode === "report500" ? "report500" : "errorbol";

  $("tabErrorBol")?.classList.toggle("active", CURRENT_MODE === "errorbol");
  $("tabUnder500")?.classList.toggle("active", CURRENT_MODE === "report500");

  showEl("formCard", CURRENT_MODE === "errorbol");
  showEl("report500Card", CURRENT_MODE === "report500");
}

/** ==========================
 *  LOAD OPTIONS
 *  ========================== */
async function loadOptions() {
  const res = await fetch(apiUrl("/options"));
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || "โหลดตัวเลือกไม่สำเร็จ");
  }

  OPTIONS = {
    errorList: uniqueStrings(json.errorList || []),
    auditList: uniqueStrings(json.auditList || []),
    emailList: uniqueStrings(json.emailList || []),
    osmList: uniqueStrings(json.osmList || []),
    otmList: uniqueStrings(json.otmList || []),
    confirmCauseList: uniqueStrings(json.confirmCauseList || []),
    nationalityList: uniqueStrings(json.nationalityList || [])
  };

  renderOptions();
}

function renderOptions() {
  renderSelect("errorReason", OPTIONS.errorList, true, "-- เลือกประเภทความผิดพลาด --");
  renderSelect("auditName", OPTIONS.auditList, true, "-- เลือก AUDIT --");
  renderSelect("osm", OPTIONS.osmList, true, "-- เลือก OSM --");
  renderSelect("otm", OPTIONS.otmList, true, "-- เลือก OTM --");
  renderSelect("nationality", OPTIONS.nationalityList, true, "-- เลือกสัญชาติ --");

  renderWorkAgeOptions();
  renderShiftOptions();
  renderRefYearOptions();
  renderConfirmCauseList();
  renderEmailList();

  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();
}

function renderSelect(id, list, includePlaceholder = true, placeholder = "-- เลือก --") {
  const el = $(id);
  if (!el) return;
  const items = Array.isArray(list) ? list : [];

  el.innerHTML = [
    includePlaceholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "",
    ...items.map((x) => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`)
  ].join("");
}

function renderWorkAgeOptions() {
  const years = Array.from({ length: 31 }, (_, i) => String(i));
  const months = Array.from({ length: 12 }, (_, i) => String(i));

  renderSelect("workAgeYear", years, true, "-- ปี --");
  renderSelect("workAgeMonth", months, true, "-- เดือน --");
}

function renderShiftOptions() {
  renderSelect("shift", ["Day", "Night"], true, "-- เลือกกะ --");
}

function renderRefYearOptions() {
  const el = $("refYear");
  if (!el) return;

  const now = new Date();
  const thaiYear = now.getFullYear() + 543;
  const list = [thaiYear - 1, thaiYear, thaiYear + 1].map(String);

  el.innerHTML = list.map((y) => `<option value="${y}">${y}</option>`).join("");
  el.value = String(thaiYear);
}

function renderConfirmCauseList() {
  const wrap = $("confirmCauseList");
  if (!wrap) return;

  wrap.innerHTML = (OPTIONS.confirmCauseList || []).map((label, index) => {
    const id = `confirmCause_${index}`;
    return `
      <label class="checkCard" for="${id}">
        <input class="confirmCauseChk" type="checkbox" id="${id}" value="${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }).join("");

  wrap.querySelectorAll(".confirmCauseChk").forEach((el) => {
    el.addEventListener("change", () => {
      syncConfirmCauseOtherVisibility();
      updateEmployeeConfirmPreview();
    });
  });
}

function renderEmailList() {
  const wrap = $("emailList");
  if (!wrap) return;

  if (!(OPTIONS.emailList || []).length) {
    wrap.innerHTML = `<div class="mutedText">ไม่พบรายการอีเมล</div>`;
    return;
  }

  wrap.innerHTML = OPTIONS.emailList.map((email, index) => {
    const id = `email_${index}`;
    return `
      <label class="checkCard" for="${id}">
        <input class="emailChk" type="checkbox" id="${id}" value="${escapeHtml(email)}">
        <span>${escapeHtml(email)}</span>
      </label>
    `;
  }).join("");
}

/** ==========================
 *  ITEM LOOKUP
 *  ========================== */
function normalizeItemCode(v) {
  return String(v ?? "").replace(/[^0-9A-Za-z\-_/]/g, "").trim();
}

async function lookupItem(item) {
  const q = normalizeItemCode(item);
  if (!q || q.length < ITEM_LOOKUP_MIN_LEN) {
    ITEM_LOOKUP_STATE = {
      item: q,
      description: "",
      displayText: "",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    return;
  }

  if (ITEM_LOCAL_CACHE.has(q)) {
    ITEM_LOOKUP_STATE = { ...ITEM_LOCAL_CACHE.get(q), loading: false };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    return;
  }

  ITEM_LOOKUP_STATE = {
    item: q,
    description: "",
    displayText: "กำลังค้นหารายการสินค้า...",
    found: false,
    loading: true
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  try {
    const url = new URL(apiUrl("/itemLookup"), window.location.origin);
    url.searchParams.set("item", q);

    const res = await fetch(url.toString());
    const json = await res.json();

    const nextState = {
      item: q,
      description: String(json?.description || "").trim(),
      displayText: String(json?.displayText || "").trim(),
      found: !!json?.found,
      loading: false
    };

    if (!nextState.displayText) {
      nextState.displayText = nextState.found
        ? nextState.description || q
        : ITEM_NOT_FOUND_TEXT;
    }

    ITEM_LOCAL_CACHE.set(q, nextState);
    ITEM_LOOKUP_STATE = nextState;
    renderItemLookupState(nextState);
  } catch (err) {
    ITEM_LOOKUP_STATE = {
      item: q,
      description: "",
      displayText: "ค้นหารายการสินค้าไม่สำเร็จ",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
  }
}

function renderItemLookupState(state) {
  const hint = $("itemLookupHint");
  const itemDisplay = $("itemDisplay");

  if (itemDisplay) {
    itemDisplay.value = state?.displayText || "";
  }

  if (!hint) return;

  if (!state?.item) {
    hint.textContent = "";
    hint.className = "fieldHint";
    return;
  }

  if (state.loading) {
    hint.textContent = "กำลังค้นหารายการสินค้า...";
    hint.className = "fieldHint pending";
    return;
  }

  if (state.found) {
    hint.textContent = `พบรายการสินค้า: ${state.description || state.displayText || state.item}`;
    hint.className = "fieldHint success";
    return;
  }

  hint.textContent = ITEM_NOT_FOUND_TEXT;
  hint.className = "fieldHint danger";
}

function bindItemLookup() {
  const input = $("item");
  if (!input) return;

  input.addEventListener("input", () => {
    if (itemLookupTimer) clearTimeout(itemLookupTimer);
    itemLookupTimer = setTimeout(() => {
      lookupItem(input.value || "");
    }, ITEM_LOOKUP_DEBOUNCE_MS);
  });

  input.addEventListener("blur", () => {
    if (itemLookupTimer) clearTimeout(itemLookupTimer);
    lookupItem(input.value || "");
  });
}

/** ==========================
 *  DYNAMIC VISIBILITY
 *  ========================== */
function syncErrorReasonOtherVisibility() {
  const reason = String($("errorReason")?.value || "").trim();
  showEl("errorReasonOtherWrap", reason === "อื่นๆ");
}

function getSelectedConfirmCauseValues() {
  return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
    .map((el) => String(el.value || "").trim())
    .filter(Boolean);
}

function syncConfirmCauseOtherVisibility() {
  const selected = getSelectedConfirmCauseValues();
  showEl("confirmCauseOtherWrap", selected.includes("อื่นๆ"));
}

function buildEmployeeConfirmPreviewText() {
  const selected = getSelectedConfirmCauseValues();
  const other = String($("confirmCauseOther")?.value || "").trim();
  const causeText = selected.map((x) => x === "อื่นๆ" && other ? `${x}: ${other}` : x).join(" | ");
  const name = String($("employeeName")?.value || "").trim() || "................................";
  const employeeCode = String($("employeeCode")?.value || "").trim() || "................................";
  const itemDisplay = String($("itemDisplay")?.value || ITEM_LOOKUP_STATE.displayText || "-").trim() || "-";
  const qty = String($("errorCaseQty")?.value || "-").trim() || "-";
  const errorDate = formatDateThaiLong($("errorDate")?.value || "");

  return `ข้าพเจ้า ${name} รหัสพนักงาน ${employeeCode} ขอรับทราบและยืนยันว่าได้ทำรายการเบิกสินค้าผิดพลาด จำนวน ${qty} เคส รายการสินค้า ${itemDisplay} เมื่อวันที่ ${errorDate} โดยมีข้อเท็จจริงที่พนักงานยืนยันดังนี้: ${causeText || "-"}`;
}

function updateEmployeeConfirmPreview() {
  const textarea = $("employeeConfirmText");
  if (!textarea) return;
  textarea.value = buildEmployeeConfirmPreviewText();
}

/** ==========================
 *  UPLOAD FIELDS
 *  ========================== */
function createUploadBox(index) {
  const wrap = document.createElement("div");
  wrap.className = "uploadBox";
  wrap.innerHTML = `
    <div class="uploadTop">
      <div class="uploadTitle">รูปภาพ ${index}</div>
      <button type="button" class="btn ghost btnRemoveUpload">ลบ</button>
    </div>
    <input type="file" accept="image/*" class="uploadInput" id="uploadInput_${index}">
    <div class="small">ยังไม่เลือกรูป</div>
    <img class="previewImg" alt="preview" />
  `;

  const input = wrap.querySelector(".uploadInput");
  const btnRemove = wrap.querySelector(".btnRemoveUpload");

  ensureEditButtonForUploadBox(wrap, input.id);

  input.addEventListener("change", async () => {
    await handlePickedImageForUpload(input, wrap);
  });

  btnRemove.addEventListener("click", () => {
    const img = wrap.querySelector(".previewImg");
    if (img?.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      img.dataset.objectUrl = "";
    }
    clearEditedUploadFile(input);
    wrap.remove();
    refreshUploadTitles();
    if (!document.querySelector("#uploadList .uploadBox")) {
      buildInitialUploadFields();
    }
  });

  return wrap;
}

function refreshUploadTitles() {
  const boxes = Array.from(document.querySelectorAll("#uploadList .uploadBox"));
  boxes.forEach((box, idx) => {
    const title = box.querySelector(".uploadTitle");
    if (title) title.textContent = `รูปภาพ ${idx + 1}`;
  });
}

function buildInitialUploadFields() {
  const list = $("uploadList");
  if (!list) return;
  list.innerHTML = "";
  list.appendChild(createUploadBox(1));
}

function addUploadField() {
  const list = $("uploadList");
  if (!list) return;
  const nextIndex = list.querySelectorAll(".uploadBox").length + 1;
  list.appendChild(createUploadBox(nextIndex));
}

/** ==========================
 *  COLLECT / VALIDATE
 *  ========================== */
function buildRefNo() {
  const running = String($("refNo")?.value || "").replace(/[^0-9]/g, "").trim();
  const year = String($("refYear")?.value || "").trim();
  return running && year ? `${running}/${year}` : "";
}

function collectPayload() {
  const selectedConfirmCause = getSelectedConfirmCauseValues();
  const confirmCauseOther = String($("confirmCauseOther")?.value || "").trim();
  const selectedEmails = Array.from(document.querySelectorAll(".emailChk:checked"))
    .map((el) => String(el.value || "").trim())
    .filter(Boolean);

  return {
    refNo: buildRefNo(),
    lps: AUTH.name || "",
    labelCid: String($("labelCid")?.value || "").trim(),
    errorReason: String($("errorReason")?.value || "").trim(),
    errorReasonOther: String($("errorReasonOther")?.value || "").trim(),
    errorDescription: String($("errorDescription")?.value || "").trim(),
    item: String($("item")?.value || "").trim(),
    itemDescription: ITEM_LOOKUP_STATE.description || "",
    itemDisplay: String($("itemDisplay")?.value || "").trim(),
    errorCaseQty: String($("errorCaseQty")?.value || "").trim(),
    employeeName: String($("employeeName")?.value || "").trim(),
    employeeCode: String($("employeeCode")?.value || "").trim(),
    workAgeYear: String($("workAgeYear")?.value || "").trim(),
    workAgeMonth: String($("workAgeMonth")?.value || "").trim(),
    nationality: String($("nationality")?.value || "").trim(),
    interpreterName: String($("interpreterName")?.value || "").trim(),
    errorDate: String($("errorDate")?.value || "").trim(),
    shift: String($("shift")?.value || "").trim(),
    osm: String($("osm")?.value || "").trim(),
    otm: String($("otm")?.value || "").trim(),
    auditName: String($("auditName")?.value || "").trim(),
    confirmCauseText: selectedConfirmCause.join(" | "),
    confirmCauseList: selectedConfirmCause,
    confirmCauseOther,
    employeeConfirmText: String($("employeeConfirmText")?.value || "").trim(),
    emailRecipients: selectedEmails
  };
}

function validatePayload(p) {
  if (!p.refNo) return "กรุณากรอก Ref No.";
  if (!p.labelCid) return "กรุณากรอก Label CID";
  if (!p.item) return "กรุณากรอก Item";
  if (!p.errorCaseQty) return "กรุณากรอกจำนวนเคส";
  if (!p.errorDate) return "กรุณาเลือกวันที่เกิดเหตุ";
  if (!p.errorReason) return "กรุณาเลือกประเภทความผิดพลาด";
  if (p.errorReason === "อื่นๆ" && !p.errorReasonOther) return "กรุณาระบุประเภทความผิดพลาดเพิ่มเติม";
  if (!p.errorDescription) return "กรุณากรอกรายละเอียดสาเหตุ";
  if (!p.employeeName) return "กรุณากรอกชื่อพนักงาน";
  if (!p.employeeCode) return "กรุณากรอกรหัสพนักงาน";
  if (!p.workAgeYear || !p.workAgeMonth) return "กรุณาเลือกอายุงาน";
  if (!p.nationality) return "กรุณาเลือกสัญชาติ";
  if (!p.shift) return "กรุณาเลือกกะ";
  if (!p.osm) return "กรุณาเลือก OSM";
  if (!p.otm) return "กรุณาเลือก OTM";
  if (!p.auditName) return "กรุณาเลือก AUDIT";

  const selectedCause = Array.isArray(p.confirmCauseList) ? p.confirmCauseList : [];
  if (!selectedCause.length) return "กรุณาเลือกข้อเท็จจริงที่พนักงานยืนยันอย่างน้อย 1 รายการ";
  if (selectedCause.includes("อื่นๆ") && !p.confirmCauseOther) return "กรุณาระบุข้อเท็จจริงอื่นๆ เพิ่มเติม";
  if (!p.employeeConfirmText) return "ไม่พบคำยืนยันของพนักงาน";

  return "";
}

/** ==========================
 *  PREVIEW BEFORE SUBMIT
 *  ========================== */
function renderGalleryHtml(imageIds) {
  const ids = Array.isArray(imageIds) ? imageIds.filter(Boolean) : [];
  if (!ids.length) return "";

  return `
    <div class="swalGallery">
      ${ids.map((id) => {
        const url = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
        return `
          <button type="button" class="galleryBtn" data-full="${escapeHtml(url)}">
            <img src="${escapeHtml(url)}" alt="attachment image" />
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function bindGalleryClickInSwal() {
  document.querySelectorAll(".galleryBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-full") || "";
      if (!src) return;
      Swal.fire({
        imageUrl: src,
        imageAlt: "ภาพแนบ",
        showConfirmButton: false,
        showCloseButton: true,
        width: 960
      });
    });
  });
}

async function previewBeforeSubmit() {
  const p = collectPayload();
  const err = validatePayload(p);

  if (err) {
    await Swal.fire({
      icon: "warning",
      title: "ข้อมูลไม่ครบ",
      text: err,
      confirmButtonText: "ตกลง"
    });
    return;
  }

  const causeSummary = Array.isArray(p.confirmCauseList) && p.confirmCauseList.length
    ? p.confirmCauseList.map((x) => x === "อื่นๆ" && p.confirmCauseOther ? `${x}: ${p.confirmCauseOther}` : x).join(" | ")
    : "-";

  const emails = Array.isArray(p.emailRecipients) ? p.emailRecipients : [];
  const fileCount = countSelectedFiles();

  await Swal.fire({
    icon: "info",
    title: "ตรวจสอบข้อมูลก่อนบันทึก",
    width: 920,
    html: `
      <div class="swalSummary">
        <div class="swalHero compact">
          <div class="swalHeroTitle">ตรวจสอบข้อมูล Error_BOL</div>
          <div class="swalHeroSub">กรุณาตรวจสอบความถูกต้องก่อนกดบันทึกจริง</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
            <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
            <div class="swalPill">รูป ${fileCount}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลหลัก</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">Label CID</div>
              <div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Item</div>
              <div class="swalKvValue">${escapeHtml(p.item || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">รายการสินค้า</div>
              <div class="swalKvValue">${escapeHtml(p.itemDisplay || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">จำนวนเคส</div>
              <div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">วันที่เกิดเหตุ</div>
              <div class="swalKvValue">${escapeHtml(formatDateThaiLong(p.errorDate))}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">ประเภทความผิดพลาด</div>
              <div class="swalKvValue">${escapeHtml(p.errorReason || "-")}${p.errorReason === "อื่นๆ" && p.errorReasonOther ? ` • ${escapeHtml(p.errorReasonOther)}` : ""}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">รายละเอียดสาเหตุ</div>
          <div class="swalDesc">
            <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลพนักงาน</div>
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
    ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
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
        resetForm();
      }
    });

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

/** ==========================
 *  INIT
 *  ========================== */
function bindMainEvents() {
  $("btnLogin")?.addEventListener("click", doLogin);
  $("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  $("tabErrorBol")?.addEventListener("click", () => switchMode("errorbol"));
  $("tabUnder500")?.addEventListener("click", async () => {
    switchMode("report500");
    if (window.Report500UI?.ensureReady) {
      try { await window.Report500UI.ensureReady(); } catch (_) {}
    }
  });

  $("errorReason")?.addEventListener("change", syncErrorReasonOtherVisibility);
  $("confirmCauseOther")?.addEventListener("input", updateEmployeeConfirmPreview);

  [
    "employeeName",
    "employeeCode",
    "itemDisplay",
    "errorCaseQty",
    "errorDate"
  ].forEach((id) => {
    $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
    $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
  });

  $("btnAddUpload")?.addEventListener("click", addUploadField);
  $("btnPreview")?.addEventListener("click", previewBeforeSubmit);
  $("btnSubmit")?.addEventListener("click", submitForm);
  $("btnReset")?.addEventListener("click", resetForm);

  bindItemLookup();
  buildInitialUploadFields();
  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();
}

document.addEventListener("DOMContentLoaded", () => {
  bindMainEvents();
});
