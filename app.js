// /** ==========================
//  *  app.js (FULL) - Error_BOL S&LP (PRO)
//  *  - ใช้ Cloudflare Worker เป็น API (options/auth/submit)
//  *  - รองรับ upload รูปแบบเพิ่มช่องได้ + ลบช่อง + จำกัดจำนวนรูป + validate type
//  *  - รองรับลายเซ็น 3 จุด (หัวหน้างาน/พนักงาน/ล่าม)
//  *  - แสดงผลสำเร็จพร้อม Gallery + ปุ่มเปิด PDF (ถ้า backend ส่ง pdfUrl)
//  *  - ใช้ CSS Class (.galGrid/.sigGrid/.sigThumb) จาก style.css (ไม่ฝัง <style> ใน Swal)
//  *  ========================== */

// /** ==========================
//  *  CONFIG (แก้จุดนี้)
//  *  ========================== */
// const API_BASE = "https://curly-breeze-d4ba.somchaibutphon.workers.dev";
// /** ========================== */

// let OPTIONS = { lpsList: [], errorList: [], auditList: [] };
// let AUTH = { name: "", pass: "" };

// const $ = (id) => document.getElementById(id);

// /** ==========================
//  *  URL Helper
//  *  ========================== */
// function apiUrl(path) {
//   const base = String(API_BASE || "").replace(/\/+$/, "");
//   const p = String(path || "").replace(/^\/+/, "");
//   return `${base}/${p}`;
// }

// /** ==========================
//  *  Gallery (Drive Image)
//  *  ========================== */
// function driveImgUrl(id) {
//   return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
// }

// function renderGalleryHtml(imageIds = []) {
//   if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

//   const cards = imageIds.map((id, i) => {
//     const url = driveImgUrl(id);
//     return `
//       <button type="button" class="galItem"
//         data-url="${url}"
//         data-id="${escapeHtml(id)}"
//         aria-label="ดูรูปที่ ${i + 1}"
//       >
//         <div class="galThumbWrap">
//           <img class="galThumb" src="${url}" alt="รูปที่ ${i + 1}" loading="lazy">
//           <div class="galBadge">${i + 1}</div>
//         </div>
//         <div class="galCap">ID: ${escapeHtml(id)}</div>
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
//   items.forEach(btn => {
//     btn.addEventListener("click", () => {
//       const url = btn.getAttribute("data-url");
//       const id = btn.getAttribute("data-id") || "";
//       Swal.fire({
//         title: "ดูรูป",
//         html: `
//           <div style="text-align:left;font-weight:900;margin-bottom:8px">ID: ${escapeHtml(id)}</div>
//           <img src="${url}"
//                style="width:100%;max-height:70vh;object-fit:contain;border-radius:14px;border:1px solid #d7ddea;background:#fff" />
//         `,
//         confirmButtonText: "ปิด",
//         confirmButtonColor: "#2563eb",
//       });
//     });
//   });
// }

// /** ==========================
//  *  Init
//  *  ========================== */
// init().catch(err => {
//   console.error(err);
//   safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
// });

// async function init() {
//   bindTabs();
//   buildInitialUploadFields();
//   bindEvents();

//   try {
//     await loadOptions();
//     fillLoginName();
//     fillFormDropdowns();
//   } catch (err) {
//     console.error("loadOptions failed:", err);
//     safeSetLoginMsg("โหลดรายชื่อ/ตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
//   }

//   // numeric only
//   numericOnly($("labelCid"));
//   numericOnly($("item"));
//   numericOnly($("errorCaseQty"));
//   alnumUpperOnly($("employeeCode")); // ✅ A-Z 0-9 เท่านั้น + ตัวใหญ่

//   // default tab
//   setActiveTab("error");
// }

// function safeSetLoginMsg(msg) {
//   const el = $("loginMsg");
//   if (el) el.textContent = msg || "";
// }

// /** ==========================
//  *  Tabs
//  *  ========================== */
// function bindTabs() {
//   $("tabErrorBol")?.addEventListener("click", () => setActiveTab("error"));
//   $("tabUnder500")?.addEventListener("click", () => setActiveTab("u500"));
// }

// function setActiveTab(which) {
//   $("tabErrorBol")?.classList.toggle("active", which === "error");
//   $("tabUnder500")?.classList.toggle("active", which === "u500");

//   // ถ้ายังไม่ login ให้เห็นหน้า login เท่านั้น
//   if (!AUTH.name) {
//     $("loginCard")?.classList.remove("hidden");
//     $("formCard")?.classList.add("hidden");
//     $("under500Card")?.classList.add("hidden");
//     return;
//   }

//   // login แล้ว: แสดงตามแท็บ
//   $("loginCard")?.classList.add("hidden");
//   $("formCard")?.classList.toggle("hidden", which !== "error");
//   $("under500Card")?.classList.toggle("hidden", which !== "u500");
// }

// /** ==========================
//  *  Events
//  *  ========================== */
// function bindEvents() {
//   $("btnLogin")?.addEventListener("click", onLogin);

//   $("errorReason")?.addEventListener("change", onErrorReasonChange);
//   $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));

//   $("btnPreview")?.addEventListener("click", previewSummary);
//   $("btnSubmit")?.addEventListener("click", submitForm);

//   // Enter เพื่อ Login
//   $("loginPass")?.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") onLogin();
//   });
// }

// /** ==========================
//  *  Load Options
//  *  ========================== */
// async function loadOptions() {
//   const res = await fetch(apiUrl("/options"), { method: "GET" });
//   const text = await res.text();

//   let json = {};
//   try { json = JSON.parse(text); } catch (_) {}

//   if (!res.ok || !json.ok) {
//     const msg = (json && json.error) ? json.error : `โหลดตัวเลือกไม่สำเร็จ (HTTP ${res.status})`;
//     throw new Error(msg);
//   }
//   OPTIONS = json.data || { lpsList: [], errorList: [], auditList: [] };
// }

// function fillLoginName() {
//   const sel = $("loginName");
//   if (!sel) return;

//   sel.innerHTML =
//     `<option value="">-- เลือกชื่อ --</option>` +
//     (OPTIONS.lpsList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
// }

// function fillFormDropdowns() {
//   const lps = $("lps");
//   const er = $("errorReason");
//   const audit = $("auditName");

//   if (lps) {
//     lps.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.lpsList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
//   }
//   if (er) {
//     er.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.errorList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
//   }
//   if (audit) {
//     audit.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.auditList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
//   }
// }

// /** ==========================
//  *  Login
//  *  ========================== */
// async function onLogin() {
//   safeSetLoginMsg("");
//   const name = ($("loginName")?.value || "").trim();
//   const pass = ($("loginPass")?.value || "").trim();

//   if (!name || !pass) {
//     safeSetLoginMsg("กรุณาเลือกชื่อและกรอกรหัสผ่าน");
//     return;
//   }

