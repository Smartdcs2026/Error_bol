(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    ready: false,
    loading: false,
    mode: "new",
    refNo: "",
    recordId: "",
    baseRecordId: "",
    previousRecordId: "",
    revisionNo: "",
    revisionLabel: "",
    loadedData: null,
    existingAssets: {
      imageIds: [],
      pdfFileId: "",
      pdfUrl: ""
    }
  };

  const REPEAT_LIST_IDS = {
    involvedPersonsJson: "rptPersonList",
    damagesJson: "rptDamageList",
    stepTakensJson: "rptStepTakenList",
    evidencesJson: "rptEvidenceList",
    causesJson: "rptCauseList",
    preventionsJson: "rptPreventionList",
    learningsJson: "rptLearningList",
    imageIds: "rptImageList"
  };

  function norm(v) {
    return String(v == null ? "" : v).trim();
  }

  function apiUrl(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    const base = String(window.API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  function getRefParts(refNo) {
    const clean = norm(refNo);
    if (!clean) return { running: "", year: "" };
    const m = clean.match(/^(.+?)[\-\/](\d{4})$/);
    if (m) {
      return {
        running: norm(m[1]),
        year: norm(m[2])
      };
    }
    return { running: clean, year: "" };
  }

  function setRptRef(refNo) {
    const parts = getRefParts(refNo);

    if ($("rptRefNo")) $("rptRefNo").value = parts.running || "";

    const yearEl = $("rptRefYear");
    if (yearEl) {
      if (String(yearEl.tagName || "").toUpperCase() === "SELECT") {
        if (parts.year) {
          const hasOption = Array.from(yearEl.options || []).some(opt => String(opt.value) === parts.year);
          if (!hasOption) {
            const opt = document.createElement("option");
            opt.value = parts.year;
            opt.textContent = parts.year;
            yearEl.appendChild(opt);
          }
          yearEl.value = parts.year;
        }
      } else if (parts.year) {
        yearEl.textContent = parts.year;
      }
    }
  }

  function getCurrentRptRef() {
    if (typeof window.getRptRefNoValue === "function") {
      return window.getRptRefNoValue();
    }
    const running = String($("rptRefNo")?.value || "").replace(/[^\d]/g, "").trim();
    const year = String($("rptRefYear")?.value || $("rptRefYear")?.textContent || "").trim();
    return running ? `${running}-${year}` : "";
  }

  function setValue(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = value == null ? "" : String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setSelectValue(id, value) {
    const el = $(id);
    if (!el) return;

    const target = value == null ? "" : String(value);
    const hasOption = Array.from(el.options || []).some(opt => String(opt.value) === target);

    if (!hasOption && target) {
      const opt = document.createElement("option");
      opt.value = target;
      opt.textContent = target;
      el.appendChild(opt);
    }

    el.value = target;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setText(id, value) {
    const el = $(id);
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  }

  function clearCheckboxGroup(name) {
    document.querySelectorAll(`input[type="checkbox"][name="${name}"]`).forEach((el) => {
      el.checked = false;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function setCheckboxGroup(name, wantedValues) {
    const wanted = new Set((Array.isArray(wantedValues) ? wantedValues : []).map(x => norm(x)));
    document.querySelectorAll(`input[type="checkbox"][name="${name}"]`).forEach((el) => {
      const v = norm(el.value);
      el.checked = wanted.has(v);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function normalizeOptionLabels(list) {
    return (Array.isArray(list) ? list : []).map((item) => {
      if (item == null) return "";
      if (typeof item === "string") return item.trim();
      if (typeof item === "object") {
        const cands = [
          item.value,
          item.label,
          item.name,
          item.text,
          item.title,
          item.type
        ];
        for (let i = 0; i < cands.length; i++) {
          const s = norm(cands[i]);
          if (s) return s;
        }
      }
      return "";
    }).filter(Boolean);
  }

  function setWhereTypeSelections(items) {
    const list = Array.isArray(items) ? items : [];
    const labels = list.map((x) => {
      if (typeof x === "string") return norm(x);
      return norm(x?.value || x?.label || x?.name || x?.text);
    }).filter(Boolean);

    setCheckboxGroup("rptWhereTypeSelections", labels);

    list.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const label = norm(item.value || item.label || item.name || item.text);
      const suffix = norm(item.suffixText || item.otherText || item.storeName || item.remark);
      if (!label || !suffix) return;

      const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"][name="rptWhereTypeSelections"]'))
        .find((el) => norm(el.value) === label);

      if (!checkbox) return;

      const wrap = checkbox.closest(".optionChoice, .whereTypeItem, .field, .card, .optionChoiceCard") || checkbox.parentElement;
      if (!wrap) return;

      const suffixInput = wrap.querySelector('input[type="text"], textarea');
      if (suffixInput) {
        suffixInput.value = suffix;
        suffixInput.dispatchEvent(new Event("input", { bubbles: true }));
        suffixInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  function setEmailRecipients(values) {
    const list = Array.isArray(values) ? values.map(norm).filter(Boolean) : [];

    document.querySelectorAll('input[type="checkbox"][name="rptEmailRecipients"], input[type="checkbox"][name="emailRecipients"]').forEach((el) => {
      const val = norm(el.value);
      el.checked = list.includes(val);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const known = new Set(
      Array.from(document.querySelectorAll('input[type="checkbox"][name="rptEmailRecipients"], input[type="checkbox"][name="emailRecipients"]'))
        .map((el) => norm(el.value))
        .filter(Boolean)
    );

    const otherEmails = list.filter((x) => !known.has(x));
    if ($("rptEmailOther")) {
      $("rptEmailOther").value = otherEmails.join(", ");
      $("rptEmailOther").dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function clickAddButtonByListId(listId) {
    const cfg = window.Report500Module?.RPT_REPEAT_CONFIG || null;
    const map = cfg && cfg[listId] ? cfg[listId] : null;
    const btnId = map?.addBtnId;
    const btn = btnId ? $(btnId) : null;
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  function getRowsInList(listId) {
    const root = $(listId);
    if (!root) return [];
    return Array.from(root.children || []).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      return !el.classList.contains("emptyState");
    });
  }

  function clearRepeatList(listId) {
    const root = $(listId);
    if (!root) return;

    root.innerHTML = "";

    const mod = window.Report500Module;
    if (typeof mod?.ensureRepeatFooterButton === "function") {
      try { mod.ensureRepeatFooterButton(listId); } catch (_) {}
    }
    if (typeof mod?.refreshRepeaterList === "function") {
      try { mod.refreshRepeaterList(listId); } catch (_) {}
    }
  }

  function setFieldInRow(row, selectors, value) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (let i = 0; i < selectorList.length; i++) {
      const selector = selectorList[i];
      const el = row.querySelector(selector);
      if (!el) continue;

      if (el.tagName === "SELECT") {
        const target = value == null ? "" : String(value);
        const hasOption = Array.from(el.options || []).some(opt => String(opt.value) === target);
        if (!hasOption && target) {
          const opt = document.createElement("option");
          opt.value = target;
          opt.textContent = target;
          el.appendChild(opt);
        }
        el.value = target;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        el.value = value == null ? "" : String(value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return true;
    }

    return false;
  }

  function fillPersonRow(row, item) {
    const obj = item && typeof item === "object" ? item : { text: item };

    setFieldInRow(row, ['input[name*="name"]', '.rptPersonName', 'input[placeholder*="ชื่อ"]'], obj.name || obj.personName || obj.employeeName || obj.text || "");
    setFieldInRow(row, ['select[name*="position"]', '.rptPersonPosition', 'input[name*="position"]'], obj.position || obj.personPosition || "");
    setFieldInRow(row, ['select[name*="department"]', '.rptPersonDepartment', 'input[name*="department"]'], obj.department || obj.personDepartment || "");
    setFieldInRow(row, ['input[name*="remark"]', 'textarea[name*="remark"]', '.rptPersonRemark'], obj.remark || obj.note || obj.detail || "");
  }

  function fillSimpleTextRow(row, item) {
    const obj = item && typeof item === "object" ? item : { text: item };
    const text = obj.text || obj.summary || obj.detail || obj.description || obj.value || "";
    setFieldInRow(row, ['textarea', 'input[type="text"]'], text);
  }

  function fillStepTakenRow(row, item) {
    const obj = item && typeof item === "object" ? item : { text: item };

    setFieldInRow(row, ['select[name*="actionType"]', '.rptActionType', 'input[name*="actionType"]'], obj.actionType || obj.type || "");
    setFieldInRow(row, ['input[name*="actionBy"]', '.rptActionBy'], obj.actionBy || obj.by || "");
    setFieldInRow(row, ['input[name*="actionAt"]', '.rptActionAt', 'input[type="datetime-local"]'], obj.actionAt || obj.datetime || obj.at || "");
    setFieldInRow(row, ['textarea', 'input[type="text"]'], obj.text || obj.summary || obj.detail || obj.description || "");
  }

  function setImageRowAsExisting(row, labelText) {
    if (!row) return;
    const meta = row.querySelector(".rptImageMeta");
    const img = row.querySelector(".rptImagePreview");
    const empty = row.querySelector(".rptImagePreviewEmpty");
    const input = row.querySelector(".rptImageFile");

    if (input) {
      try { input.value = ""; } catch (_) {}
    }

    if (img?.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
    }
    if (img) {
      img.removeAttribute("src");
      delete img.dataset.objectUrl;
      img.classList.add("hidden");
    }

    if (empty) empty.classList.add("hidden");
    if (meta) meta.textContent = labelText || "มีรูปเดิมจากรายงานล่าสุด";
  }

  function fillImageRowsByExistingAssets(imageIds) {
    const ids = Array.isArray(imageIds) ? imageIds : [];
    clearRepeatList(REPEAT_LIST_IDS.imageIds);

    ids.forEach((_, idx) => {
      clickAddButtonByListId(REPEAT_LIST_IDS.imageIds);
      const rows = getRowsInList(REPEAT_LIST_IDS.imageIds);
      const row = rows[rows.length - 1];
      setImageRowAsExisting(row, `มีรูปเดิมลำดับที่ ${idx + 1} จากรายงานล่าสุด`);
    });

    const mod = window.Report500Module;
    if (typeof mod?.refreshRepeaterList === "function") {
      try { mod.refreshRepeaterList(REPEAT_LIST_IDS.imageIds); } catch (_) {}
    }
  }

  function fillRepeatList(listId, items, filler) {
    clearRepeatList(listId);

    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) {
      const mod = window.Report500Module;
      if (typeof mod?.refreshRepeaterList === "function") {
        try { mod.refreshRepeaterList(listId); } catch (_) {}
      }
      return;
    }

    arr.forEach((item) => {
      clickAddButtonByListId(listId);
      const rows = getRowsInList(listId);
      const row = rows[rows.length - 1];
      if (!row) return;
      filler(row, item);
    });

    const mod = window.Report500Module;
    if (typeof mod?.refreshRepeaterList === "function") {
      try { mod.refreshRepeaterList(listId); } catch (_) {}
    }
  }

  function fillBasicFields(data) {
    setRptRef(data.refNo || "");
    setValue("rptReportedBy", data.reportedBy || "");
    setSelectValue("rptReporterPosition", data.reporterPosition || "");
    setValue("rptReporterPositionOther", data.reporterPositionOther || "");
    setValue("rptReportDate", data.reportDate || "");

    setSelectValue("rptBranch", data.branch || "");
    setValue("rptBranchOther", data.branchOther || "");
    setValue("rptSubject", data.subject || "");

    setValue("rptIncidentDate", data.incidentDate || "");
    setValue("rptIncidentTime", data.incidentTime || "");
    setValue("rptWhereDidItHappen", data.whereDidItHappen || "");
    setValue("rptArea", data.area || "");
    setValue("rptWhatHappen", data.whatHappen || "");
    setValue("rptOffenderStatement", data.offenderStatement || "");
    setValue("rptSummaryText", data.summaryText || "");

    setValue("rptDisciplineEmployeeCode", data.disciplineEmployeeCode || "");
    setValue("rptDisciplineEmployeeName", data.disciplineEmployeeName || "");
  }

  function fillOptionMatrices(data) {
    setCheckboxGroup("rptReportTypes", normalizeOptionLabels(data.reportTypesJson));
    setCheckboxGroup("rptUrgencyTypes", normalizeOptionLabels(data.urgencyJson));
    setCheckboxGroup("rptNotifyTo", normalizeOptionLabels(data.notifyToJson));
    setWhereTypeSelections(Array.isArray(data.whereTypeJson) ? data.whereTypeJson : []);
    setEmailRecipients(data.emailRecipients || []);
  }

  function fillRepeatSections(data) {
    fillRepeatList(REPEAT_LIST_IDS.involvedPersonsJson, data.involvedPersonsJson || [], fillPersonRow);
    fillRepeatList(REPEAT_LIST_IDS.damagesJson, data.damagesJson || [], fillSimpleTextRow);
    fillRepeatList(REPEAT_LIST_IDS.stepTakensJson, data.stepTakensJson || [], fillStepTakenRow);
    fillRepeatList(REPEAT_LIST_IDS.evidencesJson, data.evidencesJson || [], fillSimpleTextRow);
    fillRepeatList(REPEAT_LIST_IDS.causesJson, data.causesJson || [], fillSimpleTextRow);
    fillRepeatList(REPEAT_LIST_IDS.preventionsJson, data.preventionsJson || [], fillSimpleTextRow);
    fillRepeatList(REPEAT_LIST_IDS.learningsJson, data.learningsJson || [], fillSimpleTextRow);
  }

  function fillExistingAssets(data) {
    const assets = data && data.existingAssets && typeof data.existingAssets === "object"
      ? data.existingAssets
      : { imageIds: [], pdfFileId: "", pdfUrl: "" };

    state.existingAssets = {
      imageIds: Array.isArray(assets.imageIds) ? assets.imageIds.slice() : [],
      pdfFileId: norm(assets.pdfFileId),
      pdfUrl: norm(assets.pdfUrl)
    };

    fillImageRowsByExistingAssets(state.existingAssets.imageIds);
  }

  function setRevisionStateFromResponse(res) {
    const meta = {
      editMode: "revision",
      refNo: norm(res.refNo || res?.data?.refNo || ""),
      recordId: norm(res?.revisionMeta?.recordId || res.latestRecordId || ""),
      baseRecordId: norm(res?.revisionMeta?.baseRecordId || ""),
      previousRecordId: norm(res?.revisionMeta?.previousRecordId || res?.revisionMeta?.recordId || ""),
      revisionNo: res?.revisionMeta?.revisionNo ?? res?.latestRevisionNo ?? "",
      revisionLabel: norm(res?.revisionMeta?.revisionLabel || ""),
      revisionCreatedAt: norm(res?.revisionMeta?.revisionCreatedAt || ""),
      revisionCreatedBy: norm(res?.revisionMeta?.revisionCreatedBy || "")
    };

    state.mode = "revision";
    state.refNo = meta.refNo;
    state.recordId = meta.recordId;
    state.baseRecordId = meta.baseRecordId;
    state.previousRecordId = meta.recordId || meta.previousRecordId;
    state.revisionNo = String(meta.revisionNo == null ? "" : meta.revisionNo);
    state.revisionLabel = meta.revisionLabel;

    window.RevisionUI?.showSuccess("report500", meta);
  }

  function tryRefreshUi() {
    const mod = window.Report500Module;
    if (!mod) return;

    if (typeof mod.refreshAllCardsUi === "function") {
      try { mod.refreshAllCardsUi(); } catch (_) {}
    }

    if (typeof mod.bindOtherSelect === "function") {
      try {
        mod.bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
        mod.bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");
      } catch (_) {}
    }
  }

  function fillReport500FormFromRecord(data) {
    const d = data && typeof data === "object" ? data : {};

    fillBasicFields(d);
    fillOptionMatrices(d);
    fillRepeatSections(d);
    fillExistingAssets(d);
    tryRefreshUi();
  }

  function resetState() {
    state.loading = false;
    state.mode = "new";
    state.refNo = "";
    state.recordId = "";
    state.baseRecordId = "";
    state.previousRecordId = "";
    state.revisionNo = "";
    state.revisionLabel = "";
    state.loadedData = null;
    state.existingAssets = {
      imageIds: [],
      pdfFileId: "",
      pdfUrl: ""
    };
  }

  function buildRevisionMeta() {
    return {
      editMode: state.mode === "revision" ? "revision" : "new",
      isRevision: state.mode === "revision",
      refNo: getCurrentRptRef() || state.refNo || "",
      recordId: state.recordId || "",
      baseRecordId: state.baseRecordId || "",
      previousRecordId: state.previousRecordId || "",
      revisionNo: state.revisionNo || "",
      revisionLabel: state.revisionLabel || "",
      existingAssets: {
        imageIds: Array.isArray(state.existingAssets.imageIds) ? state.existingAssets.imageIds.slice() : [],
        pdfFileId: state.existingAssets.pdfFileId || "",
        pdfUrl: state.existingAssets.pdfUrl || ""
      }
    };
  }

  function decorateCollectPayload() {
    const mod = window.Report500Module;
    if (!mod || typeof mod.collectPayload !== "function" || mod.collectPayload.__revisionWrapped) return;

    const original = mod.collectPayload.bind(mod);

    const wrapped = function () {
      const payload = original.apply(mod, arguments) || {};
      const revMeta = buildRevisionMeta();

      payload.editMode = revMeta.editMode;
      payload.revisionMeta = revMeta;
      payload.refNo = payload.refNo || revMeta.refNo || "";

      return payload;
    };

    wrapped.__revisionWrapped = true;
    mod.collectPayload = wrapped;
  }

  async function fetchLoadByRef(refNo) {
    const res = await fetch(apiUrl(`/report500/load/${encodeURIComponent(refNo)}`), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error("Backend ตอบกลับไม่ใช่ JSON");
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    return json;
  }

  async function loadReport500ForEdit(refNo) {
    const cleanRef = norm(refNo);
    if (!cleanRef) {
      window.RevisionUI?.showWarning("report500", "กรุณากรอก Ref เดิมก่อน");
      return null;
    }

    if (state.loading) return null;
    state.loading = true;
    window.RevisionUI?.setLoading("report500", true);

    try {
      const json = await fetchLoadByRef(cleanRef);
      const data = json?.data || {};
      state.loadedData = data;

      fillReport500FormFromRecord(data);
      setRevisionStateFromResponse(json);

      return json;
    } catch (err) {
      console.error(err);
      resetState();
      window.RevisionUI?.showError("report500", err?.message || String(err));
      throw err;
    } finally {
      state.loading = false;
      window.RevisionUI?.setLoading("report500", false);
    }
  }

  function clearBasicFormForNew() {
    const ids = [
      "rptRefNo",
      "rptReportedBy",
      "rptReporterPositionOther",
      "rptReportDate",
      "rptBranchOther",
      "rptSubject",
      "rptIncidentDate",
      "rptIncidentTime",
      "rptWhereDidItHappen",
      "rptArea",
      "rptWhatHappen",
      "rptOffenderStatement",
      "rptSummaryText",
      "rptEmailOther",
      "rptDisciplineEmployeeCode",
      "rptDisciplineEmployeeName"
    ];

    ids.forEach((id) => setValue(id, ""));

    setSelectValue("rptReporterPosition", "");
    setSelectValue("rptBranch", "");

    clearCheckboxGroup("rptReportTypes");
    clearCheckboxGroup("rptUrgencyTypes");
    clearCheckboxGroup("rptNotifyTo");
    clearCheckboxGroup("rptWhereTypeSelections");
    clearCheckboxGroup("rptEmailRecipients");
    clearCheckboxGroup("emailRecipients");

    Object.values(REPEAT_LIST_IDS).forEach((listId) => clearRepeatList(listId));

    tryRefreshUi();
  }

  function resetReport500RevisionState(options) {
    resetState();
    window.RevisionUI?.reset("report500", options || {});
  }

  function bindButtons() {
    const btnLoad = $("btnLoadReport500Ref");
    const btnReset = $("btnResetReport500Revision");

    if (btnLoad && !btnLoad.dataset.boundRevision) {
      btnLoad.dataset.boundRevision = "1";
      btnLoad.addEventListener("click", async () => {
        const refNo = $("report500LoadRefNo")?.value || "";
        await loadReport500ForEdit(refNo);
      });
    }

    if (btnReset && !btnReset.dataset.boundRevision) {
      btnReset.dataset.boundRevision = "1";
      btnReset.addEventListener("click", async () => {
        resetReport500RevisionState({ keepInput: false, showNewBadge: true });
        clearBasicFormForNew();
      });
    }

    window.RevisionUI?.attachEnterToLoad("report500", async (refNo) => {
      await loadReport500ForEdit(refNo);
    });
  }

  function init() {
    if (state.ready) return;
    state.ready = true;

    decorateCollectPayload();
    bindButtons();
    resetReport500RevisionState({ keepInput: true, showNewBadge: false });
  }

  window.Report500Revision = {
    init,
    state,
    load: loadReport500ForEdit,
    fillForm: fillReport500FormFromRecord,
    reset: resetReport500RevisionState,
    clearFormForNew: clearBasicFormForNew,
    buildRevisionMeta,
    getState: () => ({
      ...state,
      existingAssets: { ...state.existingAssets }
    })
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
