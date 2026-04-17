const API_BASE = "https://bol.somchaibutphon.workers.dev";

/** ==========================
 *  DOM
 *  ========================== */
const $ = (id) => document.getElementById(id);

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

/** ==========================
 *  ERROR_BOL EDIT MODE STATE
 *  ========================== */
const ERROR_BOL_EDIT_CTX = {
  mode: "new",
  baseRefNo: "",
  sourceRevisionNo: 0,
  sourceDisplayRefNo: "",
  nextRevisionNo: 0,
  loadedRecord: null,
  existingImages: [],
  removedImageIds: [],
  existingSignatures: {},
  replacedSignatures: {},
  loadedPdfUrl: ""
};

window.ERROR_BOL_EDIT_CTX = ERROR_BOL_EDIT_CTX;

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

function splitRefNo_(refNo) {
  const raw = norm(refNo);
  const m = raw.match(/^(\d+)-(\d{4})$/);
  if (!m) return { running: "", year: "" };
  return { running: m[1], year: m[2] };
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
  updateErrorBolSubmitButtonByMode();
  closeErrorBolEditPanel({ clearInput: false });
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

  $("btnOpenErrorBolEditInline")?.addEventListener("click", () => {
    openErrorBolEditPanel();
  });

  $("btnLoadErrorBolForEdit")?.addEventListener("click", async () => {
    await loadErrorBolForEdit(norm($("errorBolEditRefInput")?.value));
  });

  $("btnCancelErrorBolEdit")?.addEventListener("click", () => {
    if (ERROR_BOL_EDIT_CTX.mode === "edit") {
      Swal.fire({
        icon: "question",
        title: "ออกจากโหมดแก้ไข?",
        text: "หากออกจากโหมดแก้ไข ระบบจะล้างข้อมูลที่โหลดกลับมาในฟอร์มนี้",
        showCancelButton: true,
        confirmButtonText: "ออกจากโหมดแก้ไข",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#2563eb"
      }).then((res) => {
        if (res.isConfirmed) {
          exitErrorBolEditMode({ resetForm: true });
        }
      });
      return;
    }
    closeErrorBolEditPanel();
  });

  $("errorBolEditRefInput")?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await loadErrorBolForEdit(norm($("errorBolEditRefInput")?.value));
    }
  });

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

