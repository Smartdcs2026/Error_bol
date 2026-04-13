// const API_BASE = "https://bol.somchaibutphon.workers.dev";

// /** ==========================
//  *  SHARED PROGRESS UI
//  *  ใช้ร่วมกันทั้ง Error_BOL และ Report500
//  *  ========================== */
// const ProgressUI = (() => {
//   const stageIds = ["validate", "upload", "save", "pdf", "email"];

//   const el = {
//     overlay: () => $("progressOverlay"),
//     card: () => $("progressCard"),
//     title: () => $("progressTitle"),
//     subtitle: () => $("progressSubtitle"),
//     percent: () => $("progressPercentText"),
//     step: () => $("progressStepText"),
//     bar: () => $("progressBarFill"),
//     hint: () => $("progressHint")
//   };

//   function safeRow(stageKey) {
//     return document.getElementById(`stage-${stageKey}`);
//   }

//   function reset() {
//     el.card()?.classList.remove("success", "error");
//     setProgress(0, "เริ่มต้น...");
//     stageIds.forEach((id) => {
//       const row = safeRow(id);
//       if (!row) return;
//       row.classList.remove("active", "done", "error");
//       const st = row.querySelector(".stage-status");
//       if (st) st.textContent = "รอ";
//     });
//     setHint("กรุณาอย่าปิดหน้าจอหรือรีเฟรชระหว่างการบันทึก");
//   }

//   function show(title = "กำลังบันทึกข้อมูล", subtitle = "โปรดรอสักครู่ ระบบกำลังประมวลผล") {
//     reset();
//     if (el.title()) el.title().textContent = title;
//     if (el.subtitle()) el.subtitle().textContent = subtitle;
//     el.overlay()?.classList.remove("hidden");
//     document.body.classList.add("progress-lock");
//   }

//   function hide(delay = 0) {
//     setTimeout(() => {
//       el.overlay()?.classList.add("hidden");
//       document.body.classList.remove("progress-lock");
//     }, delay);
//   }

//   function setProgress(percent, stepText) {
//     const safe = Math.max(0, Math.min(100, Number(percent) || 0));
//     if (el.percent()) el.percent().textContent = `${safe}%`;
//     if (el.bar()) el.bar().style.width = `${safe}%`;
//     if (stepText && el.step()) el.step().textContent = stepText;
//   }

//   function setHint(text) {
//     if (el.hint()) el.hint().textContent = text || "";
//   }

//   function setStageState(stageKey, state, text) {
//     const row = safeRow(stageKey);
//     if (!row) return;
//     row.classList.remove("active", "done", "error");
//     if (state) row.classList.add(state);

//     const st = row.querySelector(".stage-status");
//     if (!st) return;

//     st.textContent = text || (
//       state === "done" ? "เสร็จแล้ว" :
//       state === "active" ? "กำลังดำเนินการ" :
//       state === "error" ? "เกิดข้อผิดพลาด" :
//       "รอ"
//     );
//   }

//   function activateOnly(stageKey, percent, stepText) {
//     stageIds.forEach((id) => {
//       const row = safeRow(id);
//       if (!row) return;
//       if (!row.classList.contains("done")) {
//         row.classList.remove("active");
//         const st = row.querySelector(".stage-status");
//         if (st && !row.classList.contains("error")) st.textContent = "รอ";
//       }
//     });
//     setStageState(stageKey, "active");
//     if (percent != null) setProgress(percent, stepText || "");
//   }

//   function markDone(stageKey, percent, stepText, customText) {
//     setStageState(stageKey, "done", customText || "เสร็จแล้ว");
//     if (percent != null) setProgress(percent, stepText || "");
//   }

//   function markError(stageKey, message, percent = null) {
//     setStageState(stageKey, "error", message || "เกิดข้อผิดพลาด");
//     if (percent != null) setProgress(percent);
//     el.card()?.classList.remove("success");
//     el.card()?.classList.add("error");
//   }

//   function success(title = "บันทึกสำเร็จ", subtitle = "ข้อมูลถูกบันทึกเรียบร้อยแล้ว") {
//     el.card()?.classList.remove("error");
//     el.card()?.classList.add("success");
//     if (el.title()) el.title().textContent = title;
//     if (el.subtitle()) el.subtitle().textContent = subtitle;
//     setProgress(100, "เสร็จสมบูรณ์");
//   }

//   return {
//     show,
//     hide,
//     reset,
//     setProgress,
//     setHint,
//     setStageState,
//     activateOnly,
//     markDone,
//     markError,
//     success
//   };
// })();

// window.ProgressUI = ProgressUI;

// function sleepMs(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function safeDelay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms || 0));
// }

// function estimateUploadProgressByFiles(fileCount, baseStart = 16, baseEnd = 42) {
//   const count = Math.max(1, Number(fileCount) || 1);
//   return {
//     start: baseStart,
//     next: (currentIndex) => {
//       const ratio = Math.max(0, Math.min(1, currentIndex / count));
//       return Math.round(baseStart + ((baseEnd - baseStart) * ratio));
//     },
//     end: baseEnd
//   };
// }

// function buildEmailStatusSummary_(json) {
//   const emailResult = json?.emailResult || {};
//   const emailStatus = String(emailResult.error || json?.emailSendStatus || "").trim();
//   const emailOk = !!(emailResult.ok || /SENT/i.test(emailStatus));
//   const emailSkipped = !!(emailResult.skipped || /SKIPPED/i.test(emailStatus));
//   const attachmentMode = String(emailResult.attachmentMode || "").trim();

//   let emailModeText = "ส่งอีเมลเรียบร้อย";
//   if (attachmentMode === "LINK_ONLY") emailModeText = "ส่งอีเมลแบบลิงก์ PDF";
//   if (attachmentMode === "ATTACHED") emailModeText = "ส่งอีเมลพร้อมไฟล์ PDF";

//   return {
//     emailResult,
//     emailStatus,
//     emailOk,
//     emailSkipped,
//     attachmentMode,
//     emailModeText
//   };
// }

// const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
// const ITEM_LOOKUP_MIN_LEN = 3;
// const ITEM_LOOKUP_DEBOUNCE_MS = 420;
// const APP_LOGO_URL = "https://lh5.googleusercontent.com/d/1758AOZ5E3JbnzwrFA4u2kH8nZUPrr8iP";

// /** ==========================
//  *  STATE
//  *  ========================== */
// let OPTIONS = {
//   errorList: [],
//   auditList: [],
//   emailList: [],
//   osmList: [],
//   otmList: [],
//   confirmCauseList: [],
//   nationalityList: []
// };

// let AUTH = { name: "", pass: "" };

// let ITEM_LOOKUP_STATE = {
//   item: "",
//   description: "",
//   displayText: "",
//   found: false,
//   loading: false
// };

// const ITEM_LOCAL_CACHE = new Map();
// let itemLookupTimer = null;
// const EDITED_UPLOAD_STORE = new WeakMap();

// function buildEditedImageBadgeHtml(file) {
//   const sizeKb = file?.size ? Math.round(file.size / 1024) : 0;
//   return `ไฟล์แก้ไขแล้ว: ${file?.name || "edited-image.jpg"} (${sizeKb} KB)`;
// }

// function ensureEditButtonForUploadBox(box, inputId) {
//   if (!box) return null;

//   let btn = box.querySelector(".btnEditImage");
//   if (btn) return btn;

//   const topRow = box.firstElementChild;
//   if (!topRow) return null;

//   btn = document.createElement("button");
//   btn.type = "button";
//   btn.className = "btn ghost btnEditImage";
//   btn.textContent = "แก้ไขภาพ";

//   topRow.appendChild(btn);

//   btn.addEventListener("click", async () => {
//     const input = $(inputId);
//     if (!input) return;

//     const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
//     const raw = input.files && input.files[0] ? input.files[0] : null;
//     const file = edited || raw;

//     if (!file) {
//       await Swal.fire({
//         icon: "info",
//         title: "ยังไม่มีรูปภาพ",
//         text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
//       });
//       return;
//     }

//     await openEditorForUploadInput(input, box);
//   });

//   return btn;
// }

// function updateUploadPreviewFromFile(input, box, file, messageText) {
//   if (!input || !box || !file) return;

//   const img = box.querySelector(".previewImg");
//   const txt = box.querySelector(".small");

//   if (txt) {
//     txt.textContent = messageText || buildEditedImageBadgeHtml(file);
//   }

//   if (img) {
//     if (img.dataset.objectUrl) {
//       try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//     }
//     const url = URL.createObjectURL(file);
//     img.src = url;
//     img.dataset.objectUrl = url;
//   }
// }

// async function openEditorForUploadInput(input, box) {
//   if (!window.ImageEditorX || typeof window.ImageEditorX.open !== "function") {
//     await Swal.fire({
//       icon: "error",
//       title: "ยังไม่พร้อมใช้งาน",
//       text: "ไม่พบ image-editor.js หรือยังไม่ได้โหลด modal ของ image editor"
//     });
//     return;
//   }

//   const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
//   const raw = input.files && input.files[0] ? input.files[0] : null;
//   const sourceFile = edited || raw;

//   if (!sourceFile) return;

//   const result = await window.ImageEditorX.open(sourceFile, {
//     strokeColor: "#dc2626",
//     strokeWidth: 3
//   });

//   if (!result?.ok || !result.file) return;

//   EDITED_UPLOAD_STORE.set(input, {
//     edited: true,
//     file: result.file,
//     filename: result.filename || result.file.name,
//     dataUrl: result.dataUrl || ""
//   });

//   updateUploadPreviewFromFile(
//     input,
//     box,
//     result.file,
//     buildEditedImageBadgeHtml(result.file)
//   );
// }

// async function handlePickedImageForUpload(input, box) {
//   const f = input?.files && input.files[0] ? input.files[0] : null;
//   if (!f) return;

//   if (!/^image\//i.test(f.type || "")) {
//     input.value = "";
//     EDITED_UPLOAD_STORE.delete(input);

//     await Swal.fire({
//       icon: "warning",
//       title: "ไฟล์ไม่ถูกต้อง",
//       text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
//     });
//     return;
//   }

//   // เปลี่ยนรูปใหม่ ให้ล้างสถานะไฟล์ที่เคยแก้ไว้ก่อน
//   EDITED_UPLOAD_STORE.delete(input);

//   ensureEditButtonForUploadBox(box, input.id);
// updateUploadPreviewFromFile(
//   input,
//   box,
//   f,
//   `ไฟล์ที่เลือก: ${f.name} (${Math.round((f.size || 0) / 1024)} KB)`
// );
// }
// const $ = (id) => document.getElementById(id);

// /** ==========================
//  *  URL / BASIC HELPERS
//  *  ========================== */
// function apiUrl(path) {
//   const base = String(API_BASE || "").replace(/\/+$/, "");
//   const p = String(path || "").replace(/^\/+/, "");
//   return `${base}/${p}`;
// }

// function norm(v) {
//   return String(v == null ? "" : v).trim();
// }

// function escapeHtml(value) {
//   return String(value == null ? "" : value)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function getCurrentThaiBuddhistYearNumber() {
//   return new Date().getFullYear() + 543;
// }

// function driveImgUrl(id) {
//   return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
// }

// function formatDateToDisplay(value) {
//   const s = String(value || "").trim();
//   if (!s) return "";

//   let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//   if (m) return `${m[3]}/${m[2]}/${m[1]}`;

//   m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
//   if (m) return s;

//   const d = new Date(s);
//   if (!isNaN(d.getTime())) {
//     const dd = String(d.getDate()).padStart(2, "0");
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const yyyy = d.getFullYear();
//     return `${dd}/${mm}/${yyyy}`;
//   }

//   return s;
// }

// function safeSetLoginMsg(msg) {
//   const el = $("loginMsg");
//   if (el) el.textContent = msg || "";
// }

// function todayIsoLocal() {
//   const d = new Date();
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }

// function applyStaticLogos() {
//   document.querySelectorAll(".brandLogoImg, .loginHeroLogo").forEach((img) => {
//     img.setAttribute("src", APP_LOGO_URL);
//     img.setAttribute("referrerpolicy", "no-referrer");
//     img.setAttribute("loading", "eager");
//     img.setAttribute("alt", "S&LP Logo");
//   });
// }

