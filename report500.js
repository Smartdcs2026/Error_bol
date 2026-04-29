(function () {
  const $ = (id) => document.getElementById(id);

  function createEmptyDisciplineLookupState() {
    return {
      employeeCode: "",
      employeeName: "",
      normalizedEmployeeCode: "",
      matchCount: 0,
      records: [],
      attached: false,
      searched: false
    };
  }

  function createEmptyItemLookupState() {
    return {
      item: "",
      description: "",
      displayText: "",
      found: false,
      searched: false
    };
  }

  const state = {
    ready: false,
    loading: false,
    buttonsBound: false,
    lookupButtonsBound: false,
    options: null,
    disciplineLookup: createEmptyDisciplineLookupState(),
    itemLookup: createEmptyItemLookupState()
  };

  const RPT_EDITED_IMAGE_STORE = new WeakMap();

  const RPT_REPEAT_CONFIG = {
    rptPersonList: { label: "ผู้เกี่ยวข้อง", addBtnId: "btnRptAddPerson", emptyText: "ยังไม่มีผู้เกี่ยวข้อง" },
    rptDamageList: { label: "ความเสียหาย", addBtnId: "btnRptAddDamage", emptyText: "ยังไม่มีรายการความเสียหาย" },
    rptStepTakenList: { label: "การดำเนินการ", addBtnId: "btnRptAddStepTaken", emptyText: "ยังไม่มีรายการดำเนินการ" },
    rptEvidenceList: { label: "หลักฐาน", addBtnId: "btnRptAddEvidence", emptyText: "ยังไม่มีรายการหลักฐาน" },
    rptCauseList: { label: "สาเหตุ", addBtnId: "btnRptAddCause", emptyText: "ยังไม่มีรายการสาเหตุ" },
    rptPreventionList: { label: "การป้องกัน", addBtnId: "btnRptAddPrevention", emptyText: "ยังไม่มีรายการป้องกัน" },
    rptLearningList: { label: "ข้อสรุป/บทเรียน", addBtnId: "btnRptAddLearning", emptyText: "ยังไม่มีรายการข้อสรุป/บทเรียน" },
    rptImageList: { label: "รูปภาพ", addBtnId: "btnRptAddImage", emptyText: "ยังไม่มีรูปภาพ" }
  };

  function buildRptEditedImageMeta(file, isEdited = false) {
    if (!file) return "";
    const sizeKb = Math.round((file.size || 0) / 1024);
    return isEdited
      ? `ไฟล์แก้ไขแล้ว: ${file.name || "edited-image.jpg"} (${sizeKb} KB)`
      : `ไฟล์ที่เลือก: ${file.name || "image.jpg"} (${sizeKb} KB)`;
  }

  function updateRptImagePreview(row, file, metaText) {
    if (!row || !file) return;

    const meta = row.querySelector(".rptImageMeta");
    const img = row.querySelector(".rptImagePreview");
    const empty = row.querySelector(".rptImagePreviewEmpty");

    if (meta) {
      meta.textContent = metaText || buildRptEditedImageMeta(file, false);
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

    empty?.classList.add("hidden");
  }

  function clearRptEditedImageState(row) {
    const fileInput = row?.querySelector(".rptImageFile");
    const img = row?.querySelector(".rptImagePreview");
    const empty = row?.querySelector(".rptImagePreviewEmpty");
    const meta = row?.querySelector(".rptImageMeta");

    if (fileInput) {
      RPT_EDITED_IMAGE_STORE.delete(fileInput);
    }

    if (img?.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
    }

    if (img) {
      img.removeAttribute("src");
      delete img.dataset.objectUrl;
      img.classList.add("hidden");
    }

    empty?.classList.remove("hidden");
    if (meta) meta.textContent = "";
  }

  async function openRptImageEditor(row) {
    if (!window.ImageEditorX || typeof window.ImageEditorX.open !== "function") {
      await Swal.fire({
        icon: "error",
        title: "ยังไม่พร้อมใช้งาน",
        text: "ไม่พบ image-editor.js หรือยังไม่ได้โหลด modal ของ image editor"
      });
      return;
    }

    const fileInput = row?.querySelector(".rptImageFile");
    if (!fileInput) return;

    const edited = RPT_EDITED_IMAGE_STORE.get(fileInput)?.file || null;
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

    const result = await window.ImageEditorX.open(sourceFile, {
      strokeColor: "#dc2626",
      strokeWidth: 3
    });

    if (!result?.ok || !result.file) return;

    RPT_EDITED_IMAGE_STORE.set(fileInput, {
      edited: true,
      file: result.file,
      filename: result.filename || result.file.name,
      dataUrl: result.dataUrl || ""
    });

    updateRptImagePreview(
      row,
      result.file,
      buildRptEditedImageMeta(result.file, true)
    );

    refreshSingleCardUi(row);
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

  function apiUrl(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    const base = String(window.API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  function todayIsoLocal() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getAuth() {
    return window.AUTH || { name: "", pass: "" };
  }

function getReportRefHintEl_() {
  return document.getElementById("rptRefDuplicateHint");
}

function getReportRefWrapEl_() {
  return document.getElementById("rptRefDuplicateWrap");
}



async function checkReportRefDuplicate_(opts = {}) {
  const force = !!opts.force;
  const refNo = typeof getRptRefNoValue === "function"
    ? getRptRefNoValue()
    : "";

  if (!norm(refNo)) {
    resetReportRefDuplicateUi_();
    return {
      ok: true,
      duplicated: false,
      skipped: true,
      result: null
    };
  }

  const normalizedRef = String(refNo || "").trim();

  const url = `${apiUrl("/checkRefDuplicate")}?formType=${encodeURIComponent("report500")}&refNo=${encodeURIComponent(normalizedRef)}`;

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

  if (json.duplicated) {
    setReportRefDuplicateUi_(json.message || "เลขอ้างอิงซ้ำ", true);
  } else {
    resetReportRefDuplicateUi_();
  }

  return {
    ok: true,
    duplicated: !!json.duplicated,
    result: json
  };
}


function bindReportRefDuplicateCheck_() {
  const runningEl = $("rptRefNo");
  const yearEl = $("rptRefYear");
  if (!runningEl || !yearEl) return;

  let timer = null;

  const schedule = () => {
    if (timer) clearTimeout(timer);

    const refNo = typeof getRptRefNoValue === "function"
      ? getRptRefNoValue()
      : "";

    if (!norm(refNo)) {
      resetReportRefDuplicateUi_();
      return;
    }

    timer = setTimeout(async () => {
      try {
        await checkReportRefDuplicate_({ force: true });
      } catch (err) {
        console.error("checkReportRefDuplicate failed:", err);
      }
    }, 320);
  };

  runningEl.addEventListener("input", schedule);
  runningEl.addEventListener("change", schedule);
  yearEl.addEventListener("change", schedule);
}
  function getReportRefHintEl_() {
  return document.getElementById("rptRefDuplicateHint");
}

function setReportRefDuplicateUi_(message, invalid) {
  const hint = getReportRefHintEl_();
  const wrap = getReportRefWrapEl_();

  if (hint && wrap) {
    const raw = String(message || "").trim();

    if (!raw) {
      hint.innerHTML = "";
      wrap.classList.add("hidden");
    } else {
      const formatted = raw
        .replace(/^เลขอ้างอิงซ้ำ\s*/i, "")
        .replace(/Ref ที่กรอก:/g, "||Ref ที่กรอก:")
        .replace(/Ref มาตรฐาน:/g, "||Ref มาตรฐาน:")
        .replace(/ซ้ำกับเอกสาร Error_BOL เดิม:/g, "||ซ้ำกับเอกสาร Error_BOL เดิม:")
        .replace(/ซ้ำกับ Report เดิม:/g, "||ซ้ำกับ Report เดิม:")
        .split("||")
        .map(s => s.trim())
        .filter(Boolean);

      hint.innerHTML = formatted.map((line, idx) => {
        const cls = idx < 2 ? "refDupLine refDupMain" : "refDupLine refDupMeta";
        const block = idx === 2 ? " refDupBlock" : "";
        return `<span class="${cls}${block}">${escapeHtml(line)}</span>`;
      }).join("");

      wrap.classList.remove("hidden");
    }
  }

  $("rptRefNo")?.classList.toggle("is-invalid", !!invalid);
  $("rptRefYear")?.classList.toggle("is-invalid", !!invalid);
}

function resetReportRefDuplicateUi_() {
  const hint = getReportRefHintEl_();
  const wrap = getReportRefWrapEl_();

  if (hint) hint.innerHTML = "";
  if (wrap) wrap.classList.add("hidden");

  $("rptRefNo")?.classList.remove("is-invalid");
  $("rptRefYear")?.classList.remove("is-invalid");
}
async function checkReportRefDuplicate_(opts = {}) {
  const force = !!opts.force;
  const refNo = typeof getRptRefNoValue === "function"
    ? getRptRefNoValue()
    : "";

  if (!norm(refNo)) {
    resetReportRefDuplicateUi_();
    return {
      ok: true,
      duplicated: false,
      skipped: true,
      result: null
    };
  }

  const normalizedRef = String(refNo || "").trim();
  const url = `${apiUrl("/checkRefDuplicate")}?formType=${encodeURIComponent("report500")}&refNo=${encodeURIComponent(normalizedRef)}`;

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

  if (json.duplicated) {
    setReportRefDuplicateUi_(json.message || "เลขอ้างอิงซ้ำ", true);
  } else {
    resetReportRefDuplicateUi_();
  }

  return {
    ok: true,
    duplicated: !!json.duplicated,
    result: json
  };
}

async function showReportDuplicateAlert_(result) {
  const matched = result?.matched || {};
  const sourceSystem = String(matched?.sourceSystem || result?.system || "").trim().toUpperCase();

  const systemLabel = sourceSystem === "REPORT500" ? "Report500" : "Error_BOL";
  const titleText = sourceSystem === "REPORT500"
    ? "ไม่สามารถบันทึก Report ได้ เนื่องจาก Ref นี้ถูกใช้ในระบบ Report500 แล้ว"
    : "ไม่สามารถบันทึก Report ได้ เนื่องจาก Ref นี้ถูกใช้ในระบบ Error_BOL แล้ว";

  const commonTop = `
    <div class="swalKv"><div class="swalKvLabel">ระบบที่พบข้อมูลซ้ำ</div><div class="swalKvValue">${escapeHtml(systemLabel)}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref ที่กรอก</div><div class="swalKvValue">${escapeHtml(result?.inputRefNo || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref มาตรฐาน</div><div class="swalKvValue">${escapeHtml(result?.rootRefComparable || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Ref เดิม</div><div class="swalKvValue">${escapeHtml(matched.refNo || "-")}</div></div>
    <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(matched.revisionLabel || "-")}</div></div>
  `;

  const detailHtml = sourceSystem === "REPORT500"
    ? `
      <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(matched.subject || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">Reported by</div><div class="swalKvValue">${escapeHtml(matched.reportedBy || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.incidentDate || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">สถานที่</div><div class="swalKvValue">${escapeHtml(matched.whereDidItHappen || "-")}</div></div>
    `
    : `
      <div class="swalKv"><div class="swalKvLabel">พนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeName || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">รหัสพนักงาน</div><div class="swalKvValue">${escapeHtml(matched.employeeCode || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">สาเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorReason || "-")}</div></div>
      <div class="swalKv"><div class="swalKvLabel">วันที่เกิดเหตุ</div><div class="swalKvValue">${escapeHtml(matched.errorDate || "-")}</div></div>
    `;

  await Swal.fire({
    icon: "warning",
    title: "เลขอ้างอิงซ้ำ",
    html: `
      <div class="swalSummary" style="text-align:left">
        <div class="swalSection">
          <div class="swalSectionTitle">${escapeHtml(titleText)}</div>
          <div class="swalKvGrid">
            ${commonTop}
            ${detailHtml}
          </div>
        </div>
      </div>
    `,
    width: 920,
    confirmButtonText: "กลับไปแก้ไข Ref"
  });
}

function bindReportRefDuplicateCheck_() {
  const runningEl = $("rptRefNo");
  const yearEl = $("rptRefYear");
  if (!runningEl || !yearEl) return;

  let timer = null;

  const schedule = () => {
    if (timer) clearTimeout(timer);

    if (!norm(getRefNo())) {
      resetReportRefDuplicateUi_();
      return;
    }

    timer = setTimeout(async () => {
      try {
        await checkReportRefDuplicate_({ force: true });
      } catch (err) {
        console.error("checkReportRefDuplicate failed:", err);
      }
    }, 320);
  };

  runningEl.addEventListener("input", schedule);
  runningEl.addEventListener("change", schedule);
  yearEl.addEventListener("change", schedule);
}
  function getRefNo() {
    if (typeof window.getRptRefNoValue === "function") return window.getRptRefNoValue();
    const running = String($("rptRefNo")?.value || "").replace(/[^\d]/g, "").trim();
    const year = String($("rptRefYear")?.value || $("rptRefYear")?.textContent || "").trim();
    return running ? `${running}-${year}` : "";
  }

  function setRefYear() {
    const el = $("rptRefYear");
    if (!el) return;

    const currentYear = new Date().getFullYear() + 543;
    const years = [currentYear - 1, currentYear, currentYear + 1];

    if (String(el.tagName || "").toUpperCase() === "SELECT") {
      el.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
      el.value = String(currentYear);
    } else {
      el.textContent = String(currentYear);
    }
  }

  function isOther(v) {
    const s = norm(v).toLowerCase();
    return s === "อื่นๆ" || s === "other" || s === "others";
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    (Array.isArray(list) ? list : []).forEach((v) => {
      const s = String(v || "").trim();
      if (!s || !re.test(s)) return;
      const key = s.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(s);
    });

    return out;
  }

  function setReadonlyValue(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = value || "";
  }

  function renderSelect(id, list, withPlaceholder = true) {
    const el = $(id);
    if (!el) return;

    const items = Array.isArray(list) ? list : [];
    const html = [];
    if (withPlaceholder) html.push(`<option value="">-- เลือก --</option>`);
    items.forEach((item) => {
      html.push(`<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`);
    });
    el.innerHTML = html.join("");
  }

  function buildOptionsHtml(list, withPlaceholder = true) {
    const items = Array.isArray(list) ? list : [];
    const html = [];
    if (withPlaceholder) html.push(`<option value="">-- เลือก --</option>`);
    items.forEach((item) => {
      html.push(`<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`);
    });
    return html.join("");
  }

  function bindOtherSelect(selectId, wrapId, inputId) {
    const select = $(selectId);
    const wrap = $(wrapId);
    const input = $(inputId);
    if (!select || !wrap) return;

    const sync = () => {
      const show = isOther(select.value);
      wrap.classList.toggle("hidden", !show);
      if (!show && input) input.value = "";
    };

    select.addEventListener("change", sync);
    sync();
  }

  function renderOptionMatrix(rootId, name, list) {
    const root = $(rootId);
    if (!root) return;

    const items = Array.isArray(list) ? list : [];
    if (!items.length) {
      root.innerHTML = `<div class="emailEmpty">ไม่พบรายการตัวเลือก</div>`;
      return;
    }

    root.innerHTML = items.map((item) => `
      <label class="optionChoice">
        <div class="optionChoiceCard">
          <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(item)}">
          <span class="optionChoiceMark"></span>
          <span class="optionChoiceText">${escapeHtml(item)}</span>
        </div>
      </label>
    `).join("");
  }

  function renderWhereTypeSelections() {
    const root = $("rptWhereTypeSelections");
    if (!root) return;

    const list = Array.isArray(state.options?.whereTypeList) ? state.options.whereTypeList : [];
    if (!list.length) {
      root.innerHTML = `<div class="emailEmpty">ไม่พบรายการประเภทสถานที่</div>`;
      return;
    }

    root.innerHTML = list.map((item, idx) => {
      const value = norm(item && item.value);
      const needSuffix = !!(item && item.needSuffixInput);
      const rowId = `rptWhereType_${idx}_${value.replace(/[^\wก-๙]+/g, "_")}`;

      return `
        <div class="rptWhereTypeRow" data-value="${escapeHtml(value)}" data-need-suffix="${needSuffix ? "1" : "0"}">
          <label class="optionChoice" for="${escapeHtml(rowId)}">
            <div class="optionChoiceCard">
              <input
                id="${escapeHtml(rowId)}"
                type="checkbox"
                class="rptWhereTypeChk"
                value="${escapeHtml(value)}"
              >
              <span class="optionChoiceMark"></span>
              <span class="optionChoiceText">${escapeHtml(value)}</span>
            </div>
          </label>

          <div class="optionChoiceOther hidden">
            <input
              type="text"
              class="input rptWhereTypeSuffix"
              placeholder="กรอกข้อมูลต่อท้าย ${escapeHtml(value)}"
            >
          </div>
        </div>
      `;
    }).join("");

    root.querySelectorAll(".rptWhereTypeRow").forEach((row) => {
      const chk = row.querySelector(".rptWhereTypeChk");
      const wrap = row.querySelector(".optionChoiceOther");
      const input = row.querySelector(".rptWhereTypeSuffix");
      const needSuffix = row.getAttribute("data-need-suffix") === "1";

      const sync = () => {
        const show = !!chk?.checked && needSuffix;
        wrap?.classList.toggle("hidden", !show);
        if (!show && input) input.value = "";
      };

      chk?.addEventListener("change", sync);
      sync();
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
      <label class="emailItem" title="${escapeHtml(email)}">
        <input type="checkbox" class="rptEmailChk" value="${escapeHtml(email)}">
        <span class="emailCheckBox"></span>
        <span class="emailText">${escapeHtml(email)}</span>
      </label>
    `).join("");
  }

  function setAllChecks(selector, checked) {
    document.querySelectorAll(selector).forEach((el) => {
      el.checked = !!checked;
    });
  }

  function getRepeatConfig(listId) {
    return RPT_REPEAT_CONFIG[listId] || { label: "รายการ", addBtnId: "", emptyText: "ยังไม่มีข้อมูล" };
  }

  function cropText(text, max = 90) {
    const s = norm(text);
    if (!s) return "";
    return s.length > max ? `${s.slice(0, max).trim()}...` : s;
  }

  function setCardCollapsed(card, collapsed) {
    if (!card) return;
    card.classList.toggle("is-collapsed", !!collapsed);
  }

  function expandOnlyThisCard(card) {
    const root = card?.parentElement;
    if (!root) return;
    root.querySelectorAll(".rptRepeatCard").forEach((node) => {
      if (node === card) {
        setCardCollapsed(node, false);
      } else {
        setCardCollapsed(node, true);
      }
    });
  }

  function buildRepeatCardShell({ type, title, index, bodyHtml }) {
    return `
      <div class="rptRepeatCard is-empty" data-type="${escapeHtml(type)}">
        <div class="rptCardHead" role="button" tabindex="0" aria-expanded="true">
          <div class="rptCardHeadMain">
            <div class="rptCardTitleRow">
              <div class="rptCardTitle">${escapeHtml(title)} ${index}</div>
              <div class="rptRowIndex">${index}</div>
              <div class="rptCardStatus">ยังไม่กรอก</div>
            </div>
            <div class="rptCardSummary">แตะเพื่อกรอกข้อมูล</div>
          </div>

          <div class="rptCardHeadActions">
            <button type="button" class="rptToggleBtn" aria-label="ย่อ/ขยาย"></button>
          </div>
        </div>

        <div class="rptCardBody">
          ${bodyHtml}
        </div>
      </div>
    `;
  }
   function getCardSummary(card) {
    if (!card) return "แตะเพื่อกรอกข้อมูล";

    const type = card.getAttribute("data-type");

    if (type === "person") {
      const who = norm(card.querySelector(".rptPersonWho")?.value);
      const posSel = norm(card.querySelector(".rptPersonPosition")?.value);
      const posOther = norm(card.querySelector(".rptPersonPositionOther")?.value);
      const depSel = norm(card.querySelector(".rptPersonDepartment")?.value);
      const depOther = norm(card.querySelector(".rptPersonDepartmentOther")?.value);
      const remSel = norm(card.querySelector(".rptPersonRemark")?.value);
      const remOther = norm(card.querySelector(".rptPersonRemarkOther")?.value);

      const pos = isOther(posSel) ? (posOther || posSel) : posSel;
      const dep = isOther(depSel) ? (depOther || depSel) : depSel;
      const rem = isOther(remSel) ? (remOther || remSel) : remSel;

      const parts = [
        who ? `ชื่อ: ${who}` : "",
        pos ? `ตำแหน่ง: ${pos}` : "",
        dep ? `แผนก: ${dep}` : "",
        rem ? `หมายเหตุ: ${rem}` : ""
      ].filter(Boolean);

      return parts.length ? cropText(parts.join(" • "), 120) : "ยังไม่กรอกข้อมูลผู้เกี่ยวข้อง";
    }

    if (type === "stepTaken") {
      const act = norm(card.querySelector(".rptStepActionType")?.value);
      const actOther = norm(card.querySelector(".rptStepActionTypeOther")?.value);
      const detail = norm(card.querySelector(".rptStepDetail")?.value);
      const alcoholResult = norm(card.querySelector(".rptAlcoholResult")?.value);
      const alcoholMg = norm(card.querySelector(".rptAlcoholMgPercent")?.value);
      const drugConfirm = norm(card.querySelector(".rptDrugConfirmed")?.value);

      const actionText = isOther(act) ? (actOther || act) : act;
      const extra = [
        alcoholResult ? `ผล: ${alcoholResult}` : "",
        alcoholMg ? `Mg%: ${alcoholMg}` : "",
        drugConfirm ? `ยืนยัน: ${drugConfirm}` : ""
      ].filter(Boolean).join(" • ");

      const parts = [
        actionText ? `ประเภท: ${actionText}` : "",
        extra,
        detail ? `รายละเอียด: ${cropText(detail, 50)}` : ""
      ].filter(Boolean);

      return parts.length ? cropText(parts.join(" • "), 120) : "ยังไม่กรอกข้อมูลการดำเนินการ";
    }

    if (type === "image") {
      const fileInput = card.querySelector(".rptImageFile");
      const edited = fileInput ? RPT_EDITED_IMAGE_STORE.get(fileInput)?.file : null;
      const file = edited || (fileInput?.files && fileInput.files[0]) || null;
      const caption = norm(card.querySelector(".rptImageCaption")?.value);

      const parts = [
        file ? "มีรูปภาพแล้ว" : "",
        caption ? `คำบรรยาย: ${cropText(caption, 70)}` : ""
      ].filter(Boolean);

      return parts.length ? parts.join(" • ") : "ยังไม่ได้เลือกรูปภาพ";
    }

    const idxTitle = norm(card.querySelector(".rptIdxTitle")?.value);
    const idxDetail = norm(card.querySelector(".rptIdxDetail")?.value);
    if (idxTitle || idxDetail) {
      return cropText([idxTitle, idxDetail].filter(Boolean).join(" • "), 120);
    }

    return "แตะเพื่อกรอกข้อมูล";
  }

  function evaluateCardState(card) {
    if (!card) return { status: "empty", filled: 0, required: 1 };

    const type = card.getAttribute("data-type");
    let requiredSelectors = [];
    let allSelectors = [];

    if (type === "person") {
      requiredSelectors = [".rptPersonWho"];
      allSelectors = [
        ".rptPersonWho",
        ".rptPersonPosition",
        ".rptPersonPositionOther",
        ".rptPersonDepartment",
        ".rptPersonDepartmentOther",
        ".rptPersonRemark",
        ".rptPersonRemarkOther"
      ];
    } else if (type === "stepTaken") {
      requiredSelectors = [".rptStepActionType", ".rptStepDetail"];
      allSelectors = [
        ".rptStepActionType",
        ".rptStepActionTypeOther",
        ".rptAlcoholResult",
        ".rptAlcoholMgPercent",
        ".rptDrugConfirmed",
        ".rptDrugShortDetail",
        ".rptStepDetail"
      ];
    } else if (type === "image") {
      const fileInput = card.querySelector(".rptImageFile");
      const edited = fileInput ? RPT_EDITED_IMAGE_STORE.get(fileInput)?.file : null;
      const raw = fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null;
      const fileExists = !!(edited || raw);
      const caption = norm(card.querySelector(".rptImageCaption")?.value);

      if (!fileExists && !caption) return { status: "empty", filled: 0, required: 1 };
      if (fileExists) return { status: "complete", filled: 1, required: 1 };
      return { status: "partial", filled: caption ? 1 : 0, required: 1 };
    } else {
      requiredSelectors = [".rptIdxTitle", ".rptIdxDetail"];
      allSelectors = [".rptIdxTitle", ".rptIdxDetail"];
    }

    const requiredFilled = requiredSelectors.filter((selector) => {
      const el = card.querySelector(selector);
      return !!norm(el?.value);
    }).length;

    const anyFilled = allSelectors.some((selector) => {
      const el = card.querySelector(selector);
      return !!norm(el?.value);
    });

    if (!anyFilled) return { status: "empty", filled: 0, required: requiredSelectors.length || 1 };
    if (requiredFilled >= (requiredSelectors.length || 1)) {
      return { status: "complete", filled: requiredFilled, required: requiredSelectors.length || 1 };
    }
    return { status: "partial", filled: requiredFilled, required: requiredSelectors.length || 1 };
  }

  function refreshSingleCardUi(card) {
    if (!card) return;

    const stateInfo = evaluateCardState(card);
    card.classList.remove("is-empty", "is-partial", "is-complete");
    card.classList.add(
      stateInfo.status === "complete" ? "is-complete" :
      stateInfo.status === "partial" ? "is-partial" :
      "is-empty"
    );

    const summary = card.querySelector(".rptCardSummary");
    if (summary) summary.textContent = getCardSummary(card);

    const badge = card.querySelector(".rptCardStatus");
    if (badge) {
      badge.textContent =
        stateInfo.status === "complete" ? "กรอกแล้ว" :
        stateInfo.status === "partial" ? "กรอกบางส่วน" :
        "ยังไม่กรอก";
    }

    const head = card.querySelector(".rptCardHead");
    if (head) {
      head.setAttribute("aria-expanded", card.classList.contains("is-collapsed") ? "false" : "true");
    }
  }

  function attachCardAutoSummary(card) {
    if (!card) return;

    card.querySelectorAll("input, select, textarea").forEach((el) => {
      const evtName = (el.tagName === "SELECT" || el.type === "file") ? "change" : "input";
      el.addEventListener(evtName, () => refreshSingleCardUi(card));
      if (evtName !== "change") {
        el.addEventListener("change", () => refreshSingleCardUi(card));
      }
    });
  }

 function ensureRepeatFooterButton(listId) {
  const root = $(listId);
  if (!root || !root.parentElement) return;

  const cfg = getRepeatConfig(listId);
  const label = cfg.label || "รายการ";
  const addBtnId = cfg.addBtnId;
  if (!addBtnId) return;

  let footer = root.parentElement.querySelector(`.rptRepeatAddBottom[data-target="${listId}"]`);
  if (!footer) {
    footer = document.createElement("div");
    footer.className = "rptRepeatAddBottom hidden";
    footer.setAttribute("data-target", listId);
    footer.innerHTML = `
      <button type="button" class="btn ghost rptRepeatAddBottomBtn">
        + เพิ่ม${escapeHtml(label)}
      </button>
    `;
    root.insertAdjacentElement("afterend", footer);

    footer.querySelector("button")?.addEventListener("click", () => {
      $(addBtnId)?.click();
    });
  }
}

  function createSimpleIndexedRowHtml(type, index, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
    return buildRepeatCardShell({
      type,
      title: titleLabel,
      index,
      bodyHtml: `
        <div class="gridCompact">
          <div class="field">
            <label>${escapeHtml(titleLabel)}</label>
            <input type="text" class="rptIdxTitle" placeholder="${escapeHtml(titlePlaceholder || "")}">
          </div>
          <div class="field">
            <label>${escapeHtml(detailLabel)}</label>
            <textarea class="rptIdxDetail" rows="3" placeholder="${escapeHtml(detailPlaceholder || "")}"></textarea>
          </div>
        </div>

        <div class="rptCardFooterActions">
          <button type="button" class="btn ghost rptCollapseRow">ย่อการ์ด</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      `
    });
  }

  function createPersonRowHtml(index) {
    const positionOptions = buildOptionsHtml(state.options?.personPositionList, true);
    const departmentOptions = buildOptionsHtml(state.options?.personDepartmentList, true);
    const remarkOptions = buildOptionsHtml(state.options?.personRemarkList, true);

    return buildRepeatCardShell({
      type: "person",
      title: "ผู้เกี่ยวข้อง",
      index,
      bodyHtml: `
        <div class="gridCompact">
          <div class="field">
            <label>ผู้เกี่ยวข้อง (Who is involved)</label>
            <input type="text" class="rptPersonWho" placeholder="ชื่อผู้เกี่ยวข้อง">
          </div>

          <div class="field">
            <label>Position</label>
            <select class="rptPersonPosition">${positionOptions}</select>
          </div>

          <div class="field rptPersonPositionOtherWrap hidden">
            <label>Position อื่นๆ</label>
            <input type="text" class="rptPersonPositionOther" placeholder="ระบุตำแหน่งเพิ่มเติม">
          </div>

          <div class="field">
            <label>Department</label>
            <select class="rptPersonDepartment">${departmentOptions}</select>
          </div>

          <div class="field rptPersonDepartmentOtherWrap hidden">
            <label>Department อื่นๆ</label>
            <input type="text" class="rptPersonDepartmentOther" placeholder="ระบุส่วนงานเพิ่มเติม">
          </div>

          <div class="field">
            <label>Remark</label>
            <select class="rptPersonRemark">${remarkOptions}</select>
          </div>

          <div class="field rptPersonRemarkOtherWrap hidden">
            <label>Remark อื่นๆ</label>
            <input type="text" class="rptPersonRemarkOther" placeholder="ระบุหมายเหตุเพิ่มเติม">
          </div>
        </div>

        <div class="rptCardFooterActions">
          <button type="button" class="btn ghost rptCollapseRow">ย่อการ์ด</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      `
    });
  }

  function createStepTakenRowHtml(index) {
    const actionOptions = buildOptionsHtml(state.options?.actionTypeList, true);

    return buildRepeatCardShell({
      type: "stepTaken",
      title: "การดำเนินการ",
      index,
      bodyHtml: `
        <div class="gridCompact">
          <div class="field">
            <label>ประเภทการดำเนินการ</label>
            <select class="rptStepActionType">${actionOptions}</select>
          </div>

          <div class="field rptStepActionTypeOtherWrap hidden">
            <label>ระบุการดำเนินการอื่นๆ</label>
            <input type="text" class="rptStepActionTypeOther" placeholder="ระบุเอง">
          </div>

          <div class="field rptAlcoholResultWrap hidden">
            <label>ผลการตรวจแอลกอฮอล์</label>
            <select class="rptAlcoholResult">
              <option value="">-- เลือก --</option>
              <option value="พบ">พบ</option>
              <option value="ไม่พบ">ไม่พบ</option>
            </select>
          </div>

          <div class="field rptAlcoholMgWrap hidden">
            <label>ปริมาณแอลกอฮอล์ (Mg%)</label>
            <input type="number" class="rptAlcoholMgPercent" placeholder="กรอกเฉพาะตัวเลข" inputmode="decimal">
          </div>

          <div class="field rptDrugConfirmedWrap hidden">
            <label>ผลยืนยันการเสพ</label>
            <input type="text" class="rptDrugConfirmed" placeholder="เช่น ยืนยันผลบวก">
          </div>

          <div class="field rptDrugDetailWrap hidden">
            <label>รายละเอียดแบบย่อ</label>
            <textarea class="rptDrugShortDetail" rows="3" placeholder="รายละเอียดการตรวจสารเสพติด"></textarea>
          </div>

          <div class="field fieldSpan2">
            <label>รายละเอียดเพิ่มเติม</label>
            <textarea class="rptStepDetail" rows="3" placeholder="รายละเอียดเพิ่มเติมของการดำเนินการ"></textarea>
          </div>
        </div>

        <div class="rptCardFooterActions">
          <button type="button" class="btn ghost rptCollapseRow">ย่อการ์ด</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      `
    });
  }

  function createImageRowHtml(index) {
    return buildRepeatCardShell({
      type: "image",
      title: "รูปภาพ",
      index,
      bodyHtml: `
        <div class="gridCompact">
          <div class="field">
            <label>เลือกรูปภาพ</label>
            <input type="file" class="rptImageFile" accept="image/*">
            <div class="fieldHint rptImageMeta"></div>
          </div>

          <div class="field">
            <label>คำบรรยายภาพ</label>
            <textarea class="rptImageCaption" rows="4" placeholder="อธิบายภาพนี้"></textarea>
          </div>
        </div>

        <div class="field" style="margin-top:10px">
          <div class="rptImagePreviewEmpty" style="padding:12px 14px;border:1px dashed #bfd1e6;border-radius:14px;background:#f8fbff;color:#64748b;font-size:12px;font-weight:800">
            ยังไม่ได้เลือกรูปภาพ
          </div>
          <img class="rptImagePreview hidden" alt="preview" style="width:100%;max-height:260px;object-fit:contain;border-radius:14px;border:1px solid #d9e4f1;background:#fff;padding:6px">
        </div>

        <div class="rptCardFooterActions">
          <button type="button" class="btn ghost rptCollapseRow">ย่อการ์ด</button>
          <button type="button" class="btn ghost rptEditImageBtn">แก้ไขภาพ</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      `
    });
  }

  function appendRow(listId, html, emptyLabel) {
  const root = $(listId);
  if (!root) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = html.trim();
  const node = wrap.firstElementChild;
  root.appendChild(node);

  bindDynamicRow(node);
  refreshRowIndex(listId);
  toggleEmptyState(listId, emptyLabel);
  ensureRepeatFooterButton(listId);

  setTimeout(() => {
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 40);
}

  function bindSelectOtherInRow(node, selectSel, wrapSel, inputSel) {
    const select = node.querySelector(selectSel);
    const wrap = node.querySelector(wrapSel);
    const input = node.querySelector(inputSel);
    if (!select || !wrap) return;

    const sync = () => {
      const show = isOther(select.value);
      wrap.classList.toggle("hidden", !show);
      if (!show && input) input.value = "";
      refreshSingleCardUi(node);
    };

    select.addEventListener("change", sync);
    sync();
  }
   function bindStepTakenRow(node) {
    const typeEl = node.querySelector(".rptStepActionType");
    const otherWrap = node.querySelector(".rptStepActionTypeOtherWrap");
    const otherInput = node.querySelector(".rptStepActionTypeOther");

    const alcoholWrap = node.querySelector(".rptAlcoholResultWrap");
    const alcoholResult = node.querySelector(".rptAlcoholResult");
    const alcoholMgWrap = node.querySelector(".rptAlcoholMgWrap");
    const alcoholMgInput = node.querySelector(".rptAlcoholMgPercent");

    const drugConfirmedWrap = node.querySelector(".rptDrugConfirmedWrap");
    const drugDetailWrap = node.querySelector(".rptDrugDetailWrap");
    const drugConfirmedInput = node.querySelector(".rptDrugConfirmed");
    const drugDetailInput = node.querySelector(".rptDrugShortDetail");

    const syncAlcoholMg = () => {
      const isAlcohol = norm(typeEl?.value) === "ตรวจวัดปริมาณแอลกอฮอล์";
      const showMg = isAlcohol && norm(alcoholResult?.value) === "พบ";
      alcoholMgWrap?.classList.toggle("hidden", !showMg);
      if (!showMg && alcoholMgInput) alcoholMgInput.value = "";
      refreshSingleCardUi(node);
    };

    const syncType = () => {
      const type = norm(typeEl?.value);
      const isAlcohol = type === "ตรวจวัดปริมาณแอลกอฮอล์";
      const isDrug = type === "ตรวจสารเสพติดเมทแอเฟตามีน";
      const isOtherType = isOther(type);

      otherWrap?.classList.toggle("hidden", !isOtherType);
      if (!isOtherType && otherInput) otherInput.value = "";

      alcoholWrap?.classList.toggle("hidden", !isAlcohol);
      if (!isAlcohol && alcoholResult) alcoholResult.value = "";
      syncAlcoholMg();

      drugConfirmedWrap?.classList.toggle("hidden", !isDrug);
      drugDetailWrap?.classList.toggle("hidden", !isDrug);
      if (!isDrug && drugConfirmedInput) drugConfirmedInput.value = "";
      if (!isDrug && drugDetailInput) drugDetailInput.value = "";

      refreshSingleCardUi(node);
    };

    typeEl?.addEventListener("change", syncType);
    alcoholResult?.addEventListener("change", syncAlcoholMg);
    syncType();
  }

  function bindImageRow(node) {
    const fileInput = node.querySelector(".rptImageFile");
    const editBtn = node.querySelector(".rptEditImageBtn");

    if (!fileInput) return;

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!file) {
        clearRptEditedImageState(node);
        refreshSingleCardUi(node);
        return;
      }

      if (!/^image\//i.test(file.type || "")) {
        fileInput.value = "";
        clearRptEditedImageState(node);

        await Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      RPT_EDITED_IMAGE_STORE.delete(fileInput);
      updateRptImagePreview(node, file, buildRptEditedImageMeta(file, false));
      refreshSingleCardUi(node);
    });

    editBtn?.addEventListener("click", async () => {
      await openRptImageEditor(node);
      refreshSingleCardUi(node);
    });
  }

  function bindDynamicRow(node) {
    if (!node) return;

    const head = node.querySelector(".rptCardHead");
    const toggleBtn = node.querySelector(".rptToggleBtn");
    const collapseBtn = node.querySelector(".rptCollapseRow");

    const toggleCard = () => {
      const collapsed = node.classList.contains("is-collapsed");
      if (collapsed) {
        expandOnlyThisCard(node);
      } else {
        setCardCollapsed(node, true);
      }
      refreshSingleCardUi(node);
    };

    head?.addEventListener("click", (ev) => {
      if (ev.target.closest("button")) return;
      toggleCard();
    });

    head?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        toggleCard();
      }
    });

    toggleBtn?.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleCard();
    });

    collapseBtn?.addEventListener("click", () => {
      setCardCollapsed(node, true);
      refreshSingleCardUi(node);
    });

    node.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
  if (node.getAttribute("data-type") === "image") {
    clearRptEditedImageState(node);
  } else {
    const img = node.querySelector(".rptImagePreview");
    if (img && img.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
    }
  }

  const list = node.parentElement;
  const listId = list?.id || "";
  const cfg = getRepeatConfig(listId);

  node.remove();

  refreshRowIndex(listId);
  toggleEmptyState(listId, cfg.label);
});

    if (node.getAttribute("data-type") === "person") {
      bindSelectOtherInRow(node, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
      bindSelectOtherInRow(node, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
      bindSelectOtherInRow(node, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
    }

    if (node.getAttribute("data-type") === "stepTaken") {
      bindSelectOtherInRow(node, ".rptStepActionType", ".rptStepActionTypeOtherWrap", ".rptStepActionTypeOther");
      bindStepTakenRow(node);
    }

    if (node.getAttribute("data-type") === "image") {
      bindImageRow(node);
    }

    attachCardAutoSummary(node);
    refreshSingleCardUi(node);
  }

  function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;

    const cfg = getRepeatConfig(listId);
toggleEmptyState(listId, cfg.label);

    root.querySelectorAll(".rptRepeatCard").forEach((card, idx) => {
      const no = idx + 1;

      const title = card.querySelector(".rptCardTitle");
      if (title) title.textContent = `${cfg.label} ${no}`;

      const badge = card.querySelector(".rptRowIndex");
      if (badge) badge.textContent = String(no);
    });
  }

 function toggleEmptyState(listId, emptyLabel) {
  const root = $(listId);
  if (!root) return;

  const label = emptyLabel || getRepeatConfig(listId).label || "รายการ";
  const count = root.querySelectorAll(".rptRepeatCard").length;

  let emptyNode = root.querySelector(".rptRepeatEmpty");
  if (!count) {
    if (!emptyNode) {
      emptyNode = document.createElement("div");
      emptyNode.className = "rptRepeatEmpty";
      root.appendChild(emptyNode);
    }
    emptyNode.textContent = `ยังไม่มี${label} กดปุ่มเพิ่มเพื่อเริ่มกรอกข้อมูล`;
  } else if (emptyNode) {
    emptyNode.remove();
  }

  ensureRepeatFooterButton(listId);

  const footer = root.parentElement?.querySelector(`.rptRepeatAddBottom[data-target="${listId}"]`);
  if (footer) {
    footer.classList.toggle("hidden", count === 0);
  }
}
  function collectCheckedOptionObjects(rootId, inputName) {
    const root = $(rootId);
    if (!root) return [];

    return Array.from(root.querySelectorAll(`input[name="${inputName}"]`)).map((el) => ({
      value: norm(el.value),
      checked: !!el.checked,
      otherText: ""
    }));
  }

  function collectWhereTypes() {
    const root = $("rptWhereTypeSelections");
    if (!root) return [];

    return Array.from(root.querySelectorAll(".rptWhereTypeRow")).map((row) => {
      const chk = row.querySelector(".rptWhereTypeChk");
      const suffix = row.querySelector(".rptWhereTypeSuffix");

      return {
        value: norm(chk?.value),
        checked: !!chk?.checked,
        suffixText: !!chk?.checked ? norm(suffix?.value) : ""
      };
    }).filter((x) => x.value);
  }

  function collectPersons() {
    return Array.from(document.querySelectorAll("#rptPersonList .rptRepeatCard")).map((card, idx) => ({
      seq: idx + 1,
      who: norm(card.querySelector(".rptPersonWho")?.value),
      position: norm(card.querySelector(".rptPersonPosition")?.value),
      positionOther: norm(card.querySelector(".rptPersonPositionOther")?.value),
      department: norm(card.querySelector(".rptPersonDepartment")?.value),
      departmentOther: norm(card.querySelector(".rptPersonDepartmentOther")?.value),
      remark: norm(card.querySelector(".rptPersonRemark")?.value),
      remarkOther: norm(card.querySelector(".rptPersonRemarkOther")?.value)
    })).filter((x) =>
      x.who || x.position || x.positionOther || x.department || x.departmentOther || x.remark || x.remarkOther
    );
  }

  function collectIndexedRows(listId) {
    return Array.from(document.querySelectorAll(`#${listId} .rptRepeatCard`)).map((card, idx) => ({
      seq: idx + 1,
      title: norm(card.querySelector(".rptIdxTitle")?.value),
      detail: norm(card.querySelector(".rptIdxDetail")?.value)
    })).filter((x) => x.title || x.detail);
  }

  function collectStepTakens() {
    return Array.from(document.querySelectorAll("#rptStepTakenList .rptRepeatCard")).map((card, idx) => ({
      seq: idx + 1,
      actionType: norm(card.querySelector(".rptStepActionType")?.value),
      actionTypeOther: norm(card.querySelector(".rptStepActionTypeOther")?.value),
      alcoholResult: norm(card.querySelector(".rptAlcoholResult")?.value),
      alcoholMgPercent: norm(card.querySelector(".rptAlcoholMgPercent")?.value),
      drugConfirmed: norm(card.querySelector(".rptDrugConfirmed")?.value),
      drugShortDetail: norm(card.querySelector(".rptDrugShortDetail")?.value),
      detail: norm(card.querySelector(".rptStepDetail")?.value)
    })).filter((x) =>
      x.actionType || x.actionTypeOther || x.alcoholResult || x.alcoholMgPercent || x.drugConfirmed || x.drugShortDetail || x.detail
    );
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const out = String(fr.result || "");
        const i = out.indexOf(",");
        resolve(i >= 0 ? out.slice(i + 1) : out);
      };
      fr.onerror = () => reject(fr.error || new Error("ไม่สามารถอ่านไฟล์ได้"));
      fr.readAsDataURL(file);
    });
  }

  async function collectImages() {
    const rows = Array.from(document.querySelectorAll("#rptImageList .rptRepeatCard"));
    const out = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fileInput = row.querySelector(".rptImageFile");
      const edited = fileInput ? (RPT_EDITED_IMAGE_STORE.get(fileInput)?.file || null) : null;
      const raw = fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null;
      const file = edited || raw;
      const caption = norm(row.querySelector(".rptImageCaption")?.value);

      if (!file && !caption) continue;
      if (!file) throw new Error(`รูปภาพรายการที่ ${i + 1} ยังไม่ได้เลือกไฟล์`);
      if (!/^image\//i.test(file.type || "")) {
        throw new Error(`ไฟล์รูปภาพรายการที่ ${i + 1} ไม่ถูกต้อง`);
      }

      const base64 = await fileToBase64(file);
      out.push({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        base64,
        caption
      });
    }

    return out;
  }

  function collectEmailRecipients() {
    const checked = Array.from(document.querySelectorAll(".rptEmailChk:checked"))
      .map((el) => norm(el.value))
      .filter(Boolean);

    const extra = splitMultiEmails($("rptEmailOther")?.value || "");
    return uniqueEmails([].concat(checked).concat(extra));
  }

  function resetDisciplineLookupState() {
    state.disciplineLookup = createEmptyDisciplineLookupState();

    const summary = $("rptDisciplineSummary");
    const meta = $("rptDisciplineSummaryMeta");

    if (summary) summary.classList.add("hidden");
    if (meta) meta.textContent = "";
  }

  function resetItemLookupState() {
    state.itemLookup = createEmptyItemLookupState();
  }

  async function searchDisciplineByEmployeeCode(employeeCode) {
    const code = norm(employeeCode);
    if (!code) {
      throw new Error("กรุณาระบุรหัสพนักงาน");
    }

    const res = await fetch(
      apiUrl(`/disciplineLookup?employeeCode=${encodeURIComponent(code)}`),
      { method: "GET" }
    );

    const raw = await res.text();

    let json = null;
    try {
      json = JSON.parse(raw);
    } catch (_) {
      throw new Error(`ระบบค้นหาวินัยไม่ส่ง JSON กลับมา (HTTP ${res.status})`);
    }

    if (!res.ok || !json || !json.ok) {
      throw new Error(json?.error || `ค้นหาการดำเนินการทางวินัยไม่สำเร็จ (HTTP ${res.status})`);
    }

    return json;
  }

  async function searchItemLookup(item) {
    const clean = norm(item);
    if (!clean) {
      throw new Error("กรุณาระบุ Item");
    }

    const res = await fetch(apiUrl(`/itemLookup?item=${encodeURIComponent(clean)}`), {
      method: "GET"
    });

    let json = null;
    try {
      json = await res.json();
    } catch (_) {
      throw new Error("ระบบค้นหา Item ไม่ส่ง JSON กลับมา");
    }

    if (!res.ok || !json || !json.ok) {
      throw new Error(json?.error || "ค้นหารายการสินค้าไม่สำเร็จ");
    }

    state.itemLookup = {
      item: norm(json.item),
      description: norm(json.description),
      displayText: norm(json.displayText),
      found: !!json.found,
      searched: true
    };

    return json;
  }

  function renderDisciplineLookupTable(records, meta = {}) {
    const rows = Array.isArray(records) ? records : [];
    const count = Number(meta.count || rows.length || 0);
    const employeeCode = escapeHtml(meta.employeeCode || "");
    const employeeName = escapeHtml(meta.employeeName || "");

    if (!rows.length) {
      return `
        <div class="rptLookupEmpty">
          ไม่พบข้อมูลการดำเนินการทางวินัย
        </div>
      `;
    }

    const tableBody = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.violationDate || "")}</td>
        <td>${escapeHtml(row.subject || "")}</td>
        <td>${escapeHtml(row.docStatus || "")}</td>
        <td>${escapeHtml(row.result || "")}</td>
        <td>${escapeHtml(row.supervisor || "")}</td>
        <td>${escapeHtml(row.actionDate || "")}</td>
      </tr>
    `).join("");

    const cardBody = rows.map((row, idx) => `
      <div class="rptLookupRecordCard rptLookupRecordCardCompact">
        <div class="rptLookupRecordTop">
          <div class="rptLookupRecordIndex">รายการ ${idx + 1}</div>
          <div class="rptLookupRecordDate">${escapeHtml(row.violationDate || "-")}</div>
        </div>

        <div class="rptLookupRecordGrid rptLookupRecordGridCompact">
          <div class="rptLookupRecordItem rptLookupRecordItemWide">
            <div class="rptLookupRecordLabel">เรื่อง</div>
            <div class="rptLookupRecordValue">${escapeHtml(row.subject || "-")}</div>
          </div>

          <div class="rptLookupRecordItem">
            <div class="rptLookupRecordLabel">สถานะเอกสาร</div>
            <div class="rptLookupRecordValue">${escapeHtml(row.docStatus || "-")}</div>
          </div>

          <div class="rptLookupRecordItem">
            <div class="rptLookupRecordLabel">ผลการดำเนินการ</div>
            <div class="rptLookupRecordValue">${escapeHtml(row.result || "-")}</div>
          </div>

          <div class="rptLookupRecordItem">
            <div class="rptLookupRecordLabel">ผู้บังคับบัญชา</div>
            <div class="rptLookupRecordValue">${escapeHtml(row.supervisor || "-")}</div>
          </div>

          <div class="rptLookupRecordItem">
            <div class="rptLookupRecordLabel">วันที่ดำเนินการลงโทษ</div>
            <div class="rptLookupRecordValue">${escapeHtml(row.actionDate || "-")}</div>
          </div>
        </div>
      </div>
    `).join("");

    return `
      <div class="rptLookupMetaCompact">
        <div class="rptLookupMetaBar">
          <div class="rptLookupMetaPill">รหัส: ${employeeCode || "-"}</div>
          <div class="rptLookupMetaPill">ชื่อ: ${employeeName || "-"}</div>
          <div class="rptLookupMetaPill">พบ ${count} รายการ</div>
        </div>
      </div>

      <div class="rptLookupResultCard rptLookupResultCardDiscipline">
        <div class="rptLookupDesktopView">
          <div class="rptLookupTableWrap rptLookupTableWrapCompact">
            <table class="rptLookupTable rptLookupTableCompact rptLookupTableDiscipline">
              <thead>
                <tr>
                  <th style="width:100px">วันที่กระทำผิด</th>
                  <th style="min-width:320px">เรื่อง</th>
                  <th style="width:130px">สถานะเอกสาร</th>
                  <th style="width:150px">ผลการดำเนินการ</th>
                  <th style="width:130px">ผู้บังคับบัญชา</th>
                  <th style="width:130px">วันที่ดำเนินการลงโทษ</th>
                </tr>
              </thead>
              <tbody>${tableBody}</tbody>
            </table>
          </div>
        </div>

        <div class="rptLookupMobileView">
          <div class="rptLookupRecordList rptLookupRecordListCompact">
            ${cardBody}
          </div>
        </div>
      </div>
    `;
  }

  function renderItemLookupResult(result) {
    const item = escapeHtml(result?.item || "");
    const description = escapeHtml(result?.description || "");
    const displayText = escapeHtml(result?.displayText || "");
    const found = !!result?.found;

    if (!result || !result.item) {
      return `
        <div class="rptLookupState">
          <div class="rptLookupStateInner">
            <div class="rptLookupStateIcon">⌕</div>
            <div class="rptLookupStateTitle">ยังไม่มีผลการค้นหา</div>
            <div class="rptLookupStateText">กรอก Item แล้วกดค้นหา ระบบจะแสดงชื่อสินค้าและข้อความพร้อมใช้งานที่นี่</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="rptLookupMetaBar">
        <div class="rptLookupMetaPill">${found ? "พบข้อมูลสินค้า" : "ไม่พบในฐานข้อมูล"}</div>
        <div class="rptLookupMetaPill">Item: ${item || "-"}</div>
      </div>

      <div class="rptLookupResultCard">
        <div class="rptLookupResultGrid rptLookupResultGridCompact">
          <div class="rptLookupResultBox">
            <div class="rptLookupResultLabel">รหัสสินค้า</div>
            <div class="rptLookupResultValue">${item || "-"}</div>
          </div>

          <div class="rptLookupResultBox">
            <div class="rptLookupResultLabel">ชื่อสินค้า</div>
            <div class="rptLookupResultValue">${description || "-"}</div>
          </div>
        </div>

        <div class="rptLookupResultTextBlock">
          <div class="rptLookupResultTextTitle">ข้อความพร้อมใช้งาน</div>
          <div class="rptLookupResultTextValue">${displayText || "-"}</div>
        </div>

        <div class="rptLookupActionRow rptLookupActionRowCompact">
          <button type="button" id="swalRptItemCopyDesc" class="rptLookupBtn ghost">คัดลอกชื่อสินค้า</button>
          <button type="button" id="swalRptItemCopyFull" class="rptLookupBtn ghost">คัดลอกเต็ม</button>
          <button type="button" id="swalRptItemToSubject" class="rptLookupBtn primary">ใส่ในช่องเรื่อง</button>
          <button type="button" id="swalRptItemToWhat" class="rptLookupBtn primary">ใส่ในเหตุที่เกิด</button>
        </div>
      </div>
    `;
  }

  function attachDisciplineLookupResult(result) {
    const records = Array.isArray(result?.records) ? result.records : [];
    const employeeCode = norm(result?.employeeCode || result?.normalizedEmployeeCode || "");
    const employeeName = norm(result?.employeeName || (records[0]?.employeeName || ""));
    const normalizedEmployeeCode = norm(result?.normalizedEmployeeCode || "");
    const matchCount = Number(result?.count || records.length || 0);

    state.disciplineLookup = {
      employeeCode,
      employeeName,
      normalizedEmployeeCode,
      matchCount,
      records,
      attached: true,
      searched: true
    };

    updateDisciplineSummaryCard();
  }

  function updateDisciplineSummaryCard() {
    const box = $("rptDisciplineSummary");
    const meta = $("rptDisciplineSummaryMeta");
    if (!box || !meta) return;

    const d = state.disciplineLookup || createEmptyDisciplineLookupState();

    if (!d.attached || !d.records.length) {
      box.classList.add("hidden");
      meta.textContent = "";
      return;
    }

    meta.textContent = `รหัส ${d.employeeCode || "-"} • ${d.employeeName || "-"} • พบ ${d.matchCount || d.records.length} รายการ`;
    box.classList.remove("hidden");
  }

  function copyTextToClipboard(text, successMessage) {
    const value = String(text || "").trim();
    if (!value) {
      return Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูลให้คัดลอก",
        text: "กรุณาค้นหา Item ก่อน"
      });
    }

    const done = () => Swal.fire({
      icon: "success",
      title: "คัดลอกแล้ว",
      text: successMessage || "คัดลอกข้อมูลเรียบร้อย",
      timer: 1200,
      showConfirmButton: false
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
    }

    return fallbackCopy(value, done);
  }

  function fallbackCopy(text, onDone) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
    if (typeof onDone === "function") onDone();
  }

  function insertItemTextToField(fieldId, text, mode = "replace") {
    const el = $(fieldId);
    const value = String(text || "").trim();

    if (!el) {
      return Swal.fire({
        icon: "warning",
        title: "ไม่พบช่องข้อมูล",
        text: `ไม่พบฟิลด์ ${fieldId}`
      });
    }

    if (!value) {
      return Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูลให้ใส่",
        text: "กรุณาค้นหา Item ก่อน"
      });
    }

    if (mode === "append" && norm(el.value)) {
      el.value = `${norm(el.value)} ${value}`;
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    return Swal.fire({
      icon: "success",
      title: "ใส่ข้อมูลแล้ว",
      text: "นำข้อมูลสินค้าไปใส่ในรายงานเรียบร้อย",
      timer: 1200,
      showConfirmButton: false
    });
  }

  async function openDisciplineLookupPopup() {
    const initialCode = state.disciplineLookup?.employeeCode || "";

    await Swal.fire({
      customClass: { popup: "rptLookupPopup" },
      confirmButtonText: "ปิด",
      html: `
        <div class="rptLookupModal">
          <div class="rptLookupModalHead">
            <div class="rptLookupModalBadge">DISCIPLINE LOOKUP</div>
            <div class="rptLookupModalTitle">ค้นหาการดำเนินการทางวินัย</div>
            <div class="rptLookupModalSub">ค้นหาประวัติการดำเนินการทางวินัยจากรหัสพนักงาน และเลือกแนบข้อมูลอ้างอิงนี้เข้ากับรายงานได้ทันที</div>
          </div>

          <div class="rptLookupToolbar rptLookupToolbarCompact">
            <div class="field">
              <label for="swalRptDisciplineEmployeeCode">รหัสพนักงาน</label>
              <input id="swalRptDisciplineEmployeeCode" class="rptLookupInput" value="${escapeHtml(initialCode)}" placeholder="กรอกรหัสพนักงาน">
            </div>

            <div class="rptLookupToolbarActions rptLookupToolbarActionsCompact">
              <button type="button" id="swalRptDisciplineSearch" class="rptLookupBtn primary">ค้นหา</button>
              <button type="button" id="swalRptDisciplineUse" class="rptLookupBtn ghost" disabled>ใช้ข้อมูลนี้กับรายงาน</button>
            </div>
          </div>

          <div class="rptLookupBody">
            <div id="swalRptDisciplineResult" class="rptLookupResult">
              <div class="rptLookupState">
                <div class="rptLookupStateInner">
                  <div class="rptLookupStateIcon">⌕</div>
                  <div class="rptLookupStateTitle">พร้อมค้นหาข้อมูลวินัย</div>
                  <div class="rptLookupStateText">กรอกรหัสพนักงานแล้วกดค้นหา ระบบจะแสดงประวัติการดำเนินการทางวินัยในพื้นที่ด้านล่าง</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const input = document.getElementById("swalRptDisciplineEmployeeCode");
        const btnSearch = document.getElementById("swalRptDisciplineSearch");
        const btnUse = document.getElementById("swalRptDisciplineUse");
        const resultBox = document.getElementById("swalRptDisciplineResult");

        let latestResult = null;

        const runSearch = async () => {
          const employeeCode = norm(input?.value || "");
          resultBox.innerHTML = `
            <div class="rptLookupState">
              <div class="rptLookupStateInner">
                <div class="rptLookupStateIcon">…</div>
                <div class="rptLookupStateTitle">กำลังค้นหา</div>
                <div class="rptLookupStateText">ระบบกำลังค้นหาประวัติการดำเนินการทางวินัย โปรดรอสักครู่</div>
              </div>
            </div>
          `;
          btnUse.disabled = true;
          latestResult = null;

          try {
            const json = await searchDisciplineByEmployeeCode(employeeCode);
            latestResult = json;

            const count = Number(json.count || (json.records || []).length || 0);
            resultBox.innerHTML = renderDisciplineLookupTable(json.records || [], {
              count,
              employeeCode: json.employeeCode || json.normalizedEmployeeCode || "",
              employeeName: json.employeeName || ""
            });

            btnUse.disabled = !(json.records && json.records.length);
          } catch (err) {
            resultBox.innerHTML = `<div class="rptLookupEmpty">${escapeHtml(err.message || String(err))}</div>`;
          }
        };

        btnSearch?.addEventListener("click", runSearch);
        input?.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            runSearch();
          }
        });

        btnUse?.addEventListener("click", () => {
          if (!latestResult || !latestResult.records || !latestResult.records.length) return;
          attachDisciplineLookupResult(latestResult);
          Swal.close();
        });
      }
    });
  }

  async function openItemLookupPopup() {
    const initialItem = state.itemLookup?.item || "";

    await Swal.fire({
      customClass: { popup: "rptLookupPopup" },
      confirmButtonText: "ปิด",
      html: `
        <div class="rptLookupModal">
          <div class="rptLookupModalHead">
            <div class="rptLookupModalBadge">ITEM LOOKUP</div>
            <div class="rptLookupModalTitle">ค้นหารายการสินค้า</div>
            <div class="rptLookupModalSub">ค้นหา Item เพื่อคัดลอกชื่อสินค้า หรือแทรกข้อความลงในหัวข้อเรื่องและรายละเอียดเหตุการณ์ได้ทันที</div>
          </div>

          <div class="rptLookupToolbar rptLookupToolbarCompact">
            <div class="field">
              <label for="swalRptItemCode">Item</label>
              <input id="swalRptItemCode" class="rptLookupInput" value="${escapeHtml(initialItem)}" placeholder="กรอก Item เช่น 170643654">
            </div>

            <div class="rptLookupToolbarActions rptLookupToolbarActionsCompact">
              <button type="button" id="swalRptItemSearch" class="rptLookupBtn primary">ค้นหา</button>
            </div>
          </div>

          <div class="rptLookupBody">
            <div id="swalRptItemResult" class="rptLookupResult">
              <div class="rptLookupState">
                <div class="rptLookupStateInner">
                  <div class="rptLookupStateIcon">⌕</div>
                  <div class="rptLookupStateTitle">พร้อมค้นหา Item</div>
                  <div class="rptLookupStateText">กรอกหมายเลขสินค้าแล้วกดค้นหา ระบบจะแสดงชื่อสินค้าและข้อความพร้อมใช้งานในพื้นที่ด้านล่าง</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const input = document.getElementById("swalRptItemCode");
        const btnSearch = document.getElementById("swalRptItemSearch");
        const resultBox = document.getElementById("swalRptItemResult");

        const bindResultActions = (result) => {
          document.getElementById("swalRptItemCopyDesc")?.addEventListener("click", () => {
            copyTextToClipboard(result.description || "", "คัดลอกชื่อสินค้าเรียบร้อย");
          });

          document.getElementById("swalRptItemCopyFull")?.addEventListener("click", () => {
            copyTextToClipboard(result.displayText || "", "คัดลอก Item และชื่อสินค้าเรียบร้อย");
          });

          document.getElementById("swalRptItemToSubject")?.addEventListener("click", () => {
            insertItemTextToField("rptSubject", result.displayText || result.description || "", "replace");
          });

          document.getElementById("swalRptItemToWhat")?.addEventListener("click", () => {
            insertItemTextToField("rptWhatHappen", result.displayText || result.description || "", "append");
          });
        };

        const runSearch = async () => {
          const item = norm(input?.value || "");
          resultBox.innerHTML = `
            <div class="rptLookupState">
              <div class="rptLookupStateInner">
                <div class="rptLookupStateIcon">…</div>
                <div class="rptLookupStateTitle">กำลังค้นหา</div>
                <div class="rptLookupStateText">ระบบกำลังค้นหารายการสินค้า โปรดรอสักครู่</div>
              </div>
            </div>
          `;

          try {
            const json = await searchItemLookup(item);
            resultBox.innerHTML = renderItemLookupResult(json);
            bindResultActions(json);
          } catch (err) {
            resultBox.innerHTML = `<div class="rptLookupEmpty">${escapeHtml(err.message || String(err))}</div>`;
          }
        };

        btnSearch?.addEventListener("click", runSearch);
        input?.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            runSearch();
          }
        });

        if (state.itemLookup?.searched) {
          const existing = {
            item: state.itemLookup.item,
            description: state.itemLookup.description,
            displayText: state.itemLookup.displayText,
            found: state.itemLookup.found
          };
          resultBox.innerHTML = renderItemLookupResult(existing);
          bindResultActions(existing);
        }
      }
    });
  }

  async function openAttachedDisciplinePreview() {
    const d = state.disciplineLookup || createEmptyDisciplineLookupState();
    if (!d.attached || !d.records.length) {
      await Swal.fire({
        icon: "info",
        title: "ยังไม่มีข้อมูล",
        text: "ยังไม่ได้แนบข้อมูลวินัยกับรายงานนี้"
      });
      return;
    }

    await Swal.fire({
      title: "ข้อมูลวินัยที่แนบกับรายงาน",
      width: 1280,
      confirmButtonText: "ปิด",
      customClass: {
        popup: "rptLookupPopup rptLookupPreviewPopup",
        title: "rptLookupPreviewTitle",
        htmlContainer: "rptLookupPreviewHtml"
      },
      html: `
        <div class="rptLookupPreviewWrap">
          ${renderDisciplineLookupTable(d.records, {
            count: d.matchCount,
            employeeCode: d.employeeCode,
            employeeName: d.employeeName
          })}
        </div>
      `
    });
  }

  function clearDisciplineLookup() {
    resetDisciplineLookupState();
  }

  function bindLookupButtons() {
    if (state.lookupButtonsBound) return;
    state.lookupButtonsBound = true;

    $("btnRptDisciplineLookup")?.addEventListener("click", openDisciplineLookupPopup);
    $("btnRptDisciplineView")?.addEventListener("click", openAttachedDisciplinePreview);
    $("btnRptDisciplineClear")?.addEventListener("click", clearDisciplineLookup);
    $("btnRptItemLookup")?.addEventListener("click", openItemLookupPopup);
  }

  function appendDisciplinePayloadToReport500Payload(payload) {
    const d = state.disciplineLookup || createEmptyDisciplineLookupState();

    payload.disciplineEmployeeCode = d.attached ? (d.employeeCode || "") : "";
    payload.disciplineEmployeeName = d.attached ? (d.employeeName || "") : "";
    payload.disciplineMatchCount = d.attached ? Number(d.matchCount || d.records.length || 0) : 0;
    payload.disciplineReferenceJson = d.attached ? JSON.stringify(d.records || []) : "";

    return payload;
  }

  function collectPayload() {
    const auth = getAuth();

    const payload = {
      refNo: getRefNo(),
      lps: norm(auth.name),

      reportedBy: norm($("rptReportedBy")?.value) || norm(auth.name),
      reporterPosition: norm($("rptReporterPosition")?.value),
      reporterPositionOther: norm($("rptReporterPositionOther")?.value),
      reportDate: norm($("rptReportDate")?.value),

      branch: norm($("rptBranch")?.value),
      branchOther: norm($("rptBranchOther")?.value),
      subject: norm($("rptSubject")?.value),

      reportTypes: collectCheckedOptionObjects("rptReportTypes", "rptReportTypes"),
      urgencyTypes: collectCheckedOptionObjects("rptUrgencyTypes", "rptUrgencyTypes"),
      notifyTo: collectCheckedOptionObjects("rptNotifyTo", "rptNotifyTo"),

      incidentDate: norm($("rptIncidentDate")?.value),
      incidentTime: norm($("rptIncidentTime")?.value),
      whatHappen: norm($("rptWhatHappen")?.value),

      whereDidItHappen: norm($("rptWhereDidItHappen")?.value),
      whereTypeSelections: collectWhereTypes(),
      area: norm($("rptArea")?.value),

      involvedPersons: collectPersons(),

      damages: collectIndexedRows("rptDamageList"),
      stepTakens: collectStepTakens(),
      offenderStatement: norm($("rptOffenderStatement")?.value),
      evidences: collectIndexedRows("rptEvidenceList"),
      summaryText: norm($("rptSummaryText")?.value),
      causes: collectIndexedRows("rptCauseList"),
      preventions: collectIndexedRows("rptPreventionList"),
      learnings: collectIndexedRows("rptLearningList"),

      emailRecipients: Array.from(document.querySelectorAll(".rptEmailChk:checked"))
        .map((el) => norm(el.value))
        .filter(Boolean),
      emailOther: norm($("rptEmailOther")?.value)
    };

    appendDisciplinePayloadToReport500Payload(payload);
    validatePayload(payload);
    return payload;
  }

  function validatePayload(p) {
    if (!norm(p.refNo)) throw new Error("กรุณากรอก Ref No.");
    if (!norm(p.branch)) throw new Error("กรุณาเลือกสาขา");
    if (isOther(p.branch) && !norm(p.branchOther)) throw new Error("กรุณาระบุสาขาอื่นๆ");
    if (!norm(p.subject)) throw new Error("กรุณากรอกเรื่อง");

    if (!(p.reportTypes || []).some((x) => x.checked)) throw new Error("กรุณาเลือกประเภทรายงานอย่างน้อย 1 รายการ");
    if (!(p.urgencyTypes || []).some((x) => x.checked)) throw new Error("กรุณาเลือกระดับความเร่งด่วนอย่างน้อย 1 รายการ");
    if (!(p.notifyTo || []).some((x) => x.checked)) throw new Error("กรุณาเลือกผู้รับทราบอย่างน้อย 1 รายการ");

    if (!norm(p.incidentDate)) throw new Error("กรุณาเลือกวันที่เกิดเหตุ");
    if (!norm(p.whereDidItHappen)) throw new Error("กรุณาเลือกสถานที่เกิดเหตุ");
    if (!norm(p.whatHappen)) throw new Error("กรุณากรอกรายละเอียดเหตุการณ์");
    if (!norm(p.reportedBy)) throw new Error("ไม่พบชื่อผู้รายงาน");
    if (!norm(p.reportDate)) throw new Error("กรุณาเลือกวันที่รายงาน");

    (p.whereTypeSelections || []).forEach((x) => {
      const isStore = /store$/i.test(norm(x.value));
      if (x.checked && isStore && !norm(x.suffixText)) {
        throw new Error(`กรุณากรอกข้อมูลต่อท้าย ${x.value}`);
      }
    });

    (p.involvedPersons || []).forEach((x, idx) => {
      if (isOther(x.position) && !norm(x.positionOther)) {
        throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Position อื่นๆ`);
      }
      if (isOther(x.department) && !norm(x.departmentOther)) {
        throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Department อื่นๆ`);
      }
      if (isOther(x.remark) && !norm(x.remarkOther)) {
        throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Remark อื่นๆ`);
      }
    });

    (p.stepTakens || []).forEach((x, idx) => {
      if (x.actionType === "ตรวจวัดปริมาณแอลกอฮอล์") {
        if (!norm(x.alcoholResult)) {
          throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณาเลือกผลการตรวจแอลกอฮอล์`);
        }
        if (norm(x.alcoholResult) === "พบ" && !norm(x.alcoholMgPercent)) {
          throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณากรอกค่า Mg%`);
        }
      }
      if (x.actionType === "ตรวจสารเสพติดเมทแอเฟตามีน") {
        if (!norm(x.drugConfirmed)) {
          throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณากรอกผลยืนยันการเสพ`);
        }
      }
      if (isOther(x.actionType) && !norm(x.actionTypeOther)) {
        throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณาระบุการดำเนินการอื่นๆ`);
      }
    });

    if (isOther(p.reporterPosition) && !norm(p.reporterPositionOther)) {
      throw new Error("กรุณาระบุตำแหน่งผู้รายงานอื่นๆ");
    }
  }

  function payloadSummaryHtml(payload, images) {
    const selectedEmails = collectEmailRecipients();

    return `
      <div class="swalSummary">
        <div class="swalHero">
          <div class="swalHeroTitle">ตรวจสอบข้อมูลก่อนบันทึก</div>
          <div class="swalHeroSub">Report</div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลหลัก</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">Ref No.</div><div class="swalKvValue">${escapeHtml(payload.refNo)}</div></div>
            <div class="swalKv"><div class="swalKvLabel">สาขา</div><div class="swalKvValue">${escapeHtml(payload.branch)}${payload.branchOther ? " (" + escapeHtml(payload.branchOther) + ")" : ""}</div></div>
            <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">Reported by</div><div class="swalKvValue">${escapeHtml(payload.reportedBy || "-")}</div></div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">เหตุการณ์</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">วันที่</div><div class="swalKvValue">${escapeHtml(payload.incidentDate || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">เวลา</div><div class="swalKvValue">${escapeHtml(payload.incidentTime || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">สถานที่หลัก</div><div class="swalKvValue">${escapeHtml(payload.whereDidItHappen || "-")}</div></div>
            <div class="swalKv"><div class="swalKvLabel">Area</div><div class="swalKvValue">${escapeHtml(payload.area || "-")}</div></div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">สรุปจำนวนรายการ</div>
          <div class="swalKvGrid">
            <div class="swalKv"><div class="swalKvLabel">ผู้เกี่ยวข้อง</div><div class="swalKvValue">${payload.involvedPersons.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">ความเสียหาย</div><div class="swalKvValue">${payload.damages.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">การดำเนินการ</div><div class="swalKvValue">${payload.stepTakens.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">หลักฐาน</div><div class="swalKvValue">${payload.evidences.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">สาเหตุ</div><div class="swalKvValue">${payload.causes.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">การป้องกัน</div><div class="swalKvValue">${payload.preventions.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">ข้อสรุป/บทเรียน</div><div class="swalKvValue">${payload.learnings.length}</div></div>
            <div class="swalKv"><div class="swalKvLabel">รูปภาพ</div><div class="swalKvValue">${images.length}</div></div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">อีเมลปลายทาง</div>
          <div class="swalKvValue">${selectedEmails.length} รายการ</div>
        </div>
      </div>
    `;
  }

  async function preview() {
    try {
      const payload = collectPayload();
      const images = await collectImages();

      await Swal.fire({
        title: "สรุปก่อนบันทึก",
        html: payloadSummaryHtml(payload, images),
        width: 920,
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

  function resetList(listId, label) {
    const root = $(listId);
    if (!root) return;
    root.innerHTML = "";
    toggleEmptyState(listId, label);
  }

  function resetForm() {
    resetDisciplineLookupState();
    resetItemLookupState();

    setReadonlyValue("rptReportedBy", norm(getAuth().name));
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();
    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptIncidentTime")) $("rptIncidentTime").value = "";
    if ($("rptSubject")) $("rptSubject").value = "";
    if ($("rptWhatHappen")) $("rptWhatHappen").value = "";
    if ($("rptArea")) $("rptArea").value = "";
    if ($("rptOffenderStatement")) $("rptOffenderStatement").value = "";
    if ($("rptSummaryText")) $("rptSummaryText").value = "";
    if ($("rptEmailOther")) $("rptEmailOther").value = "";

    if ($("rptBranch")) $("rptBranch").value = "";
    if ($("rptBranchOther")) $("rptBranchOther").value = "";
    if ($("rptReporterPosition")) $("rptReporterPosition").value = "";
    if ($("rptReporterPositionOther")) $("rptReporterPositionOther").value = "";

    document.querySelectorAll("#rptReportTypes input[type='checkbox'], #rptUrgencyTypes input[type='checkbox'], #rptNotifyTo input[type='checkbox'], .rptEmailChk").forEach((el) => {
      el.checked = false;
    });

    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeChk").forEach((el) => {
      el.checked = false;
    });
    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeSuffix").forEach((el) => {
      el.value = "";
    });
    document.querySelectorAll("#rptWhereTypeSelections .optionChoiceOther").forEach((el) => {
      el.classList.add("hidden");
    });

    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
    bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

    Object.keys(RPT_REPEAT_CONFIG).forEach((listId) => {
      resetList(listId, getRepeatConfig(listId).label);
      ensureRepeatFooterButton(listId);
    });
  }

 async function submit() {
  const auth = getAuth();
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

    const dup = await checkReportRefDuplicate_({ force: true });
    if (dup.duplicated) {
      await showReportDuplicateAlert_(dup.result);
      $("rptRefNo")?.focus();
      return;
    }

    const images = await collectImages();

    const ok = await Swal.fire({
      icon: "question",
      title: "ยืนยันการบันทึก Report",
      html: payloadSummaryHtml(payload, images),
      width: 920,
      showCancelButton: true,
      confirmButtonText: "ยืนยันบันทึก",
      cancelButtonText: "ยกเลิก"
    });

    if (!ok.isConfirmed) return;

    const Progress = window.ProgressUI;
    Progress?.show(
      "กำลังบันทึก Report",
      "ระบบกำลังตรวจสอบข้อมูล อัปโหลดรูป สร้าง PDF และส่งอีเมล"
    );

    Progress?.activateOnly("validate", 8, "กำลังตรวจสอบเลขอ้างอิงและข้อมูลรายงาน");

    const dupBeforeSend = await checkReportRefDuplicate_({ force: true });
    if (dupBeforeSend.duplicated) {
      Progress?.markError("validate", "เลขอ้างอิงซ้ำ", 8);
      Progress?.hide(150);
      await showReportDuplicateAlert_(dupBeforeSend.result);
      $("rptRefNo")?.focus();
      return;
    }

    await (window.sleepMs ? window.sleepMs(160) : new Promise((r) => setTimeout(r, 160)));
    Progress?.markDone("validate", 14, "ตรวจสอบข้อมูลเรียบร้อย");

    Progress?.activateOnly("upload", 18, "กำลังเตรียมรูปภาพสำหรับรายงาน");
    const uploadProg = typeof window.estimateUploadProgressByFiles === "function"
      ? window.estimateUploadProgressByFiles(Math.max(images.length, 1), 18, 42)
      : {
          next: (currentIndex) => {
            const count = Math.max(1, images.length || 1);
            const ratio = Math.max(0, Math.min(1, currentIndex / count));
            return Math.round(18 + ((42 - 18) * ratio));
          }
        };

    images.forEach((_, idx) => {
      Progress?.setProgress(uploadProg.next(idx + 1), `เตรียมรูปภาพ ${idx + 1}/${images.length || 1}`);
    });

    await (window.sleepMs ? window.sleepMs(120) : new Promise((r) => setTimeout(r, 120)));
    Progress?.markDone("upload", 44, `เตรียมรูปภาพเรียบร้อย (${images.length} รูป)`);

    Progress?.activateOnly("save", 56, "กำลังบันทึกข้อมูล Report");

    const res = await fetch(apiUrl("/report500/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass: auth.pass,
        payload,
        files: images
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

    Progress?.markDone("save", 72, "บันทึกข้อมูลลงระบบเรียบร้อย");

    Progress?.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF");
    await (window.sleepMs ? window.sleepMs(180) : new Promise((r) => setTimeout(r, 180)));

    if (json.pdfFileId || json.pdfUrl) {
      const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
      Progress?.markDone("pdf", 93, `สร้างไฟล์ PDF เรียบร้อย${sizeText}`);
    } else {
      Progress?.markDone("pdf", 93, "สร้างไฟล์ PDF เรียบร้อย");
    }

    Progress?.activateOnly("email", 97, "กำลังตรวจสอบผลการส่งอีเมล");
    await (window.sleepMs ? window.sleepMs(160) : new Promise((r) => setTimeout(r, 160)));

    const emailResult = json.emailResult || {};
    const emailOk = !!emailResult.ok;
    const emailSkipped = !!emailResult.skipped;
    const attachmentMode = String(emailResult.attachmentMode || "").trim();
    const emailErr = String(emailResult.error || "").trim();

    let emailText = "ส่งอีเมลเรียบร้อย";
    if (attachmentMode === "LINK_ONLY") emailText = "ส่งอีเมลพร้อมลิงก์ PDF";
    if (attachmentMode === "ATTACHED") emailText = "ส่งอีเมลพร้อมไฟล์ PDF";

    if (emailOk) {
      Progress?.markDone("email", 100, emailText, emailText);
      Progress?.success("บันทึกสำเร็จ", "รายงานถูกบันทึกเรียบร้อยแล้ว");
    } else if (emailSkipped) {
      Progress?.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
      Progress?.success("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
    } else {
      Progress?.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
      Progress?.success("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
      Progress?.setHint(emailErr || "กรุณาตรวจสอบสิทธิ์เมลหรือขนาดไฟล์ PDF");
    }

    Progress?.hide(120);

    const pdfOpenUrl = json.pdfUrl
      ? String(json.pdfUrl)
      : (json.refNo ? apiUrl(`/report500/pdf/${encodeURIComponent(json.refNo)}`) : "");

    await Swal.fire({
      icon: (emailOk || emailSkipped) ? "success" : "warning",
      title: (emailOk || emailSkipped) ? "บันทึก Report สำเร็จ" : "บันทึก Report สำเร็จบางส่วน",
      showConfirmButton: false,
      width: 820,
      html: `
        <div class="swalSummary">
          <div class="swalHero">
            <div class="swalHeroTitle">บันทึกรายงานเรียบร้อยแล้ว</div>
            <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และไฟล์ PDF เรียบร้อย</div>
            <div class="swalPillRow">
              <div class="swalPill primary">Ref: ${escapeHtml(json.refNo || payload.refNo || "-")}</div>
              <div class="swalPill">รูป ${Number(json.imageCount || images.length || 0)}</div>
              <div class="swalPill">${emailOk ? "ส่งอีเมลสำเร็จ" : emailSkipped ? "ไม่ได้ส่งอีเมล" : "อีเมลไม่สำเร็จ"}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">สรุปผลการบันทึก</div>
            <div class="swalKvGrid">
              <div class="swalKv">
                <div class="swalKvLabel">Ref No.</div>
                <div class="swalKvValue">${escapeHtml(json.refNo || payload.refNo || "-")}</div>
              </div>
              <div class="swalKv">
                <div class="swalKvLabel">ผู้บันทึก</div>
                <div class="swalKvValue">${escapeHtml(payload.reportedBy || auth.name || "-")}</div>
              </div>
              <div class="swalKv">
                <div class="swalKvLabel">จำนวนรูปภาพ</div>
                <div class="swalKvValue">${escapeHtml(String(Number(json.imageCount || images.length || 0)))}</div>
              </div>
              <div class="swalKv">
                <div class="swalKvLabel">สถานะอีเมล</div>
                <div class="swalKvValue">${escapeHtml(emailOk ? emailText : emailSkipped ? "ไม่ได้เลือกส่งอีเมล" : (emailErr || "ส่งอีเมลไม่สำเร็จ"))}</div>
              </div>
            </div>
          </div>

          ${pdfOpenUrl ? `
            <div class="swalSection">
              <div class="swalSectionTitle">ไฟล์ PDF</div>
              <div class="swalActionRow" style="display:flex;gap:10px;flex-wrap:wrap">
                <button type="button" id="btnOpenPdfAfterSave" class="btn primary">เปิด PDF</button>
                <button type="button" id="btnCloseAfterSave" class="btn ghost">ปิดหน้าต่าง</button>
              </div>
            </div>
          ` : `
            <div class="swalSection">
              <div class="swalActionRow" style="display:flex;gap:10px;flex-wrap:wrap">
                <button type="button" id="btnCloseAfterSave" class="btn ghost">ปิดหน้าต่าง</button>
              </div>
            </div>
          `}
        </div>
      `,
      didOpen: () => {
        const btnOpen = document.getElementById("btnOpenPdfAfterSave");
        const btnClose = document.getElementById("btnCloseAfterSave");

        if (btnOpen && pdfOpenUrl) {
          btnOpen.addEventListener("click", () => {
            window.open(pdfOpenUrl, "_blank", "noopener,noreferrer");
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
        resetReportRefDuplicateUi_();
        resetForm();
        if ($("rptRefNo")) $("rptRefNo").value = "";
      }
    });

    return json;
  } catch (err) {
    console.error(err);
    window.ProgressUI?.markError("save", err?.message || "เกิดข้อผิดพลาด", 100);
    window.ProgressUI?.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

    await Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: err?.message || String(err),
      confirmButtonText: "ตกลง"
    });

    window.ProgressUI?.hide(180);
  }
}
function initRepeatFooters() {
  [
    "rptPersonList",
    "rptDamageList",
    "rptStepTakenList",
    "rptEvidenceList",
    "rptCauseList",
    "rptPreventionList",
    "rptLearningList",
    "rptImageList"
  ].forEach((listId) => {
    const cfg = getRepeatConfig(listId);
    ensureRepeatFooterButton(listId);
    toggleEmptyState(listId, cfg.label);
  });
}
  function bindTopButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);
    $("btnRptReset")?.addEventListener("click", async () => {
      const ok = await Swal.fire({
        icon: "question",
        title: "ล้างข้อมูลฟอร์ม",
        text: "ต้องการล้างข้อมูลในฟอร์ม Report ใช่หรือไม่",
        showCancelButton: true,
        confirmButtonText: "ล้างข้อมูล",
        cancelButtonText: "ยกเลิก"
      });
      if (ok.isConfirmed) resetForm();
    });

    $("btnRptAllReportTypes")?.addEventListener("click", () => setAllChecks('#rptReportTypes input[type="checkbox"]', true));
    $("btnRptClearReportTypes")?.addEventListener("click", () => setAllChecks('#rptReportTypes input[type="checkbox"]', false));

    $("btnRptAllUrgency")?.addEventListener("click", () => setAllChecks('#rptUrgencyTypes input[type="checkbox"]', true));
    $("btnRptClearUrgency")?.addEventListener("click", () => setAllChecks('#rptUrgencyTypes input[type="checkbox"]', false));

    $("btnRptAllNotifyTo")?.addEventListener("click", () => setAllChecks('#rptNotifyTo input[type="checkbox"]', true));
    $("btnRptClearNotifyTo")?.addEventListener("click", () => setAllChecks('#rptNotifyTo input[type="checkbox"]', false));

    $("btnRptAllEmails")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
    $("btnRptClearEmails")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));

    $("btnRptAddPerson")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptPersonList .rptRepeatCard").length + 1;
      appendRow("rptPersonList", createPersonRowHtml(idx), "ผู้เกี่ยวข้อง");
    });

    $("btnRptAddDamage")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptDamageList .rptRepeatCard").length + 1;
      appendRow(
        "rptDamageList",
        createSimpleIndexedRowHtml("damage", idx, "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม"),
        "ความเสียหาย"
      );
    });

    $("btnRptAddStepTaken")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptStepTakenList .rptRepeatCard").length + 1;
      appendRow("rptStepTakenList", createStepTakenRowHtml(idx), "การดำเนินการ");
    });

    $("btnRptAddEvidence")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptEvidenceList .rptRepeatCard").length + 1;
      appendRow(
        "rptEvidenceList",
        createSimpleIndexedRowHtml("evidence", idx, "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม"),
        "หลักฐาน"
      );
    });

    $("btnRptAddCause")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptCauseList .rptRepeatCard").length + 1;
      appendRow(
        "rptCauseList",
        createSimpleIndexedRowHtml("cause", idx, "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม"),
        "สาเหตุ"
      );
    });

    $("btnRptAddPrevention")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptPreventionList .rptRepeatCard").length + 1;
      appendRow(
        "rptPreventionList",
        createSimpleIndexedRowHtml("prevention", idx, "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม"),
        "การป้องกัน"
      );
    });

    $("btnRptAddLearning")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptLearningList .rptRepeatCard").length + 1;
      appendRow(
        "rptLearningList",
        createSimpleIndexedRowHtml("learning", idx, "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม"),
        "ข้อสรุป/บทเรียน"
      );
    });

    $("btnRptAddImage")?.addEventListener("click", () => {
      const idx = document.querySelectorAll("#rptImageList .rptRepeatCard").length + 1;
      appendRow("rptImageList", createImageRowHtml(idx), "รูปภาพ");
    });

    Object.keys(RPT_REPEAT_CONFIG).forEach((listId) => ensureRepeatFooterButton(listId));
  }

  function normalizeReport500OptionsResponse(json) {
    const src = (json && typeof json === "object")
      ? ((json.data && typeof json.data === "object") ? json.data : json)
      : {};

    const toArray = (v) => Array.isArray(v) ? v : [];

    return {
      branchList: toArray(src.branchList),
      reportTypeList: toArray(src.reportTypeList),
      urgencyList: toArray(src.urgencyList),
      notifyToList: toArray(src.notifyToList),

      locationList: toArray(src.locationList),
      whereDidItHappenDefault: norm(src.whereDidItHappenDefault || ""),

      whereTypeList: toArray(src.whereTypeList),

      personPositionList: toArray(src.personPositionList),
      personDepartmentList: toArray(src.personDepartmentList),
      personRemarkList: toArray(src.personRemarkList),

      actionTypeList: toArray(src.actionTypeList),
      alcoholResultList: toArray(src.alcoholResultList),

      reporterPositionList: toArray(src.reporterPositionList),
      emailList: toArray(src.emailList)
    };
  }

  async function ensureReady() {
    if (state.loading) return;

    if (state.ready && state.options) {
      const hasSomeOptions =
        Array.isArray(state.options.branchList) && state.options.branchList.length > 0 &&
        Array.isArray(state.options.reportTypeList) && state.options.reportTypeList.length > 0;

      if (hasSomeOptions) return;
    }

    state.loading = true;

    try {
      setRefYear();

      const res = await fetch(apiUrl("/report500/options"), {
        method: "GET",
        cache: "no-store"
      });

      const text = await res.text();

      let json = {};
      try {
        json = JSON.parse(text);
      } catch (_) {}

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `โหลดตัวเลือก Report ไม่สำเร็จ (HTTP ${res.status})`);
      }

      state.options = normalizeReport500OptionsResponse(json);

      console.log("Report500 options loaded:", state.options);
      console.log("Worker debug:", json?.workerDebug || null);

      renderSelect("rptBranch", state.options.branchList, true);
      renderOptionMatrix("rptReportTypes", "rptReportTypes", state.options.reportTypeList);
      renderOptionMatrix("rptUrgencyTypes", "rptUrgencyTypes", state.options.urgencyList);
      renderOptionMatrix("rptNotifyTo", "rptNotifyTo", state.options.notifyToList);

   renderSelect("rptWhereDidItHappen", state.options.locationList, true);
