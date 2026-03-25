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


/** ==========================
 *  FRONTEND APP
 *  app.js
 *  ========================== */
// const API_BASE = "https://bol.somchaibutphon.workers.dev";
// const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
// const ITEM_LOOKUP_MIN_LEN = 3;
// const ITEM_LOOKUP_DEBOUNCE_MS = 420;

// /** ==========================
//  *  STATE
//  *  ========================== */
// let OPTIONS = {
//   errorList: [],
//   auditList: [],
//   emailList: [],
//   osmList: [],
//   otmList: [],
//   confirmCauseList: []
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
//   buildWorkAgeOptions();

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

//   setActiveTab("error");
//   updateEmployeeConfirmPreview();
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

//   [
//     "employeeName", "employeeCode", "errorDate", "shift",
//     "errorReason", "errorReasonOther", "item", "errorCaseQty",
//     "confirmCauseOther"
//   ].forEach((id) => {
//     $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
//     $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
//   });
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

//   OPTIONS = json.data || {
//     errorList: [],
//     auditList: [],
//     emailList: [],
//     osmList: [],
//     otmList: [],
//     confirmCauseList: []
//   };
// }

// function fillFormDropdowns() {
//   const er = $("errorReason");
//   const audit = $("auditName");
//   const osm = $("osm");
//   const otm = $("otm");

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

//   if (osm) {
//     osm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.osmList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }

//   if (otm) {
//     otm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.otmList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }
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

// /** ==========================
//  *  Confirm Cause
//  *  ========================== */
// function onErrorReasonChange() {
//   const v = $("errorReason")?.value || "";
//   $("wrapErrorOther")?.classList.toggle("hidden", v !== "อื่นๆ");
//   renderConfirmCauseSelector();
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
//     updateConfirmCauseOtherState();
//     return;
//   }

//   const groups = {};
//   filtered.forEach((item) => {
//     const g = item.group || "อื่นๆ";
//     if (!groups[g]) groups[g] = [];
//     groups[g].push(item);
//   });

//   root.innerHTML = Object.keys(groups).map((group) => {
//     const cards = groups[group].map((item, idx) => {
//       const id = `cc_${group}_${idx}_${Math.random().toString(16).slice(2)}`;
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
//       updateConfirmCauseOtherState();
//       updateEmployeeConfirmPreview();
//     });
//   });

//   updateConfirmCauseOtherState();
// }

// function getSelectedConfirmCauses() {
//   return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .map(el => String(el.value || "").trim())
//     .filter(Boolean);
// }

// function updateConfirmCauseOtherState() {
//   const wrap = $("wrapConfirmCauseOther");
//   const requiresText = Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .some(el => String(el.dataset.requiresText || "") === "1");

//   wrap?.classList.toggle("hidden", !requiresText);
// }

// function composeConfirmCauseSummary(selected, otherText) {
//   const list = Array.isArray(selected) ? selected.filter(Boolean) : [];
//   const other = String(otherText || "").trim();
//   const out = list.slice();
//   if (other) out.push("อื่นๆ: " + other);
//   return out.join(" | ");
// }

// function buildEmployeeConfirmText(payload) {
//   const employeeName = String(payload.employeeName || "").trim() || "-";
//   const employeeCode = String(payload.employeeCode || "").trim() || "-";
//   const errorDate = String(payload.errorDate || "").trim() || "-";
//   const shift = String(payload.shift || "").trim() || "-";
//   const refNo = String(payload.refNo || "").trim() || "-";
//   const errorReason = String(payload.errorReason || "").trim() || "-";
//   const itemDisplay = String(payload.itemDisplay || getItemDisplayText() || "-").trim() || "-";
//   const errorCaseQty = String(payload.errorCaseQty || "").trim() || "-";

//   const selected = Array.isArray(payload.confirmCauseSelected) ? payload.confirmCauseSelected.filter(Boolean) : [];
//   const other = String(payload.confirmCauseOther || "").trim();

//   const lines = [];
//   selected.forEach((t, i) => lines.push(`${i + 1}) ${t}`));
//   if (other) lines.push(`${lines.length + 1}) อื่นๆ: ${other}`);