// window.apiUrl = apiUrl;
// window.safeSetLoginMsg = safeSetLoginMsg;
// window.AUTH = AUTH;
// window.API_BASE = API_BASE;

// /** ==========================
//  *  REF HELPERS
//  *  ========================== */
// function buildYearOptionsForSelect(selectEl) {
//   if (!selectEl) return;
//   const currentYear = getCurrentThaiBuddhistYearNumber();
//   const years = [currentYear - 1, currentYear, currentYear + 1];
//   selectEl.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
//   selectEl.value = String(currentYear);
// }

// function bindRefInputs() {
//   bindRefPair_("refNo", "refYear");
//   bindRefPair_("rptRefNo", "rptRefYear");
// }

// function bindRefPair_(runningId, yearId) {
//   const runningEl = $(runningId);
//   const yearEl = $(yearId);
//   if (!runningEl || !yearEl) return;
//   buildYearOptionsForSelect(yearEl);
//   runningEl.addEventListener("input", () => {
//     runningEl.value = String(runningEl.value || "").replace(/[^\d]/g, "");
//   });
// }

// function buildRefNo_(runningId, yearId) {
//   const running = String($(runningId)?.value || "").replace(/[^\d]/g, "").trim();
//   const year = String($(yearId)?.value || "").trim() || String(getCurrentThaiBuddhistYearNumber());
//   if (!running) return "";
//   return `${running}-${year}`;
// }

// function getRefNoValue() {
//   return buildRefNo_("refNo", "refYear");
// }

// function getRptRefNoValue() {
//   return buildRefNo_("rptRefNo", "rptRefYear");
// }

// /** ==========================
//  *  GALLERY
//  *  ========================== */
// function renderGalleryHtml(imageIds = []) {
//   if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

//   const cards = imageIds.map((id, i) => {
//     const url = driveImgUrl(id);
//     return `
//       <button type="button" class="galItem" data-url="${url}" aria-label="ดูรูปที่ ${i + 1}">
//         <div class="galThumbWrap">
//           <img class="galThumb" src="${url}" alt="รูปที่ ${i + 1}" loading="lazy">
//           <div class="galBadge">${i + 1}</div>
//         </div>
//         <div class="galCap">รูปภาพแนบ ${i + 1}</div>
//       </button>
//     `;
//   }).join("");

//   return `
//     <div style="margin-top:10px">
//       <div style="font-weight:900;margin-bottom:6px">รูปภาพที่แนบ (${imageIds.length})</div>
//       <div class="galGrid">${cards}</div>
//       <div style="margin-top:8px;color:#94a3b8;font-size:12px">แตะ/คลิกรูปเพื่อดูขนาดเต็ม</div>
//     </div>
//   `;
// }

// function bindGalleryClickInSwal() {
//   const root = Swal.getHtmlContainer();
//   if (!root) return;
//   const items = root.querySelectorAll(".galItem");
//   items.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const url = btn.getAttribute("data-url");
//       if (!url) return;
//       Swal.fire({
//         title: "ดูรูปภาพแนบ",
//         html: `
//           <div style="text-align:center">
//             <img
//               src="${url}"
//               style="width:100%;max-height:72vh;object-fit:contain;border-radius:16px;border:1px solid #d7ddea;background:#fff"
//               alt="รูปภาพแนบ"
//             />
//           </div>
//         `,
//         confirmButtonText: "ปิด",
//         confirmButtonColor: "#2563eb",
//         width: 900
//       });
//     });
//   });
// }

// /** ==========================
//  *  INIT
//  *  ========================== */
// init().catch((err) => {
//   console.error(err);
//   safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
// });

// async function init() {
//   applyStaticLogos();
//   bindTabs();
//   bindEvents();
//   bindRefInputs();
//   buildInitialUploadFields();
//   buildWorkAgeOptions();
//   buildShiftOptions();

//   try {
//     await loadOptions();
//     fillFormDropdowns();
//     renderEmailSelector();
//     renderConfirmCauseSelector();
//   } catch (err) {
//     console.error("loadOptions failed:", err);
//     safeSetLoginMsg("โหลดตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
//   }

//   numericOnly($("labelCid"));
//   numericOnly($("item"));
//   numericOnly($("errorCaseQty"));
//   alnumUpperOnly($("employeeCode"));

//   syncErrorReasonOtherVisibility();
//   syncConfirmCauseOtherVisibility();
//   setActiveTab("error");
//   updateEmployeeConfirmPreview();
// }

// /** ==========================
//  *  Tabs
//  *  ========================== */
// function bindTabs() {
//   $("tabErrorBol")?.addEventListener("click", async () => {
//     await setActiveTab("error");
//   });

//   $("tabUnder500")?.addEventListener("click", async () => {
//     await setActiveTab("u500");
//   });
// }

// async function setActiveTab(which) {
//   $("tabErrorBol")?.classList.toggle("active", which === "error");
//   $("tabUnder500")?.classList.toggle("active", which === "u500");

//   if (!AUTH.name) {
//     $("loginCard")?.classList.remove("hidden");
//     $("modeTabs")?.classList.add("hidden");
//     $("formCard")?.classList.add("hidden");
//     $("under500Card")?.classList.add("hidden");
//     return;
//   }

//   $("loginCard")?.classList.add("hidden");
//   $("modeTabs")?.classList.remove("hidden");
//   $("formCard")?.classList.toggle("hidden", which !== "error");
//   $("under500Card")?.classList.toggle("hidden", which !== "u500");

//   if (which === "u500") {
//     try {
//       if (window.Report500UI && typeof window.Report500UI.ensureReady === "function") {
//         await window.Report500UI.ensureReady();
//       }
//     } catch (err) {
//       console.error("Report500 ensureReady error:", err);
//       Swal.fire({
//         icon: "error",
//         title: "โหลด Report500 ไม่สำเร็จ",
//         text: err?.message || "ไม่สามารถโหลดตัวเลือกของ Report500 ได้"
//       });
//     }
//   }
// }

// window.setActiveTab = setActiveTab;

// /** ==========================
//  *  Events
//  *  ========================== */
// function bindEvents() {
//   $("btnLogin")?.addEventListener("click", onLogin);

//   $("errorReason")?.addEventListener("change", onErrorReasonChange);
//   $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));

//   $("btnPreview")?.addEventListener("click", previewSummary);
//   $("btnSubmit")?.addEventListener("click", submitForm);

//   $("btnEmailCheckAll")?.addEventListener("click", () => setAllEmailChecks(true));
//   $("btnEmailClearAll")?.addEventListener("click", () => setAllEmailChecks(false));

//   $("loginPass")?.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") onLogin();
//   });

//   $("item")?.addEventListener("input", onItemInputLookup);
//   $("item")?.addEventListener("blur", onItemBlurLookup);

//   [
//     "employeeName",
//     "employeeCode",
//     "errorDate",
//     "shift",
//     "errorReason",
//     "errorReasonOther",
//     "errorDescription",
//     "item",
//     "errorCaseQty",
//     "confirmCauseOther",
//     "nationality"
//   ].forEach((id) => {
//     $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
//     $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
//   });
// }

// /** ==========================
//  *  Load options
//  *  ========================== */
// async function loadOptions() {
//   const res = await fetch(apiUrl("/options"), { method: "GET" });
//   const text = await res.text();

//   let json = {};
//   try {
//     json = JSON.parse(text);
//   } catch (_) {}

//   if (!res.ok || !json.ok) {
//     const msg = json && json.error ? json.error : `โหลดตัวเลือกไม่สำเร็จ (HTTP ${res.status})`;
//     throw new Error(msg);
//   }

//   OPTIONS = json.data || {
//     errorList: [],
//     auditList: [],
//     emailList: [],
//     osmList: [],
//     otmList: [],
//     confirmCauseList: [],
//     nationalityList: []
//   };
// }

// function fillFormDropdowns() {
//   const er = $("errorReason");
//   const audit = $("auditName");
//   const osm = $("osm");
//   const otm = $("otm");
//   const nationality = $("nationality");

//   if (er) {
//     er.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.errorList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
//   }

//   if (audit) {
//     audit.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.auditList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
//   }

//   if (osm) {
//     osm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.osmList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
//   }

//   if (otm) {
//     otm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.otmList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
//   }

//   if (nationality) {
//     nationality.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.nationalityList || []).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
//   }

//   syncErrorReasonOtherVisibility();
// }

// function buildWorkAgeOptions() {
//   const yearEl = $("workAgeYear");
//   const monthEl = $("workAgeMonth");

//   if (yearEl) {
//     yearEl.innerHTML =
//       `<option value="">-- ปี --</option>` +
//       Array.from({ length: 41 }, (_, i) => `<option value="${i}">${i}</option>`).join("");
//   }

//   if (monthEl) {
//     monthEl.innerHTML =
//       `<option value="">-- เดือน --</option>` +
//       Array.from({ length: 12 }, (_, i) => `<option value="${i}">${i}</option>`).join("");
//   }
// }

// function buildShiftOptions() {
//   const shift = $("shift");
//   if (!shift) return;

//   if (shift.options.length > 0) return;

//   shift.innerHTML = `
//     <option value="">-- เลือก --</option>
//     <option value="Day">Day</option>
//     <option value="Night">Night</option>
//     <option value="A">A</option>
//     <option value="B">B</option>
//     <option value="C">C</option>
//   `;
// }

// /** ==========================
//  *  Confirm Cause / Error Reason
//  *  ========================== */
// function syncErrorReasonOtherVisibility() {
//   const v = $("errorReason")?.value || "";
//   const wrap = $("errorReasonOtherWrap");
//   const input = $("errorReasonOther");

//   if (!wrap) return;

//   const show = v === "อื่นๆ";
//   wrap.classList.toggle("hidden", !show);

//   if (!show && input) {
//     input.value = "";
//   }
// }

// function syncConfirmCauseOtherVisibility() {
//   const wrap = $("confirmCauseOtherWrap");
//   const input = $("confirmCauseOther");
//   if (!wrap) return;

//   const checkedList = Array.from(document.querySelectorAll(".confirmCauseChk:checked"));

//   const show = checkedList.some((el) => {
//     const value = String(el.value || "").trim();
//     const requiresText =
//       String(el.dataset.requiresText || "").trim() === "1" ||
//       String(el.dataset.requirestext || "").trim() === "1";

//     return value === "อื่นๆ" || requiresText;
//   });

//   wrap.classList.toggle("hidden", !show);

//   if (!show && input) {
//     input.value = "";
//   }
// }

// function onErrorReasonChange() {
//   syncErrorReasonOtherVisibility();
//   renderConfirmCauseSelector();
//   syncConfirmCauseOtherVisibility();
//   updateEmployeeConfirmPreview();
// }

// function renderConfirmCauseSelector() {
//   const root = $("confirmCauseSelector");
//   if (!root) return;

//   const selectedBefore = getSelectedConfirmCauses();
//   const currentReason = String($("errorReason")?.value || "").trim();

//   const allItems = Array.isArray(OPTIONS.confirmCauseList) ? OPTIONS.confirmCauseList : [];
//   const filtered = allItems.filter((item) => {
//     const targets = Array.isArray(item.mainReasons) ? item.mainReasons : ["*"];
//     if (!targets.length || targets.includes("*")) return true;
//     return currentReason ? targets.includes(currentReason) : true;
//   });

//   if (!filtered.length) {
//     root.innerHTML = `<div class="confirmCauseEmpty">ไม่พบรายการสาเหตุประกอบในชีท Confirm_Cause</div>`;
//     syncConfirmCauseOtherVisibility();
//     return;
//   }

//   const groups = {};
//   filtered.forEach((item) => {
//     const g = item.group || "อื่นๆ";
//     if (!groups[g]) groups[g] = [];
//     groups[g].push(item);
//   });

//   root.innerHTML = Object.keys(groups).map((group) => {
//     const cards = groups[group].map((item) => {
//       const checked = selectedBefore.includes(item.text) ? "checked" : "";
//       const requiresText = item.requiresText ? "1" : "0";