//   let json;
//   try {
//     const res = await fetch(apiUrl("/auth"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ name, pass })
//     });

//     const text = await res.text();
//     try { json = JSON.parse(text); }
//     catch (_) { json = { ok: false, error: "รูปแบบข้อมูลตอบกลับไม่ถูกต้อง" }; }

//     if (!res.ok || !json.ok) {
//       safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
//       return;
//     }
//   } catch (err) {
//     console.error(err);
//     safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
//     return;
//   }

//   AUTH = { name, pass };

//   // ตั้งค่า LPS ตาม login และล็อก
//   setLpsFromLogin(name);

//   // เปลี่ยนหน้า
//   setActiveTab("error");
// }

// /** ==========================
//  *  Form helpers
//  *  ========================== */
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
//  *  Upload fields (add/remove + preview)
//  *  ========================== */
// function buildInitialUploadFields() {
//   const grid = $("uploadGrid");
//   if (!grid) return;
//   grid.innerHTML = "";
//   addUploadField("บัตรพนง.", { removable: false });
//   addUploadField("พนักงาน", { removable: false });
// }

// /**
//  * addUploadField(label, {removable:boolean})
//  */
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

//   // remove
//   if (removable) {
//     const btn = box.querySelector(`[data-remove="${id}"]`);
//     btn?.addEventListener("click", () => {
//       // ปล่อย objectURL ถ้ามี
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

//     // validate type เบื้องต้น
//     if (!/^image\//.test(f.type)) {
//       fileInput.value = "";
//       if (txt) txt.textContent = "ไฟล์ไม่ถูกต้อง (ต้องเป็นรูปภาพเท่านั้น)";
//       if (img) img.removeAttribute("src");
//       Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น" });
//       return;
//     }

//     if (txt) txt.textContent = `ไฟล์: ${f.name} (${Math.round(f.size / 1024)} KB)`;

//     if (img) {
//       // revoke url เก่า
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
//     refNo: ($("refNo")?.value || "").trim(),
//     lps: ($("lps")?.value || "").trim(),
//     labelCid: ($("labelCid")?.value || "").trim(),

//     errorReason: ($("errorReason")?.value || "").trim(),
//     errorReasonOther: ($("errorReasonOther")?.value || "").trim(),
//     errorDescription: ($("errorDescription")?.value || "").trim(),
//     errorDate: ($("errorDate")?.value || "").trim(),

//     item: ($("item")?.value || "").trim(),
//     errorCaseQty: ($("errorCaseQty")?.value || "").trim(),

//     employeeName: ($("employeeName")?.value || "").trim(),
//     employeeCode: ($("employeeCode")?.value || "").trim(),
//     shift: ($("shift")?.value || "").trim(),

//     osm: ($("osm")?.value || "").trim(),
//     otm: ($("otm")?.value || "").trim(),

//     interpreterName: ($("interpreterName")?.value || "").trim(),
//     auditName: ($("auditName")?.value || "").trim()
//   };
// }

// function validatePayload(p) {
//   const required = [
//     ["refNo", "Ref:No."],
//     ["lps", "ชื่อ LPS"],
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
//     // ✅ interpreterName ไม่บังคับแล้ว
//     ["auditName", "พนง. AUDIT"]
//   ];

//   for (const [k, n] of required) {
//     if (!String(p[k] || "").trim()) return `กรุณากรอก ${n}`;
//   }

//   if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) {
//     return "กรุณาระบุสาเหตุ (อื่นๆ)";
//   }

//   if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";
//   if (!/^[A-Z0-9]+$/.test(p.employeeCode)) return "รหัสพนักงานต้องเป็น A-Z หรือ/และ 0-9 เท่านั้น ";

//   if (!/^\d{4}-\d{2}-\d{2}$/.test(p.errorDate)) return "รูปแบบวันที่เบิกสินค้าไม่ถูกต้อง";

//   return "";
// }

// /** ==========================
//  *  Preview
//  *  ========================== */
// async function previewSummary() {
//   const p = collectPayload();
//   const err = validatePayload(p);
//   if (err) return Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบ", text: err });

//   const fileCount = countSelectedFiles();
//   const html = `
//     <div style="text-align:left;line-height:1.7">
//       <div><b>Ref:No.</b> ${escapeHtml(p.refNo)}</div>
//       <div><b>LPS</b> ${escapeHtml(p.lps)}</div>
//       <div><b>Label CID</b> ${escapeHtml(p.labelCid)}</div>

//       <div><b>สาเหตุ</b> ${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>

//       <div style="margin-top:8px">
//         <b>รายละเอียด/คำอธิบาย:</b><br>
//         ${escapeHtml(p.errorDescription || "-").replaceAll("\n","<br>")}
//       </div>

//       <div style="margin-top:8px"><b>Item</b> ${escapeHtml(p.item)}</div>
//       <div><b>จำนวน ErrorCase</b> ${escapeHtml(p.errorCaseQty)}</div>

//       <div style="margin-top:8px"><b>พนักงาน</b> ${escapeHtml(p.employeeName)} (${escapeHtml(p.employeeCode)})</div>
//       <div><b>วันที่เบิกสินค้า Error</b> ${escapeHtml(p.errorDate)}</div>
//       <div><b>กะ</b> ${escapeHtml(p.shift)}</div>

//       <div style="margin-top:8px"><b>OSM</b> ${escapeHtml(p.osm)}</div>
//       <div><b>OTM</b> ${escapeHtml(p.otm)}</div>
//       <div><b>ล่าม:</b> ${escapeHtml(p.interpreterName || "-")}</div>
//       <div><b>AUDIT</b> ${escapeHtml(p.auditName)}</div>

//       <div style="margin-top:8px"><b>จำนวนรูปที่เลือก</b> ${fileCount}</div>
//     </div>
//   `;

//   await Swal.fire({
//     icon: "info",
//     title: "สรุปข้อมูล",
//     html,
//     confirmButtonText: "ตกลง",
//     confirmButtonColor: "#2563eb"
//   });
// }

// function countSelectedFiles() {
//   const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
//   return inputs.reduce((acc, el) => acc + ((el.files && el.files[0]) ? 1 : 0), 0);
// }

// /** ==========================
//  *  Submit
//  *  ========================== */
// async function submitForm() {
//   const p = collectPayload();
//   const err = validatePayload(p);
//   if (err) return Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบ", text: err });

//   // จำกัดจำนวนรูปกัน payload ใหญ่เกิน (ปรับได้)
//   const files = await collectFilesAsBase64({ maxFiles: 6, maxMBEach: 4 });

//   // ลายเซ็น 3 จุด
//   const signRes = await openSignatureFlow(p.otm, p.employeeName, p.interpreterName);
//   if (!signRes.ok) return;

//   const body = {
//     name: AUTH.name,
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
//     title: "กำลังบันทึก...",
//     allowOutsideClick: false,
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

