/** ==========================
 *  CONFIG (แก้จุดนี้)
 *  ========================== */
const API_BASE = "https://curly-breeze-d4ba.somchaibutphon.workers.dev"; // ✅ ห้ามใส่ / ท้าย (แต่โค้ดนี้กันไว้ให้แล้ว)
/** ========================== */

let OPTIONS = { lpsList: [], errorList: [], auditList: [] };
let AUTH = { name: "", pass: "" };

const $ = (id) => document.getElementById(id);

// ====== URL Helper: รองรับ API_BASE มี/ไม่มี "/" ======
function apiUrl(path) {
  const base = String(API_BASE || "").replace(/\/+$/, ""); // ตัด / ท้ายทั้งหมด
  const p = String(path || "").replace(/^\/+/, "");        // ตัด / หน้า
  return `${base}/${p}`;
}

init().catch(err => {
  console.error(err);
  safeSetLoginMsg("เกิดข้อผิดพลาดระหว่างเริ่มระบบ: " + (err?.message || err));
});

async function init(){
  bindTabs();
  buildInitialUploadFields();
  bindEvents();

  // โหลด options + เติม dropdown (กันหน้าเงียบ)
  try {
    await loadOptions();
    fillLoginName();
    fillFormDropdowns();
  } catch (err) {
    console.error("loadOptions failed:", err);
    safeSetLoginMsg("โหลดรายชื่อ/ตัวเลือกไม่สำเร็จ กรุณาตรวจสอบ API_BASE, Worker, และ CORS");
    // ยังให้หน้าอยู่ได้ แต่ dropdown จะว่าง
  }

  // numeric only fields
  numericOnly($("labelCid"));
  numericOnly($("item"));
  numericOnly($("errorCaseQty"));
}

function safeSetLoginMsg(msg){
  const el = $("loginMsg");
  if (el) el.textContent = msg || "";
}

function bindTabs(){
  $("tabErrorBol").addEventListener("click", () => setActiveTab("error"));
  $("tabUnder500").addEventListener("click", () => setActiveTab("u500"));
}

function setActiveTab(which){
  $("tabErrorBol").classList.toggle("active", which === "error");
  $("tabUnder500").classList.toggle("active", which === "u500");

  // login แสดงเสมอจนกว่าจะ auth
  $("loginCard").classList.toggle("hidden", false);
  $("formCard").classList.add("hidden");
  $("under500Card").classList.add("hidden");

  if (AUTH.name) {
    if (which === "error") $("formCard").classList.remove("hidden");
    else $("under500Card").classList.remove("hidden");
  }
}

function bindEvents(){
  $("btnLogin").addEventListener("click", onLogin);
  $("errorReason").addEventListener("change", onErrorReasonChange);
  $("btnAddImage").addEventListener("click", () => addUploadField("ภาพอื่นๆ"));
  $("btnPreview").addEventListener("click", previewSummary);
  $("btnSubmit").addEventListener("click", submitForm);
}

async function loadOptions(){
  const res = await fetch(apiUrl("/options"), { method:"GET" });

  // กันกรณี Worker ตอบ Not Found (text) แล้ว res.json() พัง
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch(_) {}

  if (!res.ok || !json.ok) {
    const msg = (json && json.error) ? json.error : `โหลดตัวเลือกไม่สำเร็จ (HTTP ${res.status})`;
    throw new Error(msg);
  }

  OPTIONS = json.data || { lpsList: [], errorList: [], auditList: [] };
}

