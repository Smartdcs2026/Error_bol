// /** ==========================
//  *  FRONTEND APP
//  *  app.js
//  *  ========================== */
// const API_BASE = "https://bol.somchaibutphon.workers.dev";
// const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
// const ITEM_LOOKUP_MIN_LEN = 3;
// const ITEM_LOOKUP_DEBOUNCE_MS = 420;

// /** ==========================
//  *  STATE
//  *  ========================== */
// let OPTIONS = { errorList: [], auditList: [], emailList: [] };
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

// const $ = (id) => document.getElementById(id);

// /** ==========================
//  *  URL Helper
//  *  ========================== */
// function apiUrl(path) {
//   const base = String(API_BASE || "").replace(/\/+$/, "");
//   const p = String(path || "").replace(/^\/+/, "");
//   return `${base}/${p}`;
// }

// function getCurrentBuddhistYear() {
//   return String(new Date().getFullYear() + 543);
// }

// function bindRefInputs() {
//   const runningEl = $("refRunning");
//   const yearEl = $("refYear");
//   if (!runningEl || !yearEl) return;

//   yearEl.value = getCurrentBuddhistYear();

//   runningEl.addEventListener("input", () => {
//     runningEl.value = String(runningEl.value || "").replace(/[^\d]/g, "");
//   });
// }

// function getRefNoValue() {
//   const running = String($("refRunning")?.value || "").replace(/[^\d]/g, "").trim();
//   const year = String($("refYear")?.value || "").trim() || getCurrentBuddhistYear();
//   if (!running) return "";
//   return `${running}-${year}`;
// }

// function driveImgUrl(id) {
//   return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
// }

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

// init().catch((err) => {
//   console.error(err);
//   safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
// });

// async function init() {
//   bindTabs();
//   buildInitialUploadFields();
//   bindEvents();
//   bindRefInputs();

//   try {
//     await loadOptions();
//     fillFormDropdowns();
//     renderEmailSelector();
//   } catch (err) {
//     console.error("loadOptions failed:", err);
//     safeSetLoginMsg("โหลดตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
//   }

//   numericOnly($("labelCid"));
//   numericOnly($("item"));
//   numericOnly($("errorCaseQty"));
//   alnumUpperOnly($("employeeCode"));

//   setActiveTab("error");
// }

// function safeSetLoginMsg(msg) {
//   const el = $("loginMsg");
//   if (el) el.textContent = msg || "";
// }

// function bindTabs() {
//   $("tabErrorBol")?.addEventListener("click", () => setActiveTab("error"));
//   $("tabUnder500")?.addEventListener("click", () => setActiveTab("u500"));
// }

// function setActiveTab(which) {
//   $("tabErrorBol")?.classList.toggle("active", which === "error");
//   $("tabUnder500")?.classList.toggle("active", which === "u500");

//   if (!AUTH.name) {
//     $("loginCard")?.classList.remove("hidden");
//     $("formCard")?.classList.add("hidden");
//     $("under500Card")?.classList.add("hidden");
//     return;
//   }

//   $("loginCard")?.classList.add("hidden");
//   $("formCard")?.classList.toggle("hidden", which !== "error");
//   $("under500Card")?.classList.toggle("hidden", which !== "u500");
// }

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
// }

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

//   OPTIONS = json.data || { errorList: [], auditList: [], emailList: [] };
// }

// function fillFormDropdowns() {
//   const er = $("errorReason");
//   const audit = $("auditName");

//   if (er) {
//     er.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.errorList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }

//   if (audit) {
//     audit.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.auditList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }
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
//     updateEmailSelectedText();
//     return;
//   }

//   root.innerHTML = emails.map((email) => `
//     <label class="emailItem">
//       <input type="checkbox" class="emailChk" value="${escapeHtml(email)}">
//       <span class="emailCheckBox"></span>
//       <span class="emailText">${escapeHtml(email)}</span>
//     </label>
//   `).join("");

//   root.querySelectorAll(".emailChk").forEach(chk => {
//     chk.addEventListener("change", updateEmailSelectedText);
//   });

//   updateEmailSelectedText();
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
//   updateEmailSelectedText();
// }

// function updateEmailSelectedText() {
//   const el = $("emailSelectedText");
//   if (!el) return;
//   const selected = getSelectedEmails();
//   el.textContent = selected.length
//     ? `เลือกแล้ว ${selected.length} อีเมล`
//     : "ยังไม่ได้เลือกอีเมล (ถ้าไม่เลือก ระบบจะไม่ส่งอีเมล)";
// }

// /** ==========================
//  *  Login
//  *  ========================== */
// async function onLogin() {
//   safeSetLoginMsg("");
//   const pass = ($("loginPass")?.value || "").trim();

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
//       safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
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
//   setLpsFromLogin(lpsName);
//   setActiveTab("error");
// }

// function onErrorReasonChange() {
//   const v = $("errorReason")?.value || "";
//   $("wrapErrorOther")?.classList.toggle("hidden", v !== "อื่นๆ");
// }

// function numericOnly(el) {
//   if (!el) return;
//   el.addEventListener("input", () => {
//     el.value = String(el.value || "").replace(/[^\d]/g, "");
//   });
// }

// /** ==========================
//  *  ITEM LOOKUP FAST MODE
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
//     return;
//   }

//   if (ITEM_LOCAL_CACHE.has(item)) {
//     const cached = ITEM_LOCAL_CACHE.get(item);
//     ITEM_LOOKUP_STATE = { ...cached, loading: false };
//     renderItemLookupState(ITEM_LOOKUP_STATE);
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
// }

// function renderItemLookupState(state) {
//   const box = $("itemLookupBox");
//   const txt = $("itemLookupText");
//   if (!box || !txt) return;

//   const item = String(state?.item || "").trim();
//   const desc = String(state?.description || "").trim();
//   const displayText = String(state?.displayText || "").trim();
//   const loading = !!state?.loading;
//   const found = !!state?.found;
//   const apiError = !!state?.apiError;

//   box.classList.remove("hidden", "ok", "notfound", "loading");

//   if (!item) {
//     box.classList.add("hidden");
//     txt.textContent = "-";
//     return;
//   }

//   if (loading) {
//     box.classList.add("loading");
//     txt.textContent = `กำลังค้นหา Item ${item} ...`;
//     return;
//   }

//   if (found && desc && desc !== ITEM_NOT_FOUND_TEXT) {
//     box.classList.add("ok");
//     txt.textContent = displayText || `${item} | ${desc}`;
//     return;
//   }

//   box.classList.add("notfound");
//   txt.textContent = apiError
//     ? `${item} | ${ITEM_NOT_FOUND_TEXT}`
//     : `${displayText || `${item} | ${ITEM_NOT_FOUND_TEXT}`}`;
// }

// function getItemDisplayText() {
//   if (ITEM_LOOKUP_STATE && ITEM_LOOKUP_STATE.displayText) {
//     return ITEM_LOOKUP_STATE.displayText;
//   }
//   const item = ($("item")?.value || "").trim();
//   return item;
// }

// /** ==========================
//  *  Upload fields
//  *  ========================== */
// function buildInitialUploadFields() {
//   const grid = $("uploadGrid");
//   if (!grid) return;

//   grid.innerHTML = "";
//   addUploadField("บัตรพนง.", { removable: false });
//   addUploadField("พนักงาน", { removable: false });
// }

// function addUploadField(label, opts = {}) {
//   const { removable = true } = opts;

//   const grid = $("uploadGrid");
//   if (!grid) return;

//   const id = "file_" + Math.random().toString(16).slice(2);
//   const box = document.createElement("div");
//   box.className = "uploadBox";