if ($("rptWhereDidItHappen")) {
  $("rptWhereDidItHappen").value = "";
}

bindReportRefDuplicateCheck_();

      renderWhereTypeSelections();
      renderSelect("rptReporterPosition", state.options.reporterPositionList, true);
      renderEmailSelector();

      setReadonlyValue("rptReportedBy", norm(getAuth().name));
      if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();
      if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();

      bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
      bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

      bindTopButtons();
bindLookupButtons();
resetForm();
initRepeatFooters();

state.ready = true;
    } catch (err) {
      console.error("Report500 ensureReady error:", err);

      await Swal.fire({
        icon: "error",
        title: "โหลดตัวเลือกไม่สำเร็จ",
        text: err?.message || String(err)
      });
    } finally {
      state.loading = false;
    }
  }
/** =========================================================
 *  REPORT500 EDIT MODE
 *  Load existing Ref -> edit in Report form -> submit revision
 *  เพิ่มไว้ก่อน window.Report500UI
 *  ========================================================= */

const REPORT500_EDIT_STATE = {
  active: false,
  loading: false,
  submitting: false,

  loadedRefNo: "",
  rootRefNo: "",
  currentRefNo: "",
  documentId: "",
  revisionNo: 0,
  revisionLabel: "",

  pdfUrl: "",
  pdfFileId: "",

  payload: {},
  existingImages: [],
  removedImageIds: []
};

