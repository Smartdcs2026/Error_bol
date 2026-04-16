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
    itemLookup: createEmptyItemLookupState(),
    editMeta: null
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

  function getCardStatus(card) {
    if (!card) return "ยังไม่กรอก";

    const values = Array.from(card.querySelectorAll("input, textarea, select"))
      .filter((el) => el.type !== "file")
      .map((el) => {
        if (el.type === "checkbox" || el.type === "radio") return !!el.checked ? "1" : "";
        return norm(el.value);
      });

    const nonEmpty = values.filter(Boolean).length;
    if (!values.length) return "ยังไม่กรอก";
    if (!nonEmpty) return "ยังไม่กรอก";
    if (nonEmpty === values.length) return "กรอกครบ";
    return "กรอกบางส่วน";
  }

  function getCardSummary(card) {
    if (!card) return "แตะเพื่อกรอกข้อมูล";

    const type = card.getAttribute("data-type");
    if (type === "person") {
      const who = norm(card.querySelector(".rptPersonWho")?.value);
      const pos = norm(card.querySelector(".rptPersonPosition")?.value);
      const dep = norm(card.querySelector(".rptPersonDepartment")?.value);
      const parts = [who, pos, dep].filter(Boolean);
      return parts.length ? cropText(parts.join(" • "), 100) : "แตะเพื่อกรอกข้อมูล";
    }

    if (type === "stepTaken") {
      const actionType = norm(card.querySelector(".rptStepActionType")?.value);
      const detail = norm(card.querySelector(".rptStepDetail")?.value);
      const parts = [actionType, detail].filter(Boolean);
      return parts.length ? cropText(parts.join(" • "), 100) : "แตะเพื่อกรอกข้อมูล";
    }

    if (type === "image") {
      const meta = norm(card.querySelector(".rptImageMeta")?.textContent);
      const caption = norm(card.querySelector(".rptImageCaption")?.value);
      const parts = [meta, caption].filter(Boolean);
      return parts.length ? cropText(parts.join(" • "), 100) : "แตะเพื่อกรอกข้อมูล";
    }

    const idxTitle = norm(card.querySelector(".rptIdxTitle")?.value);
    const idxDetail = norm(card.querySelector(".rptIdxDetail")?.value);
    const parts = [idxTitle, idxDetail].filter(Boolean);
    return parts.length ? cropText(parts.join(" • "), 100) : "แตะเพื่อกรอกข้อมูล";
  }

  function refreshSingleCardUi(card) {
    if (!card) return;
    const statusEl = card.querySelector(".rptCardStatus");
    const summaryEl = card.querySelector(".rptCardSummary");

    const status = getCardStatus(card);
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.classList.toggle("is-complete", status === "กรอกครบ");
      statusEl.classList.toggle("is-partial", status === "กรอกบางส่วน");
      statusEl.classList.toggle("is-empty", status === "ยังไม่กรอก");
    }

    if (summaryEl) {
      summaryEl.textContent = getCardSummary(card);
    }
  }

  function bindCardCollapse(card) {
    const head = card?.querySelector(".rptCardHead");
    const toggleBtn = card?.querySelector(".rptToggleBtn");
    if (!head || !toggleBtn) return;

    const toggle = (ev) => {
      if (ev && ev.target && ev.target.closest(".rptRemoveRow, .rptEditImageBtn")) return;
      const next = !card.classList.contains("is-collapsed");
      setCardCollapsed(card, next);
    };

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        toggle(ev);
      }
    });

    toggleBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggle(ev);
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
              <div class="rptCardStatus is-empty">ยังไม่กรอก</div>
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

        <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
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

        <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
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

        <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
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

        <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
          <button type="button" class="btn ghost rptEditImageBtn">แก้ไขภาพ</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      `
    });
  }

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
    expandOnlyThisCard(node);
    refreshSingleCardUi(node);
  }

  function bindDynamicRow(node) {
    if (!node) return;

    bindCardCollapse(node);

    node.querySelectorAll("input, textarea, select").forEach((el) => {
      const evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
      el.addEventListener(evt, () => refreshSingleCardUi(node));
      el.addEventListener("change", () => refreshSingleCardUi(node));
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

      const parentId = node.parentElement?.id || "";
      node.remove();

      if (parentId) {
        refreshRowIndex(parentId);
        toggleEmptyState(parentId, getRepeatConfig(parentId).label);
      }
    });

    if (node.getAttribute("data-type") === "person") {
      bindSelectOtherInRow(node, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
      bindSelectOtherInRow(node, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
      bindSelectOtherInRow(node, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
    }

    if (node.getAttribute("data-type") === "stepTaken") {
      bindStepTakenRow(node);
    }

    if (node.getAttribute("data-type") === "image") {
      bindImageRow(node);
    }

    refreshSingleCardUi(node);
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

      updateRptImagePreview(
        node,
        file,
        buildRptEditedImageMeta(file, false)
      );

      refreshSingleCardUi(node);
    });

    editBtn?.addEventListener("click", async () => {
      await openRptImageEditor(node);
      refreshSingleCardUi(node);
    });
  }

  function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;

    const cards = Array.from(root.querySelectorAll(".rptRepeatCard"));
    cards.forEach((card, idx) => {
      const index = idx + 1;
      const badge = card.querySelector(".rptRowIndex");
      if (badge) badge.textContent = String(index);

      const headTitle = card.querySelector(".rptCardTitle");
      if (headTitle) {
        let label = "รายการ";
        const type = card.getAttribute("data-type");
        if (type === "person") label = "ผู้เกี่ยวข้อง";
        else if (type === "stepTaken") label = "การดำเนินการ";
        else if (type === "image") label = "รูปภาพ";
        else if (listId === "rptDamageList") label = "ความเสียหาย";
        else if (listId === "rptEvidenceList") label = "หลักฐาน";
        else if (listId === "rptCauseList") label = "สาเหตุ";
        else if (listId === "rptPreventionList") label = "การป้องกัน";
        else if (listId === "rptLearningList") label = "ข้อสรุป/บทเรียน";
        headTitle.textContent = `${label} ${index}`;
      }

      refreshSingleCardUi(card);
    });
  }

  function toggleEmptyState(listId, label) {
    const root = $(listId);
    if (!root) return;

    let empty = root.querySelector(".rptListEmpty");
    const count = root.querySelectorAll(".rptRepeatCard").length;

    if (!empty) {
      empty = document.createElement("div");
      empty.className = "rptListEmpty";
      empty.innerHTML = `
        <div class="emailEmpty" style="text-align:center">
          ยังไม่มี${escapeHtml(label)}<br>
          <span style="font-size:11px;color:#94a3b8">กดปุ่มเพิ่มรายการเพื่อเริ่มต้น</span>
        </div>
      `;
      root.appendChild(empty);
    }

    empty.classList.toggle("hidden", count > 0);
  }

  function resetList(listId, label) {
    const root = $(listId);
    if (!root) return;

    root.querySelectorAll(".rptRepeatCard").forEach((card) => {
      if (card.getAttribute("data-type") === "image") {
        clearRptEditedImageState(card);
      }
    });

    root.innerHTML = "";
    toggleEmptyState(listId, label);
  }

  function ensureRepeatFooterButton(listId) {
    const cfg = getRepeatConfig(listId);
    if (!cfg.addBtnId) return;
    const btn = $(cfg.addBtnId);
    if (!btn) return;
    btn.dataset.listId = listId;
  }

  function initRepeatFooters() {
    Object.keys(RPT_REPEAT_CONFIG).forEach((listId) => ensureRepeatFooterButton(listId));
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

    const res = await fetch(apiUrl(`/disciplineLookup?employeeCode=${encodeURIComponent(code)}`), {
      method: "GET"
    });

    let json = null;
    try {
      json = await res.json();
    } catch (_) {
      throw new Error("ระบบค้นหาวินัยไม่ส่ง JSON กลับมา");
    }

    if (!res.ok || !json || !json.ok) {
      throw new Error(json?.error || "ค้นหาการดำเนินการทางวินัยไม่สำเร็จ");
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

  function appendDisciplinePayloadToReport500Payload(payload) {
    const d = state.disciplineLookup || createEmptyDisciplineLookupState();

    payload.disciplineEmployeeCode = d.attached ? (d.employeeCode || "") : "";
    payload.disciplineEmployeeName = d.attached ? (d.employeeName || "") : "";
    payload.disciplineMatchCount = d.attached ? Number(d.matchCount || d.records.length || 0) : 0;
    payload.disciplineReferenceJson = d.attached ? JSON.stringify(d.records || []) : "";

    return payload;
  }

  function setReportEditMode(meta) {
    state.editMeta = meta || null;

    const badge = $("rptEditModeBadge");
    const btnCancel = $("btnRptCancelEditMode");

    if (badge) {
      if (meta) {
        badge.classList.remove("hidden");
        badge.textContent = `โหมดแก้ไข Rev ${Number(meta.baseRevNo || 0)} → ใหม่`;
      } else {
        badge.classList.add("hidden");
        badge.textContent = "";
      }
    }

    if (btnCancel) {
      btnCancel.classList.toggle("hidden", !meta);
    }
  }

  function setCheckedMatrixValues(rootId, selectedItems) {
    const selected = Array.isArray(selectedItems) ? selectedItems : [];
    const map = new Set(
      selected
        .filter((x) => typeof x === "string" ? norm(x) : !!x?.checked)
        .map((x) => typeof x === "string" ? norm(x) : norm(x?.value || x?.label || x?.text))
    );

    document.querySelectorAll(`#${rootId} input[type='checkbox']`).forEach((el) => {
      el.checked = map.has(norm(el.value));
    });
  }

  function applyReportWhereTypeSelections(selectedItems) {
    const selected = Array.isArray(selectedItems) ? selectedItems : [];
    const map = {};

    selected.forEach((x) => {
      if (typeof x === "string") {
        map[norm(x)] = { checked: true, suffixText: "" };
        return;
      }
      const key = norm(x?.value || x?.label || x?.text);
      if (!key) return;
      map[key] = {
        checked: x.checked !== false,
        suffixText: norm(x.suffixText)
      };
    });

    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeChk").forEach((el) => {
      const key = norm(el.value);
      const stateItem = map[key] || { checked: false, suffixText: "" };
      el.checked = !!stateItem.checked;

      const wrap = el.closest(".rptWhereTypeRow")?.querySelector(".optionChoiceOther");
      const input = el.closest(".rptWhereTypeRow")?.querySelector(".rptWhereTypeSuffix");

      if (wrap) wrap.classList.toggle("hidden", !(stateItem.checked && el.closest(".rptWhereTypeRow")?.getAttribute("data-need-suffix") === "1"));
      if (input) input.value = stateItem.suffixText || "";
    });
  }

  function refillSimpleIndexedList(listId, rows, type, title, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
    resetList(listId, title);
    (Array.isArray(rows) ? rows : []).forEach((row, idx) => {
      appendRow(
        listId,
        createSimpleIndexedRowHtml(type, idx + 1, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder),
        title
      );
      const cards = Array.from(document.querySelectorAll(`#${listId} .rptRepeatCard`));
      const card = cards[cards.length - 1];
      if (!card) return;
      const titleEl = card.querySelector(".rptIdxTitle");
      const detailEl = card.querySelector(".rptIdxDetail");
      if (titleEl) titleEl.value = norm(row?.title);
      if (detailEl) detailEl.value = norm(row?.detail);
      refreshSingleCardUi(card);
      setCardCollapsed(card, true);
    });

    if (!(Array.isArray(rows) && rows.length)) {
      appendRow(
        listId,
        createSimpleIndexedRowHtml(type, 1, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder),
        title
      );
    }
  }

  function refillPersonList(rows) {
    resetList("rptPersonList", "ผู้เกี่ยวข้อง");
    const list = Array.isArray(rows) ? rows : [];

    list.forEach((row, idx) => {
      appendRow("rptPersonList", createPersonRowHtml(idx + 1), "ผู้เกี่ยวข้อง");
      const cards = Array.from(document.querySelectorAll("#rptPersonList .rptRepeatCard"));
      const card = cards[cards.length - 1];
      if (!card) return;

      card.querySelector(".rptPersonWho") && (card.querySelector(".rptPersonWho").value = norm(row?.who));
      card.querySelector(".rptPersonPosition") && (card.querySelector(".rptPersonPosition").value = norm(row?.position));
      card.querySelector(".rptPersonPositionOther") && (card.querySelector(".rptPersonPositionOther").value = norm(row?.positionOther));
      card.querySelector(".rptPersonDepartment") && (card.querySelector(".rptPersonDepartment").value = norm(row?.department));
      card.querySelector(".rptPersonDepartmentOther") && (card.querySelector(".rptPersonDepartmentOther").value = norm(row?.departmentOther));
      card.querySelector(".rptPersonRemark") && (card.querySelector(".rptPersonRemark").value = norm(row?.remark));
      card.querySelector(".rptPersonRemarkOther") && (card.querySelector(".rptPersonRemarkOther").value = norm(row?.remarkOther));

      bindSelectOtherInRow(card, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
      bindSelectOtherInRow(card, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
      bindSelectOtherInRow(card, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
      refreshSingleCardUi(card);
      setCardCollapsed(card, true);
    });

    if (!list.length) {
      appendRow("rptPersonList", createPersonRowHtml(1), "ผู้เกี่ยวข้อง");
    }
  }

  function refillStepTakenList(rows) {
    resetList("rptStepTakenList", "การดำเนินการ");
    const list = Array.isArray(rows) ? rows : [];

    list.forEach((row, idx) => {
      appendRow("rptStepTakenList", createStepTakenRowHtml(idx + 1), "การดำเนินการ");
      const cards = Array.from(document.querySelectorAll("#rptStepTakenList .rptRepeatCard"));
      const card = cards[cards.length - 1];
      if (!card) return;

      card.querySelector(".rptStepActionType") && (card.querySelector(".rptStepActionType").value = norm(row?.actionType));
      card.querySelector(".rptStepActionTypeOther") && (card.querySelector(".rptStepActionTypeOther").value = norm(row?.actionTypeOther));
      card.querySelector(".rptAlcoholResult") && (card.querySelector(".rptAlcoholResult").value = norm(row?.alcoholResult));
      card.querySelector(".rptAlcoholMgPercent") && (card.querySelector(".rptAlcoholMgPercent").value = norm(row?.alcoholMgPercent));
      card.querySelector(".rptDrugConfirmed") && (card.querySelector(".rptDrugConfirmed").value = norm(row?.drugConfirmed));
      card.querySelector(".rptDrugShortDetail") && (card.querySelector(".rptDrugShortDetail").value = norm(row?.drugShortDetail));
      card.querySelector(".rptStepDetail") && (card.querySelector(".rptStepDetail").value = norm(row?.detail));

      bindStepTakenRow(card);
      refreshSingleCardUi(card);
      setCardCollapsed(card, true);
    });

    if (!list.length) {
      appendRow("rptStepTakenList", createStepTakenRowHtml(1), "การดำเนินการ");
    }
  }

  function refillImageList(rows) {
    resetList("rptImageList", "รูปภาพ");
    const list = Array.isArray(rows) ? rows : [];

    list.forEach((row, idx) => {
      appendRow("rptImageList", createImageRowHtml(idx + 1), "รูปภาพ");
      const cards = Array.from(document.querySelectorAll("#rptImageList .rptRepeatCard"));
      const card = cards[cards.length - 1];
      if (!card) return;

      const captionEl = card.querySelector(".rptImageCaption");
      if (captionEl) captionEl.value = norm(row?.caption || row?.detail);

      refreshSingleCardUi(card);
      setCardCollapsed(card, true);
    });

    if (!list.length) {
      appendRow("rptImageList", createImageRowHtml(1), "รูปภาพ");
    }
  }

  function refillReport500RepeatData(data) {
    refillPersonList(data?.involvedPersons || []);
    refillSimpleIndexedList("rptDamageList", data?.damages || [], "damage", "ความเสียหาย", "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม");
    refillStepTakenList(data?.stepTakens || []);
    refillSimpleIndexedList("rptEvidenceList", data?.evidences || [], "evidence", "หลักฐาน", "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม");
    refillSimpleIndexedList("rptCauseList", data?.causes || [], "cause", "สาเหตุ", "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม");
    refillSimpleIndexedList("rptPreventionList", data?.preventions || [], "prevention", "การป้องกัน", "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม");
    refillSimpleIndexedList("rptLearningList", data?.learnings || [], "learning", "ข้อสรุป/บทเรียน", "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม");
    refillImageList(data?.images || []);
  }

  async function loadReportByRefForEdit() {
    const refNo = getRefNo();
    if (!refNo) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้ระบุ Ref",
        text: "กรุณากรอก Ref ก่อน"
      });
      return;
    }

    const res = await fetch(apiUrl(`/loadByRef?type=report500&refNo=${encodeURIComponent(refNo)}`), {
      method: "GET",
      cache: "no-store"
    });

    const json = await res.text().then((t) => {
      try { return JSON.parse(t); } catch (_) { return {}; }
    });

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    applyLoadedReport500Data(json.data || {});
  }

  function applyLoadedReport500Data(data) {
    if (!data) return;

    const refText = String(data.refNo || "");
    const m = refText.match(/^(\d+)[\-\/](\d{4})$/);
    if (m) {
      if ($("rptRefNo")) $("rptRefNo").value = m[1];
      if ($("rptRefYear")) $("rptRefYear").value = m[2];
    }

    setReadonlyValue("rptReportedBy", norm(data.reportedBy || getAuth().name));
    if ($("rptReporterPosition")) $("rptReporterPosition").value = data.reporterPosition || "";
    if ($("rptReporterPositionOther")) $("rptReporterPositionOther").value = data.reporterPositionOther || "";
    if ($("rptReportDate")) $("rptReportDate").value = data.reportDate || "";
    if ($("rptBranch")) $("rptBranch").value = data.branch || "";
    if ($("rptBranchOther")) $("rptBranchOther").value = data.branchOther || "";
    if ($("rptSubject")) $("rptSubject").value = data.subject || "";
    if ($("rptIncidentDate")) $("rptIncidentDate").value = data.incidentDate || "";
    if ($("rptIncidentTime")) $("rptIncidentTime").value = data.incidentTime || "";
    if ($("rptWhereDidItHappen")) $("rptWhereDidItHappen").value = data.whereDidItHappen || "";
    if ($("rptArea")) $("rptArea").value = data.area || "";
    if ($("rptWhatHappen")) $("rptWhatHappen").value = data.whatHappen || "";
    if ($("rptOffenderStatement")) $("rptOffenderStatement").value = data.offenderStatement || "";
    if ($("rptSummaryText")) $("rptSummaryText").value = data.summaryText || "";

    setCheckedMatrixValues("rptReportTypes", data.reportTypes);
    setCheckedMatrixValues("rptUrgencyTypes", data.urgencyTypes);
    setCheckedMatrixValues("rptNotifyTo", data.notifyTo);
    applyReportWhereTypeSelections(data.whereTypeSelections);

    document.querySelectorAll(".rptEmailChk").forEach((el) => {
      el.checked = Array.isArray(data.emailRecipients) && data.emailRecipients.includes(el.value);
    });
    if ($("rptEmailOther")) $("rptEmailOther").value = "";

    refillReport500RepeatData(data);

    state.disciplineLookup = {
      employeeCode: norm(data.disciplineEmployeeCode),
      employeeName: norm(data.disciplineEmployeeName),
      normalizedEmployeeCode: norm(data.disciplineEmployeeCode),
      matchCount: Number(data.disciplineMatchCount || 0),
      records: (() => {
        try {
          if (Array.isArray(data.disciplineReferenceJson)) return data.disciplineReferenceJson;
          if (typeof data.disciplineReferenceJson === "string" && norm(data.disciplineReferenceJson)) return JSON.parse(data.disciplineReferenceJson);
          return [];
        } catch (_) {
          return [];
        }
      })(),
      attached: !!(data.disciplineReferenceJson && String(data.disciplineReferenceJson).length),
      searched: !!(data.disciplineReferenceJson && String(data.disciplineReferenceJson).length)
    };
    updateDisciplineSummaryCard();

    setReportEditMode(data._edit || null);
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

    if (state.editMeta) {
      payload._edit = {
        mode: "update",
        refNo: state.editMeta.refNo || payload.refNo,
        baseRowNumber: state.editMeta.baseRowNumber || "",
        baseRevNo: state.editMeta.baseRevNo || 0,
        inheritImageIds: Array.isArray(state.editMeta.inheritImageIds)
          ? state.editMeta.inheritImageIds
          : [],
        editNote: ""
      };
    }

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
          <div class="swalPillRow">
            <div class="swalPill primary">Ref: ${escapeHtml(payload.refNo || "-")}</div>
            <div class="swalPill">${state.editMeta ? `แก้ไข Rev ${Number(state.editMeta.baseRevNo || 0)} → ใหม่` : "สร้างใหม่"}</div>
            <div class="swalPill">รูป ${images.length}</div>
          </div>
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

      Progress?.activateOnly("validate", 8, "กำลังตรวจสอบข้อมูลรายงาน");
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
        Progress?.markError("pdf", "ไม่สามารถสร้าง PDF ได้", 93);
      }

      Progress?.activateOnly("email", 97, "กำลังตรวจสอบผลการส่งอีเมล");
      await (window.sleepMs ? window.sleepMs(140) : new Promise((r) => setTimeout(r, 140)));

      const emailInfo = typeof window.buildEmailStatusSummary_ === "function"
        ? window.buildEmailStatusSummary_(json)
        : { emailOk: false, emailSkipped: false, emailResult: json?.emailResult || {} };

      if (emailInfo.emailOk) {
        Progress?.markDone("email", 100, emailInfo.emailModeText || "ส่งอีเมลเรียบร้อย");
        Progress?.success("บันทึกสำเร็จ", "ข้อมูล Report ถูกบันทึกเรียบร้อยแล้ว");
      } else if (emailInfo.emailSkipped) {
        Progress?.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
        Progress?.success("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
      } else {
        Progress?.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
        Progress?.success("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
      }

      Progress?.hide(120);

      await Swal.fire({
        icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
        title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
        showConfirmButton: false,
        width: 920,
        html: `
          <div class="swalSummary">
            <div class="swalHero">
              <div class="swalHeroTitle">บันทึกรายงานเรียบร้อยแล้ว</div>
              <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และเอกสาร PDF เรียบร้อย</div>
              <div class="swalPillRow">
                <div class="swalPill primary">Ref: ${escapeHtml(payload.refNo || "-")}</div>
                <div class="swalPill">${json.mode === "update" ? `Rev ${Number(json.revNo || 0)}` : "สร้างใหม่"}</div>
                <div class="swalPill">รูป ${Number((json.imageIds || []).length)}</div>
              </div>
            </div>

            <div class="swalSection">
              <div class="swalSectionTitle">สถานะเอกสาร</div>
              <div class="swalKvGrid">
                <div class="swalKv"><div class="swalKvLabel">เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">Ref No.</div><div class="swalKvValue">${escapeHtml(payload.refNo || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">ขนาด PDF</div><div class="swalKvValue">${escapeHtml(json.pdfSizeText || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">รูปภาพ</div><div class="swalKvValue">${Number((json.imageIds || []).length)}</div></div>
              </div>
            </div>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
              ${
                json.pdfUrl
                  ? `<button type="button" id="btnOpenRptPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
                  : ``
              }
              <button type="button" id="btnCloseRptAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
            </div>
          </div>
        `,
        didOpen: () => {
          const btnOpen = document.getElementById("btnOpenRptPdfAfterSave");
          const btnClose = document.getElementById("btnCloseRptAfterSave");

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
          resetForm();
        }
      });
    } catch (err) {
      console.error(err);
      window.ProgressUI?.markError("save", err?.message || "เกิดข้อผิดพลาด", 58);

      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err?.message || String(err),
        confirmButtonText: "ตกลง"
      });

      window.ProgressUI?.hide(180);
    }
  }

  function resetForm() {
    renderSelect("rptBranch", state.options?.branchList || [], true);
    renderOptionMatrix("rptReportTypes", "rptReportTypes", state.options?.reportTypeList || []);
    renderOptionMatrix("rptUrgencyTypes", "rptUrgencyTypes", state.options?.urgencyList || []);
    renderOptionMatrix("rptNotifyTo", "rptNotifyTo", state.options?.notifyToList || []);

    renderSelect("rptWhereDidItHappen", state.options?.locationList || [], false);
    if ($("rptWhereDidItHappen") && state.options?.whereDidItHappenDefault) {
      $("rptWhereDidItHappen").value = state.options.whereDidItHappenDefault;
    }

    renderWhereTypeSelections();
    renderSelect("rptReporterPosition", state.options?.reporterPositionList || [], true);
    renderEmailSelector();

    setReadonlyValue("rptReportedBy", norm(getAuth().name));
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();
    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptIncidentTime")) $("rptIncidentTime").value = "";

    [
      "rptReporterPositionOther",
      "rptBranchOther",
      "rptSubject",
      "rptWhatHappen",
      "rptArea",
      "rptOffenderStatement",
      "rptSummaryText",
      "rptEmailOther"
    ].forEach((id) => {
      if ($(id)) $(id).value = "";
    });

    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
    bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

    Object.keys(RPT_REPEAT_CONFIG).forEach((listId) => {
      resetList(listId, getRepeatConfig(listId).label);
      ensureRepeatFooterButton(listId);
    });

    appendRow("rptPersonList", createPersonRowHtml(1), "ผู้เกี่ยวข้อง");
    appendRow("rptImageList", createImageRowHtml(1), "รูปภาพ");

    resetDisciplineLookupState();
    resetItemLookupState();
    setReportEditMode(null);
  }

  function bindTopButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);
    $("btnRptReset")?.addEventListener("click", () => resetForm());

    $("btnRptLoadRefForEdit")?.addEventListener("click", async () => {
      try {
        await loadReportByRefForEdit();
        await Swal.fire({
          icon: "success",
          title: "โหลดข้อมูลสำเร็จ",
          text: "สามารถแก้ไขแล้วบันทึกเป็น revision ใหม่ได้"
        });
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "โหลดข้อมูลไม่สำเร็จ",
          text: err?.message || String(err)
        });
      }
    });

    $("btnRptCancelEditMode")?.addEventListener("click", () => {
      setReportEditMode(null);
    });

    $("btnRptEmailCheckAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
    $("btnRptEmailClearAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));

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

  function bindLookupButtons() {
    if (state.lookupButtonsBound) return;
    state.lookupButtonsBound = true;

    $("btnRptDisciplineLookup")?.addEventListener("click", openDisciplineLookupPopup);
    $("btnRptDisciplineView")?.addEventListener("click", openAttachedDisciplinePreview);
    $("btnRptDisciplineClear")?.addEventListener("click", clearDisciplineLookup);
    $("btnRptItemLookup")?.addEventListener("click", openItemLookupPopup);
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

      renderSelect("rptBranch", state.options.branchList, true);
      renderOptionMatrix("rptReportTypes", "rptReportTypes", state.options.reportTypeList);
      renderOptionMatrix("rptUrgencyTypes", "rptUrgencyTypes", state.options.urgencyList);
      renderOptionMatrix("rptNotifyTo", "rptNotifyTo", state.options.notifyToList);

      renderSelect("rptWhereDidItHappen", state.options.locationList, false);
      if ($("rptWhereDidItHappen") && state.options.whereDidItHappenDefault) {
        $("rptWhereDidItHappen").value = state.options.whereDidItHappenDefault;
      }

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

  window.Report500UI = {
    ensureReady,
    preview,
    submit,
    reset: resetForm
  };
})();
