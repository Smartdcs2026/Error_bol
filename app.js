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

//   bindDuplicateRefCheck_("refNo", "refYear", "error_bol");
//   bindDuplicateRefCheck_("rptRefNo", "rptRefYear", "report500");
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
//  *  REF DUPLICATE CHECK HELPERS
//  *  เพิ่มใน app.js
//  *  ========================== */

// const REF_DUPLICATE_STATE = {
//   errorBol: {
//     lastRefNo: "",
//     duplicated: false,
//     checked: false,
//     result: null
//   },
//   report500: {
//     lastRefNo: "",
//     duplicated: false,
//     checked: false,
//     result: null
//   }
// };

// function getRefDuplicateState_(formType) {
//   return formType === "report500"
//     ? REF_DUPLICATE_STATE.report500
//     : REF_DUPLICATE_STATE.errorBol;
// }

// function normalizeFrontendRefNo_(value) {
//   return String(value || "")
//     .replace(/\u00A0/g, " ")
//     .replace(/[\u200B-\u200D\uFEFF]/g, "")
//     .replace(/[–—]/g, "-")
//     .replace(/\s+/g, "")
//     .trim();
// }

// function getErrorBolRefHintEl_() {
//   return document.getElementById("refDuplicateHint");
// }

// function getErrorBolRefWrapEl_() {
//   return document.getElementById("refDuplicateWrap");
// }

// function getReportRefHintEl_() {
//   return document.getElementById("rptRefDuplicateHint");
// }

// function getReportRefWrapEl_() {
//   return document.getElementById("rptRefDuplicateWrap");
// }

// function setRefDuplicateHint_(formType, message, isError = false) {
//   const el = formType === "report500"
//     ? getReportRefHintEl_()
//     : getErrorBolRefHintEl_();

//   const wrap = formType === "report500"
//     ? getReportRefWrapEl_()
//     : getErrorBolRefWrapEl_();

//   if (!el || !wrap) return;

//   const raw = String(message || "").trim();

//   if (!raw) {
//     el.innerHTML = "";
//     wrap.classList.add("hidden");
//     return;
//   }

//   const formatted = raw
//     .replace(/^เลขอ้างอิงซ้ำ\s*/i, "")
//     .replace(/Ref ที่กรอก:/g, "||Ref ที่กรอก:")
//     .replace(/Ref มาตรฐาน:/g, "||Ref มาตรฐาน:")
//     .replace(/ซ้ำกับเอกสาร Error_BOL เดิม:/g, "||ซ้ำกับเอกสาร Error_BOL เดิม:")
//     .replace(/ซ้ำกับ Report เดิม:/g, "||ซ้ำกับ Report เดิม:")
//     .split("||")
//     .map(s => s.trim())
//     .filter(Boolean);

//   el.innerHTML = formatted.map((line, idx) => {
//     const cls = idx < 2 ? "refDupLine refDupMain" : "refDupLine refDupMeta";
//     const block = idx === 2 ? " refDupBlock" : "";
//     return `<span class="${cls}${block}">${escapeHtml(line)}</span>`;
//   }).join("");

//   wrap.classList.remove("hidden");
// }
// function setRefFieldInvalidState_(formType, invalid) {
//   const runningEl = formType === "report500"
//     ? document.getElementById("rptRefNo")
//     : document.getElementById("refNo");

//   const yearEl = formType === "report500"
//     ? document.getElementById("rptRefYear")
//     : document.getElementById("refYear");

//   [runningEl, yearEl].forEach((el) => {
//     if (!el) return;
//     el.classList.toggle("is-invalid", !!invalid);
//   });
// }

// function resetRefDuplicateUi_(formType) {
//   const state = getRefDuplicateState_(formType);
//   state.lastRefNo = "";
//   state.duplicated = false;
//   state.checked = false;
//   state.result = null;

//   const hintEl = formType === "report500"
//     ? getReportRefHintEl_()
//     : getErrorBolRefHintEl_();

//   const wrapEl = formType === "report500"
//     ? getReportRefWrapEl_()
//     : getErrorBolRefWrapEl_();

//   if (hintEl) hintEl.innerHTML = "";
//   if (wrapEl) wrapEl.classList.add("hidden");

//   setRefFieldInvalidState_(formType, false);
// }
// function buildDuplicateDetailHtml_(result) {
//   const matched = result?.matched || {};
//   const sourceSystem = String(matched?.sourceSystem || result?.system || "").trim().toUpperCase();

//   const systemLabel = sourceSystem === "REPORT500" ? "Report500" : "Error_BOL";
//   const titleText = sourceSystem === "REPORT500"
//     ? "พบเลขอ้างอิงซ้ำกับเอกสารในระบบ Report"
//     : "พบเลขอ้างอิงซ้ำกับเอกสารในระบบ Error_BOL";

//   const commonTop = `
//     <div class="swalKv"><div class="swalKvLabel">ระบบที่พบข้อมูลซ้ำ</div><div class="swalKvValue">${escapeHtml(systemLabel)}</div></div>
//     <div class="swalKv"><div class="swalKvLabel">Ref ที่กรอก</div><div class="swalKvValue">${escapeHtml(result?.inputRefNo || "-")}</div></div>
//     <div class="swalKv"><div class="swalKvLabel">Ref มาตรฐาน</div><div class="swalKvValue">${escapeHtml(result?.rootRefComparable || "-")}</div></div>
//     <div class="swalKv"><div class="swalKvLabel">Ref เดิม</div><div class="swalKvValue">${escapeHtml(matched.refNo || "-")}</div></div>
//     <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(matched.revisionLabel || "-")}</div></div>
//   `;

//   const detailHtml = sourceSystem === "REPORT500"
//     ? `
//       <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(matched.subject || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">Reported by</div><div class="swalKvValue">${escapeHtml(matched.reportedBy || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.incidentDate || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">สถานที่</div><div class="swalKvValue">${escapeHtml(matched.whereDidItHappen || "-")}</div></div>
//     `
//     : `
//       <div class="swalKv"><div class="swalKvLabel">พนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeName || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">รหัสพนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeCode || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">สาเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorReason || "-")}</div></div>
//       <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorDate || "-")}</div></div>
//     `;

//   return `
//     <div class="swalSummary" style="text-align:left">
//       <div class="swalSection">
//         <div class="swalSectionTitle">${escapeHtml(titleText)}</div>
//         <div class="swalKvGrid">
//           ${commonTop}
//           ${detailHtml}
//         </div>
//       </div>
//     </div>
//   `;
// }

// async function checkRefDuplicate_(formType, refNo, opts = {}) {
//   const state = getRefDuplicateState_(formType);
//   const normalizedRef = normalizeFrontendRefNo_(refNo);

//   if (!normalizedRef) {
//     resetRefDuplicateUi_(formType);
//     return {
//       ok: true,
//       duplicated: false,
//       skipped: true,
//       result: null
//     };
//   }

//   if (!opts.force && state.checked && state.lastRefNo === normalizedRef && state.result) {
//     if (state.duplicated) {
//       setRefDuplicateHint_(formType, state.result.message || "เลขอ้างอิงซ้ำ", true);
//       setRefFieldInvalidState_(formType, true);
//     } else {
//       resetRefDuplicateUi_(formType);
//     }
//     return {
//       ok: true,
//       duplicated: state.duplicated,
//       cached: true,
//       result: state.result
//     };
//   }

//   const url = `${apiUrl("/checkRefDuplicate")}?formType=${encodeURIComponent(formType)}&refNo=${encodeURIComponent(normalizedRef)}`;

//   let json = {};
//   const res = await fetch(url, {
//     method: "GET",
//     cache: "no-store"
//   });

//   const text = await res.text();
//   try {
//     json = JSON.parse(text);
//   } catch (_) {
//     throw new Error("Backend ตอบกลับไม่ใช่ JSON");
//   }

//   if (!res.ok || !json.ok) {
//     throw new Error(json?.message || json?.error || `ตรวจสอบ Ref ไม่สำเร็จ (HTTP ${res.status})`);
//   }

//   state.lastRefNo = normalizedRef;
//   state.duplicated = !!json.duplicated;
//   state.checked = true;
//   state.result = json;

//   if (json.duplicated) {
//     setRefDuplicateHint_(formType, json.message || "เลขอ้างอิงซ้ำ", true);
//     setRefFieldInvalidState_(formType, true);
//   } else {
//     resetRefDuplicateUi_(formType);
//   }

//   return {
//     ok: true,
//     duplicated: !!json.duplicated,
//     result: json
//   };
// }

// async function showDuplicateRefAlert_(result) {
//   await Swal.fire({
//     icon: "warning",
//     title: "เลขอ้างอิงซ้ำ",
//     html: buildDuplicateDetailHtml_(result),
//     width: 920,
//     confirmButtonText: "กลับไปแก้ไข Ref"
//   });
// }

// function bindDuplicateRefCheck_(runningId, yearId, formType) {
//   const runningEl = document.getElementById(runningId);
//   const yearEl = document.getElementById(yearId);
//   if (!runningEl || !yearEl) return;