//       return `
//         <label class="confirmCauseCard">
//           <input
//             type="checkbox"
//             class="confirmCauseChk"
//             value="${escapeHtml(item.text)}"
//             data-requires-text="${requiresText}"
//             ${checked}
//           >
//           <span class="confirmCauseMark"></span>
//           <span class="confirmCauseText">${escapeHtml(item.text)}</span>
//         </label>
//       `;
//     }).join("");

//     return `
//       <div class="confirmCauseGroup">
//         <div class="confirmCauseGroupTitle">${escapeHtml(group)}</div>
//         <div class="confirmCauseGrid">${cards}</div>
//       </div>
//     `;
//   }).join("");

//   root.querySelectorAll(".confirmCauseChk").forEach((chk) => {
//     chk.addEventListener("change", () => {
//       syncConfirmCauseOtherVisibility();
//       updateEmployeeConfirmPreview();
//     });
//   });

//   syncConfirmCauseOtherVisibility();
// }

// function getSelectedConfirmCauses() {
//   return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .map(el => String(el.value || "").trim())
//     .filter(Boolean);
// }

// function getSelectedConfirmCausesForNarrative() {
//   return getSelectedConfirmCauses().filter((v) => String(v || "").trim() !== "อื่นๆ");
// }

// function composeConfirmCauseSummary(selected, otherText) {
//   const list = (Array.isArray(selected) ? selected : [])
//     .filter(Boolean)
//     .map(v => String(v).trim())
//     .filter(v => v && v !== "อื่นๆ");

//   const other = String(otherText || "").trim();
//   const out = list.slice();
//   if (other) out.push("อื่นๆ: " + other);
//   return out.join(" | ");
// }

// /** ==========================
//  *  Email Selector
//  *  ========================== */
// function renderEmailSelector() {
//   const root = $("emailSelector");
//   if (!root) return;

//   const emails = Array.isArray(OPTIONS.emailList) ? OPTIONS.emailList : [];
//   if (!emails.length) {
//     root.innerHTML = `<div class="emailEmpty">ไม่พบรายการอีเมลในชีท Email</div>`;
//     return;
//   }

//   root.innerHTML = emails.map((email) => `
//     <label class="emailItem">
//       <input type="checkbox" class="emailChk" value="${escapeHtml(email)}">
//       <span class="emailCheckBox"></span>
//       <span class="emailText">${escapeHtml(email)}</span>
//     </label>
//   `).join("");
// }

// function getSelectedEmails() {
//   return Array.from(document.querySelectorAll(".emailChk:checked"))
//     .map(el => String(el.value || "").trim())
//     .filter(Boolean);
// }

// function setAllEmailChecks(flag) {
//   document.querySelectorAll(".emailChk").forEach(chk => {
//     chk.checked = !!flag;
//   });
// }

// /** ==========================
//  *  Login
//  *  ========================== */
// async function onLogin() {
//   safeSetLoginMsg("");
//   const pass = norm($("loginPass")?.value);

//   if (!pass) {
//     safeSetLoginMsg("กรุณากรอกรหัสผ่าน");
//     return;
//   }

//   let json;
//   try {
//     const res = await fetch(apiUrl("/auth"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ pass })
//     });

//     const text = await res.text();
//     try {
//       json = JSON.parse(text);
//     } catch (_) {
//       safeSetLoginMsg("Backend ตอบกลับไม่ใช่ JSON");
//       return;
//     }

//     if (!res.ok || !json.ok) {
//       safeSetLoginMsg(json?.error || "เข้าสู่ระบบไม่สำเร็จ");
//       return;
//     }
//   } catch (err) {
//     console.error("LOGIN FETCH ERROR:", err);
//     safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
//     return;
//   }

//   const lpsName = String(json.name || "").trim();
//   if (!lpsName) {
//     safeSetLoginMsg("ไม่พบชื่อผู้ใช้งานจากระบบ");
//     return;
//   }

//   AUTH = { name: lpsName, pass };
//   window.AUTH = AUTH;

//   setLpsFromLogin(lpsName);

//   if ($("rptReportedBy")) {
//     $("rptReportedBy").value = lpsName || "";
//   }

//   safeSetLoginMsg("");

//   try {
//     setActiveTab("error");
//   } catch (err) {
//     console.error("setActiveTab error:", err);
//   }

//   if (window.Report500UI && typeof window.Report500UI.ensureReady === "function") {
//     window.Report500UI.ensureReady().catch(err => {
//       console.error("Report500 preload failed:", err);
//     });
//   }
// }

// function setLpsFromLogin(lpsName) {
//   if ($("lps")) $("lps").value = lpsName || "";
//   if ($("topLoginUserName")) $("topLoginUserName").textContent = lpsName || "-";
//   $("topLoginUserWrap")?.classList.toggle("hidden", !lpsName);
// }

// /** ==========================
//  *  Basic sanitizers
//  *  ========================== */
// function numericOnly(el) {
//   if (!el) return;
//   el.addEventListener("input", () => {
//     el.value = String(el.value || "").replace(/[^\d]/g, "");
//   });
// }

// function alnumUpperOnly(el) {
//   if (!el) return;

//   const sanitize = () => {
//     const v = String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
//     if (el.value !== v) el.value = v;
//   };

//   el.addEventListener("input", sanitize);
//   el.addEventListener("paste", () => setTimeout(sanitize, 0));
//   el.addEventListener("blur", sanitize);
// }

// /** ==========================
//  *  ITEM LOOKUP
//  *  ========================== */
// function onItemInputLookup() {
//   const item = String($("item")?.value || "").replace(/[^\d]/g, "").trim();

//   if (itemLookupTimer) clearTimeout(itemLookupTimer);

//   if (!item) {
//     ITEM_LOOKUP_STATE = {
//       item: "",
//       description: "",
//       displayText: "",
//       found: false,
//       loading: false
//     };
//     renderItemLookupState(ITEM_LOOKUP_STATE);
//     updateEmployeeConfirmPreview();
//     return;
//   }

//   if (item.length < ITEM_LOOKUP_MIN_LEN) {
//     renderItemLookupState({
//       item,
//       description: "",
//       displayText: item,
//       found: false,
//       loading: false
//     });
//     updateEmployeeConfirmPreview();
//     return;
//   }

//   if (ITEM_LOCAL_CACHE.has(item)) {
//     const cached = ITEM_LOCAL_CACHE.get(item);
//     ITEM_LOOKUP_STATE = { ...cached, loading: false };
//     renderItemLookupState(ITEM_LOOKUP_STATE);
//     updateEmployeeConfirmPreview();
//     return;
//   }

//   renderItemLookupState({
//     item,
//     description: "",
//     displayText: item,
//     found: false,
//     loading: true
//   });

//   itemLookupTimer = setTimeout(() => {
//     lookupItemRealtime(item).catch((err) => {
//       console.error("lookupItemRealtime error:", err);

//       ITEM_LOOKUP_STATE = {
//         item,
//         description: ITEM_NOT_FOUND_TEXT,
//         displayText: `${item} | ${ITEM_NOT_FOUND_TEXT}`,
//         found: false,
//         loading: false
//       };

//       ITEM_LOCAL_CACHE.set(item, { ...ITEM_LOOKUP_STATE });
//       renderItemLookupState({ ...ITEM_LOOKUP_STATE, apiError: true });
//       updateEmployeeConfirmPreview();
//     });
//   }, ITEM_LOOKUP_DEBOUNCE_MS);
// }

// async function onItemBlurLookup() {
//   const item = String($("item")?.value || "").replace(/[^\d]/g, "").trim();
//   if (!item) return;

//   if (ITEM_LOCAL_CACHE.has(item)) {
//     const cached = ITEM_LOCAL_CACHE.get(item);
//     ITEM_LOOKUP_STATE = { ...cached, loading: false };
//     renderItemLookupState(ITEM_LOOKUP_STATE);
//     updateEmployeeConfirmPreview();
//     return;
//   }

//   await lookupItemRealtime(item, true).catch(() => {});
// }

// async function lookupItemRealtime(item, immediate = false) {
//   const clean = String(item || "").replace(/[^\d]/g, "").trim();
//   if (!clean) return;

//   if (!immediate && ITEM_LOOKUP_STATE.item === clean && ITEM_LOOKUP_STATE.description) {
//     return;
//   }

//   if (ITEM_LOCAL_CACHE.has(clean)) {
//     const cached = ITEM_LOCAL_CACHE.get(clean);
//     ITEM_LOOKUP_STATE = { ...cached, loading: false };
//     renderItemLookupState(ITEM_LOOKUP_STATE);
//     updateEmployeeConfirmPreview();
//     return;
//   }

//   renderItemLookupState({
//     item: clean,
//     description: "",
//     displayText: clean,
//     found: false,
//     loading: true
//   });

//   const url = apiUrl(`/itemLookup?item=${encodeURIComponent(clean)}`);
//   const res = await fetch(url, { method: "GET" });
//   const text = await res.text();

//   let json = {};
//   try {
//     json = JSON.parse(text);
//   } catch (_) {
//     throw new Error("Backend itemLookup ตอบกลับไม่ใช่ JSON");
//   }

//   if (!res.ok || !json.ok) {
//     throw new Error(json.error || `itemLookup HTTP ${res.status}`);
//   }

//   ITEM_LOOKUP_STATE = {
//     item: json.item || clean,
//     description: json.description || ITEM_NOT_FOUND_TEXT,
//     displayText: json.displayText || `${clean} | ${ITEM_NOT_FOUND_TEXT}`,
//     found: !!json.found,
//     loading: false
//   };

//   ITEM_LOCAL_CACHE.set(clean, { ...ITEM_LOOKUP_STATE });
//   renderItemLookupState(ITEM_LOOKUP_STATE);
//   updateEmployeeConfirmPreview();
// }

// function renderItemLookupState(state) {
//   const hint = $("itemLookupHint");
//   const display = $("itemDisplay");
//   if (!hint && !display) return;

//   const item = String(state?.item || "").trim();
//   const desc = String(state?.description || "").trim();
//   const displayText = String(state?.displayText || "").trim();
//   const loading = !!state?.loading;
//   const found = !!state?.found;
//   const apiError = !!state?.apiError;

//   if (!item) {
//     if (hint) hint.textContent = "";
//     if (display) display.value = "";
//     return;
//   }

//   if (loading) {
//     if (hint) hint.textContent = `กำลังค้นหา Item ${item} ...`;
//     if (display) display.value = item;
//     return;
//   }

//   if (found && desc && desc !== ITEM_NOT_FOUND_TEXT) {
//     if (hint) hint.textContent = "พบข้อมูลสินค้า";
//     if (display) display.value = displayText || `${item} | ${desc}`;
//     return;
//   }

//   if (hint) {
//     hint.textContent = apiError
//       ? "เชื่อมต่อค้นหาสินค้าไม่ได้ หรือไม่พบข้อมูล"
//       : "ไม่พบข้อมูลสินค้า";
//   }
//   if (display) {
//     display.value = displayText || `${item} | ${ITEM_NOT_FOUND_TEXT}`;
//   }
// }

// function getItemDisplayText() {
//   if (ITEM_LOOKUP_STATE && ITEM_LOOKUP_STATE.displayText) {
//     return ITEM_LOOKUP_STATE.displayText;
//   }
//   return ($("itemDisplay")?.value || $("item")?.value || "").trim();
// }

// /** ==========================
//  *  Upload fields
//  *  ========================== */
// function buildInitialUploadFields() {
//   const list = $("uploadList");
//   if (!list) return;

//   list.innerHTML = "";
//   addUploadField("บัตรพนักงาน", { removable: false });
//   addUploadField("รูปพนักงาน", { removable: false });
// }

// function addUploadField(label, opts = {}) {
//   const { removable = true } = opts;

//   const list = $("uploadList");
//   if (!list) return;

//   const id = "file_" + Math.random().toString(16).slice(2);
//   const box = document.createElement("div");
//   box.className = "uploadBox";

//   box.innerHTML = `
//     <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
//       <div class="cap">${escapeHtml(label)}</div>
//       <div style="display:flex;gap:8px;align-items:center">
//         <button type="button" class="btn ghost btnEditImage" style="padding:6px 10px;border-radius:999px">แก้ไขภาพ</button>
//         ${removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${id}">ลบ</button>` : ``}
//       </div>
//     </div>
//     <input type="file" accept="image/*" id="${id}">
//     <img class="previewImg" id="${id}_img" alt="" style="display:block;max-width:100%;max-height:220px;border-radius:12px;border:1px solid #d9e4f1;padding:4px;margin-top:8px;">
//     <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
//   `;

