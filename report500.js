const REPORT500_API_BASE = "https://visitor-entry-api.somchaibutphon.workers.dev";

const Report500App = (() => {
  const state = {
    pass: "",
    options: {
      reportTypes: [],
      formOptions: {},
      incidentCategories: []
    }
  };

  function init() {
    bindTabEvents();
    bindFormEvents();
    setDefaultDates();
  }

  function bindTabEvents() {
    const tabError = document.getElementById("tabErrorBol");
    const tabUnder500 = document.getElementById("tabUnder500");
    const formCard = document.getElementById("formCard");
    const under500Card = document.getElementById("under500Card");

    if (!tabError || !tabUnder500 || !formCard || !under500Card) return;

    tabError.addEventListener("click", () => {
      tabError.classList.add("active");
      tabUnder500.classList.remove("active");
      formCard.classList.remove("hidden");
      under500Card.classList.add("hidden");
    });

    tabUnder500.addEventListener("click", async () => {
      tabUnder500.classList.add("active");
      tabError.classList.remove("active");
      formCard.classList.add("hidden");
      under500Card.classList.remove("hidden");

      const ok = await ensureSession();
      if (!ok) {
        tabError.classList.add("active");
        tabUnder500.classList.remove("active");
        formCard.classList.remove("hidden");
        under500Card.classList.add("hidden");
        return;
      }

      if (!under500Card.dataset.loaded) {
        await loadOptions();
        buildInitialRows();
        under500Card.dataset.loaded = "1";
      }
    });
  }

  function bindFormEvents() {
    document.getElementById("btnRptAddPerson")?.addEventListener("click", addPersonRow);
    document.getElementById("btnRptAddImage")?.addEventListener("click", addImageRow);
    document.getElementById("btnRptPreview")?.addEventListener("click", previewSummary);
    document.getElementById("btnRptSubmit")?.addEventListener("click", submitReport);

    document.querySelectorAll(".rptAddDetailBtn").forEach(btn => {
      btn.addEventListener("click", () => addDetailRow(btn.dataset.target));
    });
  }

  async function ensureSession() {
    if (state.pass) return true;

    const cached = localStorage.getItem("report500_pass") || "";
    if (cached) {
      state.pass = cached;
      return true;
    }

    const passInput = document.getElementById("loginPass");
    const passFromInput = (passInput?.value || "").trim();
    let pass = passFromInput;

    if (!pass) {
      const result = await Swal.fire({
        title: "เข้าสู่ระบบสำหรับฟอร์ม <500",
        input: "password",
        inputLabel: "รหัสผ่าน",
        inputPlaceholder: "กรอกรหัสผ่าน",
        inputAttributes: { autocapitalize: "off", autocorrect: "off" },
        showCancelButton: true,
        confirmButtonText: "เข้าสู่ระบบ",
        cancelButtonText: "ยกเลิก"
      });
      if (!result.isConfirmed) return false;
      pass = String(result.value || "").trim();
    }

    if (!pass) {
      await Swal.fire("ไม่สำเร็จ", "กรุณากรอกรหัสผ่าน", "warning");
      return false;
    }

    const res = await fetch(`${REPORT500_API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass })
    });

    const data = await res.json();
    if (!data.ok) {
      await Swal.fire("ไม่สำเร็จ", data.message || data.error || "เข้าสู่ระบบไม่สำเร็จ", "error");
      return false;
    }

    state.pass = pass;
    localStorage.setItem("report500_pass", pass);
    return true;
  }

  async function loadOptions() {
    const res = await fetch(`${REPORT500_API_BASE}/options`, { method: "GET" });
    const raw = await res.json();
    const options = raw?.data?.reportFormOptions || {};

    state.options = {
      reportTypes: options.reportTypes || [],
      formOptions: options.formOptions || {},
      incidentCategories: options.incidentCategories || []
    };

    renderSelect("rptBranch", getGroupOptions("สาขา"));
    renderSelect("rptLocationType", getGroupOptions("ประเภทสถานที่"));
    renderSelect("rptCauseCategory", getGroupOptions("สาเหตุ"));
    renderSelect("rptReportedBy", getGroupOptions("รายงานโดย"));

    renderRadioGroup("rptReportTypeBox", "rptReportType", state.options.reportTypes);
    renderRadioGroup("rptUrgencyBox", "rptUrgencyLevel", getGroupOptions("ระดับความเร่งด่วน"));
    renderCheckboxGroup("rptReportToBox", "rptReportTo", getGroupOptions("ผู้รับรายงาน"));
    renderCheckboxGroup("rptIncidentCategoriesBox", "rptIncidentCategories", state.options.incidentCategories);
  }

  function getGroupOptions(groupName) {
    return state.options.formOptions[groupName] || [];
  }

  function renderSelect(id, options) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">-- เลือก --</option>` + options.map(opt =>
      `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`
    ).join("");
  }

  function renderRadioGroup(containerId, name, options) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = options.map((opt, idx) => `
      <label class="choiceItem">
        <input type="radio" name="${name}" value="${escapeHtml(opt.value)}" ${opt.default || idx === 0 ? "checked" : ""}>
        <span class="choiceText">${escapeHtml(opt.label)}</span>
      </label>
    `).join("");
  }

  function renderCheckboxGroup(containerId, name, options) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = options.map(opt => `
      <label class="choiceItem">
        <input type="checkbox" name="${name}" value="${escapeHtml(opt.value)}">
        <span class="choiceText">${escapeHtml(opt.label)}</span>
      </label>
    `).join("");
  }

  function buildInitialRows() {
    if (!document.querySelector("#rptPeopleList .rptCard")) addPersonRow();
    if (!document.querySelector("#rptDamageList .rptCard")) addDetailRow("rptDamageList");
    if (!document.querySelector("#rptActionList .rptCard")) addDetailRow("rptActionList");
    if (!document.querySelector("#rptEvidenceList .rptCard")) addDetailRow("rptEvidenceList");
    if (!document.querySelector("#rptRootCauseList .rptCard")) addDetailRow("rptRootCauseList");
    if (!document.querySelector("#rptPreventionList .rptCard")) addDetailRow("rptPreventionList");
    if (!document.querySelector("#rptLessonList .rptCard")) addDetailRow("rptLessonList");
    if (!document.querySelector("#rptImageList .rptCard")) addImageRow();
  }

  function addPersonRow() {
    const wrap = document.getElementById("rptPeopleList");
    if (!wrap) return;

    const row = document.createElement("div");
    row.className = "rptCard";
    row.innerHTML = `
      <div class="rptCardHead">
        <div class="rptCardTitle">ผู้เกี่ยวข้อง</div>
        <button type="button" class="rptRemoveBtn">ลบ</button>
      </div>
      <div class="rptGrid2">
        <div class="field">
          <label>ผู้เกี่ยวข้อง</label>
          <input type="text" class="rptPersonName" placeholder="ชื่อผู้เกี่ยวข้อง">
        </div>
        <div class="field">
          <label>ตำแหน่ง</label>
          <input type="text" class="rptPersonPosition" placeholder="ตำแหน่ง">
        </div>
        <div class="field">
          <label>ส่วนงาน</label>
          <select class="rptPersonDepartment">${buildSelectOptions(getGroupOptions("ส่วนงาน"))}</select>
        </div>
        <div class="field">
          <label>หมายเหตุ</label>
          <input type="text" class="rptPersonRemark" placeholder="หมายเหตุ (ถ้ามี)">
        </div>
      </div>
    `;
    row.querySelector(".rptRemoveBtn").addEventListener("click", () => row.remove());
    wrap.appendChild(row);
  }

  function addDetailRow(targetId) {
    const wrap = document.getElementById(targetId);
    if (!wrap) return;

    const row = document.createElement("div");
    row.className = "rptCard";
    row.innerHTML = `
      <div class="rptCardHead">
        <div class="rptCardTitle">รายละเอียด</div>
        <button type="button" class="rptRemoveBtn">ลบ</button>
      </div>
      <div class="field">
        <textarea class="rptDetailText rptTextArea" rows="4" placeholder="กรอกรายละเอียดเป็นข้อ"></textarea>
      </div>
    `;
    row.querySelector(".rptRemoveBtn").addEventListener("click", () => row.remove());
    wrap.appendChild(row);
  }

  function addImageRow() {
    const wrap = document.getElementById("rptImageList");
    if (!wrap) return;

    const row = document.createElement("div");
    row.className = "rptCard";
    row.innerHTML = `
      <div class="rptCardHead">
        <div class="rptCardTitle">รูปภาพประกอบ</div>
        <button type="button" class="rptRemoveBtn">ลบ</button>
      </div>
      <div class="rptGrid2">
        <div class="field">
          <label>เลือกรูปภาพ</label>
          <input type="file" class="rptImageFile" accept="image/*">
        </div>
        <div class="field">
          <label>คำบรรยายภาพ</label>
          <input type="text" class="rptImageCaption" placeholder="อธิบายภาพนี้">
        </div>
      </div>
      <div class="rptImagePreviewWrap">
        <img class="rptImagePreview hidden" alt="preview">
        <div class="rptImagePlaceholder">ยังไม่ได้เลือกรูป</div>
      </div>
    `;

    const fileInput = row.querySelector(".rptImageFile");
    const preview = row.querySelector(".rptImagePreview");
    const placeholder = row.querySelector(".rptImagePlaceholder");

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    });

    row.querySelector(".rptRemoveBtn").addEventListener("click", () => row.remove());
    wrap.appendChild(row);
  }

  function setDefaultDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const hh = String(today.getHours()).padStart(2, "0");
    const mi = String(today.getMinutes()).padStart(2, "0");
    const dateText = `${yyyy}-${mm}-${dd}`;
    const timeText = `${hh}:${mi}`;

    document.getElementById("rptIncidentDate")?.setAttribute("value", dateText);
    document.getElementById("rptReportDate")?.setAttribute("value", dateText);
    document.getElementById("rptIncidentTime")?.setAttribute("value", timeText);
  }

  async function previewSummary() {
    const payload = collectPayload();
    const html = `
      <div style="text-align:left">
        <b>เลขที่อ้างอิง:</b> ${escapeHtml(payload.refNo)}<br>
        <b>สาขา:</b> ${escapeHtml(payload.branch)}<br>
        <b>เรื่อง:</b> ${escapeHtml(payload.subject)}<br>
        <b>ประเภทรายงาน:</b> ${escapeHtml(payload.reportType)}<br>
        <b>ระดับความเร่งด่วน:</b> ${escapeHtml(payload.urgencyLevel)}<br>
        <b>ผู้เกี่ยวข้อง:</b> ${payload.involvedPeople.length} รายการ<br>
        <b>รูปภาพ:</b> ${document.querySelectorAll("#rptImageList .rptCard").length} รายการ
      </div>
    `;
    await Swal.fire({
      title: "สรุปข้อมูลก่อนบันทึก",
      html,
      icon: "info",
      width: 680
    });
  }

  async function submitReport() {
    const ok = await ensureSession();
    if (!ok) return;

    try {
      const payload = collectPayload();
      const files = await collectFiles();

      const validationMsg = validatePayload(payload, files);
      if (validationMsg) {
        await Swal.fire("กรอกข้อมูลไม่ครบ", validationMsg, "warning");
        return;
      }

      Swal.fire({
        title: "กำลังบันทึกข้อมูล",
        text: "โปรดรอสักครู่",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(`${REPORT500_API_BASE}/report-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass: state.pass,
          payload,
          files
        })
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || data.error || "บันทึกไม่สำเร็จ");
      }

      await Swal.fire({
        title: "สำเร็จ",
        html: `
          <div style="text-align:left">
            <b>รหัสรายงาน:</b> ${escapeHtml(data.reportId || "")}<br>
            <b>สถานะ:</b> ${escapeHtml(data.status || "")}
          </div>
        `,
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "เปิด PDF",
        cancelButtonText: "ปิด"
      }).then(result => {
        if (result.isConfirmed && data.pdfUrl) {
          window.open(data.pdfUrl, "_blank", "noopener");
        }
      });

    } catch (err) {
      await Swal.fire("ไม่สำเร็จ", err.message || "เกิดข้อผิดพลาด", "error");
    }
  }

  function collectPayload() {
    return {
      refNo: valueOf("rptRefNo"),
      branch: valueOf("rptBranch"),
      subject: valueOf("rptSubject"),
      reportType: selectedRadio("rptReportType"),
      urgencyLevel: selectedRadio("rptUrgencyLevel"),
      reportTo: checkedValues("rptReportTo"),
      incidentDate: valueOf("rptIncidentDate"),
      incidentTime: valueOf("rptIncidentTime"),
      incidentLocation: valueOf("rptIncidentLocation"),
      locationType: valueOf("rptLocationType"),
      area: valueOf("rptArea"),
      incidentCategories: checkedValues("rptIncidentCategories"),
      causeCategory: valueOf("rptCauseCategory"),
      involvedPeople: collectPeople(),
      detailItems: {
        damageItems: collectDetailItems("rptDamageList"),
        actionItems: collectDetailItems("rptActionList"),
        evidenceItems: collectDetailItems("rptEvidenceList"),
        rootCauseItems: collectDetailItems("rptRootCauseList"),
        preventionItems: collectDetailItems("rptPreventionList"),
        lessonItems: collectDetailItems("rptLessonList")
      },
      reportedBy: valueOf("rptReportedBy"),
      reporterPosition: valueOf("rptReporterPosition"),
      reportDate: valueOf("rptReportDate")
    };
  }

  function collectPeople() {
    return [...document.querySelectorAll("#rptPeopleList .rptCard")].map((row, index) => ({
      seq: index + 1,
      personName: row.querySelector(".rptPersonName")?.value?.trim() || "",
      personPosition: row.querySelector(".rptPersonPosition")?.value?.trim() || "",
      personDepartment: row.querySelector(".rptPersonDepartment")?.value || "",
      personRemark: row.querySelector(".rptPersonRemark")?.value?.trim() || ""
    })).filter(item => item.personName || item.personPosition || item.personDepartment || item.personRemark);
  }

  function collectDetailItems(listId) {
    return [...document.querySelectorAll(`#${listId} .rptDetailText`)].map((el, index) => ({
      seq: index + 1,
      text: el.value.trim()
    })).filter(item => item.text);
  }

  async function collectFiles() {
    const rows = [...document.querySelectorAll("#rptImageList .rptCard")];
    const out = [];

    for (let i = 0; i < rows.length; i++) {
      const file = rows[i].querySelector(".rptImageFile")?.files?.[0];
      const caption = rows[i].querySelector(".rptImageCaption")?.value?.trim() || "";
      if (!file) continue;

      const data = await fileToBase64(file);
      out.push({
        seq: i + 1,
        name: file.name,
        mimeType: file.type || "image/jpeg",
        data,
        caption
      });
    }
    return out;
  }

  function validatePayload(payload, files) {
    const missing = [];

    if (!payload.refNo) missing.push("เลขที่อ้างอิง");
    if (!payload.branch) missing.push("สาขา");
    if (!payload.subject) missing.push("เรื่อง");
    if (!payload.reportType) missing.push("ประเภทรายงาน");
    if (!payload.urgencyLevel) missing.push("ระดับความเร่งด่วน");
    if (!payload.reportTo.length) missing.push("ผู้รับรายงาน");
    if (!payload.incidentDate) missing.push("วันที่เกิดเหตุ");
    if (!payload.incidentTime) missing.push("เวลาที่เกิดเหตุ");
    if (!payload.incidentLocation) missing.push("สถานที่เกิดเหตุ");
    if (!payload.locationType) missing.push("ประเภทสถานที่");
    if (!payload.area) missing.push("บริเวณ");
    if (!payload.incidentCategories.length) missing.push("รายละเอียดเหตุการณ์");
    if (!payload.causeCategory) missing.push("สาเหตุ");
    if (!payload.involvedPeople.length) missing.push("ผู้เกี่ยวข้อง");
    if (!payload.detailItems.damageItems.length) missing.push("ความเสียหาย");
    if (!payload.detailItems.actionItems.length) missing.push("การดำเนินการ");
    if (!payload.detailItems.evidenceItems.length) missing.push("หลักฐานที่พบ/ประกอบ");
    if (!payload.detailItems.rootCauseItems.length) missing.push("สาเหตุของเหตุการณ์ในครั้งนี้");
    if (!payload.detailItems.preventionItems.length) missing.push("การป้องกันเกิดเหตุซ้ำ / เสนอแนะ");
    if (!payload.detailItems.lessonItems.length) missing.push("ได้อะไรจากการสอบสวนครั้งนี้ / หรือมีข้อขัดข้อง");
    if (!payload.reportedBy) missing.push("รายงานโดย");
    if (!payload.reporterPosition) missing.push("ตำแหน่งผู้รายงาน");
    if (!payload.reportDate) missing.push("วันที่รายงาน");

    const validFiles = files.filter(f => f.data && f.caption);
    if (!validFiles.length) missing.push("รูปภาพพร้อมคำบรรยายอย่างน้อย 1 รายการ");

    return missing.length ? missing.join(", ") : "";
  }

  function buildSelectOptions(options) {
    return `<option value="">-- เลือก --</option>` + options.map(opt =>
      `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`
    ).join("");
  }

  function valueOf(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function selectedRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  }

  function checkedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  Report500App.init();
});