//   box.innerHTML = `
//     <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
//       <div class="cap">${escapeHtml(label)}</div>
//       ${removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${id}">ลบ</button>` : ``}
//     </div>
//     <input type="file" accept="image/*" id="${id}">
//     <img class="previewImg" id="${id}_img" alt="">
//     <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
//   `;

//   grid.appendChild(box);

//   if (removable) {
//     const btn = box.querySelector(`[data-remove="${id}"]`);
//     btn?.addEventListener("click", () => {
//       const img = $(`${id}_img`);
//       if (img && img.dataset.objectUrl) {
//         try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       }
//       box.remove();
//     });
//   }

//   const fileInput = $(id);
//   const img = $(`${id}_img`);
//   const txt = $(`${id}_txt`);

//   fileInput?.addEventListener("change", () => {
//     const f = fileInput.files && fileInput.files[0];

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
//       Swal.fire({
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
//   });
// }

// /** ==========================
//  *  Payload + Validation
//  *  ========================== */
// function collectPayload() {
//   return {
//     refNo: getRefNoValue(),
//     labelCid: ($("labelCid")?.value || "").trim(),
//     errorReason: ($("errorReason")?.value || "").trim(),
//     errorReasonOther: ($("errorReasonOther")?.value || "").trim(),
//     errorDescription: ($("errorDescription")?.value || "").trim(),
//     errorDate: ($("errorDate")?.value || "").trim(),
//     item: ($("item")?.value || "").trim(),
//     itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
//     itemDisplay: ITEM_LOOKUP_STATE.displayText || "",
//     errorCaseQty: ($("errorCaseQty")?.value || "").trim(),
//     employeeName: ($("employeeName")?.value || "").trim(),
//     employeeCode: ($("employeeCode")?.value || "").trim(),
//     shift: ($("shift")?.value || "").trim(),
//     osm: ($("osm")?.value || "").trim(),
//     otm: ($("otm")?.value || "").trim(),
//     interpreterName: ($("interpreterName")?.value || "").trim(),
//     auditName: ($("auditName")?.value || "").trim(),
//     emailRecipients: getSelectedEmails()
//   };
// }

// function validatePayload(p) {
//   const required = [
//     ["refNo", "Ref:No."],
//     ["labelCid", "Label CID"],
//     ["errorReason", "สาเหตุ Error"],
//     ["errorDescription", "รายละเอียด/คำอธิบายสาเหตุ"],
//     ["item", "Item"],
//     ["errorCaseQty", "จำนวน ErrorCase"],
//     ["employeeName", "ชื่อ-สกุลพนักงาน"],
//     ["employeeCode", "รหัสพนักงาน"],
//     ["errorDate", "วันที่เบิกสินค้า Error"],
//     ["shift", "กะ"],
//     ["osm", "OSM"],
//     ["otm", "OTM"],
//     ["auditName", "พนง. AUDIT"]
//   ];

//   for (const [k, n] of required) {
//     if (!String(p[k] || "").trim()) return `กรุณากรอก ${n}`;
//   }

//   const refRunning = String($("refRunning")?.value || "").trim();
//   if (!/^\d+$/.test(refRunning)) return "กรุณากรอกเลข Ref เป็นตัวเลขเท่านั้น";
//   if (!/^\d+-\d{4}$/.test(p.refNo)) return "Ref:No. ไม่ถูกต้อง";

//   if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) {
//     return "กรุณาระบุสาเหตุ (อื่นๆ)";
//   }

//   if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^[A-Z0-9]+$/.test(p.employeeCode)) return "รหัสพนักงานต้องเป็น A-Z หรือ/และ 0-9 เท่านั้น";
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
//               <div class="swalKvValue">${escapeHtml(p.errorDate || "-")}</div>
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

//           <div class="swalDesc" style="margin-top:8px;">
//             <div class="swalDescLabel">รายละเอียดเหตุการณ์</div>
//             <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
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
//   const inputs = Array.from(document.querySelectorAll('#uploadGrid input[type="file"]'));
//   return inputs.reduce((acc, el) => acc + ((el.files && el.files[0]) ? 1 : 0), 0);
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
//   } catch (_) {
//     return;
//   }

//   const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
//   if (!signRes.ok) return;

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

//   Swal.fire({
//     title: "กำลังบันทึกข้อมูล",
//     html: `
//       <div class="swalSummary">
//         <div class="swalHero">
//           <div class="swalHeroTitle">ระบบกำลังประมวลผล</div>
//           <div class="swalHeroSub">กำลังอัปโหลดรูปภาพ สร้าง PDF และตรวจสอบการส่งอีเมล</div>
//         </div>
//       </div>
//     `,
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     customClass: { popup: "swalLoadingPopup" },
//     didOpen: () => Swal.showLoading()
//   });

//   let json;
//   try {
//     const res = await fetch(apiUrl("/submit"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body)
//     });

//     const text = await res.text();

//     try {
//       json = JSON.parse(text);
//     } catch (_) {
//       return Swal.fire({
//         icon: "error",
//         title: "บันทึกไม่สำเร็จ",
//         html: `
//           <div class="swalSection">
//             <div class="swalSectionTitle">รายละเอียดข้อผิดพลาด</div>
//             <div class="swalDesc">
//               <div class="swalDescLabel">ข้อความจากระบบ</div>
//               <div class="swalDescValue">
//                 <pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:10px;border-radius:10px;max-height:220px;overflow:auto;margin:0;">${escapeHtml(text).slice(0, 2000)}</pre>
//               </div>
//             </div>
//           </div>
//         `
//       });
//     }

//     if (!res.ok || !json.ok) {
//       return Swal.fire({
//         icon: "error",
//         title: "บันทึกไม่สำเร็จ",
//         text: json.error || `HTTP ${res.status}`
//       });
//     }
//   } catch (err2) {
//     console.error(err2);
//     return Swal.fire({
//       icon: "error",
//       title: "บันทึกไม่สำเร็จ",
//       text: "เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต / Worker / API)"
//     });
//   }

//   const galleryHtml = renderGalleryHtml(json.imageIds || []);
//   const emailResult = json.emailResult || {};
//   const emailOk = !!emailResult.ok && !emailResult.skipped;
//   const pdfSizeText = String(json.pdfSizeText || "-");

//   const supSignThumb = signRes.supervisorBase64
//     ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
//     : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//   const empSignThumb = signRes.employeeBase64
//     ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
//     : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//   const intSignThumb = signRes.interpreterBase64
//     ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
//     : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

//   await Swal.fire({
//     icon: "success",
//     title: "บันทึกสำเร็จ",
//     confirmButtonText: "ปิดหน้าต่าง",
//     confirmButtonColor: "#2563eb",
//     width: 920,
//     html: `
//       <div class="swalSummary">
//         <div class="swalHero">
//           <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
//           <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และเอกสาร PDF เรียบร้อย</div>
//           <div class="swalPillRow">
//             <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
//             <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
//             <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
//             <div class="swalPill">วินัย ${Number(json.disciplineMatchCount || 0)}</div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">วันที่เวลา</div>
//               <div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">Ref:No.</div>
//               <div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">Label CID</div>
//               <div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">ขนาด PDF</div>
//               <div class="swalKvValue">${escapeHtml(pdfSizeText)}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลเหตุการณ์</div>
//           <div class="swalKvGrid">
//             <div class="swalKv">
//               <div class="swalKvLabel">สาเหตุ</div>
//               <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">กะ</div>
//               <div class="swalKvValue">${escapeHtml(p.shift || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">Item</div>
//               <div class="swalKvValue">${escapeHtml((json.itemDisplay || getItemDisplayText() || "-"))}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">จำนวน ErrorCase</div>
//               <div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div>
//             </div>
//           </div>

