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

const ITEM_LOCAL_CACHE = new Map();
let itemLookupTimer = null;
const EDITED_UPLOAD_STORE = new WeakMap();

let ERROR_BOL_FORM_MODE = "create";
let ERROR_BOL_EDIT_CONTEXT = null;
let EXISTING_ERROR_BOL_ASSETS = {
  images: [],
  signatures: {
    interpreter: null,
    supervisor: null,
    employee: null
  }
};

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
    const existingAsset = input.dataset?.existingAssetJson
      ? (() => {
          try { return JSON.parse(input.dataset.existingAssetJson); }
          catch (_) { return null; }
        })()
      : null;

    if (edited || raw) {
      await openEditorForUploadInput(input, box);
      return;
    }

    if (existingAsset) {
      if (!window.ImageEditorX || typeof window.ImageEditorX.openFromExistingAsset !== "function") {
        await Swal.fire({
          icon: "error",
          title: "ยังไม่พร้อมใช้งาน",
          text: "ไม่พบฟังก์ชันเปิดแก้ไขจากรูปเดิม"
        });
        return;
      }

      const result = await window.ImageEditorX.openFromExistingAsset(existingAsset, {
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
      return;
    }

    await Swal.fire({
      icon: "info",
      title: "ยังไม่มีรูปภาพ",
      text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
    });
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
    img.classList.remove("hidden");
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
  const file = edited || raw;

  if (!file) {
    await Swal.fire({
      icon: "info",
      title: "ยังไม่มีรูปภาพ",
      text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
    });
    return;
  }

  const result = await window.ImageEditorX.open(file, {
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

function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

function $(id) {
  return document.getElementById(id);
}

function norm(v) {
  return String(v == null ? "" : v).trim();
}

function escapeHtml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeSetLoginMsg(msg, ok = false) {
  const el = $("loginMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = ok ? "#16a34a" : "#dc2626";
}

function applyStaticLogos() {
  document.querySelectorAll(".brandLogoImg, .loginHeroLogo").forEach((img) => {
    img.src = APP_LOGO_URL;
  });
}

function buildYearOptions() {
  const refYear = $("refYear");
  if (!refYear) return;

  const now = new Date();
  const thaiYear = now.getFullYear() + 543;
  const years = [thaiYear - 1, thaiYear, thaiYear + 1];

  refYear.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  refYear.value = String(thaiYear);
}

function bindRefInputs() {
  buildYearOptions();

  $("refNo")?.addEventListener("input", () => {
    const el = $("refNo");
    if (!el) return;
    el.value = el.value.replace(/[^\d]/g, "");
  });
}

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
    $("formCard")?.classList.add("hidden");
    $("under500Card")?.classList.add("hidden");
    return;
  }

  if (which === "error") {
    $("formCard")?.classList.remove("hidden");
    $("under500Card")?.classList.add("hidden");
  } else {
    $("formCard")?.classList.add("hidden");
    $("under500Card")?.classList.remove("hidden");
    if (window.Report500Form?.ensureReady) {
      await window.Report500Form.ensureReady();
    } else if (typeof window.ensureReady === "function") {
      await window.ensureReady();
    }
  }
}
/** ==========================
 *  Events
 *  ========================== */
function bindEvents() {
  $("btnLogin")?.addEventListener("click", onLogin);
  $("btnSubmit")?.addEventListener("click", submitForm);

  $("errorReason")?.addEventListener("change", syncErrorReasonOtherVisibility);
  $("errorDescription")?.addEventListener("input", updateEmployeeConfirmPreview);
  $("employeeName")?.addEventListener("input", updateEmployeeConfirmPreview);
  $("employeeCode")?.addEventListener("input", updateEmployeeConfirmPreview);
  $("errorDate")?.addEventListener("change", updateEmployeeConfirmPreview);
  $("shift")?.addEventListener("change", updateEmployeeConfirmPreview);
  $("item")?.addEventListener("input", debounceItemLookup_);
  $("errorCaseQty")?.addEventListener("input", updateEmployeeConfirmPreview);

  $("btnAddUpload")?.addEventListener("click", () => {
    addUploadField();
  });

  $("btnResetForm")?.addEventListener("click", () => {
    clearErrorBolEditMode_();
    resetForm();
  });
}

async function onLogin() {
  const pass = norm($("loginPass")?.value);
  if (!pass) {
    safeSetLoginMsg("กรุณากรอกรหัสผ่าน");
    return;
  }

  safeSetLoginMsg("");
  try {
    const res = await fetch(apiUrl("/auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass })
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      safeSetLoginMsg(json?.error || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }

    AUTH = {
      name: norm(json.name),
      pass: pass
    };

    safeSetLoginMsg("เข้าสู่ระบบสำเร็จ", true);

    $("loginCard")?.classList.add("hidden");
    $("modeTabs")?.classList.remove("hidden");
    $("topLoginUserWrap")?.classList.remove("hidden");
    $("topLoginUserName") && ($("topLoginUserName").textContent = AUTH.name || "-");
    $("lps") && ($("lps").value = AUTH.name || "");

    await setActiveTab("error");
  } catch (err) {
    console.error(err);
    safeSetLoginMsg(err?.message || "เข้าสู่ระบบไม่สำเร็จ");
  }
}

/** ==========================
 *  Options / Dropdowns
 *  ========================== */
async function loadOptions() {
  const res = await fetch(apiUrl("/options"), {
    method: "GET",
    cache: "no-store"
  });

  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) {
    throw new Error("โหลด options ไม่สำเร็จ: backend ไม่ได้ส่ง JSON");
  }

  if (!res.ok || !json.ok) {
    throw new Error(json?.error || `โหลด options ไม่สำเร็จ (HTTP ${res.status})`);
  }

  OPTIONS = {
    errorList: Array.isArray(json.errorList) ? json.errorList : [],
    auditList: Array.isArray(json.auditList) ? json.auditList : [],
    emailList: Array.isArray(json.emailList) ? json.emailList : [],
    osmList: Array.isArray(json.osmList) ? json.osmList : [],
    otmList: Array.isArray(json.otmList) ? json.otmList : [],
    confirmCauseList: Array.isArray(json.confirmCauseList) ? json.confirmCauseList : [],
    nationalityList: Array.isArray(json.nationalityList) ? json.nationalityList : []
  };
}

function fillFormDropdowns() {
  fillSelect("errorReason", OPTIONS.errorList, true);
  fillSelect("auditName", OPTIONS.auditList, true);
  fillSelect("osm", OPTIONS.osmList, true);
  fillSelect("otm", OPTIONS.otmList, true);
  fillSelect("nationality", OPTIONS.nationalityList, true);
}

function fillSelect(id, list, withPlaceholder = true) {
  const el = $(id);
  if (!el) return;

  const items = Array.isArray(list) ? list : [];
  const html = [];
  if (withPlaceholder) html.push(`<option value="">-- เลือก --</option>`);
  items.forEach((item) => {
    const value = norm(typeof item === "object" ? item.label || item.value : item);
    if (!value) return;
    html.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
  });
  el.innerHTML = html.join("");
}

function renderEmailSelector() {
  const root = $("emailSelector");
  if (!root) return;

  const list = Array.isArray(OPTIONS.emailList) ? OPTIONS.emailList : [];
  if (!list.length) {
    root.innerHTML = `<div class="fieldHint">ไม่พบรายการอีเมล</div>`;
    return;
  }

  root.innerHTML = list.map((email, idx) => {
    const value = norm(email);
    return `
      <label class="checkPill">
        <input class="emailChk" type="checkbox" value="${escapeHtml(value)}">
        <span>${escapeHtml(value)}</span>
      </label>
    `;
  }).join("");
}

function renderConfirmCauseSelector() {
  const root = $("confirmCauseSelector");
  if (!root) return;

  const list = Array.isArray(OPTIONS.confirmCauseList) ? OPTIONS.confirmCauseList : [];
  if (!list.length) {
    root.innerHTML = `<div class="fieldHint">ไม่พบรายการสาเหตุประกอบ</div>`;
    return;
  }

  root.innerHTML = list.map((item, idx) => {
    const label = norm(typeof item === "object" ? item.label : item);
    const requiresText = !!(typeof item === "object" && item.requiresText);
    return `
      <label class="checkPill">
        <input class="confirmCauseChk" type="checkbox" value="${escapeHtml(label)}" data-requires-text="${requiresText ? "1" : "0"}">
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }).join("");

  root.querySelectorAll(".confirmCauseChk").forEach((el) => {
    el.addEventListener("change", () => {
      syncConfirmCauseOtherVisibility();
      updateEmployeeConfirmPreview();
    });
  });
}

function buildShiftOptions() {
  const shift = $("shift");
  if (!shift) return;
  shift.innerHTML = `
    <option value="">-- เลือก --</option>
    <option value="เช้า">เช้า</option>
    <option value="บ่าย">บ่าย</option>
    <option value="ดึก">ดึก</option>
  `;
}

function buildWorkAgeOptions() {
  const year = $("workAgeYear");
  const month = $("workAgeMonth");

  if (year) {
    const y = [`<option value="">-- ปี --</option>`];
    for (let i = 0; i <= 40; i++) y.push(`<option value="${i}">${i}</option>`);
    year.innerHTML = y.join("");
  }

  if (month) {
    const m = [`<option value="">-- เดือน --</option>`];
    for (let i = 0; i <= 11; i++) m.push(`<option value="${i}">${i}</option>`);
    month.innerHTML = m.join("");
  }
}

/** ==========================
 *  Upload fields
 *  ========================== */
function buildInitialUploadFields() {
  const root = $("uploadList");
  if (!root) return;

  root.innerHTML = "";
  addUploadField();
  addUploadField();
}

function addUploadField() {
  const root = $("uploadList");
  if (!root) return;

  const index = root.querySelectorAll(".uploadBox").length + 1;
  const inputId = `uploadFile_${index}`;

  const box = document.createElement("div");
  box.className = "uploadBox";
  box.innerHTML = `
    <div class="uploadHead">
      <div class="uploadTitle">รูปภาพ ${index}</div>
      <button type="button" class="btn ghost btnRemoveUpload">ลบ</button>
    </div>
    <input id="${inputId}" type="file" accept="image/*">
    <div class="small">ยังไม่ได้เลือกรูปภาพ</div>
    <img class="previewImg hidden" alt="preview">
  `;

  root.appendChild(box);

  const input = box.querySelector("input[type='file']");
  const btnRemove = box.querySelector(".btnRemoveUpload");

  input?.addEventListener("change", () => {
    EDITED_UPLOAD_STORE.delete(input);
    delete input.dataset.existingAssetJson;

    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) {
      const txt = box.querySelector(".small");
      const img = box.querySelector(".previewImg");
      if (txt) txt.textContent = "ยังไม่ได้เลือกรูปภาพ";
      if (img) {
        if (img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
          delete img.dataset.objectUrl;
        }
        img.removeAttribute("src");
        img.classList.add("hidden");
      }
      return;
    }

    updateUploadPreviewFromFile(input, box, file, `ไฟล์ที่เลือก: ${file.name} (${Math.round(file.size / 1024)} KB)`);
  });

  btnRemove?.addEventListener("click", () => {
    const onlyOne = root.querySelectorAll(".uploadBox").length <= 1;
    if (onlyOne) {
      const txt = box.querySelector(".small");
      const img = box.querySelector(".previewImg");
      if (input) {
        input.value = "";
        EDITED_UPLOAD_STORE.delete(input);
        delete input.dataset.existingAssetJson;
      }
      if (txt) txt.textContent = "ยังไม่ได้เลือกรูปภาพ";
      if (img) {
        if (img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
          delete img.dataset.objectUrl;
        }
        img.removeAttribute("src");
        img.classList.add("hidden");
      }
      return;
    }
    root.removeChild(box);
    renumberUploadFields_();
  });

  ensureEditButtonForUploadBox(box, inputId);
}

function renumberUploadFields_() {
  const root = $("uploadList");
  if (!root) return;

  Array.from(root.querySelectorAll(".uploadBox")).forEach((box, idx) => {
    const no = idx + 1;
    const title = box.querySelector(".uploadTitle");
    const input = box.querySelector("input[type='file']");
    if (title) title.textContent = `รูปภาพ ${no}`;
    if (input) input.id = `uploadFile_${no}`;

    const btnEdit = box.querySelector(".btnEditImage");
    if (btnEdit) btnEdit.remove();

    ensureEditButtonForUploadBox(box, `uploadFile_${no}`);
  });
}

/** ==========================
 *  Input utils
 *  ========================== */
function numericOnly(el) {
  if (!el) return;
  el.addEventListener("input", () => {
    el.value = String(el.value || "").replace(/[^\d]/g, "");
  });
}

function alnumUpperOnly(el) {
  if (!el) return;
  el.addEventListener("input", () => {
    el.value = String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  });
}

/** ==========================
 *  Error reason / Confirm cause UI
 *  ========================== */
function syncErrorReasonOtherVisibility() {
  const reason = norm($("errorReason")?.value);
  const wrap = $("errorReasonOtherWrap");
  const input = $("errorReasonOther");

  const show = reason === "อื่นๆ";
  wrap?.classList.toggle("hidden", !show);
  if (!show && input) input.value = "";
}

function syncConfirmCauseOtherVisibility() {
  const checks = Array.from(document.querySelectorAll(".confirmCauseChk:checked"));
  const show = checks.some((el) => String(el.dataset.requiresText || "") === "1" || norm(el.value) === "อื่นๆ");

  const wrap = $("confirmCauseOtherWrap");
  const input = $("confirmCauseOther");
  wrap?.classList.toggle("hidden", !show);
  if (!show && input) input.value = "";
}
/** ==========================
 *  Confirm Cause / Error Reason
 *  ========================== */
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
  const list = (Array.isArray(selected) ? selected : [selected])
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .filter((x) => x !== "อื่นๆ");

  const other = String(otherText || "").trim();
  const out = list.slice();
  if (other) out.push(`อื่นๆ: ${other}`);
  return out.join(" | ");
}

/** ==========================
 *  Item lookup
 *  ========================== */
function debounceItemLookup_() {
  const item = norm($("item")?.value);
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
    ITEM_LOOKUP_STATE = {
      item: item,
      description: "",
      displayText: "",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  clearTimeout(itemLookupTimer);
  itemLookupTimer = setTimeout(() => {
    lookupItem_(item);
  }, ITEM_LOOKUP_DEBOUNCE_MS);
}

async function lookupItem_(item) {
  const clean = norm(item);
  if (!clean) return;

  if (ITEM_LOCAL_CACHE.has(clean)) {
    const cached = ITEM_LOCAL_CACHE.get(clean);
    ITEM_LOOKUP_STATE = {
      item: cached.item || clean,
      description: cached.description || "",
      displayText: cached.displayText || "",
      found: !!cached.found,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
    return;
  }

  ITEM_LOOKUP_STATE = {
    item: clean,
    description: "",
    displayText: "",
    found: false,
    loading: true
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  try {
    const res = await fetch(apiUrl(`/itemLookup?item=${encodeURIComponent(clean)}`), {
      method: "GET",
      cache: "no-store"
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("ระบบค้นหา Item ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `ค้นหา Item ไม่สำเร็จ (HTTP ${res.status})`);
    }

    ITEM_LOOKUP_STATE = {
      item: json.item || clean,
      description: json.description || "",
      displayText: json.displayText || "",
      found: !!json.found,
      loading: false
    };

    ITEM_LOCAL_CACHE.set(clean, { ...ITEM_LOOKUP_STATE });
    renderItemLookupState(ITEM_LOOKUP_STATE);
    updateEmployeeConfirmPreview();
  } catch (err) {
    console.error(err);
    ITEM_LOOKUP_STATE = {
      item: clean,
      description: "",
      displayText: "",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE, err?.message || "ค้นหา Item ไม่สำเร็จ");
    updateEmployeeConfirmPreview();
  }
}

function renderItemLookupState(state, errMsg = "") {
  const hint = $("itemLookupHint");
  const itemDisplay = $("itemDisplay");

  if (itemDisplay) {
    itemDisplay.value = state?.displayText || "";
  }

  if (!hint) return;

  if (state?.loading) {
    hint.textContent = "กำลังค้นหารายการสินค้า...";
    hint.style.color = "#2563eb";
    return;
  }

  if (errMsg) {
    hint.textContent = errMsg;
    hint.style.color = "#dc2626";
    return;
  }

  if (!state?.item) {
    hint.textContent = "";
    hint.style.color = "";
    return;
  }

  if (state?.found) {
    hint.textContent = "พบรายการสินค้าแล้ว";
    hint.style.color = "#16a34a";
  } else {
    hint.textContent = "ไม่พบรายการสินค้าใน Item Master";
    hint.style.color = "#d97706";
  }
}

function getItemDisplayText() {
  return norm($("itemDisplay")?.value);
}

/** ==========================
 *  Employee confirm narrative
 *  ========================== */
function formatDateToDisplay(v) {
  const s = norm(v);
  if (!s) return "";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear() + 543);
  return `${dd}/${mm}/${yyyy}`;
}

function toThaiDateDisplay(v) {
  return formatDateToDisplay(v) || "-";
}

function buildEmployeeConfirmText(data) {
  const employeeName = norm(data.employeeName) || "-";
  const employeeCode = norm(data.employeeCode) || "-";
  const errorDate = toThaiDateDisplay(data.errorDate) || "-";
  const shift = norm(data.shift) || "-";
  const refNo = norm(data.refNo) || "-";
  const errorReason = norm(data.errorReason) || "-";
  const itemDisplay = norm(data.itemDisplay) || "ยังไม่พบรายละเอียดสินค้า";
  const errorCaseQty = norm(data.errorCaseQty) || "-";

  const confirmCauseSelected = (Array.isArray(data.confirmCauseSelected) ? data.confirmCauseSelected : [data.confirmCauseSelected])
    .map((x) => norm(x))
    .filter(Boolean)
    .filter((x) => x !== "อื่นๆ");

  const confirmCauseOther = norm(data.confirmCauseOther);

  const lines = [];
  if (confirmCauseSelected.length) {
    confirmCauseSelected.forEach((t, i) => lines.push(`${i + 1}) ${t}`));
  }
  if (confirmCauseOther) {
    lines.push(`${lines.length + 1}) ${confirmCauseOther}`);
  }
  if (!lines.length) {
    lines.push("1) ข้าพเจ้ายืนยันว่ารับทราบข้อเท็จจริงตามเอกสารฉบับนี้");
  }

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

/** ==========================
 *  Payload / Validate
 *  ========================== */
function getFullRefNoValue() {
  const running = norm($("refNo")?.value);
  const year = norm($("refYear")?.value);
  return running && year ? `${running}-${year}` : running;
}

function collectPayloadBase() {
  return {
    refNo: getFullRefNoValue(),
    lps: norm($("lps")?.value || AUTH.name || ""),
    labelCid: norm($("labelCid")?.value),
    errorReason: norm($("errorReason")?.value),
    errorReasonOther: norm($("errorReasonOther")?.value),
    item: norm($("item")?.value),
    errorCaseQty: norm($("errorCaseQty")?.value),
    employeeName: norm($("employeeName")?.value),
    employeeCode: norm($("employeeCode")?.value),
    workAgeYear: norm($("workAgeYear")?.value),
    workAgeMonth: norm($("workAgeMonth")?.value),
    nationality: norm($("nationality")?.value),
    interpreterName: norm($("interpreterName")?.value),
    errorDate: norm($("errorDate")?.value),
    shift: norm($("shift")?.value),
    osm: norm($("osm")?.value),
    otm: norm($("otm")?.value),
    auditName: norm($("auditName")?.value),
    errorDescription: norm($("errorDescription")?.value),
    emailRecipients: getSelectedEmails(),
    emailOther: norm($("emailOther")?.value)
  };
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
    ["errorReason", "สาเหตุหลัก"],
    ["item", "Item"],
    ["errorCaseQty", "จำนวนเคส"],
    ["employeeName", "ชื่อพนักงาน"],
    ["employeeCode", "รหัสพนักงาน"],
    ["errorDate", "วันที่เกิดเหตุ"],
    ["shift", "กะ"],
    ["osm", "OSM"],
    ["otm", "OTM"],
    ["auditName", "AUDIT"],
    ["errorDescription", "รายละเอียดสาเหตุ"]
  ];

  for (const [key, label] of required) {
    if (!norm(p[key])) return `กรุณากรอก${label}`;
  }

  if (p.errorReason === "อื่นๆ" && !norm(p.errorReasonOther)) {
    return "กรุณาระบุสาเหตุหลักอื่นๆ";
  }

  const selectedCauses = Array.isArray(p.confirmCauseSelected) ? p.confirmCauseSelected : [];
  const hasOtherCause = selectedCauses.includes("อื่นๆ") ||
    Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
      .some((el) => String(el.dataset.requiresText || "") === "1");

  if (hasOtherCause && !norm(p.confirmCauseOther)) {
    return "กรุณาระบุสาเหตุประกอบเพิ่มเติม";
  }

  return "";
}

function getSelectedEmails() {
  return Array.from(document.querySelectorAll(".emailChk:checked"))
    .map((el) => norm(el.value))
    .filter(Boolean);
}

function splitEmailText_(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}
/** ==========================
 *  Submit Wrapper
 *  ========================== */
async function submitForm() {
  if (ERROR_BOL_FORM_MODE === "edit") {
    return submitErrorBolEditFlow_();
  }
  return submitFormCreate_();
}

async function submitFormCreate_() {
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
  if (!signRes.ok) return;

  ProgressUI.show("กำลังบันทึกข้อมูล Error_BOL", "ระบบกำลังอัปโหลดไฟล์ สร้าง PDF และส่งอีเมล");
  try {
    ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
    await safeDelay(120);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(150);
    ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${files.length} รูป)`);

    ProgressUI.activateOnly("save", 56, "กำลังบันทึกข้อมูล");

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
      throw new Error(json?.error || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
    }

    ProgressUI.markDone("save", 72, "บันทึกข้อมูลเรียบร้อย");

    ProgressUI.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF");
    await safeDelay(150);

    const pdfOk = !!(json.pdfFileId || json.pdfUrl);
    if (pdfOk) {
      const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
      ProgressUI.markDone("pdf", 94, `สร้างไฟล์ PDF เรียบร้อย${sizeText}`);
    } else {
      ProgressUI.markError("pdf", "ไม่สามารถสร้าง PDF ได้", 94);
    }

    ProgressUI.activateOnly("email", 98, "กำลังตรวจสอบผลการส่งอีเมล");
    await safeDelay(120);

    const emailInfo = buildEmailStatusSummary_(json);

    if (emailInfo.emailOk) {
      ProgressUI.markDone("email", 100, emailInfo.emailModeText, emailInfo.emailModeText);
      ProgressUI.success("บันทึกสำเร็จ", "ข้อมูลถูกบันทึกเรียบร้อยแล้ว");
    } else if (emailInfo.emailSkipped) {
      ProgressUI.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
      ProgressUI.success("บันทึกสำเร็จ", "ข้อมูลและ PDF ถูกสร้างเรียบร้อยแล้ว");
    } else {
      ProgressUI.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
      ProgressUI.success("บันทึกสำเร็จบางส่วน", "ข้อมูลและ PDF สำเร็จแล้ว แต่ส่งอีเมลไม่สำเร็จ");
      ProgressUI.setHint(emailInfo.emailStatus || "กรุณาตรวจสอบสิทธิ์อีเมลหรือขนาดไฟล์แนบ");
    }

    const galleryHtml = renderGalleryHtml(json.imageIds || []);
    ProgressUI.hide(120);

    await Swal.fire({
      icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
      title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
      showConfirmButton: false,
      width: 920,
      html: `
        <div class="swalSummary">
          <div class="swalHero">
            <div class="swalHeroTitle">บันทึกข้อมูลเรียบร้อยแล้ว</div>
            <div class="swalHeroSub">ระบบสร้างเอกสารและ PDF ให้เรียบร้อยแล้ว</div>
            <div class="swalPillRow">
              <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
              <div class="swalPill">Ref: ${escapeHtml(json.refNo || "-")}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ผลลัพธ์</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">จำนวนรูป</div><div class="swalKvValue">${escapeHtml(String((json.imageIds || []).length))}</div></div>
              <div class="swalKv"><div class="swalKvLabel">PDF</div><div class="swalKvValue">${escapeHtml(json.pdfSizeText || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">ประวัติวินัย</div><div class="swalKvValue">${escapeHtml(String(json.disciplineMatchCount || 0))}</div></div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">สถานะอีเมล</div>
            ${
              emailInfo.emailSkipped
                ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
                : emailInfo.emailOk
                  ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailInfo.emailResult.count || 0)} รายการ ${emailInfo.emailResult.attachmentMode ? `• ${escapeHtml(emailInfo.emailResult.attachmentMode)}` : ""}</div>`
                  : `<div class="swalEmailFail">บันทึกสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailResult.error || "-")}</div>`
            }
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
        clearErrorBolEditMode_();
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

async function submitErrorBolEditFlow_() {
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

  if (!ERROR_BOL_EDIT_CONTEXT?.refNo) {
    return Swal.fire({
      icon: "error",
      title: "ยังไม่พบข้อมูลอ้างอิงเดิม",
      text: "ไม่พบ Ref เดิมของเอกสารที่กำลังแก้ไข กรุณาโหลดข้อมูลเดิมใหม่อีกครั้ง"
    });
  }

  let files = [];
  try {
    files = await collectFilesAsBase64({ maxFiles: 6, maxMBEach: 4 });
  } catch (fileErr) {
    console.error(fileErr);
    return;
  }

  const signDecision = await requestErrorBolEditSignatures_(p);
  if (!signDecision.ok) return;

  const body = collectErrorBolEditSubmitBody_(p, files, signDecision);

  ProgressUI.show(
    "กำลังบันทึกการแก้ไข Error_BOL",
    "ระบบกำลังบันทึกข้อมูลฉบับแก้ไข สร้าง PDF ใหม่ และตรวจสอบอีเมล"
  );

  try {
    ProgressUI.activateOnly("validate", 10, "ตรวจสอบข้อมูลเรียบร้อย");
    await safeDelay(120);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูลฉบับแก้ไข");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(150);
    ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${files.length} รูป)`);

    ProgressUI.activateOnly("save", 56, "กำลังบันทึกข้อมูลฉบับแก้ไข");

    const res = await fetch(apiUrl("/edit/errorbol/submit"), {
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
      throw new Error(json?.error || `บันทึกการแก้ไขไม่สำเร็จ (HTTP ${res.status})`);
    }

    ProgressUI.markDone("save", 72, "บันทึกข้อมูลฉบับแก้ไขเรียบร้อย");

    ProgressUI.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF ฉบับใหม่");
    await safeDelay(150);

    const pdfOk = !!(json.pdfFileId || json.pdfUrl);
    if (pdfOk) {
      const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
      ProgressUI.markDone("pdf", 94, `สร้างไฟล์ PDF ใหม่เรียบร้อย${sizeText}`);
    } else {
      ProgressUI.markError("pdf", "ไม่สามารถสร้าง PDF ใหม่ได้", 94);
    }

    ProgressUI.activateOnly("email", 98, "กำลังตรวจสอบผลการส่งอีเมล");
    await safeDelay(120);

    const emailInfo = buildEmailStatusSummary_(json);

    if (emailInfo.emailOk) {
      ProgressUI.markDone("email", 100, emailInfo.emailModeText, emailInfo.emailModeText);
      ProgressUI.success("บันทึกการแก้ไขสำเร็จ", "ระบบสร้างเอกสารฉบับแก้ไขเรียบร้อยแล้ว");
    } else if (emailInfo.emailSkipped) {
      ProgressUI.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
      ProgressUI.success("บันทึกการแก้ไขสำเร็จ", "แก้ไขข้อมูลและสร้าง PDF ใหม่เรียบร้อยแล้ว");
    } else {
      ProgressUI.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
      ProgressUI.success("บันทึกการแก้ไขสำเร็จ", "ข้อมูลและ PDF ใหม่สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
      ProgressUI.setHint(emailInfo.emailStatus || "กรุณาตรวจสอบสิทธิ์อีเมลหรือขนาดไฟล์แนบ");
    }

    const galleryHtml = renderGalleryHtml(json.imageIds || []);
    ProgressUI.hide(120);

    await Swal.fire({
      icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
      title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "แก้ไขสำเร็จ" : "แก้ไขสำเร็จบางส่วน",
      showConfirmButton: false,
      width: 920,
      html: `
        <div class="swalSummary">
          <div class="swalHero">
            <div class="swalHeroTitle">บันทึกเอกสารฉบับแก้ไขเรียบร้อยแล้ว</div>
            <div class="swalHeroSub">ระบบสร้าง Ref ใหม่และ PDF ใหม่จากข้อมูลที่แก้ไขแล้ว</div>
            <div class="swalPillRow">
              <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
              <div class="swalPill">Ref เดิม: ${escapeHtml(json.oldRefNo || ERROR_BOL_EDIT_CONTEXT?.refNo || "-")}</div>
              <div class="swalPill">Ref ใหม่: ${escapeHtml(json.refNo || "-")}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ผลลัพธ์</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(String(json.revisionNo || "-"))}</div></div>
              <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">จำนวนรูป</div><div class="swalKvValue">${escapeHtml(String((json.imageIds || []).length))}</div></div>
              <div class="swalKv"><div class="swalKvLabel">PDF</div><div class="swalKvValue">${escapeHtml(json.pdfSizeText || "-")}</div></div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">สถานะอีเมล</div>
            ${
              emailInfo.emailSkipped
                ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
                : emailInfo.emailOk
                  ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailInfo.emailResult.count || 0)} รายการ ${emailInfo.emailResult.attachmentMode ? `• ${escapeHtml(emailInfo.emailResult.attachmentMode)}` : ""}</div>`
                  : `<div class="swalEmailFail">บันทึกสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailResult.error || "-")}</div>`
            }
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">รูปภาพแนบ</div>
            ${galleryHtml || `<div class="swalNote">ไม่มีรูปภาพแนบ</div>`}
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
            ${
              json.pdfUrl
                ? `<button type="button" id="btnOpenPdfAfterEditSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF ใหม่</button>`
                : ``
            }
            <button type="button" id="btnCloseAfterEditSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
          </div>
        </div>
      `,
      didOpen: () => {
        bindGalleryClickInSwal();

        const btnOpen = document.getElementById("btnOpenPdfAfterEditSave");
        const btnClose = document.getElementById("btnCloseAfterEditSave");

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
        clearErrorBolEditMode_();
        resetForm();
      }
    });

  } catch (err2) {
    console.error(err2);
    ProgressUI.markError("save", err2?.message || "เกิดข้อผิดพลาด", 58);
    ProgressUI.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

    await Swal.fire({
      icon: "error",
      title: "บันทึกการแก้ไขไม่สำเร็จ",
      text: err2?.message || String(err2),
      confirmButtonText: "ตกลง"
    });

    ProgressUI.hide(180);
  }
}

function collectErrorBolEditSubmitBody_(p, files, signDecision) {
  const customEmails = splitEmailText_(norm($("emailOther")?.value || ""));
  const selectedEmails = getSelectedEmails();

  return {
    pass: AUTH.pass,
    payload: {
      meta: {
        ...(ERROR_BOL_EDIT_CONTEXT || {}),
        mode: "edit"
      },
      form: {
        basic: {
          refNo: ERROR_BOL_EDIT_CONTEXT?.refNo || "",
          lps: norm($("lps")?.value || AUTH.name || ""),
          labelCid: p.labelCid,
          item: p.item,
          itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
          itemDisplay: ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "",
          errorCaseQty: p.errorCaseQty,
          errorDate: p.errorDate,
          shift: p.shift
        },
        reason: {
          errorReason: p.errorReason,
          errorReasonOther: p.errorReasonOther,
          confirmCauseText: Array.isArray(p.confirmCauseSelected) ? p.confirmCauseSelected.join(" | ") : "",
          confirmCauseOther: p.confirmCauseOther,
          errorDescription: p.errorDescription,
          employeeConfirmText: p.employeeConfirmText
        },
        employee: {
          employeeName: p.employeeName,
          employeeCode: p.employeeCode,
          workAgeYear: p.workAgeYear,
          workAgeMonth: p.workAgeMonth,
          nationality: p.nationality,
          interpreterName: p.interpreterName,
          osm: p.osm,
          otm: p.otm,
          auditName: p.auditName
        },
        email: {
          selected: selectedEmails,
          custom: customEmails
        }
      },
      uiState: {
        itemLookup: {
          ...ITEM_LOOKUP_STATE,
          loading: false
        },
        disciplineLookup: {
          ...(window.ERROR_BOL_DISCIPLINE_LOOKUP_STATE || {
            employeeCode: p.employeeCode,
            employeeName: p.employeeName,
            normalizedEmployeeCode: p.employeeCode,
            matchCount: 0,
            records: [],
            attached: false,
            searched: false
          })
        }
      },
      existingAssets: collectErrorBolExistingAssetsForEdit_()
    },
    files: Array.isArray(files) ? files : [],
    signatures: signDecision?.signatures || {
      supervisorBase64: "",
      employeeBase64: "",
      interpreterBase64: ""
    }
  };
}

function collectErrorBolExistingAssetsForEdit_() {
  const images = [];
  const imageMap = new Map();

  const originalImages = Array.isArray(EXISTING_ERROR_BOL_ASSETS?.images)
    ? EXISTING_ERROR_BOL_ASSETS.images
    : [];

  originalImages.forEach((asset) => {
    const fileId = String(asset?.fileId || asset?.id || "").trim();
    if (!fileId) return;
    imageMap.set(fileId, { ...asset, keep: true });
  });

  document.querySelectorAll('#uploadList input[type="file"]').forEach((input) => {
    const existing = parseExistingAssetJson_(input?.dataset?.existingAssetJson);
    if (!existing) return;

    const fileId = String(existing.fileId || existing.id || "").trim();
    if (!fileId) return;

    const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
    const raw = input.files && input.files[0] ? input.files[0] : null;

    if (edited || raw) {
      imageMap.delete(fileId);
      return;
    }

    imageMap.set(fileId, { ...existing, keep: true });
  });

  imageMap.forEach((asset) => images.push(asset));

  const rawSigns = EXISTING_ERROR_BOL_ASSETS?.signatures || {};
  const signatures = {
    interpreter: normalizeExistingSingleAsset_(rawSigns.interpreter),
    supervisor: normalizeExistingSingleAsset_(rawSigns.supervisor),
    employee: normalizeExistingSingleAsset_(rawSigns.employee)
  };

  return { images, signatures };
}

function normalizeExistingSingleAsset_(asset) {
  const fileId = String(asset?.fileId || asset?.id || "").trim();
  if (!fileId) {
    return {
      keep: false,
      fileId: "",
      id: "",
      filename: "",
      url: "",
      previewUrl: ""
    };
  }

  return {
    ...(asset || {}),
    keep: true,
    fileId,
    id: fileId
  };
}

function parseExistingAssetJson_(text) {
  try {
    const parsed = JSON.parse(String(text || ""));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

async function requestErrorBolEditSignatures_(p) {
  const signs = EXISTING_ERROR_BOL_ASSETS?.signatures || {};
  const hasExisting =
    !!String(signs?.supervisor?.fileId || "").trim() ||
    !!String(signs?.employee?.fileId || "").trim() ||
    !!String(signs?.interpreter?.fileId || "").trim();

  if (!hasExisting) {
    const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
    if (!signRes.ok) return { ok: false };
    return {
      ok: true,
      mode: "new",
      signatures: {
        supervisorBase64: signRes.supervisorBase64 || "",
        employeeBase64: signRes.employeeBase64 || "",
        interpreterBase64: signRes.interpreterBase64 || ""
      }
    };
  }

  const choice = await Swal.fire({
    icon: "question",
    title: "ลายเซ็นในการแก้ไข",
    text: "ต้องการใช้ลายเซ็นเดิมของเอกสาร หรือเซ็นใหม่ทั้งหมด",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "ใช้ลายเซ็นเดิม",
    denyButtonText: "เซ็นใหม่",
    cancelButtonText: "ยกเลิก"
  });

  if (choice.isConfirmed) {
    return {
      ok: true,
      mode: "keep",
      signatures: {
        supervisorBase64: "",
        employeeBase64: "",
        interpreterBase64: ""
      }
    };
  }

  if (choice.isDenied) {
    const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
    if (!signRes.ok) return { ok: false };
    return {
      ok: true,
      mode: "new",
      signatures: {
        supervisorBase64: signRes.supervisorBase64 || "",
        employeeBase64: signRes.employeeBase64 || "",
        interpreterBase64: signRes.interpreterBase64 || ""
      }
    };
  }

  return { ok: false };
}

/** ==========================
 *  Files / Signatures / Helpers
 *  ========================== */
async function collectFilesAsBase64(opts = {}) {
  const maxFiles = Number(opts.maxFiles || 6);
  const maxMBEach = Number(opts.maxMBEach || 4);
  const maxBytesEach = maxMBEach * 1024 * 1024;

  const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
  const out = [];

  for (const input of inputs) {
    const edited = EDITED_UPLOAD_STORE.get(input)?.file || null;
    const raw = input.files && input.files[0] ? input.files[0] : null;
    const file = edited || raw;

    if (!file) continue;

    if (file.size > maxBytesEach) {
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์มีขนาดใหญ่เกินไป",
        text: `ไฟล์ ${file.name} มีขนาดเกิน ${maxMBEach} MB`
      });
      throw new Error("FILE_TOO_LARGE");
    }

    const base64 = await readFileAsBase64_(file);
    out.push({
      filename: file.name || "image.jpg",
      name: file.name || "image.jpg",
      mimeType: file.type || "image/jpeg",
      base64
    });

    if (out.length >= maxFiles) break;
  }

  return out;
}

function readFileAsBase64_(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const result = String(fr.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
  if (typeof window.openSignatureModal === "function") {
    return await window.openSignatureModal({
      supervisorName: supervisorName || "",
      employeeName: employeeName || "",
      interpreterName: interpreterName || ""
    });
  }

  await Swal.fire({
    icon: "error",
    title: "ไม่พบระบบลายเซ็น",
    text: "ยังไม่ได้โหลดโมดูลลายเซ็นหรือไม่มีฟังก์ชัน openSignatureModal"
  });

  return { ok: false };
}

function renderGalleryHtml(imageIds) {
  const ids = Array.isArray(imageIds) ? imageIds : [];
  if (!ids.length) return "";

  return `
    <div class="swalGallery">
      ${ids.map((id, idx) => {
        const url = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
        return `
          <button type="button" class="swalGalleryBtn" data-gallery-src="${escapeHtml(url)}" data-gallery-index="${idx + 1}">
            <img src="${escapeHtml(url)}" alt="image-${idx + 1}">
            <span>รูป ${idx + 1}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function bindGalleryClickInSwal() {
  document.querySelectorAll("[data-gallery-src]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const src = btn.getAttribute("data-gallery-src") || "";
      const idx = btn.getAttribute("data-gallery-index") || "";
      if (!src) return;

      await Swal.fire({
        imageUrl: src,
        imageAlt: `รูป ${idx}`,
        width: 960,
        showConfirmButton: false,
        showCloseButton: true
      });
    });
  });
}

/** ==========================
 *  Edit mode helpers
 *  ========================== */
function ensureErrorBolEditBanner_() {
  let bar = document.getElementById("errorBolEditModeBar");
  if (bar) return bar;

  const formCard = $("formCard");
  if (!formCard) return null;

  bar = document.createElement("div");
  bar.id = "errorBolEditModeBar";
  bar.className = "panel hidden";
  bar.style.marginBottom = "12px";
  bar.style.borderStyle = "dashed";
  bar.style.background = "linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%)";

  bar.innerHTML = `
    <div style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap">
      <div>
        <div style="font-size:12px;font-weight:900;color:#1d4ed8">โหมดแก้ไขข้อมูลเดิม</div>
        <div id="errorBolEditModeText" style="font-size:12px;color:#334155">-</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" id="btnCancelErrorBolEditMode" class="btn ghost">ยกเลิกโหมดแก้ไข</button>
      </div>
    </div>
  `;

  formCard.insertBefore(bar, formCard.firstChild);

  const btnCancel = document.getElementById("btnCancelErrorBolEditMode");
  btnCancel?.addEventListener("click", () => {
    clearErrorBolEditMode_();
    resetForm();
  });

  return bar;
}

function setErrorBolEditMode_(meta) {
  ERROR_BOL_FORM_MODE = "edit";
  ERROR_BOL_EDIT_CONTEXT = meta || null;

  const bar = ensureErrorBolEditBanner_();
  const text = document.getElementById("errorBolEditModeText");

  if (bar) bar.classList.remove("hidden");
  if (text) {
    const refNo = String(meta?.refNo || "").trim() || "-";
    const lps = String(meta?.lps || "").trim();
    text.textContent = lps
      ? `กำลังแก้ไข Ref: ${refNo} • ผู้บันทึกเดิม: ${lps}`
      : `กำลังแก้ไข Ref: ${refNo}`;
  }
}

function clearErrorBolEditMode_() {
  ERROR_BOL_FORM_MODE = "create";
  ERROR_BOL_EDIT_CONTEXT = null;
  EXISTING_ERROR_BOL_ASSETS = {
    images: [],
    signatures: {
      interpreter: null,
      supervisor: null,
      employee: null
    }
  };

  const bar = document.getElementById("errorBolEditModeBar");
  if (bar) bar.classList.add("hidden");
}

function ensureErrorBolTabActive_() {
  const formCard = $("formCard");
  const under500Card = $("under500Card") || $("report500Card");
  const tabErrorBol = $("tabErrorBol");
  const tabUnder500 = $("tabUnder500");

  if (formCard) formCard.classList.remove("hidden");
  if (under500Card) under500Card.classList.add("hidden");

  tabErrorBol?.classList.add("active");
  tabUnder500?.classList.remove("active");
}

async function loadErrorBolEditRecord_(refNo) {
  const cleanRef = String(refNo || "").trim();
  if (!cleanRef) {
    await Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้ระบุ Ref",
      text: "กรุณาระบุ Ref:No. ที่ต้องการเรียกกลับมาแก้ไข"
    });
    return;
  }

  ProgressUI?.show?.(
    "กำลังโหลดข้อมูลเดิม",
    "ระบบกำลังค้นหาและเตรียมข้อมูล Error_BOL เพื่อแก้ไข"
  );

  try {
    ProgressUI?.activateOnly?.("validate", 16, "กำลังค้นหาเอกสารจาก Ref");

    const res = await fetch(apiUrl(`/edit/errorbol/${encodeURIComponent(cleanRef)}`), {
      method: "GET",
      cache: "no-store"
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    ProgressUI?.markDone?.("validate", 32, "พบข้อมูลเดิมแล้ว");
    ProgressUI?.activateOnly?.("save", 56, "กำลังเติมข้อมูลกลับเข้าฟอร์ม");

    applyErrorBolEditPayload_(json);

    ProgressUI?.markDone?.("save", 86, "เติมข้อมูลกลับเข้าฟอร์มเรียบร้อย");
    ProgressUI?.activateOnly?.("pdf", 96, "พร้อมแก้ไขข้อมูล");
    await safeDelay(120);
    ProgressUI?.success?.("โหลดข้อมูลสำเร็จ", "ข้อมูลเดิมถูกเติมกลับเข้าฟอร์มแล้ว");
    ProgressUI?.hide?.(400);
  } catch (err) {
    console.error("loadErrorBolEditRecord_ error:", err);
    ProgressUI?.markError?.("save", err?.message || String(err), 100);
    await safeDelay(180);

    await Swal.fire({
      icon: "error",
      title: "โหลดข้อมูลไม่สำเร็จ",
      text: err?.message || String(err)
    });

    ProgressUI?.hide?.(0);
  }
}

function applyErrorBolEditPayload_(payload) {
  const meta = payload?.meta || {};
  const form = payload?.form || {};
  const basic = form.basic || {};
  const reason = form.reason || {};
  const employee = form.employee || {};
  const email = form.email || {};
  const itemLookup = payload?.uiState?.itemLookup || {};
  const disciplineLookup = payload?.uiState?.disciplineLookup || {};
  const assets = payload?.assets || {};

  clearErrorBolEditMode_();
  resetForm();
  ensureErrorBolTabActive_();

  fillErrorBolBasicFields_(basic);
  fillErrorBolReasonFields_(reason);
  fillErrorBolEmployeeFields_(employee);
  fillErrorBolItemLookupState_(itemLookup);
  fillErrorBolEmailState_(email);
  fillErrorBolDisciplineState_(disciplineLookup);
  restoreExistingErrorBolAssets_(assets);

  updateEmployeeConfirmPreview();
  setErrorBolEditMode_(meta);
}

function fillErrorBolBasicFields_(data) {
  setValue_("refNo", extractRefRunningPart_(data?.refNo));
  setRefYearFromFullRef_(data?.refNo);
  setValue_("lps", data?.lps);
  setValue_("labelCid", data?.labelCid);
  setValue_("item", data?.item);
  setValue_("itemDisplay", data?.itemDisplay);
  setValue_("errorCaseQty", data?.errorCaseQty);
  setValue_("errorDate", data?.errorDate);
  setSelectValue_("shift", data?.shift);
}

function fillErrorBolReasonFields_(data) {
  setSelectValue_("errorReason", data?.errorReason);
  syncErrorReasonOtherVisibility();

  setValue_("errorReasonOther", "");
  setValue_("errorDescription", data?.errorDescription);
  setValue_("confirmCauseOther", data?.confirmCauseOther);

  setConfirmCauseSelectionsForEdit_(data?.confirmCauseText);
  syncConfirmCauseOtherVisibility();
}

function fillErrorBolEmployeeFields_(data) {
  setValue_("employeeName", data?.employeeName);
  setValue_("employeeCode", data?.employeeCode);
  setSelectValue_("workAgeYear", data?.workAgeYear);
  setSelectValue_("workAgeMonth", data?.workAgeMonth);
  setSelectValue_("nationality", data?.nationality);
  setValue_("interpreterName", data?.interpreterName);
  setSelectValue_("osm", data?.osm);
  setSelectValue_("otm", data?.otm);
  setSelectValue_("auditName", data?.auditName);
}

function fillErrorBolItemLookupState_(lookup) {
  ITEM_LOOKUP_STATE = {
    item: String(lookup?.item || "").trim(),
    description: String(lookup?.description || "").trim(),
    displayText: String(lookup?.displayText || "").trim(),
    found: !!lookup?.found,
    loading: false
  };

  if ($("item")) $("item").value = ITEM_LOOKUP_STATE.item;
  renderItemLookupState(ITEM_LOOKUP_STATE);
}

function fillErrorBolEmailState_(emailState) {
  const selected = Array.isArray(emailState?.selected) ? emailState.selected : [];
  const custom = Array.isArray(emailState?.custom) ? emailState.custom : [];

  const selectedSet = new Set(selected.map((v) => String(v || "").trim().toLowerCase()));

  document.querySelectorAll(".emailChk").forEach((el) => {
    const value = String(el?.value || el?.dataset?.value || "").trim().toLowerCase();
    el.checked = !!value && selectedSet.has(value);
  });

  const emailOther = $("emailOther");
  if (emailOther) {
    emailOther.value = custom.join(", ");
  }
}

function fillErrorBolDisciplineState_(lookup) {
  window.ERROR_BOL_DISCIPLINE_LOOKUP_STATE = {
    employeeCode: String(lookup?.employeeCode || "").trim(),
    employeeName: String(lookup?.employeeName || "").trim(),
    normalizedEmployeeCode: String(lookup?.normalizedEmployeeCode || "").trim(),
    matchCount: Number(lookup?.matchCount || 0) || 0,
    records: Array.isArray(lookup?.records) ? lookup.records : [],
    attached: !!lookup?.attached,
    searched: !!lookup?.searched
  };
}

function restoreExistingErrorBolAssets_(assets) {
  EXISTING_ERROR_BOL_ASSETS = {
    images: Array.isArray(assets?.images) ? assets.images : [],
    signatures: {
      interpreter: assets?.signatures?.interpreter || null,
      supervisor: assets?.signatures?.supervisor || null,
      employee: assets?.signatures?.employee || null
    }
  };

  restoreExistingErrorBolImages_(EXISTING_ERROR_BOL_ASSETS.images);
  restoreExistingErrorBolSignatureSummary_(EXISTING_ERROR_BOL_ASSETS.signatures);
}

function restoreExistingErrorBolImages_(imageAssets) {
  const images = Array.isArray(imageAssets) ? imageAssets : [];
  buildInitialUploadFields?.();

  const boxes = Array.from(document.querySelectorAll("#uploadList .uploadBox, #uploadList .uploadItem, #uploadList .uploadRow"));
  if (!boxes.length) return;

  boxes.forEach((box, idx) => {
    const input = box.querySelector('input[type="file"]');
    const txt = box.querySelector(".small, .fieldHint");
    const img = box.querySelector(".previewImg, img");

    if (!input) return;

    EDITED_UPLOAD_STORE.delete(input);
    delete input.dataset.existingAssetJson;

    if (img?.dataset?.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      delete img.dataset.objectUrl;
    }

    const asset = images[idx];
    if (!asset) {
      if (img) {
        img.removeAttribute("src");
        img.classList.add("hidden");
      }
      if (txt) txt.textContent = "ยังไม่ได้เลือกรูปภาพ";
      return;
    }

    input.dataset.existingAssetJson = JSON.stringify(asset);

    if (txt) {
      txt.textContent = `ไฟล์เดิม: ${asset.filename || ("image_" + (idx + 1) + ".jpg")}`;
    }

    if (img && asset.previewUrl) {
      img.src = asset.previewUrl;
      img.classList.remove("hidden");
    }

    ensureEditButtonForUploadBox(box, input.id);
  });
}

function restoreExistingErrorBolSignatureSummary_(signatures) {
  const signWrapId = "existingSignatureSummary";
  let el = document.getElementById(signWrapId);

  if (!el) {
    const formCard = $("formCard");
    if (!formCard) return;

    el = document.createElement("div");
    el.id = signWrapId;
    el.className = "fieldHint";
    el.style.marginTop = "10px";
    el.style.fontWeight = "800";

    const actions = formCard.querySelector(".actions");
    if (actions && actions.parentNode) {
      actions.parentNode.insertBefore(el, actions);
    } else {
      formCard.appendChild(el);
    }
  }

  const labels = [];
  if (signatures?.supervisor?.keep && signatures?.supervisor?.fileId) labels.push("หัวหน้างาน");
  if (signatures?.employee?.keep && signatures?.employee?.fileId) labels.push("พนักงาน");
  if (signatures?.interpreter?.keep && signatures?.interpreter?.fileId) labels.push("ล่าม");

  el.textContent = labels.length
    ? `มีลายเซ็นเดิมในเอกสารนี้: ${labels.join(", ")}`
    : "";
}

function setConfirmCauseSelectionsForEdit_(rawText) {
  const values = splitMultiTextForEdit_(rawText);
  const set = new Set(values.map((v) => String(v || "").trim()));

  document.querySelectorAll(".confirmCauseChk").forEach((el) => {
    const value = String(el?.value || el?.dataset?.value || "").trim();
    el.checked = set.has(value);
  });
}

function splitMultiTextForEdit_(text) {
  return String(text || "")
    .split(/[\n,;|]+/)
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function setValue_(id, value) {
  const el = $(id);
  if (!el) return;
  el.value = value == null ? "" : String(value);
}

function setSelectValue_(id, value) {
  const el = $(id);
  if (!el) return;

  const normalized = value == null ? "" : String(value);
  const hasOption = Array.from(el.options || []).some((opt) => String(opt.value) === normalized);

  if (!hasOption && normalized) {
    const opt = document.createElement("option");
    opt.value = normalized;
    opt.textContent = normalized;
    opt.dataset.injected = "true";
    el.appendChild(opt);
  }

  el.value = normalized;
}

function extractRefRunningPart_(fullRef) {
  const s = String(fullRef || "").trim();
  if (!s) return "";
  return s.split("-")[0].trim();
}

function setRefYearFromFullRef_(fullRef) {
  const s = String(fullRef || "").trim();
  if (!s) return;

  const parts = s.split("-");
  const year = parts.length > 1 ? String(parts[parts.length - 1] || "").trim() : "";

  const refYear = $("refYear");
  if (!refYear || !year) return;

  const hasOption = Array.from(refYear.options || []).some((opt) => String(opt.value) === year);
  if (!hasOption) {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    refYear.appendChild(opt);
  }
  refYear.value = year;
}

function resetForm() {
  const form = $("formCard");
  form?.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el.id === "lps") return;
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = false;
    } else {
      el.value = "";
    }
  });

  buildYearOptions();
  if ($("lps")) $("lps").value = AUTH.name || "";
  ITEM_LOOKUP_STATE = {
    item: "",
    description: "",
    displayText: "",
    found: false,
    loading: false
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  buildInitialUploadFields();
  renderEmailSelector();
  renderConfirmCauseSelector();
  syncErrorReasonOtherVisibility();
  syncConfirmCauseOtherVisibility();
  updateEmployeeConfirmPreview();
}

window.loadErrorBolEditRecord_ = loadErrorBolEditRecord_;
window.clearErrorBolEditMode_ = clearErrorBolEditMode_;

document.addEventListener("DOMContentLoaded", init);