//     // debug กรณีไม่ใช่ JSON
//     try { json = JSON.parse(text); }
//     catch (_) {
//       console.error("Non-JSON response:", text);
//       return Swal.fire({
//         icon: "error",
//         title: "บันทึกไม่สำเร็จ",
//         html: `<div style="text-align:left">
//           <div><b>รูปแบบข้อมูลตอบกลับไม่ถูกต้อง</b></div>
//           <div style="margin-top:6px;color:#64748b;font-size:12px">Backend ไม่ได้ส่ง JSON กลับมา</div>
//           <pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:10px;border-radius:10px;max-height:220px;overflow:auto">${escapeHtml(text).slice(0,2000)}</pre>
//         </div>`
//       });
//     }

//     if (!res.ok || !json.ok) {
//       return Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: json.error || `HTTP ${res.status}` });
//     }
//   } catch (err2) {
//     console.error(err2);
//     return Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: "เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต/Worker)" });
//   }

//   const galleryHtml = renderGalleryHtml(json.imageIds || []);

//   // thumbs: ใช้ class จาก style.css
//   const supSignThumb = signRes.supervisorBase64
//     ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const empSignThumb = signRes.employeeBase64
//     ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const intSignThumb = signRes.interpreterBase64
//     ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const pdfBtn = json.pdfUrl
//     ? `<a href="${json.pdfUrl}" target="_blank"
//         style="display:inline-block;margin-top:10px;padding:10px 12px;border-radius:12px;background:#2563eb;color:#fff;font-weight:900;text-decoration:none">
//         เปิดไฟล์ PDF รายงาน
//        </a>`
//     : `<div style="margin-top:10px;color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF (ตรวจสอบ backend ว่าส่งกลับ pdfUrl แล้ว)</div>`;

//   await Swal.fire({
//     icon: "success",
//     title: "บันทึกสำเร็จ",
//     confirmButtonText: "ตกลง",
//     confirmButtonColor: "#2563eb",
//     width: 920,
//     html: `
//       <div style="text-align:left;font-weight:700;line-height:1.7">
//         <div style="font-size:16px;font-weight:900;margin-bottom:6px">รายงาน ERROR</div>

//         <div><b>วันที่เวลา:</b> ${escapeHtml(json.timestamp || "-")}</div>
//         <div><b>Ref:No.:</b> ${escapeHtml(p.refNo)}</div>
//         <div><b>LPS:</b> ${escapeHtml(p.lps)}</div>
//         <div><b>Label CID:</b> ${escapeHtml(p.labelCid)}</div>
//         <div><b>สาเหตุ:</b> ${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>

//         <div style="margin-top:8px">
//           <b>รายละเอียด/คำอธิบาย:</b><br>
//           ${escapeHtml(p.errorDescription || "-").replaceAll("\n","<br>")}
//         </div>

//         <div style="margin-top:8px"><b>Item:</b> ${escapeHtml(p.item)}</div>
//         <div><b>จำนวน ErrorCase:</b> ${escapeHtml(p.errorCaseQty)}</div>

//         <div style="margin-top:8px"><b>พนักงาน:</b> ${escapeHtml(p.employeeName)} (${escapeHtml(p.employeeCode)})</div>
//         <div><b>วันที่เบิกสินค้า Error:</b> ${escapeHtml(p.errorDate)}</div>
//         <div><b>กะ:</b> ${escapeHtml(p.shift)}</div>
//         <div><b>OSM:</b> ${escapeHtml(p.osm)}</div>
//         <div><b>OTM (หัวหน้างาน):</b> ${escapeHtml(p.otm)}</div>
//         <div><b>ล่าม:</b> ${escapeHtml(p.interpreterName)}</div>
//         <div><b>AUDIT:</b> ${escapeHtml(p.auditName)}</div>

//         <div class="sigGrid">
//           <div>
//             <div class="sigBoxTitle">ลายเซ็นหัวหน้างาน</div>
//             ${supSignThumb}
//             <div class="sigName">ลงชื่อ: ${escapeHtml(p.otm || "-")}</div>
//           </div>

//           <div>
//             <div class="sigBoxTitle">ลายเซ็นพนักงาน</div>
//             ${empSignThumb}
//             <div class="sigName">ลงชื่อ: ${escapeHtml(p.employeeName || "-")}</div>
//           </div>

//           <div>
//             <div class="sigBoxTitle">ลายเซ็นล่ามแปลภาษา</div>
//             ${intSignThumb}
//            <div class="sigName">ลงชื่อ: ${escapeHtml(p.interpreterName || "-")}</div>
//           </div>
//         </div>

//         <div style="margin-top:10px"><b>จำนวนรูป:</b> ${(json.imageIds||[]).length}</div>
//         ${galleryHtml}

//         ${pdfBtn}
//       </div>
//     `,
//     didOpen: () => bindGalleryClickInSwal()
//   });

//   resetForm();
// }

// /** ==========================
//  *  Files to Base64 (with limits)
//  *  ========================== */
// async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
//   const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
//   const picked = [];

//   for (const el of inputs) {
//     const f = el.files && el.files[0];
//     if (f) picked.push(f);
//   }

//   if (picked.length === 0) {
//     // ไม่บังคับมีรูป แต่แจ้งเตือนให้ผู้ใช้รู้
//     // ถ้าคุณอยากบังคับ: throw new Error
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
//     // validate type เบื้องต้น
//     if (!/^image\//.test(f.type)) {
//       await Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", text: `ไฟล์ "${f.name}" ต้องเป็นรูปภาพเท่านั้น` });
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
//  *  Signature Flow (3 ลายเซ็น)
//  *  ========================== */
// async function openSignatureFlow(supervisorName, employeeName, interpreterName) {
//   const sup = await signatureModal("ลายเซ็นหัวหน้างาน", `ผู้เซ็น: ${supervisorName || "-"}`);
//   if (!sup.ok) return { ok: false };

//   const emp = await signatureModal("ลายเซ็นพนักงานที่เบิกสินค้า Error", `ผู้เซ็น: ${employeeName || "-"}`);
//   if (!emp.ok) return { ok: false };

//   // ✅ ถ้าไม่กรอกชื่อ “ล่าม” ให้ข้ามลายเซ็นล่าม
//   const hasInterpreter = String(interpreterName || "").trim().length > 0;
//   if (!hasInterpreter) {
//     return { ok: true, supervisorBase64: sup.base64, employeeBase64: emp.base64, interpreterBase64: "" };
//   }

//   const intr = await signatureModal("ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${interpreterName || "-"}`);
//   if (!intr.ok) return { ok: false };

//   return { ok: true, supervisorBase64: sup.base64, employeeBase64: emp.base64, interpreterBase64: intr.base64 };
// }

// async function signatureModal(title, subtitle) {
//   const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
//   const clearId = canvasId + "_clear";

