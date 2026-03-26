(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    ready: false,
    loading: false,
    options: null,
    repeatBound: false,
    topBound: false
  };

  const OTHER_LABELS = ["อื่นๆ", "other", "others", "อื่น"];
  const MAX_IMAGE_SIZE_MB = 15;

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

  function apiUrl(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    const base = String(window.API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  function todayIsoLocal() {
    if (window.AppShared && typeof window.AppShared.todayIsoLocal === "function") {
      return window.AppShared.todayIsoLocal();
    }
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateDisplay(v) {
    const s = norm(v);
    if (!s) return "-";

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

  function parseOtherLabels(raw) {
    if (!raw) return false;
    const s = String(raw).trim().toLowerCase();
    return OTHER_LABELS.includes(s);
  }

  function splitMultiEmails(text) {
    return String(text || "")
      .split(/[\n,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function uniqueEmails(list) {
    const seen = new Set();
    const out = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    (Array.isArray(list) ? list : []).forEach((v) => {
      const s = String(v || "").trim();
      if (!s) return;
      if (!emailRegex.test(s)) return;
      const k = s.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(s);
    });

    return out;
  }

  function safeAuth() {
    return window.AUTH || { name: "", pass: "" };
  }

  function getRefNo() {
    if (typeof window.getRptRefNoValue === "function") return window.getRptRefNoValue();
    const running = String($("rptRefNo")?.value || "").replace(/[^\d]/g, "").trim();
    const year = String($("rptRefYear")?.textContent || "").trim();
    return running ? `${running}-${year}` : "";
  }

  function setRefYear() {
    const el = $("rptRefYear");
    if (!el) return;
    const buddhistYear = String(new Date().getFullYear() + 543);
    el.textContent = buddhistYear;
  }

  function safeCssEscape(value) {
    try {
      if (window.CSS && typeof window.CSS.escape === "function") {
        return window.CSS.escape(String(value || ""));
      }
    } catch (_) {}
    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function createOptionCardHtml(name, item, checked) {
    const value = typeof item === "object" ? norm(item.value || item.text || item.label) : norm(item);
    const label = typeof item === "object" ? norm(item.label || item.text || item.value) : norm(item);
    const other = typeof item === "object"
      ? !!item.isOther || parseOtherLabels(item.value || item.text || item.label)
      : parseOtherLabels(item);

    return `
      <label class="optionChoice">
        <div class="optionChoiceCard">
          <input
            type="checkbox"
            name="${escapeHtml(name)}"
            value="${escapeHtml(value)}"
            data-label="${escapeHtml(label)}"
            data-other="${other ? "1" : "0"}"
            ${checked ? "checked" : ""}
          >
          <span class="optionChoiceMark"></span>
          <span class="optionChoiceText">${escapeHtml(label)}</span>
        </div>
      </label>
    `;
  }

  function renderOptionMatrix(rootId, name, items, selectedValues) {
    const root = $(rootId);
    if (!root) return;

    const selectedSet = new Set((Array.isArray(selectedValues) ? selectedValues : []).map((x) => String(x)));
    const rows = Array.isArray(items) ? items : [];

    root.innerHTML = rows.length
      ? rows.map((item) => {
          const v = typeof item === "object" ? norm(item.value || item.text || item.label) : norm(item);
          return createOptionCardHtml(name, item, selectedSet.has(v));
        }).join("")
      : `<div class="optionMatrixEmpty">ไม่พบตัวเลือก</div>`;

    root.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      el.addEventListener("change", () => {
        syncOptionOtherInputs(rootId, name);
      });
    });

    syncOptionOtherInputs(rootId, name);
  }

  function syncOptionOtherInputs(rootId, name) {
    const root = $(rootId);
    if (!root) return;

    root.querySelectorAll(".optionChoiceOther").forEach((el) => el.remove());

    root.querySelectorAll(`input[name="${name}"][data-other="1"]:checked`).forEach((chk) => {
      const wrap = document.createElement("div");
      wrap.className = "optionChoiceOther";
      wrap.innerHTML = `
        <input
          type="text"
          class="input optionOtherInput"
          data-parent-name="${escapeHtml(name)}"
          data-parent-value="${escapeHtml(chk.value)}"
          placeholder="ระบุเพิ่มเติมสำหรับ ${escapeHtml(chk.dataset.label || chk.value)}"
        >
      `;
      chk.closest(".optionChoice")?.appendChild(wrap);
    });
  }

  function renderSelect(selectId, items, includePlaceholder) {
    const el = $(selectId);
    if (!el) return;

    const list = Array.isArray(items) ? items : [];
    const html = [];

    if (includePlaceholder !== false) {
      html.push(`<option value="">-- เลือก --</option>`);
    }

    list.forEach((item) => {
      const value = typeof item === "object" ? norm(item.value || item.text || item.label) : norm(item);
      const label = typeof item === "object" ? norm(item.label || item.text || item.value) : norm(item);
      html.push(`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
    });

    el.innerHTML = html.join("");
  }

  function bindOtherSelect(selectId, wrapId, inputId) {
    const select = $(selectId);
    const wrap = $(wrapId);
    const input = $(inputId);
    if (!select || !wrap) return;

    const sync = () => {
      const show = parseOtherLabels(select.value);
      wrap.classList.toggle("hidden", !show);
      if (!show && input) input.value = "";
    };

    select.onchange = null;
    select.addEventListener("change", sync);
    sync();
  }

  function setAllCheckboxBySelector(selector, checked) {
    document.querySelectorAll(selector).forEach((el) => {
      el.checked = !!checked;
    });
  }

  function renderEmailSelector() {
    const root = $("rptEmailSelector");
    if (!root) return;

    const emails = Array.isArray(state.options?.emailList) ? state.options.emailList : [];
    if (!emails.length) {
      root.innerHTML = `<div class="emailEmpty">ไม่พบรายการอีเมล</div>`;
      return;
    }

    root.innerHTML = emails.map((email) => `
      <label class="emailItem">
        <input type="checkbox" class="rptEmailChk" value="${escapeHtml(email)}">
        <span class="emailCheckBox"></span>
        <span class="emailText">${escapeHtml(email)}</span>
      </label>
    `).join("");
  }

  function getSelectedReport500Emails() {
    const checked = Array.from(document.querySelectorAll(".rptEmailChk:checked"))
      .map((el) => String(el.value || "").trim())
      .filter(Boolean);

    const other = splitMultiEmails($("rptEmailOther")?.value || "");
    return uniqueEmails([].concat(checked).concat(other));
  }

  function createPersonRow(data = {}) {
    const div = document.createElement("div");
    div.className = "rptRepeatCard";
    div.innerHTML = `
      <div class="gridCompact">
        <div class="field">
          <label>ชื่อ-นามสกุล</label>
          <input type="text" class="rptPersonName" placeholder="ชื่อผู้เกี่ยวข้อง" value="${escapeHtml(data.name || "")}">
        </div>
        <div class="field">
          <label>รหัสพนักงาน</label>
          <input type="text" class="rptPersonCode" placeholder="รหัสพนักงาน" value="${escapeHtml(data.code || "")}">
        </div>
        <div class="field">
          <label>ตำแหน่ง / หน่วยงาน</label>
          <input type="text" class="rptPersonPosition" placeholder="ตำแหน่งหรือหน่วยงาน" value="${escapeHtml(data.position || "")}">
        </div>
        <div class="field">
          <label>ผลกระทบ / รายละเอียด</label>
          <input type="text" class="rptPersonEffect" placeholder="ผลกระทบหรือรายละเอียด" value="${escapeHtml(data.effect || "")}">
        </div>
      </div>
      <div class="panelActions" style="margin-top:10px">
        <button type="button" class="btn ghost rptRemoveRow">ลบรายการ</button>
      </div>
    `;
    div.querySelector(".rptRemoveRow")?.addEventListener("click", () => div.remove());
    return div;
  }

  function createTextRow(data = {}, placeholders = {}) {
    const div = document.createElement("div");
    div.className = "rptRepeatCard";
    div.innerHTML = `
      <div class="gridCompact">
        <div class="field">
          <label>${escapeHtml(placeholders.label1 || "หัวข้อ")}</label>
          <input type="text" class="rptRowText1" placeholder="${escapeHtml(placeholders.ph1 || "")}" value="${escapeHtml(data.text || data.title || "")}">
        </div>
        <div class="field">
          <label>${escapeHtml(placeholders.label2 || "รายละเอียด")}</label>
          <input type="text" class="rptRowText2" placeholder="${escapeHtml(placeholders.ph2 || "")}" value="${escapeHtml(data.detail || "")}">
        </div>
      </div>
      <div class="panelActions" style="margin-top:10px">
        <button type="button" class="btn ghost rptRemoveRow">ลบรายการ</button>
      </div>
    `;
    div.querySelector(".rptRemoveRow")?.addEventListener("click", () => div.remove());
    return div;
  }

  function createActionRow(data = {}) {
    const div = document.createElement("div");
    div.className = "rptRepeatCard";
    div.innerHTML = `
      <div class="gridCompact">
        <div class="field">
          <label>การดำเนินการ</label>
          <input type="text" class="rptActionText" placeholder="ระบุการแก้ไขเฉพาะหน้า" value="${escapeHtml(data.text || "")}">
        </div>
        <div class="field">
          <label>ผู้รับผิดชอบ</label>
          <input type="text" class="rptActionOwner" placeholder="ผู้รับผิดชอบ" value="${escapeHtml(data.owner || "")}">
        </div>
        <div class="field">
          <label>กำหนดเสร็จ</label>
          <input type="text" class="rptActionDue" placeholder="เช่น 27/03/2026" value="${escapeHtml(data.dueDate || data.due || "")}">
        </div>
        <div class="field">
          <label>สถานะ</label>
          <input type="text" class="rptActionStatus" placeholder="เช่น กำลังดำเนินการ" value="${escapeHtml(data.status || "")}">
        </div>
      </div>
      <div class="panelActions" style="margin-top:10px">
        <button type="button" class="btn ghost rptRemoveRow">ลบรายการ</button>
      </div>
    `;
    div.querySelector(".rptRemoveRow")?.addEventListener("click", () => div.remove());
    return div;
  }

  function createImageRow(data = {}) {
    const div = document.createElement("div");
    div.className = "rptRepeatCard";
    div.innerHTML = `
      <div class="field">
        <label>เลือกรูปภาพ</label>
        <input type="file" class="rptImageFile" accept="image/*">
      </div>
      <div class="field">
        <label>คำบรรยายภาพ</label>
        <textarea class="rptImageCaption" rows="3" placeholder="อธิบายภาพนี้">${escapeHtml(data.caption || "")}</textarea>
      </div>
      <div class="field">
        <div class="rptImagePreviewEmpty">ยังไม่ได้เลือกรูปภาพ</div>
        <img class="rptImagePreview hidden" alt="preview">
        <div class="fieldHint rptImageMeta"></div>
      </div>
      <div class="panelActions" style="margin-top:10px">
        <button type="button" class="btn ghost rptRemoveRow">ลบรายการ</button>
      </div>
    `;

    const fileInput = div.querySelector(".rptImageFile");
    const previewEmpty = div.querySelector(".rptImagePreviewEmpty");
    const preview = div.querySelector(".rptImagePreview");
    const meta = div.querySelector(".rptImageMeta");

    fileInput?.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!f) {
        preview?.classList.add("hidden");
        previewEmpty?.classList.remove("hidden");
        if (preview) preview.removeAttribute("src");
        if (meta) meta.textContent = "";
        return;
      }

      if (!/^image\//i.test(f.type || "")) {
        fileInput.value = "";
        preview?.classList.add("hidden");
        previewEmpty?.classList.remove("hidden");
        if (preview) preview.removeAttribute("src");
        if (meta) meta.textContent = "";
        Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      const mb = f.size / (1024 * 1024);
      if (meta) meta.textContent = `ไฟล์: ${f.name} (${mb.toFixed(2)} MB)`;

      if (preview && preview.dataset.objectUrl) {
        try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
      }

      const url = URL.createObjectURL(f);
      if (preview) {
        preview.src = url;
        preview.dataset.objectUrl = url;
        preview.classList.remove("hidden");
      }
      previewEmpty?.classList.add("hidden");
    });

    div.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
      if (preview && preview.dataset.objectUrl) {
        try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
      }
      div.remove();
    });

    return div;
  }

  function appendRow(listId, node) {
    const root = $(listId);
    if (!root || !node) return;
    root.appendChild(node);
  }

  function collectPersons() {
    return Array.from(document.querySelectorAll("#rptPersonList .rptRepeatCard"))
      .map((card) => ({
        name: norm(card.querySelector(".rptPersonName")?.value),
        code: norm(card.querySelector(".rptPersonCode")?.value),
        position: norm(card.querySelector(".rptPersonPosition")?.value),
        effect: norm(card.querySelector(".rptPersonEffect")?.value)
      }))
      .filter((x) => x.name || x.code || x.position || x.effect);
  }

  function collectTextRows(listId, cls1, cls2) {
    return Array.from(document.querySelectorAll(`#${listId} .rptRepeatCard`))
      .map((card) => ({
        text: norm(card.querySelector(cls1)?.value),
        detail: norm(card.querySelector(cls2)?.value)
      }))
      .filter((x) => x.text || x.detail);
  }

  function collectActionRows() {
    return Array.from(document.querySelectorAll("#rptActionList .rptRepeatCard"))
      .map((card) => ({
        text: norm(card.querySelector(".rptActionText")?.value),
        owner: norm(card.querySelector(".rptActionOwner")?.value),
        dueDate: norm(card.querySelector(".rptActionDue")?.value),
        status: norm(card.querySelector(".rptActionStatus")?.value)
      }))
      .filter((x) => x.text || x.owner || x.dueDate || x.status);
  }

  function collectCheckedOptions(rootId, name) {
    const root = $(rootId);
    if (!root) return [];

    return Array.from(root.querySelectorAll(`input[name="${name}"]:checked`))
      .map((el) => {
        const value = norm(el.value);
        const escapedValue = safeCssEscape(value);
        const textValue = parseOtherLabels(value)
          ? norm(root.querySelector(`.optionOtherInput[data-parent-name="${name}"][data-parent-value="${escapedValue}"]`)?.value)
          : "";

        return {
          value: value,
          textValue: textValue
        };
      })
      .filter((x) => x.value || x.textValue);
  }

  async function fileToBase64(file) {
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const out = String(fr.result || "");
        const idx = out.indexOf(",");
        resolve(idx >= 0 ? out.slice(idx + 1) : out);
      };
      fr.onerror = () => reject(fr.error || new Error("ไม่สามารถอ่านไฟล์ได้"));
      fr.readAsDataURL(file);
    });
  }

  async function collectImageFiles() {
    const out = [];
    const rows = Array.from(document.querySelectorAll("#rptImageList .rptRepeatCard"));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fileInput = row.querySelector(".rptImageFile");
      const caption = norm(row.querySelector(".rptImageCaption")?.value);
      const file = fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!file && !caption) continue;
      if (!file) {
        throw new Error(`รูปภาพรายการที่ ${i + 1} ยังไม่ได้เลือกไฟล์`);
      }
      if (!/^image\//i.test(file.type || "")) {
        throw new Error(`ไฟล์รูปภาพรายการที่ ${i + 1} ไม่ถูกต้อง`);
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_IMAGE_SIZE_MB) {
        throw new Error(`ไฟล์รูปภาพรายการที่ ${i + 1} มีขนาดเกิน ${MAX_IMAGE_SIZE_MB} MB`);
      }

      const base64 = await fileToBase64(file);
      out.push({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: base64,
        caption: caption
      });
    }

    return out;
  }

  function fillDefaultsAfterLogin() {
    const auth = safeAuth();
    const name = norm(auth.name);

    if ($("rptReportedBy")) {
      $("rptReportedBy").innerHTML = name
        ? `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
        : `<option value="">-- เลือก --</option>`;
      $("rptReportedBy").value = name;
    }

    if ($("rptReportDate") && !$("rptReportDate").value) {
      $("rptReportDate").value = todayIsoLocal();
    }
    if ($("rptIncidentDate") && !$("rptIncidentDate").value) {
      $("rptIncidentDate").value = todayIsoLocal();
    }
  }

  function validatePayload(payload) {
    if (!norm(payload.refNo)) throw new Error("กรุณากรอก Ref No.");
    if (!norm(payload.branch)) throw new Error("กรุณาเลือกสาขา");
    if (parseOtherLabels(payload.branch) && !norm(payload.branchOther)) {
      throw new Error("กรุณาระบุสาขาอื่นๆ");
    }
    if (!norm(payload.subject)) throw new Error("กรุณากรอกเรื่อง");
    if (!Array.isArray(payload.reportTypes) || !payload.reportTypes.length) {
      throw new Error("กรุณาเลือกประเภทรายงานอย่างน้อย 1 รายการ");
    }
    if (!Array.isArray(payload.urgencyTypes) || !payload.urgencyTypes.length) {
      throw new Error("กรุณาเลือกระดับความเร่งด่วนอย่างน้อย 1 รายการ");
    }
    if (!Array.isArray(payload.notifyTo) || !payload.notifyTo.length) {
      throw new Error("กรุณาเลือกผู้รับทราบอย่างน้อย 1 รายการ");
    }
    if (!norm(payload.incidentDate)) throw new Error("กรุณาเลือกวันที่เกิดเหตุ");
    if (!norm(payload.incidentLocation)) throw new Error("กรุณาเลือกสถานที่เกิดเหตุ");
    if (parseOtherLabels(payload.incidentLocation) && !norm(payload.incidentLocationOther)) {
      throw new Error("กรุณาระบุสถานที่เกิดเหตุอื่นๆ");
    }
    if (!norm(payload.whatHappen)) throw new Error("กรุณากรอกรายละเอียดเหตุการณ์");
    if (!norm(payload.reportedBy)) throw new Error("ไม่พบข้อมูลผู้รายงาน");
    if (!norm(payload.reportDate)) throw new Error("กรุณาเลือกวันที่รายงาน");
  }

  function collectPayload() {
    const auth = safeAuth();

    const payload = {
      refNo: getRefNo(),
      lps: norm(auth.name),

      reportedBy: norm($("rptReportedBy")?.value) || norm(auth.name),
      reporterPosition: norm($("rptReporterPosition")?.value),
      reportDate: norm($("rptReportDate")?.value),

      branch: norm($("rptBranch")?.value),
      branchOther: norm($("rptBranchOther")?.value),
      subject: norm($("rptSubject")?.value),

      reportTypes: collectCheckedOptions("rptReportTypes", "rptReportTypes"),
      urgencyTypes: collectCheckedOptions("rptUrgencyTypes", "rptUrgencyTypes"),
      notifyTo: collectCheckedOptions("rptNotifyTo", "rptNotifyTo"),

      incidentDate: norm($("rptIncidentDate")?.value),
      incidentTime: norm($("rptIncidentTime")?.value),
      incidentLocation: norm($("rptIncidentLocation")?.value),
      incidentLocationOther: norm($("rptIncidentLocationOther")?.value),
      incidentArea: norm($("rptIncidentArea")?.value),

      whatHappen: norm($("rptWhatHappen")?.value),
      offenderStatement: norm($("rptOffenderStatement")?.value),
      summaryText: norm($("rptSummaryText")?.value),

      persons: collectPersons(),
      damages: collectTextRows("rptDamageList", ".rptRowText1", ".rptRowText2"),
      actions: collectActionRows(),
      evidences: collectTextRows("rptEvidenceList", ".rptRowText1", ".rptRowText2"),
      causes: collectTextRows("rptCauseList", ".rptRowText1", ".rptRowText2"),
      preventions: collectTextRows("rptPreventionList", ".rptRowText1", ".rptRowText2"),
      investigationLearnings: collectTextRows("rptLearningList", ".rptRowText1", ".rptRowText2"),

      emailRecipients: Array.from(document.querySelectorAll(".rptEmailChk:checked"))
        .map((el) => norm(el.value))
        .filter(Boolean),
      emailOther: norm($("rptEmailOther")?.value)
    };

    validatePayload(payload);
    return payload;
  }

  function summaryHtml(payload, files) {
    const selectedEmails = getSelectedReport500Emails();
    const line = (arr, mapFn) => {
      const list = Array.isArray(arr) ? arr : [];
      if (!list.length) return `<div style="color:#64748b">-</div>`;
      return `<ul style="margin:0;padding-left:18px">${list.map((x) => `<li>${mapFn(x)}</li>`).join("")}</ul>`;
    };

    return `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">ตรวจสอบข้อมูลก่อนบันทึก</div>
          <div class="swalHeroSub">Report500</div>
        </div>

        <div style="margin-top:14px">
          <b>Ref No.:</b> ${escapeHtml(payload.refNo)}<br>
          <b>รายงานโดย:</b> ${escapeHtml(payload.reportedBy)}<br>
          <b>ตำแหน่ง:</b> ${escapeHtml(payload.reporterPosition || "-")}<br>
          <b>วันที่รายงาน:</b> ${escapeHtml(formatDateDisplay(payload.reportDate))}<br>
          <b>สาขา:</b> ${escapeHtml(payload.branch)} ${payload.branchOther ? `(${escapeHtml(payload.branchOther)})` : ""}<br>
          <b>เรื่อง:</b> ${escapeHtml(payload.subject)}
        </div>

        <hr style="margin:14px 0;border:none;border-top:1px solid #e5e7eb">

        <div><b>ประเภทรายงาน</b></div>
        ${line(payload.reportTypes, (x) => `${escapeHtml(x.value)}${x.textValue ? ` : ${escapeHtml(x.textValue)}` : ""}`)}

        <div style="margin-top:10px"><b>ระดับความเร่งด่วน</b></div>
        ${line(payload.urgencyTypes, (x) => `${escapeHtml(x.value)}${x.textValue ? ` : ${escapeHtml(x.textValue)}` : ""}`)}

        <div style="margin-top:10px"><b>ผู้รับทราบ</b></div>
        ${line(payload.notifyTo, (x) => `${escapeHtml(x.value)}${x.textValue ? ` : ${escapeHtml(x.textValue)}` : ""}`)}

        <div style="margin-top:10px">
          <b>วันเวลาเกิดเหตุ:</b>
          ${escapeHtml(formatDateDisplay(payload.incidentDate))} ${escapeHtml(payload.incidentTime || "-")}<br>
          <b>สถานที่:</b> ${escapeHtml(payload.incidentLocation)} ${payload.incidentLocationOther ? `(${escapeHtml(payload.incidentLocationOther)})` : ""}<br>
          <b>บริเวณ:</b> ${escapeHtml(payload.incidentArea || "-")}
        </div>

        <div style="margin-top:10px"><b>What happened</b></div>
        <div style="white-space:pre-wrap">${escapeHtml(payload.whatHappen || "-")}</div>

        <div style="margin-top:10px"><b>คำชี้แจงผู้เกี่ยวข้อง</b></div>
        <div style="white-space:pre-wrap">${escapeHtml(payload.offenderStatement || "-")}</div>

        <div style="margin-top:10px"><b>สรุปเหตุการณ์</b></div>
        <div style="white-space:pre-wrap">${escapeHtml(payload.summaryText || "-")}</div>

        <div style="margin-top:10px"><b>จำนวนผู้เกี่ยวข้อง</b>: ${payload.persons.length}</div>
        <div><b>จำนวนความเสียหาย</b>: ${payload.damages.length}</div>
        <div><b>จำนวนการแก้ไขเฉพาะหน้า</b>: ${payload.actions.length}</div>
        <div><b>จำนวนหลักฐาน/พยาน</b>: ${payload.evidences.length}</div>
        <div><b>จำนวนสาเหตุ</b>: ${payload.causes.length}</div>
        <div><b>จำนวนแนวทางป้องกัน</b>: ${payload.preventions.length}</div>
        <div><b>จำนวนข้อสรุป/สิ่งที่ได้</b>: ${payload.investigationLearnings.length}</div>
        <div><b>จำนวนรูปภาพ</b>: ${files.length}</div>
        <div><b>อีเมลปลายทางทั้งหมด</b>: ${selectedEmails.length}</div>
      </div>
    `;
  }

  async function preview() {
    try {
      const payload = collectPayload();
      const files = await collectImageFiles();

      await Swal.fire({
        title: "สรุปก่อนบันทึก",
        html: summaryHtml(payload, files),
        width: 860,
        confirmButtonText: "ปิด",
        customClass: {
          htmlContainer: "swalSummary"
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "ตรวจสอบข้อมูลไม่ผ่าน",
        text: err?.message || String(err)
      });
    }
  }

  async function submit() {
    const auth = safeAuth();
    if (!norm(auth.pass)) {
      Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เข้าสู่ระบบ",
        text: "กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล"
      });
      return;
    }

    try {
      const payload = collectPayload();
      const files = await collectImageFiles();

      const confirm = await Swal.fire({
        icon: "question",
        title: "ยืนยันการบันทึก Report500",
        html: summaryHtml(payload, files),
        width: 860,
        showCancelButton: true,
        confirmButtonText: "ยืนยันบันทึก",
        cancelButtonText: "ยกเลิก",
        customClass: {
          htmlContainer: "swalSummary"
        }
      });

      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: "กำลังบันทึกข้อมูล",
        html: "ระบบกำลังบันทึกข้อมูล สร้าง PDF และส่งอีเมล",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(apiUrl("/report500/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pass: auth.pass,
          payload: payload,
          files: files
        })
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

      const refNo = json.refNo || payload.refNo;
      const pdfUrl = refNo ? apiUrl(`/report500/pdf/${encodeURIComponent(refNo)}`) : "";

      let html = `
        <div style="text-align:left">
          <div><b>บันทึกข้อมูลสำเร็จ</b></div>
          <div>Ref No.: ${escapeHtml(refNo || "-")}</div>
          <div>ผู้บันทึก: ${escapeHtml(json.lpsName || payload.reportedBy || "-")}</div>
          <div>จำนวนรูปภาพ: ${escapeHtml(String(json.imageCount || 0))}</div>
          <div>PDF: ${json.pdfFileId ? "สำเร็จ" : "ไม่สำเร็จ"}</div>
          <div>Email: ${
            json.emailResult?.skipped
              ? "ไม่ได้ส่ง (ไม่มีผู้รับ)"
              : (json.emailResult?.ok ? "ส่งสำเร็จ" : `ไม่สำเร็จ${json.emailResult?.error ? " : " + escapeHtml(json.emailResult.error) : ""}`)
          }</div>
          ${json.partial ? `<div style="margin-top:8px;color:#b45309"><b>หมายเหตุ:</b> มีบางขั้นตอนสำเร็จไม่ครบ</div>` : ""}
          ${json.pdfError ? `<div style="margin-top:8px;color:#b91c1c"><b>PDF Error:</b> ${escapeHtml(json.pdfError)}</div>` : ""}
        </div>
      `;

      await Swal.fire({
        icon: json.partial ? "warning" : "success",
        title: json.partial ? "บันทึกข้อมูลสำเร็จบางส่วน" : "บันทึกข้อมูลสำเร็จ",
        html,
        showCancelButton: !!pdfUrl,
        confirmButtonText: "ปิด",
        cancelButtonText: "เปิด PDF",
        reverseButtons: true
      }).then((r) => {
        if (r.dismiss === Swal.DismissReason.cancel && pdfUrl) {
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
        }
      });

      if (!json.partial) {
        resetForm();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "บันทึกข้อมูลไม่สำเร็จ",
        text: err?.message || String(err)
      });
    }
  }

  function resetForm() {
    [
      "rptRefNo",
      "rptBranchOther",
      "rptSubject",
      "rptIncidentTime",
      "rptIncidentLocationOther",
      "rptIncidentArea",
      "rptWhatHappen",
      "rptOffenderStatement",
      "rptSummaryText",
      "rptReporterPosition",
      "rptEmailOther"
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    [
      "rptBranch",
      "rptIncidentLocation"
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    document.querySelectorAll(".rptEmailChk").forEach((el) => { el.checked = false; });
    document.querySelectorAll('#rptReportTypes input[type="checkbox"], #rptUrgencyTypes input[type="checkbox"], #rptNotifyTo input[type="checkbox"]').forEach((el) => {
      el.checked = false;
    });

    syncOptionOtherInputs("rptReportTypes", "rptReportTypes");
    syncOptionOtherInputs("rptUrgencyTypes", "rptUrgencyTypes");
    syncOptionOtherInputs("rptNotifyTo", "rptNotifyTo");

    if ($("rptPersonList")) $("rptPersonList").innerHTML = "";
    if ($("rptDamageList")) $("rptDamageList").innerHTML = "";
    if ($("rptActionList")) $("rptActionList").innerHTML = "";
    if ($("rptEvidenceList")) $("rptEvidenceList").innerHTML = "";
    if ($("rptCauseList")) $("rptCauseList").innerHTML = "";
    if ($("rptPreventionList")) $("rptPreventionList").innerHTML = "";
    if ($("rptLearningList")) $("rptLearningList").innerHTML = "";
    if ($("rptImageList")) $("rptImageList").innerHTML = "";

    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();

    fillDefaultsAfterLogin();
    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
    bindOtherSelect("rptIncidentLocation", "rptIncidentLocationOtherWrap", "rptIncidentLocationOther");

    appendRow("rptPersonList", createPersonRow());
    appendRow("rptImageList", createImageRow());
  }

  function bindRepeatButtons() {
    if (state.repeatBound) return;
    state.repeatBound = true;

    $("btnRptAddPerson")?.addEventListener("click", () => {
      appendRow("rptPersonList", createPersonRow());
    });

    document.querySelectorAll(".rptAddDetailBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;

        if (target === "damage") {
          appendRow("rptDamageList", createTextRow({}, {
            label1: "รายการความเสียหาย",
            label2: "รายละเอียด",
            ph1: "เช่น รถยกชนสินค้า",
            ph2: "รายละเอียดเพิ่มเติม"
          }));
        } else if (target === "action") {
          appendRow("rptActionList", createActionRow());
        } else if (target === "evidence") {
          appendRow("rptEvidenceList", createTextRow({}, {
            label1: "พยาน/หลักฐาน",
            label2: "รายละเอียด",
            ph1: "เช่น CCTV / พยานบุคคล",
            ph2: "รายละเอียดเพิ่มเติม"
          }));
        } else if (target === "cause") {
          appendRow("rptCauseList", createTextRow({}, {
            label1: "สาเหตุ",
            label2: "รายละเอียด",
            ph1: "เช่น ไม่ปฏิบัติตามขั้นตอน",
            ph2: "รายละเอียดเพิ่มเติม"
          }));
        } else if (target === "prevention") {
          appendRow("rptPreventionList", createTextRow({}, {
            label1: "แนวทางป้องกัน",
            label2: "รายละเอียด",
            ph1: "เช่น อบรมซ้ำ / ทบทวน SOP",
            ph2: "รายละเอียดเพิ่มเติม"
          }));
        } else if (target === "learning") {
          appendRow("rptLearningList", createTextRow({}, {
            label1: "สิ่งที่ได้จากการสอบสวน",
            label2: "รายละเอียด",
            ph1: "เช่น จุดอ่อนของกระบวนการ",
            ph2: "รายละเอียดเพิ่มเติม"
          }));
        }
      });
    });

    $("btnRptAddImage")?.addEventListener("click", () => {
      appendRow("rptImageList", createImageRow());
    });
  }

  function bindTopButtons() {
    if (state.topBound) return;
    state.topBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);

    $("btnRptEmailCheckAll")?.addEventListener("click", () => {
      setAllCheckboxBySelector(".rptEmailChk", true);
    });
    $("btnRptEmailClearAll")?.addEventListener("click", () => {
      setAllCheckboxBySelector(".rptEmailChk", false);
    });
  }

  function normalizeOptionsResponse(data) {
    if (!data || typeof data !== "object") return {};

    const d = data.data && typeof data.data === "object" ? data.data : data;
    const incidentList = Array.isArray(d.incidentLocationList)
      ? d.incidentLocationList
      : (Array.isArray(d.locationTypeList) ? d.locationTypeList : []);

    return {
      branchList: Array.isArray(d.branchList) ? d.branchList : [],
      reportTypeList: Array.isArray(d.reportTypeList) ? d.reportTypeList : [],
      urgencyList: Array.isArray(d.urgencyList) ? d.urgencyList : [],
      notifyToList: Array.isArray(d.notifyToList) ? d.notifyToList : [],
      incidentLocationList: incidentList,
      emailList: Array.isArray(d.emailList) ? d.emailList : []
    };
  }

  function applyOptionsToUi() {
    renderSelect("rptBranch", state.options.branchList, true);
    renderSelect("rptIncidentLocation", state.options.incidentLocationList, true);

    renderOptionMatrix("rptReportTypes", "rptReportTypes", state.options.reportTypeList, []);
    renderOptionMatrix("rptUrgencyTypes", "rptUrgencyTypes", state.options.urgencyList, []);
    renderOptionMatrix("rptNotifyTo", "rptNotifyTo", state.options.notifyToList, []);

    renderEmailSelector();

    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
    bindOtherSelect("rptIncidentLocation", "rptIncidentLocationOtherWrap", "rptIncidentLocationOther");

    fillDefaultsAfterLogin();
  }

  async function ensureReady() {
    if (state.ready) return true;
    if (state.loading) return false;

    state.loading = true;
    try {
      setRefYear();

      const res = await fetch(apiUrl("/report500/options"), {
        method: "GET"
      });
      const text = await res.text();

      let json = {};
      try {
        json = JSON.parse(text);
      } catch (_) {}

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `โหลดตัวเลือก Report500 ไม่สำเร็จ (HTTP ${res.status})`);
      }

      state.options = normalizeOptionsResponse(json);
      applyOptionsToUi();

      if (!$("rptPersonList")?.children.length) {
        appendRow("rptPersonList", createPersonRow());
      }
      if (!$("rptImageList")?.children.length) {
        appendRow("rptImageList", createImageRow());
      }

      bindRepeatButtons();
      bindTopButtons();

      state.ready = true;
      return true;
    } finally {
      state.loading = false;
    }
  }

  window.Report500UI = {
    ensureReady,
    preview,
    submit,
    reset: resetForm
  };
})();
