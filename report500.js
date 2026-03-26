/* =========================================================
 * report500.js
 * Frontend logic for Report500
 * ========================================================= */

(function () {
  const RPT = {
    options: {
      branchList: [],
      reportTypeList: [],
      urgencyList: [],
      notifyToList: [],
      locationTypeList: [],
      positionList: [],
      departmentList: [],
      remarkList: [],
      titleList: [],
      actionTypeList: [],
      testResultList: [],
      emailList: []
    },
    state: {
      ready: false,
      loading: false,
      initializedRows: false,
      promise: null,
      submitting: false
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindReport500Events();
    primeReport500Defaults();
  });

  function $(id) {
    return document.getElementById(id);
  }

  function q(sel, root = document) {
    return root.querySelector(sel);
  }

  function qa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function text(v) {
    return String(v == null ? "" : v).trim();
  }

  function esc(v) {
    const s = String(v == null ? "" : v);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function api(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    return path;
  }

  function getAuthName() {
    return text(window.AUTH?.name || "");
  }

  function isOtherValue(v) {
    return text(v) === "อื่นๆ";
  }

  function toArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function normalizeDateToDisplay(value) {
    const s = text(value);
    if (!s) return "";
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  }

  function normalizeTimeToDisplay(value) {
    const s = text(value);
    if (!s) return "";
    const m = s.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) return `${m[1]}:${m[2]}:${m[3] || "00"}`;
    return s;
  }

  function todayInputValue() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function currentThaiYear() {
    return String(new Date().getFullYear() + 543);
  }

  function readRefNoWithYear(raw) {
    const running = text(raw).replace(/[^\d]/g, "");
    if (!running) return "";
    return `${running}-${currentThaiYear()}`;
  }

  function makeOptionTag(value, label) {
    return `<option value="${esc(value)}">${esc(label)}</option>`;
  }

  function joinOptionTexts(list) {
    return toArray(list).map(x => {
      const value = text(x?.value);
      const other = text(x?.textValue);
      return value === "อื่นๆ" ? (other || "อื่นๆ") : (other || value);
    }).filter(Boolean).join(" | ");
  }

  function swalKv(label, value) {
    return `
      <div class="swalKv">
        <div class="swalKvLabel">${esc(label)}</div>
        <div class="swalKvValue">${esc(value || "-")}</div>
      </div>
    `;
  }

  function fileToBase64(file) {
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

  function bindReport500Events() {
    $("rptBranch")?.addEventListener("change", syncSingleOtherWraps);
    $("rptIncidentLocation")?.addEventListener("change", syncSingleOtherWraps);

    $("btnRptAddPerson")?.addEventListener("click", () => addPersonRow());
    $("btnRptAddImage")?.addEventListener("click", () => addImageRow());

    $("btnRptEmailCheckAll")?.addEventListener("click", () => setAllRptEmailChecks(true));
    $("btnRptEmailClearAll")?.addEventListener("click", () => setAllRptEmailChecks(false));

    qa(".rptAddDetailBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        if (target === "damage") addSimpleTextRow("rptDamageList", "ความเสียหาย");
        if (target === "action") addActionRow();
        if (target === "evidence") addSimpleTextRow("rptEvidenceList", "หลักฐาน");
        if (target === "cause") addSimpleTextRow("rptCauseList", "สาเหตุ");
        if (target === "prevention") addSimpleTextRow("rptPreventionList", "การป้องกัน");
        if (target === "learning") addSimpleTextRow("rptLearningList", "สิ่งที่ได้จากการสอบสวน");
      });
    });

    $("btnRptPreview")?.addEventListener("click", previewReport500Summary);
    $("btnRptSubmit")?.addEventListener("click", submitReport500Form);

    $("rptRefNo")?.addEventListener("input", updateRptRefYear);

    $("tabUnder500")?.addEventListener("click", () => {
      ensureReport500Ready().catch(err => {
        console.error("ensureReport500Ready:", err);
      });
    });
  }

  function primeReport500Defaults() {
    updateRptRefYear();

    if ($("rptReportDate") && !$("rptReportDate").value) {
      $("rptReportDate").value = todayInputValue();
    }

    const authName = getAuthName();
    if ($("rptReportedBy")) {
      if (authName) {
        $("rptReportedBy").innerHTML = makeOptionTag(authName, authName);
        $("rptReportedBy").value = authName;
      } else {
        $("rptReportedBy").innerHTML = makeOptionTag("", "-- เลือก --");
      }
    }
  }

  function updateRptRefYear() {
    const el = $("rptRefYear");
    if (el) el.textContent = "-" + currentThaiYear();
  }

  async function ensureReport500Ready() {
    if (RPT.state.ready) return;
    if (RPT.state.promise) return RPT.state.promise;

    RPT.state.loading = true;
    RPT.state.promise = (async () => {
      try {
        await loadReport500OptionsSafe();
        RPT.state.ready = true;
      } catch (err) {
        RPT.state.ready = false;
        throw err;
      } finally {
        RPT.state.loading = false;
        RPT.state.promise = null;
      }
    })();

    return RPT.state.promise;
  }

  async function loadReport500OptionsSafe() {
    const res = await fetch(api("/report500/options"), { method: "GET" });
    const raw = await res.text();

    let json = {};
    try {
      json = JSON.parse(raw);
    } catch (_) {
      throw new Error("Backend /report500/options ไม่ได้ส่ง JSON กลับมา: " + raw.slice(0, 300));
    }

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `โหลด Report500 options ไม่สำเร็จ (HTTP ${res.status})`);
    }

    RPT.options = json.data || RPT.options;

    fillReport500Dropdowns();
    renderReport500OptionMatrices();

    if (!RPT.state.initializedRows) {
      buildReport500InitialRows();
      RPT.state.initializedRows = true;
    }

    syncSingleOtherWraps();
    console.log("Report500 options loaded:", RPT.options);
  }

  function fillReport500Dropdowns() {
    fillSelectFromOptionList($("rptBranch"), RPT.options.branchList, "-- เลือกสาขา --");
    fillSelectFromOptionList($("rptIncidentLocation"), RPT.options.locationTypeList, "-- เลือกสถานที่ --");

    const authName = getAuthName();
    const reporter = $("rptReportedBy");
    if (reporter) {
      const opts = [];
      if (authName) opts.push(makeOptionTag(authName, authName));
      else opts.push(makeOptionTag("", "-- เลือก --"));
      reporter.innerHTML = opts.join("");
      if (authName) reporter.value = authName;
    }

    renderRptEmailSelector();
  }

  function fillSelectFromOptionList(selectEl, list, placeholder) {
    if (!selectEl) return;
    const rows = toArray(list);
    selectEl.innerHTML =
      makeOptionTag("", placeholder || "-- เลือก --") +
      rows.map(item => {
        const label = text(item?.label || item?.value || "");
        const value = text(item?.value || item?.label || "");
        return makeOptionTag(value, label);
      }).join("");
  }

  function renderReport500OptionMatrices() {
    renderMatrixCheckboxes("rptReportTypes", RPT.options.reportTypeList, "reportType");
    renderMatrixCheckboxes("rptUrgencyTypes", RPT.options.urgencyList, "urgency");
    renderMatrixCheckboxes("rptNotifyTo", RPT.options.notifyToList, "notify");
  }

  function renderMatrixCheckboxes(rootId, list, groupName) {
    const root = $(rootId);
    if (!root) return;

    const rows = toArray(list);
    if (!rows.length) {
      root.innerHTML = `<div class="optionMatrixEmpty">ไม่มีตัวเลือก</div>`;
      return;
    }

    root.innerHTML = rows.map((item, idx) => {
      const value = text(item?.value || item?.label || "");
      const label = text(item?.label || item?.value || "");
      const requiresText = item?.requiresText ? "1" : "0";
      const placeholder = text(item?.placeholder || "ระบุข้อมูลเพิ่มเติม");
      const otherId = `${groupName}_other_${idx}`;

      return `
        <div class="optionChoice">
          <label class="optionChoiceCard">
            <input type="checkbox"
              class="rptMatrixChk"
              data-group="${esc(groupName)}"
              data-value="${esc(value)}"
              data-requires-text="${requiresText}"
              data-other-id="${esc(otherId)}">
            <span class="optionChoiceMark"></span>
            <span class="optionChoiceText">${esc(label)}</span>
          </label>
          <div id="${esc(otherId)}" class="optionChoiceOther hidden">
            <input type="text" class="input" placeholder="${esc(placeholder)}">
          </div>
        </div>
      `;
    }).join("");

    qa(".rptMatrixChk", root).forEach(chk => {
      chk.addEventListener("change", () => {
        const otherId = chk.getAttribute("data-other-id");
        const needText = chk.getAttribute("data-requires-text") === "1";
        const target = otherId ? $(otherId) : null;
        if (target) target.classList.toggle("hidden", !(chk.checked && needText));
      });
    });
  }

  function renderRptEmailSelector() {
    const root = $("rptEmailSelector");
    if (!root) return;

    const emails = toArray(RPT.options.emailList);
    if (!emails.length) {
      root.innerHTML = `<div class="optionMatrixEmpty">ไม่พบรายการอีเมลใน Google Sheet</div>`;
      return;
    }

    root.innerHTML = emails.map(item => {
      const value = text(item?.value || item?.label || "");
      return `
        <label class="emailItem">
          <input type="checkbox" class="rptEmailChk" value="${esc(value)}">
          <span class="emailCheckBox"></span>
          <span class="emailText">${esc(value)}</span>
        </label>
      `;
    }).join("");
  }

  function setAllRptEmailChecks(flag) {
    qa(".rptEmailChk").forEach(chk => {
      chk.checked = !!flag;
    });
  }

  function getSelectedRptEmails() {
    return qa(".rptEmailChk:checked")
      .map(el => text(el.value))
      .filter(Boolean);
  }

  function getCheckedRptEmails() {
    return qa(".rptEmailChk:checked")
      .map(el => text(el.value))
      .filter(Boolean);
  }

  function splitEmails(raw) {
    return text(raw)
      .split(/[\n,;]+/)
      .map(s => text(s))
      .filter(Boolean);
  }

  function uniqueEmails(list) {
    const seen = new Set();
    const out = [];
    toArray(list).forEach(v => {
      const s = text(v).toLowerCase();
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  }

  function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function collectReport500Recipients() {
    const selected = getCheckedRptEmails();
    const extra = splitEmails($("rptEmailOther")?.value);
    const all = uniqueEmails([].concat(selected, extra));
    const invalid = all.filter(v => !isValidEmailFormat(v));

    return {
      all,
      invalid
    };
  }

  function syncSingleOtherWraps() {
    $("rptBranchOtherWrap")?.classList.toggle("hidden", !isOtherValue($("rptBranch")?.value));
    $("rptIncidentLocationOtherWrap")?.classList.toggle("hidden", !isOtherValue($("rptIncidentLocation")?.value));
  }

  function buildReport500InitialRows() {
    if (!$("rptPeopleList")?.children.length) addPersonRow();
    if (!$("rptDamageList")?.children.length) addSimpleTextRow("rptDamageList", "ความเสียหาย");
    if (!$("rptActionList")?.children.length) addActionRow();
    if (!$("rptEvidenceList")?.children.length) addSimpleTextRow("rptEvidenceList", "หลักฐาน");
    if (!$("rptCauseList")?.children.length) addSimpleTextRow("rptCauseList", "สาเหตุ");
    if (!$("rptPreventionList")?.children.length) addSimpleTextRow("rptPreventionList", "การป้องกัน");
    if (!$("rptLearningList")?.children.length) addSimpleTextRow("rptLearningList", "สิ่งที่ได้จากการสอบสวน");
    if (!$("rptImageList")?.children.length) {
      addImageRow();
      addImageRow();
    }
  }

  function addPersonRow() {
    const root = $("rptPeopleList");
    if (!root) return;

    const index = root.children.length + 1;
    const wrap = document.createElement("div");
    wrap.className = "rptItemCard rptPersonCard";
    wrap.innerHTML = `
      <div class="rptItemHead">
        <div class="rptItemTitle">ผู้เกี่ยวข้อง #${index}</div>
        <button type="button" class="btn dangerLight rptRemoveBtn">ลบ</button>
      </div>

      <div class="gridCompact">
        <div class="field">
          <label>คำนำหน้า</label>
          <select class="rptPersonTitle"></select>
          <div class="rptInlineOtherWrap hidden"><input class="rptPersonTitleOther" placeholder="ระบุคำนำหน้า"></div>
        </div>

        <div class="field">
          <label>ชื่อ-นามสกุล</label>
          <input class="rptPersonName" placeholder="ชื่อผู้เกี่ยวข้อง">
        </div>

        <div class="field">
          <label>แผนก</label>
          <select class="rptPersonDepartment"></select>
          <div class="rptInlineOtherWrap hidden"><input class="rptPersonDepartmentOther" placeholder="ระบุแผนก"></div>
        </div>

        <div class="field">
          <label>ตำแหน่ง</label>
          <select class="rptPersonPosition"></select>
          <div class="rptInlineOtherWrap hidden"><input class="rptPersonPositionOther" placeholder="ระบุตำแหน่ง"></div>
        </div>

        <div class="field fieldSpan2">
          <label>หมายเหตุ</label>
          <select class="rptPersonRemark"></select>
          <div class="rptInlineOtherWrap hidden"><input class="rptPersonRemarkOther" placeholder="ระบุหมายเหตุ"></div>
        </div>
      </div>
    `;
    root.appendChild(wrap);

    fillSelectFromOptionList(q(".rptPersonTitle", wrap), RPT.options.titleList, "-- เลือก --");
    fillSelectFromOptionList(q(".rptPersonDepartment", wrap), RPT.options.departmentList, "-- เลือก --");
    fillSelectFromOptionList(q(".rptPersonPosition", wrap), RPT.options.positionList, "-- เลือก --");
    fillSelectFromOptionList(q(".rptPersonRemark", wrap), RPT.options.remarkList, "-- เลือก --");

    bindOtherSelectPair(q(".rptPersonTitle", wrap), q(".rptPersonTitleOther", wrap));
    bindOtherSelectPair(q(".rptPersonDepartment", wrap), q(".rptPersonDepartmentOther", wrap));
    bindOtherSelectPair(q(".rptPersonPosition", wrap), q(".rptPersonPositionOther", wrap));
    bindOtherSelectPair(q(".rptPersonRemark", wrap), q(".rptPersonRemarkOther", wrap));

    q(".rptRemoveBtn", wrap)?.addEventListener("click", () => {
      wrap.remove();
      renumberItemTitles(root, "ผู้เกี่ยวข้อง");
    });
  }

  function addSimpleTextRow(rootId, titleText) {
    const root = $(rootId);
    if (!root) return;

    const index = root.children.length + 1;
    const wrap = document.createElement("div");
    wrap.className = "rptItemCard";
    wrap.innerHTML = `
      <div class="rptItemHead">
        <div class="rptItemTitle">${esc(titleText)} #${index}</div>
        <button type="button" class="btn dangerLight rptRemoveBtn">ลบ</button>
      </div>
      <div class="field">
        <label>รายละเอียด</label>
        <textarea class="rptSimpleText" rows="3" placeholder="กรอกรายละเอียด"></textarea>
      </div>
    `;
    root.appendChild(wrap);

    q(".rptRemoveBtn", wrap)?.addEventListener("click", () => {
      wrap.remove();
      renumberItemTitles(root, titleText);
    });
  }

  function addActionRow() {
    const root = $("rptActionList");
    if (!root) return;

    const index = root.children.length + 1;
    const wrap = document.createElement("div");
    wrap.className = "rptItemCard rptActionCard";
    wrap.innerHTML = `
      <div class="rptItemHead">
        <div class="rptItemTitle">การดำเนินการ #${index}</div>
        <button type="button" class="btn dangerLight rptRemoveBtn">ลบ</button>
      </div>

      <div class="gridCompact">
        <div class="field">
          <label>ชนิดการดำเนินการ</label>
          <select class="rptActionType"></select>
          <div class="rptInlineOtherWrap hidden"><input class="rptActionTypeOther" placeholder="ระบุการดำเนินการ"></div>
        </div>

        <div class="field fieldSpan2">
          <label>จุดที่เกี่ยวข้อง (เลือกได้หลายข้อ)</label>
          <div class="rptActionLocations optionMatrix compact"></div>
        </div>

        <div class="field rptActionTestWrap hidden">
          <label>ผลการตรวจ</label>
          <select class="rptActionTestResult"></select>
        </div>

        <div class="field rptActionAmountWrap hidden">
          <label>ปริมาณ</label>
          <input class="rptActionTestAmount" placeholder="เช่น 70 mg%, 0.12">
        </div>

        <div class="field fieldSpan2">
          <label>หมายเหตุ</label>
          <textarea class="rptActionNote" rows="3" placeholder="รายละเอียดเพิ่มเติม"></textarea>
        </div>
      </div>
    `;
    root.appendChild(wrap);

    fillSelectFromOptionList(q(".rptActionType", wrap), RPT.options.actionTypeList, "-- เลือก --");
    fillSelectFromOptionList(q(".rptActionTestResult", wrap), RPT.options.testResultList, "-- เลือกผลตรวจ --");
    bindOtherSelectPair(q(".rptActionType", wrap), q(".rptActionTypeOther", wrap));

    renderMatrixCheckboxesInRoot(q(".rptActionLocations", wrap), RPT.options.locationTypeList, "actionLoc");

    q(".rptActionType", wrap)?.addEventListener("change", () => syncActionCardState(wrap));
    q(".rptActionTestResult", wrap)?.addEventListener("change", () => syncActionCardState(wrap));
    syncActionCardState(wrap);

    q(".rptRemoveBtn", wrap)?.addEventListener("click", () => {
      wrap.remove();
      renumberItemTitles(root, "การดำเนินการ");
    });
  }

  function renderMatrixCheckboxesInRoot(root, list, groupName) {
    if (!root) return;
    const rows = toArray(list);

    root.innerHTML = rows.map((item, idx) => {
      const value = text(item?.value || item?.label || "");
      const label = text(item?.label || item?.value || "");
      const requiresText = item?.requiresText ? "1" : "0";
      const placeholder = text(item?.placeholder || "ระบุข้อมูลเพิ่มเติม");
      const otherId = `${groupName}_${Math.random().toString(36).slice(2)}_${idx}`;

      return `
        <div class="optionChoice">
          <label class="optionChoiceCard compact">
            <input type="checkbox"
              class="rptMatrixChk"
              data-group="${esc(groupName)}"
              data-value="${esc(value)}"
              data-requires-text="${requiresText}"
              data-other-id="${esc(otherId)}">
            <span class="optionChoiceMark"></span>
            <span class="optionChoiceText">${esc(label)}</span>
          </label>
          <div id="${esc(otherId)}" class="optionChoiceOther hidden">
            <input type="text" class="input" placeholder="${esc(placeholder)}">
          </div>
        </div>
      `;
    }).join("");

    qa(".rptMatrixChk", root).forEach(chk => {
      chk.addEventListener("change", () => {
        const otherId = chk.getAttribute("data-other-id");
        const needText = chk.getAttribute("data-requires-text") === "1";
        const target = otherId ? $(otherId) : null;
        if (target) target.classList.toggle("hidden", !(chk.checked && needText));
      });
    });
  }

  function syncActionCardState(card) {
    const typeSelect = q(".rptActionType", card);
    const resultSelect = q(".rptActionTestResult", card);
    const testWrap = q(".rptActionTestWrap", card);
    const amountWrap = q(".rptActionAmountWrap", card);

    const selectedValue = text(typeSelect?.value);
    const meta = toArray(RPT.options.actionTypeList).find(x => text(x?.value || x?.label) === selectedValue);

    const supportsTest = !!meta?.supportsTestResult;
    const supportsAmount = !!meta?.supportsAmount;
    const testResult = text(resultSelect?.value);

    if (testWrap) testWrap.classList.toggle("hidden", !supportsTest);
    if (amountWrap) amountWrap.classList.toggle("hidden", !(supportsTest && supportsAmount && testResult === "พบ"));
  }

  function addImageRow() {
    const root = $("rptImageList");
    if (!root) return;

    const index = root.children.length + 1;
    const wrap = document.createElement("div");
    wrap.className = "rptItemCard rptImageCard";
    wrap.innerHTML = `
      <div class="rptItemHead">
        <div class="rptItemTitle">รูปภาพ #${index}</div>
        <button type="button" class="btn dangerLight rptRemoveBtn">ลบ</button>
      </div>

      <div class="gridCompact">
        <div class="field">
          <label>ไฟล์รูปภาพ</label>
          <input type="file" class="rptImageFile" accept="image/*">
        </div>

        <div class="field fieldSpan2">
          <label>คำบรรยายภาพ</label>
          <textarea class="rptImageCaption" rows="3" placeholder="กรอกคำอธิบายบนภาพ"></textarea>
        </div>

        <div class="field fieldSpan2">
          <div class="rptImagePreviewEmpty">ยังไม่ได้เลือกรูปภาพ</div>
          <img class="rptImagePreview hidden" alt="preview">
        </div>
      </div>
    `;
    root.appendChild(wrap);

    q(".rptImageFile", wrap)?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const empty = q(".rptImagePreviewEmpty", wrap);
      const img = q(".rptImagePreview", wrap);

      if (!file || !img || !empty) return;

      const url = URL.createObjectURL(file);
      img.src = url;
      img.classList.remove("hidden");
      empty.classList.add("hidden");
    });

    q(".rptRemoveBtn", wrap)?.addEventListener("click", () => {
      wrap.remove();
      renumberItemTitles(root, "รูปภาพ");
    });
  }

  function bindOtherSelectPair(selectEl, inputEl) {
    if (!selectEl || !inputEl) return;
    const wrap = inputEl.closest(".rptInlineOtherWrap");
    const sync = () => wrap?.classList.toggle("hidden", !isOtherValue(selectEl.value));
    selectEl.addEventListener("change", sync);
    sync();
  }

  function renumberItemTitles(root, baseTitle) {
    qa(".rptItemCard", root).forEach((card, idx) => {
      const title = q(".rptItemTitle", card);
      if (title) title.textContent = `${baseTitle} #${idx + 1}`;
    });
  }

  function collectMatrixValues(rootId) {
    const root = $(rootId);
    if (!root) return [];

    return qa(".rptMatrixChk:checked", root).map(chk => {
      const value = text(chk.getAttribute("data-value"));
      const otherId = chk.getAttribute("data-other-id");
      const otherWrap = otherId ? $(otherId) : null;
      const otherInput = otherWrap ? q("input", otherWrap) : null;

      return {
        value,
        textValue: text(otherInput?.value || "")
      };
    }).filter(x => x.value || x.textValue);
  }

  function collectPeople() {
    return qa(".rptPersonCard", $("rptPeopleList") || document).map(card => ({
      title: text(q(".rptPersonTitle", card)?.value),
      titleOther: text(q(".rptPersonTitleOther", card)?.value),
      fullName: text(q(".rptPersonName", card)?.value),
      department: text(q(".rptPersonDepartment", card)?.value),
      departmentOther: text(q(".rptPersonDepartmentOther", card)?.value),
      position: text(q(".rptPersonPosition", card)?.value),
      positionOther: text(q(".rptPersonPositionOther", card)?.value),
      remark: text(q(".rptPersonRemark", card)?.value),
      remarkOther: text(q(".rptPersonRemarkOther", card)?.value)
    })).filter(row => Object.values(row).some(Boolean));
  }

  function collectSimpleTexts(rootId) {
    return qa(".rptItemCard", $(rootId) || document)
      .map(card => ({ text: text(q(".rptSimpleText", card)?.value) }))
      .filter(x => x.text);
  }

  function collectActions() {
    return qa(".rptActionCard", $("rptActionList") || document).map(card => {
      const targetLocations = qa(".rptActionLocations .rptMatrixChk:checked", card).map(chk => {
        const value = text(chk.getAttribute("data-value"));
        const otherId = chk.getAttribute("data-other-id");
        const otherWrap = otherId ? $(otherId) : null;
        const otherInput = otherWrap ? q("input", otherWrap) : null;

        return {
          value,
          textValue: text(otherInput?.value || "")
        };
      }).filter(x => x.value || x.textValue);

      return {
        actionType: text(q(".rptActionType", card)?.value),
        actionTypeOther: text(q(".rptActionTypeOther", card)?.value),
        targetLocations,
        testResult: text(q(".rptActionTestResult", card)?.value),
        testAmount: text(q(".rptActionTestAmount", card)?.value),
        note: text(q(".rptActionNote", card)?.value)
      };
    }).filter(row => Object.values(row).some(v => Array.isArray(v) ? v.length : !!v));
  }

  async function collectImagesAsFiles() {
    const out = [];
    const cards = qa(".rptImageCard", $("rptImageList") || document);

    for (const card of cards) {
      const input = q(".rptImageFile", card);
      const file = input?.files?.[0];
      const caption = text(q(".rptImageCaption", card)?.value);

      if (!file) continue;

      const base64 = await fileToBase64(file);
      out.push({
        filename: file.name || "image.jpg",
        mimeType: file.type || "image/jpeg",
        caption,
        base64
      });
    }

    return out;
  }

  async function collectReport500ImagesSafe() {
    const files = await collectImagesAsFiles();
    return toArray(files).filter(f => text(f?.base64));
  }

  function collectReport500Payload() {
    const authName = getAuthName();

    return {
      refNo: readRefNoWithYear($("rptRefNo")?.value),
      branch: text($("rptBranch")?.value),
      branchOther: text($("rptBranchOther")?.value),
      subject: text($("rptSubject")?.value),

      reportTypes: collectMatrixValues("rptReportTypes"),
      urgencyTypes: collectMatrixValues("rptUrgencyTypes"),
      notifyTo: collectMatrixValues("rptNotifyTo"),

      incidentDate: normalizeDateToDisplay($("rptIncidentDate")?.value),
      incidentTime: normalizeTimeToDisplay($("rptIncidentTime")?.value),
      incidentLocation: text($("rptIncidentLocation")?.value),
      incidentLocationOther: text($("rptIncidentLocationOther")?.value),
      incidentArea: text($("rptIncidentArea")?.value),

      whatHappen: text($("rptWhatHappen")?.value),
      offenderStatement: text($("rptOffenderStatement")?.value),
      summaryText: text($("rptSummaryText")?.value),

      persons: collectPeople(),
      damages: collectSimpleTexts("rptDamageList"),
      actions: collectActions(),
      evidences: collectSimpleTexts("rptEvidenceList"),
      causes: collectSimpleTexts("rptCauseList"),
      preventions: collectSimpleTexts("rptPreventionList"),
      investigationLearnings: collectSimpleTexts("rptLearningList"),

      reportedBy: text($("rptReportedBy")?.value) || authName,
      reporterPosition: text($("rptReporterPosition")?.value),
      reportDate: normalizeDateToDisplay($("rptReportDate")?.value),

      emailRecipients: getSelectedRptEmails(),
      emailOther: text($("rptEmailOther")?.value)
    };
  }

  function validateReport500(payload) {
    if (!getAuthName()) return "กรุณาเข้าสู่ระบบก่อน";
    if (!payload.refNo) return "กรุณากรอก Ref No.";
    if (!payload.branch) return "กรุณาเลือกสาขา";
    if (isOtherValue(payload.branch) && !payload.branchOther) return "กรุณาระบุสาขาอื่นๆ";
    if (!payload.subject) return "กรุณากรอกเรื่อง";
    if (!payload.reportTypes.length) return "กรุณาเลือกประเภทรายงานอย่างน้อย 1 รายการ";
    if (!payload.urgencyTypes.length) return "กรุณาเลือกระดับความเร่งด่วนอย่างน้อย 1 รายการ";
    if (!payload.notifyTo.length) return "กรุณาเลือกผู้รับทราบอย่างน้อย 1 รายการ";
    if (!payload.incidentDate) return "กรุณาเลือกวันที่เกิดเหตุ";
    if (!payload.incidentTime) return "กรุณาเลือกเวลาเกิดเหตุ";
    if (!payload.incidentLocation) return "กรุณาเลือกสถานที่เกิดเหตุ";
    if (isOtherValue(payload.incidentLocation) && !payload.incidentLocationOther) return "กรุณาระบุสถานที่เกิดเหตุอื่นๆ";
    if (!payload.whatHappen) return "กรุณากรอกรายละเอียดเหตุการณ์";
    if (!payload.reportedBy) return "กรุณาระบุผู้รายงาน";
    if (!payload.reporterPosition) return "กรุณาระบุตำแหน่งผู้รายงาน";
    if (!payload.reportDate) return "กรุณาเลือกวันที่รายงาน";

    const badMatrix = [...payload.reportTypes, ...payload.urgencyTypes, ...payload.notifyTo]
      .find(x => isOtherValue(x.value) && !text(x.textValue));
    if (badMatrix) return "มีตัวเลือก 'อื่นๆ' ที่ยังไม่ได้กรอกข้อมูลเพิ่มเติม";

    const badPeople = payload.persons.find(p =>
      (isOtherValue(p.title) && !p.titleOther) ||
      (isOtherValue(p.department) && !p.departmentOther) ||
      (isOtherValue(p.position) && !p.positionOther) ||
      (isOtherValue(p.remark) && !p.remarkOther)
    );
    if (badPeople) return "ผู้เกี่ยวข้องบางรายการเลือก 'อื่นๆ' แต่ยังไม่ได้กรอก";

    const badActions = payload.actions.find(a => {
      if (isOtherValue(a.actionType) && !a.actionTypeOther) return true;

      const badLoc = toArray(a.targetLocations).find(x => isOtherValue(x.value) && !x.textValue);
      if (badLoc) return true;

      const meta = toArray(RPT.options.actionTypeList)
        .find(x => text(x?.value || x?.label) === a.actionType);

      if (meta?.supportsTestResult && !a.testResult) return true;
      if (meta?.supportsTestResult && meta?.supportsAmount && a.testResult === "พบ" && !a.testAmount) return true;

      return false;
    });

    if (badActions) return "การดำเนินการบางรายการกรอกไม่ครบ";
    return "";
  }

  async function previewReport500Summary() {
    await ensureReport500Ready();

    const payload = collectReport500Payload();
    const err = validateReport500(payload);
    if (err) {
      return Swal.fire({
        icon: "warning",
        title: "ข้อมูลยังไม่ครบ",
        text: err
      });
    }

    const summaryHtml = `
      <div class="swalSummary" style="text-align:left">
        <div class="swalHero">
          <div class="swalHeroTitle">Report500 Summary</div>
          <div class="swalHeroSub">ตรวจสอบข้อมูลก่อนบันทึก</div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ข้อมูลหลัก</div>
          <div class="swalKvGrid">
            ${swalKv("Ref No.", payload.refNo)}
            ${swalKv("สาขา", payload.branch === "อื่นๆ" ? payload.branchOther : payload.branch)}
            ${swalKv("เรื่อง", payload.subject)}
            ${swalKv("วันที่เกิดเหตุ", payload.incidentDate)}
            ${swalKv("เวลาเกิดเหตุ", payload.incidentTime)}
            ${swalKv("สถานที่", payload.incidentLocation === "อื่นๆ" ? payload.incidentLocationOther : payload.incidentLocation)}
            ${swalKv("บริเวณ", payload.incidentArea || "-")}
            ${swalKv("รายงานโดย", payload.reportedBy)}
            ${swalKv("ตำแหน่ง", payload.reporterPosition)}
            ${swalKv("วันที่รายงาน", payload.reportDate)}
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">ตัวเลือกที่เลือก</div>
          <div class="swalDesc">
            <div class="swalDescLabel">ประเภทรายงาน</div>
            <div class="swalDescValue">${esc(joinOptionTexts(payload.reportTypes) || "-").replaceAll("|", "<br>")}</div>
          </div>
          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">ระดับความเร่งด่วน</div>
            <div class="swalDescValue">${esc(joinOptionTexts(payload.urgencyTypes) || "-").replaceAll("|", "<br>")}</div>
          </div>
          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">ผู้รับทราบ</div>
            <div class="swalDescValue">${esc(joinOptionTexts(payload.notifyTo) || "-").replaceAll("|", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">รายละเอียดเหตุการณ์</div>
          <div class="swalDesc">
            <div class="swalDescLabel">เหตุที่เกิด</div>
            <div class="swalDescValue">${esc(payload.whatHappen || "-").replaceAll("\n", "<br>")}</div>
          </div>
        </div>

        <div class="swalSection">
          <div class="swalSectionTitle">อีเมล</div>
          <div class="swalDesc">
            <div class="swalDescLabel">ผู้รับที่เลือก</div>
            <div class="swalDescValue">${esc((payload.emailRecipients || []).join(", ") || "-")}</div>
          </div>
          <div class="swalDesc" style="margin-top:8px;">
            <div class="swalDescLabel">อีเมลอื่นๆ</div>
            <div class="swalDescValue">${esc(payload.emailOther || "-")}</div>
          </div>
        </div>
      </div>
    `;

    await Swal.fire({
      title: "ตรวจสอบข้อมูล",
      html: summaryHtml,
      width: 920,
      confirmButtonText: "ปิด",
      confirmButtonColor: "#2563eb"
    });
  }

  function setReport500SubmitDisabled(disabled) {
    const btn = $("btnRptSubmit");
    if (!btn) return;

    btn.disabled = !!disabled;
    btn.classList.toggle("isLoading", !!disabled);

    if (disabled) {
      btn.dataset.originalText = btn.dataset.originalText || btn.textContent || "บันทึกและสร้าง PDF";
      btn.textContent = "กำลังบันทึก...";
    } else {
      btn.textContent = btn.dataset.originalText || "บันทึกและสร้าง PDF";
    }
  }

  function buildReport500PdfLink(refNo) {
    return refNo ? api(`/report500/pdf/${encodeURIComponent(refNo)}`) : "";
  }

  function buildReport500SuccessHtml(json, pdfLink) {
    const emailResult = json?.emailResult || {};
    const recipients = toArray(emailResult?.recipients).join(", ");
    const partial = !!json?.partial;
    const pdfError = text(json?.pdfError);

    return `
      <div class="swalSection" style="text-align:left">
        <div class="swalSectionTitle">${partial ? "บันทึกสำเร็จบางส่วน" : "บันทึกสำเร็จ"}</div>

        <div class="swalKvGrid">
          ${swalKv("Ref No.", text(json?.refNo) || "-")}
          ${swalKv("ผู้บันทึก", text(json?.lpsName) || "-")}
          ${swalKv("จำนวนรูป", String(json?.imageCount ?? 0))}
          ${swalKv("ขนาด PDF", text(json?.pdfSizeText) || "-")}
          ${swalKv("PDF", text(json?.pdfUrl) ? "สร้างสำเร็จ" : (pdfError || "ยังไม่สำเร็จ"))}
          ${swalKv("อีเมล", emailResult?.skipped ? "ไม่ได้ส่ง" : (emailResult?.ok ? "ส่งสำเร็จ" : (text(emailResult?.error) || "ส่งไม่สำเร็จ")))}
        </div>

        ${recipients ? `
          <div class="swalDesc" style="margin-top:12px;">
            <div class="swalDescLabel">ส่งถึง</div>
            <div class="swalDescValue">${esc(recipients)}</div>
          </div>
        ` : ""}

        ${pdfError ? `
          <div class="swalDesc" style="margin-top:12px;">
            <div class="swalDescLabel">รายละเอียด PDF</div>
            <div class="swalDescValue">${esc(pdfError)}</div>
          </div>
        ` : ""}

        ${pdfLink ? `
          <div class="swalActionLink" style="margin-top:14px;">
            <a href="${esc(pdfLink)}" target="_blank" rel="noopener">เปิดไฟล์ PDF</a>
          </div>
        ` : ""}
      </div>
    `;
  }

  async function submitReport500Form() {
    if (RPT.state.submitting) return;

    await ensureReport500Ready();

    const payload = collectReport500Payload();
    const err = validateReport500(payload);
    if (err) {
      return Swal.fire({
        icon: "warning",
        title: "ข้อมูลยังไม่ครบ",
        text: err
      });
    }

    const pass = text($("loginPass")?.value);
    if (!pass) {
      return Swal.fire({
        icon: "warning",
        title: "ยังไม่มีรหัสผ่าน",
        text: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
      });
    }

    const recipients = collectReport500Recipients();
    if (recipients.invalid.length) {
      return Swal.fire({
        icon: "warning",
        title: "รูปแบบอีเมลไม่ถูกต้อง",
        html: `
          <div class="swalSection" style="text-align:left">
            <div class="swalSectionTitle">อีเมลที่ต้องตรวจสอบ</div>
            <div class="swalDescValue">${esc(recipients.invalid.join(", "))}</div>
          </div>
        `
      });
    }

    payload.emailRecipients = getCheckedRptEmails();
    payload.emailOther = text($("rptEmailOther")?.value);

    const files = await collectReport500ImagesSafe();

    RPT.state.submitting = true;
    setReport500SubmitDisabled(true);

    await Swal.fire({
      title: "กำลังบันทึก Report500",
      text: "ระบบกำลังอัปโหลดข้อมูล สร้าง PDF และตรวจสอบการส่งอีเมล",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch(api("/report500/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass,
          payload,
          files
        })
      });

      const raw = await res.text();
      let json = {};
      try {
        json = JSON.parse(raw);
      } catch (_) {
        throw new Error("Backend ไม่ได้ส่ง JSON กลับมา: " + raw.slice(0, 500));
      }

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      const reportedBy = text(payload.reportedBy || getAuthName());
      const pdfLink = buildReport500PdfLink(text(json?.refNo));

      await Swal.fire({
        icon: json?.partial ? "warning" : "success",
        title: json?.partial ? "บันทึกสำเร็จบางส่วน" : "บันทึกสำเร็จ",
        html: buildReport500SuccessHtml(json, pdfLink),
        width: 920,
        confirmButtonText: "ปิด",
        confirmButtonColor: "#2563eb"
      });

      resetReport500FormAfterSubmit(reportedBy);

    } catch (err2) {
      console.error("submitReport500Form:", err2);
      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        html: `
          <div class="swalSection" style="text-align:left">
            <div class="swalSectionTitle">รายละเอียดข้อผิดพลาด</div>
            <div class="swalDesc">
              <div class="swalDescValue">${esc(err2?.message || "เชื่อมต่อระบบไม่ได้")}</div>
            </div>
          </div>
        `
      });
    } finally {
      RPT.state.submitting = false;
      setReport500SubmitDisabled(false);
    }
  }

  function resetReport500FormAfterSubmit(reportedBy) {
    if ($("rptRefNo")) $("rptRefNo").value = "";
    if ($("rptSubject")) $("rptSubject").value = "";
    if ($("rptBranch")) $("rptBranch").value = "";
    if ($("rptBranchOther")) $("rptBranchOther").value = "";
    if ($("rptIncidentDate")) $("rptIncidentDate").value = "";
    if ($("rptIncidentTime")) $("rptIncidentTime").value = "";
    if ($("rptIncidentLocation")) $("rptIncidentLocation").value = "";
    if ($("rptIncidentLocationOther")) $("rptIncidentLocationOther").value = "";
    if ($("rptIncidentArea")) $("rptIncidentArea").value = "";
    if ($("rptWhatHappen")) $("rptWhatHappen").value = "";
    if ($("rptOffenderStatement")) $("rptOffenderStatement").value = "";
    if ($("rptSummaryText")) $("rptSummaryText").value = "";
    if ($("rptReporterPosition")) $("rptReporterPosition").value = "";
    if ($("rptReportDate")) $("rptReportDate").value = todayInputValue();
    if ($("rptEmailOther")) $("rptEmailOther").value = "";

    qa(".rptMatrixChk").forEach(chk => {
      chk.checked = false;
      const otherId = chk.getAttribute("data-other-id");
      const otherWrap = otherId ? $(otherId) : null;
      const input = otherWrap ? q("input", otherWrap) : null;
      if (input) input.value = "";
      if (otherWrap) otherWrap.classList.add("hidden");
    });

    qa(".rptEmailChk").forEach(chk => {
      chk.checked = false;
    });

    [
      "rptPeopleList",
      "rptDamageList",
      "rptActionList",
      "rptEvidenceList",
      "rptCauseList",
      "rptPreventionList",
      "rptLearningList",
      "rptImageList"
    ].forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = "";
    });

    RPT.state.initializedRows = false;
    buildReport500InitialRows();
    RPT.state.initializedRows = true;

    syncSingleOtherWraps();

    if ($("rptReportedBy")) {
      $("rptReportedBy").innerHTML = reportedBy
        ? makeOptionTag(reportedBy, reportedBy)
        : makeOptionTag("", "-- เลือก --");
      $("rptReportedBy").value = reportedBy || "";
    }
  }

  window.Report500UI = {
    ensureReady: ensureReport500Ready,
    reloadOptions: async () => {
      RPT.state.ready = false;
      RPT.state.loading = false;
      RPT.state.promise = null;
      await ensureReport500Ready();
    },
    preview: previewReport500Summary,
    submit: submitReport500Form,
    collectPayload: collectReport500Payload
  };
})();