//   const factText = lines.length
//     ? lines.join("\n")
//     : "1) ข้าพเจ้ายืนยันว่ารับทราบข้อเท็จจริงตามเอกสารฉบับนี้";

//   return [
//     `ข้าพเจ้า ${employeeName} รหัสพนักงาน ${employeeCode} ปฏิบัติงานวันที่ ${errorDate} กะ ${shift} ขอรับรองว่าได้รับทราบรายละเอียดการเบิกสินค้า Error ตามเอกสารเลขที่อ้างอิง ${refNo}`,
//     `โดยมีสาเหตุหลักคือ ${errorReason} รายการสินค้า ${itemDisplay} และจำนวน ErrorCase ${errorCaseQty}`,
//     `ข้าพเจ้าขอยืนยันข้อเท็จจริงดังต่อไปนี้`,
//     factText,
//     `ทั้งนี้ ข้าพเจ้ายินยอมให้ใช้เอกสารฉบับนี้เป็นหลักฐานประกอบการตรวจสอบภายใน และการดำเนินการตามระเบียบของบริษัทต่อไป`
//   ].join("\n");
// }

// function updateEmployeeConfirmPreview() {
//   const preview = $("employeeConfirmPreview");
//   if (!preview) return;

//   const p = collectPayloadBase();
//   p.confirmCauseSelected = getSelectedConfirmCauses();
//   p.confirmCauseOther = ($("confirmCauseOther")?.value || "").trim();
//   p.employeeConfirmText = buildEmployeeConfirmText(p);

//   preview.value = p.employeeConfirmText;
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

// /** ==========================
//  *  Basic sanitizers
//  *  ========================== */
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
// function collectPayloadBase() {
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
//     workAgeYear: ($("workAgeYear")?.value || "").trim(),
//     workAgeMonth: ($("workAgeMonth")?.value || "").trim(),
//     nationality: ($("nationality")?.value || "").trim(),
//     shift: ($("shift")?.value || "").trim(),
//     osm: ($("osm")?.value || "").trim(),
//     otm: ($("otm")?.value || "").trim(),
//     interpreterName: ($("interpreterName")?.value || "").trim(),
//     auditName: ($("auditName")?.value || "").trim(),
//     emailRecipients: getSelectedEmails()
//   };
// }

// function collectPayload() {
//   const p = collectPayloadBase();
//   p.confirmCauseSelected = getSelectedConfirmCauses();
//   p.confirmCauseOther = ($("confirmCauseOther")?.value || "").trim();
//   p.employeeConfirmText = buildEmployeeConfirmText({
//     ...p,
//     confirmCauseSelected: p.confirmCauseSelected,
//     confirmCauseOther: p.confirmCauseOther
//   });
//   return p;
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

//   const mustOther = Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .some(el => String(el.dataset.requiresText || "") === "1");

//   if (mustOther && !String(p.confirmCauseOther || "").trim()) {
//     return "กรุณาระบุรายละเอียดเพิ่มเติมในสาเหตุอื่นๆ";
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
//           <div class="swalSectionTitle">ข้อเท็จจริงที่พนักงานยืนยัน</div>
//           <div class="swalDesc">
//             <div class="swalDescLabel">รายการที่เลือก</div>
//             <div class="swalDescValue">${escapeHtml(composeConfirmCauseSummary(p.confirmCauseSelected, p.confirmCauseOther) || "-").replaceAll("|", "<br>")}</div>
//           </div>

//           <div class="swalDesc" style="margin-top:8px;">
//             <div class="swalDescLabel">คำยืนยันของพนักงาน</div>
//             <div class="swalDescValue">${escapeHtml(p.employeeConfirmText || "-").replaceAll("\n", "<br>")}</div>
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
//     "interpreterName",
//     "confirmCauseOther"
//   ];

//   ids.forEach((id) => {
//     const el = $(id);
//     if (el) el.value = "";
//   });

//   const er = $("errorReason");
//   const audit = $("auditName");
//   const shift = $("shift");
//   const refYear = $("refYear");
//   const osm = $("osm");
//   const otm = $("otm");
//   const nationality = $("nationality");
//   const workAgeYear = $("workAgeYear");
//   const workAgeMonth = $("workAgeMonth");
//   const preview = $("employeeConfirmPreview");