//   let timer = null;

//   const schedule = () => {
//     if (timer) clearTimeout(timer);

//     const refNo = formType === "report500"
//       ? (typeof window.getRptRefNoValue === "function" ? window.getRptRefNoValue() : "")
//       : (typeof window.getRefNoValue === "function" ? window.getRefNoValue() : "");

//     if (!normalizeFrontendRefNo_(refNo)) {
//       resetRefDuplicateUi_(formType);
//       return;
//     }

//     timer = setTimeout(async () => {
//       try {
//         await checkRefDuplicate_(formType, refNo, { force: true });
//       } catch (err) {
//         console.error("checkRefDuplicate failed:", err);
//       }
//     }, 320);
//   };

//   runningEl.addEventListener("input", schedule);
//   runningEl.addEventListener("change", schedule);
//   yearEl.addEventListener("change", schedule);
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

//   try {
//     const dup = await checkRefDuplicate_("error_bol", getRefNoValue(), { force: true });
//     if (dup.duplicated) {
//       await showDuplicateRefAlert_(dup.result);
//       $("refNo")?.focus();
//       return;
//     }
//   } catch (dupErr) {
//     return Swal.fire({
//       icon: "error",
//       title: "ตรวจสอบ Ref ไม่สำเร็จ",
//       text: dupErr?.message || String(dupErr),
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
//     ProgressUI.activateOnly("validate", 10, "กำลังตรวจสอบ Ref และข้อมูล");

//     const dupBeforeSend = await checkRefDuplicate_("error_bol", getRefNoValue(), { force: true });
//     if (dupBeforeSend.duplicated) {
//       ProgressUI.markError("validate", "เลขอ้างอิงซ้ำ", 10);
//       ProgressUI.hide(150);
//       await showDuplicateRefAlert_(dupBeforeSend.result);
//       $("refNo")?.focus();
//       return;
//     }

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

//     await Swal.fire({
//       icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
//       title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
//       showConfirmButton: false,
//       width: 920,
//       html: `
//         <div class="swalSummary">
//           <div class="swalHero">
//             <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
//             <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ ลายเซ็น และเอกสาร PDF เรียบร้อย</div>
//             <div class="swalPillRow">
//               <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
//               <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
//               <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
//             </div>
//           </div>

//           <div class="swalSection">
//             <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
//             <div class="swalKvGrid">
//               <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
//               <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div></div>
//               <div class="swalKv"><div class="swalKvLabel">Label CID</div><div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div></div>
//               <div class="swalKv"><div class="swalKvLabel">ขนาด PDF</div><div class="swalKvValue">${escapeHtml(pdfSizeText)}</div></div>
//             </div>
//           </div>

//           <div class="swalSection">
//             <div class="swalSectionTitle">สถานะอีเมล</div>
//             ${
//               emailInfo.emailSkipped
//                 ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
//                 : emailInfo.emailOk
//                   ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailInfo.emailResult.count || 0)} รายการ ${emailInfo.emailResult.attachmentMode ? `• ${escapeHtml(emailInfo.emailResult.attachmentMode)}` : ""}</div>`
//                   : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailResult.error || "-")}</div>`
//             }
//           </div>

//           <div class="swalSection">
//             <div class="swalSectionTitle">ลายเซ็น</div>
//             <div class="sigGrid">
//               <div>
//                 <div class="sigBoxTitle">หัวหน้างาน</div>
//                 ${supSignThumb}
//                 <div class="sigName">${escapeHtml(p.otm || "-")}</div>
//               </div>
//               <div>
//                 <div class="sigBoxTitle">พนักงาน</div>
//                 ${empSignThumb}
//                 <div class="sigName">${escapeHtml(p.employeeName || "-")}</div>
//               </div>
//               <div>
//                 <div class="sigBoxTitle">ล่ามแปลภาษา</div>
//                 ${intSignThumb}
//                 <div class="sigName">${escapeHtml(p.interpreterName || "-")}</div>
//               </div>
//             </div>
//           </div>

//           <div class="swalSection">
//             <div class="swalSectionTitle">รูปภาพแนบ</div>
//             ${galleryHtml || `<div class="swalNote">ไม่มีรูปภาพแนบ</div>`}
//           </div>

//           <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
//             ${
//               json.pdfUrl
//                 ? `<button type="button" id="btnOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
//                 : ``
//             }
//             <button type="button" id="btnCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
//           </div>
//         </div>
//       `,
//       didOpen: () => {
//         bindGalleryClickInSwal();

//         const btnOpen = document.getElementById("btnOpenPdfAfterSave");
//         const btnClose = document.getElementById("btnCloseAfterSave");

//         if (btnOpen && json.pdfUrl) {
//           btnOpen.addEventListener("click", () => {
//             window.open(json.pdfUrl, "_blank", "noopener,noreferrer");
//             Swal.close();
//           });
//         }

//         if (btnClose) {
//           btnClose.addEventListener("click", () => {
//             Swal.close();
//           });
//         }
//       },
//       willClose: () => {
//         resetRefDuplicateUi_("error_bol");
//         resetForm();
//       }
//     });

//     return json;
//   } catch (err2) {
//     console.error(err2);
//     ProgressUI.markError("save", err2?.message || "เกิดข้อผิดพลาด", 58);
//     ProgressUI.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

//     await Swal.fire({
//       icon: "error",
//       title: "บันทึกไม่สำเร็จ",
//       text: err2?.message || String(err2),
//       confirmButtonText: "ตกลง"
//     });
//   } finally {
//     ProgressUI.hide(180);
//   }
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
      try {
        URL.revokeObjectURL(img.dataset.objectUrl);
      } catch (_) {}
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
    .replace(/\"/g, "&quot;")
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
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    return s;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return s;
}

function formatDateTimeToDisplay(value) {
  const s = String(value || "").trim();
  if (!s) return "-";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function parseJsonSafe(text, fallback) {
  try {
    const parsed = JSON.parse(String(text || ""));
    return parsed == null ? fallback : parsed;
  } catch (_) {
    return fallback;
  }
}

function splitEmails(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map((v) => norm(v))
    .filter(Boolean);
}

function uniqueEmails(list) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((v) => {
    const email = norm(v).toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (seen.has(email)) return;
    seen.add(email);
    out.push(email);
  });
  return out;
}