//   const html = `
//     <div style="text-align:left">
//       <div style="font-weight:900;margin-bottom:6px">${escapeHtml(subtitle)}</div>
//       <div style="border:1px solid #d7ddea;border-radius:12px;overflow:hidden">
//         <canvas id="${canvasId}" width="800" height="260"
//                 style="width:100%;height:220px;background:#fff;touch-action:none"></canvas>
//       </div>
//       <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end">
//         <button type="button" id="${clearId}" class="swal2-styled" style="background:#0f172a">ล้าง</button>
//       </div>
//     </div>
//   `;

//   const res = await Swal.fire({
//     title,
//     html,
//     showCancelButton: true,
//     confirmButtonText: "ยืนยันลายเซ็น",
//     cancelButtonText: "ยกเลิก",
//     confirmButtonColor: "#2563eb",
//     didOpen: () => {
//       const canvas = document.getElementById(canvasId);
//       const btnClear = document.getElementById(clearId);
//       enableSignature(canvas);
//       btnClear.onclick = () => {
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//       };
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

//   // ตั้งค่าปากกาให้คมขึ้น
//   ctx.lineWidth = 3;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";

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

//   const down = (e) => { drawing = true; last = getPos(e); e.preventDefault(); };
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
//   const up = (e) => { drawing = false; last = null; e.preventDefault(); };

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
//   // ถ้ามี pixel ที่ไม่โปร่งใส ถือว่าไม่ว่าง
//   for (let i = 3; i < data.length; i += 4) {
//     if (data[i] !== 0) return false;
//   }
//   return true;
// }

// /** ==========================
//  *  Reset
//  *  ========================== */
// function resetForm() {
//   const ids = [
//     "refNo",
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

//   ids.forEach(id => {
//     const el = document.getElementById(id);
//     if (el) el.value = "";
//   });

//   const er = document.getElementById("errorReason");
//   const audit = document.getElementById("auditName");
//   const shift = document.getElementById("shift");

//   if (er) er.value = "";
//   if (audit) audit.value = "";
//   if (shift) shift.value = "";

//   document.getElementById("wrapErrorOther")?.classList.add("hidden");

//   // เคลียร์ objectURL ทั้งหมดก่อนสร้างใหม่ (กัน memory leak)
//   document.querySelectorAll(".previewImg").forEach(img => {
//     if (img.dataset && img.dataset.objectUrl) {
//       try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       img.dataset.objectUrl = "";
//     }
//   });

//   // รีเซ็ต upload กลับเป็น 2 ช่องเริ่มต้น
//   buildInitialUploadFields();
// }

// /** ==========================
//  *  Utils
//  *  ========================== */
// function escapeHtml(s) {
//   return String(s ?? "")
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#039;");
// }

// function setLpsFromLogin(loginName) {
//   const lpsSelect = $("lps");
//   if (!lpsSelect) return;

//   lpsSelect.value = loginName;
//   lpsSelect.disabled = true;

//   const pill = document.getElementById("userPill");
//   if (pill) pill.textContent = "ผู้ใช้งาน: " + loginName;
// }


// function alnumUpperOnly(el) {
//   if (!el) return;

//   const sanitize = () => {
//     // 1) แปลงเป็นตัวใหญ่
//     // 2) เอาเฉพาะ A-Z และ 0-9 เท่านั้น (ตัดทุกอักขระพิเศษ/ช่องว่าง/ไทย)
//     const v = String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
//     if (el.value !== v) el.value = v;
//   };

//   el.addEventListener("input", sanitize);

//   // กันกรณี paste ด้วยเมาส์/คีย์ลัด
//   el.addEventListener("paste", () => {
//     setTimeout(sanitize, 0);
//   });

//   // กันตอนหลุดโฟกัส (เผื่อ browser แปลกๆ)
//   el.addEventListener("blur", sanitize);
// }

/** ==========================
 *  app.js (FULL) - Error_BOL S&LP (PRO)
 *  - Login ด้วย "รหัสผ่าน" เพียงช่องเดียว
 *  - Backend จะดึงชื่อ LPS จากชีท list_Name ให้อัตโนมัติ
 *  - รองรับ upload รูปแบบเพิ่มช่องได้ + ลบช่อง + จำกัดจำนวนรูป + validate type
 *  - รองรับลายเซ็น 3 จุด (หัวหน้างาน/พนักงาน/ล่าม)
 *  - แสดงผลสำเร็จพร้อม Gallery + ปุ่มเปิด PDF
 *  ========================== */

/** ==========================
 *  CONFIG
 *  ========================== */
// const API_BASE = "https://bol.somchaibutphon.workers.dev";
// /** ========================== */

// let OPTIONS = { errorList: [], auditList: [] };
// let AUTH = { name: "", pass: "" };

// const $ = (id) => document.getElementById(id);

// /** ==========================
//  *  URL Helper
//  *  ========================== */
// function apiUrl(path) {
//   const base = String(API_BASE || "").replace(/\/+$/, "");
//   const p = String(path || "").replace(/^\/+/, "");
//   return `${base}/${p}`;
// }

// /** ==========================
//  *  Gallery (Drive Image)
//  *  ========================== */
// function driveImgUrl(id) {
//   return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
// }

// function renderGalleryHtml(imageIds = []) {
//   if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

//   const cards = imageIds.map((id, i) => {
//     const url = driveImgUrl(id);
//     return `
//       <button type="button" class="galItem"
//         data-url="${url}"
//         data-id="${escapeHtml(id)}"
//         aria-label="ดูรูปที่ ${i + 1}"
//       >
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
//   items.forEach(btn => {
//     btn.addEventListener("click", () => {
//       const url = btn.getAttribute("data-url");
//       const id = btn.getAttribute("data-id") || "";
//       Swal.fire({
//   title: "ดูรูปภาพแนบ",
//   html: `
//     <div style="text-align:center">
//       <img src="${url}"
//            style="width:100%;max-height:72vh;object-fit:contain;border-radius:16px;border:1px solid #d7ddea;background:#fff" />
//     </div>
//   `,
//   confirmButtonText: "ปิด",
//   confirmButtonColor: "#2563eb",
//   width: 900
// });
//     });
//   });
// }

// /** ==========================
//  *  Init
//  *  ========================== */
// init().catch(err => {
//   console.error(err);
//   safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
// });

// async function init() {
//   bindTabs();
//   buildInitialUploadFields();
//   bindEvents();

//   try {
//     await loadOptions();
//     fillFormDropdowns();
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

// /** ==========================
//  *  Tabs
//  *  ========================== */
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

// /** ==========================
//  *  Events
//  *  ========================== */
// function bindEvents() {
//   $("btnLogin")?.addEventListener("click", onLogin);

//   $("errorReason")?.addEventListener("change", onErrorReasonChange);
//   $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));

//   $("btnPreview")?.addEventListener("click", previewSummary);
//   $("btnSubmit")?.addEventListener("click", submitForm);

//   $("loginPass")?.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") onLogin();
//   });
// }

