(function () {
  const $ = (id) => document.getElementById(id);

  const REVISION_UI_CONFIG = {
    errorBol: {
      panelId: "errorBolRevisionPanel",
      badgeId: "errorBolEditBadge",
      hintId: "errorBolRevisionHint",
      loadRefInputId: "errorBolLoadRefNo",

      hidden: {
        editMode: "errorBolEditMode",
        baseRecordId: "errorBolBaseRecordId",
        previousRecordId: "errorBolPreviousRecordId",
        recordId: "errorBolRecordId",
        revisionNo: "errorBolRevisionNo"
      },

      texts: {
        defaultHint: "หากกรอก Ref เดิมแล้วกดโหลด ระบบจะดึงข้อมูลฉบับล่าสุดกลับขึ้นมาให้แก้ไข",
        newBadge: "งานใหม่",
        editBadge: "โหมดแก้ไข",
        loadedPrefix: "โหลดข้อมูลแล้ว",
        resetDone: "กลับสู่โหมดสร้างงานใหม่แล้ว"
      }
    },

    report500: {
      panelId: "report500RevisionPanel",
      badgeId: "report500EditBadge",
      hintId: "report500RevisionHint",
      loadRefInputId: "report500LoadRefNo",

      hidden: {
        editMode: "report500EditMode",
        baseRecordId: "report500BaseRecordId",
        previousRecordId: "report500PreviousRecordId",
        recordId: "report500RecordId",
        revisionNo: "report500RevisionNo"
      },

      texts: {
        defaultHint: "เมื่อโหลดสำเร็จ ระบบจะใช้ข้อมูลฉบับล่าสุดของ Ref นี้ในการแก้ไข",
        newBadge: "งานใหม่",
        editBadge: "โหมดแก้ไข",
        loadedPrefix: "โหลดข้อมูลแล้ว",
        resetDone: "กลับสู่โหมดสร้างงานใหม่แล้ว"
      }
    }
  };

  function getCfg(type) {
    const cfg = REVISION_UI_CONFIG[String(type || "").trim()];
    if (!cfg) throw new Error("ไม่พบ config ของ revision ui: " + type);
    return cfg;
  }

  function getEls(type) {
    const cfg = getCfg(type);
    return {
      panel: $(cfg.panelId),
      badge: $(cfg.badgeId),
      hint: $(cfg.hintId),
      loadRefInput: $(cfg.loadRefInputId),

      editMode: $(cfg.hidden.editMode),
      baseRecordId: $(cfg.hidden.baseRecordId),
      previousRecordId: $(cfg.hidden.previousRecordId),
      recordId: $(cfg.hidden.recordId),
      revisionNo: $(cfg.hidden.revisionNo)
    };
  }

  function safeText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function safeValue(el, value) {
    if (el) el.value = value == null ? "" : String(value);
  }

  function clearStateClass(el) {
    if (!el) return;
    el.classList.remove("is-success", "is-warning", "is-error", "is-editing", "is-new", "hidden");
  }

  function applyHintState(el, state) {
    if (!el) return;
    el.classList.remove("is-success", "is-warning", "is-error");
    if (state === "success") el.classList.add("is-success");
    if (state === "warning") el.classList.add("is-warning");
    if (state === "error") el.classList.add("is-error");
  }

  function applyBadgeState(el, mode, label) {
    if (!el) return;

    el.classList.remove("hidden", "is-editing", "is-new");

    if (mode === "revision") {
      el.classList.add("is-editing");
    } else {
      el.classList.add("is-new");
    }

    safeText(el, label || (mode === "revision" ? "โหมดแก้ไข" : "งานใหม่"));
  }

  function hideBadge(el) {
    if (!el) return;
    el.classList.remove("is-editing", "is-new");
    el.classList.add("hidden");
    safeText(el, "");
  }

  function normalizeMeta(meta) {
    const m = meta && typeof meta === "object" ? meta : {};
    return {
      editMode: String(m.editMode || m.mode || "").trim().toLowerCase() === "revision" ? "revision" : "new",
      refNo: String(m.refNo || "").trim(),
      recordId: String(m.recordId || "").trim(),
      baseRecordId: String(m.baseRecordId || "").trim(),
      previousRecordId: String(m.previousRecordId || "").trim(),
      revisionNo: m.revisionNo == null || m.revisionNo === "" ? "" : String(m.revisionNo),
      revisionLabel: String(m.revisionLabel || "").trim(),
      revisionCreatedAt: String(m.revisionCreatedAt || "").trim(),
      revisionCreatedBy: String(m.revisionCreatedBy || "").trim()
    };
  }

  function setHiddenState(type, meta) {
    const els = getEls(type);
    const m = normalizeMeta(meta);

    safeValue(els.editMode, m.editMode);
    safeValue(els.baseRecordId, m.baseRecordId);
    safeValue(els.previousRecordId, m.previousRecordId);
    safeValue(els.recordId, m.recordId);
    safeValue(els.revisionNo, m.revisionNo);
  }

  function clearHiddenState(type) {
    const els = getEls(type);
    safeValue(els.editMode, "new");
    safeValue(els.baseRecordId, "");
    safeValue(els.previousRecordId, "");
    safeValue(els.recordId, "");
    safeValue(els.revisionNo, "");
  }

  function getRevisionState(type) {
    const els = getEls(type);
    return {
      editMode: String(els.editMode?.value || "new").trim().toLowerCase() === "revision" ? "revision" : "new",
      baseRecordId: String(els.baseRecordId?.value || "").trim(),
      previousRecordId: String(els.previousRecordId?.value || "").trim(),
      recordId: String(els.recordId?.value || "").trim(),
      revisionNo: String(els.revisionNo?.value || "").trim(),
      refNo: String(els.loadRefInput?.value || "").trim()
    };
  }

  function setRevisionHint(type, text, state) {
    const cfg = getCfg(type);
    const els = getEls(type);

    if (!els.hint) return;

    safeText(els.hint, text || cfg.texts.defaultHint);
    applyHintState(els.hint, state || "");
  }

  function resetRevisionHint(type) {
    const cfg = getCfg(type);
    const els = getEls(type);
    if (!els.hint) return;

    els.hint.classList.remove("is-success", "is-warning", "is-error");
    safeText(els.hint, cfg.texts.defaultHint);
  }

  function setEditModeBadge(type, meta) {
    const cfg = getCfg(type);
    const els = getEls(type);
    const m = normalizeMeta(meta);

    applyBadgeState(
      els.badge,
      m.editMode,
      m.editMode === "revision" ? cfg.texts.editBadge : cfg.texts.newBadge
    );

    setHiddenState(type, m);
  }

  function clearEditModeBadge(type, keepNewBadge) {
    const cfg = getCfg(type);
    const els = getEls(type);
    clearHiddenState(type);

    if (keepNewBadge) {
      applyBadgeState(els.badge, "new", cfg.texts.newBadge);
    } else {
      hideBadge(els.badge);
    }
  }

  function buildLoadedMessage(type, meta) {
    const cfg = getCfg(type);
    const m = normalizeMeta(meta);

    const parts = [cfg.texts.loadedPrefix];
    if (m.refNo) parts.push(`Ref ${m.refNo}`);
    if (m.revisionLabel) {
      parts.push(`(${m.revisionLabel})`);
    } else if (m.revisionNo !== "") {
      parts.push(`(Rev.${m.revisionNo})`);
    }

    return parts.join(" ");
  }

  function showRevisionUiSuccess(type, meta) {
    const els = getEls(type);
    const m = normalizeMeta(meta);

    if (m.refNo && els.loadRefInput) {
      safeValue(els.loadRefInput, m.refNo);
    }

    setEditModeBadge(type, {
      ...m,
      editMode: "revision"
    });

    setRevisionHint(type, buildLoadedMessage(type, m), "success");
  }

  function showRevisionUiError(type, message) {
    clearEditModeBadge(type, false);
    setRevisionHint(type, message || "ไม่สามารถโหลดข้อมูลได้", "error");
  }

  function showRevisionUiWarning(type, message) {
    setRevisionHint(type, message || "กรุณาตรวจสอบข้อมูล", "warning");
  }

  function resetRevisionUi(type, options) {
    const cfg = getCfg(type);
    const els = getEls(type);
    const opt = options && typeof options === "object" ? options : {};
    const keepInput = !!opt.keepInput;
    const showNewBadge = opt.showNewBadge !== false;

    clearHiddenState(type);

    if (!keepInput && els.loadRefInput) {
      safeValue(els.loadRefInput, "");
    }

    resetRevisionHint(type);

    if (showNewBadge) {
      applyBadgeState(els.badge, "new", cfg.texts.newBadge);
      setRevisionHint(type, cfg.texts.resetDone, "success");
    } else {
      hideBadge(els.badge);
    }
  }

  function setRevisionUiLoading(type, loading) {
    const cfg = getCfg(type);
    const els = getEls(type);
    const isLoading = !!loading;

    if (els.panel) {
      els.panel.classList.toggle("is-loading", isLoading);
      if (isLoading) {
        els.panel.setAttribute("aria-busy", "true");
      } else {
        els.panel.removeAttribute("aria-busy");
      }
    }

    if (isLoading) {
      setRevisionHint(type, "กำลังโหลดข้อมูลจาก Ref เดิม...", "warning");
    } else {
      if (!els.hint?.classList.contains("is-success") && !els.hint?.classList.contains("is-error")) {
        safeText(els.hint, cfg.texts.defaultHint);
        applyHintState(els.hint, "");
      }
    }
  }

  function attachEnterToLoad(type, onLoad) {
    const els = getEls(type);
    if (!els.loadRefInput || typeof onLoad !== "function") return;

    els.loadRefInput.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      onLoad(String(els.loadRefInput.value || "").trim());
    });
  }

  function initSingleType(type) {
    const cfg = getCfg(type);
    const els = getEls(type);

    if (!els.panel) return;

    clearHiddenState(type);
    hideBadge(els.badge);
    safeText(els.hint, cfg.texts.defaultHint);
    applyHintState(els.hint, "");
  }

  function initRevisionUi() {
    Object.keys(REVISION_UI_CONFIG).forEach(function (type) {
      try {
        initSingleType(type);
      } catch (_) {}
    });
  }

  window.RevisionUI = {
    init: initRevisionUi,
    getConfig: getCfg,
    getState: getRevisionState,
    setHiddenState: setHiddenState,
    clearHiddenState: clearHiddenState,
    setHint: setRevisionHint,
    resetHint: resetRevisionHint,
    setEditModeBadge: setEditModeBadge,
    clearEditModeBadge: clearEditModeBadge,
    setLoading: setRevisionUiLoading,
    showSuccess: showRevisionUiSuccess,
    showWarning: showRevisionUiWarning,
    showError: showRevisionUiError,
    reset: resetRevisionUi,
    attachEnterToLoad: attachEnterToLoad
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRevisionUi);
  } else {
    initRevisionUi();
  }
})();