//   if (er) er.value = "";
//   if (audit) audit.value = "";
//   if (shift) shift.value = "";
//   if (osm) osm.value = "";
//   if (otm) otm.value = "";
//   if (nationality) nationality.value = "";
//   if (workAgeYear) workAgeYear.value = "";
//   if (workAgeMonth) workAgeMonth.value = "";
//   if (refYear) refYear.value = getCurrentBuddhistYear();
//   if (preview) preview.value = "";

//   document.querySelectorAll(".emailChk").forEach(chk => chk.checked = false);
//   updateEmailSelectedText();

//   $("wrapErrorOther")?.classList.add("hidden");
//   $("wrapConfirmCauseOther")?.classList.add("hidden");

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
//   renderConfirmCauseSelector();
//   setLpsFromLogin(AUTH.name || "");
//   updateEmployeeConfirmPreview();
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

// window.APP_AUTH_PASS = "";
// window.APP_ACTIVE_MODE = "error";

// const API_BASE = "https://bol.somchaibutphon.workers.dev";
// const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
// const ITEM_LOOKUP_MIN_LEN = 3;
// const ITEM_LOOKUP_DEBOUNCE_MS = 420;

// /** ==========================
//  *  STATE
//  *  ========================== */
// let OPTIONS = {
//   errorList: [],
//   auditList: [],
//   emailList: [],
//   osmList: [],
//   otmList: [],
//   confirmCauseList: []
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

// init().catch((err) => {
//   console.error(err);
//   safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
// });

// async function init() {
//   bindTabs();
//   buildInitialUploadFields();
//   bindEvents();
//   bindRefInputs();
//   buildWorkAgeOptions();
//   applyInitialShellState();

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

//   updateEmployeeConfirmPreview();
// }

// function applyInitialShellState() {
//   const hasSession = !!(window.APP_AUTH_PASS || localStorage.getItem("report500_pass"));

//   if (!hasSession) {
//     $("modeTabs")?.classList.add("hidden");
//     $("loginCard")?.classList.remove("hidden");
//     $("formCard")?.classList.add("hidden");
//     $("under500Card")?.classList.add("hidden");
//     return;
//   }

//   window.APP_AUTH_PASS = localStorage.getItem("report500_pass") || window.APP_AUTH_PASS || "";
//   $("modeTabs")?.classList.remove("hidden");
//   $("loginCard")?.classList.add("hidden");
//   setActiveTab(window.APP_ACTIVE_MODE || "error");
// }

// function safeSetLoginMsg(msg) {
//   const el = $("loginMsg");
//   if (el) el.textContent = msg || "";
// }

// function bindTabs() {
//   $("tabErrorBol")?.addEventListener("click", async () => {
//     if (!(await ensureSessionBeforeSwitch())) return;
//     setActiveTab("error");
//   });

//   $("tabUnder500")?.addEventListener("click", async () => {
//     if (!(await ensureSessionBeforeSwitch())) return;
//     setActiveTab("u500");
//   });
// }

// async function ensureSessionBeforeSwitch() {
//   if (AUTH.name || window.APP_AUTH_PASS || localStorage.getItem("report500_pass")) {
//     return true;
//   }

//   await Swal.fire({
//     icon: "warning",
//     title: "กรุณาเข้าสู่ระบบก่อน",
//     text: "โปรดเข้าสู่ระบบจากหน้าหลักก่อน แล้วจึงเลือกแท็บที่ต้องการ"
//   });
//   return false;
// }

// function setActiveTab(which) {
//   window.APP_ACTIVE_MODE = which === "u500" ? "u500" : "error";

//   $("tabErrorBol")?.classList.toggle("active", which === "error");
//   $("tabUnder500")?.classList.toggle("active", which === "u500");

//   const loggedIn = !!(AUTH.name || window.APP_AUTH_PASS || localStorage.getItem("report500_pass"));

//   if (!loggedIn) {
//     $("modeTabs")?.classList.add("hidden");
//     $("loginCard")?.classList.remove("hidden");
//     $("formCard")?.classList.add("hidden");
//     $("under500Card")?.classList.add("hidden");
//     return;
//   }