// /** ==========================
//  *  Load Options
//  *  ========================== */
// async function loadOptions() {
//   const res = await fetch(apiUrl("/options"), { method: "GET" });
//   const text = await res.text();

//   let json = {};
//   try { json = JSON.parse(text); } catch (_) {}

//   if (!res.ok || !json.ok) {
//     const msg = (json && json.error) ? json.error : `โหลดตัวเลือกไม่สำเร็จ (HTTP ${res.status})`;
//     throw new Error(msg);
//   }

//   OPTIONS = json.data || { errorList: [], auditList: [] };
// }

// function fillFormDropdowns() {
//   const er = $("errorReason");
//   const audit = $("auditName");

//   if (er) {
//     er.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.errorList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
//   }

//   if (audit) {
//     audit.innerHTML =
//       `<option value="">-- เลือก --</option>` +
//       (OPTIONS.auditList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
//   }
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
//     try { json = JSON.parse(text); }
//     catch (_) { json = { ok: false, error: "รูปแบบข้อมูลตอบกลับไม่ถูกต้อง" }; }

//     if (!res.ok || !json.ok) {
//       safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
//       return;
//     }
//   } catch (err) {
//     console.error(err);
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
//  *  Form helpers
//  *  ========================== */
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
//  *  Upload fields (add/remove + preview)
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
//       Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น" });
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
//     refNo: ($("refNo")?.value || "").trim(),
//     labelCid: ($("labelCid")?.value || "").trim(),
//     errorReason: ($("errorReason")?.value || "").trim(),
//     errorReasonOther: ($("errorReasonOther")?.value || "").trim(),
//     errorDescription: ($("errorDescription")?.value || "").trim(),
//     errorDate: ($("errorDate")?.value || "").trim(),
//     item: ($("item")?.value || "").trim(),
//     errorCaseQty: ($("errorCaseQty")?.value || "").trim(),
//     employeeName: ($("employeeName")?.value || "").trim(),
//     employeeCode: ($("employeeCode")?.value || "").trim(),
//     shift: ($("shift")?.value || "").trim(),
//     osm: ($("osm")?.value || "").trim(),
//     otm: ($("otm")?.value || "").trim(),
//     interpreterName: ($("interpreterName")?.value || "").trim(),
//     auditName: ($("auditName")?.value || "").trim()
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

//   const html = `
//     <div class="swalSummary">
//       <div class="swalHero">
//         <div class="swalHeroTitle">สรุปข้อมูลก่อนบันทึก</div>
//         <div class="swalHeroSub">ตรวจสอบความถูกต้องอีกครั้งก่อนดำเนินการต่อ</div>
//         <div class="swalPillRow">
//           <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
//           <div class="swalPill">รูปแนบ ${fileCount} รูป</div>
//           <div class="swalPill">วันที่เบิก ${escapeHtml(p.errorDate || "-")}</div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ข้อมูลหลัก</div>
//         <div class="swalKvGrid">
//           <div class="swalKv">
//             <div class="swalKvLabel">Ref:No.</div>
//             <div class="swalKvValue">${escapeHtml(p.refNo)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">Label CID</div>
//             <div class="swalKvValue">${escapeHtml(p.labelCid)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">สาเหตุ Error</div>
//             <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">กะ</div>
//             <div class="swalKvValue">${escapeHtml(p.shift)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">Item</div>
//             <div class="swalKvValue">${escapeHtml(p.item)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">จำนวน ErrorCase</div>
//             <div class="swalKvValue">${escapeHtml(p.errorCaseQty)}</div>
//           </div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">รายละเอียดเหตุการณ์</div>
//         <div class="swalDesc">
//           <div class="swalDescLabel">คำอธิบาย / รายละเอียด</div>
//           <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n","<br>")}</div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ข้อมูลพนักงานและผู้เกี่ยวข้อง</div>
//         <div class="swalKvGrid">
//           <div class="swalKv">
//             <div class="swalKvLabel">ชื่อพนักงาน</div>
//             <div class="swalKvValue">${escapeHtml(p.employeeName)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">รหัสพนักงาน</div>
//             <div class="swalKvValue">${escapeHtml(p.employeeCode)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">OSM</div>
//             <div class="swalKvValue">${escapeHtml(p.osm)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">OTM</div>
//             <div class="swalKvValue">${escapeHtml(p.otm)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">ล่ามแปลภาษา</div>
//             <div class="swalKvValue">${escapeHtml(p.interpreterName || "-")}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">AUDIT</div>
//             <div class="swalKvValue">${escapeHtml(p.auditName)}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `;

//   await Swal.fire({
//     title: "ดูสรุปข้อมูล",
//     html,
//     confirmButtonText: "ตกลง",
//     confirmButtonColor: "#2563eb",
//     width: 860
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
//   if (err) return Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบ", text: err });

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
//   title: "กำลังบันทึกข้อมูล",
//   html: `<div class="swalNote">กรุณารอสักครู่ ระบบกำลังอัปโหลดรูปภาพและสร้างเอกสาร</div>`,
//   allowOutsideClick: false,
//   allowEscapeKey: false,
//   customClass: {
//     popup: "swalLoadingPopup"
//   },
//   didOpen: () => Swal.showLoading()
// });

//   let json;
//   try {
//     const res = await fetch(apiUrl("/submit"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body)
//     });

//     const text = await res.text();

//     try { json = JSON.parse(text); }
//     catch (_) {
//       console.error("Non-JSON response:", text);
//       return Swal.fire({
//         icon: "error",
//         title: "บันทึกไม่สำเร็จ",
//         html: `<div style="text-align:left">
//           <div><b>รูปแบบข้อมูลตอบกลับไม่ถูกต้อง</b></div>
//           <div style="margin-top:6px;color:#64748b;font-size:12px">Backend ไม่ได้ส่ง JSON กลับมา</div>
//           <pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:10px;border-radius:10px;max-height:220px;overflow:auto">${escapeHtml(text).slice(0,2000)}</pre>
//         </div>`
//       });
//     }

//     if (!res.ok || !json.ok) {
//       return Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: json.error || `HTTP ${res.status}` });
//     }
//   } catch (err2) {
//     console.error(err2);
//     return Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: "เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต/Worker)" });
//   }

//   const galleryHtml = renderGalleryHtml(json.imageIds || []);

//   const supSignThumb = signRes.supervisorBase64
//     ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const empSignThumb = signRes.employeeBase64
//     ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const intSignThumb = signRes.interpreterBase64
//     ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
//     : `<div style="color:#94a3b8">-</div>`;

//   const pdfBtn = json.pdfUrl
//     ? `<a href="${json.pdfUrl}" target="_blank"
//         style="display:inline-block;margin-top:10px;padding:10px 12px;border-radius:12px;background:#2563eb;color:#fff;font-weight:900;text-decoration:none">
//         เปิดไฟล์ PDF รายงาน
//        </a>`
//     : `<div style="margin-top:10px;color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF</div>`;