//           <div class="swalDesc" style="margin-top:8px;">
//             <div class="swalDescLabel">รายละเอียดเหตุการณ์</div>
//             <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">พนักงาน / ผู้เกี่ยวข้อง</div>
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
//               <div class="swalKvLabel">OSM</div>
//               <div class="swalKvValue">${escapeHtml(p.osm || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">OTM</div>
//               <div class="swalKvValue">${escapeHtml(p.otm || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">ล่าม</div>
//               <div class="swalKvValue">${escapeHtml(p.interpreterName || "-")}</div>
//             </div>
//             <div class="swalKv">
//               <div class="swalKvLabel">AUDIT</div>
//               <div class="swalKvValue">${escapeHtml(p.auditName || "-")}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">สถานะอีเมล</div>
//           ${
//             emailResult.skipped
//               ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
//               : emailOk
//                 ? `
//                   <div class="swalEmailOk">
//                     ส่งอีเมลสำเร็จ ${Number(emailResult.count || 0)} รายการ
//                     ${emailResult.attachmentMode ? `• ${escapeHtml(emailResult.attachmentMode)}` : ""}
//                   </div>
//                   <div class="swalEmailList">
//                     ${(emailResult.recipients || []).map(e => `<div class="swalEmailChip">${escapeHtml(e)}</div>`).join("")}
//                   </div>
//                 `
//                 : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailResult.error || "-")}</div>`
//           }
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ลายเซ็น</div>
//           <div class="sigGrid">
//             <div>
//               <div class="sigBoxTitle">หัวหน้างาน</div>
//               ${supSignThumb}
//               <div class="sigName">${escapeHtml(p.otm || "-")}</div>
//             </div>
//             <div>
//               <div class="sigBoxTitle">พนักงาน</div>
//               ${empSignThumb}
//               <div class="sigName">${escapeHtml(p.employeeName || "-")}</div>
//             </div>
//             <div>
//               <div class="sigBoxTitle">ล่ามแปลภาษา</div>
//               ${intSignThumb}
//               <div class="sigName">${escapeHtml(p.interpreterName || "-")}</div>
//             </div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">รูปภาพแนบ</div>
//           ${galleryHtml || `<div class="swalNote">ไม่มีรูปภาพแนบ</div>`}
//         </div>

//         ${
//           json.pdfUrl
//             ? `
//               <div class="swalActionLink">
//                 <a href="${json.pdfUrl}" target="_blank" rel="noopener noreferrer">เปิดไฟล์ PDF รายงาน</a>
//               </div>
//             `
//             : `<div class="swalNote" style="color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF</div>`
//         }
//       </div>
//     `,
//     didOpen: () => bindGalleryClickInSwal()
//   });

//   resetForm();
// }

// async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
//   const inputs = Array.from(document.querySelectorAll('#uploadGrid input[type="file"]'));
//   const picked = [];

//   for (const el of inputs) {
//     const f = el.files && el.files[0];
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
//     r.onload = () => resolve(r.result);
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
//   const clearId = canvasId + "_clear";

//   const html = `
//     <div class="sigModalWrap">
//       <div class="sigModalHead">
//         <div class="sigModalSub">${escapeHtml(subtitle || "")}</div>
//         <div class="sigModalTip">กรุณาเซ็นภายในกรอบด้านล่าง โดยใช้เมาส์หรือนิ้วลากเขียนลายเซ็น</div>
//       </div>

//       <div class="sigCanvasCard">
//         <canvas id="${canvasId}" width="800" height="260" class="sigCanvasElm"></canvas>
//       </div>

//       <div class="sigModalFoot">
//         <button type="button" id="${clearId}" class="sigActionBtn sigActionBtn-clear">ล้างลายเซ็น</button>
//       </div>
//     </div>
//   `;


/** ==========================
 *  FRONTEND APP - PRODUCTION
 *  รองรับ:
 *  - submit/finalize แยกขั้นตอน
 *  - autosave draft
 *  - restore draft
 *  - restore signatures
 *  - restore image drafts
 *  - retry finalize without re-sign
 *  ========================== */
const API_BASE = "https://bol.somchaibutphon.workers.dev";
const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
const ITEM_LOOKUP_MIN_LEN = 3;
const ITEM_LOOKUP_DEBOUNCE_MS = 420;

const DRAFT_KEY = "error_bol_draft_v3";

let OPTIONS = { errorList: [], auditList: [], emailList: [] };
let AUTH = { name: "", pass: "" };

let ITEM_LOOKUP_STATE = {
  item: "",
  description: "",
  displayText: "",
  found: false,
  loading: false
};

let DRAFT_STATE = {
  version: 3,
  savedAt: "",
  payload: {},
  selectedEmails: [],
  signatures: {
    supervisorBase64: "",
    employeeBase64: "",
    interpreterBase64: ""
  },
  uploads: [],
  submitMeta: {
    clientRequestId: "",
    submitted: false,
    finalized: false,
    refNo: "",
    rowNumber: "",
    pdfUrl: "",
    finalizePending: false
  }
};

const ITEM_LOCAL_CACHE = new Map();
let itemLookupTimer = null;

const $ = (id) => document.getElementById(id);

/** ==========================
 *  INIT
 *  ========================== */
init().catch((err) => {
  console.error(err);
  safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
});

async function init() {
  bindTabs();
  buildInitialUploadFields();
  bindEvents();
  bindRefInputs();
  bindDraftAutosave_();

  try {
    await loadOptions();
    fillFormDropdowns();
    renderEmailSelector();
  } catch (err) {
    console.error("loadOptions failed:", err);
    safeSetLoginMsg("โหลดตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
  }

  numericOnly($("labelCid"));
  numericOnly($("item"));
  numericOnly($("errorCaseQty"));
  alnumUpperOnly($("employeeCode"));

  setActiveTab("error");
  await tryRestoreDraft_();
}

/** ==========================
 *  URL Helper
 *  ========================== */
function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

function getCurrentBuddhistYear() {
  return String(new Date().getFullYear() + 543);
}

function bindRefInputs() {
  const runningEl = $("refRunning");
  const yearEl = $("refYear");
  if (!runningEl || !yearEl) return;

  yearEl.value = getCurrentBuddhistYear();

  runningEl.addEventListener("input", () => {
    runningEl.value = String(runningEl.value || "").replace(/[^\d]/g, "");
  });
}

function getRefNoValue() {
  const running = String($("refRunning")?.value || "").replace(/[^\d]/g, "").trim();
  const year = String($("refYear")?.value || "").trim() || getCurrentBuddhistYear();
  if (!running) return "";
  return `${running}-${year}`;
}

function makeClientRequestId_() {
  return "REQ-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** ==========================
 *  LOGIN / TABS
 *  ========================== */
function safeSetLoginMsg(msg) {
  const el = $("loginMsg");
  if (el) el.textContent = msg || "";
}

function bindTabs() {
  $("tabErrorBol")?.addEventListener("click", () => setActiveTab("error"));
  $("tabUnder500")?.addEventListener("click", () => setActiveTab("u500"));
}

function setActiveTab(which) {
  $("tabErrorBol")?.classList.toggle("active", which === "error");
  $("tabUnder500")?.classList.toggle("active", which === "u500");

  if (!AUTH.name) {
    $("loginCard")?.classList.remove("hidden");
    $("formCard")?.classList.add("hidden");
    $("under500Card")?.classList.add("hidden");
    return;
  }

  $("loginCard")?.classList.add("hidden");
  $("formCard")?.classList.toggle("hidden", which !== "error");
  $("under500Card")?.classList.toggle("hidden", which !== "u500");
}

function bindEvents() {
  $("btnLogin")?.addEventListener("click", onLogin);

  $("errorReason")?.addEventListener("change", () => {
    onErrorReasonChange();
    saveDraftToLocal_();
  });

  $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));
  $("btnPreview")?.addEventListener("click", previewSummary);
  $("btnSubmit")?.addEventListener("click", submitForm);

  $("btnEmailCheckAll")?.addEventListener("click", () => {
    setAllEmailChecks(true);
    saveDraftToLocal_();
  });
  $("btnEmailClearAll")?.addEventListener("click", () => {
    setAllEmailChecks(false);
    saveDraftToLocal_();
  });

  $("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLogin();
  });

  $("item")?.addEventListener("input", onItemInputLookup);
  $("item")?.addEventListener("blur", onItemBlurLookup);
}