//   $("modeTabs")?.classList.remove("hidden");
//   $("loginCard")?.classList.add("hidden");
//   $("formCard")?.classList.toggle("hidden", which !== "error");
//   $("under500Card")?.classList.toggle("hidden", which !== "u500");

//   document.dispatchEvent(
//     new CustomEvent("app:mode-change", {
//       detail: { mode: which === "u500" ? "report500" : "error" }
//     })
//   );
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

//   [
//     "employeeName", "employeeCode", "errorDate", "shift",
//     "errorReason", "errorReasonOther", "item", "errorCaseQty",
//     "confirmCauseOther"
//   ].forEach((id) => {
//     $(id)?.addEventListener("input", updateEmployeeConfirmPreview);
//     $(id)?.addEventListener("change", updateEmployeeConfirmPreview);
//   });
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

//   OPTIONS = json.data || {
//     errorList: [],
//     auditList: [],
//     emailList: [],
//     osmList: [],
//     otmList: [],
//     confirmCauseList: []
//   };
// }

// function fillFormDropdowns() {
//   const er = $("errorReason");
//   const audit = $("auditName");
//   const osm = $("osm");
//   const otm = $("otm");

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

//   if (osm) {
//     osm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.osmList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }

//   if (otm) {
//     otm.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.otmList || []).map((n) => `<option>${escapeHtml(n)}</option>`).join("");
//   }
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
//       safeSetLoginMsg(json.message || json.error || "เข้าสู่ระบบไม่สำเร็จ");
//       return;
//     }
//   } catch (err) {
//     console.error("LOGIN FETCH ERROR:", err);
//     safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
//     return;
//   }

//   const lpsName = String((json.user && json.user.name) || json.name || "").trim();
//   if (!lpsName) {
//     safeSetLoginMsg("ไม่พบชื่อผู้ใช้งานจากระบบ");
//     return;
//   }

//   window.APP_AUTH_PASS = pass;
//   localStorage.setItem("report500_pass", pass);

//   AUTH = { name: lpsName, pass };
//   setLpsFromLogin(lpsName);

//   $("modeTabs")?.classList.remove("hidden");
//   $("loginCard")?.classList.add("hidden");

//   document.dispatchEvent(
//     new CustomEvent("app:auth-success", {
//       detail: {
//         pass,
//         response: json
//       }
//     })
//   );

//   setActiveTab("error");
// }
// function onErrorReasonChange() {
//   const v = $("errorReason")?.value || "";
//   $("wrapErrorOther")?.classList.toggle("hidden", v !== "อื่นๆ");
//   renderConfirmCauseSelector();
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
//     updateConfirmCauseOtherState();
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
//       updateConfirmCauseOtherState();
//       updateEmployeeConfirmPreview();
//     });
//   });

//   updateConfirmCauseOtherState();
// }

// function getSelectedConfirmCauses() {
//   return Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .map(el => String(el.value || "").trim())
//     .filter(Boolean);
// }

// function getSelectedConfirmCausesForNarrative() {
//   return getSelectedConfirmCauses().filter((v) => String(v || "").trim() !== "อื่นๆ");
// }

// function updateConfirmCauseOtherState() {
//   const wrap = $("wrapConfirmCauseOther");
//   const requiresText = Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .some(el => String(el.dataset.requiresText || "") === "1");

//   wrap?.classList.toggle("hidden", !requiresText);
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
//     `ข้าพเจ้าชื่อ ${employeeName} รหัสพนักงาน ${employeeCode} ปฏิบัติงานวันที่ ${errorDate} ในกะ ${shift} ขอรับรองว่าได้รับทราบรายละเอียดการเบิกสินค้า Error ตามเอกสารเลขที่อ้างอิง ${refNo} แล้ว`,
//     `โดยมีสาเหตุหลักคือ ${errorReason} รายการสินค้า ${itemDisplay} จำนวนผิดพลาด ${errorCaseQty} เคส`,
//     `ข้าพเจ้าขอยืนยันข้อเท็จจริงดังต่อไปนี้`,
//     factText,
//     `ข้าพเจ้าขอรับรองว่าข้อความดังกล่าวเป็นข้อมูลตามที่ได้ชี้แจงไว้จริง และยินยอมให้ใช้เอกสารฉบับนี้เป็นหลักฐานประกอบการตรวจสอบภายใน และการดำเนินการตามระเบียบของบริษัทต่อไป`
//   ].join("\n");
// }