//   list.appendChild(box);

//   if (removable) {
//     const btn = box.querySelector(`[data-remove="${id}"]`);
//     btn?.addEventListener("click", () => {
//       const input = $(id);
//       const img = $(`${id}_img`);

//       if (img && img.dataset.objectUrl) {
//         try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       }

//       if (input) {
//         EDITED_UPLOAD_STORE.delete(input);
//       }

//       box.remove();
//     });
//   }

//   const fileInput = $(id);
//   const img = $(`${id}_img`);
//   const txt = $(`${id}_txt`);
//   const btnEdit = box.querySelector(".btnEditImage");

//   btnEdit?.addEventListener("click", async () => {
//     if (!fileInput) return;

//     const edited = EDITED_UPLOAD_STORE.get(fileInput)?.file || null;
//     const raw = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
//     const sourceFile = edited || raw;

//     if (!sourceFile) {
//       await Swal.fire({
//         icon: "info",
//         title: "ยังไม่มีรูปภาพ",
//         text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
//       });
//       return;
//     }

//     await openEditorForUploadInput(fileInput, box);
//   });

//   fileInput?.addEventListener("change", async () => {
//     const f = fileInput.files && fileInput.files[0];

//     EDITED_UPLOAD_STORE.delete(fileInput);

//     if (!f) {
//       if (txt) txt.textContent = "ยังไม่เลือกรูป";
//       if (img) {
//         if (img.dataset.objectUrl) {
//           try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//         }
//         img.removeAttribute("src");
//         img.dataset.objectUrl = "";
//       }
//       return;
//     }

//     if (!/^image\//.test(f.type)) {
//       fileInput.value = "";
//       if (txt) txt.textContent = "ไฟล์ไม่ถูกต้อง (ต้องเป็นรูปภาพเท่านั้น)";
//       if (img) img.removeAttribute("src");
//       await Swal.fire({
//         icon: "warning",
//         title: "ไฟล์ไม่ถูกต้อง",
//         text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
//       });
//       return;
//     }

//     if (txt) txt.textContent = `ไฟล์: ${f.name} (${Math.round(f.size / 1024)} KB)`;

//     if (img) {
//       if (img.dataset.objectUrl) {
//         try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       }
//       const url = URL.createObjectURL(f);
//       img.src = url;
//       img.dataset.objectUrl = url;
//     }

//     await handlePickedImageForUpload(fileInput, box);
//   });
// }

// /** ==========================
//  *  Payload
//  *  ========================== */
// function collectPayloadBase() {
//   return {
//     refNo: getRefNoValue(),
//     labelCid: norm($("labelCid")?.value),
//     errorReason: norm($("errorReason")?.value),
//     errorReasonOther: norm($("errorReasonOther")?.value),
//     errorDescription: norm($("errorDescription")?.value),
//     errorDate: norm($("errorDate")?.value),
//     item: norm($("item")?.value),
//     itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
//     itemDisplay: ITEM_LOOKUP_STATE.displayText || "",
//     errorCaseQty: norm($("errorCaseQty")?.value),
//     employeeName: norm($("employeeName")?.value),
//     employeeCode: norm($("employeeCode")?.value),
//     workAgeYear: norm($("workAgeYear")?.value),
//     workAgeMonth: norm($("workAgeMonth")?.value),
//     nationality: norm($("nationality")?.value),
//     shift: norm($("shift")?.value),
//     osm: norm($("osm")?.value),
//     otm: norm($("otm")?.value),
//     interpreterName: norm($("interpreterName")?.value),
//     auditName: norm($("auditName")?.value),
//     emailRecipients: getSelectedEmails()
//   };
// }

// function buildEmployeeConfirmText(payload) {
//   const employeeName = String(payload.employeeName || "").trim() || "-";
//   const employeeCode = String(payload.employeeCode || "").trim() || "-";
//   const errorDate = formatDateToDisplay(payload.errorDate) || "-";
//   const shift = String(payload.shift || "").trim() || "-";
//   const refNo = String(payload.refNo || "").trim() || "-";
//   const errorReason = String(payload.errorReason || "").trim() || "-";

//   const itemDisplayRaw = String(
//     payload.itemDisplay ||
//     ITEM_LOOKUP_STATE.displayText ||
//     getItemDisplayText() ||
//     ""
//   ).trim();

//   const itemDisplay = itemDisplayRaw || "ยังไม่พบรายละเอียดสินค้า";
//   const errorCaseQty = String(payload.errorCaseQty || "").trim() || "-";

//   const selected = Array.isArray(payload.confirmCauseSelected)
//     ? payload.confirmCauseSelected
//         .filter(Boolean)
//         .map(v => String(v).trim())
//         .filter(v => v && v !== "อื่นๆ")
//     : [];

//   const other = String(payload.confirmCauseOther || "").trim();

//   const lines = [];
//   selected.forEach((t, i) => lines.push(`${i + 1}) ${t}`));
//   if (other) lines.push(`${lines.length + 1}) ${other}`);

//   const factText = lines.length
//     ? lines.join("\n")
//     : "1) ข้าพเจ้ายืนยันว่ารับทราบข้อเท็จจริงตามเอกสารฉบับนี้";

//   return [
//     `ข้าพเจ้า ${employeeName} รหัสพนักงาน ${employeeCode} ปฏิบัติงานวันที่ ${errorDate} ในกะ ${shift} ขอรับรองว่าได้รับทราบรายละเอียดการเบิกสินค้า Error ตามเอกสารเลขที่อ้างอิง ${refNo} แล้ว`,
//     `โดยมีสาเหตุหลักคือ ${errorReason} รายการสินค้า ${itemDisplay} และจำนวนที่เกิดข้อผิดพลาด ${errorCaseQty} เคส`,
//     `ข้าพเจ้าขอยืนยันข้อเท็จจริงดังต่อไปนี้`,
//     factText,
//     `ข้าพเจ้าขอรับรองว่าข้อความดังกล่าวเป็นข้อมูลตามที่ได้ชี้แจงไว้จริง และยินยอมให้ใช้เอกสารฉบับนี้เป็นหลักฐานประกอบการตรวจสอบภายใน และการดำเนินการตามระเบียบของบริษัทต่อไป`
//   ].join("\n");
// }

// function updateEmployeeConfirmPreview() {
//   const preview = $("employeeConfirmText");
//   if (!preview) return;

//   const p = collectPayloadBase();
//   p.confirmCauseSelected = getSelectedConfirmCausesForNarrative();
//   p.confirmCauseOther = norm($("confirmCauseOther")?.value);
//   p.errorDate = formatDateToDisplay(p.errorDate);
//   p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
//   p.employeeConfirmText = buildEmployeeConfirmText(p);

//   preview.value = p.employeeConfirmText;
// }

// function collectPayload() {
//   const p = collectPayloadBase();
//   p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
//   p.confirmCauseSelected = getSelectedConfirmCauses();
//   p.confirmCauseOther = norm($("confirmCauseOther")?.value);
//   p.employeeConfirmText = buildEmployeeConfirmText({
//     ...p,
//     confirmCauseSelected: getSelectedConfirmCausesForNarrative(),
//     confirmCauseOther: p.confirmCauseOther,
//     itemDisplay: p.itemDisplay
//   });
//   return p;
// }

// function validatePayload(p) {
//   const required = [
//     ["refNo", "Ref:No."],
//     ["labelCid", "Label CID"],
//     ["errorReason", "สาเหตุ Error"],
//     ["item", "Item"],
//     ["errorCaseQty", "จำนวน ErrorCase"],
//     ["employeeName", "ชื่อ-สกุลพนักงาน"],
//     ["employeeCode", "รหัสพนักงาน"],
//     ["errorDate", "วันที่เบิกสินค้า Error"],
//     ["shift", "กะ"],
//     ["workAgeYear", "อายุงาน (ปี)"],
//     ["workAgeMonth", "อายุงาน (เดือน)"],
//     ["nationality", "สัญชาติ"],
//     ["osm", "OSM"],
//     ["otm", "OTM"],
//     ["auditName", "พนง. AUDIT"]
//   ];

//   for (const [k, n] of required) {
//     if (!String(p[k] || "").trim()) return `กรุณากรอก ${n}`;
//   }

//   if (!Array.isArray(p.confirmCauseSelected) || !p.confirmCauseSelected.length) {
//     return "กรุณาเลือกข้อเท็จจริง/สาเหตุประกอบอย่างน้อย 1 รายการ";
//   }

//   const refRunning = String($("refNo")?.value || "").trim();
//   if (!/^\d+$/.test(refRunning)) return "กรุณากรอกเลข Ref เป็นตัวเลขเท่านั้น";
//   if (!/^\d+-\d{4}$/.test(p.refNo)) return "Ref:No. ไม่ถูกต้อง";

//   if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) {
//     return "กรุณาระบุสาเหตุ (อื่นๆ)";
//   }

//   if (p.confirmCauseSelected.includes("อื่นๆ") && !p.confirmCauseOther.trim()) {
//     return "กรุณาระบุข้อเท็จจริงเพิ่มเติมในหัวข้อ อื่นๆ";
//   }

//   if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^[A-Z0-9]+$/.test(p.employeeCode)) return "รหัสพนักงานต้องเป็น A-Z หรือ/และ 0-9 เท่านั้น";
//   if (!/^\d+$/.test(p.workAgeYear)) return "อายุงาน (ปี) ต้องเป็นตัวเลข";
//   if (!/^\d+$/.test(p.workAgeMonth)) return "อายุงาน (เดือน) ต้องเป็นตัวเลข";
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(p.errorDate)) return "รูปแบบวันที่เบิกสินค้าไม่ถูกต้อง";

//   return "";
// }

// /** ==========================
//  *  Preview
//  *  ========================== */
// async function previewSummary() {
//   const p = collectPayload();
//   const err = validatePayload(p);

//   if (err) {
//     return Swal.fire({
//       icon: "warning",
//       title: "ข้อมูลไม่ครบ",
//       text: err,
//       confirmButtonText: "ตกลง"
//     });
//   }

//   const fileCount = countSelectedFiles();
//   const emails = Array.isArray(p.emailRecipients) ? p.emailRecipients : [];
//   const causeSummary = composeConfirmCauseSummary(p.confirmCauseSelected, p.confirmCauseOther);

//   await Swal.fire({
//     title: "ตรวจสอบก่อนบันทึก",
//     html: `
//       <div class="swalSummary">
//         <div class="swalHero">
//           <div class="swalHeroTitle">สรุปข้อมูลก่อนบันทึก</div>
//           <div class="swalHeroSub">กรุณาตรวจสอบข้อมูลสำคัญให้ครบถ้วนก่อนดำเนินการ</div>
//           <div class="swalPillRow">
//             <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
//             <div class="swalPill">รูป ${fileCount} รูป</div>
//             <div class="swalPill">Email ${emails.length} รายการ</div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">Ref:No.</div>
//               <div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">Label CID</div>
//               <div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">วันที่เบิกสินค้า Error</div>
//               <div class="swalKvValue">${escapeHtml(formatDateToDisplay(p.errorDate) || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">กะ</div>
//               <div class="swalKvValue">${escapeHtml(p.shift || "-")}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลเหตุการณ์</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">สาเหตุ Error</div>
//               <div class="swalKvValue">${escapeHtml(
//                 p.errorReason === "อื่นๆ"
//                   ? ("อื่นๆ: " + (p.errorReasonOther || ""))
//                   : (p.errorReason || "-")
//               )}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">Item</div>
//               <div class="swalKvValue">${escapeHtml(getItemDisplayText() || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">จำนวน ErrorCase</div>
//               <div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลพนักงาน / ผู้เกี่ยวข้อง</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">ชื่อพนักงาน</div>
//               <div class="swalKvValue">${escapeHtml(p.employeeName || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">รหัสพนักงาน</div>
//               <div class="swalKvValue">${escapeHtml(p.employeeCode || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">อายุงาน</div>
//               <div class="swalKvValue">${escapeHtml(`${p.workAgeYear} ปี ${p.workAgeMonth} เดือน`)}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">สัญชาติ</div>
//               <div class="swalKvValue">${escapeHtml(p.nationality || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">OSM</div>
//               <div class="swalKvValue">${escapeHtml(p.osm || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">OTM</div>
//               <div class="swalKvValue">${escapeHtml(p.otm || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">ล่ามแปลภาษา</div>
//               <div class="swalKvValue">${escapeHtml(p.interpreterName || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">AUDIT</div>
//               <div class="swalKvValue">${escapeHtml(p.auditName || "-")}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อเท็จจริงที่พนักงานยืนยัน</div>
//           <div class="swalDesc">
//             <div class="swalDescLabel">รายการที่เลือก</div>
//             <div class="swalDescValue">${escapeHtml(causeSummary || "-").replaceAll("|", "<br>")}</div>
//           </div>