async function onLogin() {
  safeSetLoginMsg("");
  const pass = ($("loginPass")?.value || "").trim();

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
    json = JSON.parse(text);

    if (!res.ok || !json.ok) {
      safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
  } catch (err) {
    console.error(err);
    safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
    return;
  }

  const lpsName = String(json.name || "").trim();
  if (!lpsName) {
    safeSetLoginMsg("ไม่พบชื่อผู้ใช้งานจากระบบ");
    return;
  }

  AUTH = { name: lpsName, pass };
  setLpsFromLogin(lpsName);
  setActiveTab("error");
  saveDraftToLocal_();
}

function setLpsFromLogin(loginName) {
  const lpsEl = $("lps");
  if (lpsEl) {
    lpsEl.value = loginName || "";
    lpsEl.readOnly = true;
  }

  const pill = $("userPill");
  if (pill) {
    pill.textContent = "ผู้ใช้งาน: " + (loginName || "-");
  }
}

/** ==========================
 *  OPTIONS / EMAIL
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

  OPTIONS = json.data || { errorList: [], auditList: [], emailList: [] };
}

function fillFormDropdowns() {
  const er = $("errorReason");
  const audit = $("auditName");

  if (er) {
    er.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.errorList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
  }

  if (audit) {
    audit.innerHTML =
      `<option value="">-- เลือก --</option>` +
      (OPTIONS.auditList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
  }
}

function renderEmailSelector() {
  const root = $("emailSelector");
  if (!root) return;

  const emails = Array.isArray(OPTIONS.emailList) ? OPTIONS.emailList : [];
  if (!emails.length) {
    root.innerHTML = `<div class="emailEmpty">ไม่พบรายการอีเมลในชีท Email</div>`;
    updateEmailSelectedText();
    return;
  }

  root.innerHTML = emails.map((email) => `
    <label class="emailItem">
      <input type="checkbox" class="emailChk" value="${escapeHtml(email)}">
      <span class="emailCheckBox"></span>
      <span class="emailText">${escapeHtml(email)}</span>
    </label>
  `).join("");

  root.querySelectorAll(".emailChk").forEach(chk => {
    chk.addEventListener("change", () => {
      updateEmailSelectedText();
      saveDraftToLocal_();
    });
  });

  updateEmailSelectedText();
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
  updateEmailSelectedText();
}

function updateEmailSelectedText() {
  const el = $("emailSelectedText");
  if (!el) return;
  const selected = getSelectedEmails();
  el.textContent = selected.length
    ? `เลือกแล้ว ${selected.length} อีเมล`
    : "ยังไม่ได้เลือกอีเมล (ถ้าไม่เลือก ระบบจะไม่ส่งอีเมล)";
}

/** ==========================
 *  FORM
 *  ========================== */
function onErrorReasonChange() {
  const v = $("errorReason")?.value || "";
  $("wrapErrorOther")?.classList.toggle("hidden", v !== "อื่นๆ");
}

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

function collectPayload() {
  return {
    clientRequestId: DRAFT_STATE?.submitMeta?.clientRequestId || "",
    refNo: getRefNoValue(),
    labelCid: ($("labelCid")?.value || "").trim(),
    errorReason: ($("errorReason")?.value || "").trim(),
    errorReasonOther: ($("errorReasonOther")?.value || "").trim(),
    errorDescription: ($("errorDescription")?.value || "").trim(),
    errorDate: ($("errorDate")?.value || "").trim(),
    item: ($("item")?.value || "").trim(),
    itemDescription: ITEM_LOOKUP_STATE.description || ITEM_NOT_FOUND_TEXT,
    itemDisplay: ITEM_LOOKUP_STATE.displayText || "",
    errorCaseQty: ($("errorCaseQty")?.value || "").trim(),
    employeeName: ($("employeeName")?.value || "").trim(),
    employeeCode: ($("employeeCode")?.value || "").trim(),
    shift: ($("shift")?.value || "").trim(),
    osm: ($("osm")?.value || "").trim(),
    otm: ($("otm")?.value || "").trim(),
    interpreterName: ($("interpreterName")?.value || "").trim(),
    auditName: ($("auditName")?.value || "").trim(),
    emailRecipients: getSelectedEmails()
  };
}

function validatePayload(p) {
  const required = [
    ["refNo", "Ref:No."],
    ["labelCid", "Label CID"],
    ["errorReason", "สาเหตุ Error"],
    ["errorDescription", "รายละเอียด/คำอธิบายสาเหตุ"],
    ["item", "Item"],
    ["errorCaseQty", "จำนวน ErrorCase"],
    ["employeeName", "ชื่อ-สกุลพนักงาน"],
    ["employeeCode", "รหัสพนักงาน"],
    ["errorDate", "วันที่เบิกสินค้า Error"],
    ["shift", "กะ"],
    ["osm", "OSM"],
    ["otm", "OTM"],
    ["auditName", "พนง. AUDIT"]
  ];

  for (const [k, n] of required) {
    if (!String(p[k] || "").trim()) return `กรุณากรอก ${n}`;
  }

  const refRunning = String($("refRunning")?.value || "").trim();
  if (!/^\d+$/.test(refRunning)) return "กรุณากรอกเลข Ref เป็นตัวเลขเท่านั้น";
  if (!/^\d+-\d{4}$/.test(p.refNo)) return "Ref:No. ไม่ถูกต้อง";

  if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) {
    return "กรุณาระบุสาเหตุ (อื่นๆ)";
  }

  if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";
  if (!/^[A-Z0-9]+$/.test(p.employeeCode)) return "รหัสพนักงานต้องเป็น A-Z หรือ/และ 0-9 เท่านั้น";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.errorDate)) return "รูปแบบวันที่เบิกสินค้าไม่ถูกต้อง";

  return "";
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
    saveDraftToLocal_();
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
    saveDraftToLocal_();
    return;
  }

  if (ITEM_LOCAL_CACHE.has(item)) {
    const cached = ITEM_LOCAL_CACHE.get(item);
    ITEM_LOOKUP_STATE = { ...cached, loading: false };
    renderItemLookupState(ITEM_LOOKUP_STATE);
    saveDraftToLocal_();
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
      saveDraftToLocal_();
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
    saveDraftToLocal_();
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
    saveDraftToLocal_();
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
  saveDraftToLocal_();
}

function renderItemLookupState(state) {
  const box = $("itemLookupBox");
  const txt = $("itemLookupText");
  if (!box || !txt) return;

  const item = String(state?.item || "").trim();
  const desc = String(state?.description || "").trim();
  const displayText = String(state?.displayText || "").trim();
  const loading = !!state?.loading;
  const found = !!state?.found;
  const apiError = !!state?.apiError;

  box.classList.remove("hidden", "ok", "notfound", "loading");

  if (!item) {
    box.classList.add("hidden");
    txt.textContent = "-";
    return;
  }

  if (loading) {
    box.classList.add("loading");
    txt.textContent = `กำลังค้นหา Item ${item} ...`;
    return;
  }

  if (found && desc && desc !== ITEM_NOT_FOUND_TEXT) {
    box.classList.add("ok");
    txt.textContent = displayText || `${item} | ${desc}`;
    return;
  }

  box.classList.add("notfound");
  txt.textContent = apiError
    ? `${item} | ${ITEM_NOT_FOUND_TEXT}`
    : `${displayText || `${item} | ${ITEM_NOT_FOUND_TEXT}`}`;
}