function setSelectedEmails(emails = []) {
  const wanted = new Set((Array.isArray(emails) ? emails : []).map((x) => String(x || "").trim().toLowerCase()));
  document.querySelectorAll(".emailChk").forEach((chk) => {
    chk.checked = wanted.has(String(chk.value || "").trim().toLowerCase());
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

  EDITED_UPLOAD_STORE.delete(input);

  ensureEditButtonForUploadBox(box, input.id);
  updateUploadPreviewFromFile(
    input,
    box,
    f,
    `ไฟล์ที่เลือก: ${f.name} (${Math.round((f.size || 0) / 1024)} KB)`
  );
}

function buildInitialUploadFields() {
  const list = $("uploadList");
  if (!list) return;

  list.innerHTML = "";
  addUploadField("บัตรพนักงาน", { removable: false });
  addUploadField("รูปพนักงาน", { removable: false });
}

function createUploadBoxHtml(id, label, removable) {
  return `
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
}

function addUploadField(label, opts = {}) {
  const { removable = true } = opts;

  const list = $("uploadList");
  if (!list) return;

  const id = "file_" + Math.random().toString(16).slice(2);
  const box = document.createElement("div");
  box.className = "uploadBox";
  box.dataset.boxType = "upload";
  box.innerHTML = createUploadBoxHtml(id, label, removable);
  list.appendChild(box);

  wireUploadBox(box, id, removable);
}

function wireUploadBox(box, id, removable) {
  if (!box) return;

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
 *  EXISTING IMAGE RENDER / EDIT MODE
 *  ========================== */
function normalizeImageMetaList_(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr.map((x, i) => ({
    id: norm(x?.id || x?.fileId || x?.imageId),
    name: norm(x?.name || x?.filename) || `image_${i + 1}.jpg`,
    url: norm(x?.url || x?.viewUrl || (x?.id ? driveImgUrl(x.id) : "")),
    label: norm(x?.label || x?.caption) || `รูปภาพเดิม ${i + 1}`,
    order: Number(x?.order || i + 1),
    source: "existing"
  })).filter((x) => x.id || x.url);
}

function renderExistingUploadImages(images = []) {
  const list = $("uploadList");
  if (!list) return;

  const normalized = normalizeImageMetaList_(images);
  ERROR_BOL_EDIT_CTX.existingImages = normalized.slice();
  ERROR_BOL_EDIT_CTX.removedImageIds = [];

  buildInitialUploadFields();

  normalized.forEach((meta, idx) => {
    const box = document.createElement("div");
    box.className = "uploadBox";
    box.dataset.boxType = "existing";
    box.dataset.existingImageId = meta.id || "";
    box.dataset.label = meta.label || `รูปภาพเดิม ${idx + 1}`;

    const caption = escapeHtml(meta.label || `รูปภาพเดิม ${idx + 1}`);
    const url = escapeHtml(meta.url || driveImgUrl(meta.id));
    const imageId = escapeHtml(meta.id || "");
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div class="cap">${caption}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="swalPill primary" style="min-height:28px">รูปเดิม</span>
          <button type="button" class="btn ghost btnReplaceExistingImage" style="padding:6px 10px;border-radius:999px">เลือกรูปใหม่แทน</button>
          <button type="button" class="btn ghost btnRemoveExistingImage" style="padding:6px 10px;border-radius:999px">ไม่นำรูปนี้ไปใช้</button>
        </div>
      </div>
      <input type="file" accept="image/*" class="existingImageReplaceInput hidden">
      <img class="previewImg" src="${url}" alt="${caption}" data-existing-image-id="${imageId}">
      <div class="small existingImageMeta">รูปเดิมจากระบบ: ${escapeHtml(meta.name || meta.id || "-")}</div>
    `;

    list.appendChild(box);

    const replaceInput = box.querySelector(".existingImageReplaceInput");
    const btnReplace = box.querySelector(".btnReplaceExistingImage");
    const btnRemove = box.querySelector(".btnRemoveExistingImage");
    const preview = box.querySelector(".previewImg");
    const metaText = box.querySelector(".existingImageMeta");

    btnReplace?.addEventListener("click", () => {
      replaceInput?.click();
    });

    replaceInput?.addEventListener("change", async () => {
      const f = replaceInput.files && replaceInput.files[0] ? replaceInput.files[0] : null;
      if (!f) return;

      if (!/^image\//i.test(f.type || "")) {
        replaceInput.value = "";
        await Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      EDITED_UPLOAD_STORE.set(replaceInput, {
        edited: false,
        file: f,
        filename: f.name,
        dataUrl: ""
      });

      if (preview?.dataset.objectUrl) {
        try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
      }
      const objUrl = URL.createObjectURL(f);
      if (preview) {
        preview.src = objUrl;
        preview.dataset.objectUrl = objUrl;
      }
      if (metaText) {
        metaText.textContent = `แทนด้วยไฟล์ใหม่: ${f.name} (${Math.round((f.size || 0) / 1024)} KB)`;
      }

      if (meta.id) {
        ERROR_BOL_EDIT_CTX.removedImageIds = Array.from(new Set([
          ...ERROR_BOL_EDIT_CTX.removedImageIds,
          meta.id
        ]));
      }

      box.dataset.replaced = "1";
      box.dataset.boxType = "existing-replaced";
    });

    btnRemove?.addEventListener("click", () => {
      if (meta.id) {
        ERROR_BOL_EDIT_CTX.removedImageIds = Array.from(new Set([
          ...ERROR_BOL_EDIT_CTX.removedImageIds,
          meta.id
        ]));
      }
      box.remove();
    });
  });
}

function collectExistingAndNewImagesForSubmit() {
  const boxes = Array.from(document.querySelectorAll("#uploadList .uploadBox"));
  const existingKeep = [];
  const replacedInputs = [];
  const newInputs = [];

  boxes.forEach((box) => {
    const boxType = String(box.dataset.boxType || "");
    if (boxType === "existing") {
      const id = norm(box.dataset.existingImageId);
      const label = norm(box.dataset.label);
      if (id && !ERROR_BOL_EDIT_CTX.removedImageIds.includes(id)) {
        existingKeep.push({ id, label });
      }
      return;
    }

    if (boxType === "existing-replaced") {
      const id = norm(box.dataset.existingImageId);
      const label = norm(box.dataset.label);
      const input = box.querySelector(".existingImageReplaceInput");
      const edited = input ? (EDITED_UPLOAD_STORE.get(input)?.file || null) : null;
      const raw = input?.files && input.files[0] ? input.files[0] : null;
      const file = edited || raw;
      if (id) {
        ERROR_BOL_EDIT_CTX.removedImageIds = Array.from(new Set([
          ...ERROR_BOL_EDIT_CTX.removedImageIds,
          id
        ]));
      }
      if (file) replacedInputs.push({ file, label });
      return;
    }

    const input = box.querySelector('input[type="file"]');
    if (!input) return;
    const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
    const raw = input.files && input.files[0] ? input.files[0] : null;
    const file = edited || raw;
    if (file) {
      const label = norm(box.querySelector(".cap")?.textContent) || "รูปภาพ";
      newInputs.push({ file, label });
    }
  });

  return { existingKeep, replacedInputs, newInputs };
}

/** ==========================
 *  ERROR_BOL EDIT MODE HELPERS
 *  ========================== */
function setErrorBolEditStatus(message = "", type = "info") {
  const el = $("errorBolEditStatus");
  if (!el) return;
  el.classList.remove("hidden", "success", "error");
  el.textContent = message || "";
  if (type === "success") el.classList.add("success");
  if (type === "error") el.classList.add("error");
}

function clearErrorBolEditStatus() {
  const el = $("errorBolEditStatus");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
  el.classList.remove("success", "error");
}

function openErrorBolEditPanel() {
  $("errorBolEditTools")?.classList.remove("hidden");
  $("errorBolEditPanel")?.classList.remove("hidden");
  clearErrorBolEditStatus();
  setTimeout(() => {
    $("errorBolEditRefInput")?.focus();
    $("errorBolEditRefInput")?.select();
  }, 0);
}

function closeErrorBolEditPanel({ clearInput = true } = {}) {
  $("errorBolEditPanel")?.classList.add("hidden");
  if (clearInput && $("errorBolEditRefInput")) $("errorBolEditRefInput").value = "";
  clearErrorBolEditStatus();
}

function renderErrorBolEditModeBadge() {
  const badge = $("errorBolEditModeBadge");
  if (!badge) return;

  if (ERROR_BOL_EDIT_CTX.mode !== "edit" || !ERROR_BOL_EDIT_CTX.baseRefNo) {
    badge.classList.add("hidden");
    badge.innerHTML = "";
    return;
  }

  badge.innerHTML = `
    <strong>โหมดแก้ไข</strong>
    <span>Ref ${escapeHtml(ERROR_BOL_EDIT_CTX.baseRefNo)}</span>
    <span>โหลดจาก Rev.${Number(ERROR_BOL_EDIT_CTX.sourceRevisionNo || 0)}</span>
    <span>บันทึกครั้งถัดไปเป็น Rev.${Number(ERROR_BOL_EDIT_CTX.nextRevisionNo || 1)}</span>
  `;
  badge.classList.remove("hidden");
}

function updateErrorBolSubmitButtonByMode() {
  const btn = $("btnSubmit");
  if (!btn) return;
  btn.textContent = ERROR_BOL_EDIT_CTX.mode === "edit"
    ? "บันทึก Revision ใหม่"
    : "บันทึกและสร้าง PDF";
}

function resetErrorBolEditArtifacts() {
  ERROR_BOL_EDIT_CTX.mode = "new";
  ERROR_BOL_EDIT_CTX.baseRefNo = "";
  ERROR_BOL_EDIT_CTX.sourceRevisionNo = 0;
  ERROR_BOL_EDIT_CTX.sourceDisplayRefNo = "";
  ERROR_BOL_EDIT_CTX.nextRevisionNo = 0;
  ERROR_BOL_EDIT_CTX.loadedRecord = null;
  ERROR_BOL_EDIT_CTX.existingImages = [];
  ERROR_BOL_EDIT_CTX.removedImageIds = [];
  ERROR_BOL_EDIT_CTX.existingSignatures = {};
  ERROR_BOL_EDIT_CTX.replacedSignatures = {};
  ERROR_BOL_EDIT_CTX.loadedPdfUrl = "";

  renderErrorBolEditModeBadge();
  updateErrorBolSubmitButtonByMode();
  clearErrorBolEditStatus();
  closeErrorBolEditPanel();
}

function enterErrorBolEditMode(ctx = {}) {
  ERROR_BOL_EDIT_CTX.mode = "edit";
  ERROR_BOL_EDIT_CTX.baseRefNo = norm(ctx.baseRefNo || ctx.refNo);
  ERROR_BOL_EDIT_CTX.sourceRevisionNo = Number(ctx.sourceRevisionNo || ctx.revisionNo || 0);
  ERROR_BOL_EDIT_CTX.sourceDisplayRefNo = norm(ctx.sourceDisplayRefNo || ctx.displayRefNo);
  ERROR_BOL_EDIT_CTX.nextRevisionNo = Number(ctx.nextRevisionNo || (ERROR_BOL_EDIT_CTX.sourceRevisionNo + 1));
  ERROR_BOL_EDIT_CTX.loadedRecord = ctx.loadedRecord || null;
  ERROR_BOL_EDIT_CTX.existingSignatures = ctx.existingSignatures || {};
  ERROR_BOL_EDIT_CTX.loadedPdfUrl = norm(ctx.pdfUrl);

  $("errorBolEditTools")?.classList.remove("hidden");
  renderErrorBolEditModeBadge();
  updateErrorBolSubmitButtonByMode();
}

function exitErrorBolEditMode({ resetForm: shouldResetForm = false } = {}) {
  resetErrorBolEditArtifacts();
  if (shouldResetForm) {
    resetForm();
  }
}

async function loadErrorBolForEdit(refNo) {
  const cleanRef = norm(refNo);
  if (!cleanRef) {
    setErrorBolEditStatus("กรุณากรอก Ref ที่ต้องการแก้ไข", "error");
    return;
  }

  openErrorBolEditPanel();
  setErrorBolEditStatus(`กำลังค้นหาข้อมูล Ref ${cleanRef} ...`, "info");

  try {
    const res = await fetch(apiUrl(`/errorbol/edit/${encodeURIComponent(cleanRef)}`), { method: "GET" });
    const text = await res.text();

    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `ไม่พบข้อมูล Ref ${cleanRef}`);
    }

    applyErrorBolDataToForm(json);

    enterErrorBolEditMode({
      baseRefNo: json.baseRefNo || json.refNo || cleanRef,
      sourceRevisionNo: Number(json.revisionNo || 0),
      sourceDisplayRefNo: json.displayRefNo || "",
      nextRevisionNo: Number(json.nextRevisionNo || (Number(json.revisionNo || 0) + 1)),
      loadedRecord: json,
      existingSignatures: json.signatures || {},
      pdfUrl: json.pdfUrl || ""
    });

    setErrorBolEditStatus(
      `โหลดข้อมูลสำเร็จ: ${json.displayRefNo || json.baseRefNo || cleanRef} พร้อมแก้ไขแล้ว`,
      "success"
    );
  } catch (err) {
    console.error("loadErrorBolForEdit error:", err);
    setErrorBolEditStatus(err?.message || "โหลดข้อมูลไม่สำเร็จ", "error");
  }
}