//           <div class="swalDesc" style="margin-top:8px;">
//             <div class="swalDescLabel">คำยืนยันของพนักงาน</div>
//             <div class="swalDescValue">${escapeHtml(p.employeeConfirmText || "-").replaceAll("\n", "<br>")}</div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ผู้รับอีเมล</div>
//           ${
//             emails.length
//               ? `
//                 <div class="swalEmailOk" style="margin-bottom:8px;">
//                   มีการเลือกผู้รับอีเมล ${emails.length} รายการ
//                 </div>
//                 <div class="swalEmailList">
//                   ${emails.map(e => `<div class="swalEmailChip">${escapeHtml(e)}</div>`).join("")}
//                 </div>
//               `
//               : `<div class="swalNote">ยังไม่ได้เลือกอีเมล ระบบจะบันทึกข้อมูลและสร้าง PDF อย่างเดียว</div>`
//           }
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ไฟล์แนบ</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">จำนวนรูปที่เลือก</div>
//               <div class="swalKvValue">${fileCount} รูป</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">สถานะการสร้างเอกสาร</div>
//               <div class="swalKvValue">ระบบจะสร้าง PDF หลังบันทึกสำเร็จ</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     `,
//     confirmButtonText: "ตกลง",
//     confirmButtonColor: "#2563eb",
//     width: 920
//   });
// }

// function countSelectedFiles() {
//   const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
//   return inputs.reduce((acc, el) => {
//     const edited = EDITED_UPLOAD_STORE.get(el)?.file || null;
//     const raw = el.files && el.files[0] ? el.files[0] : null;
//     return acc + ((edited || raw) ? 1 : 0);
//   }, 0);
// }
// /** ==========================
//  *  Submit
//  *  ========================== */
// async function submitForm() {
//   const p = collectPayload();
//   const err = validatePayload(p);

//   if (err) {
//     return Swal.fire({
//       icon: "warning",
//       title: "ข้อมูลไม่ครบ",
//       text: err,
//       confirmButtonText: "ตกลง"
//     });
//   }

//   let files = [];
//   try {
//     files = await collectFilesAsBase64({ maxFiles: 6, maxMBEach: 4 });
//   } catch (fileErr) {
//     console.error(fileErr);
//     return;
//   }

//   const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
//   if (!signRes.ok) {
//     return;
//   }

//   const body = {
//     pass: AUTH.pass,
//     payload: p,
//     files,
//     signatures: {
//       supervisorBase64: signRes.supervisorBase64 || "",
//       employeeBase64: signRes.employeeBase64 || "",
//       interpreterBase64: signRes.interpreterBase64 || ""
//     }
//   };

//   ProgressUI.show(
//     "กำลังบันทึก Error_BOL",
//     "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล"
//   );

//   try {
//     ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
//     await safeDelay(140);
//     ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

//     ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
//     await safeDelay(180);
//     ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${files.length} รูป + ลายเซ็น)`);

//     ProgressUI.activateOnly("save", 56, "กำลังบันทึกข้อมูลลงระบบ");

//     const res = await fetch(apiUrl("/submit"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body)
//     });

//     const text = await res.text();
//     let json = {};

//     try {
//       json = JSON.parse(text);
//     } catch (_) {
//       throw new Error("Backend ตอบกลับไม่ใช่ JSON");
//     }

//     if (!res.ok || !json.ok) {
//       throw new Error(json?.error || `บันทึกข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
//     }

//     ProgressUI.markDone("save", 72, "บันทึกข้อมูลลงระบบเรียบร้อย");

//     ProgressUI.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF");
//     await safeDelay(180);

//     const pdfOk = !!(json.pdfFileId || json.pdfUrl);
//     if (pdfOk) {
//       const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
//       ProgressUI.markDone("pdf", 94, `สร้างไฟล์ PDF เรียบร้อย${sizeText}`);
//     } else {
//       ProgressUI.markError("pdf", "ไม่สามารถสร้าง PDF ได้", 94);
//     }

//     ProgressUI.activateOnly("email", 98, "กำลังตรวจสอบผลการส่งอีเมล");
//     await safeDelay(140);

//     const emailInfo = buildEmailStatusSummary_(json);

//     if (emailInfo.emailOk) {
//       ProgressUI.markDone("email", 100, emailInfo.emailModeText, emailInfo.emailModeText);
//       ProgressUI.success("บันทึกสำเร็จ", "ข้อมูล Error_BOL ถูกบันทึกเรียบร้อยแล้ว");
//     } else if (emailInfo.emailSkipped) {
//       ProgressUI.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
//       ProgressUI.success("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
//     } else {
//       ProgressUI.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
//       ProgressUI.success("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
//       ProgressUI.setHint(emailInfo.emailStatus || "กรุณาตรวจสอบสิทธิ์อีเมลหรือขนาดไฟล์แนบ");
//     }

//     const galleryHtml = renderGalleryHtml(json.imageIds || []);
//     const pdfSizeText = String(json.pdfSizeText || "-");

//     const supSignThumb = signRes.supervisorBase64
//       ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
//       : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//     const empSignThumb = signRes.employeeBase64
//       ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
//       : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//     const intSignThumb = signRes.interpreterBase64
//       ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
//       : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//     ProgressUI.hide(120);

// await Swal.fire({
//   icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
//   title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
//   showConfirmButton: false,
//   width: 920,
//   html: `
//     <div class="swalSummary">
//       <div class="swalHero">
//         <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
//         <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ ลายเซ็น และเอกสาร PDF เรียบร้อย</div>
//         <div class="swalPillRow">
//           <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
//           <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
//           <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
//         <div class="swalKvGrid">
//           <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
//           <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div></div>
//           <div class="swalKv"><div class="swalKvLabel">Label CID</div><div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div></div>
//           <div class="swalKv"><div class="swalKvLabel">ขนาด PDF</div><div class="swalKvValue">${escapeHtml(pdfSizeText)}</div></div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">สถานะอีเมล</div>
//         ${
//           emailInfo.emailSkipped
//             ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
//             : emailInfo.emailOk
//               ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailInfo.emailResult.count || 0)} รายการ ${emailInfo.emailResult.attachmentMode ? `• ${escapeHtml(emailInfo.emailResult.attachmentMode)}` : ""}</div>`
//               : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailResult.error || "-")}</div>`
//         }
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ลายเซ็น</div>
//         <div class="sigGrid">
//           <div>
//             <div class="sigBoxTitle">หัวหน้างาน</div>
//             ${supSignThumb}
//             <div class="sigName">${escapeHtml(p.otm || "-")}</div>
//           </div>
//           <div>
//             <div class="sigBoxTitle">พนักงาน</div>
//             ${empSignThumb}
//             <div class="sigName">${escapeHtml(p.employeeName || "-")}</div>
//           </div>
//           <div>
//             <div class="sigBoxTitle">ล่ามแปลภาษา</div>
//             ${intSignThumb}
//             <div class="sigName">${escapeHtml(p.interpreterName || "-")}</div>
//           </div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">รูปภาพแนบ</div>
//         ${galleryHtml || `<div class="swalNote">ไม่มีรูปภาพแนบ</div>`}
//       </div>

//       <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
//         ${
//           json.pdfUrl
//             ? `<button type="button" id="btnOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
//             : ``
//         }
//         <button type="button" id="btnCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
//       </div>
//     </div>
//   `,
//   didOpen: () => {
//     bindGalleryClickInSwal();

//     const btnOpen = document.getElementById("btnOpenPdfAfterSave");
//     const btnClose = document.getElementById("btnCloseAfterSave");

//     if (btnOpen && json.pdfUrl) {
//       btnOpen.addEventListener("click", () => {
//        window.open(json.pdfUrl, "_blank", "noopener,noreferrer");
// Swal.close();
//       });
//     }

//     if (btnClose) {
//       btnClose.addEventListener("click", () => {
//         Swal.close();
//       });
//     }
//   },
//   willClose: () => {
//     resetForm();
//   }
// });

// } catch (err2) {
//   console.error(err2);
//   ProgressUI.markError("save", err2?.message || "เกิดข้อผิดพลาด", 58);
//   ProgressUI.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

//   await Swal.fire({
//     icon: "error",
//     title: "บันทึกไม่สำเร็จ",
//     text: err2?.message || String(err2),
//     confirmButtonText: "ตกลง"
//   });

//   ProgressUI.hide(180);
// }
// }

// async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
//   const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
//   const picked = [];

//   for (const el of inputs) {
//     const edited = EDITED_UPLOAD_STORE.get(el)?.file || null;
//     const raw = el.files && el.files[0] ? el.files[0] : null;
//     const f = edited || raw;
//     if (f) picked.push(f);
//   }

//   if (picked.length > maxFiles) {
//     await Swal.fire({
//       icon: "warning",
//       title: "รูปเยอะเกินไป",
//       text: `เลือกได้สูงสุด ${maxFiles} รูป (ตอนนี้เลือก ${picked.length})`
//     });
//     throw new Error("Too many files");
//   }

//   const out = [];
//   for (const f of picked) {
//     if (!/^image\//.test(f.type)) {
//       await Swal.fire({
//         icon: "warning",
//         title: "ไฟล์ไม่ถูกต้อง",
//         text: `ไฟล์ "${f.name}" ต้องเป็นรูปภาพเท่านั้น`
//       });
//       throw new Error("Invalid file type");
//     }

//     const mb = f.size / (1024 * 1024);
//     if (mb > maxMBEach) {
//       await Swal.fire({
//         icon: "warning",
//         title: "ไฟล์ใหญ่เกินไป",
//         text: `ไฟล์ "${f.name}" มีขนาด ${mb.toFixed(1)} MB (กำหนดไว้ไม่เกิน ${maxMBEach} MB)`
//       });
//       throw new Error("File too large");
//     }

//     const base64 = await fileToBase64(f);
//     out.push({ filename: f.name, base64 });
//   }

//   return out;
// }

// function fileToBase64(file) {
//   return new Promise((resolve, reject) => {
//     const r = new FileReader();
//     r.onload = () => {
//       const result = String(r.result || "");
//       const base64 = result.includes(",") ? result.split(",")[1] : result;
//       resolve(base64);
//     };
//     r.onerror = reject;
//     r.readAsDataURL(file);
//   });
// }

// /** ==========================
//  *  Signature Flow
//  *  ========================== */
// async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
//   const sup = await signatureModal("ลายเซ็นหัวหน้างาน", `ผู้เซ็น: ${supervisorName || "-"}`);
//   if (!sup.ok) return { ok: false };

//   const emp = await signatureModal("ลายเซ็นพนักงานที่เบิกสินค้า Error", `ผู้เซ็น: ${employeeName || "-"}`);
//   if (!emp.ok) return { ok: false };

//   const hasInterpreter = String(interpreterName || "").trim().length > 0;
//   if (!hasInterpreter) {
//     return {
//       ok: true,
//       supervisorBase64: sup.base64,
//       employeeBase64: emp.base64,
//       interpreterBase64: ""
//     };
//   }

//   const intr = await signatureModal("ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${interpreterName || "-"}`);
//   if (!intr.ok) return { ok: false };

//   return {
//     ok: true,
//     supervisorBase64: sup.base64,
//     employeeBase64: emp.base64,
//     interpreterBase64: intr.base64
//   };
// }