function getItemDisplayText() {
  if (ITEM_LOOKUP_STATE && ITEM_LOOKUP_STATE.displayText) {
    return ITEM_LOOKUP_STATE.displayText;
  }
  const item = ($("item")?.value || "").trim();
  return item;
}

/** ==========================
 *  DRAFT / LOCAL SAVE
 *  ========================== */
function bindDraftAutosave_() {
  const ids = [
    "refRunning", "labelCid", "errorReason", "errorReasonOther", "errorDescription",
    "item", "errorCaseQty", "employeeName", "employeeCode", "errorDate",
    "shift", "osm", "otm", "interpreterName", "auditName"
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", debounceSaveDraft_);
    el.addEventListener("change", debounceSaveDraft_);
  });
}

let __saveDraftTimer = null;
function debounceSaveDraft_() {
  clearTimeout(__saveDraftTimer);
  __saveDraftTimer = setTimeout(() => saveDraftToLocal_(), 200);
}

function buildDraftState_() {
  if (!DRAFT_STATE.submitMeta.clientRequestId) {
    DRAFT_STATE.submitMeta.clientRequestId = makeClientRequestId_();
  }

  DRAFT_STATE.savedAt = new Date().toISOString();
  DRAFT_STATE.payload = collectPayload();
  DRAFT_STATE.payload.clientRequestId = DRAFT_STATE.submitMeta.clientRequestId;
  DRAFT_STATE.selectedEmails = getSelectedEmails();

  return DRAFT_STATE;
}

function saveDraftToLocal_() {
  try {
    const state = buildDraftState_();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("saveDraftToLocal_ failed:", err);
  }
}

function loadDraftFromLocal_() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function clearDraftLocal_() {
  localStorage.removeItem(DRAFT_KEY);
  DRAFT_STATE = {
    version: 3,
    savedAt: "",
    payload: {},
    selectedEmails: [],
    signatures: {
      supervisorBase64: "",
      employeeBase64: "",
      interpreterBase64: ""
    },
    uploads: [],
    submitMeta: {
      clientRequestId: "",
      submitted: false,
      finalized: false,
      refNo: "",
      rowNumber: "",
      pdfUrl: "",
      finalizePending: false
    }
  };
}

async function tryRestoreDraft_() {
  const draft = loadDraftFromLocal_();
  if (!draft) return;

  DRAFT_STATE = normalizeDraftState_(draft);

  const meta = DRAFT_STATE.submitMeta || {};
  const isSubmittedPending = !!meta.submitted && !meta.finalized && !!meta.finalizePending;

  const result = await Swal.fire({
    icon: "question",
    title: "พบข้อมูลค้างจากครั้งก่อน",
    html: `
      <div style="text-align:left">
        <div><b>Ref:</b> ${escapeHtml(meta.refNo || DRAFT_STATE.payload?.refNo || "-")}</div>
        <div><b>บันทึกล่าสุด:</b> ${escapeHtml(formatIsoToThaiText_(DRAFT_STATE.savedAt) || "-")}</div>
        <div style="margin-top:8px;color:#475569">
          ${isSubmittedPending
            ? "ข้อมูลหลักถูกบันทึกแล้ว แต่ขั้นตอนสร้าง PDF / ส่งอีเมลยังไม่สำเร็จ สามารถกู้คืนและลองส่งต่อได้ทันที"
            : "พบแบบฟอร์มที่ยังส่งไม่สำเร็จ สามารถกู้คืนเพื่อทำต่อได้"}
        </div>
      </div>
    `,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "กู้คืน",
    denyButtonText: isSubmittedPending ? "ลองส่งต่อเลย" : "ไม่ใช้",
    cancelButtonText: "ลบฉบับร่าง"
  });

  if (result.isConfirmed) {
    restoreDraftToForm_(DRAFT_STATE);
    return;
  }

  if (result.isDenied && isSubmittedPending) {
    restoreDraftToForm_(DRAFT_STATE);
    await retryFinalizeFromDraft_();
    return;
  }

  if (result.dismiss || result.isDismissed) {
    if (result.dismiss === Swal.DismissReason.cancel) {
      clearDraftLocal_();
    }
  }
}

function normalizeDraftState_(draft) {
  const safe = draft || {};
  return {
    version: 3,
    savedAt: safe.savedAt || "",
    payload: safe.payload || {},
    selectedEmails: Array.isArray(safe.selectedEmails) ? safe.selectedEmails : [],
    signatures: {
      supervisorBase64: safe.signatures?.supervisorBase64 || "",
      employeeBase64: safe.signatures?.employeeBase64 || "",
      interpreterBase64: safe.signatures?.interpreterBase64 || ""
    },
    uploads: Array.isArray(safe.uploads) ? safe.uploads : [],
    submitMeta: {
      clientRequestId: safe.submitMeta?.clientRequestId || makeClientRequestId_(),
      submitted: !!safe.submitMeta?.submitted,
      finalized: !!safe.submitMeta?.finalized,
      refNo: safe.submitMeta?.refNo || "",
      rowNumber: safe.submitMeta?.rowNumber || "",
      pdfUrl: safe.submitMeta?.pdfUrl || "",
      finalizePending: !!safe.submitMeta?.finalizePending
    }
  };
}

function restoreDraftToForm_(draft) {
  const p = draft.payload || {};

  if ($("refRunning")) $("refRunning").value = String((p.refNo || "").split("-")[0] || "");
  if ($("labelCid")) $("labelCid").value = p.labelCid || "";
  if ($("errorReason")) $("errorReason").value = p.errorReason || "";
  if ($("errorReasonOther")) $("errorReasonOther").value = p.errorReasonOther || "";
  if ($("errorDescription")) $("errorDescription").value = p.errorDescription || "";
  if ($("item")) $("item").value = p.item || "";
  if ($("errorCaseQty")) $("errorCaseQty").value = p.errorCaseQty || "";
  if ($("employeeName")) $("employeeName").value = p.employeeName || "";
  if ($("employeeCode")) $("employeeCode").value = p.employeeCode || "";
  if ($("errorDate")) $("errorDate").value = p.errorDate || "";
  if ($("shift")) $("shift").value = p.shift || "";
  if ($("osm")) $("osm").value = p.osm || "";
  if ($("otm")) $("otm").value = p.otm || "";
  if ($("interpreterName")) $("interpreterName").value = p.interpreterName || "";
  if ($("auditName")) $("auditName").value = p.auditName || "";
  if ($("refYear")) $("refYear").value = getCurrentBuddhistYear();

  onErrorReasonChange();

  const selected = Array.isArray(draft.selectedEmails) ? draft.selectedEmails : [];
  document.querySelectorAll(".emailChk").forEach(chk => {
    chk.checked = selected.includes(String(chk.value || "").trim());
  });
  updateEmailSelectedText();

  DRAFT_STATE = normalizeDraftState_(draft);
  renderUploadGridFromDraft_();

  if (p.item) {
    if (p.itemDisplay) {
      ITEM_LOOKUP_STATE = {
        item: p.item || "",
        description: p.itemDescription || ITEM_NOT_FOUND_TEXT,
        displayText: p.itemDisplay || p.item,
        found: p.itemDescription && p.itemDescription !== ITEM_NOT_FOUND_TEXT,
        loading: false
      };
      renderItemLookupState(ITEM_LOOKUP_STATE);
    } else {
      lookupItemRealtime(p.item, true).catch(() => {});
    }
  } else {
    ITEM_LOOKUP_STATE = {
      item: "",
      description: "",
      displayText: "",
      found: false,
      loading: false
    };
    renderItemLookupState(ITEM_LOOKUP_STATE);
  }

  if (AUTH.name) setLpsFromLogin(AUTH.name);
  saveDraftToLocal_();
}

