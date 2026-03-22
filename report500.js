const REPORT500_API_BASE = "https://bol.somchaibutphon.workers.dev";

const Report500App = (() => {
  const state = {
    pass: "",
    authName: "",
    optionsLoaded: false,
    options: {
      reportTypes: [],
      urgencyLevels: [],
      reportTo: [],
      locationTypes: [],
      branches: [],
      causeCategories: [],
      departments: [],
      reportedByOptions: [],
      incidentCategories: []
    }
  };

  const $ = (id) => document.getElementById(id);

  function apiUrl(path) {
    const base = String(REPORT500_API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  function init() {
    bindModeIntegration();
    bindFormEvents();
    setDefaultDates();
  }

  function bindModeIntegration() {
    document.addEventListener("app:auth-success", (ev) => {
      state.pass = window.APP_AUTH_PASS || "";
      state.authName = ev?.detail?.user?.name || "";
      syncAuthToReportForm();
    });

    document.addEventListener("app:mode-change", async (ev) => {
      const mode = ev?.detail?.mode || "";
      if (mode !== "report500") return;

      const ok = await ensureSession();
      if (!ok) return;

      syncAuthToReportForm();

      if (!state.optionsLoaded) {
        await loadOptions();
        buildInitialRows();
        state.optionsLoaded = true;
      }
    });
  }

  function bindFormEvents() {
    $("btnRptAddPerson")?.addEventListener("click", addPersonRow);
    $("btnRptAddImage")?.addEventListener("click", addImageRow);
    $("btnRptPreview")?.addEventListener("click", previewSummary);
    $("btnRptSubmit")?.addEventListener("click", submitReport);

    document.querySelectorAll(".rptAddDetailBtn").forEach((btn) => {
      btn.addEventListener("click", () => addDetailRow(btn.dataset.target));
    });
  }

  async function ensureSession() {
    if (window.APP_AUTH_PASS) {
      state.pass = window.APP_AUTH_PASS;
      return true;
    }

    await Swal.fire("กรุณาเข้าสู่ระบบก่อน", "โปรดเข้าสู่ระบบจากหน้าหลักก่อน แล้วค่อยเลือกแท็บ <500", "warning");
    return false;
  }

  function syncAuthToReportForm() {
    const name = window.APP_AUTH_USER?.name || state.authName || "";
    const el = $("rptLoginUser");
    if (el) el.value = name;

    if ($("rptReportedBy") && !$("rptReportedBy").value && name) {
      $("rptReportedBy").value = name;
    }
  }

  async function loadOptions(forceReload = false) {
    if (state.optionsLoaded && !forceReload) return;

    const res = await fetch(apiUrl("/options"), { method: "GET" });
    const raw = await res.json();

    if (!raw?.ok) {
      throw new Error(raw?.message || raw?.error || "โหลดตัวเลือกไม่สำเร็จ");
    }

    const options = raw?.data?.reportFormOptions || {};

    state.options = {
      reportTypes: normalizeOptions(options.reportTypes),
      urgencyLevels: normalizeOptions(options.urgencyLevels),
      reportTo: normalizeOptions(options.reportTo),
      locationTypes: normalizeOptions(options.locationTypes),
      branches: normalizeOptions(options.branches),
      causeCategories: normalizeOptions(options.causeCategories),
      departments: normalizeOptions(options.departments),
      reportedByOptions: normalizeOptions(options.reportedByOptions),
      incidentCategories: normalizeOptions(options.incidentCategories)
    };

    renderSelectWithOther(
      "rptBranch",
      state.options.branches,
      "rptBranchOtherWrap",
      "rptBranchOther",
      "ระบุสาขา/หน่วยงาน (อื่นๆ)"
    );

    renderSelectWithOther(
      "rptReportedBy",
      state.options.reportedByOptions,
      "rptReportedByOtherWrap",
      "rptReportedByOther",
      "ระบุรายงานโดย (อื่นๆ)"
    );

    renderCheckboxGroupWithOther(
      "rptReportTypeBox",
      "rptReportTypes",
      state.options.reportTypes,
      "rptReportTypeOtherWrap",
      "rptReportTypeOther",
      "ระบุประเภทรายงาน (อื่นๆ)"
    );

    renderCheckboxGroupWithOther(
      "rptUrgencyBox",
      "rptUrgencyLevels",
      state.options.urgencyLevels,
      "rptUrgencyOtherWrap",
      "rptUrgencyOther",
      "ระบุระดับความเร่งด่วน (อื่นๆ)"
    );

    renderCheckboxGroupWithOther(
      "rptReportToBox",
      "rptReportTo",
      state.options.reportTo,
      "rptReportToOtherWrap",
      "rptReportToOther",
      "ระบุผู้รับรายงาน (อื่นๆ)"
    );

    renderCheckboxGroupWithOther(
      "rptIncidentCategoriesBox",
      "rptIncidentCategories",
      state.options.incidentCategories,
      "rptIncidentCategoriesOtherWrap",
      "rptIncidentCategoriesOther",
      "ระบุหมวดเหตุการณ์ (อื่นๆ)"
    );

    renderCheckboxGroupWithOther(
      "rptCauseCategoryBox",
      "rptCauseCategories",
      state.options.causeCategories,
      "rptCauseCategoryOtherWrap",
      "rptCauseCategoryOther",
      "ระบุสาเหตุ (อื่นๆ)"
    );

    renderLocationTypeGroup();
    state.optionsLoaded = true;
  }

  function normalizeOptions(list) {
    return (Array.isArray(list) ? list : [])
      .map((opt, i) => {
        if (typeof opt === "string") return { seq: i + 1, label: opt, value: opt };
        return {
          seq: Number(opt?.seq || i + 1),
          label: String(opt?.label || opt?.value || "").trim(),
          value: String(opt?.value || opt?.label || "").trim()
        };
      })
      .filter((x) => x.label && x.value)
      .sort((a, b) => a.seq - b.seq);
  }

  function renderSelectWithOther(selectId, options, wrapId, inputId, otherPlaceholder) {
    const select = $(selectId);
    const wrap = $(wrapId);
    const input = $(inputId);
    if (!select) return;

    const list = [{ label: "กรุณาเลือก", value: "" }, ...options];
    select.innerHTML = list.map((opt) => {
      return `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`;
    }).join("");

    const toggle = () => {
      const isOther = select.value === "Other" || select.value === "อื่นๆ";
      if (wrap) wrap.classList.toggle("hidden", !isOther);
      if (input) {
        input.placeholder = otherPlaceholder || "ระบุข้อมูล";
        if (!isOther) input.value = "";
      }
    };

    select.addEventListener("change", toggle);
    toggle();
  }

  function renderCheckboxGroupWithOther(containerId, name, options, wrapId, inputId, otherPlaceholder) {
    const box = $(containerId);
    const wrap = $(wrapId);
    const input = $(inputId);
    if (!box) return;

    box.innerHTML = options.map((opt, idx) => {
      const val = escapeHtml(opt.value);
      const label = escapeHtml(opt.label);
      return `
        <label class="checkCard">
          <input type="checkbox" name="${name}" value="${val}" data-other="${val === "Other" || val === "อื่นๆ" ? "1" : "0"}">
          <span>${label}</span>
        </label>
      `;
    }).join("");

    const sync = () => {
      const hasOther = [...box.querySelectorAll(`input[name="${name}"]`)]
        .some((el) => el.checked && (el.value === "Other" || el.value === "อื่นๆ"));

      if (wrap) wrap.classList.toggle("hidden", !hasOther);
      if (input) {
        input.placeholder = otherPlaceholder || "ระบุข้อมูล";
        if (!hasOther) input.value = "";
      }
    };

    box.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      el.addEventListener("change", sync);
    });

    sync();
  }

  function renderLocationTypeGroup() {
    const box = $("rptLocationTypeBox");
    if (!box) return;

    box.innerHTML = state.options.locationTypes.map((opt) => {
      const value = String(opt.value || "").trim();
      const label = String(opt.label || "").trim();
      const withTailInput = [
        "Hypermarket Store",
        "Super market Store",
        "Value Store",
        "Express Store"
      ].includes(value);

      return `
        <div class="checkLine">
          <label class="checkCard">
            <input type="checkbox" name="rptLocationTypes" value="${escapeHtml(value)}" data-other="${value === "Other" ? "1" : "0"}">
            <span>${escapeHtml(label)}</span>
          </label>
          ${withTailInput ? `
            <input
              type="text"
              class="inlineTailInput"
              data-location-detail="${escapeHtml(value)}"
              placeholder="ระบุเพิ่มเติม"
              disabled
            >
          ` : ``}
        </div>
      `;
    }).join("");

    box.querySelectorAll('input[name="rptLocationTypes"]').forEach((chk) => {
      chk.addEventListener("change", () => {
        const value = chk.value;
        const tail = box.querySelector(`[data-location-detail="${cssEscape(value)}"]`);
        if (tail) {
          tail.disabled = !chk.checked;
          if (!chk.checked) tail.value = "";
        }

        const hasOther = [...box.querySelectorAll('input[name="rptLocationTypes"]')]
          .some((el) => el.checked && (el.value === "Other" || el.value === "อื่นๆ"));

        $("rptLocationTypeOtherWrap")?.classList.toggle("hidden", !hasOther);
        if (!hasOther && $("rptLocationTypeOther")) $("rptLocationTypeOther").value = "";
      });
    });
  }

  function buildInitialRows() {
    buildDetailBlock("rptDamageRows", 1);
    buildDetailBlock("rptActionRows", 1);
    buildDetailBlock("rptEvidenceRows", 1);
    buildDetailBlock("rptRootCauseRows", 1);
    buildDetailBlock("rptPreventionRows", 1);
    buildDetailBlock("rptLessonRows", 1);

    if (!$("rptPeopleRows")?.children.length) addPersonRow();
    if (!$("rptImageRows")?.children.length) addImageRow();
  }

  function buildDetailBlock(containerId, count = 1) {
    const box = $(containerId);
    if (!box) return;
    box.innerHTML = "";
    for (let i = 0; i < count; i++) addDetailRow(containerId);
  }

  function addDetailRow(targetId) {
    const box = $(targetId);
    if (!box) return;

    const row = document.createElement("div");
    row.className = "repeatRow";
    row.innerHTML = `
      <div class="repeatRowMain">
        <textarea class="rptDetailText" rows="2" placeholder="กรอกรายละเอียด"></textarea>
      </div>
      <button type="button" class="btnDangerGhost rptMiniBtn">ลบ</button>
    `;

    row.querySelector("button")?.addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  function addPersonRow() {
    const box = $("rptPeopleRows");
    if (!box) return;

    const row = document.createElement("div");
    row.className = "repeatCard";
    row.innerHTML = `
      <div class="grid2">
        <div class="field">
          <label>ผู้เกี่ยวข้อง</label>
          <input type="text" class="rptPersonName">
        </div>
        <div class="field">
          <label>ตำแหน่ง</label>
          <input type="text" class="rptPersonPosition">
        </div>
        <div class="field">
          <label>ส่วนงาน</label>
          <input type="text" class="rptPersonDepartment">
        </div>
        <div class="field">
          <label>หมายเหตุ</label>
          <input type="text" class="rptPersonRemark">
        </div>
      </div>
      <div class="repeatCardActions">
        <button type="button" class="btnDangerGhost rptMiniBtn">ลบรายการนี้</button>
      </div>
    `;
    row.querySelector("button")?.addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  function addImageRow() {
    const box = $("rptImageRows");
    if (!box) return;

    const index = box.children.length + 1;
    const row = document.createElement("div");
    row.className = "repeatCard";
    row.innerHTML = `
      <div class="grid2">
        <div class="field">
          <label>รูปภาพ ${index}</label>
          <input type="file" class="rptImageFile" accept="image/*">
        </div>
        <div class="field">
          <label>คำบรรยายภาพ</label>
          <input type="text" class="rptImageCaption" placeholder="เช่น ภาพจุดเกิดเหตุ">
        </div>
      </div>
      <div class="repeatCardActions">
        <button type="button" class="btnDangerGhost rptMiniBtn">ลบรายการนี้</button>
      </div>
    `;
    row.querySelector("button")?.addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  function setDefaultDates() {
    const today = formatDateInput(new Date());
    if ($("rptIncidentDate") && !$("rptIncidentDate").value) $("rptIncidentDate").value = today;
    if ($("rptReportDate") && !$("rptReportDate").value) $("rptReportDate").value = today;
  }

  function formatDateInput(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateDisplay(value) {
    if (!value) return "";
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return String(value);
  }

  function getCheckedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
      .map((el) => String(el.value || "").trim())
      .filter(Boolean);
  }

  function resolveSelectWithOther(selectId, otherId) {
    const selected = $(selectId)?.value || "";
    if (selected === "Other" || selected === "อื่นๆ") {
      return String($(otherId)?.value || "").trim();
    }
    return String(selected || "").trim();
  }

  function collectLocationTypeDetails() {
    const out = {
      "Hypermarket Store": "",
      "Super market Store": "",
      "Value Store": "",
      "Express Store": ""
    };

    document.querySelectorAll("[data-location-detail]").forEach((el) => {
      const key = el.getAttribute("data-location-detail");
      out[key] = String(el.value || "").trim();
    });

    return out;
  }

  function collectPeople() {
    return [...document.querySelectorAll("#rptPeopleRows .repeatCard")]
      .map((row) => ({
        name: row.querySelector(".rptPersonName")?.value?.trim() || "",
        position: row.querySelector(".rptPersonPosition")?.value?.trim() || "",
        department: row.querySelector(".rptPersonDepartment")?.value?.trim() || "",
        remark: row.querySelector(".rptPersonRemark")?.value?.trim() || ""
      }))
      .filter((x) => x.name || x.position || x.department || x.remark);
  }

  function collectDetailItems(containerId) {
    return [...document.querySelectorAll(`#${containerId} .repeatRow`)]
      .map((row, index) => ({
        text: row.querySelector(".rptDetailText")?.value?.trim() || "",
        sortOrder: index + 1
      }))
      .filter((x) => x.text);
  }

  async function collectImages() {
    const rows = [...document.querySelectorAll("#rptImageRows .repeatCard")];
    const out = [];

    for (let i = 0; i < rows.length; i++) {
      const fileInput = rows[i].querySelector(".rptImageFile");
      const caption = rows[i].querySelector(".rptImageCaption")?.value?.trim() || "";
      const file = fileInput?.files?.[0];
      if (!file) continue;

      const data = await readFileAsBase64(file);
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

  function readFileAsBase64(file) {
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

  function collectPayload() {
    return {
      refNo: String($("rptRefNo")?.value || "").trim(),
      branch: resolveSelectWithOther("rptBranch", "rptBranchOther"),
      subject: String($("rptSubject")?.value || "").trim(),

      reportTypes: getCheckedValues("rptReportTypes"),
      reportTypeOtherText: String($("rptReportTypeOther")?.value || "").trim(),

      urgencyLevels: getCheckedValues("rptUrgencyLevels"),
      urgencyOtherText: String($("rptUrgencyOther")?.value || "").trim(),

      reportTo: getCheckedValues("rptReportTo"),
      reportToOtherText: String($("rptReportToOther")?.value || "").trim(),

      incidentDate: formatDateDisplay($("rptIncidentDate")?.value || ""),
      incidentTime: String($("rptIncidentTime")?.value || "").trim(),

      incidentDescription: String($("rptIncidentDescription")?.value || "").trim(),
      incidentLocation: String($("rptIncidentLocation")?.value || "").trim(),

      locationTypes: getCheckedValues("rptLocationTypes"),
      locationTypeOtherText: String($("rptLocationTypeOther")?.value || "").trim(),
      locationTypeDetails: collectLocationTypeDetails(),
      area: String($("rptArea")?.value || "").trim(),

      incidentCategories: getCheckedValues("rptIncidentCategories"),
      incidentCategoryOtherText: String($("rptIncidentCategoriesOther")?.value || "").trim(),

      causeCategories: getCheckedValues("rptCauseCategories"),
      causeCategoryOtherText: String($("rptCauseCategoryOther")?.value || "").trim(),

      involvedPeople: collectPeople(),

      damageItems: collectDetailItems("rptDamageRows"),
      actionItems: collectDetailItems("rptActionRows"),
      evidenceItems: collectDetailItems("rptEvidenceRows"),
      rootCauseItems: collectDetailItems("rptRootCauseRows"),
      preventionItems: collectDetailItems("rptPreventionRows"),
      lessonItems: collectDetailItems("rptLessonRows"),

      offenderStatement: String($("rptOffenderStatement")?.value || "").trim(),
      summaryText: String($("rptSummaryText")?.value || "").trim(),
      investigationLesson: String($("rptInvestigationLesson")?.value || "").trim(),

      reportedBy: resolveSelectWithOther("rptReportedBy", "rptReportedByOther") || String($("rptLoginUser")?.value || "").trim(),
      reporterPosition: String($("rptReporterPosition")?.value || "").trim(),
      reportDate: formatDateDisplay($("rptReportDate")?.value || "")
    };
  }

  async function previewSummary() {
    const payload = collectPayload();
    const html = `
      <div style="text-align:left;font-size:14px;line-height:1.6">
        <div><b>เลขที่อ้างอิง:</b> ${escapeHtml(payload.refNo || "-")}</div>
        <div><b>สาขา/หน่วยงาน:</b> ${escapeHtml(payload.branch || "-")}</div>
        <div><b>เรื่อง:</b> ${escapeHtml(payload.subject || "-")}</div>
        <div><b>ประเภทรายงาน:</b> ${escapeHtml((payload.reportTypes || []).join(" | ") || "-")}</div>
        <div><b>ความเร่งด่วน:</b> ${escapeHtml((payload.urgencyLevels || []).join(" | ") || "-")}</div>
        <div><b>ผู้รับรายงาน:</b> ${escapeHtml((payload.reportTo || []).join(" | ") || "-")}</div>
        <div><b>วันที่/เวลา:</b> ${escapeHtml(payload.incidentDate || "-")} ${escapeHtml(payload.incidentTime || "")}</div>
        <div><b>พื้นที่:</b> ${escapeHtml(payload.area || "-")}</div>
        <div><b>รายงานโดย:</b> ${escapeHtml(payload.reportedBy || "-")}</div>
      </div>
    `;

    await Swal.fire({
      title: "ตัวอย่างข้อมูลก่อนส่ง",
      html,
      width: 760,
      confirmButtonText: "ปิด"
    });
  }

  async function submitReport() {
    try {
      const ok = await ensureSession();
      if (!ok) return;

      const payload = collectPayload();
      const files = await collectImages();

      const confirm = await Swal.fire({
        icon: "question",
        title: "ยืนยันการส่งรายงาน",
        text: "ระบบจะบันทึกข้อมูล อัปโหลดรูป และสร้าง PDF",
        showCancelButton: true,
        confirmButtonText: "ส่งรายงาน",
        cancelButtonText: "ยกเลิก"
      });

      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: "กำลังบันทึกข้อมูล...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(apiUrl("/submitReport"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass: state.pass,
          payload,
          files
        })
      });

      const raw = await res.json();

      if (!raw?.ok) {
        throw new Error(raw?.message || raw?.error || "ส่งรายงานไม่สำเร็จ");
      }

      await Swal.fire({
        icon: "success",
        title: "บันทึกรายงานสำเร็จ",
        html: `
          <div style="text-align:left">
            <div><b>รหัสรายงาน:</b> ${escapeHtml(raw.reportId || "-")}</div>
            <div><b>จำนวนรูป:</b> ${escapeHtml(String(raw.uploadedImageCount || 0))}</div>
            ${raw.pdfUrl ? `<div style="margin-top:8px"><a href="${raw.pdfUrl}" target="_blank" rel="noopener">เปิด PDF</a></div>` : ""}
          </div>
        `
      });

      resetFormAfterSubmit();
    } catch (err) {
      await Swal.fire("เกิดข้อผิดพลาด", err?.message || String(err), "error");
    }
  }

  function resetFormAfterSubmit() {
    const form = $("report500Form");
    if (form) form.reset();

    buildInitialRows();
    renderLocationTypeGroup();
    renderCheckboxGroupWithOther(
      "rptReportTypeBox", "rptReportTypes", state.options.reportTypes,
      "rptReportTypeOtherWrap", "rptReportTypeOther", "ระบุประเภทรายงาน (อื่นๆ)"
    );
    renderCheckboxGroupWithOther(
      "rptUrgencyBox", "rptUrgencyLevels", state.options.urgencyLevels,
      "rptUrgencyOtherWrap", "rptUrgencyOther", "ระบุระดับความเร่งด่วน (อื่นๆ)"
    );
    renderCheckboxGroupWithOther(
      "rptReportToBox", "rptReportTo", state.options.reportTo,
      "rptReportToOtherWrap", "rptReportToOther", "ระบุผู้รับรายงาน (อื่นๆ)"
    );
    renderCheckboxGroupWithOther(
      "rptIncidentCategoriesBox", "rptIncidentCategories", state.options.incidentCategories,
      "rptIncidentCategoriesOtherWrap", "rptIncidentCategoriesOther", "ระบุหมวดเหตุการณ์ (อื่นๆ)"
    );
    renderCheckboxGroupWithOther(
      "rptCauseCategoryBox", "rptCauseCategories", state.options.causeCategories,
      "rptCauseCategoryOtherWrap", "rptCauseCategoryOther", "ระบุสาเหตุ (อื่นๆ)"
    );
    setDefaultDates();
    syncAuthToReportForm();
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  Report500App.init();
});