window.REPORT500_EDIT_STATE = REPORT500_EDIT_STATE;

function rptEditDriveImageUrl_(fileId) {
  const id = norm(fileId);
  if (!id) return "";
  return `https://lh5.googleusercontent.com/d/${encodeURIComponent(id)}`;
}

function rptEditDriveViewUrl_(fileId) {
  const id = norm(fileId);
  if (!id) return "";
  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/view?usp=drivesdk`;
}

function rptEditSetHidden_(id, hidden) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("hidden", !!hidden);
}

function rptEditSetText_(id, value) {
  const el = $(id);
  if (!el) return;
  el.textContent = norm(value) || "-";
}

function rptEditEnsureOptionValue_(selectEl, value) {
  if (!selectEl) return;

  const v = norm(value);
  if (!v) return;

  const exists = Array.from(selectEl.options || []).some((opt) => opt.value === v);
  if (exists) return;

  const opt = document.createElement("option");
  opt.value = v;
  opt.textContent = v;
  selectEl.appendChild(opt);
}

function rptEditSetValue_(id, value) {
  const el = $(id);
  if (!el) return;

  const v = norm(value);

  if (el.tagName === "SELECT" && v) {
    rptEditEnsureOptionValue_(el, v);
  }

  el.value = v;

  try {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (_) {}
}

function rptEditToInputDate_(value) {
  const s = norm(value);
  if (!s || s === "-") return "";

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    let yyyy = Number(m[3]);
    if (yyyy > 2400) yyyy -= 543;
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function rptEditSplitRef_(refNo) {
  const s = norm(refNo);
  const m = s.match(/^(.+?)-(\d{4})(?:-R\d+|\/R\d+|-REV\d+| Rev\.\d+)?$/i);

  if (!m) {
    return {
      running: "",
      year: ""
    };
  }

  return {
    running: String(m[1] || "").replace(/[^\d]/g, ""),
    year: String(m[2] || "").trim()
  };
}

function rptEditApplyRefToInputs_(refNo) {
  const parts = rptEditSplitRef_(refNo);
  if (!parts.running) return;

  rptEditSetValue_("rptRefNo", parts.running);

  const yearEl = $("rptRefYear");
  if (yearEl && parts.year) {
    rptEditEnsureOptionValue_(yearEl, parts.year);
    yearEl.value = parts.year;
  }
}

function rptEditCheckedValues_(items) {
  const arr = Array.isArray(items) ? items : [];

  return arr
    .filter((item) => {
      if (item && typeof item === "object" && "checked" in item) {
        return !!item.checked;
      }

      return !!norm(
        typeof item === "string"
          ? item
          : item && (item.value || item.label || item.text)
      );
    })
    .map((item) => norm(
      typeof item === "string"
        ? item
        : item && (item.value || item.label || item.text)
    ))
    .filter(Boolean);
}

function rptEditSetCheckboxGroup_(rootId, values) {
  const root = $(rootId);
  if (!root) return;

  const set = new Set(rptEditCheckedValues_(values));

  root.querySelectorAll("input[type='checkbox']").forEach((chk) => {
    chk.checked = set.has(norm(chk.value));

    try {
      chk.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (_) {}
  });
}

function rptEditSetWhereTypeSelections_(items) {
  const list = Array.isArray(items) ? items : [];
  const map = new Map();

  list.forEach((item) => {
    if (!item) return;

    const value = norm(typeof item === "string" ? item : item.value);
    const checked = typeof item === "string"
      ? true
      : ("checked" in item ? !!item.checked : !!value);

    if (value && checked) {
      map.set(value, item || {});
    }
  });

  document.querySelectorAll(".rptWhereTypeRow").forEach((row) => {
    const value = norm(row.getAttribute("data-value"));
    const item = map.get(value);

    const chk = row.querySelector(".rptWhereTypeChk");
    const suffix = row.querySelector(".rptWhereTypeSuffix");
    const wrap = row.querySelector(".optionChoiceOther");
    const needSuffix = row.getAttribute("data-need-suffix") === "1";

    if (chk) chk.checked = !!item;

    if (suffix) {
      suffix.value = item
        ? norm(item.suffixText || item.suffix || item.otherText)
        : "";
    }

    if (wrap) {
      wrap.classList.toggle("hidden", !(item && needSuffix));
    }
  });
}

function rptEditNormalizeLoadedResponse_(json) {
  const root = json && typeof json === "object" ? json : {};
  const data = root.data && typeof root.data === "object" ? root.data : root;

  const payload =
    data.payload ||
    data.editPayload ||
    data.record ||
    data.rowObj ||
    data.row ||
    {};

  const revision =
    data.revision ||
    data.revisionMeta ||
    data.meta ||
    {};

  const existingImages =
    data.existingImages ||
    data.images ||
    data.imageList ||
    payload.existingImages ||
    [];

  const pdfUrl =
    data.pdfUrl ||
    payload.pdfUrl ||
    revision.pdfUrl ||
    "";

  const pdfFileId =
    data.pdfFileId ||
    payload.pdfFileId ||
    revision.pdfFileId ||
    "";

  return {
    payload,
    revision,
    existingImages: Array.isArray(existingImages) ? existingImages : [],
    pdfUrl,
    pdfFileId
  };
}

function rptEditNormalizeImage_(img, index) {
  if (typeof img === "string") {
    return {
      id: img,
      fileId: img,
      filename: `รูปภาพเดิม ${index + 1}`,
      name: `รูปภาพเดิม ${index + 1}`,
      caption: `รูปภาพเดิม ${index + 1}`,
      url: rptEditDriveViewUrl_(img),
      previewUrl: rptEditDriveImageUrl_(img)
    };
  }

  const id = norm(img && (img.id || img.fileId || img.imageId));
  const url = norm(img && (img.url || img.viewUrl)) || rptEditDriveViewUrl_(id);
  const previewUrl = norm(img && (img.previewUrl || img.thumbnailUrl || img.embedUrl)) || rptEditDriveImageUrl_(id);

  return {
    id,
    fileId: id,
    filename: norm(img && (img.filename || img.name || img.caption)) || `รูปภาพเดิม ${index + 1}`,
    name: norm(img && (img.name || img.filename)) || `รูปภาพเดิม ${index + 1}`,
    caption: norm(img && img.caption) || `รูปภาพเดิม ${index + 1}`,
    url,
    previewUrl
  };
}

function rptEditBuildLoadSummaryHtml_(payload, images, pdfUrl) {
  const p = payload || {};

  const rows = [
    ["Ref", p.refNo || "-"],
    ["Root", p.rootRefNo || p.refNo || "-"],
    ["Rev", p.revisionLabel || ("Rev." + Number(p.revisionNo || 0))],
    ["สาขา", p.branch || "-"],
    ["เรื่อง", p.subject || "-"],
    ["ผู้รายงาน", p.reportedBy || "-"],
    ["วันที่", p.incidentDate || "-"],
    ["สถานที่", p.whereDidItHappen || "-"],
    ["รูป", `${images.length} รูป`],
    ["PDF", pdfUrl ? "มีไฟล์" : "ไม่มี"]
  ];

  return `
    <div class="report500LoadSummaryCompact">
      <div class="report500LoadCompactHead">
        <div class="report500LoadCompactTitle">พบข้อมูล Report เดิม</div>
        <div class="report500LoadCompactSub">ตรวจสอบข้อมูลก่อนโหลดกลับเข้าแบบฟอร์ม</div>
      </div>

      <div class="report500LoadCompactTable">
        ${rows.map(([label, value]) => `
          <div class="report500LoadCompactRow">
            <div class="report500LoadCompactLabel">${escapeHtml(label)}</div>
            <div class="report500LoadCompactValue">${escapeHtml(value)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function rptEditRenderPanel_() {
  const st = REPORT500_EDIT_STATE;

  document.body.classList.toggle("report500-editing", !!st.active);

  rptEditSetHidden_("report500EditPanel", !st.active);
  rptEditSetHidden_("btnReport500ExitEdit", !st.active);

  rptEditSetText_("report500EditRefText", st.rootRefNo || st.loadedRefNo || "-");
  rptEditSetText_("report500EditRevisionText", st.revisionLabel || ("Rev." + Number(st.revisionNo || 0)));
  rptEditSetText_("report500EditDocumentIdText", st.documentId || "-");

  const pdfLink = $("report500EditPdfLink");
  const pdfEmpty = $("report500EditPdfEmpty");

  if (pdfLink && st.pdfUrl) {
    pdfLink.href = st.pdfUrl;
    pdfLink.classList.remove("hidden");
    if (pdfEmpty) pdfEmpty.classList.add("hidden");
  } else {
    if (pdfLink) {
      pdfLink.href = "#";
      pdfLink.classList.add("hidden");
    }
    if (pdfEmpty) pdfEmpty.classList.remove("hidden");
  }

  const btnSubmit = $("btnRptSubmit");
  if (btnSubmit) {
    btnSubmit.textContent = st.active
      ? "บันทึกฉบับแก้ไขและสร้าง PDF ใหม่"
      : "บันทึกและสร้าง PDF";
  }

  rptEditRenderExistingImages_();
}

function rptEditRenderExistingImages_() {
  const wrap = $("report500ExistingImagesWrap");
  const root = $("report500ExistingImages");
  if (!wrap || !root) return;

  const images = REPORT500_EDIT_STATE.existingImages || [];
  root.innerHTML = "";

  if (!images.length) {
    wrap.classList.add("hidden");
    return;
  }

  images.forEach((img, idx) => {
    const id = norm(img.id);
    const removed = REPORT500_EDIT_STATE.removedImageIds.includes(id);
    const previewUrl = img.previewUrl || rptEditDriveImageUrl_(id);
    const viewUrl = img.url || rptEditDriveViewUrl_(id);

    const card = document.createElement("div");
    card.className = `existingImageCard${removed ? " is-removed" : ""}`;
    card.dataset.fileId = id;

    card.innerHTML = `
      <div class="existingImageThumbWrap">
        ${
          previewUrl
            ? `<img class="existingImageThumb" src="${escapeHtml(previewUrl)}" alt="รูปเดิม ${idx + 1}" loading="lazy">`
            : `<div class="existingImageNoPreview">ไม่มีตัวอย่างรูป</div>`
        }
      </div>

      <div class="existingImageBody">
        <div class="existingImageTitle">${escapeHtml(img.caption || img.filename || img.name || ("รูปภาพเดิม " + (idx + 1)))}</div>
        <div class="existingImageMeta">File ID: ${escapeHtml(id || "-")}</div>

        <div class="existingImageActions">
          ${
            viewUrl
              ? `<a class="existingImageViewLink" href="${escapeHtml(viewUrl)}" target="_blank" rel="noopener">เปิดดู</a>`
              : `<span></span>`
          }

          <button class="existingImageRemoveBtn${removed ? " is-removed" : ""}" type="button" data-file-id="${escapeHtml(id)}">
            ${removed ? "ใช้รูปนี้ต่อ" : "ไม่ใช้รูปนี้"}
          </button>
        </div>
      </div>
    `;

    root.appendChild(card);
  });

  root.querySelectorAll(".existingImageRemoveBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fileId = norm(btn.getAttribute("data-file-id"));
      if (!fileId) return;

      const list = REPORT500_EDIT_STATE.removedImageIds;
      const found = list.indexOf(fileId);

      if (found >= 0) {
        list.splice(found, 1);
      } else {
        list.push(fileId);
      }

      rptEditRenderExistingImages_();
    });
  });

  wrap.classList.remove("hidden");
}

function rptEditClearState_() {
  REPORT500_EDIT_STATE.active = false;
  REPORT500_EDIT_STATE.loading = false;
  REPORT500_EDIT_STATE.submitting = false;

  REPORT500_EDIT_STATE.loadedRefNo = "";
  REPORT500_EDIT_STATE.rootRefNo = "";
  REPORT500_EDIT_STATE.currentRefNo = "";
  REPORT500_EDIT_STATE.documentId = "";
  REPORT500_EDIT_STATE.revisionNo = 0;
  REPORT500_EDIT_STATE.revisionLabel = "";

  REPORT500_EDIT_STATE.pdfUrl = "";
  REPORT500_EDIT_STATE.pdfFileId = "";

  REPORT500_EDIT_STATE.payload = {};
  REPORT500_EDIT_STATE.existingImages = [];
  REPORT500_EDIT_STATE.removedImageIds = [];

  rptEditRenderPanel_();
}

async function rptEditExitMode_() {
  const ok = await Swal.fire({
    icon: "question",
    title: "ออกจากโหมดแก้ไข Report?",
    text: "ข้อมูลที่โหลดไว้จะถูกยกเลิก แต่ข้อมูลในฟอร์มจะยังไม่ถูกล้าง",
    showCancelButton: true,
    confirmButtonText: "ออกจากโหมดแก้ไข",
    cancelButtonText: "ยกเลิก"
  });

  if (!ok.isConfirmed) return;
  rptEditClearState_();
}

function rptEditAppendRowAndGet_(listId, html, emptyLabel) {
  const root = $(listId);
  if (!root) return null;

  appendRow(listId, html, emptyLabel);

  const cards = root.querySelectorAll(".rptRepeatCard");
  return cards[cards.length - 1] || null;
}

function rptEditFillPersonRows_(rows) {
  const root = $("rptPersonList");
  if (!root) return;

  root.innerHTML = "";

  const arr = Array.isArray(rows) ? rows : [];

  arr.forEach((item, idx) => {
    const node = rptEditAppendRowAndGet_("rptPersonList", createPersonRowHtml(idx + 1), "ผู้เกี่ยวข้อง");
    if (!node) return;

    const who = node.querySelector(".rptPersonWho");
    if (who) who.value = norm(item.who || item.name || item.personName);

    const pos = node.querySelector(".rptPersonPosition");
    rptEditEnsureOptionValue_(pos, norm(item.position));
    if (pos) pos.value = norm(item.position);

    const posOther = node.querySelector(".rptPersonPositionOther");
    if (posOther) posOther.value = norm(item.positionOther);

    const dep = node.querySelector(".rptPersonDepartment");
    rptEditEnsureOptionValue_(dep, norm(item.department));
    if (dep) dep.value = norm(item.department);

    const depOther = node.querySelector(".rptPersonDepartmentOther");
    if (depOther) depOther.value = norm(item.departmentOther);

    const rem = node.querySelector(".rptPersonRemark");
    rptEditEnsureOptionValue_(rem, norm(item.remark));
    if (rem) rem.value = norm(item.remark);

    const remOther = node.querySelector(".rptPersonRemarkOther");
    if (remOther) remOther.value = norm(item.remarkOther);

    pos?.dispatchEvent(new Event("change", { bubbles: true }));
    dep?.dispatchEvent(new Event("change", { bubbles: true }));
    rem?.dispatchEvent(new Event("change", { bubbles: true }));

    refreshSingleCardUi(node);
  });

  toggleEmptyState("rptPersonList", "ผู้เกี่ยวข้อง");
}

function rptEditFillSimpleRows_(listId, rows, type, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
  const root = $(listId);
  if (!root) return;

  root.innerHTML = "";

  const arr = Array.isArray(rows) ? rows : [];

  arr.forEach((item, idx) => {
    const node = rptEditAppendRowAndGet_(
      listId,
      createSimpleIndexedRowHtml(type, idx + 1, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder),
      titleLabel
    );

    if (!node) return;

    const title = node.querySelector(".rptIdxTitle");
    const detail = node.querySelector(".rptIdxDetail");

    if (title) title.value = norm(item.title || item.name || item.topic);
    if (detail) detail.value = norm(item.detail || item.text || item.description);

    refreshSingleCardUi(node);
  });

  toggleEmptyState(listId, titleLabel);
}

function rptEditFillStepRows_(rows) {
  const root = $("rptStepTakenList");
  if (!root) return;

  root.innerHTML = "";

  const arr = Array.isArray(rows) ? rows : [];

  arr.forEach((item, idx) => {
    const node = rptEditAppendRowAndGet_("rptStepTakenList", createStepTakenRowHtml(idx + 1), "การดำเนินการ");
    if (!node) return;

    const action = node.querySelector(".rptStepActionType");
    rptEditEnsureOptionValue_(action, norm(item.actionType));
    if (action) action.value = norm(item.actionType);

    const actionOther = node.querySelector(".rptStepActionTypeOther");
    if (actionOther) actionOther.value = norm(item.actionTypeOther);

    const alcoholResult = node.querySelector(".rptAlcoholResult");
    if (alcoholResult) alcoholResult.value = norm(item.alcoholResult);

    const alcoholMg = node.querySelector(".rptAlcoholMgPercent");
    if (alcoholMg) alcoholMg.value = norm(item.alcoholMgPercent);

    const drugConfirmed = node.querySelector(".rptDrugConfirmed");
    if (drugConfirmed) drugConfirmed.value = norm(item.drugConfirmed);

    const drugDetail = node.querySelector(".rptDrugShortDetail");
    if (drugDetail) drugDetail.value = norm(item.drugShortDetail);

    const detail = node.querySelector(".rptStepDetail");
    if (detail) detail.value = norm(item.detail || item.text);

    action?.dispatchEvent(new Event("change", { bubbles: true }));
    alcoholResult?.dispatchEvent(new Event("change", { bubbles: true }));

    refreshSingleCardUi(node);
  });

  toggleEmptyState("rptStepTakenList", "การดำเนินการ");
}

function rptEditApplyPayloadToForm_(payload) {
  const p = payload || {};
  const rootRefNo = norm(p.rootRefNo || p.refNo || REPORT500_EDIT_STATE.rootRefNo);

  resetForm();

  rptEditApplyRefToInputs_(rootRefNo);

  rptEditSetValue_("rptBranch", p.branch);
  rptEditSetValue_("rptBranchOther", p.branchOther);
  rptEditSetValue_("rptSubject", p.subject);

  rptEditSetCheckboxGroup_("rptReportTypes", p.reportTypes);
  rptEditSetCheckboxGroup_("rptUrgencyTypes", p.urgencyTypes);
  rptEditSetCheckboxGroup_("rptNotifyTo", p.notifyTo);

  rptEditSetValue_("rptIncidentDate", rptEditToInputDate_(p.incidentDate));
  rptEditSetValue_("rptIncidentTime", p.incidentTime);
  rptEditSetValue_("rptWhatHappen", p.whatHappen);
  rptEditSetValue_("rptWhereDidItHappen", p.whereDidItHappen);
  rptEditSetWhereTypeSelections_(p.whereTypeSelections);
  rptEditSetValue_("rptArea", p.area);

  rptEditFillPersonRows_(p.involvedPersons);
  rptEditFillSimpleRows_("rptDamageList", p.damages, "damage", "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม");
  rptEditFillStepRows_(p.stepTakens);
  rptEditSetValue_("rptOffenderStatement", p.offenderStatement);
  rptEditFillSimpleRows_("rptEvidenceList", p.evidences, "evidence", "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม");
  rptEditSetValue_("rptSummaryText", p.summaryText);
  rptEditFillSimpleRows_("rptCauseList", p.causes, "cause", "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม");
  rptEditFillSimpleRows_("rptPreventionList", p.preventions, "prevention", "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม");
  rptEditFillSimpleRows_("rptLearningList", p.learnings, "learning", "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม");

  rptEditSetValue_("rptReportedBy", p.reportedBy || getAuth().name);
  rptEditSetValue_("rptReporterPosition", p.reporterPosition);
  rptEditSetValue_("rptReporterPositionOther", p.reporterPositionOther);
  rptEditSetValue_("rptReportDate", rptEditToInputDate_(p.reportDate));

  if (Array.isArray(p.emailRecipients)) {
    const emails = new Set(
      p.emailRecipients
        .map((x) => norm(x).toLowerCase())
        .filter(Boolean)
    );

    document.querySelectorAll("#rptEmailSelector input[type='checkbox'], .rptEmailChk").forEach((chk) => {
      chk.checked = emails.has(norm(chk.value).toLowerCase());
    });
  }

  rptEditSetValue_("rptEmailOther", p.emailOther);

  bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
  bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");
}

async function loadReport500ForEdit() {
  if (REPORT500_EDIT_STATE.loading) return;

  await ensureReady();

  const refNo = getRefNo();

  if (!norm(refNo)) {
    await Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้ระบุ Ref",
      text: "กรุณากรอก Ref No. และปี ก่อนดึงข้อมูลเดิม",
      confirmButtonText: "ตกลง"
    });
    return;
  }

  REPORT500_EDIT_STATE.loading = true;

  try {
    const res = await fetch(`${apiUrl("/report500/load")}?refNo=${encodeURIComponent(refNo)}`, {
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
      throw new Error(json?.message || json?.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    const normalized = rptEditNormalizeLoadedResponse_(json);
    const payload = normalized.payload || {};
    const images = normalized.existingImages.map(rptEditNormalizeImage_).filter((x) => x.id);

    const rootRefNo = norm(
      payload.rootRefNo ||
      normalized.revision.rootRefNo ||
      payload.refNo ||
      refNo
    );

    const loadedRefNo = norm(
      payload.refNo ||
      normalized.revision.refNo ||
      refNo
    );

    const revisionNo = Number(
      payload.revisionNo ||
      normalized.revision.revisionNo ||
      0
    );

    const revisionLabel = norm(
      payload.revisionLabel ||
      normalized.revision.revisionLabel ||
      ("Rev." + revisionNo)
    );

    const summaryHtml = rptEditBuildLoadSummaryHtml_(payload, images, normalized.pdfUrl);

    const confirm = await Swal.fire({
      icon: "info",
      title: "พบข้อมูล Report เดิม",
      html: summaryHtml,
      width: 720,
      showCancelButton: true,
      confirmButtonText: "โหลดเข้าแบบฟอร์มเพื่อแก้ไข",
      cancelButtonText: "ยกเลิก"
    });

    if (!confirm.isConfirmed) return;

    REPORT500_EDIT_STATE.active = true;
    REPORT500_EDIT_STATE.loadedRefNo = loadedRefNo;
    REPORT500_EDIT_STATE.currentRefNo = loadedRefNo;
    REPORT500_EDIT_STATE.rootRefNo = rootRefNo;
    REPORT500_EDIT_STATE.documentId = norm(payload.documentId || normalized.revision.documentId);
    REPORT500_EDIT_STATE.revisionNo = revisionNo;
    REPORT500_EDIT_STATE.revisionLabel = revisionLabel;

    REPORT500_EDIT_STATE.pdfUrl = normalized.pdfUrl || "";
    REPORT500_EDIT_STATE.pdfFileId = normalized.pdfFileId || "";

    REPORT500_EDIT_STATE.payload = payload;
    REPORT500_EDIT_STATE.existingImages = images;
    REPORT500_EDIT_STATE.removedImageIds = [];

    rptEditApplyPayloadToForm_(payload);
    rptEditRenderPanel_();

    await Swal.fire({
      icon: "success",
      title: "โหลดข้อมูล Report เข้าแบบฟอร์มแล้ว",
      text: "สามารถตรวจสอบ/แก้ไขข้อมูล แล้วกดบันทึกฉบับแก้ไขได้",
      confirmButtonText: "ตกลง"
    });

  } catch (err) {
    console.error("loadReport500ForEdit failed:", err);

    await Swal.fire({
      icon: "error",
      title: "โหลดข้อมูล Report ไม่สำเร็จ",
      text: err?.message || String(err),
      confirmButtonText: "ตกลง"
    });
  } finally {
    REPORT500_EDIT_STATE.loading = false;
  }
}

function rptEditBuildRevisionPayload_(basePayload) {
  const st = REPORT500_EDIT_STATE;

  return {
    ...basePayload,

    rootRefNo: st.rootRefNo || basePayload.rootRefNo || basePayload.refNo,
    editedFromRefNo: st.currentRefNo || st.loadedRefNo || basePayload.refNo,
    editedBy: getAuth().name || basePayload.reportedBy || "",

    documentId: st.documentId || "",
    previousPdfFileId: st.pdfFileId || "",
    previousPdfUrl: st.pdfUrl || "",

    existingImages: (st.existingImages || []).map((img) => ({
      id: img.id,
      fileId: img.id,
      filename: img.filename || img.name || "",
      name: img.name || img.filename || "",
      caption: img.caption || "",
      url: img.url || "",
      previewUrl: img.previewUrl || ""
    })),

    removedImageIds: Array.from(new Set(st.removedImageIds || []))
  };
}

async function submitReport500Revision_() {
  if (REPORT500_EDIT_STATE.submitting) return;

  const auth = getAuth();
  if (!norm(auth.pass)) {
    await Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล"
    });
    return;
  }

  try {
    let payload = collectPayload();
    const images = await collectImages();

    payload = rptEditBuildRevisionPayload_(payload);

    const existingCount = Math.max(
      0,
      (payload.existingImages || []).length - (payload.removedImageIds || []).length
    );

    const confirm = await Swal.fire({
      icon: "question",
      title: "ยืนยันบันทึกฉบับแก้ไข Report",
      html: `
        <div style="text-align:left;line-height:1.7">
          <div><b>Root Ref:</b> ${escapeHtml(payload.rootRefNo || "-")}</div>
          <div><b>แก้ไขจาก:</b> ${escapeHtml(payload.editedFromRefNo || "-")}</div>
          <div><b>รูปเดิมที่ใช้ต่อ:</b> ${existingCount} รูป</div>
          <div><b>รูปเดิมที่ไม่ใช้:</b> ${(payload.removedImageIds || []).length} รูป</div>
          <div><b>รูปใหม่:</b> ${images.length} รูป</div>
          <div style="color:#64748b;font-size:13px;margin-top:8px">
            ระบบจะสร้างข้อมูลฉบับแก้ไขและสร้าง PDF ใหม่ โดยไม่ลบข้อมูลเดิม
          </div>
        </div>
      `,
      width: 720,
      showCancelButton: true,
      confirmButtonText: "ยืนยันบันทึกฉบับแก้ไข",
      cancelButtonText: "ยกเลิก"
    });

    if (!confirm.isConfirmed) return;

    REPORT500_EDIT_STATE.submitting = true;

    const Progress = window.ProgressUI;
    Progress?.show(
      "กำลังบันทึกฉบับแก้ไข Report",
      "ระบบกำลังบันทึกข้อมูล สร้าง PDF ใหม่ และอัปเดต QR Code"
    );

    Progress?.activateOnly("validate", 10, "กำลังตรวจสอบข้อมูลฉบับแก้ไข");
    await (window.sleepMs ? window.sleepMs(140) : new Promise((r) => setTimeout(r, 140)));
    Progress?.markDone("validate", 18, "ข้อมูลพร้อมบันทึก");

    Progress?.activateOnly("upload", 30, "กำลังเตรียมรูปภาพ");
    await (window.sleepMs ? window.sleepMs(160) : new Promise((r) => setTimeout(r, 160)));
    Progress?.markDone("upload", 42, `เตรียมรูปภาพเรียบร้อย (${images.length} รูปใหม่)`);

    Progress?.activateOnly("save", 56, "กำลังบันทึกฉบับแก้ไข Report");

    const res = await fetch(apiUrl("/report500/revise"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass: auth.pass,
        payload,
        files: images
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
      throw new Error(json?.error || json?.message || `บันทึกฉบับแก้ไขไม่สำเร็จ (HTTP ${res.status})`);
    }

    Progress?.markDone("save", 72, "บันทึกฉบับแก้ไขเรียบร้อย");
    Progress?.activateOnly("pdf", 84, "กำลังสร้าง PDF ใหม่");

    await (window.sleepMs ? window.sleepMs(180) : new Promise((r) => setTimeout(r, 180)));

    if (json.pdfFileId || json.pdfUrl || json.pdfAccessUrl) {
      const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
      Progress?.markDone("pdf", 94, `สร้าง PDF ใหม่เรียบร้อย${sizeText}`);
    } else {
      Progress?.markDone("pdf", 94, "สร้าง PDF ใหม่เรียบร้อย");
    }

    Progress?.activateOnly("email", 97, "กำลังสรุปสถานะอีเมล");

    const emailResult = json.emailResult || {};
    if (emailResult.ok) {
      Progress?.markDone("email", 100, "ส่งอีเมลเรียบร้อย");
    } else if (emailResult.skipped) {
      Progress?.markDone("email", 100, "ไม่ได้ส่งอีเมล", "ข้าม");
    } else {
      Progress?.markError("email", emailResult.error || "ส่งอีเมลไม่สำเร็จ", 100);
    }

    Progress?.success(
      "บันทึกฉบับแก้ไขสำเร็จ",
      "ระบบสร้าง PDF ใหม่และอัปเดตข้อมูลล่าสุดเรียบร้อยแล้ว"
    );

    Progress?.hide(250);

    const pdfUrl =
      json.pdfUrl ||
      json.pdfAccessUrl ||
      (json.rootRefNo ? apiUrl(`/report500/pdf/${encodeURIComponent(json.rootRefNo)}`) : "");

    await Swal.fire({
      icon: "success",
      title: "บันทึกฉบับแก้ไข Report สำเร็จ",
      html: `
        <div class="swalSummary" style="text-align:left">
          <div class="swalSection">
            <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">Ref ใหม่</div><div class="swalKvValue">${escapeHtml(json.refNo || payload.refNo || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Root Ref</div><div class="swalKvValue">${escapeHtml(json.rootRefNo || payload.rootRefNo || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">Revision</div><div class="swalKvValue">${escapeHtml(json.revisionLabel || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">PDF</div><div class="swalKvValue">${pdfUrl ? "สร้างแล้ว" : "ไม่พบลิงก์ PDF"}</div></div>
            </div>
          </div>

          ${
            pdfUrl
              ? `<div style="margin-top:14px;text-align:center">
                  <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener" class="btn primary" style="text-decoration:none;display:inline-flex">เปิด PDF ใหม่</a>
                </div>`
              : ""
          }
        </div>
      `,
      width: 920,
      confirmButtonText: "ตกลง"
    });

    rptEditClearState_();
    resetReportRefDuplicateUi_();
    resetForm();

    if ($("rptRefNo")) $("rptRefNo").value = "";

  } catch (err) {
    console.error("submitReport500Revision_ failed:", err);

    window.ProgressUI?.markError("save", err?.message || "บันทึกฉบับแก้ไขไม่สำเร็จ", 72);
    window.ProgressUI?.hide(180);

    await Swal.fire({
      icon: "error",
      title: "บันทึกฉบับแก้ไขไม่สำเร็จ",
      text: err?.message || String(err),
      confirmButtonText: "ตกลง"
    });
  } finally {
    REPORT500_EDIT_STATE.submitting = false;
  }
}

function bindReport500EditModeEvents_() {
  const loadBtn = $("btnReport500LoadRef");
  const exitBtn = $("btnReport500ExitEdit");
  const submitBtn = $("btnRptSubmit");

  if (loadBtn && !loadBtn.__report500EditBound) {
    loadBtn.__report500EditBound = true;
    loadBtn.addEventListener("click", loadReport500ForEdit);
  }

  if (exitBtn && !exitBtn.__report500EditBound) {
    exitBtn.__report500EditBound = true;
    exitBtn.addEventListener("click", rptEditExitMode_);
  }

  if (submitBtn && !submitBtn.__report500EditCaptureBound) {
    submitBtn.__report500EditCaptureBound = true;

    submitBtn.addEventListener("click", (event) => {
      if (!REPORT500_EDIT_STATE.active) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      submitReport500Revision_();
    }, true);
  }

  rptEditRenderPanel_();
}

bindReport500EditModeEvents_();
window.Report500UI = {
  ensureReady,
  preview,
  submit,
  reset: resetForm,
  loadForEdit: loadReport500ForEdit,
  exitEditMode: rptEditExitMode_
};
})();