// async function signatureModal(title, subtitle) {
//   const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
//   const clearId = "sigClear_" + Math.random().toString(16).slice(2);

//   const res = await Swal.fire({
//     title,
//     html: `
//       <div style="text-align:left">
//         <div style="font-size:13px;color:#64748b;font-weight:700;margin-bottom:10px">${escapeHtml(subtitle || "")}</div>
//         <div style="border:1px solid #d7e4f3;border-radius:18px;padding:10px;background:#fff">
//           <canvas id="${canvasId}" class="sigCanvasElmLarge" width="900" height="320"></canvas>
//         </div>
//         <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
//           <div style="font-size:12px;color:#64748b">กรุณาเซ็นในช่องด้านบน</div>
//           <button id="${clearId}" type="button" class="btn ghost sigBtn">ล้างลายเซ็น</button>
//         </div>
//       </div>
//     `,
//     width: 900,
//     showCancelButton: true,
//     confirmButtonText: "ยืนยันลายเซ็น",
//     cancelButtonText: "ยกเลิก",
//     didOpen: () => {
//       const canvas = document.getElementById(canvasId);
//       const btnClear = document.getElementById(clearId);

//       enableSignature(canvas);

//       btnClear?.addEventListener("click", () => {
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//       });
//     },
//     preConfirm: () => {
//       const canvas = document.getElementById(canvasId);
//       const isEmpty = isCanvasBlank(canvas);

//       if (isEmpty) {
//         Swal.showValidationMessage("กรุณาเซ็นชื่อก่อนกดยืนยัน");
//         return false;
//       }

//       return canvas.toDataURL("image/png");
//     }
//   });

//   if (!res.isConfirmed) return { ok: false };
//   return { ok: true, base64: res.value };
// }

// function enableSignature(canvas) {
//   if (!canvas) return;
//   const ctx = canvas.getContext("2d");

//   ctx.lineWidth = 2.8;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";
//   ctx.strokeStyle = "#1d4ed8";

//   let drawing = false;
//   let last = null;

//   const getPos = (e) => {
//     const rect = canvas.getBoundingClientRect();
//     const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
//     return {
//       x: (t.clientX - rect.left) * (canvas.width / rect.width),
//       y: (t.clientY - rect.top) * (canvas.height / rect.height)
//     };
//   };

//   const down = (e) => {
//     drawing = true;
//     last = getPos(e);
//     e.preventDefault();
//   };

//   const move = (e) => {
//     if (!drawing) return;
//     const p = getPos(e);
//     ctx.beginPath();
//     ctx.moveTo(last.x, last.y);
//     ctx.lineTo(p.x, p.y);
//     ctx.stroke();
//     last = p;
//     e.preventDefault();
//   };

//   const up = (e) => {
//     drawing = false;
//     last = null;
//     e.preventDefault();
//   };

//   canvas.addEventListener("mousedown", down);
//   canvas.addEventListener("mousemove", move);
//   window.addEventListener("mouseup", up);

//   canvas.addEventListener("touchstart", down, { passive: false });
//   canvas.addEventListener("touchmove", move, { passive: false });
//   canvas.addEventListener("touchend", up, { passive: false });
// }

// function isCanvasBlank(canvas) {
//   if (!canvas) return true;
//   const ctx = canvas.getContext("2d");
//   const { width, height } = canvas;
//   const data = ctx.getImageData(0, 0, width, height).data;

//   for (let i = 3; i < data.length; i += 4) {
//     if (data[i] !== 0) return false;
//   }
//   return true;
// }

// /** ==========================
//  *  Reset / helpers
//  *  ========================== */
// function resetForm() {
//   const ids = [
//     "refNo",
//     "labelCid",
//     "errorReasonOther",
//     "errorDescription",
//     "item",
//     "itemDisplay",
//     "errorCaseQty",
//     "employeeName",
//     "errorDate",
//     "employeeCode",
//     "interpreterName",
//     "confirmCauseOther"
//   ];

//   ids.forEach((id) => {
//     const el = $(id);
//     if (el) el.value = "";
//   });

//   ["errorReason", "auditName", "shift", "osm", "otm", "workAgeYear", "workAgeMonth", "nationality"].forEach((id) => {
//     const el = $(id);
//     if (el) el.value = "";
//   });

//   document.querySelectorAll(".confirmCauseChk, .emailChk").forEach((el) => {
//     el.checked = false;
//   });

//   ITEM_LOOKUP_STATE = {
//     item: "",
//     description: "",
//     displayText: "",
//     found: false,
//     loading: false
//   };

//   renderItemLookupState(ITEM_LOOKUP_STATE);
//   buildInitialUploadFields();
//   syncErrorReasonOtherVisibility();
//   syncConfirmCauseOtherVisibility();
//   updateEmployeeConfirmPreview();

//   if ($("lps")) $("lps").value = AUTH.name || "";
// }

// function buildResultActionButtons_(pdfUrl) {
//   const hasPdf = !!String(pdfUrl || "").trim();

//   return `
//     <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
//       ${
//         hasPdf
//           ? `<button type="button" id="btnOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
//           : ``
//       }
//       <button type="button" id="btnCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
//     </div>
//   `;
// }

// function bindResultActionButtons_(pdfUrl) {
//   const btnOpen = document.getElementById("btnOpenPdfAfterSave");
//   const btnClose = document.getElementById("btnCloseAfterSave");

//   if (btnOpen && pdfUrl) {
//     btnOpen.addEventListener("click", () => {
//       window.open(pdfUrl, "_blank", "noopener,noreferrer");
//     });
//   }

//   if (btnClose) {
//     btnClose.addEventListener("click", () => {
//       Swal.close();
//     });
//   }
// }


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

let FORM_MODE = "create"; // create | edit | recover_draft
let CURRENT_RECORD_ID = "";
let CURRENT_PARENT_RECORD_ID = "";
let CURRENT_REVISION_NO = 0;
let CURRENT_BASE_RECORD_ID = "";
let CURRENT_BASE_REVISION_NO = 0;
let CURRENT_SOURCE_ROW_INDEX = 0;

let EXISTING_IMAGES = [];
let KEEP_IMAGE_IDS = [];
let DELETE_IMAGE_IDS = [];

let SIGNATURE_STATE = {
  supervisor: {
    mode: "keep", // keep | replace | remove
    existingFileId: "",
    existingUrl: "",
    existingName: "",
    newBase64: ""
  },
  employee: {
    mode: "keep",
    existingFileId: "",
    existingUrl: "",
    existingName: "",
    newBase64: ""
  },
  interpreter: {
    mode: "keep",
    existingFileId: "",
    existingUrl: "",
    existingName: "",
    newBase64: ""
  }
};

const ITEM_LOCAL_CACHE = new Map();
let itemLookupTimer = null;
const EDITED_UPLOAD_STORE = new WeakMap();

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

function escapeHtmlWithBr(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  (Array.isArray(arr) ? arr : []).forEach((v) => {
    const s = String(v || "").trim();
    if (!s) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  });
  return out;
}