//   await Swal.fire({
//   icon: "success",
//   title: "บันทึกสำเร็จ",
//   confirmButtonText: "ปิดหน้าต่าง",
//   confirmButtonColor: "#2563eb",
//   width: 920,
//   html: `
//     <div class="swalSummary">
//       <div class="swalHero">
//         <div class="swalHeroTitle">บันทึกรายการเรียบร้อยแล้ว</div>
//         <div class="swalHeroSub">ระบบได้จัดเก็บข้อมูล รูปภาพ และไฟล์ PDF เรียบร้อย</div>
//         <div class="swalPillRow">
//           <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
//           <div class="swalPill">Ref: ${escapeHtml(p.refNo)}</div>
//           <div class="swalPill">รูปแนบ ${(json.imageIds || []).length} รูป</div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ข้อมูลสรุป</div>
//         <div class="swalKvGrid">
//           <div class="swalKv">
//             <div class="swalKvLabel">วันที่เวลา</div>
//             <div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">Label CID</div>
//             <div class="swalKvValue">${escapeHtml(p.labelCid)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">สาเหตุ</div>
//             <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">กะ</div>
//             <div class="swalKvValue">${escapeHtml(p.shift)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">Item</div>
//             <div class="swalKvValue">${escapeHtml(p.item)}</div>
//           </div>
//           <div class="swalKv">
//             <div class="swalKvLabel">จำนวน ErrorCase</div>
//             <div class="swalKvValue">${escapeHtml(p.errorCaseQty)}</div>
//           </div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">รายละเอียดเหตุการณ์</div>
//         <div class="swalDesc">
//           <div class="swalDescLabel">คำอธิบาย / รายละเอียด</div>
//           <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n","<br>")}</div>
//         </div>
//       </div>

//       <div class="swalSection">
//         <div class="swalSectionTitle">ผู้เกี่ยวข้องและลายเซ็น</div>
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

//       ${json.pdfUrl ? `
//         <div class="swalActionLink">
//           <a href="${json.pdfUrl}" target="_blank">เปิดไฟล์ PDF รายงาน</a>
//         </div>
//       ` : `
//         <div class="swalNote" style="color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF</div>
//       `}
//     </div>
//   `,
//   didOpen: () => bindGalleryClickInSwal()
// });

//   resetForm();
// }

// /** ==========================
//  *  Files to Base64
//  *  ========================== */
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
//       await Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", text: `ไฟล์ "${f.name}" ต้องเป็นรูปภาพเท่านั้น` });
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
//     return { ok: true, supervisorBase64: sup.base64, employeeBase64: emp.base64, interpreterBase64: "" };
//   }

//   const intr = await signatureModal("ลายเซ็นล่ามแปลภาษา", `ผู้เซ็น: ${interpreterName || "-"}`);
//   if (!intr.ok) return { ok: false };

//   return { ok: true, supervisorBase64: sup.base64, employeeBase64: emp.base64, interpreterBase64: intr.base64 };
// }

// async function signatureModal(title, subtitle) {
//   const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
//   const clearId = canvasId + "_clear";

//   const html = `
//     <div style="text-align:left">
//       <div style="font-weight:900;margin-bottom:6px">${escapeHtml(subtitle)}</div>
//       <div style="border:1px solid #d7ddea;border-radius:12px;overflow:hidden">
//         <canvas id="${canvasId}" width="800" height="260"
//                 style="width:100%;height:220px;background:#fff;touch-action:none"></canvas>
//       </div>
//       <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end">
//         <button type="button" id="${clearId}" class="swal2-styled" style="background:#0f172a">ล้าง</button>
//       </div>
//     </div>
//   `;

//   const res = await Swal.fire({
//     title,
//     html,
//     showCancelButton: true,
//     confirmButtonText: "ยืนยันลายเซ็น",
//     cancelButtonText: "ยกเลิก",
//     confirmButtonColor: "#2563eb",
//     didOpen: () => {
//       const canvas = document.getElementById(canvasId);
//       const btnClear = document.getElementById(clearId);
//       enableSignature(canvas);
//       btnClear.onclick = () => {
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//       };
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

//   ctx.lineWidth = 3;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";

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

//   const down = (e) => { drawing = true; last = getPos(e); e.preventDefault(); };
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
//   const up = (e) => { drawing = false; last = null; e.preventDefault(); };

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
//  *  Reset
//  *  ========================== */
// function resetForm() {
//   const ids = [
//     "refNo",
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

//   ids.forEach(id => {
//     const el = document.getElementById(id);
//     if (el) el.value = "";
//   });

//   const er = document.getElementById("errorReason");
//   const audit = document.getElementById("auditName");
//   const shift = document.getElementById("shift");

//   if (er) er.value = "";
//   if (audit) audit.value = "";
//   if (shift) shift.value = "";

//   document.getElementById("wrapErrorOther")?.classList.add("hidden");

//   document.querySelectorAll(".previewImg").forEach(img => {
//     if (img.dataset && img.dataset.objectUrl) {
//       try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       img.dataset.objectUrl = "";
//     }
//   });

//   buildInitialUploadFields();

//   // ✅ คงชื่อ LPS ไว้ตามผู้ที่ล็อกอินอยู่
//   setLpsFromLogin(AUTH.name || "");
// }

// /** ==========================
//  *  Utils
//  *  ========================== */
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

//   const pill = document.getElementById("userPill");
//   if (pill) pill.textContent = "ผู้ใช้งาน: " + (loginName || "-");
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




// async function onLogin() {
//   safeSetLoginMsg("");
//   const pass = ($("loginPass")?.value || "").trim();

//   if (!pass) {
//     safeSetLoginMsg("กรุณากรอกรหัสผ่าน");
//     return;
//   }

//   let json;
//   try {
//     const url = apiUrl("/auth");
//     console.log("LOGIN URL:", url);

//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ pass })
//     });

//     const text = await res.text();
//     console.log("LOGIN STATUS:", res.status);
//     console.log("LOGIN RESPONSE:", text);

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

/** ==========================
 *  app.js (FULL) - Error_BOL S&LP (PRO)
 *  - Login ด้วย "รหัสผ่าน" เพียงช่องเดียว
 *  - Backend จะดึงชื่อ LPS จากชีท list_Name ให้อัตโนมัติ
 *  - รองรับ upload รูปแบบเพิ่มช่องได้ + ลบช่อง + จำกัดจำนวนรูป + validate type
 *  - รองรับลายเซ็น 3 จุด (หัวหน้างาน/พนักงาน/ล่าม)
 *  - แสดงผลสำเร็จพร้อม Gallery + ปุ่มเปิด PDF
 *  - Ref:No. แบบแยกช่อง เลขรัน + ปี พ.ศ. เพื่อไม่ให้ค่ามั่ว
 *  ========================== */

/** ==========================
 *  CONFIG
 *  ========================== */
const API_BASE = "https://bol.somchaibutphon.workers.dev";

