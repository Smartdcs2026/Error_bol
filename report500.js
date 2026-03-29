(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    ready: false,
    loading: false,
    buttonsBound: false,
    options: null
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

  function createSimpleIndexedRowHtml(type, index, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
    return `
      <div class="rptRepeatCard" data-type="${escapeHtml(type)}">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">${escapeHtml(titleLabel)} ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

        <div class="gridCompact">
          <div class="field fieldSpan2">
            <label>${escapeHtml(titleLabel)}</label>
            <input class="input rptRowTitle" placeholder="${escapeHtml(titlePlaceholder)}">
          </div>
          <div class="field fieldSpan2">
            <label>${escapeHtml(detailLabel)}</label>
            <textarea class="input rptRowDetail" rows="4" placeholder="${escapeHtml(detailPlaceholder)}"></textarea>
          </div>
        </div>

        <div class="rptRowActions">
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      </div>
    `;
  }

  function createInvolvedPersonRowHtml(index) {
    const positionOptions = buildOptionsHtml(state.options?.personPositionList || [], true);
    const departmentOptions = buildOptionsHtml(state.options?.personDepartmentList || [], true);
    const remarkOptions = buildOptionsHtml(state.options?.personRemarkList || [], true);

    return `
      <div class="rptRepeatCard" data-type="person">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">ผู้เกี่ยวข้อง ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

        <div class="gridCompact">
          <div class="field">
            <label>ชื่อ-นามสกุล</label>
            <input class="input rptPersonName" placeholder="กรอกชื่อ-นามสกุล">
          </div>

          <div class="field">
            <label>รหัสพนักงาน</label>
            <input class="input rptPersonCode" placeholder="กรอกรหัสพนักงาน">
          </div>

          <div class="field">
            <label>ตำแหน่ง</label>
            <select class="input rptPersonPosition">${positionOptions}</select>
          </div>

          <div class="field rptPersonPositionOtherWrap hidden">
            <label>ตำแหน่งอื่นๆ</label>
            <input class="input rptPersonPositionOther" placeholder="ระบุตำแหน่งเพิ่มเติม">
          </div>

          <div class="field">
            <label>แผนก</label>
            <select class="input rptPersonDepartment">${departmentOptions}</select>
          </div>

          <div class="field rptPersonDepartmentOtherWrap hidden">
            <label>แผนกอื่นๆ</label>
            <input class="input rptPersonDepartmentOther" placeholder="ระบุแผนกเพิ่มเติม">
          </div>

          <div class="field">
            <label>หมายเหตุ/สถานะ</label>
            <select class="input rptPersonRemark">${remarkOptions}</select>
          </div>

          <div class="field rptPersonRemarkOtherWrap hidden">
            <label>หมายเหตุอื่นๆ</label>
            <input class="input rptPersonRemarkOther" placeholder="ระบุหมายเหตุเพิ่มเติม">
          </div>
        </div>

        <div class="rptRowActions">
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      </div>
    `;
  }

  function createStepTakenRowHtml(index) {
    const actionTypeOptions = buildOptionsHtml(state.options?.actionTypeList || [], true);

    return `
      <div class="rptRepeatCard" data-type="stepTaken">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">การดำเนินการ ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

        <div class="gridCompact">
          <div class="field">
            <label>ประเภทการดำเนินการ</label>
            <select class="input rptStepActionType">${actionTypeOptions}</select>
          </div>

          <div class="field rptStepActionOtherWrap hidden">
            <label>ระบุการดำเนินการอื่นๆ</label>
            <input class="input rptStepActionOther" placeholder="ระบุการดำเนินการเพิ่มเติม">
          </div>

          <div class="field fieldSpan2">
            <label>รายละเอียด</label>
            <textarea class="input rptStepDetail" rows="4" placeholder="กรอกรายละเอียดการดำเนินการ"></textarea>
          </div>
        </div>

        <div class="rptRowActions">
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      </div>
    `;
  }

  function createImageRowHtml(index) {
    return `
      <div class="rptRepeatCard" data-type="image">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">รูปภาพ ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

        <div class="gridCompact">
          <div class="field">
            <label>เลือกรูปภาพ</label>
            <input type="file" class="rptImageFile" accept="image/*">
            <div class="fieldHint rptImageMeta">ยังไม่เลือกรูปภาพ</div>
          </div>

          <div class="field">
            <label>คำบรรยายภาพ</label>
            <textarea class="rptImageCaption" rows="4" placeholder="อธิบายภาพนี้"></textarea>
          </div>
        </div>

        <div class="rptImagePreviewWrap">
          <div class="rptImagePreviewEmpty">
            ยังไม่ได้เลือกรูปภาพ
          </div>
          <img class="rptImagePreview hidden" alt="preview">
        </div>

        <div class="rptImageActions">
          <button type="button" class="btn ghost rptEditImageBtn" disabled>แก้ไขภาพ</button>
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
        </div>
      </div>
    `;
  }

  function getUploadImageTools() {
    return window.UploadImageTools || {};
  }

  function revokePreviewObjectUrl(img) {
    if (!img) return;
    if (img.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      img.dataset.objectUrl = "";
    }
  }

  function setReportImagePreview(row, file, metaText, isEdited = false) {
    const preview = row?.querySelector(".rptImagePreview");
    const empty = row?.querySelector(".rptImagePreviewEmpty");
    const meta = row?.querySelector(".rptImageMeta");
    const editBtn = row?.querySelector(".rptEditImageBtn");

    if (meta) {
      meta.textContent = metaText || (file ? file.name : "ยังไม่เลือกรูปภาพ");
      meta.classList.toggle("is-edited", !!isEdited);
    }

    if (editBtn) {
      editBtn.disabled = !file;
    }

    if (!preview || !empty) return;

    revokePreviewObjectUrl(preview);

    if (!file) {
      preview.classList.add("hidden");
      preview.removeAttribute("src");
      empty.classList.remove("hidden");
      empty.textContent = "ยังไม่ได้เลือกรูปภาพ";
      return;
    }

    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.dataset.objectUrl = url;
    preview.classList.remove("hidden");
    empty.classList.add("hidden");
  }

  function bindSelectOtherInRow(selectEl, wrapEl, inputEl) {
    if (!selectEl || !wrapEl) return;

    const sync = () => {
      const show = isOther(selectEl.value);
      wrapEl.classList.toggle("hidden", !show);
      if (!show && inputEl) inputEl.value = "";
    };

    selectEl.addEventListener("change", sync);
    sync();
  }

  function bindImageRow(node) {
    const input = node.querySelector(".rptImageFile");
    const editBtn = node.querySelector(".rptEditImageBtn");
    const tools = getUploadImageTools();

    if (!input) return;

    input.addEventListener("change", async () => {
      const f = input.files && input.files[0] ? input.files[0] : null;

      if (typeof tools.clearEditedUploadFile === "function") {
        tools.clearEditedUploadFile(input);
      }

      if (!f) {
        setReportImagePreview(node, null, "ยังไม่เลือกรูปภาพ", false);
        return;
      }

      if (!/^image\//i.test(f.type || "")) {
        input.value = "";
        setReportImagePreview(node, null, "ไฟล์ไม่ถูกต้อง (ต้องเป็นรูปภาพเท่านั้น)", false);
        await Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      setReportImagePreview(node, f, `เลือกรูปแล้ว: ${f.name}`, false);
    });

    editBtn?.addEventListener("click", async () => {
      const sourceFile =
        typeof tools.getPickedOrEditedFile === "function"
          ? tools.getPickedOrEditedFile(input)
          : (input.files && input.files[0] ? input.files[0] : null);

      if (!sourceFile) {
        await Swal.fire({
          icon: "info",
          title: "ยังไม่มีรูปภาพ",
          text: "กรุณาเลือกรูปภาพก่อนแล้วจึงกดแก้ไข"
        });
        return;
      }

      if (!window.ImageEditorX || typeof window.ImageEditorX.open !== "function") {
        await Swal.fire({
          icon: "error",
          title: "ยังไม่พร้อมใช้งาน",
          text: "ไม่พบ image-editor.js หรือยังไม่ได้โหลด modal ของ image editor"
        });
        return;
      }

      const result = await window.ImageEditorX.open(sourceFile, {
        strokeColor: "#dc2626",
        strokeWidth: 3
      });

      if (!result?.ok || !result.file) return;

      if (typeof tools.setEditedUploadFile === "function") {
        tools.setEditedUploadFile(input, result.file, {
          filename: result.filename || result.file.name,
          dataUrl: result.dataUrl || ""
        });
      }

      const badgeText =
        typeof tools.buildEditedImageBadgeHtml === "function"
          ? tools.buildEditedImageBadgeHtml(result.file)
          : `ไฟล์แก้ไขแล้ว: ${result.file.name}`;

      setReportImagePreview(node, result.file, badgeText, true);
    });

    setReportImagePreview(node, null, "ยังไม่เลือกรูปภาพ", false);
  }

  function refreshRowIndex(listId) {
    const root = $(listId);
    if (!root) return;
    Array.from(root.children).forEach((node, idx) => {
      const titleEl = node.querySelector(".rptCardHead > div:first-child");
      const badgeEl = node.querySelector(".rptRowIndex");
      const type = node.getAttribute("data-type") || "";

      const titleMap = {
        person: "ผู้เกี่ยวข้อง",
        damage: "ความเสียหาย",
        stepTaken: "การดำเนินการ",
        evidence: "หลักฐาน",
        cause: "สาเหตุ",
        prevention: "การป้องกัน",
        learning: "สิ่งที่ได้เรียนรู้",
        image: "รูปภาพ"
      };

      const label = titleMap[type] || "รายการ";
      if (titleEl) titleEl.textContent = `${label} ${idx + 1}`;
      if (badgeEl) badgeEl.textContent = String(idx + 1);
    });
  }

  function emptyStateLabelFor(listId) {
    const map = {
      rptInvolvedPersonsList: "ยังไม่มีผู้เกี่ยวข้อง",
      rptDamagesList: "ยังไม่มีรายการความเสียหาย",
      rptStepTakensList: "ยังไม่มีรายการดำเนินการ",
      rptEvidencesList: "ยังไม่มีรายการหลักฐาน",
      rptCausesList: "ยังไม่มีรายการสาเหตุ",
      rptPreventionsList: "ยังไม่มีรายการข้อเสนอแนะ",
      rptLearningsList: "ยังไม่มีรายการบทเรียน",
      rptImageList: "ยังไม่มีรูปภาพแนบ"
    };
    return map[listId] || "ยังไม่มีข้อมูล";
  }

  function toggleEmptyState(listId, labelText) {
    const root = $(listId);
    if (!root) return;

    let empty = root.parentElement?.querySelector(`.rptEmptyState[data-for="${listId}"]`);
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "rptEmptyState";
      empty.setAttribute("data-for", listId);
      root.insertAdjacentElement("afterend", empty);
    }

    empty.textContent = labelText || "ยังไม่มีข้อมูล";
    empty.classList.toggle("hidden", root.children.length > 0);
  }

  function bindDynamicRow(node) {
    if (!node) return;

    const type = node.getAttribute("data-type") || "";

    if (type === "person") {
      bindSelectOtherInRow(
        node.querySelector(".rptPersonPosition"),
        node.querySelector(".rptPersonPositionOtherWrap"),
        node.querySelector(".rptPersonPositionOther")
      );
      bindSelectOtherInRow(
        node.querySelector(".rptPersonDepartment"),
        node.querySelector(".rptPersonDepartmentOtherWrap"),
        node.querySelector(".rptPersonDepartmentOther")
      );
      bindSelectOtherInRow(
        node.querySelector(".rptPersonRemark"),
        node.querySelector(".rptPersonRemarkOtherWrap"),
        node.querySelector(".rptPersonRemarkOther")
      );
    }

    if (type === "stepTaken") {
      bindSelectOtherInRow(
        node.querySelector(".rptStepActionType"),
        node.querySelector(".rptStepActionOtherWrap"),
        node.querySelector(".rptStepActionOther")
      );
    }

    if (type === "image") {
      bindImageRow(node);
    }

    node.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
      const img = node.querySelector(".rptImagePreview");
      if (img) {
        if (img.dataset.objectUrl) {
          try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
          img.dataset.objectUrl = "";
        }
      }

      const input = node.querySelector(".rptImageFile");
      if (input && window.UploadImageTools?.clearEditedUploadFile) {
        window.UploadImageTools.clearEditedUploadFile(input);
      }

      const parentId = node.parentElement?.id || "";
      node.remove();
      if (parentId) {
        refreshRowIndex(parentId);
        toggleEmptyState(parentId, emptyStateLabelFor(parentId));
      }
    });
  }

  function addRow(listId, type) {
    const root = $(listId);
    if (!root) return;

    const index = root.children.length + 1;
    let html = "";

    switch (type) {
      case "person":
        html = createInvolvedPersonRowHtml(index);
        break;
      case "damage":
        html = createSimpleIndexedRowHtml("damage", index, "รายการความเสียหาย", "รายละเอียด", "เช่น รถฟอร์คลิฟต์", "อธิบายความเสียหาย");
        break;
      case "stepTaken":
        html = createStepTakenRowHtml(index);
        break;
      case "evidence":
        html = createSimpleIndexedRowHtml("evidence", index, "หลักฐาน", "รายละเอียด", "เช่น กล้องวงจรปิด", "อธิบายหลักฐานที่พบ");
        break;
      case "cause":
        html = createSimpleIndexedRowHtml("cause", index, "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "อธิบายสาเหตุของเหตุการณ์");
        break;
      case "prevention":
        html = createSimpleIndexedRowHtml("prevention", index, "การป้องกัน", "รายละเอียด", "หัวข้อเสนอแนะ", "อธิบายแนวทางป้องกันเหตุซ้ำ");
        break;
      case "learning":
        html = createSimpleIndexedRowHtml("learning", index, "สิ่งที่ได้เรียนรู้", "รายละเอียด", "หัวข้อบทเรียน", "อธิบายบทเรียนหรือข้อขัดข้อง");
        break;
      case "image":
        html = createImageRowHtml(index);
        break;
      default:
        html = createSimpleIndexedRowHtml(type, index, "รายการ", "รายละเอียด", "หัวข้อ", "รายละเอียด");
        break;
    }

    root.insertAdjacentHTML("beforeend", html);
    const node = root.lastElementChild;
    bindDynamicRow(node);
    toggleEmptyState(listId, emptyStateLabelFor(listId));
  }

  function clearDynamicList(listId) {
    const root = $(listId);
    if (!root) return;

    Array.from(root.querySelectorAll(".rptImagePreview")).forEach((img) => revokePreviewObjectUrl(img));
    Array.from(root.querySelectorAll(".rptImageFile")).forEach((input) => {
      if (window.UploadImageTools?.clearEditedUploadFile) {
        window.UploadImageTools.clearEditedUploadFile(input);
      }
    });

    root.innerHTML = "";
    toggleEmptyState(listId, emptyStateLabelFor(listId));
  }

  function collectRows(listId, mapper) {
    return Array.from(document.querySelectorAll(`#${listId} .rptRepeatCard`))
      .map((node) => mapper(node))
      .filter(Boolean);
  }

  function collectInvolvedPersons() {
    return collectRows("rptInvolvedPersonsList", (node) => {
      const name = norm(node.querySelector(".rptPersonName")?.value);
      const code = norm(node.querySelector(".rptPersonCode")?.value);
      const position = norm(node.querySelector(".rptPersonPosition")?.value);
      const positionOther = norm(node.querySelector(".rptPersonPositionOther")?.value);
      const department = norm(node.querySelector(".rptPersonDepartment")?.value);
      const departmentOther = norm(node.querySelector(".rptPersonDepartmentOther")?.value);
      const remark = norm(node.querySelector(".rptPersonRemark")?.value);
      const remarkOther = norm(node.querySelector(".rptPersonRemarkOther")?.value);

      if (!name && !code && !position && !department && !remark) return null;

      return {
        name,
        employeeCode: code,
        position,
        positionOther,
        department,
        departmentOther,
        remark,
        remarkOther
      };
    });
  }

  function collectSimpleRows(listId, titleSelector, detailSelector) {
    return collectRows(listId, (node) => {
      const title = norm(node.querySelector(titleSelector)?.value);
      const detail = norm(node.querySelector(detailSelector)?.value);
      if (!title && !detail) return null;
      return { title, detail };
    });
  }

  function collectStepTakens() {
    return collectRows("rptStepTakensList", (node) => {
      const actionType = norm(node.querySelector(".rptStepActionType")?.value);
      const actionOther = norm(node.querySelector(".rptStepActionOther")?.value);
      const detail = norm(node.querySelector(".rptStepDetail")?.value);
      if (!actionType && !actionOther && !detail) return null;
      return { actionType, actionOther, detail };
    });
  }

  async function collectImages() {
    const rows = Array.from(document.querySelectorAll("#rptImageList .rptRepeatCard"));
    const out = [];
    const tools = getUploadImageTools();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fileInput = row.querySelector(".rptImageFile");

      const file =
        typeof tools.getPickedOrEditedFile === "function"
          ? tools.getPickedOrEditedFile(fileInput)
          : (fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null);

      const caption = norm(row.querySelector(".rptImageCaption")?.value);

      if (!file) continue;

      out.push({
        name: file.name || `report500-image-${i + 1}.jpg`,
        filename: file.name || `report500-image-${i + 1}.jpg`,
        type: file.type || "image/jpeg",
        size: Number(file.size || 0),
        caption,
        base64: await fileToBase64(file)
      });
    }

    return out;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function collectPayload() {
    const reportTypes = Array.from(document.querySelectorAll('input[name="rptReportType"]:checked'))
      .map((el) => norm(el.value))
      .filter(Boolean);

    const urgency = Array.from(document.querySelectorAll('input[name="rptUrgency"]:checked'))
      .map((el) => norm(el.value))
      .filter(Boolean);

    const notifyTo = Array.from(document.querySelectorAll('input[name="rptNotifyTo"]:checked'))
      .map((el) => norm(el.value))
      .filter(Boolean);

    const whereTypes = Array.from(document.querySelectorAll(".rptWhereTypeRow"))
      .map((row) => {
        const chk = row.querySelector(".rptWhereTypeChk");
        const suffix = norm(row.querySelector(".rptWhereTypeSuffix")?.value);
        if (!chk?.checked) return null;
        return {
          value: norm(chk.value),
          suffix
        };
      })
      .filter(Boolean);

    const emailsFromChecks = Array.from(document.querySelectorAll(".rptEmailChk:checked"))
      .map((el) => norm(el.value))
      .filter(Boolean);

    const emailsFromText = splitMultiEmails($("rptEmailManual")?.value);
    const emailRecipients = uniqueEmails([...emailsFromChecks, ...emailsFromText]);

    return {
      refNo: getRefNo(),
      lps: getAuth().name || "",
      reportedBy: norm($("rptReportedBy")?.value),
      reporterPosition: norm($("rptReporterPosition")?.value),
      reporterPositionOther: norm($("rptReporterPositionOther")?.value),
      reportDate: norm($("rptReportDate")?.value),
      branch: norm($("rptBranch")?.value),
      branchOther: norm($("rptBranchOther")?.value),
      subject: norm($("rptSubject")?.value),
      reportTypes,
      urgency,
      notifyTo,
      incidentDate: norm($("rptIncidentDate")?.value),
      incidentTime: norm($("rptIncidentTime")?.value),
      whereDidItHappen: norm($("rptWhereDidItHappen")?.value),
      whereTypes,
      area: norm($("rptArea")?.value),
      whatHappen: norm($("rptWhatHappen")?.value),
      involvedPersons: collectInvolvedPersons(),
      damages: collectSimpleRows("rptDamagesList", ".rptRowTitle", ".rptRowDetail"),
      stepTakens: collectStepTakens(),
      offenderStatement: norm($("rptOffenderStatement")?.value),
      evidences: collectSimpleRows("rptEvidencesList", ".rptRowTitle", ".rptRowDetail"),
      summaryText: norm($("rptSummaryText")?.value),
      causes: collectSimpleRows("rptCausesList", ".rptRowTitle", ".rptRowDetail"),
      preventions: collectSimpleRows("rptPreventionsList", ".rptRowTitle", ".rptRowDetail"),
      learnings: collectSimpleRows("rptLearningsList", ".rptRowTitle", ".rptRowDetail"),
      emailRecipients
    };
  }

  function validatePayload(payload) {
    if (!payload.refNo) return "กรุณากรอก Ref No.";
    if (!payload.reportedBy) return "กรุณากรอกชื่อผู้รายงาน";
    if (!payload.reporterPosition) return "กรุณาเลือกตำแหน่งผู้รายงาน";
    if (isOther(payload.reporterPosition) && !payload.reporterPositionOther) return "กรุณาระบุตำแหน่งผู้รายงานอื่นๆ";
    if (!payload.reportDate) return "กรุณาเลือกวันที่รายงาน";
    if (!payload.branch) return "กรุณาเลือกสาขา";
    if (isOther(payload.branch) && !payload.branchOther) return "กรุณาระบุสาขาอื่นๆ";
    if (!payload.subject) return "กรุณากรอกเรื่อง";
    if (!payload.reportTypes.length) return "กรุณาเลือกประเภทรายงานอย่างน้อย 1 รายการ";
    if (!payload.urgency.length) return "กรุณาเลือกระดับความเร่งด่วนอย่างน้อย 1 รายการ";
    if (!payload.incidentDate) return "กรุณาเลือกวันที่เกิดเหตุ";
    if (!payload.incidentTime) return "กรุณาเลือกเวลาเกิดเหตุ";
    if (!payload.whereDidItHappen) return "กรุณาเลือกสถานที่เกิดเหตุหลัก";
    if (!payload.whereTypes.length) return "กรุณาเลือกประเภทสถานที่เกิดเหตุอย่างน้อย 1 รายการ";
    if (!payload.area) return "กรุณากรอก Area/บริเวณ";
    if (!payload.whatHappen) return "กรุณากรอกเหตุที่เกิด";
    if (!payload.summaryText) return "กรุณากรอกสรุป";
    return "";
  }

  async function preview() {
    const payload = collectPayload();
    const err = validatePayload(payload);
    if (err) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: err,
        confirmButtonText: "ตกลง"
      });
      return;
    }

    const images = await collectImages();

    await Swal.fire({
      icon: "info",
      title: "ตรวจสอบข้อมูล Report",
      confirmButtonText: "ตกลง",
      width: 920,
      html: `
        <div class="swalSummary">
          <div class="swalHero compact">
            <div class="swalHeroTitle">ตรวจสอบข้อมูลก่อนบันทึก</div>
            <div class="swalHeroSub">กรุณาตรวจสอบรายละเอียดของ Report ให้ถูกต้อง</div>
            <div class="swalPillRow">
              <div class="swalPill primary">ผู้บันทึก: ${escapeHtml(getAuth().name || "-")}</div>
              <div class="swalPill">Ref: ${escapeHtml(payload.refNo || "-")}</div>
              <div class="swalPill">รูป ${images.length}</div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">ข้อมูลหลัก</div>
            <div class="swalKvGrid">
              <div class="swalKv"><div class="swalKvLabel">รายงานโดย</div><div class="swalKvValue">${escapeHtml(payload.reportedBy || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">ตำแหน่งผู้รายงาน</div><div class="swalKvValue">${escapeHtml(payload.reporterPosition || "-")}${payload.reporterPositionOther ? ` • ${escapeHtml(payload.reporterPositionOther)}` : ""}</div></div>
              <div class="swalKv"><div class="swalKvLabel">วันที่รายงาน</div><div class="swalKvValue">${escapeHtml(payload.reportDate || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">สาขา</div><div class="swalKvValue">${escapeHtml(payload.branch || "-")}${payload.branchOther ? ` • ${escapeHtml(payload.branchOther)}` : ""}</div></div>
              <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div></div>
              <div class="swalKv"><div class="swalKvLabel">จำนวนรูปภาพ</div><div class="swalKvValue">${images.length}</div></div>
            </div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">เหตุการณ์</div>
            <div class="swalDesc"><div class="swalDescValue">${escapeHtml(payload.whatHappen || "-").replace(/\n/g, "<br>")}</div></div>
          </div>

          <div class="swalSection">
            <div class="swalSectionTitle">สรุป</div>
            <div class="swalDesc"><div class="swalDescValue">${escapeHtml(payload.summaryText || "-").replace(/\n/g, "<br>")}</div></div>
          </div>
        </div>
      `
    });
  }

  async function submit() {
    const payload = collectPayload();
    const err = validatePayload(payload);
    if (err) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: err,
        confirmButtonText: "ตกลง"
      });
      return;
    }

    let files = [];
    try {
      files = await collectImages();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "เตรียมรูปภาพไม่สำเร็จ",
        text: e?.message || String(e),
        confirmButtonText: "ตกลง"
      });
      return;
    }

    const body = {
      action: "report500Submit",
      pass: getAuth().pass || "",
      payload,
      files
    };

    window.ProgressUI?.show?.("กำลังบันทึก Report", "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และส่งอีเมล");

    try {
      window.ProgressUI?.activateOnly?.("validate", 12, "ตรวจสอบข้อมูลเรียบร้อย");
      await new Promise((r) => setTimeout(r, 120));
      window.ProgressUI?.markDone?.("validate", 20, "พร้อมส่งข้อมูล");

      window.ProgressUI?.activateOnly?.("upload", 34, "กำลังเตรียมรูปภาพ");
      await new Promise((r) => setTimeout(r, 180));
      window.ProgressUI?.markDone?.("upload", 48, `เตรียมไฟล์เรียบร้อย (${files.length} รูป)`);

      window.ProgressUI?.activateOnly?.("save", 60, "กำลังบันทึกข้อมูลลงระบบ");

      const res = await fetch(apiUrl("/report500Submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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

      window.ProgressUI?.markDone?.("save", 76, "บันทึกข้อมูลลงระบบเรียบร้อย");
      window.ProgressUI?.activateOnly?.("pdf", 88, "กำลังสร้างไฟล์ PDF");
      await new Promise((r) => setTimeout(r, 180));
      window.ProgressUI?.markDone?.("pdf", 96, json.pdfUrl ? "สร้างไฟล์ PDF เรียบร้อย" : "ไม่พบ PDF");

      window.ProgressUI?.activateOnly?.("email", 99, "กำลังตรวจสอบผลการส่งอีเมล");
      await new Promise((r) => setTimeout(r, 120));

      const emailInfo = window.buildEmailStatusSummary_
        ? window.buildEmailStatusSummary_(json)
        : {
            emailOk: false,
            emailSkipped: false,
            emailStatus: String(json?.emailSendStatus || "")
          };

      if (emailInfo.emailOk) {
        window.ProgressUI?.markDone?.("email", 100, emailInfo.emailModeText || "ส่งอีเมลสำเร็จ", emailInfo.emailModeText || "ส่งอีเมลสำเร็จ");
        window.ProgressUI?.success?.("บันทึกสำเร็จ", "Report ถูกบันทึกเรียบร้อยแล้ว");
      } else if (emailInfo.emailSkipped) {
        window.ProgressUI?.markDone?.("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
        window.ProgressUI?.success?.("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
      } else {
        window.ProgressUI?.markError?.("email", "ส่งอีเมลไม่สำเร็จ", 100);
        window.ProgressUI?.success?.("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
      }

      window.ProgressUI?.hide?.(120);

      await Swal.fire({
        icon: (emailInfo.emailOk || emailInfo.emailSkipped) ? "success" : "warning",
        title: (emailInfo.emailOk || emailInfo.emailSkipped) ? "บันทึกสำเร็จ" : "บันทึกสำเร็จบางส่วน",
        showConfirmButton: false,
        width: 920,
        html: `
          <div class="swalSummary">
            <div class="swalHero">
              <div class="swalHeroTitle">บันทึกรายงานเรียบร้อยแล้ว</div>
              <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และ PDF เรียบร้อย</div>
              <div class="swalPillRow">
                <div class="swalPill primary">ผู้บันทึก: ${escapeHtml(getAuth().name || json.lps || "-")}</div>
                <div class="swalPill">Ref: ${escapeHtml(payload.refNo || "-")}</div>
                <div class="swalPill">รูป ${files.length}</div>
              </div>
            </div>

            <div class="swalSection">
              <div class="swalSectionTitle">ข้อมูลเอกสาร</div>
              <div class="swalKvGrid">
                <div class="swalKv"><div class="swalKvLabel">วันที่เวลา</div><div class="swalKvValue">${escapeHtml(json.timestamp || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">Ref:No.</div><div class="swalKvValue">${escapeHtml(payload.refNo || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div></div>
                <div class="swalKv"><div class="swalKvLabel">ขนาด PDF</div><div class="swalKvValue">${escapeHtml(json.pdfSizeText || "-")}</div></div>
              </div>
            </div>

            <div class="swalSection">
              <div class="swalSectionTitle">สถานะอีเมล</div>
              ${
                emailInfo.emailSkipped
                  ? `<div class="swalNote">ไม่ได้ส่งอีเมล เพราะยังไม่ได้เลือกผู้รับ</div>`
                  : emailInfo.emailOk
                    ? `<div class="swalEmailOk">ส่งอีเมลสำเร็จ</div>`
                    : `<div class="swalEmailFail">บันทึกข้อมูลสำเร็จ แต่ส่งอีเมลไม่สำเร็จ: ${escapeHtml(emailInfo.emailStatus || "-")}</div>`
              }
            </div>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
              ${json.pdfUrl ? `<button type="button" id="btnOpenRptPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>` : ``}
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
    } catch (errSubmit) {
      console.error(errSubmit);
      window.ProgressUI?.markError?.("save", errSubmit?.message || "เกิดข้อผิดพลาด", 60);
      window.ProgressUI?.hide?.(180);
      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: errSubmit?.message || String(errSubmit),
        confirmButtonText: "ตกลง"
      });
    }
  }

  function resetForm() {
    setReadonlyValue("rptReportedBy", getAuth().name || "");
    setRefYear();

    [
      "rptRefNo",
      "rptReporterPositionOther",
      "rptReportDate",
      "rptBranchOther",
      "rptSubject",
      "rptIncidentDate",
      "rptIncidentTime",
      "rptArea",
      "rptWhatHappen",
      "rptOffenderStatement",
      "rptSummaryText",
      "rptEmailManual"
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    [
      "rptReporterPosition",
      "rptBranch",
      "rptWhereDidItHappen"
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    document.querySelectorAll('input[name="rptReportType"], input[name="rptUrgency"], input[name="rptNotifyTo"], .rptEmailChk, .rptWhereTypeChk').forEach((el) => {
      el.checked = false;
    });

    document.querySelectorAll(".rptWhereTypeSuffix").forEach((el) => {
      el.value = "";
      el.closest(".optionChoiceOther")?.classList.add("hidden");
    });

    bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");
    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");

    [
      "rptInvolvedPersonsList",
      "rptDamagesList",
      "rptStepTakensList",
      "rptEvidencesList",
      "rptCausesList",
      "rptPreventionsList",
      "rptLearningsList",
      "rptImageList"
    ].forEach((id) => clearDynamicList(id));
  }

  function bindButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);
    $("btnRptReset")?.addEventListener("click", resetForm);

    $("btnRptAddInvolvedPerson")?.addEventListener("click", () => addRow("rptInvolvedPersonsList", "person"));
    $("btnRptAddDamage")?.addEventListener("click", () => addRow("rptDamagesList", "damage"));
    $("btnRptAddStepTaken")?.addEventListener("click", () => addRow("rptStepTakensList", "stepTaken"));
    $("btnRptAddEvidence")?.addEventListener("click", () => addRow("rptEvidencesList", "evidence"));
    $("btnRptAddCause")?.addEventListener("click", () => addRow("rptCausesList", "cause"));
    $("btnRptAddPrevention")?.addEventListener("click", () => addRow("rptPreventionsList", "prevention"));
    $("btnRptAddLearning")?.addEventListener("click", () => addRow("rptLearningsList", "learning"));
    $("btnRptAddImage")?.addEventListener("click", () => addRow("rptImageList", "image"));

    $("btnRptCheckAllEmails")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
    $("btnRptClearAllEmails")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));
  }

  async function ensureReady() {
    if (state.loading) return;
    if (state.ready) return;

    state.loading = true;
    try {
      const res = await fetch(apiUrl("/report500Options"));
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "โหลดตัวเลือก Report ไม่สำเร็จ");
      }

      state.options = json;

      setReadonlyValue("rptReportedBy", getAuth().name || "");
      setRefYear();
      renderSelect("rptReporterPosition", json.reporterPositionList || [], true);
      renderSelect("rptBranch", json.branchList || [], true);
      renderSelect("rptWhereDidItHappen", json.locationList || [], true);
      renderOptionMatrix("rptReportTypeSelections", "rptReportType", json.reportTypeList || []);
      renderOptionMatrix("rptUrgencySelections", "rptUrgency", json.urgencyList || []);
      renderOptionMatrix("rptNotifySelections", "rptNotifyTo", json.notifyToList || []);
      renderWhereTypeSelections();
      renderEmailSelector();

      bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");
      bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
      bindButtons();
      resetForm();

      state.ready = true;
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