// function updateEmployeeConfirmPreview() {
//   const preview = $("employeeConfirmPreview");
//   if (!preview) return;

//   const p = collectPayloadBase();
//   p.confirmCauseSelected = getSelectedConfirmCausesForNarrative();
//   p.confirmCauseOther = ($("confirmCauseOther")?.value || "").trim();
//   p.errorDate = formatDateToDisplay(p.errorDate);
//   p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
//   p.employeeConfirmText = buildEmployeeConfirmText(p);

//   preview.value = p.employeeConfirmText;
// }

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
//   const row = $("itemLookupRow");
//   const box = $("itemLookupBox");
//   const txt = $("itemLookupText");
//   if (!row || !box || !txt) return;

//   const item = String(state?.item || "").trim();
//   const desc = String(state?.description || "").trim();
//   const displayText = String(state?.displayText || "").trim();
//   const loading = !!state?.loading;
//   const found = !!state?.found;
//   const apiError = !!state?.apiError;

//   row.classList.add("hidden");
//   box.classList.remove("ok", "notfound", "loading");

//   if (!item) {
//     txt.textContent = "-";
//     return;
//   }

//   row.classList.remove("hidden");

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

// function collectPayloadBase() {
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
//     workAgeYear: ($("workAgeYear")?.value || "").trim(),
//     workAgeMonth: ($("workAgeMonth")?.value || "").trim(),
//     nationality: ($("nationality")?.value || "").trim(),
//     shift: ($("shift")?.value || "").trim(),
//     osm: ($("osm")?.value || "").trim(),
//     otm: ($("otm")?.value || "").trim(),
//     interpreterName: ($("interpreterName")?.value || "").trim(),
//     auditName: ($("auditName")?.value || "").trim(),
//     emailRecipients: getSelectedEmails()
//   };
// }

// function collectPayload() {
//   const p = collectPayloadBase();
//   p.itemDisplay = ITEM_LOOKUP_STATE.displayText || getItemDisplayText() || "";
//   p.confirmCauseSelected = getSelectedConfirmCauses();
//   p.confirmCauseOther = ($("confirmCauseOther")?.value || "").trim();
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
//     ["errorDescription", "รายละเอียด/คำอธิบายสาเหตุ"],
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

//   const mustOther = Array.from(document.querySelectorAll(".confirmCauseChk:checked"))
//     .some(el => String(el.dataset.requiresText || "") === "1");

//   if (mustOther && !String(p.confirmCauseOther || "").trim()) {
//     return "กรุณาระบุรายละเอียดเพิ่มเติมในสาเหตุอื่นๆ";
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
//   if (!/^\d+$/.test(p.workAgeYear)) return "อายุงาน (ปี) ต้องเป็นตัวเลข";
//   if (!/^\d+$/.test(p.workAgeMonth)) return "อายุงาน (เดือน) ต้องเป็นตัวเลข";
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(p.errorDate)) return "รูปแบบวันที่เบิกสินค้าไม่ถูกต้อง";

//   return "";
// }
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

//           <div class="swalDesc" style="margin-top:8px;">
//             <div class="swalDescLabel">รายละเอียดเหตุการณ์</div>
//             <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
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
//     pass: AUTH.pass || window.APP_AUTH_PASS,
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

//   await Swal.fire({
//     icon: "success",
//     title: "บันทึกสำเร็จ",
//     confirmButtonText: "ปิดหน้าต่าง",
//     confirmButtonColor: "#2563eb"
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
//       <div class="sigModalHead compact">
//         <div class="sigModalSub">${escapeHtml(subtitle || "")}</div>
//         <div class="sigModalTip">กรุณาเซ็นชื่อในกรอบด้านล่าง</div>
//       </div>

//       <div class="sigCanvasCard sigCanvasCardWide">
//         <canvas id="${canvasId}" width="1200" height="340" class="sigCanvasElm sigCanvasElmLarge"></canvas>
//       </div>

//       <div class="sigModalFoot compact">
//         <button type="button" id="${clearId}" class="sigActionBtn sigActionBtn-clear">ล้างลายเซ็น</button>
//       </div>
//     </div>
//   `;

