const REPORT500 = (() => {
  const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'https://bol.somchaibutphon.workers.dev';
  const state = { inited: false, auth: null };
  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const repeatables = ['persons','damages','actions','evidences','causes','preventions','lessons','images'];

  function apiUrl(path) { return String(API_BASE_URL || '').replace(/\/+$/, '') + path; }
  function now() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function safe(v) { return String(v == null ? '' : v).trim(); }
  function num(v) { const n = Number(String(v || '').replace(/,/g, '').trim()); return isNaN(n) ? 0 : n; }
  function combineDateTime(dateStr, timeStr) { return safe(dateStr) && safe(timeStr) ? `${safe(dateStr)} ${safe(timeStr)}:00`.replace(/:(\d{2}:\d{2}):00$/, '$1:00') : ''; }

  function init(auth) {
    state.auth = auth || window.AUTH || null;
    if (state.inited) return;
    state.inited = true;
    bind();
    setDefaults();
    ensureInitialRows();
  }

  function setDefaults() {
    const reportDt = $('report500-reportDateTime');
    if (reportDt && !reportDt.value) reportDt.value = now();
    if (state.auth) {
      const name = safe(state.auth.name || state.auth.userName);
      if ($('report500-preparedBy') && !safe($('report500-preparedBy').value)) $('report500-preparedBy').value = name;
    }
  }

  function bind() {
    qsa('[data-report500-tab]').forEach((btn) => btn.addEventListener('click', () => showSection()));
    $('report500-saveDraftBtn')?.addEventListener('click', () => submit('draft'));
    $('report500-submitBtn')?.addEventListener('click', () => submit('submitted'));
    $('report500-resetBtn')?.addEventListener('click', reset);

    qsa('[data-r500-add]').forEach((btn) => btn.addEventListener('click', () => addRow(btn.dataset.r500Add)));
    qsa('.report500-checkbox-group').forEach((group) => {
      group.addEventListener('change', (e) => {
        const target = e.target;
        if (target && target.matches('[data-other-toggle]')) toggleOther(group);
      });
      toggleOther(group);
    });

    repeatables.forEach((name) => {
      const wrap = $(`report500-${name}-wrap`);
      wrap?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-r500-remove-row]');
        if (!btn) return;
        const row = btn.closest('.report500-repeatable-item');
        if (row) {
          row.remove();
          renumber(name);
          updateCounters();
        }
      });
      wrap?.addEventListener('change', async (e) => {
        const input = e.target;
        if (input.matches('.r500-image-file')) await handleImageSelected(input);
        if (input.matches('.r500-action-type')) handleActionTypeChange(input);
        if (input.matches('.r500-action-result')) handleActionResultChange(input);
        if (input.matches('[data-row-other-select]')) toggleRowOtherInput(input);
      });
    });
  }

  function showSection() {
    $('formCard')?.classList.add('hidden');
    $('under500Card')?.classList.add('hidden');
    $('loginCard')?.classList.add('hidden');
    $('report500Card')?.classList.remove('hidden');
    init(state.auth);
  }

  function ensureInitialRows() {
    ['persons','actions'].forEach((name) => {
      const wrap = $(`report500-${name}-wrap`);
      if (wrap && !wrap.children.length) addRow(name);
    });
  }

  function addRow(section) {
    const tpl = $(`report500-${section}-template`);
    const wrap = $(`report500-${section}-wrap`);
    if (!tpl || !wrap) return;
    const node = tpl.content ? tpl.content.firstElementChild.cloneNode(true) : tpl.firstElementChild.cloneNode(true);
    wrap.appendChild(node);
    renumber(section);
    updateCounters();
    qsa('[data-row-other-select]', node).forEach(toggleRowOtherInput);
  }

  function renumber(section) {
    qsa(`#report500-${section}-wrap .report500-repeatable-item`).forEach((row, idx) => {
      row.dataset.seq = String(idx + 1);
      row.querySelectorAll('[data-seq-label]').forEach((el) => el.textContent = String(idx + 1));
    });
  }

  function toggleOther(group) {
    const checked = qsa('[data-other-toggle]:checked', group).length > 0;
    const wrap = group.querySelector('.report500-other-wrap');
    const input = group.querySelector('.report500-other-input');
    if (!wrap || !input) return;
    wrap.classList.toggle('hidden', !checked);
    if (!checked) input.value = '';
  }

  function toggleRowOtherInput(selectEl) {
    const row = selectEl.closest('.report500-repeatable-item');
    const wrap = row?.querySelector('.report500-row-other-wrap');
    const input = row?.querySelector('.report500-row-other-input');
    const show = safe(selectEl.value) === 'อื่นๆ';
    if (wrap) wrap.classList.toggle('hidden', !show);
    if (input && !show) input.value = '';
  }

  function handleActionTypeChange(selectEl) { toggleRowOtherInput(selectEl); }
  function handleActionResultChange(selectEl) {
    const row = selectEl.closest('.report500-repeatable-item');
    const show = safe(selectEl.value) === 'พบ';
    row?.querySelectorAll('.r500-detected-wrap').forEach((el) => el.classList.toggle('is-required', show));
  }

  async function handleImageSelected(input) {
    const row = input.closest('.report500-repeatable-item');
    const file = input.files && input.files[0];
    if (!row || !file) return;
    const result = await readFileAsDataUrl(file);
    row.dataset.base64 = result;
    row.dataset.mimeType = file.type || 'image/jpeg';
    row.dataset.fileName = file.name || 'image.jpg';
    const img = row.querySelector('.r500-image-preview');
    if (img) {
      img.src = result;
      img.classList.remove('hidden');
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function collectCheckboxGroup(groupId) {
    const group = $(groupId);
    if (!group) return { selected: [], otherText: '' };
    return {
      selected: qsa('input[type="checkbox"]:checked', group).map((el) => safe(el.value)).filter(Boolean),
      otherText: safe(group.querySelector('.report500-other-input')?.value)
    };
  }

  function collectRows(section, mapper) {
    return qsa(`#report500-${section}-wrap .report500-repeatable-item`).map((row, idx) => mapper(row, idx + 1)).filter(Boolean);
  }

  function val(row, selector) { return safe(row.querySelector(selector)?.value); }

  function buildPayload(status) {
    const payload = {
      formType: 'report500',
      auth: {
        userId: safe(window.AUTH?.userId),
        userName: safe(window.AUTH?.name || state.auth?.name),
        userRole: safe(window.AUTH?.userRole),
        userPosition: safe(window.AUTH?.userPosition),
        userDepartment: safe(window.AUTH?.userDepartment)
      },
      meta: {
        status: status,
        createdAt: now(),
        updatedAt: now(),
        timezone: 'Asia/Bangkok'
      },
      header: {
        branch: safe($('report500-branch')?.value),
        dcName: safe($('report500-dcName')?.value),
        subject: safe($('report500-subject')?.value),
        incidentDate: safe($('report500-incidentDate')?.value),
        incidentTime: safe($('report500-incidentTime')?.value),
        incidentDateTime: combineDateTime($('report500-incidentDate')?.value, $('report500-incidentTime')?.value),
        reportDateTime: safe($('report500-reportDateTime')?.value),
        location: safe($('report500-location')?.value),
        area: safe($('report500-area')?.value),
        locationDetail: safe($('report500-locationDetail')?.value)
      },
      classification: {
        reportTypes: collectCheckboxGroup('report500-reportTypes-group'),
        urgencyLevels: collectCheckboxGroup('report500-urgencyLevels-group'),
        reportReceivers: collectCheckboxGroup('report500-reportReceivers-group'),
        locationTypes: collectCheckboxGroup('report500-locationTypes-group')
      },
      incident: {
        whatHappened: safe($('report500-whatHappened')?.value),
        whereHappened: safe($('report500-whereHappened')?.value),
        incidentDetail: safe($('report500-incidentDetail')?.value),
        statement: safe($('report500-statement')?.value),
        investigationSummary: safe($('report500-investigationSummary')?.value),
        initialConclusion: safe($('report500-initialConclusion')?.value)
      },
      persons: collectRows('persons', (row, seq) => ({
        seq, name: val(row,'.r500-person-name'), employeeId: val(row,'.r500-person-employeeId'), position: val(row,'.r500-person-position'),
        department: val(row,'.r500-person-department'), personType: val(row,'.r500-person-type'), company: val(row,'.r500-person-company'),
        phone: val(row,'.r500-person-phone'), roleDetail: val(row,'.r500-person-role'), statement: val(row,'.r500-person-statement'), remark: val(row,'.r500-person-remark')
      })),
      damages: collectRows('damages', (row, seq) => ({
        seq, damageType: val(row,'.r500-damage-type'), itemName: val(row,'.r500-damage-item'), damageDetail: val(row,'.r500-damage-detail'),
        qty: val(row,'.r500-damage-qty'), unit: val(row,'.r500-damage-unit'), amount: val(row,'.r500-damage-amount'),
        responsiblePerson: val(row,'.r500-damage-owner'), damageStatus: val(row,'.r500-damage-status'), remark: val(row,'.r500-damage-remark')
      })),
      actions: collectRows('actions', (row, seq) => ({
        seq, actionType: val(row,'.r500-action-type'), actionOtherText: val(row,'.r500-action-other'), actionDetail: val(row,'.r500-action-detail'),
        result: val(row,'.r500-action-result'), detectedValue: val(row,'.r500-action-detectedValue'), detectedUnit: val(row,'.r500-action-detectedUnit'),
        actionDateTime: val(row,'.r500-action-dateTime'), operatorName: val(row,'.r500-action-operator'), actionLocation: val(row,'.r500-action-location'), remark: val(row,'.r500-action-remark')
      })),
      evidences: collectRows('evidences', (row, seq) => ({
        seq, evidenceType: val(row,'.r500-evidence-type'), evidenceOtherText: val(row,'.r500-evidence-other'), evidenceDetail: val(row,'.r500-evidence-detail'),
        source: val(row,'.r500-evidence-source'), referenceNo: val(row,'.r500-evidence-ref'), evidenceDateTime: val(row,'.r500-evidence-dateTime'),
        foundBy: val(row,'.r500-evidence-foundBy'), inspectionResult: val(row,'.r500-evidence-result'), remark: val(row,'.r500-evidence-remark')
      })),
      causes: collectRows('causes', (row, seq) => ({
        seq, causeType: val(row,'.r500-cause-type'), causeOtherText: val(row,'.r500-cause-other'), causeDetail: val(row,'.r500-cause-detail'),
        mainCause: val(row,'.r500-cause-main'), subCause: val(row,'.r500-cause-sub'), relatedFactor: val(row,'.r500-cause-factor'), remark: val(row,'.r500-cause-remark')
      })),
      preventions: collectRows('preventions', (row, seq) => ({
        seq, measureType: val(row,'.r500-prevention-type'), measureOtherText: val(row,'.r500-prevention-other'), measureDetail: val(row,'.r500-prevention-detail'),
        owner: val(row,'.r500-prevention-owner'), dueDate: val(row,'.r500-prevention-dueDate'), status: val(row,'.r500-prevention-status'), followUpResult: val(row,'.r500-prevention-followup'), remark: val(row,'.r500-prevention-remark')
      })),
      lessons: collectRows('lessons', (row, seq) => ({
        seq, lessonType: val(row,'.r500-lesson-type'), lessonOtherText: val(row,'.r500-lesson-other'), detail: val(row,'.r500-lesson-detail'), suggestion: val(row,'.r500-lesson-suggestion'), remark: val(row,'.r500-lesson-remark')
      })),
      images: collectRows('images', (row, seq) => ({
        seq, fileName: row.dataset.fileName || '', mimeType: row.dataset.mimeType || '', base64Data: row.dataset.base64 || '',
        caption: val(row,'.r500-image-caption'), imageType: val(row,'.r500-image-type'), takenDateTime: val(row,'.r500-image-dateTime'), uploadedBy: val(row,'.r500-image-uploadedBy'), remark: val(row,'.r500-image-remark')
      })),
      approval: {
        preparedBy: safe($('report500-preparedBy')?.value), preparedPosition: safe($('report500-preparedPosition')?.value),
        reviewedBy: safe($('report500-reviewedBy')?.value), reviewedPosition: safe($('report500-reviewedPosition')?.value),
        approvedBy: safe($('report500-approvedBy')?.value), approvedPosition: safe($('report500-approvedPosition')?.value)
      },
      summary: {
        personCount: qsa('#report500-persons-wrap .report500-repeatable-item').length,
        damageCount: qsa('#report500-damages-wrap .report500-repeatable-item').length,
        actionCount: qsa('#report500-actions-wrap .report500-repeatable-item').length,
        evidenceCount: qsa('#report500-evidences-wrap .report500-repeatable-item').length,
        causeCount: qsa('#report500-causes-wrap .report500-repeatable-item').length,
        preventionCount: qsa('#report500-preventions-wrap .report500-repeatable-item').length,
        lessonCount: qsa('#report500-lessons-wrap .report500-repeatable-item').length,
        imageCount: qsa('#report500-images-wrap .report500-repeatable-item').length,
        totalDamageAmount: collectRows('damages', (row) => ({ amount: num(val(row,'.r500-damage-amount')) })).reduce((s, r) => s + r.amount, 0),
        overallImpact: safe($('report500-overallImpact')?.value),
        remark: safe($('report500-summaryRemark')?.value)
      }
    };
    return payload;
  }

  function validate(payload) {
    const errs = [];
    if (!safe(payload.header.subject)) errs.push('กรุณาระบุเรื่อง');
    if (!safe(payload.header.location)) errs.push('กรุณาระบุสถานที่เกิดเหตุ');
    if (!safe(payload.header.incidentDateTime)) errs.push('กรุณาระบุวันเวลาเกิดเหตุ');
    if (!safe(payload.incident.whatHappened)) errs.push('กรุณาระบุรายละเอียดเหตุการณ์');
    if (!payload.classification.reportTypes.selected.length && !safe(payload.classification.reportTypes.otherText)) errs.push('กรุณาเลือกประเภทรายงาน');
    if (!payload.classification.reportReceivers.selected.length && !safe(payload.classification.reportReceivers.otherText)) errs.push('กรุณาเลือกผู้รับรายงาน');
    payload.images.forEach((img, i) => {
      if (img.base64Data && !img.caption) errs.push(`รูปภาพลำดับ ${i+1} กรุณาระบุคำบรรยาย`);
    });
    return errs;
  }

  async function submit(status) {
    const payload = buildPayload(status);
    const errs = validate(payload);
    if (errs.length) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลยังไม่ครบ', html: `<div style="text-align:left">${errs.map((e) => `• ${e}`).join('<br>')}</div>` });
      return;
    }
    Swal.fire({ title: 'กำลังบันทึกรายงาน', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch(apiUrl('/submit'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'report500', pass: safe(window.AUTH?.pass || state.auth?.pass), payload })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      await Swal.fire({
        icon: 'success', title: 'บันทึกรายงานสำเร็จ',
        html: `Ref.No.: <b>${json.refNo || '-'}</b><br><a href="${json.pdfUrl || '#'}" target="_blank">เปิด PDF</a>`
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: err.message || String(err) });
    }
  }

  function reset() {
    if ($('report500Form')) $('report500Form').reset();
    repeatables.forEach((name) => { const wrap = $(`report500-${name}-wrap`); if (wrap) wrap.innerHTML = ''; });
    ensureInitialRows();
    setDefaults();
  }

  function updateCounters() {
    repeatables.forEach((name) => {
      const badge = document.querySelector(`[data-r500-count="${name}"]`);
      if (badge) badge.textContent = String(qsa(`#report500-${name}-wrap .report500-repeatable-item`).length);
    });
  }

  return { init, showSection, addRow, reset };
})();

window.initReport500Form = function(auth) { REPORT500.init(auth || window.AUTH || {}); };
window.openReport500 = function() { REPORT500.showSection(); };
