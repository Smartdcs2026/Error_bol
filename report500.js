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

  function createSimpleIndexedRowHtml(type, index, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
    return `
      <div class="rptRepeatCard" data-type="${escapeHtml(type)}">
        <div class="rptCardHead">
          <div class="rptCardHeadMain">
            <div class="rptCardTitle">${escapeHtml(titleLabel)} <span class="rptRowIndex">${index}</span></div>
            <div class="rptCardSummary">ยังไม่มีข้อมูล</div>
          </div>
          <div class="rptCardHeadActions">
            <button type="button" class="btn ghost rptCollapseRow">ย่อ</button>
          </div>
        </div>

        <div class="rptCardBody">
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

          <div class="panelActions">
            <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
          </div>
        </div>
      </div>
    `;
  }

  function createPersonRowHtml(index) {
    const positionOptions = buildOptionsHtml(state.options?.personPositionList, true);
    const departmentOptions = buildOptionsHtml(state.options?.personDepartmentList, true);
    const remarkOptions = buildOptionsHtml(state.options?.personRemarkList, true);

    return `
      <div class="rptRepeatCard" data-type="person">
        <div class="rptCardHead">
          <div class="rptCardHeadMain">
            <div class="rptCardTitle">ผู้เกี่ยวข้อง <span class="rptRowIndex">${index}</span></div>
            <div class="rptCardSummary">ยังไม่มีข้อมูล</div>
          </div>
          <div class="rptCardHeadActions">
            <button type="button" class="btn ghost rptCollapseRow">ย่อ</button>
          </div>
        </div>

        <div class="rptCardBody">
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
        </div>
      </div>
    `;
  }

  function createStepTakenRowHtml(index) {
    const actionOptions = buildOptionsHtml(state.options?.actionTypeList, true);

    return `
      <div class="rptRepeatCard" data-type="stepTaken">
        <div class="rptCardHead">
          <div class="rptCardHeadMain">
            <div class="rptCardTitle">การดำเนินการ <span class="rptRowIndex">${index}</span></div>
            <div class="rptCardSummary">ยังไม่มีข้อมูล</div>
          </div>
          <div class="rptCardHeadActions">
            <button type="button" class="btn ghost rptCollapseRow">ย่อ</button>
          </div>
        </div>

        <div class="rptCardBody">
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
        </div>
      </div>
    `;
  }

  function createImageRowHtml(index) {
    return `
      <div class="rptRepeatCard" data-type="image">
        <div class="rptCardHead">
          <div class="rptCardHeadMain">
            <div class="rptCardTitle">รูปภาพ <span class="rptRowIndex">${index}</span></div>
            <div class="rptCardSummary">ยังไม่มีข้อมูล</div>
          </div>
          <div class="rptCardHeadActions">
            <button type="button" class="btn ghost rptCollapseRow">ย่อ</button>
          </div>
        </div>

        <div class="rptCardBody">
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
        </div>
      </div>
    `;
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
  }

  function getVisibleUsableFields(node) {
    if (!node) return [];

    return Array.from(node.querySelectorAll("input, select, textarea")).filter((el) => {
      if (!el) return false;

      const type = String(el.type || "").toLowerCase();
      if (type === "hidden" || type === "button" || type === "submit" || type === "reset") return false;
      if (el.disabled) return false;

      const hiddenByClass = !!el.closest(".hidden");
      if (hiddenByClass) return false;

      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;

      return true;
    });
  }

  function isFieldFilled(el, rowNode) {
    if (!el) return false;

    const tag = String(el.tagName || "").toUpperCase();
    const type = String(el.type || "").toLowerCase();

    if (type === "file") {
      if (el.files && el.files.length > 0) return true;
      const row = rowNode || el.closest(".rptRepeatCard") || el.closest(".rptBlock");
      if (row && row.querySelector(".rptImagePreview:not(.hidden)")) return true;
      return false;
    }

    if (type === "checkbox" || type === "radio") {
      return !!el.checked;
    }

    const val = String(el.value || "").trim();
    if (!val) return false;

    if (tag === "SELECT" && (val === "" || val === "-- เลือก --")) return false;

    return true;
  }

  function getRowStatus(node) {
    if (!node) return "empty";

    const fields = getVisibleUsableFields(node);
    if (!fields.length) return "empty";

    const total = fields.length;
    let filled = 0;

    fields.forEach((el) => {
      if (isFieldFilled(el, node)) filled += 1;
    });

    if (filled === 0) return "empty";
    if (filled < total) return "partial";
    return "complete";
  }

  function updateRowFilledState(node) {
    if (!node) return;

    const root = getCardRoot(node);
    if (!root) return;

    const status = getRowStatus(root);

    root.classList.remove("is-partial", "is-complete");

    if (status === "partial") {
      root.classList.add("is-partial");
    } else if (status === "complete") {
      root.classList.add("is-complete");
    } else {
      root.classList.remove("is-collapsed");
    }

    updateRowSummary(root);
    updateCollapseButtonState(root);
  }

  function bindRowFilledState(node) {
    if (!node) return;

    const fields = node.querySelectorAll("input, select, textarea");
    fields.forEach((el) => {
      el.addEventListener("input", () => updateRowFilledState(node));
      el.addEventListener("change", () => updateRowFilledState(node));
    });

    updateRowFilledState(node);
  }

  function getCardRoot(node) {
    return node?.closest(".rptRepeatCard") || node?.closest(".rptBlock") || node || null;
  }

  function getCardBody(node) {
    const root = getCardRoot(node);
    return root?.querySelector(".rptCardBody") || null;
  }

  function canCollapseRow(node) {
    const root = getCardRoot(node);
    if (!root) return false;
    return root.classList.contains("is-complete");
  }

  function updateCollapseButtonState(node) {
    const root = getCardRoot(node);
    if (!root) return;

    const btn = root.querySelector(".rptCollapseRow");
    if (!btn) return;

    const complete = root.classList.contains("is-complete");
    const collapsed = root.classList.contains("is-collapsed");

    btn.disabled = !complete;
    btn.classList.toggle("is-disabled", !complete);

    if (!complete) {
      btn.textContent = "ย่อ";
      root.classList.remove("is-collapsed");
      return;
    }

    btn.textContent = collapsed ? "ขยาย" : "ย่อ";
  }

  function toggleRowCollapse(node, forceCollapsed = null) {
    const root = getCardRoot(node);
    if (!root) return;

    if (!canCollapseRow(root)) {
      root.classList.remove("is-collapsed");
      updateCollapseButtonState(root);
      return;
    }

    const nextState = (forceCollapsed == null)
      ? !root.classList.contains("is-collapsed")
      : !!forceCollapsed;

    root.classList.toggle("is-collapsed", nextState);
    updateCollapseButtonState(root);
  }

  function collapsePreviousCompletedRow(fromButtonOrListId) {
    let listRoot = null;
    let currentCard = null;

    if (typeof fromButtonOrListId === "string") {
      listRoot = $(fromButtonOrListId);
    } else {
      currentCard = getCardRoot(fromButtonOrListId);
      listRoot = currentCard?.parentElement || null;
    }

    if (!listRoot) return;

    let target = null;

    if (currentCard) {
      target = currentCard;
    } else {
      const cards = listRoot.querySelectorAll(".rptRepeatCard, .rptBlock");
      target = cards.length ? cards[cards.length - 1] : null;
    }

    if (!target) return;
    if (!target.classList.contains("is-complete")) return;

    toggleRowCollapse(target, true);
  }

  function buildRowSummary(node) {
    const root = getCardRoot(node);
    if (!root) return "";

    const type = String(root.getAttribute("data-type") || "");
    let summary = "";

    if (type === "person") {
      const who = String(root.querySelector(".rptPersonWho")?.value || "").trim();
      const pos = String(root.querySelector(".rptPersonPosition")?.value || "").trim();
      const dep = String(root.querySelector(".rptPersonDepartment")?.value || "").trim();
      summary = [who, pos, dep].filter(Boolean).join(" • ");
    } else if (type === "stepTaken") {
      const action = String(root.querySelector(".rptStepActionType")?.value || "").trim();
      const detail = String(root.querySelector(".rptStepDetail")?.value || "").trim();
      summary = action || detail;
    } else if (type === "image") {
      const caption = String(root.querySelector(".rptImageCaption")?.value || "").trim();
      const meta = String(root.querySelector(".rptImageMeta")?.textContent || "").trim();
      summary = caption || meta;
    } else {
      const title = String(root.querySelector(".rptIdxTitle")?.value || "").trim();
      const detail = String(root.querySelector(".rptIdxDetail")?.value || "").trim();
      summary = title || detail;
    }

    return summary || "มีข้อมูลแล้ว";
  }

  function updateRowSummary(node) {
    const root = getCardRoot(node);
    if (!root) return;

    const summaryEl = root.querySelector(".rptCardSummary");
    if (!summaryEl) return;

    summaryEl.textContent = buildRowSummary(root);
  }

  function bindRowSummary(node) {
    const root = getCardRoot(node);
    if (!root) return;

    root.querySelectorAll("input, select, textarea").forEach((el) => {
      el.addEventListener("input", () => updateRowSummary(root));
      el.addEventListener("change", () => updateRowSummary(root));
    });

    updateRowSummary(root);
  }

   function updateRowFilledState(node) {
    if (!node) return;

    const root = getCardRoot(node);
    if (!root) return;

    const status = getRowStatus(root);

    root.classList.remove("is-partial", "is-complete");

    if (status === "partial") {
      root.classList.add("is-partial");
    } else if (status === "complete") {
      root.classList.add("is-complete");
    } else {
      root.classList.remove("is-collapsed");
    }

    updateRowSummary(root);
    updateCollapseButtonState(root);
  }

  function bindRowFilledState(node) {
    if (!node) return;

    const fields = node.querySelectorAll("input, select, textarea");
    fields.forEach((el) => {
      el.addEventListener("input", () => updateRowFilledState(node));
      el.addEventListener("change", () => updateRowFilledState(node));
    });

    updateRowFilledState(node);
  }

  function bindDynamicRow(node) {
    if (!node) return;

    const root = getCardRoot(node);
    const head = root.querySelector(".rptCardHead");
    const collapseBtn = root.querySelector(".rptCollapseRow");

    root.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
      if (root.getAttribute("data-type") === "image") {
        clearRptEditedImageState(root);
      } else {
        const img = root.querySelector(".rptImagePreview");
        if (img && img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
        }
      }

      const parentId = root.parentElement?.id || "";
      root.remove();

      if (parentId) {
        refreshRowIndex(parentId);
        toggleEmptyState(parentId, emptyStateLabelFor(parentId));
      }
    });

    collapseBtn?.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleRowCollapse(root);
    });

    head?.addEventListener("click", (ev) => {
      const clickedControl = ev.target.closest("button, input, select, textarea, label, a");
      if (clickedControl) return;

      if (root.classList.contains("is-collapsed")) {
        toggleRowCollapse(root, false);
      }
    });

    if (root.getAttribute("data-type") === "person") {
      bindSelectOtherInRow(root, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
      bindSelectOtherInRow(root, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
      bindSelectOtherInRow(root, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
    }

    if (root.getAttribute("data-type") === "stepTaken") {
      bindStepTakenRow(root);
    }

    if (root.getAttribute("data-type") === "image") {
      bindImageRow(root);
    }

    bindRowSummary(root);
    bindRowFilledState(root);
    updateCollapseButtonState(root);
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
    const alcoholMg = node.querySelector(".rptAlcoholMgPercent");

    const drugConfirmedWrap = node.querySelector(".rptDrugConfirmedWrap");
    const drugConfirmed = node.querySelector(".rptDrugConfirmed");
    const drugDetailWrap = node.querySelector(".rptDrugDetailWrap");
    const drugDetail = node.querySelector(".rptDrugShortDetail");

    const sync = () => {
      const typeValue = String(typeEl?.value || "").trim();
      const isAlcohol = /แอลกอฮอล์/i.test(typeValue);
      const isDrug = /สารเสพติด|เมทแอเฟตามีน/i.test(typeValue);
      const showOther = isOther(typeValue);

      otherWrap?.classList.toggle("hidden", !showOther);
      if (!showOther && otherInput) otherInput.value = "";

      alcoholWrap?.classList.toggle("hidden", !isAlcohol);
      alcoholMgWrap?.classList.toggle("hidden", !isAlcohol);
      if (!isAlcohol) {
        if (alcoholResult) alcoholResult.value = "";
        if (alcoholMg) alcoholMg.value = "";
      }

      drugConfirmedWrap?.classList.toggle("hidden", !isDrug);
      drugDetailWrap?.classList.toggle("hidden", !isDrug);
      if (!isDrug) {
        if (drugConfirmed) drugConfirmed.value = "";
        if (drugDetail) drugDetail.value = "";
      }
    };

    typeEl?.addEventListener("change", sync);
    sync();
  }

  function bindImageRow(node) {
    const fileInput = node.querySelector(".rptImageFile");
    const editBtn = node.querySelector(".rptEditImageBtn");

    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!file) {
        clearRptEditedImageState(node);
        updateRowFilledState(node);
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
        updateRowFilledState(node);
        return;
      }

      RPT_EDITED_IMAGE_STORE.delete(fileInput);
      updateRptImagePreview(node, file, buildRptEditedImageMeta(file, false));
      updateRowFilledState(node);
    });

    editBtn?.addEventListener("click", async () => {
      await openRptImageEditor(node);
      updateRowFilledState(node);
    });
  }

  function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;

    root.querySelectorAll(".rptRepeatCard").forEach((card, idx) => {
      const indexEl = card.querySelector(".rptRowIndex");
      if (indexEl) indexEl.textContent = String(idx + 1);
    });
  }

  function emptyStateLabelFor(listId) {
    const map = {
      rptPersonList: "ผู้เกี่ยวข้อง",
      rptDamageList: "ความเสียหาย",
      rptStepTakenList: "การดำเนินการ",
      rptEvidenceList: "หลักฐาน",
      rptCauseList: "สาเหตุ",
      rptPreventionList: "การป้องกัน",
      rptLearningList: "ข้อสรุป/บทเรียน",
      rptImageList: "รูปภาพ"
    };
    return map[listId] || "รายการ";
  }

  function toggleEmptyState(listId, label) {
    const root = $(listId);
    if (!root) return;

    const cards = root.querySelectorAll(".rptRepeatCard");
    const hasItems = cards.length > 0;

    let empty = root.parentElement?.querySelector(".rptEmptyState");
    if (!hasItems) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "rptEmptyState";
        root.parentElement?.appendChild(empty);
      }
      empty.textContent = `ยังไม่มี${label}`;
      empty.classList.remove("hidden");
    } else if (empty) {
      empty.classList.add("hidden");
    }
  }

  function resetDisciplineLookupState() {
    state.disciplineLookup = createEmptyDisciplineLookupState();

    if ($("rptDisciplineEmployeeCode")) $("rptDisciplineEmployeeCode").value = "";
    if ($("rptDisciplineEmployeeName")) $("rptDisciplineEmployeeName").value = "";
    if ($("rptDisciplineResult")) $("rptDisciplineResult").innerHTML = "";
    if ($("rptDisciplineAttach")) $("rptDisciplineAttach").checked = false;
  }

  function resetItemLookupState() {
    state.itemLookup = createEmptyItemLookupState();

    if ($("rptItemLookupInput")) $("rptItemLookupInput").value = "";
    if ($("rptItemLookupResult")) $("rptItemLookupResult").innerHTML = "";
  }

  function resetForm() {
    if ($("rptRefNo")) $("rptRefNo").value = "";
    if ($("rptReportedBy")) $("rptReportedBy").value = norm(getAuth().name);
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();

    if ($("rptBranch")) $("rptBranch").value = "";
    if ($("rptBranchOther")) $("rptBranchOther").value = "";
    if ($("rptSubject")) $("rptSubject").value = "";

    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptIncidentTime")) $("rptIncidentTime").value = "";
    if ($("rptWhereDidItHappen")) {
      $("rptWhereDidItHappen").value = state.options?.whereDidItHappenDefault || "";
    }
    if ($("rptArea")) $("rptArea").value = "";
    if ($("rptWhatHappen")) $("rptWhatHappen").value = "";
    if ($("rptReporterPosition")) $("rptReporterPosition").value = "";
    if ($("rptReporterPositionOther")) $("rptReporterPositionOther").value = "";
    if ($("rptOffenderStatement")) $("rptOffenderStatement").value = "";
    if ($("rptSummaryText")) $("rptSummaryText").value = "";
    if ($("rptEmailOther")) $("rptEmailOther").value = "";

    document.querySelectorAll('#rptReportTypes input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll('#rptUrgencyTypes input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll('#rptNotifyTo input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll(".rptEmailChk").forEach((el) => el.checked = false);

    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeChk").forEach((el) => el.checked = false);
    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeSuffix").forEach((el) => el.value = "");
    document.querySelectorAll("#rptWhereTypeSelections .optionChoiceOther").forEach((el) => el.classList.add("hidden"));

    if ($("rptPersonList")) $("rptPersonList").innerHTML = "";
    if ($("rptDamageList")) $("rptDamageList").innerHTML = "";
    if ($("rptStepTakenList")) $("rptStepTakenList").innerHTML = "";
    if ($("rptEvidenceList")) $("rptEvidenceList").innerHTML = "";
    if ($("rptCauseList")) $("rptCauseList").innerHTML = "";
    if ($("rptPreventionList")) $("rptPreventionList").innerHTML = "";
    if ($("rptLearningList")) $("rptLearningList").innerHTML = "";
    document.querySelectorAll("#rptImageList .rptRepeatCard").forEach((row) => {
      clearRptEditedImageState(row);
    });
    if ($("rptImageList")) $("rptImageList").innerHTML = "";

    toggleEmptyState("rptPersonList", "ผู้เกี่ยวข้อง");
    toggleEmptyState("rptDamageList", "ความเสียหาย");
    toggleEmptyState("rptStepTakenList", "การดำเนินการ");
    toggleEmptyState("rptEvidenceList", "หลักฐาน");
    toggleEmptyState("rptCauseList", "สาเหตุ");
    toggleEmptyState("rptPreventionList", "การป้องกัน");
    toggleEmptyState("rptLearningList", "ข้อสรุป/บทเรียน");
    toggleEmptyState("rptImageList", "รูปภาพ");

    appendRow("rptPersonList", createPersonRowHtml(1), "ผู้เกี่ยวข้อง");
    appendRow("rptImageList", createImageRowHtml(1), "รูปภาพ");

    resetDisciplineLookupState();
    resetItemLookupState();
  }

  function bindTopButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);

    $("btnRptEmailCheckAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
    $("btnRptEmailClearAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));

    $("btnRptAddPerson")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptPersonList");
      const idx = document.querySelectorAll("#rptPersonList .rptRepeatCard").length + 1;
      appendRow("rptPersonList", createPersonRowHtml(idx), "ผู้เกี่ยวข้อง");
    });

    $("btnRptAddDamage")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptDamageList");
      const idx = document.querySelectorAll("#rptDamageList .rptRepeatCard").length + 1;
      appendRow(
        "rptDamageList",
        createSimpleIndexedRowHtml("damage", idx, "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม"),
        "ความเสียหาย"
      );
    });

    $("btnRptAddStepTaken")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptStepTakenList");
      const idx = document.querySelectorAll("#rptStepTakenList .rptRepeatCard").length + 1;
      appendRow("rptStepTakenList", createStepTakenRowHtml(idx), "การดำเนินการ");
    });

    $("btnRptAddEvidence")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptEvidenceList");
      const idx = document.querySelectorAll("#rptEvidenceList .rptRepeatCard").length + 1;
      appendRow(
        "rptEvidenceList",
        createSimpleIndexedRowHtml("evidence", idx, "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม"),
        "หลักฐาน"
      );
    });

    $("btnRptAddCause")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptCauseList");
      const idx = document.querySelectorAll("#rptCauseList .rptRepeatCard").length + 1;
      appendRow(
        "rptCauseList",
        createSimpleIndexedRowHtml("cause", idx, "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม"),
        "สาเหตุ"
      );
    });

    $("btnRptAddPrevention")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptPreventionList");
      const idx = document.querySelectorAll("#rptPreventionList .rptRepeatCard").length + 1;
      appendRow(
        "rptPreventionList",
        createSimpleIndexedRowHtml("prevention", idx, "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม"),
        "การป้องกัน"
      );
    });

    $("btnRptAddLearning")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptLearningList");
      const idx = document.querySelectorAll("#rptLearningList .rptRepeatCard").length + 1;
      appendRow(
        "rptLearningList",
        createSimpleIndexedRowHtml("learning", idx, "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม"),
        "ข้อสรุป/บทเรียน"
      );
    });

    $("btnRptAddImage")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptImageList");
      const idx = document.querySelectorAll("#rptImageList .rptRepeatCard").length + 1;
      appendRow("rptImageList", createImageRowHtml(idx), "รูปภาพ");
    });

    $("btnRptReset")?.addEventListener("click", resetForm);
  }
    function updateRowFilledState(node) {
    if (!node) return;

    const root = getCardRoot(node);
    if (!root) return;

    const status = getRowStatus(root);

    root.classList.remove("is-partial", "is-complete");

    if (status === "partial") {
      root.classList.add("is-partial");
    } else if (status === "complete") {
      root.classList.add("is-complete");
    } else {
      root.classList.remove("is-collapsed");
    }

    updateRowSummary(root);
    updateCollapseButtonState(root);
  }

  function bindRowFilledState(node) {
    if (!node) return;

    const fields = node.querySelectorAll("input, select, textarea");
    fields.forEach((el) => {
      el.addEventListener("input", () => updateRowFilledState(node));
      el.addEventListener("change", () => updateRowFilledState(node));
    });

    updateRowFilledState(node);
  }

  function bindDynamicRow(node) {
    if (!node) return;

    const root = getCardRoot(node);
    const head = root.querySelector(".rptCardHead");
    const collapseBtn = root.querySelector(".rptCollapseRow");

    root.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
      if (root.getAttribute("data-type") === "image") {
        clearRptEditedImageState(root);
      } else {
        const img = root.querySelector(".rptImagePreview");
        if (img && img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
        }
      }

      const parentId = root.parentElement?.id || "";
      root.remove();

      if (parentId) {
        refreshRowIndex(parentId);
        toggleEmptyState(parentId, emptyStateLabelFor(parentId));
      }
    });

    collapseBtn?.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleRowCollapse(root);
    });

    head?.addEventListener("click", (ev) => {
      const clickedControl = ev.target.closest("button, input, select, textarea, label, a");
      if (clickedControl) return;

      if (root.classList.contains("is-collapsed")) {
        toggleRowCollapse(root, false);
      }
    });

    if (root.getAttribute("data-type") === "person") {
      bindSelectOtherInRow(root, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
      bindSelectOtherInRow(root, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
      bindSelectOtherInRow(root, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
    }

    if (root.getAttribute("data-type") === "stepTaken") {
      bindStepTakenRow(root);
    }

    if (root.getAttribute("data-type") === "image") {
      bindImageRow(root);
    }

    bindRowSummary(root);
    bindRowFilledState(root);
    updateCollapseButtonState(root);
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
    const alcoholMg = node.querySelector(".rptAlcoholMgPercent");

    const drugConfirmedWrap = node.querySelector(".rptDrugConfirmedWrap");
    const drugConfirmed = node.querySelector(".rptDrugConfirmed");
    const drugDetailWrap = node.querySelector(".rptDrugDetailWrap");
    const drugDetail = node.querySelector(".rptDrugShortDetail");

    const sync = () => {
      const typeValue = String(typeEl?.value || "").trim();
      const isAlcohol = /แอลกอฮอล์/i.test(typeValue);
      const isDrug = /สารเสพติด|เมทแอเฟตามีน/i.test(typeValue);
      const showOther = isOther(typeValue);

      otherWrap?.classList.toggle("hidden", !showOther);
      if (!showOther && otherInput) otherInput.value = "";

      alcoholWrap?.classList.toggle("hidden", !isAlcohol);
      alcoholMgWrap?.classList.toggle("hidden", !isAlcohol);
      if (!isAlcohol) {
        if (alcoholResult) alcoholResult.value = "";
        if (alcoholMg) alcoholMg.value = "";
      }

      drugConfirmedWrap?.classList.toggle("hidden", !isDrug);
      drugDetailWrap?.classList.toggle("hidden", !isDrug);
      if (!isDrug) {
        if (drugConfirmed) drugConfirmed.value = "";
        if (drugDetail) drugDetail.value = "";
      }
    };

    typeEl?.addEventListener("change", sync);
    sync();
  }

  function bindImageRow(node) {
    const fileInput = node.querySelector(".rptImageFile");
    const editBtn = node.querySelector(".rptEditImageBtn");

    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!file) {
        clearRptEditedImageState(node);
        updateRowFilledState(node);
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
        updateRowFilledState(node);
        return;
      }

      RPT_EDITED_IMAGE_STORE.delete(fileInput);
      updateRptImagePreview(node, file, buildRptEditedImageMeta(file, false));
      updateRowFilledState(node);
    });

    editBtn?.addEventListener("click", async () => {
      await openRptImageEditor(node);
      updateRowFilledState(node);
    });
  }

  function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;

    root.querySelectorAll(".rptRepeatCard").forEach((card, idx) => {
      const indexEl = card.querySelector(".rptRowIndex");
      if (indexEl) indexEl.textContent = String(idx + 1);
    });
  }

  function emptyStateLabelFor(listId) {
    const map = {
      rptPersonList: "ผู้เกี่ยวข้อง",
      rptDamageList: "ความเสียหาย",
      rptStepTakenList: "การดำเนินการ",
      rptEvidenceList: "หลักฐาน",
      rptCauseList: "สาเหตุ",
      rptPreventionList: "การป้องกัน",
      rptLearningList: "ข้อสรุป/บทเรียน",
      rptImageList: "รูปภาพ"
    };
    return map[listId] || "รายการ";
  }

  function toggleEmptyState(listId, label) {
    const root = $(listId);
    if (!root) return;

    const cards = root.querySelectorAll(".rptRepeatCard");
    const hasItems = cards.length > 0;

    let empty = root.parentElement?.querySelector(".rptEmptyState");
    if (!hasItems) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "rptEmptyState";
        root.parentElement?.appendChild(empty);
      }
      empty.textContent = `ยังไม่มี${label}`;
      empty.classList.remove("hidden");
    } else if (empty) {
      empty.classList.add("hidden");
    }
  }

  function resetDisciplineLookupState() {
    state.disciplineLookup = createEmptyDisciplineLookupState();

    if ($("rptDisciplineEmployeeCode")) $("rptDisciplineEmployeeCode").value = "";
    if ($("rptDisciplineEmployeeName")) $("rptDisciplineEmployeeName").value = "";
    if ($("rptDisciplineResult")) $("rptDisciplineResult").innerHTML = "";
    if ($("rptDisciplineAttach")) $("rptDisciplineAttach").checked = false;
  }

  function resetItemLookupState() {
    state.itemLookup = createEmptyItemLookupState();

    if ($("rptItemLookupInput")) $("rptItemLookupInput").value = "";
    if ($("rptItemLookupResult")) $("rptItemLookupResult").innerHTML = "";
  }

  function resetForm() {
    if ($("rptRefNo")) $("rptRefNo").value = "";
    if ($("rptReportedBy")) $("rptReportedBy").value = norm(getAuth().name);
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();

    if ($("rptBranch")) $("rptBranch").value = "";
    if ($("rptBranchOther")) $("rptBranchOther").value = "";
    if ($("rptSubject")) $("rptSubject").value = "";

    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptIncidentTime")) $("rptIncidentTime").value = "";
    if ($("rptWhereDidItHappen")) {
      $("rptWhereDidItHappen").value = state.options?.whereDidItHappenDefault || "";
    }
    if ($("rptArea")) $("rptArea").value = "";
    if ($("rptWhatHappen")) $("rptWhatHappen").value = "";
    if ($("rptReporterPosition")) $("rptReporterPosition").value = "";
    if ($("rptReporterPositionOther")) $("rptReporterPositionOther").value = "";
    if ($("rptOffenderStatement")) $("rptOffenderStatement").value = "";
    if ($("rptSummaryText")) $("rptSummaryText").value = "";
    if ($("rptEmailOther")) $("rptEmailOther").value = "";

    document.querySelectorAll('#rptReportTypes input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll('#rptUrgencyTypes input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll('#rptNotifyTo input[type="checkbox"]').forEach((el) => el.checked = false);
    document.querySelectorAll(".rptEmailChk").forEach((el) => el.checked = false);

    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeChk").forEach((el) => el.checked = false);
    document.querySelectorAll("#rptWhereTypeSelections .rptWhereTypeSuffix").forEach((el) => el.value = "");
    document.querySelectorAll("#rptWhereTypeSelections .optionChoiceOther").forEach((el) => el.classList.add("hidden"));

    if ($("rptPersonList")) $("rptPersonList").innerHTML = "";
    if ($("rptDamageList")) $("rptDamageList").innerHTML = "";
    if ($("rptStepTakenList")) $("rptStepTakenList").innerHTML = "";
    if ($("rptEvidenceList")) $("rptEvidenceList").innerHTML = "";
    if ($("rptCauseList")) $("rptCauseList").innerHTML = "";
    if ($("rptPreventionList")) $("rptPreventionList").innerHTML = "";
    if ($("rptLearningList")) $("rptLearningList").innerHTML = "";
    document.querySelectorAll("#rptImageList .rptRepeatCard").forEach((row) => {
      clearRptEditedImageState(row);
    });
    if ($("rptImageList")) $("rptImageList").innerHTML = "";

    toggleEmptyState("rptPersonList", "ผู้เกี่ยวข้อง");
    toggleEmptyState("rptDamageList", "ความเสียหาย");
    toggleEmptyState("rptStepTakenList", "การดำเนินการ");
    toggleEmptyState("rptEvidenceList", "หลักฐาน");
    toggleEmptyState("rptCauseList", "สาเหตุ");
    toggleEmptyState("rptPreventionList", "การป้องกัน");
    toggleEmptyState("rptLearningList", "ข้อสรุป/บทเรียน");
    toggleEmptyState("rptImageList", "รูปภาพ");

    appendRow("rptPersonList", createPersonRowHtml(1), "ผู้เกี่ยวข้อง");
    appendRow("rptImageList", createImageRowHtml(1), "รูปภาพ");

    resetDisciplineLookupState();
    resetItemLookupState();
  }

  function bindTopButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);

    $("btnRptEmailCheckAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
    $("btnRptEmailClearAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));

    $("btnRptAddPerson")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptPersonList");
      const idx = document.querySelectorAll("#rptPersonList .rptRepeatCard").length + 1;
      appendRow("rptPersonList", createPersonRowHtml(idx), "ผู้เกี่ยวข้อง");
    });

    $("btnRptAddDamage")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptDamageList");
      const idx = document.querySelectorAll("#rptDamageList .rptRepeatCard").length + 1;
      appendRow(
        "rptDamageList",
        createSimpleIndexedRowHtml("damage", idx, "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม"),
        "ความเสียหาย"
      );
    });

    $("btnRptAddStepTaken")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptStepTakenList");
      const idx = document.querySelectorAll("#rptStepTakenList .rptRepeatCard").length + 1;
      appendRow("rptStepTakenList", createStepTakenRowHtml(idx), "การดำเนินการ");
    });

    $("btnRptAddEvidence")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptEvidenceList");
      const idx = document.querySelectorAll("#rptEvidenceList .rptRepeatCard").length + 1;
      appendRow(
        "rptEvidenceList",
        createSimpleIndexedRowHtml("evidence", idx, "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม"),
        "หลักฐาน"
      );
    });

    $("btnRptAddCause")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptCauseList");
      const idx = document.querySelectorAll("#rptCauseList .rptRepeatCard").length + 1;
      appendRow(
        "rptCauseList",
        createSimpleIndexedRowHtml("cause", idx, "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม"),
        "สาเหตุ"
      );
    });

    $("btnRptAddPrevention")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptPreventionList");
      const idx = document.querySelectorAll("#rptPreventionList .rptRepeatCard").length + 1;
      appendRow(
        "rptPreventionList",
        createSimpleIndexedRowHtml("prevention", idx, "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม"),
        "การป้องกัน"
      );
    });

    $("btnRptAddLearning")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptLearningList");
      const idx = document.querySelectorAll("#rptLearningList .rptRepeatCard").length + 1;
      appendRow(
        "rptLearningList",
        createSimpleIndexedRowHtml("learning", idx, "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม"),
        "ข้อสรุป/บทเรียน"
      );
    });

    $("btnRptAddImage")?.addEventListener("click", () => {
      collapsePreviousCompletedRow("rptImageList");
      const idx = document.querySelectorAll("#rptImageList .rptRepeatCard").length + 1;
      appendRow("rptImageList", createImageRowHtml(idx), "รูปภาพ");
    });

    $("btnRptReset")?.addEventListener("click", resetForm);
  }
    function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;

    const cards = Array.from(root.querySelectorAll(".rptRepeatCard"));
    cards.forEach((card, idx) => {
      const index = idx + 1;
      const badge = card.querySelector(".rptRowIndex");
      if (badge) badge.textContent = String(index);

      const headTitle = card.querySelector(".rptCardHead > div:first-child");
      if (headTitle) {
        const type = card.getAttribute("data-type");
        let label = "รายการ";
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

  function emptyStateLabelFor(listId) {
    const map = {
      rptPersonList: "ผู้เกี่ยวข้อง",
      rptDamageList: "ความเสียหาย",
      rptStepTakenList: "การดำเนินการ",
      rptEvidenceList: "หลักฐาน",
      rptCauseList: "สาเหตุ",
      rptPreventionList: "การป้องกัน",
      rptLearningList: "ข้อสรุป/บทเรียน",
      rptImageList: "รูปภาพ"
    };
    return map[listId] || "รายการ";
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