function setValueIfExists(id, value) {
  const el = $(id);
  if (!el) return;
  el.value = value == null ? "" : String(value);
}

function setSelectValueWithFallback(id, value) {
  const el = $(id);
  if (!el) return;
  const v = value == null ? "" : String(value);
  const hasOption = Array.from(el.options || []).some((o) => String(o.value) === v);
  el.value = hasOption ? v : "";
}

function applyErrorBolDataToForm(record = {}) {
  const payload = record.payload || record.data || record || {};

  const baseRefNo = norm(record.baseRefNo || payload.baseRefNo || payload.refNo);
  const parts = splitRefNo_(baseRefNo);
  if (parts.running && $("refNo")) $("refNo").value = parts.running;
  if (parts.year && $("refYear")) $("refYear").value = parts.year;

  if ($("lps")) $("lps").value = AUTH.name || payload.lps || "";

  setValueIfExists("labelCid", payload.labelCid);
  setValueIfExists("item", payload.item);
  setValueIfExists("errorCaseQty", payload.errorCaseQty);
  setValueIfExists("employeeName", payload.employeeName);
  setValueIfExists("employeeCode", payload.employeeCode);
  setValueIfExists("interpreterName", payload.interpreterName);
  setValueIfExists("errorDate", payload.errorDate);
  setValueIfExists("errorDescription", payload.errorDescription);
  setValueIfExists("errorReasonOther", payload.errorReasonOther);
  setValueIfExists("confirmCauseOther", payload.confirmCauseOther);

  setSelectValueWithFallback("errorReason", payload.errorReason);
  setSelectValueWithFallback("workAgeYear", payload.workAgeYear);
  setSelectValueWithFallback("workAgeMonth", payload.workAgeMonth);
  setSelectValueWithFallback("nationality", payload.nationality);
  setSelectValueWithFallback("shift", payload.shift);
  setSelectValueWithFallback("osm", payload.osm);
  setSelectValueWithFallback("otm", payload.otm);
  setSelectValueWithFallback("auditName", payload.auditName);

  ITEM_LOOKUP_STATE = {
    item: norm(payload.item),
    description: norm(payload.itemDescription || payload.description || ITEM_NOT_FOUND_TEXT),
    displayText: norm(payload.itemDisplay || ""),
    found: norm(payload.itemDescription || payload.description) && norm(payload.itemDescription || payload.description) !== ITEM_NOT_FOUND_TEXT,
    loading: false
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  const selectedCauses = Array.isArray(payload.confirmCauseSelected)
    ? payload.confirmCauseSelected
    : Array.isArray(payload.confirmCauseList)
      ? payload.confirmCauseList
      : typeof payload.confirmCauseSelectedText === "string"
        ? payload.confirmCauseSelectedText.split("|").map((x) => x.trim()).filter(Boolean)
        : [];

  renderConfirmCauseSelector();

  document.querySelectorAll(".confirmCauseChk").forEach((chk) => {
    const value = norm(chk.value);
    chk.checked = selectedCauses.includes(value);
  });

  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();

  const employeeConfirmText = norm(payload.employeeConfirmText);
  if (employeeConfirmText) {
    setValueIfExists("employeeConfirmText", employeeConfirmText);
  } else {
    updateEmployeeConfirmPreview();
  }

  setSelectedEmails(payload.emailRecipients || payload.selectedEmails || []);

  renderExistingUploadImages(record.images || payload.images || []);
  updateEmployeeConfirmPreview();
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

  p.editContext = {
    mode: ERROR_BOL_EDIT_CTX.mode,
    baseRefNo: ERROR_BOL_EDIT_CTX.baseRefNo,
    sourceRevisionNo: ERROR_BOL_EDIT_CTX.sourceRevisionNo,
    sourceDisplayRefNo: ERROR_BOL_EDIT_CTX.sourceDisplayRefNo,
    nextRevisionNo: ERROR_BOL_EDIT_CTX.nextRevisionNo
  };

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

  const imageCollect = collectExistingAndNewImagesForSubmit();
  const fileCount = imageCollect.existingKeep.length + imageCollect.replacedInputs.length + imageCollect.newInputs.length;
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
            <div class="swalPill">${ERROR_BOL_EDIT_CTX.mode === "edit" ? "โหมดแก้ไข" : "โหมดสร้างใหม่"}</div>
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
              <div class="swalKvLabel">Base Ref</div>
              <div class="swalKvValue">${escapeHtml(ERROR_BOL_EDIT_CTX.baseRefNo || p.refNo || "-")}</div>
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
              <div class="swalKvLabel">จำนวนรูปที่จะใช้</div>
              <div class="swalKvValue">${fileCount} รูป</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">สถานะการสร้างเอกสาร</div>
              <div class="swalKvValue">ระบบจะสร้าง PDF ใหม่หลังบันทึกสำเร็จ</div>
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

/** ==========================
 *  File Count / Collect
 *  ========================== */
function countSelectedFiles() {
  const collected = collectExistingAndNewImagesForSubmit();
  return collected.existingKeep.length + collected.replacedInputs.length + collected.newInputs.length;
}

async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
  const collected = collectExistingAndNewImagesForSubmit();
  const picked = [...collected.replacedInputs, ...collected.newInputs];

  if (picked.length > maxFiles) {
    await Swal.fire({
      icon: "warning",
      title: "รูปใหม่เยอะเกินไป",
      text: `เลือกรูปใหม่ได้สูงสุด ${maxFiles} รูป (ตอนนี้เลือก ${picked.length})`
    });
    throw new Error("Too many files");
  }

  const out = [];
  for (const entry of picked) {
    const f = entry.file;
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
    out.push({
      filename: f.name,
      base64,
      label: entry.label || ""
    });
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

  let sigPad = null;

  const res = await Swal.fire({
    title,
    html: `
      <div style="text-align:left">
        <div style="font-size:13px;color:#64748b;font-weight:700;margin-bottom:8px">${escapeHtml(subtitle || "")}</div>
        <div style="border:1px solid #d9e4f1;border-radius:14px;padding:8px;background:#fff">
          <canvas id="${canvasId}" width="760" height="240" style="width:100%;height:220px;display:block;background:#fff;border-radius:12px;touch-action:none;"></canvas>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
          <button type="button" id="${clearId}" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ล้างลายเซ็น</button>
        </div>
      </div>
    `,
    width: 900,
    confirmButtonText: "ยืนยันลายเซ็น",
    confirmButtonColor: "#2563eb",
    cancelButtonText: "ยกเลิก",
    showCancelButton: true,
    didOpen: () => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";

      let drawing = false;
      let moved = false;
      let lastX = 0;
      let lastY = 0;

      const getPoint = (evt) => {
        const r = canvas.getBoundingClientRect();
        const touch = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
        return {
          x: touch.clientX - r.left,
          y: touch.clientY - r.top
        };
      };

      const start = (evt) => {
        evt.preventDefault();
        const p = getPoint(evt);
        drawing = true;
        moved = moved || false;
        lastX = p.x;
        lastY = p.y;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
      };

      const move = (evt) => {
        if (!drawing) return;
        evt.preventDefault();
        const p = getPoint(evt);
        moved = true;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
      };

      const end = (evt) => {
        if (!drawing) return;
        evt.preventDefault();
        drawing = false;
      };

      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);

      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end, { passive: false });

      sigPad = {
        canvas,
        ctx,
        isEmpty() {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] !== 0) return false;
          }
          return true;
        },
        clear() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        toDataURL() {
          return canvas.toDataURL("image/png");
        }
      };

      document.getElementById(clearId)?.addEventListener("click", () => {
        sigPad?.clear();
      });
    },
    preConfirm: () => {
      if (!sigPad || sigPad.isEmpty()) {
        Swal.showValidationMessage("กรุณาเซ็นชื่อก่อนยืนยัน");
        return false;
      }
      return sigPad.toDataURL();
    }
  });

  if (!res.isConfirmed || !res.value) {
    return { ok: false, base64: "" };
  }

  const dataUrl = String(res.value || "");
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  return { ok: true, base64 };
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

  const collectedImages = collectExistingAndNewImagesForSubmit();

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
    existingImages: collectedImages.existingKeep,
    removedImageIds: ERROR_BOL_EDIT_CTX.removedImageIds.slice(),
    signatures: {
      supervisorBase64: signRes.supervisorBase64 || "",
      employeeBase64: signRes.employeeBase64 || "",
      interpreterBase64: signRes.interpreterBase64 || ""
    },
    existingSignatures: ERROR_BOL_EDIT_CTX.existingSignatures || {}
  };

  ProgressUI.show(
    ERROR_BOL_EDIT_CTX.mode === "edit" ? "กำลังบันทึก Revision ของ Error_BOL" : "กำลังบันทึก Error_BOL",
    "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล"
  );

  try {
    ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
    await safeDelay(140);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(180);
    ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${collectedImages.existingKeep.length} รูปเดิม + ${files.length} รูปใหม่/แทน)`);

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
      ? `<img class="sigThumb" src="data:image/png;base64,${signRes.supervisorBase64}" alt="sign supervisor">`
      : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

    const empSignThumb = signRes.employeeBase64
      ? `<img class="sigThumb" src="data:image/png;base64,${signRes.employeeBase64}" alt="sign employee">`
      : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

    const intSignThumb = signRes.interpreterBase64
      ? `<img class="sigThumb" src="data:image/png;base64,${signRes.interpreterBase64}" alt="sign interpreter">`
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
              <div class="swalPill">Ref: ${escapeHtml(json.displayRefNo || p.refNo || "-")}</div>
              <div class="swalPill">${ERROR_BOL_EDIT_CTX.mode === "edit" ? "Revision ใหม่" : "รายการใหม่"}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(json.displayRefNo || p.refNo || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Base Ref</div><div class="swalKvValue">${escapeHtml(json.baseRefNo || ERROR_BOL_EDIT_CTX.baseRefNo || p.refNo || "-")}</div></div>
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
        exitErrorBolEditMode({ resetForm: true });
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
  if ($("refYear")) $("refYear").value = String(getCurrentThaiBuddhistYearNumber());
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