function fileNameFromMeta(meta, fallback = "file") {
  if (!meta || typeof meta !== "object") return fallback;
  return norm(meta.filename || meta.name || fallback) || fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function setReadonlyValue(id, value) {
  const el = $(id);
  if (!el) return;
  el.value = value == null ? "" : String(value);
}

function setSelectValueIfExists(id, value) {
  const el = $(id);
  if (!el) return;
  const val = String(value == null ? "" : value);
  const hasOption = Array.from(el.options || []).some((opt) => String(opt.value) === val);
  if (hasOption) el.value = val;
}

function ensureOptionExists(selectEl, value, label) {
  if (!selectEl) return;
  const v = String(value == null ? "" : value);
  if (!v) return;
  const found = Array.from(selectEl.options || []).some((opt) => String(opt.value) === v);
  if (found) return;
  const opt = document.createElement("option");
  opt.value = v;
  opt.textContent = String(label == null ? v : label);
  selectEl.appendChild(opt);
}

function bindOtherSelect(selectId, otherId, triggerText = "อื่นๆ") {
  const selectEl = $(selectId);
  const otherEl = $(otherId);
  if (!selectEl || !otherEl) return;

  const sync = () => {
    const isOther = norm(selectEl.value) === triggerText;
    otherEl.classList.toggle("hidden", !isOther);
    if (!isOther) otherEl.value = "";
  };

  selectEl.removeEventListener("change", sync);
  selectEl.addEventListener("change", sync);
  sync();
}

function ensureArrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function getFileInputEffectiveFile(input) {
  if (!input) return null;
  return EDITED_UPLOAD_STORE.get(input)?.file || (input.files && input.files[0] ? input.files[0] : null);
}

function buildMetaBadgeText(meta, fallbackPrefix = "ไฟล์เดิม") {
  if (!meta || typeof meta !== "object") return "";
  const name = fileNameFromMeta(meta, "file");
  const size = Number(meta.size || 0);
  const sizeText = size > 0 ? ` (${Math.round(size / 1024)} KB)` : "";
  return `${fallbackPrefix}: ${name}${sizeText}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;
      resolve(base64 || "");
    };
    reader.onerror = () => reject(reader.error || new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function collectFilesAsBase64(opts = {}) {
  const maxFiles = Number(opts.maxFiles || 6);
  const maxBytesEach = Number(opts.maxMBEach || 4) * 1024 * 1024;
  const inputs = Array.from(document.querySelectorAll("#formCard input[type='file']"));
  const picked = [];

  inputs.forEach((input) => {
    const file = getFileInputEffectiveFile(input);
    if (file) picked.push({ input, file });
  });

  if (picked.length > maxFiles) {
    throw new Error(`อัปโหลดรูปได้ไม่เกิน ${maxFiles} ไฟล์`);
  }

  const out = [];
  for (const { file } of picked) {
    if (Number(file.size || 0) > maxBytesEach) {
      throw new Error(`ไฟล์ ${file.name} มีขนาดเกิน ${opts.maxMBEach || 4} MB`);
    }
    const base64 = await fileToBase64(file);
    out.push({
      filename: file.name || "image.jpg",
      mimeType: file.type || "image/jpeg",
      base64
    });
  }

  return out;
}

function safeSetLoginMsg(message, isError = false) {
  const el = $("loginMsg");
  if (!el) return;
  el.textContent = message || "";
  el.style.color = isError ? "#dc2626" : "#166534";
}

function setLoginUserName(name) {
  const wrap = $("topLoginUserWrap");
  const label = $("topLoginUserName");
  const safeName = norm(name);
  if (label) label.textContent = safeName || "-";
  if (wrap) wrap.classList.toggle("hidden", !safeName);
}

function setModeTabsVisible(visible) {
  $("modeTabs")?.classList.toggle("hidden", !visible);
}

function setMainMode(mode) {
  const isReport = mode === "report500";
  $("tabErrorBol")?.classList.toggle("active", !isReport);
  $("tabUnder500")?.classList.toggle("active", isReport);
  $("formCard")?.classList.toggle("hidden", isReport);
  $("report500Card")?.classList.toggle("hidden", !isReport);
}

function setLogos() {
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

function setRefDuplicateHint_(formType, message) {
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
    .map((s) => s.trim())
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

  runningEl?.classList.toggle("is-invalid", !!invalid);
  yearEl?.classList.toggle("is-invalid", !!invalid);
}

function resetRefDuplicateUi_(formType) {
  const hint = formType === "report500"
    ? getReportRefHintEl_()
    : getErrorBolRefHintEl_();
  const wrap = formType === "report500"
    ? getReportRefWrapEl_()
    : getErrorBolRefWrapEl_();

  if (hint) hint.innerHTML = "";
  if (wrap) wrap.classList.add("hidden");
  setRefFieldInvalidState_(formType, false);

  const state = getRefDuplicateState_(formType);
  state.duplicated = false;
  state.checked = false;
  state.result = null;
}

async function checkRefDuplicate_(formType, refNo, opts = {}) {
  const force = !!opts.force;
  const safeType = formType === "report500" ? "report500" : "error_bol";
  const normalizedRef = normalizeFrontendRefNo_(refNo);

  if (!normalizedRef) {
    resetRefDuplicateUi_(safeType === "report500" ? "report500" : "error_bol");
    return {
      ok: true,
      duplicated: false,
      skipped: true,
      result: null
    };
  }

  const state = getRefDuplicateState_(safeType === "report500" ? "report500" : "error_bol");
  if (!force && state.checked && state.lastRefNo === normalizedRef) {
    return {
      ok: true,
      duplicated: !!state.duplicated,
      result: state.result
    };
  }

  const url = `${apiUrl("/checkRefDuplicate")}?formType=${encodeURIComponent(safeType)}&refNo=${encodeURIComponent(normalizedRef)}`;
  const res = await fetch(url, {
    method: "GET",
    cache: force ? "no-store" : "default"
  });

  const text = await res.text();
  let json = {};

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
    setRefDuplicateHint_(safeType === "report500" ? "report500" : "error_bol", json.message || "เลขอ้างอิงซ้ำ");
    setRefFieldInvalidState_(safeType === "report500" ? "report500" : "error_bol", true);
  } else {
    resetRefDuplicateUi_(safeType === "report500" ? "report500" : "error_bol");
  }

  return {
    ok: true,
    duplicated: !!json.duplicated,
    result: json
  };
}

function bindDuplicateRefCheck_(runningId, yearId, formType) {
  const runningEl = $(runningId);
  const yearEl = $(yearId);
  if (!runningEl || !yearEl) return;

  let timer = null;
  const safeType = formType === "report500" ? "report500" : "error_bol";

  const schedule = () => {
    if (timer) clearTimeout(timer);
    const refNo = safeType === "report500" ? getRptRefNoValue() : getRefNoValue();
    if (!norm(refNo)) {
      resetRefDuplicateUi_(safeType);
      return;
    }
    timer = setTimeout(async () => {
      try {
        await checkRefDuplicate_(safeType, refNo, { force: true });
      } catch (err) {
        console.error("checkRefDuplicate failed:", err);
      }
    }, 320);
  };

  runningEl.addEventListener("input", schedule);
  runningEl.addEventListener("change", schedule);
  yearEl.addEventListener("change", schedule);
}

async function showDuplicateRefAlert_(result) {
  const matched = result?.matched || {};
  const sourceSystem = String(matched?.sourceSystem || result?.system || "").trim().toUpperCase();
  const systemLabel = sourceSystem === "REPORT500" ? "Report500" : "Error_BOL";
  const titleText = sourceSystem === "REPORT500"
    ? "ไม่สามารถบันทึก Error_BOL ได้ เนื่องจาก Ref นี้ถูกใช้ในระบบ Report500 แล้ว"
    : "ไม่สามารถบันทึก Error_BOL ได้ เนื่องจาก Ref นี้ถูกใช้ในระบบ Error_BOL แล้ว";

  const html = `
    <div class="swalSummary">
      <div class="swalHero">
        <div class="swalHeroTitle">${escapeHtml(titleText)}</div>
        <div class="swalHeroSub">กรุณาตรวจสอบ Ref ก่อนทำรายการต่อ</div>
      </div>
      <div class="swalSection">
        <div class="swalSectionTitle">รายละเอียด Ref ที่ซ้ำ</div>
        <div class="swalKvGrid">
          <div class="swalKv"><div class="swalKvLabel">ระบบที่พบข้อมูลซ้ำ</div><div class="swalKvValue">${escapeHtml(systemLabel)}</div></div>
          <div class="swalKv"><div class="swalKvLabel">Ref ที่กรอก</div><div class="swalKvValue">${escapeHtml(result?.inputRefNo || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">Ref มาตรฐาน</div><div class="swalKvValue">${escapeHtml(result?.rootRefComparable || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">Ref เดิม</div><div class="swalKvValue">${escapeHtml(matched.refNo || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(matched.revisionLabel || "-")}</div></div>
        </div>
      </div>
    </div>
  `;

  await Swal.fire({
    icon: "warning",
    title: "เลขอ้างอิงซ้ำ",
    html,
    width: 860,
    confirmButtonText: "ตกลง"
  });
}

/** ==========================
 *  OPTIONS / AUTH
 *  ========================== */
async function loadOptions() {
  const res = await fetch(`${apiUrl("/options")}?t=${Date.now()}`, { method: "GET", cache: "no-store" });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "โหลดข้อมูลตัวเลือกไม่สำเร็จ");

  OPTIONS = {
    errorList: normalizeArray(json.errorList),
    auditList: normalizeArray(json.auditList),
    emailList: normalizeArray(json.emailList),
    osmList: normalizeArray(json.osmList),
    otmList: normalizeArray(json.otmList),
    confirmCauseList: normalizeArray(json.confirmCauseList),
    nationalityList: normalizeArray(json.nationalityList)
  };

  window.OPTIONS = OPTIONS;
}

async function login() {
  const pass = norm($("loginPass")?.value);
  if (!pass) {
    safeSetLoginMsg("กรุณากรอกรหัสผ่าน", true);
    return;
  }

  safeSetLoginMsg("กำลังตรวจสอบรหัสผ่าน...");

  const res = await fetch(apiUrl("/"), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "auth", pass })
  });

  const json = await res.json();
  if (!res.ok || !json?.ok) {
    safeSetLoginMsg(json?.error || `เข้าสู่ระบบไม่สำเร็จ (HTTP ${res.status})`, true);
    return;
  }

  AUTH = { name: norm(json.name), pass };
  window.AUTH = AUTH;
  safeSetLoginMsg("เข้าสู่ระบบสำเร็จ");
  setLoginUserName(AUTH.name);

  $("loginCard")?.classList.add("hidden");
  setModeTabsVisible(true);
  setMainMode("error_bol");

  setReadonlyValue("lps", AUTH.name);
  if (window.Report500App && typeof window.Report500App.onAuthReady === "function") {
    window.Report500App.onAuthReady(AUTH);
  }
}

/** ==========================
 *  ITEM LOOKUP
 *  ========================== */
function resetItemLookupState() {
  ITEM_LOOKUP_STATE = {
    item: "",
    description: "",
    displayText: "",
    found: false,
    loading: false
  };
  updateItemLookupUi();
}

function updateItemLookupUi() {
  const hint = $("itemLookupHint");
  if (!hint) return;

  if (ITEM_LOOKUP_STATE.loading) {
    hint.textContent = "กำลังค้นหารายการสินค้า...";
    return;
  }

  if (!norm(ITEM_LOOKUP_STATE.item)) {
    hint.textContent = "";
    return;
  }

  hint.textContent = ITEM_LOOKUP_STATE.displayText || ITEM_NOT_FOUND_TEXT;
  const itemDisplay = $("itemDisplay");
  if (itemDisplay) itemDisplay.value = ITEM_LOOKUP_STATE.displayText || ITEM_NOT_FOUND_TEXT;
}

async function lookupItemNow(item) {
  const cleanItem = String(item || "").replace(/[^\d]/g, "").trim();
  ITEM_LOOKUP_STATE.item = cleanItem;

  if (!cleanItem || cleanItem.length < ITEM_LOOKUP_MIN_LEN) {
    resetItemLookupState();
    if ($("itemDisplay")) $("itemDisplay").value = "";
    return;
  }

  if (ITEM_LOCAL_CACHE.has(cleanItem)) {
    const cached = ITEM_LOCAL_CACHE.get(cleanItem);
    ITEM_LOOKUP_STATE = { ...cached, loading: false };
    updateItemLookupUi();
    updateEmployeeConfirmPreview();
    return;
  }

  ITEM_LOOKUP_STATE.loading = true;
  updateItemLookupUi();

  try {
    const res = await fetch(`${apiUrl("/itemLookup")}?item=${encodeURIComponent(cleanItem)}`, {
      method: "GET",
      cache: "no-store"
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) throw new Error(json?.error || `ค้นหา Item ไม่สำเร็จ (HTTP ${res.status})`);

    const next = {
      item: cleanItem,
      description: norm(json.description),
      displayText: norm(json.displayText),
      found: !!json.found,
      loading: false
    };

    ITEM_LOCAL_CACHE.set(cleanItem, next);
    ITEM_LOOKUP_STATE = next;
    updateItemLookupUi();
    updateEmployeeConfirmPreview();
  } catch (err) {
    ITEM_LOOKUP_STATE = {
      item: cleanItem,
      description: ITEM_NOT_FOUND_TEXT,
      displayText: `${cleanItem} - ${ITEM_NOT_FOUND_TEXT}`,
      found: false,
      loading: false
    };
    updateItemLookupUi();
    console.error(err);
  }
}

function scheduleItemLookup() {
  if (itemLookupTimer) clearTimeout(itemLookupTimer);
  itemLookupTimer = setTimeout(() => {
    lookupItemNow($("item")?.value || "");
  }, ITEM_LOOKUP_DEBOUNCE_MS);
}

function getItemDisplayText() {
  return norm($("itemDisplay")?.value);
}

/** ==========================
 *  DISCIPLINE LOOKUP (Error_BOL lightweight)
 *  ========================== */
let DISCIPLINE_LOOKUP_STATE = {
  employeeCode: "",
  employeeName: "",
  records: [],
  matchCount: 0,
  searched: false
};

function resetDisciplineLookupState() {
  DISCIPLINE_LOOKUP_STATE = {
    employeeCode: "",
    employeeName: "",
    records: [],
    matchCount: 0,
    searched: false
  };
}

async function lookupDisciplineByEmployeeCode(employeeCode) {
  const clean = norm(employeeCode);
  if (!clean) {
    resetDisciplineLookupState();
    return DISCIPLINE_LOOKUP_STATE;
  }

  const res = await fetch(`${apiUrl("/disciplineLookup")}?employeeCode=${encodeURIComponent(clean)}`, {
    method: "GET",
    cache: "no-store"
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.error || `ค้นหาวินัยไม่สำเร็จ (HTTP ${res.status})`);

  DISCIPLINE_LOOKUP_STATE = {
    employeeCode: clean,
    employeeName: norm(json.employeeName),
    records: normalizeArray(json.records),
    matchCount: Number(json.matchCount || 0),
    searched: true
  };

  return DISCIPLINE_LOOKUP_STATE;
}

/** ==========================
 *  FORM BINDING / OPTIONS RENDER
 *  ========================== */
function renderSelectOptions(selectId, list, placeholder = "-- กรุณาเลือก --") {
  const el = $(selectId);
  if (!el) return;
  const items = normalizeArray(list).map((v) => ({
    value: typeof v === "object" ? norm(v.value || v.label || v.name) : norm(v),
    label: typeof v === "object" ? norm(v.label || v.value || v.name) : norm(v)
  })).filter((x) => x.value);

  el.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...items.map((x) => `<option value="${escapeHtml(x.value)}">${escapeHtml(x.label)}</option>`)
  ].join("");
}

function renderEmailChecklist() {
  const root = $("emailChecklist");
  if (!root) return;
  const items = normalizeArray(OPTIONS.emailList);
  if (!items.length) {
    root.innerHTML = '<div class="emailEmpty">ยังไม่มีรายการอีเมล</div>';
    return;
  }

  root.innerHTML = items.map((item, idx) => {
    const email = typeof item === "object" ? norm(item.email || item.value || item.label || item.name) : norm(item);
    const label = typeof item === "object" ? norm(item.label || item.name || item.email || item.value) : norm(item);
    const id = `emailChk_${idx}`;
    return `
      <label class="emailItem" for="${id}">
        <input id="${id}" class="emailChk" type="checkbox" value="${escapeHtml(email)}">
        <span class="emailCheckBox"></span>
        <span class="emailText">${escapeHtml(label)}</span>
      </label>
    `;
  }).join("");
}

function renderConfirmCauseOptions() {
  const root = $("confirmCauseList");
  if (!root) return;
  const items = normalizeArray(OPTIONS.confirmCauseList);
  if (!items.length) {
    root.innerHTML = '<div class="confirmCauseEmpty">ยังไม่มีรายการสาเหตุประกอบ</div>';
    return;
  }

  root.innerHTML = items.map((item, idx) => {
    const text = typeof item === "object" ? norm(item.value || item.label || item.name) : norm(item);
    const id = `confirmCause_${idx}`;
    return `
      <label class="confirmCauseCard" for="${id}">
        <input id="${id}" class="confirmCauseChk" type="checkbox" value="${escapeHtml(text)}">
        <span class="confirmCauseMark"></span>
        <span class="confirmCauseText">${escapeHtml(text)}</span>
      </label>
    `;
  }).join("");
}

function renderErrorBolOptions() {
  renderSelectOptions("errorReason", OPTIONS.errorList, "-- เลือกสาเหตุหลัก --");
  renderSelectOptions("auditName", OPTIONS.auditList, "-- เลือก AUDIT --");
  renderSelectOptions("osm", OPTIONS.osmList, "-- เลือก OSM --");
  renderSelectOptions("otm", OPTIONS.otmList, "-- เลือก OTM --");
  renderSelectOptions("nationality", OPTIONS.nationalityList, "-- เลือกสัญชาติ --");
  renderEmailChecklist();
  renderConfirmCauseOptions();
  bindOtherSelect("errorReason", "errorReasonOther", "อื่นๆ");
}

function bindErrorBolInputs() {
  $("item")?.addEventListener("input", () => {
    const el = $("item");
    if (!el) return;
    el.value = String(el.value || "").replace(/[^\d]/g, "");
    scheduleItemLookup();
  });

  $("employeeCode")?.addEventListener("change", async () => {
    const val = norm($("employeeCode")?.value);
    if (!val) return;
    try {
      await lookupDisciplineByEmployeeCode(val);
    } catch (err) {
      console.error(err);
    }
  });

  [
    "employeeName",
    "employeeCode",
    "errorDate",
    "shift",
    "errorReason",
    "errorReasonOther",
    "errorCaseQty",
    "confirmCauseOther"
  ].forEach((id) => {
    $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
    $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
  });

  document.addEventListener("change", (ev) => {
    if (ev.target && ev.target.classList && ev.target.classList.contains("confirmCauseChk")) {
      updateEmployeeConfirmPreview();
    }
  });

  const uploadMap = [
    ["uploadImage1", "uploadBox1"],
    ["uploadImage2", "uploadBox2"],
    ["uploadImage3", "uploadBox3"],
    ["uploadImage4", "uploadBox4"],
    ["uploadImage5", "uploadBox5"],
    ["uploadImage6", "uploadBox6"]
  ];

  uploadMap.forEach(([inputId, boxId]) => {
    const input = $(inputId);
    const box = $(boxId);
    if (!input || !box) return;
    ensureEditButtonForUploadBox(box, inputId);
    input.addEventListener("change", () => handlePickedImageForUpload(input, box));
  });
}

/** ==========================
 *  COLLECT / VALIDATE
 *  ========================== */
function getSelectedConfirmCauses() {
  return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
    .map((el) => norm(el.value))
    .filter(Boolean);
}

function getSelectedConfirmCausesForNarrative() {
  return getSelectedConfirmCauses();
}

function buildEmployeeConfirmText(p) {
  const employeeName = norm(p.employeeName) || "-";
  const employeeCode = norm(p.employeeCode) || "-";
  const errorDate = formatDateToDisplay(p.errorDate) || "-";
  const shift = norm(p.shift) || "-";
  const refNo = norm(p.refNo) || getRefNoValue() || "-";
  const errorReason = norm(p.errorReason) || "-";
  const itemDisplay = norm(p.itemDisplay) || "-";
  const errorCaseQty = norm(p.errorCaseQty) || "-";
  const facts = ensureArrayValue(p.confirmCauseSelected).filter(Boolean);
  const factText = facts.length
    ? facts.map((line, idx) => `${idx + 1}) ${line}`).join("\n")
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

function collectPayloadBase() {
  return {
    refNo: getRefNoValue(),
    lps: norm($("lps")?.value || AUTH.name),
    labelCid: norm($("labelCid")?.value),
    errorReason: norm($("errorReason")?.value),
    errorReasonOther: norm($("errorReasonOther")?.value),
    errorDescription: norm($("errorDescription")?.value),
    item: String($("item")?.value || "").replace(/[^\d]/g, ""),
    itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
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
    emailRecipients: Array.from(document.querySelectorAll(".emailChk:checked")).map((el) => norm(el.value)).filter(Boolean)
  };
}

const ERROR_BOL_EDIT_STATE = {
  active: false,
  mode: "create",
  sourceRefNo: "",
  rootRefNo: "",
  revisionNo: 0,
  revisionLabel: "",
  editedFromRefNo: "",
  editedAt: "",
  editedBy: "",
  documentId: "",
  existingImages: [],
  existingSigns: {},
  removedImageIds: [],
  removedSignKeys: []
};

function resetErrorBolEditState_() {
  ERROR_BOL_EDIT_STATE.active = false;
  ERROR_BOL_EDIT_STATE.mode = "create";
  ERROR_BOL_EDIT_STATE.sourceRefNo = "";
  ERROR_BOL_EDIT_STATE.rootRefNo = "";
  ERROR_BOL_EDIT_STATE.revisionNo = 0;
  ERROR_BOL_EDIT_STATE.revisionLabel = "";
  ERROR_BOL_EDIT_STATE.editedFromRefNo = "";
  ERROR_BOL_EDIT_STATE.editedAt = "";
  ERROR_BOL_EDIT_STATE.editedBy = "";
  ERROR_BOL_EDIT_STATE.documentId = "";
  ERROR_BOL_EDIT_STATE.existingImages = [];
  ERROR_BOL_EDIT_STATE.existingSigns = {};
  ERROR_BOL_EDIT_STATE.removedImageIds = [];
  ERROR_BOL_EDIT_STATE.removedSignKeys = [];
  renderErrorBolEditModeBanner_();
}

function renderErrorBolEditModeBanner_() {
  const card = $("formCard");
  if (!card) return;

  let banner = $("errorBolEditBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "errorBolEditBanner";
    banner.className = "panel hidden";
    card.prepend(banner);
  }

  if (!ERROR_BOL_EDIT_STATE.active) {
    banner.classList.add("hidden");
    banner.innerHTML = "";
    return;
  }

  banner.classList.remove("hidden");
  banner.innerHTML = `
    <div class="sectionMain">โหมดแก้ไข Error_BOL</div>
    <div class="sectionSub">กำลังแก้ไขเอกสาร Ref ${escapeHtml(ERROR_BOL_EDIT_STATE.sourceRefNo || ERROR_BOL_EDIT_STATE.rootRefNo || "-")}${ERROR_BOL_EDIT_STATE.revisionLabel ? ` • ${escapeHtml(ERROR_BOL_EDIT_STATE.revisionLabel)}` : ""}</div>
    <div class="panelActions">
      <button type="button" id="btnOpenExistingAssets" class="btn ghost">จัดการรูป/ลายเซ็นเดิม</button>
      <button type="button" id="btnExitEditMode" class="btn danger">ออกจากโหมดแก้ไข</button>
    </div>
  `;

  $("btnOpenExistingAssets")?.addEventListener("click", () => {
    openErrorBolExistingAssetManager_();
  });

  $("btnExitEditMode")?.addEventListener("click", async () => {
    const res = await Swal.fire({
      icon: "question",
      title: "ออกจากโหมดแก้ไข?",
      text: "ข้อมูลที่แก้ในฟอร์มปัจจุบันจะถูกล้างและกลับไปเป็นโหมดสร้างใหม่",
      showCancelButton: true,
      confirmButtonText: "ออกจากโหมดแก้ไข",
      cancelButtonText: "ยกเลิก"
    });
    if (!res.isConfirmed) return;
    resetForm();
  });
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

  if (ERROR_BOL_EDIT_STATE.active) {
    p.rootRefNo = ERROR_BOL_EDIT_STATE.rootRefNo || p.refNo;
    p.revisionNo = Number(ERROR_BOL_EDIT_STATE.revisionNo || 0);
    p.revisionLabel = norm(ERROR_BOL_EDIT_STATE.revisionLabel);
    p.editedFromRefNo = norm(ERROR_BOL_EDIT_STATE.editedFromRefNo || ERROR_BOL_EDIT_STATE.sourceRefNo || p.rootRefNo);
    p.editedAt = norm(ERROR_BOL_EDIT_STATE.editedAt);
    p.editedBy = norm(AUTH.name || ERROR_BOL_EDIT_STATE.editedBy);
    p.documentId = norm(ERROR_BOL_EDIT_STATE.documentId);
    p.existingImages = normalizeArray(ERROR_BOL_EDIT_STATE.existingImages).map((x) => ({ ...x }));
    p.existingSigns = { ...(ERROR_BOL_EDIT_STATE.existingSigns || {}) };
    p.removedImageIds = normalizeArray(ERROR_BOL_EDIT_STATE.removedImageIds);
    p.removedSignKeys = normalizeArray(ERROR_BOL_EDIT_STATE.removedSignKeys);
  }

  return p;
}

function validatePayload(p) {
  const required = [
    ["refNo", "Ref No."],
    ["labelCid", "Label CID"],
    ["item", "Item"],
    ["errorReason", "สาเหตุหลัก"],
    ["employeeName", "ชื่อพนักงาน"],
    ["employeeCode", "รหัสพนักงาน"],
    ["errorDate", "วันที่เกิดเหตุ"],
    ["shift", "กะ"],
    ["osm", "OSM"],
    ["otm", "OTM"],
    ["auditName", "AUDIT"]
  ];

  for (const [key, label] of required) {
    if (!norm(p[key])) return `กรุณากรอก${label}`;
  }

  if (norm(p.errorReason) === "อื่นๆ" && !norm(p.errorReasonOther)) {
    return "กรุณาระบุสาเหตุหลักอื่นๆ";
  }

  if (!norm(p.itemDisplay)) {
    return "ไม่พบข้อมูลรายการสินค้า กรุณาตรวจสอบ Item";
  }

  const selectedEmails = uniqueEmails(p.emailRecipients || []);
  if (!selectedEmails.length) {
    return "กรุณาเลือกอีเมลปลายทางอย่างน้อย 1 รายการ";
  }

  return "";
}

/** ==========================
 *  EXISTING ASSET MANAGER (Error_BOL Edit Mode)
 *  ========================== */
function renderExistingImageListHtml_(images) {
  const list = normalizeArray(images);
  if (!list.length) {
    return '<div class="emptyBox">ไม่มีรูปเดิม</div>';
  }

  return `
    <div class="galGrid">
      ${list.map((img, idx) => {
        const id = norm(img.id);
        const deleted = !!img.deleted || ERROR_BOL_EDIT_STATE.removedImageIds.includes(id);
        const url = norm(img.url || img.viewUrl || (id ? driveImgUrl(id) : ""));
        return `
          <div class="galItem">
            <div class="galThumbWrap">
              ${url ? `<img class="galThumb" src="${escapeHtml(url)}" alt="image-${idx + 1}">` : `<div class="galThumb imageGridEmpty">ไม่มีภาพ</div>`}
              <span class="galBadge">${idx + 1}</span>
            </div>
            <div class="galCap">${escapeHtml(fileNameFromMeta(img, `image-${idx + 1}.jpg`))}</div>
            <div class="panelActions">
              <button type="button" class="btn ${deleted ? "secondary" : "danger"}" data-ebimg-id="${escapeHtml(id)}">${deleted ? "คงไว้" : "ลบออก"}</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderExistingSignListHtml_(signs) {
  const map = signs || {};
  const keys = [
    ["supervisor", "ลายเซ็นหัวหน้า"],
    ["employee", "ลายเซ็นพนักงาน"],
    ["interpreter", "ลายเซ็นล่าม"]
  ];

  const rows = keys.map(([key, label]) => {
    const sign = map[key] || {};
    const id = norm(sign.id);
    const deleted = ERROR_BOL_EDIT_STATE.removedSignKeys.includes(key) || !!sign.deleted;
    const url = norm(sign.url || sign.viewUrl || (id ? driveImgUrl(id) : ""));
    return `
      <div class="sigBox">
        <div class="sigBoxTitle">${escapeHtml(label)}</div>
        ${url ? `<img class="sigThumb" src="${escapeHtml(url)}" alt="${escapeHtml(label)}">` : `<div class="emptyBox">ไม่มีลายเซ็น</div>`}
        <div class="sigName">${escapeHtml(fileNameFromMeta(sign, "signature.png"))}</div>
        <div class="panelActions">
          <button type="button" class="btn ${deleted ? "secondary" : "danger"}" data-ebsign-key="${escapeHtml(key)}">${deleted ? "คงไว้" : "ลบออก"}</button>
        </div>
      </div>
    `;
  }).join("");

  return `<div class="sigGrid">${rows}</div>`;
}

async function openErrorBolExistingAssetManager_() {
  if (!ERROR_BOL_EDIT_STATE.active) {
    await Swal.fire({
      icon: "info",
      title: "ยังไม่ได้อยู่ในโหมดแก้ไข",
      text: "กรุณาโหลดเอกสารเดิมมาก่อน"
    });
    return;
  }

  await Swal.fire({
    title: "จัดการไฟล์เดิมของ Error_BOL",
    width: 1100,
    html: `
      <div class="swalSummary">
        <div class="swalSection">
          <div class="swalSectionTitle">รูปภาพเดิม</div>
          ${renderExistingImageListHtml_(ERROR_BOL_EDIT_STATE.existingImages)}
        </div>
        <div class="swalSection">
          <div class="swalSectionTitle">ลายเซ็นเดิม</div>
          ${renderExistingSignListHtml_(ERROR_BOL_EDIT_STATE.existingSigns)}
        </div>
      </div>
    `,
    didOpen: () => {
      document.querySelectorAll("[data-ebimg-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = norm(btn.getAttribute("data-ebimg-id"));
          if (!id) return;
          const idx = ERROR_BOL_EDIT_STATE.removedImageIds.indexOf(id);
          if (idx >= 0) ERROR_BOL_EDIT_STATE.removedImageIds.splice(idx, 1);
          else ERROR_BOL_EDIT_STATE.removedImageIds.push(id);
          Swal.close();
          openErrorBolExistingAssetManager_();
        });
      });

      document.querySelectorAll("[data-ebsign-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = norm(btn.getAttribute("data-ebsign-key"));
          if (!key) return;
          const idx = ERROR_BOL_EDIT_STATE.removedSignKeys.indexOf(key);
          if (idx >= 0) ERROR_BOL_EDIT_STATE.removedSignKeys.splice(idx, 1);
          else ERROR_BOL_EDIT_STATE.removedSignKeys.push(key);
          Swal.close();
          openErrorBolExistingAssetManager_();
        });
      });
    },
    confirmButtonText: "ปิด"
  });
}

/** ==========================
 *  EDIT MODE LOAD / APPLY (Error_BOL)
 *  ========================== */
async function promptLoadErrorBolForEdit_() {
  const { value: refNo } = await Swal.fire({
    title: "โหลด Error_BOL เพื่อแก้ไข",
    input: "text",
    inputLabel: "กรอก Ref ที่ต้องการโหลด",
    inputPlaceholder: "เช่น 191-2569",
    confirmButtonText: "โหลดข้อมูล",
    cancelButtonText: "ยกเลิก",
    showCancelButton: true,
    inputValidator: (value) => {
      if (!norm(value)) return "กรุณากรอก Ref";
      return "";
    }
  });

  if (!refNo) return;
  await loadErrorBolForEditByRef_(refNo);
}

async function loadErrorBolForEditByRef_(refNo) {
  const safeRef = normalizeFrontendRefNo_(refNo);
  if (!safeRef) throw new Error("กรุณาระบุ Ref");

  const res = await fetch(`${apiUrl("/errorBolLoadForEdit")}?refNo=${encodeURIComponent(safeRef)}`, {
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

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || json?.message || `โหลดข้อมูลแก้ไขไม่สำเร็จ (HTTP ${res.status})`);
  }

  applyErrorBolEditPayloadToForm_(json.payload || json);

  await Swal.fire({
    icon: "success",
    title: "โหลดข้อมูลสำเร็จ",
    text: `ระบบได้โหลดเอกสาร Ref ${safeRef} สำหรับแก้ไขแล้ว`
  });
}

function markExistingSignAsKept_(key) {
  const idx = ERROR_BOL_EDIT_STATE.removedSignKeys.indexOf(key);
  if (idx >= 0) ERROR_BOL_EDIT_STATE.removedSignKeys.splice(idx, 1);
}

function applyExistingImagePreviewState_(list) {
  ERROR_BOL_EDIT_STATE.existingImages = normalizeArray(list).map((img) => ({ ...img }));
  ERROR_BOL_EDIT_STATE.removedImageIds = [];
}

function applyExistingSignPreviewState_(map) {
  ERROR_BOL_EDIT_STATE.existingSigns = { ...(map || {}) };
  ERROR_BOL_EDIT_STATE.removedSignKeys = [];
}

function setCheckboxValuesByClass_(cls, values) {
  const set = new Set(normalizeArray(values).map((v) => norm(v)).filter(Boolean));
  document.querySelectorAll(`.${cls}`).forEach((el) => {
    el.checked = set.has(norm(el.value));
  });
}

function setEmailSelections_(emails) {
  const set = new Set(uniqueEmails(emails));
  document.querySelectorAll(".emailChk").forEach((el) => {
    el.checked = set.has(norm(el.value).toLowerCase());
  });
}

function applyErrorBolEditPayloadToForm_(payload) {
  const p = payload || {};

  ERROR_BOL_EDIT_STATE.active = true;
  ERROR_BOL_EDIT_STATE.mode = "edit";
  ERROR_BOL_EDIT_STATE.sourceRefNo = norm(p.refNo);
  ERROR_BOL_EDIT_STATE.rootRefNo = norm(p.rootRefNo || p.refNo);
  ERROR_BOL_EDIT_STATE.revisionNo = Number(p.revisionNo || 0);
  ERROR_BOL_EDIT_STATE.revisionLabel = norm(p.revisionLabel);
  ERROR_BOL_EDIT_STATE.editedFromRefNo = norm(p.editedFromRefNo || p.refNo);
  ERROR_BOL_EDIT_STATE.editedAt = norm(p.editedAt);
  ERROR_BOL_EDIT_STATE.editedBy = norm(p.editedBy);
  ERROR_BOL_EDIT_STATE.documentId = norm(p.documentId);
  applyExistingImagePreviewState_(p.existingImages || p.images || []);
  applyExistingSignPreviewState_(p.existingSigns || p.signatures || {});

  if ($("refNo")) $("refNo").value = String(norm(p.rootRefNo || p.refNo)).split("-")[0].replace(/[^\d]/g, "");
  if ($("refYear")) {
    const m = String(p.rootRefNo || p.refNo || "").match(/-(\d{4})$/);
    if (m) setSelectValueIfExists("refYear", m[1]);
  }

  setReadonlyValue("lps", norm(AUTH.name || p.lps));
  if ($("labelCid")) $("labelCid").value = norm(p.labelCid);
  if ($("errorReason")) {
    ensureOptionExists($("errorReason"), norm(p.errorReason), norm(p.errorReason));
    $("errorReason").value = norm(p.errorReason);
  }
  if ($("errorReasonOther")) $("errorReasonOther").value = norm(p.errorReasonOther);
  if ($("errorDescription")) $("errorDescription").value = norm(p.errorDescription);
  if ($("item")) $("item").value = String(p.item || "").replace(/[^\d]/g, "");
  if ($("itemDisplay")) $("itemDisplay").value = norm(p.itemDisplay);
  if ($("errorCaseQty")) $("errorCaseQty").value = norm(p.errorCaseQty);
  if ($("employeeName")) $("employeeName").value = norm(p.employeeName);
  if ($("employeeCode")) $("employeeCode").value = norm(p.employeeCode);
  if ($("workAgeYear")) $("workAgeYear").value = norm(p.workAgeYear);
  if ($("workAgeMonth")) $("workAgeMonth").value = norm(p.workAgeMonth);
  if ($("nationality")) {
    ensureOptionExists($("nationality"), norm(p.nationality), norm(p.nationality));
    $("nationality").value = norm(p.nationality);
  }
  if ($("interpreterName")) $("interpreterName").value = norm(p.interpreterName);
  if ($("errorDate")) $("errorDate").value = norm(p.errorDateIso || p.errorDate);
  if ($("shift")) {
    ensureOptionExists($("shift"), norm(p.shift), norm(p.shift));
    $("shift").value = norm(p.shift);
  }
  if ($("osm")) {
    ensureOptionExists($("osm"), norm(p.osm), norm(p.osm));
    $("osm").value = norm(p.osm);
  }
  if ($("otm")) {
    ensureOptionExists($("otm"), norm(p.otm), norm(p.otm));
    $("otm").value = norm(p.otm);
  }
  if ($("auditName")) {
    ensureOptionExists($("auditName"), norm(p.auditName), norm(p.auditName));
    $("auditName").value = norm(p.auditName);
  }

  ITEM_LOOKUP_STATE = {
    item: norm(p.item),
    description: norm(p.itemDescription || ITEM_NOT_FOUND_TEXT),
    displayText: norm(p.itemDisplay),
    found: !!norm(p.item),
    loading: false
  };
  updateItemLookupUi();

  setCheckboxValuesByClass_("confirmCauseChk", normalizeArray(p.confirmCauseSelected));
  if ($("confirmCauseOther")) $("confirmCauseOther").value = norm(p.confirmCauseOther);
  if ($("employeeConfirmText")) $("employeeConfirmText").value = norm(p.employeeConfirmText);

  setEmailSelections_(p.emailRecipients || splitEmails(p.emailRecipientsText));

  renderErrorBolEditModeBanner_();
  updateEmployeeConfirmPreview();
}

/** ==========================
 *  SIGNATURE FLOW
 *  ========================== */
async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
  if (ERROR_BOL_EDIT_STATE.active) {
    const useExisting = await Swal.fire({
      icon: "question",
      title: "ลายเซ็นสำหรับฉบับแก้ไข",
      text: "ต้องการคงลายเซ็นเดิมไว้ก่อนหรือไม่",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "คงลายเซ็นเดิม",
      denyButtonText: "เซ็นใหม่",
      cancelButtonText: "ยกเลิก"
    });

    if (useExisting.isConfirmed) {
      markExistingSignAsKept_("supervisor");
      markExistingSignAsKept_("employee");
      if (norm(interpreterName)) markExistingSignAsKept_("interpreter");
      return {
        ok: true,
        supervisorBase64: "",
        employeeBase64: "",
        interpreterBase64: ""
      };
    }

    if (useExisting.isDismissed && useExisting.dismiss !== Swal.DismissReason.deny) {
      return { ok: false };
    }
  }

  const pad = (title, canvasId, nameText = "") => `
    <div class="sigPadBox">
      <div class="sigBoxTitle">${escapeHtml(title)}</div>
      <canvas id="${canvasId}" width="520" height="180" style="width:100%;border:1px solid #dbe7f7;border-radius:12px;background:#fff;"></canvas>
      <div class="sigName">${escapeHtml(nameText || "-")}</div>
      <div class="panelActions"><button type="button" class="btn ghost" data-clear-pad="${canvasId}">ล้างลายเซ็น</button></div>
    </div>
  `;

  const showInterpreter = !!norm(interpreterName);
  const html = `
    <div class="swalSummary">
      <div class="swalSection">
        <div class="swalSectionTitle">กรุณาลงลายเซ็น</div>
        <div class="sigGrid">
          ${pad("หัวหน้า", "sigSupervisor", supervisorName)}
          ${pad("พนักงาน", "sigEmployee", employeeName)}
          ${showInterpreter ? pad("ล่าม", "sigInterpreter", interpreterName) : '<div class="emptyBox">ไม่มีล่าม</div>'}
        </div>
      </div>
    </div>
  `;

  let pads = {};

  const res = await Swal.fire({
    title: "ลายเซ็นยืนยัน",
    html,
    width: 1100,
    showCancelButton: true,
    confirmButtonText: "ยืนยันลายเซ็น",
    cancelButtonText: "ยกเลิก",
    didOpen: () => {
      const createPad = (id) => {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#111827";
        let drawing = false;
        let moved = false;

        const getPoint = (e) => {
          const rect = canvas.getBoundingClientRect();
          const point = e.touches && e.touches[0] ? e.touches[0] : e;
          return {
            x: (point.clientX - rect.left) * (canvas.width / rect.width),
            y: (point.clientY - rect.top) * (canvas.height / rect.height)
          };
        };

        const start = (e) => {
          drawing = true;
          moved = true;
          const p = getPoint(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          e.preventDefault();
        };
        const move = (e) => {
          if (!drawing) return;
          const p = getPoint(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          e.preventDefault();
        };
        const end = (e) => {
          drawing = false;
          e?.preventDefault?.();
        };

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        canvas.addEventListener("touchstart", start, { passive: false });
        canvas.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("touchend", end, { passive: false });

        return {
          canvas,
          clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); moved = false; },
          toBase64() {
            if (!moved) return "";
            return String(canvas.toDataURL("image/png") || "").split(",").pop() || "";
          }
        };
      };

      pads = {
        supervisor: createPad("sigSupervisor"),
        employee: createPad("sigEmployee"),
        interpreter: createPad("sigInterpreter")
      };

      document.querySelectorAll("[data-clear-pad]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = String(btn.getAttribute("data-clear-pad") || "");
          if (key === "sigSupervisor") pads.supervisor?.clear();
          if (key === "sigEmployee") pads.employee?.clear();
          if (key === "sigInterpreter") pads.interpreter?.clear();
        });
      });
    },
    preConfirm: () => {
      const supervisorBase64 = pads.supervisor?.toBase64() || "";
      const employeeBase64 = pads.employee?.toBase64() || "";
      const interpreterBase64 = pads.interpreter?.toBase64() || "";

      if (!supervisorBase64 || !employeeBase64) {
        Swal.showValidationMessage("กรุณาลงลายเซ็นหัวหน้าและพนักงานให้ครบ");
        return false;
      }

      return {
        ok: true,
        supervisorBase64,
        employeeBase64,
        interpreterBase64
      };
    }
  });

  return res.isConfirmed ? res.value : { ok: false };
}

/** ==========================
 *  SUBMIT
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

  if (!ERROR_BOL_EDIT_STATE.active) {
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
  }

  let files = [];
  try {
    files = await collectFilesAsBase64({ maxFiles: 6, maxMBEach: 4 });
  } catch (fileErr) {
    console.error(fileErr);
    return Swal.fire({
      icon: "warning",
      title: "ตรวจสอบไฟล์ไม่ผ่าน",
      text: fileErr?.message || String(fileErr)
    });
  }

  const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
  if (!signRes.ok) {
    return;
  }

  const isEditMode = !!ERROR_BOL_EDIT_STATE.active;
  const action = isEditMode ? "errorBolRevise" : "submit";
  const body = {
    action,
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
    isEditMode ? "กำลังบันทึกการแก้ไข Error_BOL" : "กำลังบันทึก Error_BOL",
    "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล"
  );

  try {
    if (!isEditMode) {
      ProgressUI.activateOnly("validate", 10, "กำลังตรวจสอบ Ref และข้อมูล");

      const dupBeforeSend = await checkRefDuplicate_("error_bol", getRefNoValue(), { force: true });
      if (dupBeforeSend.duplicated) {
        ProgressUI.markError("validate", "เลขอ้างอิงซ้ำ", 10);
        ProgressUI.hide(150);
        await showDuplicateRefAlert_(dupBeforeSend.result);
        $("refNo")?.focus();
        return;
      }
    } else {
      ProgressUI.activateOnly("validate", 10, "กำลังตรวจสอบข้อมูลการแก้ไข");
    }

    await safeDelay(140);
    ProgressUI.markDone("validate", 18, "พร้อมส่งข้อมูล");

    ProgressUI.activateOnly("upload", 28, "กำลังเตรียมรูปภาพและลายเซ็น");
    await safeDelay(180);
    ProgressUI.markDone("upload", 42, `เตรียมไฟล์เรียบร้อย (${files.length} ไฟล์)`);

    ProgressUI.activateOnly("save", 58, isEditMode ? "กำลังบันทึกฉบับแก้ไข" : "กำลังบันทึกข้อมูลลงระบบ");

    const res = await fetch(apiUrl("/"), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("ระบบตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || json?.message || `บันทึกข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    ProgressUI.markDone("save", 74, "บันทึกลงระบบเรียบร้อย");
    ProgressUI.activateOnly("pdf", 82, "กำลังสร้าง PDF");
    await safeDelay(150);
    ProgressUI.markDone("pdf", 90, "สร้าง PDF เรียบร้อย");

    ProgressUI.activateOnly("email", 95, "กำลังตรวจสอบผลการส่งอีเมล");
    const emailSummary = buildEmailStatusSummary_(json);
    ProgressUI.markDone("email", 100, emailSummary.emailModeText, emailSummary.emailModeText);
    ProgressUI.success(isEditMode ? "บันทึกการแก้ไขสำเร็จ" : "บันทึกสำเร็จ", "ระบบสร้างเอกสารเรียบร้อยแล้ว");

    await safeDelay(350);
    ProgressUI.hide(180);
    await showSubmitSuccessDialog_(json, p, files, isEditMode);
    resetForm();
  } catch (err) {
    console.error(err);
    ProgressUI.markError("save", err?.message || String(err), 70);
    ProgressUI.hide(180);
    await Swal.fire({
      icon: "error",
      title: "บันทึกข้อมูลไม่สำเร็จ",
      text: err?.message || String(err),
      confirmButtonText: "ตกลง"
    });
  }
}

function buildSelectedEmailsForSummary_(payload) {
  return uniqueEmails(payload.emailRecipients || []);
}

async function showSubmitSuccessDialog_(json, payload, files, isEditMode = false) {
  const refNo = norm(json.refNo || payload.refNo || getRefNoValue());
  const pdfUrl = norm(json.pdfUrl);
  const selectedEmails = buildSelectedEmailsForSummary_(payload);
  const emailSummary = buildEmailStatusSummary_(json);

  const html = `
    <div class="swalSummary">
      <div class="swalHero">
        <div class="swalHeroTitle">${escapeHtml(isEditMode ? "บันทึกการแก้ไขสำเร็จ" : "บันทึกสำเร็จ")}</div>
        <div class="swalHeroSub">เลขอ้างอิง ${escapeHtml(refNo || "-")}</div>
        <div class="swalPillRow">
          <span class="swalPill primary">${escapeHtml(emailSummary.emailModeText)}</span>
          <span class="swalPill">รูปภาพ ${files.length} ไฟล์</span>
        </div>
      </div>
      <div class="swalSection">
        <div class="swalSectionTitle">รายละเอียดเอกสาร</div>
        <div class="swalKvGrid">
          <div class="swalKv"><div class="swalKvLabel">Ref No.</div><div class="swalKvValue">${escapeHtml(refNo || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">พนักงาน</div><div class="swalKvValue">${escapeHtml(payload.employeeName || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">รหัสพนักงาน</div><div class="swalKvValue">${escapeHtml(payload.employeeCode || "-")}</div></div>
          <div class="swalKv"><div class="swalKvLabel">Item</div><div class="swalKvValue">${escapeHtml(payload.itemDisplay || payload.item || "-")}</div></div>
        </div>
      </div>
      <div class="swalSection">
        <div class="swalSectionTitle">อีเมลปลายทาง</div>
        <div class="swalEmailList">
          ${selectedEmails.map((email) => `<span class="swalEmailChip">${escapeHtml(email)}</span>`).join("") || '<div class="swalNote">ไม่มีอีเมลปลายทาง</div>'}
        </div>
      </div>
      ${pdfUrl ? `
        <div class="swalActionLink">
          <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer">เปิด PDF</a>
        </div>
      ` : ""}
    </div>
  `;

  await Swal.fire({
    icon: "success",
    title: isEditMode ? "บันทึกการแก้ไขสำเร็จ" : "บันทึกสำเร็จ",
    html,
    width: 920,
    confirmButtonText: "ปิด"
  });
}

/** ==========================
 *  RESET
 *  ========================== */
function clearUploadPreview_(inputId, boxId) {
  const input = $(inputId);
  const box = $(boxId);
  if (input) {
    input.value = "";
    EDITED_UPLOAD_STORE.delete(input);
  }
  if (!box) return;

  const img = box.querySelector(".previewImg");
  const txt = box.querySelector(".small");
  if (img?.dataset.objectUrl) {
    try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
  }
  if (img) {
    img.removeAttribute("src");
    delete img.dataset.objectUrl;
  }
  if (txt) txt.textContent = "";
}

function resetForm() {
  resetErrorBolEditState_();
  resetDisciplineLookupState();
  resetItemLookupState();

  setReadonlyValue("lps", norm(AUTH.name));

  if ($("refNo")) $("refNo").value = "";
  if ($("labelCid")) $("labelCid").value = "";
  if ($("errorReason")) $("errorReason").value = "";
  if ($("errorReasonOther")) $("errorReasonOther").value = "";
  if ($("errorDescription")) $("errorDescription").value = "";
  if ($("item")) $("item").value = "";
  if ($("itemDisplay")) $("itemDisplay").value = "";
  if ($("errorCaseQty")) $("errorCaseQty").value = "";
  if ($("employeeName")) $("employeeName").value = "";
  if ($("employeeCode")) $("employeeCode").value = "";
  if ($("workAgeYear")) $("workAgeYear").value = "";
  if ($("workAgeMonth")) $("workAgeMonth").value = "";
  if ($("nationality")) $("nationality").value = "";
  if ($("interpreterName")) $("interpreterName").value = "";
  if ($("errorDate")) $("errorDate").value = "";
  if ($("shift")) $("shift").value = "";
  if ($("osm")) $("osm").value = "";
  if ($("otm")) $("otm").value = "";
  if ($("auditName")) $("auditName").value = "";
  if ($("confirmCauseOther")) $("confirmCauseOther").value = "";
  if ($("employeeConfirmText")) $("employeeConfirmText").value = "";

  document.querySelectorAll(".confirmCauseChk, .emailChk").forEach((el) => { el.checked = false; });

  [
    ["uploadImage1", "uploadBox1"],
    ["uploadImage2", "uploadBox2"],
    ["uploadImage3", "uploadBox3"],
    ["uploadImage4", "uploadBox4"],
    ["uploadImage5", "uploadBox5"],
    ["uploadImage6", "uploadBox6"]
  ].forEach(([inputId, boxId]) => clearUploadPreview_(inputId, boxId));

  buildYearOptionsForSelect($("refYear"));
  resetRefDuplicateUi_("error_bol");
  renderErrorBolEditModeBanner_();
  updateEmployeeConfirmPreview();
}

/** ==========================
 *  PREVIEW / AUX
 *  ========================== */
function countEffectiveUploadFiles_() {
  const inputs = Array.from(document.querySelectorAll("#formCard input[type='file']"));
  return inputs.reduce((acc, el) => {
    const edited = EDITED_UPLOAD_STORE.get(el)?.file || null;
    const raw = el.files && el.files[0] ? el.files[0] : null;
    return acc + ((edited || raw) ? 1 : 0);
  }, 0);
}

async function previewBeforeSubmit_() {
  try {
    const payload = collectPayload();
    const err = validatePayload(payload);
    if (err) throw new Error(err);

    await Swal.fire({
      title: "สรุปก่อนบันทึก",
      html: `
        <div class="swalSummary">
          <div class="swalSection">
            <div class="swalSectionTitle">ข้อมูลหลัก</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">Ref</div><div class="swalKvValue">${escapeHtml(payload.refNo || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">พนักงาน</div><div class="swalKvValue">${escapeHtml(payload.employeeName || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">รหัสพนักงาน</div><div class="swalKvValue">${escapeHtml(payload.employeeCode || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">รายการสินค้า</div><div class="swalKvValue">${escapeHtml(payload.itemDisplay || "-")}</div></div>
            </div>
          </div>
          <div class="swalSection">
            <div class="swalSectionTitle">ไฟล์แนบ</div>
            <div class="swalKvValue">${countEffectiveUploadFiles_()} ไฟล์</div>
          </div>
        </div>
      `,
      width: 900,
      confirmButtonText: "ปิด"
    });
  } catch (err) {
    Swal.fire({
      icon: "warning",
      title: "ตรวจสอบข้อมูลไม่ผ่าน",
      text: err?.message || String(err)
    });
  }
}

/** ==========================
 *  STARTUP
 *  ========================== */
function bindMainButtons() {
  $("btnLogin")?.addEventListener("click", login);
  $("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  $("tabErrorBol")?.addEventListener("click", () => setMainMode("error_bol"));
  $("tabUnder500")?.addEventListener("click", () => setMainMode("report500"));

  $("btnSubmit")?.addEventListener("click", submitForm);
  $("btnPreview")?.addEventListener("click", previewBeforeSubmit_);
  $("btnReset")?.addEventListener("click", async () => {
    const res = await Swal.fire({
      icon: "question",
      title: "ล้างข้อมูลในฟอร์ม?",
      text: "ข้อมูลที่กรอกอยู่จะถูกล้างทั้งหมด",
      showCancelButton: true,
      confirmButtonText: "ล้างข้อมูล",
      cancelButtonText: "ยกเลิก"
    });
    if (!res.isConfirmed) return;
    resetForm();
  });

  $("btnLoadForEdit")?.addEventListener("click", () => {
    promptLoadErrorBolForEdit_().catch((err) => {
      Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text: err?.message || String(err)
      });
    });
  });
}

async function bootstrapApp() {
  setLogos();
  bindMainButtons();
  bindRefInputs();
  bindErrorBolInputs();
  buildYearOptionsForSelect($("refYear"));
  buildYearOptionsForSelect($("rptRefYear"));

  try {
    await loadOptions();
    renderErrorBolOptions();
    if (window.Report500App && typeof window.Report500App.init === "function") {
      await window.Report500App.init({ getAuth: () => AUTH, apiUrl, escapeHtml, norm });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "โหลดข้อมูลเริ่มต้นไม่สำเร็จ",
      text: err?.message || String(err)
    });
  }

  resetForm();
}

document.addEventListener("DOMContentLoaded", bootstrapApp);

window.promptLoadErrorBolForEdit_ = promptLoadErrorBolForEdit_;
window.loadErrorBolForEditByRef_ = loadErrorBolForEditByRef_;
window.openErrorBolExistingAssetManager_ = openErrorBolExistingAssetManager_;