function fillLoginName(){
  const sel = $("loginName");
  sel.innerHTML =
    `<option value="">-- เลือกชื่อ --</option>` +
    (OPTIONS.lpsList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
}

function fillFormDropdowns(){
  // LPS
  $("lps").innerHTML =
    `<option value="">-- เลือก --</option>` +
    (OPTIONS.lpsList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");

  // Error
  $("errorReason").innerHTML =
    `<option value="">-- เลือก --</option>` +
    (OPTIONS.errorList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");

  // Audit
  $("auditName").innerHTML =
    `<option value="">-- เลือก --</option>` +
    (OPTIONS.auditList || []).map(n => `<option>${escapeHtml(n)}</option>`).join("");
}

async function onLogin(){
  safeSetLoginMsg("");

  const name = $("loginName").value.trim();
  const pass = $("loginPass").value.trim();

  if (!name || !pass) {
    safeSetLoginMsg("กรุณาเลือกชื่อและกรอกรหัสผ่าน");
    return;
  }

  let json;
  try {
    const res = await fetch(apiUrl("/auth"), {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name, pass })
    });

    const text = await res.text();
    try { json = JSON.parse(text); } catch(_) { json = { ok:false, error:"รูปแบบข้อมูลตอบกลับไม่ถูกต้อง" }; }

    if (!res.ok || !json.ok) {
      safeSetLoginMsg(json.error || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
  } catch (err) {
    console.error(err);
    safeSetLoginMsg("เชื่อมต่อระบบไม่ได้ (ตรวจสอบ Worker/อินเทอร์เน็ต)");
    return;
  }

  AUTH = { name, pass };
  $("loginCard").classList.add("hidden");
  setActiveTab("error"); // เข้า Error_BOL เป็นค่าเริ่มต้น
}

function onErrorReasonChange(){
  const v = $("errorReason").value;
  $("wrapErrorOther").classList.toggle("hidden", v !== "อื่นๆ");
}

function numericOnly(el){
  el.addEventListener("input", () => {
    el.value = el.value.replace(/[^\d]/g, "");
  });
}

function buildInitialUploadFields(){
  $("uploadGrid").innerHTML = "";
  addUploadField("บัตรพนง.");
  addUploadField("พนักงาน");
}

function addUploadField(label){
  const id = "file_" + Math.random().toString(16).slice(2);
  const box = document.createElement("div");
  box.className = "uploadBox";
  box.innerHTML = `
    <div class="cap">${escapeHtml(label)}</div>
    <input type="file" accept="image/*" id="${id}">
    <img class="previewImg" id="${id}_img" alt="">
    <div class="small" id="${id}_txt">ยังไม่เลือกรูป</div>
  `;
  $("uploadGrid").appendChild(box);

  const fileInput = $(id);
  const img = $(`${id}_img`);
  const txt = $(`${id}_txt`);

  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    txt.textContent = `ไฟล์: ${f.name} (${Math.round(f.size/1024)} KB)`;
    img.src = URL.createObjectURL(f);
  });
}

function collectPayload(){
  return {
    refNo: $("refNo").value.trim(),
    lps: $("lps").value.trim(),
    labelCid: $("labelCid").value.trim(),
    errorReason: $("errorReason").value.trim(),
    errorReasonOther: $("errorReasonOther").value.trim(),
    item: $("item").value.trim(),
    errorCaseQty: $("errorCaseQty").value.trim(),
    employeeName: $("employeeName").value.trim(),
    employeeCode: $("employeeCode").value.trim(),
    shift: $("shift").value.trim(),
    osm: $("osm").value.trim(),
    otm: $("otm").value.trim(),
    auditName: $("auditName").value.trim()
  };
}

function validatePayload(p){
  const required = [
    ["refNo","Ref:No."],
    ["lps","ชื่อ LPS"],
    ["labelCid","Label CID"],
    ["errorReason","สาเหตุ Error"],
    ["item","Item"],
    ["errorCaseQty","จำนวน ErrorCase"],
    ["employeeName","ชื่อ-สกุลพนักงาน"],
    ["employeeCode","รหัสพนักงาน"],
    ["shift","กะ"],
    ["osm","OSM"],
    ["otm","OTM"],
    ["auditName","พนง. AUDIT"]
  ];

  for (const [k, n] of required){
    if (!String(p[k]||"").trim()) return `กรุณากรอก ${n}`;
  }
  if (p.errorReason === "อื่นๆ" && !p.errorReasonOther.trim()) return "กรุณาระบุสาเหตุ (อื่นๆ)";

  if (!/^\d+$/.test(p.labelCid)) return "Label CID ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.item)) return "Item ต้องเป็นตัวเลขเท่านั้น";
  if (!/^\d+$/.test(p.errorCaseQty)) return "จำนวน ErrorCase ต้องเป็นตัวเลขเท่านั้น";

  return "";
}

async function previewSummary(){
  const p = collectPayload();
  const err = validatePayload(p);
  if (err) return Swal.fire({ icon:"warning", title:"ข้อมูลไม่ครบ", text: err });

  const fileCount = countSelectedFiles();
  const html = `
    <div style="text-align:left;line-height:1.7">
      <div><b>Ref:No.</b> ${escapeHtml(p.refNo)}</div>
      <div><b>LPS</b> ${escapeHtml(p.lps)}</div>
      <div><b>Label CID</b> ${escapeHtml(p.labelCid)}</div>
      <div><b>สาเหตุ</b> ${escapeHtml(p.errorReason === "อื่นๆ" ? ("อื่นๆ: " + p.errorReasonOther) : p.errorReason)}</div>
      <div><b>Item</b> ${escapeHtml(p.item)}</div>
      <div><b>จำนวน ErrorCase</b> ${escapeHtml(p.errorCaseQty)}</div>
      <div><b>พนักงาน</b> ${escapeHtml(p.employeeName)} (${escapeHtml(p.employeeCode)})</div>
      <div><b>กะ</b> ${escapeHtml(p.shift)}</div>
      <div><b>OSM</b> ${escapeHtml(p.osm)}</div>
      <div><b>OTM</b> ${escapeHtml(p.otm)}</div>
      <div><b>AUDIT</b> ${escapeHtml(p.auditName)}</div>
      <div style="margin-top:8px"><b>จำนวนรูปที่เลือก</b> ${fileCount}</div>
    </div>
  `;

  await Swal.fire({
    icon:"info",
    title:"สรุปข้อมูล",
    html,
    confirmButtonText:"ตกลง",
    confirmButtonColor:"#2563eb"
  });
}

function countSelectedFiles(){
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  return inputs.reduce((acc, el) => acc + ((el.files && el.files[0]) ? 1 : 0), 0);
}

async function submitForm(){
  const p = collectPayload();
  const err = validatePayload(p);
  if (err) return Swal.fire({ icon:"warning", title:"ข้อมูลไม่ครบ", text: err });

  const files = await collectFilesAsBase64();
  const signRes = await openSignatureFlow(p.otm, p.employeeName);
  if (!signRes.ok) return;

  const body = {
    name: AUTH.name,
    pass: AUTH.pass,
    payload: p,
    files: files,
    signatures: {
      supervisorBase64: signRes.supervisorBase64 || "",
      employeeBase64: signRes.employeeBase64 || ""
    }
  };

  Swal.fire({
    title:"กำลังบันทึก...",
    allowOutsideClick:false,
    didOpen: () => Swal.showLoading()
  });

  let json;
  try {
    const res = await fetch(apiUrl("/submit"), {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    try { json = JSON.parse(text); } catch(_) { json = { ok:false, error:"รูปแบบข้อมูลตอบกลับไม่ถูกต้อง" }; }

    if (!res.ok || !json.ok) {
      return Swal.fire({ icon:"error", title:"บันทึกไม่สำเร็จ", text: json.error || `HTTP ${res.status}` });
    }
  } catch (err2) {
    console.error(err2);
    return Swal.fire({ icon:"error", title:"บันทึกไม่สำเร็จ", text:"เชื่อมต่อระบบไม่ได้ (ตรวจสอบอินเทอร์เน็ต/Worker)" });
  }

  const imgHtml = (json.imageIds || []).map(id => `
    <img src="https://lh5.googleusercontent.com/d/${id}" style="width:100%;max-width:240px;border-radius:12px;border:1px solid #d7ddea;margin:6px 6px 0 0" />
  `).join("");

  await Swal.fire({
    icon:"success",
    title:"บันทึกสำเร็จ",
    confirmButtonText:"ตกลง",
    confirmButtonColor:"#2563eb",
    html: `
      <div style="text-align:left;font-weight:700;line-height:1.7">
        <div><b>วันที่เวลา:</b> ${escapeHtml(json.timestamp || "-")}</div>
        <div><b>Ref:No.:</b> ${escapeHtml(p.refNo)}</div>
        <div><b>OTM (หัวหน้างาน):</b> ${escapeHtml(p.otm)}</div>
        <div style="margin-top:8px"><b>จำนวนรูป:</b> ${(json.imageIds||[]).length}</div>
        ${imgHtml ? `<div style="margin-top:10px"><b>ตัวอย่างรูป (จาก ID):</b><div style="display:flex;flex-wrap:wrap">${imgHtml}</div></div>` : ""}
      </div>
    `
  });

  resetForm();
}

async function collectFilesAsBase64(){
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  const out = [];
  for (const el of inputs){
    const f = el.files && el.files[0];
    if (!f) continue;
    const base64 = await fileToBase64(f);
    out.push({ filename: f.name, base64 });
  }
  return out;
}

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); // data:<type>;base64,xxxx
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** ====== Signature Flow (2 ลายเซ็น) ====== */
async function openSignatureFlow(supervisorName, employeeName){
  const sup = await signatureModal(`ลายเซ็นหัวหน้างาน`, `ผู้เซ็น: ${supervisorName || "-"}`);
  if (!sup.ok) return { ok:false };

  const emp = await signatureModal(`ลายเซ็นพนักงานที่เบิกสินค้า Error`, `ผู้เซ็น: ${employeeName || "-"}`);
  if (!emp.ok) return { ok:false };

  return { ok:true, supervisorBase64: sup.base64, employeeBase64: emp.base64 };
}

async function signatureModal(title, subtitle){
  const canvasId = "sigCanvas_" + Math.random().toString(16).slice(2);
  const html = `
    <div style="text-align:left">
      <div style="font-weight:800;margin-bottom:6px">${escapeHtml(subtitle)}</div>
      <div style="border:1px solid #d7ddea;border-radius:12px;overflow:hidden">
        <canvas id="${canvasId}" width="800" height="260" style="width:100%;height:220px;background:#fff;touch-action:none"></canvas>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end">
        <button type="button" id="${canvasId}_clear" class="swal2-styled" style="background:#0f172a">ล้าง</button>
      </div>
    </div>
  `;

  const res = await Swal.fire({
    title,
    html,
    showCancelButton:true,
    confirmButtonText:"ยืนยันลายเซ็น",
    cancelButtonText:"ยกเลิก",
    confirmButtonColor:"#2563eb",
    didOpen: () => {
      const canvas = document.getElementById(canvasId);
      const btnClear = document.getElementById(canvasId + "_clear");
      enableSignature(canvas);
      btnClear.onclick = () => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
      };
    },
    preConfirm: () => {
      const canvas = document.getElementById(canvasId);
      return canvas.toDataURL("image/png");
    }
  });

  if (!res.isConfirmed) return { ok:false };
  return { ok:true, base64: res.value };
}

function enableSignature(canvas){
  const ctx = canvas.getContext("2d");
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

  const down = (e) => { drawing = true; last = getPos(e); e.preventDefault(); };
  const move = (e) => {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    e.preventDefault();
  };
  const up = (e) => { drawing = false; last = null; e.preventDefault(); };

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);

  canvas.addEventListener("touchstart", down, { passive:false });
  canvas.addEventListener("touchmove", move, { passive:false });
  canvas.addEventListener("touchend", up, { passive:false });
}

function resetForm(){
  const ids = ["refNo","labelCid","errorReasonOther","item","errorCaseQty","employeeName","employeeCode","osm","otm"];
  ids.forEach(id => $(id).value = "");
  $("lps").value = "";
  $("errorReason").value = "";
  $("auditName").value = "";
  $("shift").value = "";
  $("wrapErrorOther").classList.add("hidden");
  buildInitialUploadFields();
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