//   const res = await Swal.fire({
//     title: escapeHtml(title || "ลายเซ็น"),
//     html,
//     showCancelButton: true,
//     confirmButtonText: "ยืนยันลายเซ็น",
//     cancelButtonText: "ยกเลิก",
//     buttonsStyling: false,
//     width: 980,
//     customClass: {
//       popup: "sigSwalPopup sigSwalPopupWide",
//       title: "sigSwalTitle sigSwalTitleCompact",
//       htmlContainer: "sigSwalHtml sigSwalHtmlCompact",
//       actions: "sigSwalActions sigSwalActionsCompact",
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
//     "interpreterName",
//     "confirmCauseOther"
//   ];

//   ids.forEach((id) => {
//     const el = $(id);
//     if (el) el.value = "";
//   });

//   const er = $("errorReason");
//   const audit = $("auditName");
//   const shift = $("shift");
//   const refYear = $("refYear");
//   const osm = $("osm");
//   const otm = $("otm");
//   const nationality = $("nationality");
//   const workAgeYear = $("workAgeYear");
//   const workAgeMonth = $("workAgeMonth");
//   const preview = $("employeeConfirmPreview");

//   if (er) er.value = "";
//   if (audit) audit.value = "";
//   if (shift) shift.value = "";
//   if (osm) osm.value = "";
//   if (otm) otm.value = "";
//   if (nationality) nationality.value = "";
//   if (workAgeYear) workAgeYear.value = "";
//   if (workAgeMonth) workAgeMonth.value = "";
//   if (refYear) refYear.value = getCurrentBuddhistYear();
//   if (preview) preview.value = "";

//   document.querySelectorAll(".emailChk").forEach(chk => chk.checked = false);
//   updateEmailSelectedText();

//   document.querySelectorAll(".confirmCauseChk").forEach(chk => chk.checked = false);

//   $("wrapErrorOther")?.classList.add("hidden");
//   $("wrapConfirmCauseOther")?.classList.add("hidden");

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
//   renderConfirmCauseSelector();
//   setLpsFromLogin(AUTH.name || "");
//   updateEmployeeConfirmPreview();
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


/** ==========================
 *  FRONTEND APP
 *  app.js
 *  ========================== */
const API_BASE = "https://bol.somchaibutphon.workers.dev";
const ITEM_NOT_FOUND_TEXT = "-ไม่พบรายการสินค้า-";
const ITEM_LOOKUP_MIN_LEN = 3;
const ITEM_LOOKUP_DEBOUNCE_MS = 420;

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