function splitEmails(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toArraySafeJson(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
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

function thaiDateDisplayToIso(s) {
  const m = String(s || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return String(s || "").trim();
  return `${m[3]}-${m[2]}-${m[1]}`;
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
 *  MODE / EDIT STATE
 *  ========================== */
function resetEditState_() {
  FORM_MODE = "create";
  CURRENT_RECORD_ID = "";
  CURRENT_PARENT_RECORD_ID = "";
  CURRENT_REVISION_NO = 0;
  CURRENT_BASE_RECORD_ID = "";
  CURRENT_BASE_REVISION_NO = 0;
  CURRENT_SOURCE_ROW_INDEX = 0;

  EXISTING_IMAGES = [];
  KEEP_IMAGE_IDS = [];
  DELETE_IMAGE_IDS = [];

  SIGNATURE_STATE = {
    supervisor: { mode: "keep", existingFileId: "", existingUrl: "", existingName: "", newBase64: "" },
    employee: { mode: "keep", existingFileId: "", existingUrl: "", existingName: "", newBase64: "" },
    interpreter: { mode: "keep", existingFileId: "", existingUrl: "", existingName: "", newBase64: "" }
  };

  renderEditModeUi_();
  renderExistingImages_();
  renderExistingSignatureCards_();
}

function enterCreateMode_() {
  resetEditState_();
  FORM_MODE = "create";
  renderEditModeUi_();
}

function enterEditMode_(res) {
  resetEditState_();

  FORM_MODE = "edit";
  CURRENT_RECORD_ID = String(res?.recordId || "").trim();
  CURRENT_PARENT_RECORD_ID = String(res?.parentRecordId || "").trim();
  CURRENT_REVISION_NO = Number(res?.revisionNo || 0);
  CURRENT_BASE_RECORD_ID = String(res?.recordId || "").trim();
  CURRENT_BASE_REVISION_NO = Number(res?.revisionNo || 0);
  CURRENT_SOURCE_ROW_INDEX = Number(res?.rowIndex || 0);

  hydrateErrorBolForm_(res?.data || {});
  hydrateExistingImages_(res?.existingImages || []);
  hydrateExistingSignatures_(res?.existingSignatures || {});

  renderEditModeUi_();
  updateEmployeeConfirmPreview();

  Swal.fire({
    icon: "success",
    title: "โหลดเอกสารสำเร็จ",
    text: `เข้าสู่โหมดแก้ไข Ref ${res?.refNo || "-"} Rev.${res?.revisionNo || "-"}`,
    confirmButtonText: "ตกลง"
  });
}

function renderEditModeUi_() {
  const badge = $("errorBolModeBadge");
  const cancelBtn = $("btnCancelErrorBolEdit");
  const submitBtn = $("btnSubmit");
  const helper = $("errorBolEditMeta");

  if (badge) {
    badge.classList.remove("create", "edit", "draft");
    if (FORM_MODE === "edit") {
      badge.classList.add("edit");
      badge.textContent = `โหมด: แก้ไข Rev.${CURRENT_BASE_REVISION_NO || "-"}`;
    } else if (FORM_MODE === "recover_draft") {
      badge.classList.add("draft");
      badge.textContent = "โหมด: กู้คืน draft";
    } else {
      badge.classList.add("create");
      badge.textContent = "โหมด: สร้างใหม่";
    }
  }

  if (cancelBtn) {
    cancelBtn.classList.toggle("hidden", FORM_MODE !== "edit");
  }

  if (submitBtn) {
    submitBtn.textContent = FORM_MODE === "edit" ? "บันทึกเป็นฉบับแก้ไข" : "บันทึกข้อมูล";
  }

  if (helper) {
    if (FORM_MODE === "edit") {
      helper.innerHTML = `
        <div class="revisionMetaInline">
          <div><b>RecordId:</b> ${escapeHtml(CURRENT_BASE_RECORD_ID || "-")}</div>
          <div><b>Revision เดิม:</b> ${escapeHtml(String(CURRENT_BASE_REVISION_NO || "-"))}</div>
        </div>
      `;
      helper.classList.remove("hidden");
    } else {
      helper.innerHTML = "";
      helper.classList.add("hidden");
    }
  }
}

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
 *  EXISTING IMAGES / SIGNATURES
 *  ========================== */
function hydrateExistingImages_(images) {
  EXISTING_IMAGES = Array.isArray(images) ? images.map((x) => ({
    fileId: String(x?.fileId || "").trim(),
    url: String(x?.url || "").trim(),
    name: String(x?.name || "").trim()
  })).filter((x) => x.fileId) : [];

  KEEP_IMAGE_IDS = EXISTING_IMAGES.map((x) => x.fileId);
  DELETE_IMAGE_IDS = [];
  renderExistingImages_();
}

function renderExistingImages_() {
  const root = $("existingImagesContainer");
  if (!root) return;

  if (!EXISTING_IMAGES.length) {
    root.innerHTML = `<div class="swalNote">ไม่มีรูปภาพเดิม</div>`;
    return;
  }

  root.innerHTML = EXISTING_IMAGES.map((img, idx) => {
    const kept = KEEP_IMAGE_IDS.includes(img.fileId) && !DELETE_IMAGE_IDS.includes(img.fileId);
    return `
      <div class="existingAssetCard" data-file-id="${escapeHtml(img.fileId)}">
        <div class="existingAssetTitle">รูปเดิม ${idx + 1}</div>
        <img class="existingAssetPreview" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.name || ("image-" + (idx + 1)))}">
        <div class="signatureModeActions">
          <button type="button" class="btn ghost btnKeepExistingImage" data-file-id="${escapeHtml(img.fileId)}">
            ${kept ? "คงรูปนี้ไว้" : "นำรูปนี้กลับมาใช้"}
          </button>
          <button type="button" class="btn ghost btnRemoveExistingImage" data-file-id="${escapeHtml(img.fileId)}">
            ${kept ? "ลบรูปนี้" : "ยกเลิกการลบ"}
          </button>
        </div>
        <div class="fieldHint">
          ${kept ? "สถานะ: ใช้รูปเดิม" : "สถานะ: ลบออกจากฉบับแก้ไข"}
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll(".btnKeepExistingImage").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.dataset.fileId || "").trim();
      if (!id) return;

      if (!KEEP_IMAGE_IDS.includes(id)) KEEP_IMAGE_IDS.push(id);
      DELETE_IMAGE_IDS = DELETE_IMAGE_IDS.filter((x) => x !== id);
      renderExistingImages_();
    });
  });

  root.querySelectorAll(".btnRemoveExistingImage").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.dataset.fileId || "").trim();
      if (!id) return;

      const isDeleted = DELETE_IMAGE_IDS.includes(id);
      if (isDeleted) {
        DELETE_IMAGE_IDS = DELETE_IMAGE_IDS.filter((x) => x !== id);
        if (!KEEP_IMAGE_IDS.includes(id)) KEEP_IMAGE_IDS.push(id);
      } else {
        DELETE_IMAGE_IDS.push(id);
        KEEP_IMAGE_IDS = KEEP_IMAGE_IDS.filter((x) => x !== id);
      }
      renderExistingImages_();
    });
  });
}

function hydrateExistingSignatures_(existingSignatures) {
  const sup = existingSignatures?.supervisor || {};
  const emp = existingSignatures?.employee || {};
  const intr = existingSignatures?.interpreter || {};

  SIGNATURE_STATE = {
    supervisor: {
      mode: sup.fileId ? "keep" : "remove",
      existingFileId: String(sup.fileId || "").trim(),
      existingUrl: String(sup.url || "").trim(),
      existingName: String(sup.name || "Sign_Supervisor.png"),
      newBase64: ""
    },
    employee: {
      mode: emp.fileId ? "keep" : "remove",
      existingFileId: String(emp.fileId || "").trim(),
      existingUrl: String(emp.url || "").trim(),
      existingName: String(emp.name || "Sign_Employee.png"),
      newBase64: ""
    },
    interpreter: {
      mode: intr.fileId ? "keep" : "remove",
      existingFileId: String(intr.fileId || "").trim(),
      existingUrl: String(intr.url || "").trim(),
      existingName: String(intr.name || "Sign_Interpreter.png"),
      newBase64: ""
    }
  };

  renderExistingSignatureCards_();
}

function renderExistingSignatureCards_() {
  renderSingleSignatureCard_("supervisor", "supervisorSignExistingPreview", "supervisorSignStateText");
  renderSingleSignatureCard_("employee", "employeeSignExistingPreview", "employeeSignStateText");
  renderSingleSignatureCard_("interpreter", "interpreterSignExistingPreview", "interpreterSignStateText");
}

function renderSingleSignatureCard_(role, previewId, stateTextId) {
  const state = SIGNATURE_STATE[role];
  const preview = $(previewId);
  const text = $(stateTextId);

  if (preview) {
    const src = state.mode === "replace" ? state.newBase64 : state.existingUrl;
    if (src) {
      preview.src = src;
      preview.classList.remove("hidden");
    } else {
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }
  }

  if (text) {
    if (state.mode === "replace") {
      text.textContent = "สถานะ: ใช้ลายเซ็นใหม่";
    } else if (state.mode === "remove") {
      text.textContent = "สถานะ: ไม่ใช้ลายเซ็นนี้";
    } else if (state.existingFileId) {
      text.textContent = "สถานะ: ใช้ลายเซ็นเดิม";
    } else {
      text.textContent = "สถานะ: ยังไม่มีลายเซ็นเดิม";
    }
  }

  const keepBtn = $(`btnKeep${capitalizeRole_(role)}Sign`);
  const replaceBtn = $(`btnReplace${capitalizeRole_(role)}Sign`);
  const removeBtn = $(`btnRemove${capitalizeRole_(role)}Sign`);

  keepBtn?.classList.toggle("active", state.mode === "keep");
  replaceBtn?.classList.toggle("active", state.mode === "replace");
  removeBtn?.classList.toggle("active", state.mode === "remove");
}

function capitalizeRole_(role) {
  if (role === "supervisor") return "Supervisor";
  if (role === "employee") return "Employee";
  if (role === "interpreter") return "Interpreter";
  return role;
}

function setSignatureMode_(role, mode) {
  const state = SIGNATURE_STATE[role];
  if (!state) return;

  state.mode = mode;

  if (mode !== "replace") {
    state.newBase64 = "";
  }

  renderExistingSignatureCards_();
}

async function replaceSignatureForRole_(role, title, subtitle) {
  const res = await signatureModal(title, subtitle);
  if (!res.ok) return false;

  const state = SIGNATURE_STATE[role];
  if (!state) return false;

  state.mode = "replace";
  state.newBase64 = res.base64 || "";
  renderExistingSignatureCards_();
  return true;
}

function collectEditSignaturePayload_() {
  return {
    supervisor: {
      mode: SIGNATURE_STATE.supervisor.mode,
      existingFileId: SIGNATURE_STATE.supervisor.existingFileId || "",
      newBase64: SIGNATURE_STATE.supervisor.newBase64 || ""
    },
    employee: {
      mode: SIGNATURE_STATE.employee.mode,
      existingFileId: SIGNATURE_STATE.employee.existingFileId || "",
      newBase64: SIGNATURE_STATE.employee.newBase64 || ""
    },
    interpreter: {
      mode: SIGNATURE_STATE.interpreter.mode,
      existingFileId: SIGNATURE_STATE.interpreter.existingFileId || "",
      newBase64: SIGNATURE_STATE.interpreter.newBase64 || ""
    }
  };
}

function bindEditSignatureButtons_() {
  $("btnKeepSupervisorSign")?.addEventListener("click", () => setSignatureMode_("supervisor", "keep"));
  $("btnRemoveSupervisorSign")?.addEventListener("click", () => setSignatureMode_("supervisor", "remove"));
  $("btnReplaceSupervisorSign")?.addEventListener("click", async () => {
    await replaceSignatureForRole_("supervisor", "ลายเซ็นหัวหน้างาน", `ผู้เซ็น: ${$("otm")?.value || "-"}`);
  });

  $("btnKeepEmployeeSign")?.addEventListener("click", () => setSignatureMode_("employee", "keep"));
  $("btnRemoveEmployeeSign")?.addEventListener("click", () => setSignatureMode_("employee", "remove"));
  $("btnReplaceEmployeeSign")?.addEventListener("click", async () => {
    await replaceSignatureForRole_("employee", "ลายเซ็นพนักงานที่เบิกสินค้า Error", `ผู้เซ็น: ${$("employeeName")?.value || "-"}`);
  });

  $("btnKeepInterpreterSign")?.addEventListener("click", () => setSignatureMode_("interpreter", "keep"));
  $("btnRemoveInterpreterSign")?.addEventListener("click", () => setSignatureMode_("interpreter", "remove"));
  $("btnReplaceInterpreterSign")?.addEventListener("click", async () => {
    await replaceSignatureForRole_("interpreter", "ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${$("interpreterName")?.value || "-"}`);
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
  bindEditSignatureButtons_();

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

  await setActiveTab("error");
  enterCreateMode_();
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
    "nationality",
    "otm",
    "interpreterName"
  ].forEach((id) => {
    $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
    $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
  });

  $("btnLoadErrorBolForEdit")?.addEventListener("click", loadErrorBolForEditByRef_);
  $("btnCancelErrorBolEdit")?.addEventListener("click", () => {
    resetForm();
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

function setSelectedEmails(list) {
  const set = new Set(uniqStrings(list));
  document.querySelectorAll(".emailChk").forEach((chk) => {
    chk.checked = set.has(String(chk.value || "").trim());
  });
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
    await setActiveTab("error");
  } catch (err) {
    console.error("setActiveTab error:", err);
    safeSetLoginMsg("เกิดข้อผิดพลาดหลังเข้าสู่ระบบ: " + (err?.message || err));
    return;
  }

  try {
    if (window.Report500UI && typeof window.Report500UI.ensureReady === "function") {
      await window.Report500UI.ensureReady();
    }
  } catch (err) {
    console.error("Report500 preload failed:", err);
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

  if (FORM_MODE === "edit" && !CURRENT_BASE_RECORD_ID) {
    return "ไม่พบข้อมูลต้นทางของเอกสารที่ต้องการแก้ไข";
  }

  return "";
}

/** ==========================
 *  HYDRATE FORM FOR EDIT
 *  ========================== */
function hydrateErrorBolForm_(data) {
  if (!data || typeof data !== "object") return;

  const refNo = String(data.refNo || "").trim();
  if (refNo) {
    const m = refNo.match(/^(\d+)-(\d{4})$/);
    if (m) {
      if ($("refNo")) $("refNo").value = m[1];
      if ($("refYear")) $("refYear").value = m[2];
    }
  }

  if ($("lps")) $("lps").value = AUTH.name || data.lps || "";
  if ($("labelCid")) $("labelCid").value = data.labelCid || "";
  if ($("errorReason")) $("errorReason").value = data.errorReason || "";
  if ($("errorDescription")) $("errorDescription").value = data.errorDescription || "";
  if ($("item")) $("item").value = data.item || "";
  if ($("errorCaseQty")) $("errorCaseQty").value = data.errorCaseQty || "";
  if ($("employeeName")) $("employeeName").value = data.employeeName || "";
  if ($("employeeCode")) $("employeeCode").value = data.employeeCode || "";
  if ($("workAgeYear")) $("workAgeYear").value = data.workAgeYear || "";
  if ($("workAgeMonth")) $("workAgeMonth").value = data.workAgeMonth || "";
  if ($("nationality")) $("nationality").value = data.nationality || "";
  if ($("shift")) $("shift").value = data.shift || "";
  if ($("osm")) $("osm").value = data.osm || "";
  if ($("otm")) $("otm").value = data.otm || "";
  if ($("interpreterName")) $("interpreterName").value = data.interpreterName || "";
  if ($("auditName")) $("auditName").value = data.auditName || "";
  if ($("errorDate")) $("errorDate").value = thaiDateDisplayToIso(data.errorDate || "");

  let reasonOther = "";
  const errorReason = String(data.errorReason || "").trim();
  if (/^อื่นๆ:\s*/.test(errorReason)) {
    reasonOther = errorReason.replace(/^อื่นๆ:\s*/, "");
    if ($("errorReason")) $("errorReason").value = "อื่นๆ";
  } else if (errorReason === "อื่นๆ") {
    reasonOther = data.errorReasonOther || "";
  }

  if ($("errorReasonOther")) $("errorReasonOther").value = reasonOther || "";
  syncErrorReasonOtherVisibility();

  ITEM_LOOKUP_STATE = {
    item: String(data.item || "").trim(),
    description: String(data.itemDescription || "").trim() || ITEM_NOT_FOUND_TEXT,
    displayText: String(data.itemDisplay || "").trim() || getItemDisplayText(),
    found: String(data.itemDescription || "").trim() !== ITEM_NOT_FOUND_TEXT,
    loading: false
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  renderConfirmCauseSelector();

  const selectedCauses = [];
  const causeText = String(data.confirmCauseText || "").trim();
  if (causeText) {
    causeText.split("|").map((s) => s.trim()).filter(Boolean).forEach((item) => {
      if (/^อื่นๆ:\s*/.test(item)) return;
      selectedCauses.push(item);
    });
  }

  document.querySelectorAll(".confirmCauseChk").forEach((chk) => {
    chk.checked = selectedCauses.includes(String(chk.value || "").trim());
  });

  const causeOther = String(data.confirmCauseOther || "").trim() ||
    (causeText.split("|").map((s) => s.trim()).find((x) => /^อื่นๆ:\s*/.test(x)) || "").replace(/^อื่นๆ:\s*/, "");

  if ($("confirmCauseOther")) $("confirmCauseOther").value = causeOther || "";
  syncConfirmCauseOtherVisibility();

  const emails = splitEmails(data.emailRecipients || "");
  setSelectedEmails(emails);
}

async function loadErrorBolForEditByRef_() {
  const input = $("editRefNoErrorBol");
  const refNo = String(input?.value || "").trim();

  if (!refNo) {
    await Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้กรอก Ref No.",
      text: "กรุณากรอก Ref No. ที่ต้องการโหลดเพื่อแก้ไข"
    });
    return;
  }

  if (!AUTH.pass) {
    await Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อน"
    });
    return;
  }

  try {
    const res = await fetch(apiUrl(`/loadForEdit?type=errorbol&refNo=${encodeURIComponent(refNo)}`), {
      method: "GET"
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `โหลดเอกสารไม่สำเร็จ (HTTP ${res.status})`);
    }

    enterEditMode_(json);
  } catch (err) {
    console.error("loadErrorBolForEditByRef_ error:", err);
    await Swal.fire({
      icon: "error",
      title: "โหลดเอกสารไม่สำเร็จ",
      text: err?.message || String(err)
    });
  }
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
    title: FORM_MODE === "edit" ? "ตรวจสอบก่อนบันทึกฉบับแก้ไข" : "ตรวจสอบก่อนบันทึก",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">${FORM_MODE === "edit" ? "สรุปข้อมูลก่อนบันทึกฉบับแก้ไข" : "สรุปข้อมูลก่อนบันทึก"}</div>
          <div class="swalHeroSub">กรุณาตรวจสอบข้อมูลสำคัญให้ครบถ้วนก่อนดำเนินการ</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
            <div class="swalPill">รูปใหม่ ${fileCount} รูป</div>
            <div class="swalPill">Email ${emails.length} รายการ</div>
            ${FORM_MODE === "edit" ? `<div class="swalPill">Rev เดิม ${escapeHtml(String(CURRENT_BASE_REVISION_NO || "-"))}</div>` : ``}
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
            <div class="swalDescValue">${escapeHtmlWithBr(p.employeeConfirmText || "-")}</div>
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

        ${
          FORM_MODE === "edit"
            ? `
              <div class="swalSection">
                <div class="swalSectionTitle">สถานะฉบับแก้ไข</div>
                <div class="swalKvGrid">
                  <div class="swalKv">
                    <div class="swalKvLabel">รูปเดิมที่คงไว้</div>
                    <div class="swalKvValue">${KEEP_IMAGE_IDS.length}</div>
                  </div>
                  <div class="swalKv">
                    <div class="swalKvLabel">รูปเดิมที่ลบ</div>
                    <div class="swalKvValue">${DELETE_IMAGE_IDS.length}</div>
                  </div>
                  <div class="swalKv">
                    <div class="swalKvLabel">ลายเซ็นหัวหน้า</div>
                    <div class="swalKvValue">${escapeHtml(SIGNATURE_STATE.supervisor.mode)}</div>
                  </div>
                  <div class="swalKv">
                    <div class="swalKvLabel">ลายเซ็นพนักงาน</div>
                    <div class="swalKvValue">${escapeHtml(SIGNATURE_STATE.employee.mode)}</div>
                  </div>
                </div>
              </div>
            `
            : ""
        }

        <div class="swalSection">
          <div class="swalSectionTitle">ไฟล์แนบ</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">จำนวนรูปใหม่ที่เลือก</div>
              <div class="swalKvValue">${fileCount} รูป</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">สถานะการสร้างเอกสาร</div>
              <div class="swalKvValue">${FORM_MODE === "edit" ? "ระบบจะสร้าง PDF ฉบับใหม่หลังบันทึกสำเร็จ" : "ระบบจะสร้าง PDF หลังบันทึกสำเร็จ"}</div>
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

  let body;
  let submitUrl = apiUrl("/submit");
  let progressTitle = "กำลังบันทึก Error_BOL";
  let progressSub = "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล";

  if (FORM_MODE === "edit") {
    body = {
      action: "submitEdit",
      type: "errorBol",
      pass: AUTH.pass,
      baseRecordId: CURRENT_BASE_RECORD_ID,
      baseRevisionNo: CURRENT_BASE_REVISION_NO,
      editReason: norm($("errorBolEditReason")?.value),
      payload: p,
      files,
      keepImageIds: KEEP_IMAGE_IDS.slice(),
      deleteImageIds: DELETE_IMAGE_IDS.slice(),
      signatures: collectEditSignaturePayload_()
    };
    submitUrl = apiUrl("/");
    progressTitle = "กำลังบันทึกฉบับแก้ไข Error_BOL";
    progressSub = "ระบบกำลังอัปโหลดข้อมูลที่แก้ไข สร้าง PDF ฉบับใหม่ และส่งอีเมล";
  } else {
    const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
    if (!signRes.ok) {
      return;
    }

    body = {
      pass: AUTH.pass,
      payload: p,
      files,
      signatures: {
        supervisorBase64: signRes.supervisorBase64 || "",
        employeeBase64: signRes.employeeBase64 || "",
        interpreterBase64: signRes.interpreterBase64 || ""
      }
    };
  }

  ProgressUI.show(progressTitle, progressSub);

  try {
    ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
    await safeDelay(140);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(180);
    ProgressUI.markDone(
      "upload",
      42,
      FORM_MODE === "edit"
        ? `เตรียมไฟล์เรียบร้อย (${files.length} รูปใหม่ + ลายเซ็นตามโหมดแก้ไข)`
        : `เตรียมไฟล์เรียบร้อย (${files.length} รูป + ลายเซ็น)`
    );

    ProgressUI.activateOnly("save", 56, "กำลังบันทึกข้อมูลลงระบบ");

    const res = await fetch(submitUrl, {
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

    const supSignThumb = FORM_MODE === "edit"
      ? renderEditSignatureThumb_("supervisor")
      : `<div class="swalNote">ลายเซ็นถูกบันทึกแล้ว</div>`;

    const empSignThumb = FORM_MODE === "edit"
      ? renderEditSignatureThumb_("employee")
      : `<div class="swalNote">ลายเซ็นถูกบันทึกแล้ว</div>`;

    const intSignThumb = FORM_MODE === "edit"
      ? renderEditSignatureThumb_("interpreter")
      : `<div class="swalNote">ลายเซ็นถูกบันทึกแล้ว</div>`;

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
            <div class="swalHeroSub">
              ${FORM_MODE === "edit"
                ? "ระบบจัดเก็บข้อมูลที่แก้ไข สร้าง PDF ฉบับใหม่ และอัปเดต revision เรียบร้อย"
                : "ระบบจัดเก็บข้อมูล รูปภาพ ลายเซ็น และเอกสาร PDF เรียบร้อย"}
            </div>
            <div class="swalPillRow">
              <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
              <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
              <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
              ${FORM_MODE === "edit" ? `<div class="swalPill">Rev ใหม่ ${escapeHtml(String(json.revisionNo || "-"))}</div>` : ""}
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

function renderEditSignatureThumb_(role) {
  const st = SIGNATURE_STATE[role];
  const src = st?.mode === "replace" ? st?.newBase64 : st?.existingUrl;
  if (st?.mode === "remove") {
    return `<div class="swalNote">ไม่ใช้ลายเซ็นนี้</div>`;
  }
  if (src) {
    return `<img class="sigThumb" src="${src}" alt="sign ${escapeHtml(role)}">`;
  }
  return `<div class="swalNote">ไม่มีลายเซ็น</div>`;
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
        <div style="font-size:13px;color:#64748b;font-weight:700;margin-bottom:8px">${escapeHtml(subtitle || "")}</div>
        <div style="border:1px solid #d7ddea;border-radius:16px;padding:10px;background:#fff">
          <canvas id="${canvasId}" width="700" height="240" style="width:100%;height:240px;display:block;border-radius:12px;background:#fff;touch-action:none"></canvas>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:10px">
          <button type="button" id="${clearId}" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ล้างลายเซ็น</button>
        </div>
      </div>
    `,
    width: 900,
    showCancelButton: true,
    confirmButtonText: "ยืนยันลายเซ็น",
    cancelButtonText: "ยกเลิก",
    didOpen: () => {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      let drawing = false;
      let hasStroke = false;

      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";

      function pointFromEvent(ev) {
        const rect = canvas.getBoundingClientRect();
        const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
        const clientY = ev.touches?.[0]?.clientY ?? ev.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      }

      function start(ev) {
        ev.preventDefault();
        drawing = true;
        const p = pointFromEvent(ev);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      }

      function move(ev) {
        if (!drawing) return;
        ev.preventDefault();
        const p = pointFromEvent(ev);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        hasStroke = true;
      }

      function end(ev) {
        if (!drawing) return;
        ev.preventDefault();
        drawing = false;
      }

      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);

      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end, { passive: false });

      document.getElementById(clearId)?.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasStroke = false;
      });

      Swal.getConfirmButton()?.addEventListener("click", (ev) => {
        if (!hasStroke) {
          ev.preventDefault();
          ev.stopPropagation();
          Swal.showValidationMessage("กรุณาลงลายเซ็นก่อนยืนยัน");
        }
      });
    },
    preConfirm: () => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    }
  });

  if (!res.isConfirmed || !res.value) {
    return { ok: false };
  }

  return { ok: true, base64: String(res.value || "") };
}

/** ==========================
 *  Preview / Reset helpers
 *  ========================== */
function resetForm() {
  $("labelCid") && ($("labelCid").value = "");
  $("errorReason") && ($("errorReason").value = "");
  $("errorReasonOther") && ($("errorReasonOther").value = "");
  $("errorDescription") && ($("errorDescription").value = "");
  $("errorDate") && ($("errorDate").value = "");
  $("item") && ($("item").value = "");
  $("itemDisplay") && ($("itemDisplay").value = "");
  $("errorCaseQty") && ($("errorCaseQty").value = "");
  $("employeeName") && ($("employeeName").value = "");
  $("employeeCode") && ($("employeeCode").value = "");
  $("workAgeYear") && ($("workAgeYear").value = "");
  $("workAgeMonth") && ($("workAgeMonth").value = "");
  $("nationality") && ($("nationality").value = "");
  $("shift") && ($("shift").value = "");
  $("osm") && ($("osm").value = "");
  $("otm") && ($("otm").value = "");
  $("interpreterName") && ($("interpreterName").value = "");
  $("auditName") && ($("auditName").value = "");
  $("confirmCauseOther") && ($("confirmCauseOther").value = "");
  $("employeeConfirmText") && ($("employeeConfirmText").value = "");

  buildYearOptionsForSelect($("refYear"));
  $("refNo") && ($("refNo").value = "");
  if ($("lps")) $("lps").value = AUTH.name || "";

  document.querySelectorAll(".confirmCauseChk").forEach((chk) => {
    chk.checked = false;
  });

  document.querySelectorAll(".emailChk").forEach((chk) => {
    chk.checked = false;
  });

  ITEM_LOOKUP_STATE = {
    item: "",
    description: "",
    displayText: "",
    found: false,
    loading: false
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  const list = $("uploadList");
  if (list) {
    Array.from(list.querySelectorAll('input[type="file"]')).forEach((input) => {
      EDITED_UPLOAD_STORE.delete(input);
    });
  }

  buildInitialUploadFields();
  resetEditState_();
  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();

  if ($("errorBolEditReason")) $("errorBolEditReason").value = "";
}

window.resetForm = resetForm;
window.getRefNoValue = getRefNoValue;
window.getRptRefNoValue = getRptRefNoValue;
window.setLpsFromLogin = setLpsFromLogin;
window.buildEmailStatusSummary_ = buildEmailStatusSummary_;
window.sleepMs = sleepMs;
window.estimateUploadProgressByFiles = estimateUploadProgressByFiles;
