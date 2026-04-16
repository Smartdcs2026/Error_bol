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
    existingAssets: {
      imageIds: [],
      supervisorSignImageId: "",
      employeeSignImageId: "",
      interpreterSignImageId: "",
      pdfFileId: "",
      pdfUrl: ""
    },
    loadedData: null
  };

  const FIELD_MAP = {
    refNo: "refNo",
    lps: "lps",
    labelCid: "labelCid",
    item: "item",
    itemDisplay: "itemDisplay",
    errorCaseQty: "errorCaseQty",
    employeeName: "employeeName",
    employeeCode: "employeeCode",
    workAgeYear: "workAgeYear",
    workAgeMonth: "workAgeMonth",
    nationality: "nationality",
    interpreterName: "interpreterName",
    errorDate: "errorDate",
    shift: "shift",
    osm: "osm",
    otm: "otm",
    auditName: "auditName",
    confirmCauseOther: "confirmCauseOther",
    employeeConfirmText: "employeeConfirmText",
    errorDescription: "errorDescription"
  };

  function apiUrl(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    const base = String(window.API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  function norm(v) {
    return String(v == null ? "" : v).trim();
  }

  function splitRef(refNo) {
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

  function getCurrentRefValue() {
    const running = norm($("refNo")?.value).replace(/[^\d]/g, "");
    const year = norm($("refYear")?.value || $("refYear")?.textContent);
    if (!running) return "";
    return year ? `${running}-${year}` : running;
  }

  function setRefValue(refNo) {
    const parts = splitRef(refNo);

    if ($("refNo")) $("refNo").value = parts.running || "";
    if ($("refYear")) {
      const el = $("refYear");
      if (String(el.tagName || "").toUpperCase() === "SELECT") {
        if (parts.year) {
          const hasOption = Array.from(el.options || []).some(opt => String(opt.value) === parts.year);
          if (!hasOption && parts.year) {
            const opt = document.createElement("option");
            opt.value = parts.year;
            opt.textContent = parts.year;
            el.appendChild(opt);
          }
          el.value = parts.year;
        }
      } else if (parts.year) {
        el.textContent = parts.year;
      }
    }
  }

  function setValue(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = value == null ? "" : String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setReadonlyValue(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = value == null ? "" : String(value);
  }

  function setText(id, value) {
    const el = $(id);
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
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

  function setCheckboxValue(name, expectedList) {
    const wanted = new Set((Array.isArray(expectedList) ? expectedList : []).map(x => norm(x)));
    const nodes = document.querySelectorAll(`input[type="checkbox"][name="${name}"]`);
    if (!nodes.length) return;

    nodes.forEach((el) => {
      const v = norm(el.value);
      el.checked = wanted.has(v);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function tryFillErrorReason(value) {
    const v = norm(value);
    if (!v) return;

    const reasonEl = $("errorReason");
    if (reasonEl) {
      const hasOption = Array.from(reasonEl.options || []).some(opt => String(opt.value) === v);
      if (hasOption) {
        setSelectValue("errorReason", v);
        return;
      }

      const otherOption = Array.from(reasonEl.options || []).find(opt => norm(opt.value) === "อื่นๆ");
      if (otherOption) {
        setSelectValue("errorReason", "อื่นๆ");
        setValue("errorReasonOther", v.replace(/^อื่นๆ\s*:\s*/i, ""));
        return;
      }
    }

    setValue("errorReason", v);
  }

  function tryFillConfirmCause(data) {
    const text = norm(data.confirmCauseText);
    const other = norm(data.confirmCauseOther);

    const selected = text
      ? text.split("|").map(x => norm(x)).filter(Boolean)
      : [];

    if (selected.length) {
      setCheckboxValue("confirmCauseSelected", selected);
    }

    if (other) {
      setValue("confirmCauseOther", other);
    }

    const hiddenText = $("confirmCauseText");
    if (hiddenText && text) {
      hiddenText.value = text;
    }
  }

  function fillBasicFields(data) {
    setRefValue(data.refNo || "");
    setReadonlyValue("lps", data.lps || $("lps")?.value || "");

    setValue("labelCid", data.labelCid || "");
    setValue("item", data.item || "");
    setReadonlyValue("itemDisplay", data.itemDisplay || data.itemDescription || "");
    setValue("errorCaseQty", data.errorCaseQty || "");

    setValue("employeeName", data.employeeName || "");
    setValue("employeeCode", data.employeeCode || "");
    setValue("workAgeYear", data.workAgeYear || "");
    setValue("workAgeMonth", data.workAgeMonth || "");

    if ($("nationality")) setSelectValue("nationality", data.nationality || "");
    setValue("interpreterName", data.interpreterName || "");
    if ($("errorDate")) setValue("errorDate", data.errorDate || "");
    if ($("shift")) setSelectValue("shift", data.shift || "");
    if ($("osm")) setSelectValue("osm", data.osm || "");
    if ($("otm")) setSelectValue("otm", data.otm || "");
    if ($("auditName")) setSelectValue("auditName", data.auditName || "");

    tryFillErrorReason(data.errorReason || "");
    tryFillConfirmCause(data);

    setValue("errorDescription", data.errorDescription || "");
    setValue("employeeConfirmText", data.employeeConfirmText || "");

    const disciplineCodeEl = $("disciplineEmployeeCode");
    if (disciplineCodeEl) disciplineCodeEl.value = data.disciplineEmployeeCode || data.employeeCode || "";

    const disciplineNameEl = $("disciplineEmployeeName");
    if (disciplineNameEl) disciplineNameEl.value = data.disciplineEmployeeName || data.employeeName || "";

    setText("itemLookupHint", data.itemDisplay ? "โหลดข้อมูลสินค้าจากรายงานเดิมแล้ว" : "");
  }

  function clearFileInput(input) {
    if (!input) return;
    try {
      input.value = "";
    } catch (_) {}
  }

  function clearPreviewBox(box) {
    if (!box) return;
    const img = box.querySelector(".previewImg");
    const txt = box.querySelector(".small");

    if (img?.dataset.objectUrl) {
      try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
    }

    if (img) {
      img.removeAttribute("src");
      delete img.dataset.objectUrl;
      img.classList.add("hidden");
    }

    if (txt) txt.textContent = "";
  }

  function markExistingAssetBox(box, message) {
    if (!box) return;
    const txt = box.querySelector(".small");
    if (txt) txt.textContent = message || "มีไฟล์เดิมจากรายงานล่าสุด";
  }

  function fillExistingAssets(data) {
    const assets = data && data.existingAssets && typeof data.existingAssets === "object"
      ? data.existingAssets
      : {
          imageIds: [],
          supervisorSignImageId: "",
          employeeSignImageId: "",
          interpreterSignImageId: "",
          pdfFileId: "",
          pdfUrl: ""
        };

    state.existingAssets = {
      imageIds: Array.isArray(assets.imageIds) ? assets.imageIds.slice() : [],
      supervisorSignImageId: norm(assets.supervisorSignImageId),
      employeeSignImageId: norm(assets.employeeSignImageId),
      interpreterSignImageId: norm(assets.interpreterSignImageId),
      pdfFileId: norm(assets.pdfFileId),
      pdfUrl: norm(assets.pdfUrl)
    };

    const uploadList = $("uploadList");
    if (uploadList) {
      const fileInputs = Array.from(uploadList.querySelectorAll('input[type="file"]'));
      fileInputs.forEach((input) => {
        clearFileInput(input);
        const box = input.closest(".uploadBox") || input.closest(".uploadItem") || input.parentElement;
        clearPreviewBox(box);
      });

      if (state.existingAssets.imageIds.length) {
        fileInputs.forEach((input, idx) => {
          const box = input.closest(".uploadBox") || input.closest(".uploadItem") || input.parentElement;
          if (idx < state.existingAssets.imageIds.length) {
            markExistingAssetBox(box, `มีรูปเดิมลำดับที่ ${idx + 1} จากรายงานล่าสุด`);
          }
        });
      }
    }

    const signBoxes = [
      { id: "supervisorSign", value: state.existingAssets.supervisorSignImageId, label: "มีลายเซ็นหัวหน้าเดิม" },
      { id: "employeeSign", value: state.existingAssets.employeeSignImageId, label: "มีลายเซ็นพนักงานเดิม" },
      { id: "interpreterSign", value: state.existingAssets.interpreterSignImageId, label: "มีลายเซ็นล่ามเดิม" }
    ];

    signBoxes.forEach((item) => {
      const input = $(item.id);
      if (!input) return;
      clearFileInput(input);
      const box = input.closest(".uploadBox") || input.closest(".signBox") || input.parentElement;
      clearPreviewBox(box);
      if (item.value) markExistingAssetBox(box, item.label);
    });
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

    window.RevisionUI?.showSuccess("errorBol", meta);
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
      supervisorSignImageId: "",
      employeeSignImageId: "",
      interpreterSignImageId: "",
      pdfFileId: "",
      pdfUrl: ""
    };
  }

  function buildRevisionMeta() {
    return {
      editMode: state.mode === "revision" ? "revision" : "new",
      isRevision: state.mode === "revision",
      refNo: getCurrentRefValue() || state.refNo || "",
      recordId: state.recordId || "",
      baseRecordId: state.baseRecordId || "",
      previousRecordId: state.previousRecordId || "",
      revisionNo: state.revisionNo || "",
      revisionLabel: state.revisionLabel || "",
      existingAssets: {
        imageIds: Array.isArray(state.existingAssets.imageIds) ? state.existingAssets.imageIds.slice() : [],
        supervisorSignImageId: state.existingAssets.supervisorSignImageId || "",
        employeeSignImageId: state.existingAssets.employeeSignImageId || "",
        interpreterSignImageId: state.existingAssets.interpreterSignImageId || "",
        pdfFileId: state.existingAssets.pdfFileId || "",
        pdfUrl: state.existingAssets.pdfUrl || ""
      }
    };
  }

  function decorateCollectPayload() {
    if (typeof window.collectPayload !== "function" || window.collectPayload.__revisionWrapped) return;

    const original = window.collectPayload;
    const wrapped = function () {
      const payload = original.apply(this, arguments) || {};
      const revMeta = buildRevisionMeta();

      payload.editMode = revMeta.editMode;
      payload.revisionMeta = revMeta;
      payload.refNo = payload.refNo || revMeta.refNo || "";
      return payload;
    };

    wrapped.__revisionWrapped = true;
    window.collectPayload = wrapped;
  }

  function tryRefreshDerivedUi(data) {
    if (typeof window.renderEmployeeConfirmText === "function") {
      try { window.renderEmployeeConfirmText(); } catch (_) {}
    }
    if (typeof window.updateConfirmCauseSummary === "function") {
      try { window.updateConfirmCauseSummary(); } catch (_) {}
    }
    if (typeof window.lookupItemByInput === "function" && data.item) {
      try { window.lookupItemByInput(data.item); } catch (_) {}
    }
    if (typeof window.lookupDisciplineByEmployeeCode === "function") {
      try { window.lookupDisciplineByEmployeeCode(data.employeeCode || ""); } catch (_) {}
    }
  }

  function fillErrorBolFormFromRecord(data) {
    const d = data && typeof data === "object" ? data : {};
    fillBasicFields(d);
    fillExistingAssets(d);
    tryRefreshDerivedUi(d);
  }

  async function fetchLoadByRef(refNo) {
    const res = await fetch(apiUrl(`/errorbol/load/${encodeURIComponent(refNo)}`), {
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

  async function loadErrorBolForEdit(refNo) {
    const cleanRef = norm(refNo);
    if (!cleanRef) {
      window.RevisionUI?.showWarning("errorBol", "กรุณากรอก Ref เดิมก่อน");
      return null;
    }

    if (state.loading) return null;
    state.loading = true;
    window.RevisionUI?.setLoading("errorBol", true);

    try {
      const json = await fetchLoadByRef(cleanRef);
      const data = json?.data || {};
      state.loadedData = data;

      fillErrorBolFormFromRecord(data);
      setRevisionStateFromResponse(json);

      return json;
    } catch (err) {
      console.error(err);
      resetState();
      window.RevisionUI?.showError("errorBol", err?.message || String(err));
      throw err;
    } finally {
      state.loading = false;
      window.RevisionUI?.setLoading("errorBol", false);
    }
  }

  function resetErrorBolRevisionState(options) {
    resetState();
    window.RevisionUI?.reset("errorBol", options || {});
  }

  function clearErrorBolFormForNew() {
    const ids = [
      "labelCid", "item", "itemDisplay", "errorCaseQty",
      "employeeName", "employeeCode", "workAgeYear", "workAgeMonth",
      "interpreterName", "errorDate", "confirmCauseOther",
      "employeeConfirmText", "errorDescription", "errorReasonOther"
    ];

    ids.forEach((id) => setValue(id, ""));

    if ($("errorReason")) setSelectValue("errorReason", "");
    if ($("nationality")) setSelectValue("nationality", "");
    if ($("shift")) setSelectValue("shift", "");
    if ($("osm")) setSelectValue("osm", "");
    if ($("otm")) setSelectValue("otm", "");
    if ($("auditName")) setSelectValue("auditName", "");

    document.querySelectorAll('input[type="checkbox"][name="confirmCauseSelected"]').forEach((el) => {
      el.checked = false;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const uploadList = $("uploadList");
    if (uploadList) {
      Array.from(uploadList.querySelectorAll('input[type="file"]')).forEach((input) => {
        clearFileInput(input);
        const box = input.closest(".uploadBox") || input.closest(".uploadItem") || input.parentElement;
        clearPreviewBox(box);
      });
    }
  }

  function bindButtons() {
    const btnLoad = $("btnLoadErrorBolRef");
    const btnReset = $("btnResetErrorBolRevision");

    if (btnLoad && !btnLoad.dataset.boundRevision) {
      btnLoad.dataset.boundRevision = "1";
      btnLoad.addEventListener("click", async () => {
        const refNo = $("errorBolLoadRefNo")?.value || "";
        await loadErrorBolForEdit(refNo);
      });
    }

    if (btnReset && !btnReset.dataset.boundRevision) {
      btnReset.dataset.boundRevision = "1";
      btnReset.addEventListener("click", async () => {
        resetErrorBolRevisionState({ keepInput: false, showNewBadge: true });
        clearErrorBolFormForNew();
      });
    }

    window.RevisionUI?.attachEnterToLoad("errorBol", async (refNo) => {
      await loadErrorBolForEdit(refNo);
    });
  }

  function init() {
    if (state.ready) return;
    state.ready = true;

    decorateCollectPayload();
    bindButtons();
    resetErrorBolRevisionState({ keepInput: true, showNewBadge: false });
  }

  window.ErrorBolRevision = {
    init,
    state,
    load: loadErrorBolForEdit,
    fillForm: fillErrorBolFormFromRecord,
    reset: resetErrorBolRevisionState,
    clearFormForNew: clearErrorBolFormForNew,
    buildRevisionMeta,
    getState: () => ({ ...state, existingAssets: { ...state.existingAssets } })
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