function formatIsoToThaiText_(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/** ==========================
 *  UPLOAD DRAFTS
 *  ========================== */
function buildInitialUploadFields() {
  DRAFT_STATE.uploads = Array.isArray(DRAFT_STATE.uploads) ? DRAFT_STATE.uploads : [];

  if (!DRAFT_STATE.uploads.find(x => x.slotId === "slot_emp_card")) {
    DRAFT_STATE.uploads.push({
      slotId: "slot_emp_card",
      label: "บัตรพนง.",
      removable: false,
      filename: "",
      base64: ""
    });
  }

  if (!DRAFT_STATE.uploads.find(x => x.slotId === "slot_emp_photo")) {
    DRAFT_STATE.uploads.push({
      slotId: "slot_emp_photo",
      label: "พนักงาน",
      removable: false,
      filename: "",
      base64: ""
    });
  }

  renderUploadGridFromDraft_();
}

function addUploadField(label, opts = {}) {
  const { removable = true } = opts;
  const slotId = "slot_" + Math.random().toString(16).slice(2);

  DRAFT_STATE.uploads.push({
    slotId,
    label,
    removable,
    filename: "",
    base64: ""
  });

  renderUploadGridFromDraft_();
  saveDraftToLocal_();
}

function renderUploadGridFromDraft_() {
  const grid = $("uploadGrid");
  if (!grid) return;

  const uploads = Array.isArray(DRAFT_STATE.uploads) ? DRAFT_STATE.uploads : [];
  grid.innerHTML = "";

  uploads.forEach((slot) => {
    const box = document.createElement("div");
    box.className = "uploadBox";

    const previewHtml = slot.base64
      ? `<img class="previewImg" src="${slot.base64}" alt="">`
      : `<img class="previewImg" alt="">`;

    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div class="cap">${escapeHtml(slot.label || "ภาพแนบ")}</div>
        ${slot.removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${slot.slotId}">ลบ</button>` : ``}
      </div>
      <input type="file" accept="image/*" data-file-slot="${slot.slotId}">
      ${previewHtml}
      <div class="small">${slot.filename ? `ไฟล์: ${escapeHtml(slot.filename)}` : "ยังไม่เลือกรูป"}</div>
    `;

    grid.appendChild(box);

    const fileInput = box.querySelector(`[data-file-slot="${slot.slotId}"]`);
    fileInput?.addEventListener("change", async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;

      if (!/^image\//.test(f.type)) {
        fileInput.value = "";
        await Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      try {
        const base64 = await compressImageToBase64_(f, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          mimeType: "image/jpeg"
        });

        const target = DRAFT_STATE.uploads.find(x => x.slotId === slot.slotId);
        if (target) {
          target.filename = f.name;
          target.base64 = base64;
        }

        renderUploadGridFromDraft_();
        saveDraftToLocal_();
      } catch (err) {
        console.error(err);
        await Swal.fire({
          icon: "error",
          title: "จัดการรูปภาพไม่สำเร็จ",
          text: "ไม่สามารถเตรียมรูปภาพได้"
        });
      }
    });

    const btnRemove = box.querySelector(`[data-remove="${slot.slotId}"]`);
    btnRemove?.addEventListener("click", () => {
      DRAFT_STATE.uploads = DRAFT_STATE.uploads.filter(x => x.slotId !== slot.slotId);
      renderUploadGridFromDraft_();
      saveDraftToLocal_();
    });
  });
}

function getUploadFilesForSubmit_() {
  const uploads = Array.isArray(DRAFT_STATE.uploads) ? DRAFT_STATE.uploads : [];
  const picked = uploads
    .filter(x => x.base64)
    .map(x => ({
      filename: x.filename || `${x.label || "image"}.jpg`,
      base64: x.base64
    }));

  if (picked.length > 6) {
    throw new Error("เลือกได้สูงสุด 6 รูป");
  }

  return picked;
}

async function compressImageToBase64_(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = "image/jpeg"
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const base64 = canvas.toDataURL(mimeType, quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** ==========================
 *  SIGNATURE
 *  ========================== */
async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
  DRAFT_STATE.signatures = DRAFT_STATE.signatures || {
    supervisorBase64: "",
    employeeBase64: "",
    interpreterBase64: ""
  };

  const useExisting = await askReuseSignaturesIfAny_();
  if (useExisting === "reuse") {
    return {
      ok: true,
      supervisorBase64: DRAFT_STATE.signatures.supervisorBase64 || "",
      employeeBase64: DRAFT_STATE.signatures.employeeBase64 || "",
      interpreterBase64: DRAFT_STATE.signatures.interpreterBase64 || ""
    };
  }

  const sup = await signatureModal("ลายเซ็นหัวหน้างาน", `ผู้เซ็น: ${supervisorName || "-"}`);
  if (!sup.ok) return { ok: false };
  DRAFT_STATE.signatures.supervisorBase64 = sup.base64 || "";
  saveDraftToLocal_();

  const emp = await signatureModal("ลายเซ็นพนักงานที่เบิกสินค้า Error", `ผู้เซ็น: ${employeeName || "-"}`);
  if (!emp.ok) return { ok: false };
  DRAFT_STATE.signatures.employeeBase64 = emp.base64 || "";
  saveDraftToLocal_();

  const hasInterpreter = String(interpreterName || "").trim().length > 0;
  if (!hasInterpreter) {
    DRAFT_STATE.signatures.interpreterBase64 = "";
    saveDraftToLocal_();
    return {
      ok: true,
      supervisorBase64: DRAFT_STATE.signatures.supervisorBase64,
      employeeBase64: DRAFT_STATE.signatures.employeeBase64,
      interpreterBase64: ""
    };
  }

  const intr = await signatureModal("ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${interpreterName || "-"}`);
  if (!intr.ok) return { ok: false };

  DRAFT_STATE.signatures.interpreterBase64 = intr.base64 || "";
  saveDraftToLocal_();

  return {
    ok: true,
    supervisorBase64: DRAFT_STATE.signatures.supervisorBase64,
    employeeBase64: DRAFT_STATE.signatures.employeeBase64,
    interpreterBase64: DRAFT_STATE.signatures.interpreterBase64
  };
}

async function askReuseSignaturesIfAny_() {
  const s = DRAFT_STATE.signatures || {};
  const hasAny = !!(s.supervisorBase64 || s.employeeBase64 || s.interpreterBase64);
  if (!hasAny) return "new";

  const res = await Swal.fire({
    icon: "question",
    title: "พบลายเซ็นที่บันทึกไว้",
    text: "ต้องการใช้ลายเซ็นเดิมหรือเซ็นใหม่",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "ใช้ลายเซ็นเดิม",
    denyButtonText: "เซ็นใหม่",
    cancelButtonText: "ยกเลิก"
  });

  if (res.isConfirmed) return "reuse";
  if (res.isDenied) return "new";
  return "cancel";
}

async function signatureModal(title, subtitle) {
  const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
  const clearId = canvasId + "_clear";

  const html = `
    <div class="sigModalWrap">
      <div class="sigModalHead">
        <div class="sigModalSub">${escapeHtml(subtitle || "")}</div>
        <div class="sigModalTip">กรุณาเซ็นภายในกรอบด้านล่าง โดยใช้เมาส์หรือนิ้วลากเขียนลายเซ็น</div>
      </div>

      <div class="sigCanvasCard">
        <canvas id="${canvasId}" width="800" height="260" class="sigCanvasElm"></canvas>
      </div>

      <div class="sigModalFoot">
        <button type="button" id="${clearId}" class="sigActionBtn sigActionBtn-clear">ล้างลายเซ็น</button>
      </div>
    </div>
  `;

  const res = await Swal.fire({
    title: escapeHtml(title || "ลายเซ็น"),
    html,
    showCancelButton: true,
    confirmButtonText: "ยืนยันลายเซ็น",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    customClass: {
      popup: "sigSwalPopup",
      title: "sigSwalTitle",
      htmlContainer: "sigSwalHtml",
      actions: "sigSwalActions",
      confirmButton: "sigBtn sigBtn-confirm",
      cancelButton: "sigBtn sigBtn-cancel"
    },
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
 *  PREVIEW
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

  const fileCount = getUploadFilesForSubmit_().length;
  const emails = Array.isArray(p.emailRecipients) ? p.emailRecipients : [];

  await Swal.fire({
    title: "ตรวจสอบก่อนบันทึก",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">สรุปข้อมูลก่อนบันทึก</div>
          <div class="swalHeroSub">ระบบจะเก็บฉบับร่างไว้ให้อัตโนมัติ แม้เกิดปัญหาระหว่างส่งข้อมูล</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
            <div class="swalPill">รูป ${fileCount} รูป</div>
            <div class="swalPill">Email ${emails.length} รายการ</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">Label CID</div><div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">วันที่เบิกสินค้า Error</div><div class="swalKvValue">${escapeHtml(p.errorDate || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">กะ</div><div class="swalKvValue">${escapeHtml(p.shift || "-")}</div></div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเหตุการณ์</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">สาเหตุ Error</div><div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + (p.errorReasonOther || "")) : (p.errorReason || "-"))}</div></div>
            <div class="swalKv"><div class="swalKvLabel">Item</div><div class="swalKvValue">${escapeHtml(getItemDisplayText() || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">จำนวน ErrorCase</div><div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div></div>
          </div>

          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">รายละเอียดเหตุการณ์</div>
            <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
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
 *  SUBMIT + FINALIZE
 *  ========================== */
async function submitForm() {
  if (!AUTH.pass || !AUTH.name) {
    return Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อน"
    });
  }

  if (!DRAFT_STATE.submitMeta.clientRequestId) {
    DRAFT_STATE.submitMeta.clientRequestId = makeClientRequestId_();
  }

  const p = collectPayload();
  p.clientRequestId = DRAFT_STATE.submitMeta.clientRequestId;

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
    files = getUploadFilesForSubmit_();
  } catch (fileErr) {
    return Swal.fire({
      icon: "warning",
      title: "ไฟล์แนบไม่พร้อม",
      text: fileErr?.message || "ตรวจสอบรูปภาพที่แนบ"
    });
  }

  let signRes = null;
  if (DRAFT_STATE.submitMeta.submitted && DRAFT_STATE.submitMeta.finalizePending) {
    const retry = await Swal.fire({
      icon: "question",
      title: "พบข้อมูลที่บันทึกแล้วแต่ยังไม่สร้างเอกสารเสร็จ",
      text: "ต้องการลองส่งขั้นตอนสร้าง PDF / ส่งอีเมลต่อจากข้อมูลเดิมหรือไม่",
      showCancelButton: true,
      confirmButtonText: "ลองส่งต่อ",
      cancelButtonText: "ยกเลิก"
    });

    if (!retry.isConfirmed) return;
    return await retryFinalizeFromDraft_();
  }

  signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
  if (!signRes || !signRes.ok) return;

  saveDraftToLocal_();

  const submitBody = {
    pass: AUTH.pass,
    payload: p,
    files,
    signatures: {
      supervisorBase64: signRes.supervisorBase64 || "",
      employeeBase64: signRes.employeeBase64 || "",
      interpreterBase64: signRes.interpreterBase64 || ""
    }
  };

  Swal.fire({
    title: "กำลังบันทึกข้อมูลหลัก",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">กำลังบันทึกข้อมูล</div>
          <div class="swalHeroSub">ขั้นตอนนี้จะบันทึกข้อมูลหลัก รูปภาพ และลายเซ็นก่อน เพื่อป้องกันข้อมูลหาย</div>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  let submitJson;
  try {
    const res = await fetch(apiUrl("/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitBody)
    });

    const text = await res.text();
    submitJson = JSON.parse(text);

    if (!res.ok || !submitJson.ok) {
      throw new Error(submitJson.error || `HTTP ${res.status}`);
    }
  } catch (err2) {
    console.error(err2);
    saveDraftToLocal_();
    return Swal.fire({
      icon: "error",
      title: "บันทึกข้อมูลหลักไม่สำเร็จ",
      html: `
        <div style="text-align:left">
          <div>ระบบได้เก็บฉบับร่างไว้ในเครื่องแล้ว</div>
          <div style="margin-top:8px;color:#475569">คุณสามารถเปิดหน้าเดิมแล้วกู้คืนข้อมูลเพื่อส่งใหม่ได้ โดยไม่ต้องกรอกและเซ็นใหม่ทั้งหมด</div>
        </div>
      `
    });
  }

  DRAFT_STATE.submitMeta.submitted = true;
  DRAFT_STATE.submitMeta.refNo = submitJson.refNo || p.refNo || "";
  DRAFT_STATE.submitMeta.rowNumber = submitJson.rowNumber || "";
  DRAFT_STATE.submitMeta.finalizePending = true;
  DRAFT_STATE.submitMeta.finalized = false;
  saveDraftToLocal_();

  await Swal.fire({
    icon: "success",
    title: "บันทึกข้อมูลหลักสำเร็จ",
    html: `
      <div style="text-align:left">
        <div>ข้อมูลหลักถูกบันทึกแล้วเรียบร้อย</div>
        <div style="margin-top:8px;color:#475569">ระบบจะดำเนินการขั้นตอนสร้าง PDF / ส่งอีเมลต่อ</div>
      </div>
    `,
    confirmButtonText: "ดำเนินการต่อ"
  });

  return await finalizeAfterSubmit_();
}

async function finalizeAfterSubmit_() {
  Swal.fire({
    title: "กำลังสร้างเอกสารและส่งอีเมล",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">กำลังประมวลผลขั้นสุดท้าย</div>
          <div class="swalHeroSub">กำลังค้นข้อมูลวินัย สร้าง PDF และส่งอีเมล</div>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  let json;
  try {
    const res = await fetch(apiUrl("/finalize"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass: AUTH.pass,
        clientRequestId: DRAFT_STATE.submitMeta.clientRequestId
      })
    });

    const text = await res.text();
    json = JSON.parse(text);

    if (!res.ok || !json.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(err);

    DRAFT_STATE.submitMeta.finalizePending = true;
    DRAFT_STATE.submitMeta.finalized = false;
    saveDraftToLocal_();

    return Swal.fire({
      icon: "warning",
      title: "บันทึกข้อมูลหลักแล้ว แต่ขั้นตอนสุดท้ายยังไม่สำเร็จ",
      html: `
        <div style="text-align:left">
          <div><b>สถานะ:</b> ข้อมูลหลัก รูป และลายเซ็น ถูกเก็บไว้แล้ว</div>
          <div style="margin-top:8px">ขั้นตอนสร้าง PDF / ส่งอีเมลยังไม่สำเร็จ</div>
          <div style="margin-top:8px;color:#475569">คุณสามารถกดส่งใหม่ภายหลังได้ โดยไม่ต้องเซ็นใหม่</div>
        </div>
      `,
      confirmButtonText: "ตกลง"
    });
  }

  DRAFT_STATE.submitMeta.finalizePending = false;
  DRAFT_STATE.submitMeta.finalized = true;
  DRAFT_STATE.submitMeta.pdfUrl = json.pdfUrl || "";
  saveDraftToLocal_();

  await showSuccessResult_(json);

  clearDraftLocal_();
  resetForm(true);
}

async function retryFinalizeFromDraft_() {
  if (!AUTH.pass) {
    return Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อนลองส่งต่อ"
    });
  }

  if (!DRAFT_STATE.submitMeta.clientRequestId || !DRAFT_STATE.submitMeta.submitted) {
    return Swal.fire({
      icon: "warning",
      title: "ไม่พบข้อมูลที่พร้อมส่งต่อ"
    });
  }

  return await finalizeAfterSubmit_();
}

async function showSuccessResult_(json) {
  const p = collectPayload();
  const emailResult = json.emailResult || {};

  const galleryHtml = renderGalleryHtml(json.imageIds || DRAFT_STATE.uploads.filter(x => x.base64).map((_, i) => `draft_${i}`), true);

  const supSignThumb = DRAFT_STATE.signatures.supervisorBase64
    ? `<img class="sigThumb" src="${DRAFT_STATE.signatures.supervisorBase64}" alt="sign supervisor">`
    : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

  const empSignThumb = DRAFT_STATE.signatures.employeeBase64
    ? `<img class="sigThumb" src="${DRAFT_STATE.signatures.employeeBase64}" alt="sign employee">`
    : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

  const intSignThumb = DRAFT_STATE.signatures.interpreterBase64
    ? `<img class="sigThumb" src="${DRAFT_STATE.signatures.interpreterBase64}" alt="sign interpreter">`
    : `<div class="swalNote">ไม่มีลายเซ็น</div>`;

  await Swal.fire({
    icon: "success",
    title: "บันทึกสำเร็จ",
    confirmButtonText: "ปิดหน้าต่าง",
    confirmButtonColor: "#2563eb",
    width: 920,
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
          <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ ลายเซ็น เอกสาร PDF และสถานะอีเมลเรียบร้อย</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
            <div class="swalPill">Ref: ${escapeHtml(json.refNo || p.refNo || "-")}</div>
            <div class="swalPill">วินัย ${Number(json.disciplineMatchCount || 0)}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(json.refNo || p.refNo || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">PDF</div><div class="swalKvValue">${escapeHtml(json.pdfSizeText || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">วินัย</div><div class="swalKvValue">${Number(json.disciplineMatchCount || 0)} รายการ</div></div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">สถานะอีเมล</div>
          ${
            emailResult.skipped
              ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
              : emailResult.ok
                ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ ${Number(emailResult.count || 0)} รายการ</div>`
                : `<div class="swalEmailFail">ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailResult.error || "-")}</div>`
          }
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ลายเซ็น</div>
          <div class="sigGrid">
            <div><div class="sigBoxTitle">หัวหน้างาน</div>${supSignThumb}<div class="sigName">${escapeHtml(p.otm || "-")}</div></div>
            <div><div class="sigBoxTitle">พนักงาน</div>${empSignThumb}<div class="sigName">${escapeHtml(p.employeeName || "-")}</div></div>
            <div><div class="sigBoxTitle">ล่ามแปลภาษา</div>${intSignThumb}<div class="sigName">${escapeHtml(p.interpreterName || "-")}</div></div>
          </div>
        </div>

        ${
          json.pdfUrl
            ? `<div class="swalActionLink"><a href="${json.pdfUrl}" target="_blank" rel="noopener noreferrer">เปิดไฟล์ PDF รายงาน</a></div>`
            : ""
        }
      </div>
    `
  });
}

/** ==========================
 *  RENDER GALLERY
 *  ========================== */
function driveImgUrl(id) {
  return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
}

function renderGalleryHtml(imageIds = [], isDraftMode = false) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

  if (isDraftMode) {
    const localUploads = DRAFT_STATE.uploads.filter(x => x.base64);
    const cards = localUploads.map((u, i) => `
      <button type="button" class="galItem" data-local-index="${i}" aria-label="ดูรูปที่ ${i + 1}">
        <div class="galThumbWrap">
          <img class="galThumb" src="${u.base64}" alt="รูปที่ ${i + 1}" loading="lazy">
          <div class="galBadge">${i + 1}</div>
        </div>
        <div class="galCap">${escapeHtml(u.label || `รูปภาพแนบ ${i + 1}`)}</div>
      </button>
    `).join("");

    return `<div class="galGrid">${cards}</div>`;
  }

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

/** ==========================
 *  RESET
 *  ========================== */
function resetForm(keepAuth = false) {
  const ids = [
    "refRunning",
    "labelCid",
    "errorReasonOther",
    "errorDescription",
    "item",
    "errorCaseQty",
    "employeeName",
    "errorDate",
    "employeeCode",
    "osm",
    "interpreterName",
    "otm"
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });

  const er = $("errorReason");
  const audit = $("auditName");
  const shift = $("shift");
  const refYear = $("refYear");

  if (er) er.value = "";
  if (audit) audit.value = "";
  if (shift) shift.value = "";
  if (refYear) refYear.value = getCurrentBuddhistYear();

  document.querySelectorAll(".emailChk").forEach(chk => chk.checked = false);
  updateEmailSelectedText();

  $("wrapErrorOther")?.classList.add("hidden");

  ITEM_LOOKUP_STATE = {
    item: "",
    description: "",
    displayText: "",
    found: false,
    loading: false
  };
  renderItemLookupState(ITEM_LOOKUP_STATE);

  clearDraftLocal_();
  buildInitialUploadFields();

  if (keepAuth) {
    setLpsFromLogin(AUTH.name || "");
    DRAFT_STATE.submitMeta.clientRequestId = makeClientRequestId_();
    saveDraftToLocal_();
  }
}

/** ==========================
 *  HELPERS
 *  ========================== */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

//   const res = await Swal.fire({
//     title: escapeHtml(title || "ลายเซ็น"),
//     html,
//     showCancelButton: true,
//     confirmButtonText: "ยืนยันลายเซ็น",
//     cancelButtonText: "ยกเลิก",
//     buttonsStyling: false,
//     customClass: {
//       popup: "sigSwalPopup",
//       title: "sigSwalTitle",
//       htmlContainer: "sigSwalHtml",
//       actions: "sigSwalActions",
//       confirmButton: "sigBtn sigBtn-confirm",
//       cancelButton: "sigBtn sigBtn-cancel"
//     },
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

// function resetForm() {
//   const ids = [
//     "refRunning",
//     "labelCid",
//     "errorReasonOther",
//     "errorDescription",
//     "item",
//     "errorCaseQty",
//     "employeeName",
//     "errorDate",
//     "employeeCode",
//     "osm",
//     "interpreterName",
//     "otm"
//   ];

//   ids.forEach((id) => {
//     const el = $(id);
//     if (el) el.value = "";
//   });

//   const er = $("errorReason");
//   const audit = $("auditName");
//   const shift = $("shift");
//   const refYear = $("refYear");

//   if (er) er.value = "";
//   if (audit) audit.value = "";
//   if (shift) shift.value = "";
//   if (refYear) refYear.value = getCurrentBuddhistYear();

//   document.querySelectorAll(".emailChk").forEach(chk => chk.checked = false);
//   updateEmailSelectedText();

//   $("wrapErrorOther")?.classList.add("hidden");

//   document.querySelectorAll(".previewImg").forEach((img) => {
//     if (img.dataset && img.dataset.objectUrl) {
//       try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       img.dataset.objectUrl = "";
//     }
//     img.removeAttribute("src");
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
//   setLpsFromLogin(AUTH.name || "");
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

// function escapeHtml(s) {
//   return String(s ?? "")
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#039;");
// }

// function setLpsFromLogin(loginName) {
//   const lpsEl = $("lps");
//   if (lpsEl) {
//     lpsEl.value = loginName || "";
//     lpsEl.readOnly = true;
//   }

//   const pill = $("userPill");
//   if (pill) {
//     pill.textContent = "ผู้ใช้งาน: " + (loginName || "-");
//   }
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