function getCurrentBuddhistYear() {
  return String(new Date().getFullYear() + 543);
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

/** expose ให้ report500.js ใช้ */
window.apiUrl = apiUrl;
window.safeSetLoginMsg = safeSetLoginMsg;
window.AUTH = AUTH;

/** ==========================
 *  REF HELPERS
 *  ========================== */
function bindRefInputs() {
  bindRefPair_("refNo", "refYear");
  bindRefPair_("rptRefNo", "rptRefYear");
}

function bindRefPair_(runningId, yearId) {
  const runningEl = $(runningId);
  const yearEl = $(yearId);
  if (!runningEl || !yearEl) return;

  yearEl.textContent = getCurrentBuddhistYear();

  runningEl.addEventListener("input", () => {
    runningEl.value = String(runningEl.value || "").replace(/[^\d]/g, "");
  });
}

function getRefNoValue() {
  return buildRefNo_("refNo", "refYear");
}

function getRptRefNoValue() {
  return buildRefNo_("rptRefNo", "rptRefYear");
}

function buildRefNo_(runningId, yearId) {
  const running = String($(runningId)?.value || "").replace(/[^\d]/g, "").trim();
  const year =
    String($(yearId)?.value || $(yearId)?.textContent || "").trim() ||
    getCurrentBuddhistYear();

  if (!running) return "";
  return `${running}-${year}`;
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
  setActiveTab("error");
  updateEmployeeConfirmPreview();
}

/** ==========================
 *  Tabs
 *  ========================== */
function bindTabs() {
  $("tabErrorBol")?.addEventListener("click", () => setActiveTab("error"));
  $("tabUnder500")?.addEventListener("click", () => setActiveTab("u500"));
}

function setActiveTab(which) {
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

function onErrorReasonChange() {
  syncErrorReasonOtherVisibility();
  renderConfirmCauseSelector();
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
      updateEmployeeConfirmPreview();
    });
  });
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
    $("rptReportedBy").innerHTML = lpsName
      ? `<option value="${escapeHtml(lpsName)}">${escapeHtml(lpsName)}</option>`
      : `<option value="">-- เลือก --</option>`;
    $("rptReportedBy").value = lpsName || "";
  }

  safeSetLoginMsg("");
  setActiveTab("error");
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
      ${removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${id}">ลบ</button>` : ``}
    </div>
    <input type="file" accept="image/*" id="${id}">
    <img class="previewImg" id="${id}_img" alt="" style="display:block;max-width:100%;max-height:220px;border-radius:12px;border:1px solid #d9e4f1;padding:4px;margin-top:8px;">
    <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
  `;

  list.appendChild(box);

  if (removable) {
    const btn = box.querySelector(`[data-remove="${id}"]`);
    btn?.addEventListener("click", () => {
      const img = $(`${id}_img`);
      if (img && img.dataset.objectUrl) {
        try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      }
      box.remove();
    });
  }

  const fileInput = $(id);
  const img = $(`${id}_img`);
  const txt = $(`${id}_txt`);

  fileInput?.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];

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
      Swal.fire({
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
  return inputs.reduce((acc, el) => acc + ((el.files && el.files[0]) ? 1 : 0), 0);
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
  } catch (_) {
    return;
  }

  const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
  if (!signRes.ok) return;

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

  Swal.fire({
    title: "กำลังบันทึกข้อมูล",
    html: `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">ระบบกำลังประมวลผล</div>
          <div class="swalHeroSub">กำลังอัปโหลดรูปภาพ สร้าง PDF และตรวจสอบการส่งอีเมล</div>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  let json;
  try {
    const res = await fetch(apiUrl("/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    try {
      json = JSON.parse(text);
    } catch (_) {
      return Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        html: `
          <div class="swalSection">
            <div class="swalSectionTitle">รายละเอียดข้อผิดพลาด</div>
            <div class="swalDesc">
              <div class="swalDescLabel">ข้อความจากระบบ</div>
              <div class="swalDescValue">
                <pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:10px;border-radius:10px;max-height:220px;overflow:auto;margin:0;">${escapeHtml(text).slice(0, 2000)}</pre>
              </div>
            </div>
          </div>
        `
      });
    }

    if (!res.ok || !json.ok) {
      return Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: json.error || `HTTP ${res.status}`
      });
    }
  } catch (err2) {
    console.error(err2);
    return Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: "เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต / Worker / API)"
    });
  }

  const galleryHtml = renderGalleryHtml(json.imageIds || []);
  const emailResult = json.emailResult || {};
  const emailOk = !!emailResult.ok && !emailResult.skipped;
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
          <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และเอกสาร PDF เรียบร้อย</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
            <div class="swalPill">Ref: ${escapeHtml(p.refNo || "-")}</div>
            <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
            <div class="swalPill">วินัย ${Number(json.disciplineMatchCount || 0)}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">วันที่เวลา</div>
              <div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Ref:No.</div>
              <div class="swalKvValue">${escapeHtml(p.refNo || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Label CID</div>
              <div class="swalKvValue">${escapeHtml(p.labelCid || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">ขนาด PDF</div>
              <div class="swalKvValue">${escapeHtml(pdfSizeText)}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลเหตุการณ์</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">สาเหตุ</div>
              <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">วันที่เบิกสินค้า Error</div>
              <div class="swalKvValue">${escapeHtml(formatDateToDisplay(p.errorDate) || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Item</div>
              <div class="swalKvValue">${escapeHtml((json.itemDisplay || getItemDisplayText() || "-"))}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">จำนวน ErrorCase</div>
              <div class="swalKvValue">${escapeHtml(p.errorCaseQty || "-")}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">พนักงาน / ผู้เกี่ยวข้อง</div>
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
              <div class="swalKvLabel">ล่าม</div>
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
            <div class="swalDescValue">${escapeHtml(composeConfirmCauseSummary(p.confirmCauseSelected, p.confirmCauseOther) || "-").replaceAll("|", "<br>")}</div>
          </div>

          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">คำยืนยันของพนักงาน</div>
            <div class="swalDescValue">${escapeHtml(p.employeeConfirmText || "-").replaceAll("\n", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">สถานะอีเมล</div>
          ${
            emailResult.skipped
              ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
              : emailOk
                ? `
                  <div class="swalEmailOk">
                    ส่งอีเมลสำเร็จ ${Number(emailResult.count || 0)} รายการ
                    ${emailResult.attachmentMode ? `• ${escapeHtml(emailResult.attachmentMode)}` : ""}
                  </div>
                  <div class="swalEmailList">
                    ${(emailResult.recipients || []).map(e => `<div class="swalEmailChip">${escapeHtml(e)}</div>`).join("")}
                  </div>
                `
                : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailResult.error || "-")}</div>`
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

        ${
          json.pdfUrl
            ? `
              <div class="swalActionLink">
                <a href="${json.pdfUrl}" target="_blank" rel="noopener noreferrer">เปิดไฟล์ PDF รายงาน</a>
              </div>
            `
            : `<div class="swalNote" style="color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF</div>`
        }
      </div>
    `,
    didOpen: () => bindGalleryClickInSwal()
  });

  resetForm();
}

async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
  const inputs = Array.from(document.querySelectorAll('#uploadList input[type="file"]'));
  const picked = [];

  for (const el of inputs) {
    const f = el.files && el.files[0];
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
  const clearId = canvasId + "_clear";

  const html = `
    <div class="sigModalWrap">
      <div class="sigModalHead compact">
        <div class="sigModalSub">${escapeHtml(subtitle || "")}</div>
        <div class="sigModalTip">กรุณาเซ็นชื่อในกรอบด้านล่าง</div>
      </div>

      <div class="sigCanvasCard sigCanvasCardWide">
        <canvas id="${canvasId}" width="1200" height="340" class="sigCanvasElm sigCanvasElmLarge"></canvas>
      </div>

      <div class="sigModalFoot compact">
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
    width: 980,
    customClass: {
      popup: "sigSwalPopup sigSwalPopupWide",
      title: "sigSwalTitle sigSwalTitleCompact",
      htmlContainer: "sigSwalHtml sigSwalHtmlCompact",
      actions: "sigSwalActions sigSwalActionsCompact",
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

  const er = $("errorReason");
  const audit = $("auditName");
  const shift = $("shift");
  const osm = $("osm");
  const otm = $("otm");
  const nationality = $("nationality");
  const workAgeYear = $("workAgeYear");
  const workAgeMonth = $("workAgeMonth");
  const preview = $("employeeConfirmText");

  if (er) er.value = "";
  if (audit) audit.value = "";
  if (shift) shift.value = "";
  if (osm) osm.value = "";
  if (otm) otm.value = "";
  if (nationality) nationality.value = "";
  if (workAgeYear) workAgeYear.value = "";
  if (workAgeMonth) workAgeMonth.value = "";
  if (preview) preview.value = "";

  document.querySelectorAll(".emailChk").forEach(chk => chk.checked = false);
  document.querySelectorAll(".confirmCauseChk").forEach(chk => chk.checked = false);

  syncErrorReasonOtherVisibility();

  document.querySelectorAll(".previewImg").forEach((img) => {
    if (img.dataset && img.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      img.dataset.objectUrl = "";
    }
    img.removeAttribute("src");
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
  renderConfirmCauseSelector();
  setLpsFromLogin(AUTH.name || "");
  updateEmployeeConfirmPreview();
}

function setLpsFromLogin(loginName) {
  const lpsEl = $("lps");
  if (lpsEl) {
    lpsEl.value = loginName || "";
    lpsEl.readOnly = true;
  }
}

/** ==========================
 *  SHARED EXPORTS
 *  ========================== */
window.AppShared = {
  $,
  apiUrl,
  escapeHtml,
  norm,
  driveImgUrl,
  getCurrentBuddhistYear,
  getRefNoValue,
  getRptRefNoValue
};