/** ==========================
 *  STATE
 *  ========================== */
let OPTIONS = { errorList: [], auditList: [] };
let AUTH = { name: "", pass: "" };

const $ = (id) => document.getElementById(id);

/** ==========================
 *  URL Helper
 *  ========================== */
function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

/** ==========================
 *  Ref Helper (split input)
 *  ใช้คู่กับ index.html แบบ:
 *  - input id="refRunning"
 *  - input id="refYear" readonly
 *  ========================== */
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

/** ==========================
 *  Gallery (Drive Image)
 *  ========================== */
function driveImgUrl(id) {
  return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
}

function renderGalleryHtml(imageIds = []) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return "";

  const cards = imageIds.map((id, i) => {
    const url = driveImgUrl(id);
    return `
      <button
        type="button"
        class="galItem"
        data-url="${url}"
        aria-label="ดูรูปที่ ${i + 1}"
      >
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
 *  Init
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

  try {
    await loadOptions();
    fillFormDropdowns();
  } catch (err) {
    console.error("loadOptions failed:", err);
    safeSetLoginMsg("โหลดตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
  }

  numericOnly($("labelCid"));
  numericOnly($("item"));
  numericOnly($("errorCaseQty"));
  alnumUpperOnly($("employeeCode"));

  setActiveTab("error");
}

function safeSetLoginMsg(msg) {
  const el = $("loginMsg");
  if (el) el.textContent = msg || "";
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
    $("formCard")?.classList.add("hidden");
    $("under500Card")?.classList.add("hidden");
    return;
  }

  $("loginCard")?.classList.add("hidden");
  $("formCard")?.classList.toggle("hidden", which !== "error");
  $("under500Card")?.classList.toggle("hidden", which !== "u500");
}

/** ==========================
 *  Events
 *  ========================== */
function bindEvents() {
  $("btnLogin")?.addEventListener("click", onLogin);

  $("errorReason")?.addEventListener("change", onErrorReasonChange);
  $("btnAddImage")?.addEventListener("click", () => addUploadField("ภาพอื่นๆ"));

  $("btnPreview")?.addEventListener("click", previewSummary);
  $("btnSubmit")?.addEventListener("click", submitForm);

  $("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLogin();
  });
}

/** ==========================
 *  Load Options
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

  OPTIONS = json.data || { errorList: [], auditList: [] };
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

/** ==========================
 *  Login
 *  ========================== */
async function onLogin() {
  safeSetLoginMsg("");
  const pass = ($("loginPass")?.value || "").trim();

  if (!pass) {
    safeSetLoginMsg("กรุณากรอกรหัสผ่าน");
    return;
  }

  let json;
  try {
    const url = apiUrl("/auth");
    console.log("LOGIN URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass })
    });

    const text = await res.text();
    console.log("LOGIN STATUS:", res.status);
    console.log("LOGIN RESPONSE:", text);

    try {
      json = JSON.parse(text);
    } catch (_) {
      safeSetLoginMsg("Backend ตอบกลับไม่ใช่ JSON");
      return;
    }

    if (!res.ok || !json.ok) {
      safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
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
  setLpsFromLogin(lpsName);
  setActiveTab("error");
}

/** ==========================
 *  Form helpers
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

/** ==========================
 *  Upload fields (add/remove + preview)
 *  ========================== */
function buildInitialUploadFields() {
  const grid = $("uploadGrid");
  if (!grid) return;

  grid.innerHTML = "";
  addUploadField("บัตรพนง.", { removable: false });
  addUploadField("พนักงาน", { removable: false });
}

function addUploadField(label, opts = {}) {
  const { removable = true } = opts;

  const grid = $("uploadGrid");
  if (!grid) return;

  const id = "file_" + Math.random().toString(16).slice(2);
  const box = document.createElement("div");
  box.className = "uploadBox";

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <div class="cap">${escapeHtml(label)}</div>
      ${removable ? `<button type="button" class="btn ghost" style="padding:6px 10px;border-radius:999px" data-remove="${id}">ลบ</button>` : ``}
    </div>

    <input type="file" accept="image/*" id="${id}">
    <img class="previewImg" id="${id}_img" alt="">
    <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
  `;

  grid.appendChild(box);

  if (removable) {
    const btn = box.querySelector(`[data-remove="${id}"]`);
    btn?.addEventListener("click", () => {
      const img = $(`${id}_img`);
      if (img && img.dataset.objectUrl) {
        try {
          URL.revokeObjectURL(img.dataset.objectUrl);
        } catch (_) {}
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
          try {
            URL.revokeObjectURL(img.dataset.objectUrl);
          } catch (_) {}
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
        try {
          URL.revokeObjectURL(img.dataset.objectUrl);
        } catch (_) {}
      }
      const url = URL.createObjectURL(f);
      img.src = url;
      img.dataset.objectUrl = url;
    }
  });
}

/** ==========================
 *  Payload + Validation
 *  ========================== */
function collectPayload() {
  return {
    refNo: getRefNoValue(),
    labelCid: ($("labelCid")?.value || "").trim(),
    errorReason: ($("errorReason")?.value || "").trim(),
    errorReasonOther: ($("errorReasonOther")?.value || "").trim(),
    errorDescription: ($("errorDescription")?.value || "").trim(),
    errorDate: ($("errorDate")?.value || "").trim(),
    item: ($("item")?.value || "").trim(),
    errorCaseQty: ($("errorCaseQty")?.value || "").trim(),
    employeeName: ($("employeeName")?.value || "").trim(),
    employeeCode: ($("employeeCode")?.value || "").trim(),
    shift: ($("shift")?.value || "").trim(),
    osm: ($("osm")?.value || "").trim(),
    otm: ($("otm")?.value || "").trim(),
    interpreterName: ($("interpreterName")?.value || "").trim(),
    auditName: ($("auditName")?.value || "").trim()
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

  const html = `
    <div class="swalSummary">
      <div class="swalHero">
        <div class="swalHeroTitle">สรุปข้อมูลก่อนบันทึก</div>
        <div class="swalHeroSub">ตรวจสอบความถูกต้องอีกครั้งก่อนดำเนินการต่อ</div>
        <div class="swalPillRow">
          <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || "-")}</div>
          <div class="swalPill">รูปแนบ ${fileCount} รูป</div>
          <div class="swalPill">วันที่เบิก ${escapeHtml(p.errorDate || "-")}</div>
        </div>
      </div>

      <div class="swalSection">
        <div class="swalSectionTitle">ข้อมูลหลัก</div>
        <div class="swalKvGrid">
          <div class="swalKv">
            <div class="swalKvLabel">Ref:No.</div>
            <div class="swalKvValue">${escapeHtml(p.refNo)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">Label CID</div>
            <div class="swalKvValue">${escapeHtml(p.labelCid)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">สาเหตุ Error</div>
            <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">กะ</div>
            <div class="swalKvValue">${escapeHtml(p.shift)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">Item</div>
            <div class="swalKvValue">${escapeHtml(p.item)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">จำนวน ErrorCase</div>
            <div class="swalKvValue">${escapeHtml(p.errorCaseQty)}</div>
          </div>
        </div>
      </div>

      <div class="swalSection">
        <div class="swalSectionTitle">รายละเอียดเหตุการณ์</div>
        <div class="swalDesc">
          <div class="swalDescLabel">คำอธิบาย / รายละเอียด</div>
          <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
        </div>
      </div>

      <div class="swalSection">
        <div class="swalSectionTitle">ข้อมูลพนักงานและผู้เกี่ยวข้อง</div>
        <div class="swalKvGrid">
          <div class="swalKv">
            <div class="swalKvLabel">ชื่อพนักงาน</div>
            <div class="swalKvValue">${escapeHtml(p.employeeName)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">รหัสพนักงาน</div>
            <div class="swalKvValue">${escapeHtml(p.employeeCode)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">OSM</div>
            <div class="swalKvValue">${escapeHtml(p.osm)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">OTM</div>
            <div class="swalKvValue">${escapeHtml(p.otm)}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">ล่ามแปลภาษา</div>
            <div class="swalKvValue">${escapeHtml(p.interpreterName || "-")}</div>
          </div>
          <div class="swalKv">
            <div class="swalKvLabel">AUDIT</div>
            <div class="swalKvValue">${escapeHtml(p.auditName)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  await Swal.fire({
    title: "ดูสรุปข้อมูล",
    html,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#2563eb",
    width: 860
  });
}

function countSelectedFiles() {
  const inputs = Array.from(document.querySelectorAll('#uploadGrid input[type="file"]'));
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
      text: err
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
    html: `<div class="swalNote">กรุณารอสักครู่ ระบบกำลังอัปโหลดรูปภาพและสร้างเอกสาร</div>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: "swalLoadingPopup"
    },
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
      console.error("Non-JSON response:", text);
      return Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        html: `<div style="text-align:left">
          <div><b>รูปแบบข้อมูลตอบกลับไม่ถูกต้อง</b></div>
          <div style="margin-top:6px;color:#64748b;font-size:12px">Backend ไม่ได้ส่ง JSON กลับมา</div>
          <pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:10px;border-radius:10px;max-height:220px;overflow:auto">${escapeHtml(text).slice(0, 2000)}</pre>
        </div>`
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
      text: "เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต/Worker)"
    });
  }

  const galleryHtml = renderGalleryHtml(json.imageIds || []);

  const supSignThumb = signRes.supervisorBase64
    ? `<img class="sigThumb" src="${signRes.supervisorBase64}" alt="sign supervisor">`
    : `<div style="color:#94a3b8;text-align:center;padding:14px 0">-</div>`;

  const empSignThumb = signRes.employeeBase64
    ? `<img class="sigThumb" src="${signRes.employeeBase64}" alt="sign employee">`
    : `<div style="color:#94a3b8;text-align:center;padding:14px 0">-</div>`;

  const intSignThumb = signRes.interpreterBase64
    ? `<img class="sigThumb" src="${signRes.interpreterBase64}" alt="sign interpreter">`
    : `<div style="color:#94a3b8;text-align:center;padding:14px 0">-</div>`;

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
          <div class="swalHeroSub">ระบบได้จัดเก็บข้อมูล รูปภาพ และไฟล์ PDF เรียบร้อย</div>
          <div class="swalPillRow">
            <div class="swalPill primary">LPS: ${escapeHtml(AUTH.name || json.lpsName || "-")}</div>
            <div class="swalPill">Ref: ${escapeHtml(p.refNo)}</div>
            <div class="swalPill">รูปแนบ ${(json.imageIds || []).length} รูป</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลสรุป</div>
          <div class="swalKvGrid">
            <div class="swalKv">
              <div class="swalKvLabel">วันที่เวลา</div>
              <div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Label CID</div>
              <div class="swalKvValue">${escapeHtml(p.labelCid)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">สาเหตุ</div>
              <div class="swalKvValue">${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">กะ</div>
              <div class="swalKvValue">${escapeHtml(p.shift)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">Item</div>
              <div class="swalKvValue">${escapeHtml(p.item)}</div>
            </div>
            <div class="swalKv">
              <div class="swalKvLabel">จำนวน ErrorCase</div>
              <div class="swalKvValue">${escapeHtml(p.errorCaseQty)}</div>
            </div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">รายละเอียดเหตุการณ์</div>
          <div class="swalDesc">
            <div class="swalDescLabel">คำอธิบาย / รายละเอียด</div>
            <div class="swalDescValue">${escapeHtml(p.errorDescription || "-").replaceAll("\n", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ผู้เกี่ยวข้องและลายเซ็น</div>
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

        ${json.pdfUrl ? `
          <div class="swalActionLink">
            <a href="${json.pdfUrl}" target="_blank" rel="noopener noreferrer">เปิดไฟล์ PDF รายงาน</a>
          </div>
        ` : `
          <div class="swalNote" style="color:#dc2626;font-weight:900">ไม่พบลิงก์ PDF</div>
        `}
      </div>
    `,
    didOpen: () => bindGalleryClickInSwal()
  });

  resetForm();
}

/** ==========================
 *  Files to Base64
 *  ========================== */
async function collectFilesAsBase64({ maxFiles = 6, maxMBEach = 4 } = {}) {
  const inputs = Array.from(document.querySelectorAll('#uploadGrid input[type="file"]'));
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
    r.onload = () => resolve(r.result);
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
      <div class="sigModalHead">
        <div class="sigModalSub">${escapeHtml(subtitle || "")}</div>
        <div class="sigModalTip">กรุณาเซ็นภายในกรอบด้านล่าง โดยใช้เมาส์หรือนิ้วลากเขียนลายเซ็น</div>
      </div>

      <div class="sigCanvasCard">
        <canvas
          id="${canvasId}"
          width="800"
          height="260"
          class="sigCanvasElm"
        ></canvas>
      </div>

      <div class="sigModalFoot">
        <button
          type="button"
          id="${clearId}"
          class="sigActionBtn sigActionBtn-clear"
        >
          ล้างลายเซ็น
        </button>
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

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1d4ed8"; // ปากกาสีน้ำเงิน

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

/** ==========================
 *  Reset
 *  ========================== */
function resetForm() {
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

  $("wrapErrorOther")?.classList.add("hidden");

  document.querySelectorAll(".previewImg").forEach((img) => {
    if (img.dataset && img.dataset.objectUrl) {
      try {
        URL.revokeObjectURL(img.dataset.objectUrl);
      } catch (_) {}
      img.dataset.objectUrl = "";
    }
    img.removeAttribute("src");
  });

  buildInitialUploadFields();
  setLpsFromLogin(AUTH.name || "");
}

/** ==========================
 *  Utils
 *  ========================== */
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

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
