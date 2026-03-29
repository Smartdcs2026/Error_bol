// (function () {
//   const $ = (id) => document.getElementById(id);

//   const state = {
//     ready: false,
//     loading: false,
//     options: null
//   };

//   function norm(v) {
//     return String(v == null ? "" : v).trim();
//   }

//   function escapeHtml(value) {
//     return String(value == null ? "" : value)
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#039;");
//   }

//   function apiUrl(path) {
//     if (typeof window.apiUrl === "function") return window.apiUrl(path);
//     const base = String(window.API_BASE || "").replace(/\/+$/, "");
//     const p = String(path || "").replace(/^\/+/, "");
//     return `${base}/${p}`;
//   }

//   function todayIsoLocal() {
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `${yyyy}-${mm}-${dd}`;
//   }

//   function getAuth() {
//     return window.AUTH || { name: "", pass: "" };
//   }

//   function getRefNo() {
//     if (typeof window.getRptRefNoValue === "function") return window.getRptRefNoValue();
//     const running = String($("rptRefNo")?.value || "").replace(/[^\d]/g, "").trim();
//     const year = String($("rptRefYear")?.value || $("rptRefYear")?.textContent || "").trim();
//     return running ? `${running}-${year}` : "";
//   }

//   function setRefYear() {
//     const el = $("rptRefYear");
//     if (!el) return;

//     const currentYear = new Date().getFullYear() + 543;
//     const years = [currentYear - 1, currentYear, currentYear + 1];

//     if (String(el.tagName || "").toUpperCase() === "SELECT") {
//       el.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
//       el.value = String(currentYear);
//       return;
//     }

//     el.textContent = String(currentYear);
//   }

//   function isOther(v) {
//     const s = norm(v).toLowerCase();
//     return s === "อื่นๆ" || s === "other" || s === "others";
//   }

//   function splitMultiEmails(text) {
//     return String(text || "")
//       .split(/[\n,;]+/)
//       .map((x) => x.trim())
//       .filter(Boolean);
//   }

//   function uniqueEmails(list) {
//     const seen = new Set();
//     const out = [];
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

//     (Array.isArray(list) ? list : []).forEach((v) => {
//       const s = String(v || "").trim();
//       if (!s || !re.test(s)) return;
//       const key = s.toLowerCase();
//       if (seen.has(key)) return;
//       seen.add(key);
//       out.push(s);
//     });

//     return out;
//   }

//   function setReadonlyValue(id, value) {
//     const el = $(id);
//     if (!el) return;
//     el.value = value || "";
//   }

//   function renderSelect(id, list, withPlaceholder = true) {
//     const el = $(id);
//     if (!el) return;

//     const items = Array.isArray(list) ? list : [];
//     const html = [];
//     if (withPlaceholder) html.push(`<option value="">-- เลือก --</option>`);
//     items.forEach((item) => {
//       html.push(`<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`);
//     });
//     el.innerHTML = html.join("");
//   }

//   function bindOtherSelect(selectId, wrapId, inputId) {
//     const select = $(selectId);
//     const wrap = $(wrapId);
//     const input = $(inputId);
//     if (!select || !wrap) return;

//     const sync = () => {
//       const show = isOther(select.value);
//       wrap.classList.toggle("hidden", !show);
//       if (!show && input) input.value = "";
//     };

//     select.addEventListener("change", sync);
//     sync();
//   }

//   function renderOptionMatrix(rootId, name, list) {
//     const root = $(rootId);
//     if (!root) return;

//     const items = Array.isArray(list) ? list : [];
//     if (!items.length) {
//       root.innerHTML = `<div class="emailEmpty">ไม่พบรายการตัวเลือก</div>`;
//       return;
//     }

//     root.innerHTML = items.map((item) => `
//       <label class="optionChoice">
//         <div class="optionChoiceCard">
//           <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(item)}">
//           <span class="optionChoiceMark"></span>
//           <span class="optionChoiceText">${escapeHtml(item)}</span>
//         </div>
//       </label>
//     `).join("");
//   }

//   function renderWhereTypeSelections() {
//     const root = $("rptWhereTypeSelections");
//     if (!root) return;

//     const list = Array.isArray(state.options?.whereTypeList) ? state.options.whereTypeList : [];
//     if (!list.length) {
//       root.innerHTML = `<div class="emailEmpty">ไม่พบรายการประเภทสถานที่</div>`;
//       return;
//     }

//     root.innerHTML = list.map((item, idx) => {
//       const value = norm(item && item.value);
//       const needSuffix = !!(item && item.needSuffixInput);
//       const rowId = `rptWhereType_${idx}_${value.replace(/[^\wก-๙]+/g, "_")}`;

//       return `
//         <div class="rptWhereTypeRow" data-value="${escapeHtml(value)}" data-need-suffix="${needSuffix ? "1" : "0"}">
//           <label class="optionChoice" for="${escapeHtml(rowId)}">
//             <div class="optionChoiceCard">
//               <input
//                 id="${escapeHtml(rowId)}"
//                 type="checkbox"
//                 class="rptWhereTypeChk"
//                 value="${escapeHtml(value)}"
//               >
//               <span class="optionChoiceMark"></span>
//               <span class="optionChoiceText">${escapeHtml(value)}</span>
//             </div>
//           </label>

//           <div class="optionChoiceOther hidden">
//             <input
//               type="text"
//               class="input rptWhereTypeSuffix"
//               placeholder="กรอกข้อมูลต่อท้าย ${escapeHtml(value)}"
//             >
//           </div>
//         </div>
//       `;
//     }).join("");

//     root.querySelectorAll(".rptWhereTypeRow").forEach((row) => {
//       const chk = row.querySelector(".rptWhereTypeChk");
//       const card = row.querySelector(".optionChoiceCard");
//       const wrap = row.querySelector(".optionChoiceOther");
//       const input = row.querySelector(".rptWhereTypeSuffix");
//       const needSuffix = row.getAttribute("data-need-suffix") === "1";

//       const sync = () => {
//         const show = !!chk?.checked && needSuffix;
//         wrap?.classList.toggle("hidden", !show);
//         if (!show && input) input.value = "";
//       };

//       chk?.addEventListener("change", sync);

//       card?.addEventListener("click", (ev) => {
//         if (ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA")) return;
//         setTimeout(sync, 0);
//       });

//       sync();
//     });
//   }

//   function renderEmailSelector() {
//     const root = $("rptEmailSelector");
//     if (!root) return;

//     const emails = Array.isArray(state.options?.emailList) ? state.options.emailList : [];
//     if (!emails.length) {
//       root.innerHTML = `<div class="emailEmpty">ไม่พบรายการอีเมล</div>`;
//       return;
//     }

//     root.innerHTML = emails.map((email) => `
//       <label class="emailItem" title="${escapeHtml(email)}">
//         <input type="checkbox" class="rptEmailChk" value="${escapeHtml(email)}">
//         <span class="emailCheckBox"></span>
//         <span class="emailText">${escapeHtml(email)}</span>
//       </label>
//     `).join("");
//   }

//   function setAllChecks(selector, checked) {
//     document.querySelectorAll(selector).forEach((el) => {
//       el.checked = !!checked;
//     });
//   }

//   function createSimpleIndexedRowHtml(type, index, titleLabel, detailLabel, titlePlaceholder, detailPlaceholder) {
//     return `
//       <div class="rptRepeatCard" data-type="${escapeHtml(type)}">
//         <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
//           <div style="font-size:13px;font-weight:900;line-height:1.2">${escapeHtml(titleLabel)} ${index}</div>
//           <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
//         </div>

//         <div class="gridCompact">
//           <div class="field">
//             <label>${escapeHtml(titleLabel)}</label>
//             <input type="text" class="rptIdxTitle" placeholder="${escapeHtml(titlePlaceholder || "")}">
//           </div>
//           <div class="field">
//             <label>${escapeHtml(detailLabel)}</label>
//             <textarea class="rptIdxDetail" rows="3" placeholder="${escapeHtml(detailPlaceholder || "")}"></textarea>
//           </div>
//         </div>

//         <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
//           <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
//         </div>
//       </div>
//     `;
//   }

//   function buildOptionsHtml(list, withPlaceholder) {
//     const items = Array.isArray(list) ? list : [];
//     const html = [];
//     if (withPlaceholder) html.push(`<option value="">-- เลือก --</option>`);
//     items.forEach((item) => {
//       html.push(`<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`);
//     });
//     return html.join("");
//   }

//   function createPersonRowHtml(index) {
//     const positionOptions = buildOptionsHtml(state.options?.personPositionList, true);
//     const departmentOptions = buildOptionsHtml(state.options?.personDepartmentList, true);
//     const remarkOptions = buildOptionsHtml(state.options?.personRemarkList, true);

//     return `
//       <div class="rptRepeatCard" data-type="person">
//         <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
//           <div style="font-size:13px;font-weight:900;line-height:1.2">ผู้เกี่ยวข้อง ${index}</div>
//           <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
//         </div>

//         <div class="gridCompact">
//           <div class="field">
//             <label>ผู้เกี่ยวข้อง (Who is involved)</label>
//             <input type="text" class="rptPersonWho" placeholder="ชื่อผู้เกี่ยวข้อง">
//           </div>

//           <div class="field">
//             <label>Position</label>
//             <select class="rptPersonPosition">${positionOptions}</select>
//           </div>

//           <div class="field rptPersonPositionOtherWrap hidden">
//             <label>Position อื่นๆ</label>
//             <input type="text" class="rptPersonPositionOther" placeholder="ระบุตำแหน่งเพิ่มเติม">
//           </div>

//           <div class="field">
//             <label>Department</label>
//             <select class="rptPersonDepartment">${departmentOptions}</select>
//           </div>

//           <div class="field rptPersonDepartmentOtherWrap hidden">
//             <label>Department อื่นๆ</label>
//             <input type="text" class="rptPersonDepartmentOther" placeholder="ระบุส่วนงานเพิ่มเติม">
//           </div>

//           <div class="field">
//             <label>Remark</label>
//             <select class="rptPersonRemark">${remarkOptions}</select>
//           </div>

//           <div class="field rptPersonRemarkOtherWrap hidden">
//             <label>Remark อื่นๆ</label>
//             <input type="text" class="rptPersonRemarkOther" placeholder="ระบุหมายเหตุเพิ่มเติม">
//           </div>
//         </div>

//         <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
//           <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
//         </div>
//       </div>
//     `;
//   }

//   function createStepTakenRowHtml(index) {
//     const actionOptions = buildOptionsHtml(state.options?.actionTypeList, true);

//     return `
//       <div class="rptRepeatCard" data-type="stepTaken">
//         <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
//           <div style="font-size:13px;font-weight:900;line-height:1.2">การดำเนินการ ${index}</div>
//           <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
//         </div>

//         <div class="gridCompact">
//           <div class="field">
//             <label>ประเภทการดำเนินการ</label>
//             <select class="rptStepActionType">${actionOptions}</select>
//           </div>

//           <div class="field rptStepActionTypeOtherWrap hidden">
//             <label>ระบุการดำเนินการอื่นๆ</label>
//             <input type="text" class="rptStepActionTypeOther" placeholder="ระบุเอง">
//           </div>

//           <div class="field rptAlcoholResultWrap hidden">
//             <label>ผลการตรวจแอลกอฮอล์</label>
//             <select class="rptAlcoholResult">
//               <option value="">-- เลือก --</option>
//               <option value="พบ">พบ</option>
//               <option value="ไม่พบ">ไม่พบ</option>
//             </select>
//           </div>

//           <div class="field rptAlcoholMgWrap hidden">
//             <label>ปริมาณแอลกอฮอล์ (Mg%)</label>
//             <input type="number" class="rptAlcoholMgPercent" placeholder="กรอกเฉพาะตัวเลข" inputmode="decimal">
//           </div>

//           <div class="field rptDrugConfirmedWrap hidden">
//             <label>ผลยืนยันการเสพ</label>
//             <input type="text" class="rptDrugConfirmed" placeholder="เช่น ยืนยันผลบวก">
//           </div>

//           <div class="field rptDrugDetailWrap hidden">
//             <label>รายละเอียดแบบย่อ</label>
//             <textarea class="rptDrugShortDetail" rows="3" placeholder="รายละเอียดการตรวจสารเสพติด"></textarea>
//           </div>

//           <div class="field fieldSpan2">
//             <label>รายละเอียดเพิ่มเติม</label>
//             <textarea class="rptStepDetail" rows="3" placeholder="รายละเอียดเพิ่มเติมของการดำเนินการ"></textarea>
//           </div>
//         </div>

//         <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
//           <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
//         </div>
//       </div>
//     `;
//   }

//   function createImageRowHtml(index) {
//     return `
//       <div class="rptRepeatCard" data-type="image">
//         <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
//           <div style="font-size:13px;font-weight:900;line-height:1.2">รูปภาพ ${index}</div>
//           <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
//         </div>

//         <div class="gridCompact">
//           <div class="field">
//             <label>เลือกรูปภาพ</label>
//             <input type="file" class="rptImageFile" accept="image/*">
//             <div class="fieldHint rptImageMeta"></div>
//           </div>

//           <div class="field">
//             <label>คำบรรยายภาพ</label>
//             <textarea class="rptImageCaption" rows="4" placeholder="อธิบายภาพนี้"></textarea>
//           </div>
//         </div>

//         <div class="field" style="margin-top:10px">
//           <div class="rptImagePreviewEmpty" style="padding:12px 14px;border:1px dashed #bfd1e6;border-radius:14px;background:#f8fbff;color:#64748b;font-size:12px;font-weight:800">
//             ยังไม่ได้เลือกรูปภาพ
//           </div>
//           <img class="rptImagePreview hidden" alt="preview" style="width:100%;max-height:260px;object-fit:contain;border-radius:14px;border:1px solid #d9e4f1;background:#fff;padding:6px">
//         </div>

//         <div class="panelActions" style="justify-content:flex-end;margin-top:10px">
//           <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
//         </div>
//       </div>
//     `;
//   }

//   function appendRow(listId, html, emptyLabel) {
//     const root = $(listId);
//     if (!root) return;
//     const wrap = document.createElement("div");
//     wrap.innerHTML = html.trim();
//     const node = wrap.firstElementChild;
//     root.appendChild(node);
//     bindDynamicRow(node);
//     refreshRowIndex(listId);
//     toggleEmptyState(listId, emptyLabel);
//   }

//   function bindDynamicRow(node) {
//     if (!node) return;

//     node.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
//       const img = node.querySelector(".rptImagePreview");
//       if (img && img.dataset.objectUrl) {
//         try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
//       }
//       const parentId = node.parentElement?.id || "";
//       node.remove();
//       if (parentId) {
//         refreshRowIndex(parentId);
//         toggleEmptyState(parentId, emptyStateLabelFor(parentId));
//       }
//     });

//     if (node.getAttribute("data-type") === "person") {
//       bindSelectOtherInRow(node, ".rptPersonPosition", ".rptPersonPositionOtherWrap", ".rptPersonPositionOther");
//       bindSelectOtherInRow(node, ".rptPersonDepartment", ".rptPersonDepartmentOtherWrap", ".rptPersonDepartmentOther");
//       bindSelectOtherInRow(node, ".rptPersonRemark", ".rptPersonRemarkOtherWrap", ".rptPersonRemarkOther");
//     }

//     if (node.getAttribute("data-type") === "stepTaken") {
//       bindStepTakenRow(node);
//     }

//     if (node.getAttribute("data-type") === "image") {
//       bindImageRow(node);
//     }
//   }

//   function bindSelectOtherInRow(node, selectSel, wrapSel, inputSel) {
//     const select = node.querySelector(selectSel);
//     const wrap = node.querySelector(wrapSel);
//     const input = node.querySelector(inputSel);
//     if (!select || !wrap) return;

//     const sync = () => {
//       const show = isOther(select.value);
//       wrap.classList.toggle("hidden", !show);
//       if (!show && input) input.value = "";
//     };

//     select.addEventListener("change", sync);
//     sync();
//   }

//   function bindStepTakenRow(node) {
//     const typeEl = node.querySelector(".rptStepActionType");
//     const otherWrap = node.querySelector(".rptStepActionTypeOtherWrap");
//     const otherInput = node.querySelector(".rptStepActionTypeOther");

//     const alcoholWrap = node.querySelector(".rptAlcoholResultWrap");
//     const alcoholResult = node.querySelector(".rptAlcoholResult");
//     const alcoholMgWrap = node.querySelector(".rptAlcoholMgWrap");
//     const alcoholMgInput = node.querySelector(".rptAlcoholMgPercent");

//     const drugConfirmedWrap = node.querySelector(".rptDrugConfirmedWrap");
//     const drugDetailWrap = node.querySelector(".rptDrugDetailWrap");
//     const drugConfirmedInput = node.querySelector(".rptDrugConfirmed");
//     const drugDetailInput = node.querySelector(".rptDrugShortDetail");

//     const syncType = () => {
//       const type = norm(typeEl?.value);

//       const isAlcohol = type === "ตรวจวัดปริมาณแอลกอฮอล์";
//       const isDrug = type === "ตรวจสารเสพติดเมทแอเฟตามีน";
//       const isOtherType = isOther(type);

//       if (otherWrap) otherWrap.classList.toggle("hidden", !isOtherType);
//       if (!isOtherType && otherInput) otherInput.value = "";

//       if (alcoholWrap) alcoholWrap.classList.toggle("hidden", !isAlcohol);
//       if (!isAlcohol && alcoholResult) alcoholResult.value = "";

//       syncAlcoholMg();

//       if (drugConfirmedWrap) drugConfirmedWrap.classList.toggle("hidden", !isDrug);
//       if (drugDetailWrap) drugDetailWrap.classList.toggle("hidden", !isDrug);

//       if (!isDrug && drugConfirmedInput) drugConfirmedInput.value = "";
//       if (!isDrug && drugDetailInput) drugDetailInput.value = "";
//     };

//     const syncAlcoholMg = () => {
//       const isAlcohol = norm(typeEl?.value) === "ตรวจวัดปริมาณแอลกอฮอล์";
//       const showMg = isAlcohol && norm(alcoholResult?.value) === "พบ";
//       if (alcoholMgWrap) alcoholMgWrap.classList.toggle("hidden", !showMg);
//       if (!showMg && alcoholMgInput) alcoholMgInput.value = "";
//     };

//     typeEl?.addEventListener("change", syncType);
//     alcoholResult?.addEventListener("change", syncAlcoholMg);

//     syncType();
//   }

//   function bindImageRow(node) {
//     const fileInput = node.querySelector(".rptImageFile");
//     const preview = node.querySelector(".rptImagePreview");
//     const previewEmpty = node.querySelector(".rptImagePreviewEmpty");
//     const meta = node.querySelector(".rptImageMeta");

//     fileInput?.addEventListener("change", () => {
//       const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
//       if (!file) {
//         if (preview && preview.dataset.objectUrl) {
//           try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
//         }
//         if (preview) {
//           preview.removeAttribute("src");
//           preview.dataset.objectUrl = "";
//           preview.classList.add("hidden");
//         }
//         previewEmpty?.classList.remove("hidden");
//         if (meta) meta.textContent = "";
//         return;
//       }

//       if (!/^image\//i.test(file.type || "")) {
//         fileInput.value = "";
//         Swal.fire({
//           icon: "warning",
//           title: "ไฟล์ไม่ถูกต้อง",
//           text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
//         });
//         return;
//       }

//       if (preview && preview.dataset.objectUrl) {
//         try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
//       }

//       const url = URL.createObjectURL(file);
//       if (preview) {
//         preview.src = url;
//         preview.dataset.objectUrl = url;
//         preview.classList.remove("hidden");
//       }
//       previewEmpty?.classList.add("hidden");

//       const mb = file.size / (1024 * 1024);
//       if (meta) meta.textContent = `ไฟล์: ${file.name} (${mb.toFixed(2)} MB)`;
//     });
//   }

//   function refreshRowIndex(listId) {
//     const root = $(listId);
//     if (!root) return;

//     const cards = Array.from(root.querySelectorAll(".rptRepeatCard"));
//     cards.forEach((card, idx) => {
//       const index = idx + 1;
//       const badge = card.querySelector(".rptRowIndex");
//       if (badge) badge.textContent = String(index);

//       const headTitle = card.querySelector(".rptCardHead > div:first-child");
//       if (headTitle) {
//         const type = card.getAttribute("data-type");
//         let label = "รายการ";
//         if (type === "person") label = "ผู้เกี่ยวข้อง";
//         else if (type === "stepTaken") label = "การดำเนินการ";
//         else if (type === "image") label = "รูปภาพ";
//         else if (listId === "rptDamageList") label = "ความเสียหาย";
//         else if (listId === "rptEvidenceList") label = "หลักฐาน";
//         else if (listId === "rptCauseList") label = "สาเหตุ";
//         else if (listId === "rptPreventionList") label = "การป้องกัน";
//         else if (listId === "rptLearningList") label = "ข้อสรุป/บทเรียน";
//         headTitle.textContent = `${label} ${index}`;
//       }
//     });
//   }

//   function toggleEmptyState(listId, label) {
//     const root = $(listId);
//     if (!root) return;

//     let empty = root.querySelector(".rptListEmpty");
//     const count = root.querySelectorAll(".rptRepeatCard").length;

//     if (!empty) {
//       empty = document.createElement("div");
//       empty.className = "rptListEmpty";
//       empty.innerHTML = `
//         <div class="emailEmpty" style="text-align:center">
//           ยังไม่มี${escapeHtml(label)}<br>
//           <span style="font-size:11px;color:#94a3b8">กดปุ่มเพิ่มรายการเพื่อเริ่มต้น</span>
//         </div>
//       `;
//       root.appendChild(empty);
//     }

//     empty.classList.toggle("hidden", count > 0);
//   }

//   function emptyStateLabelFor(listId) {
//     const map = {
//       rptPersonList: "ผู้เกี่ยวข้อง",
//       rptDamageList: "ความเสียหาย",
//       rptStepTakenList: "การดำเนินการ",
//       rptEvidenceList: "หลักฐาน",
//       rptCauseList: "สาเหตุ",
//       rptPreventionList: "การป้องกัน",
//       rptLearningList: "ข้อสรุป/บทเรียน",
//       rptImageList: "รูปภาพ"
//     };
//     return map[listId] || "รายการ";
//   }

//   function collectCheckedOptionObjects(rootId, inputName) {
//     const root = $(rootId);
//     if (!root) return [];

//     return Array.from(root.querySelectorAll(`input[name="${inputName}"]`)).map((el) => ({
//       value: norm(el.value),
//       checked: !!el.checked,
//       otherText: ""
//     }));
//   }

//   function collectWhereTypes() {
//     const root = $("rptWhereTypeSelections");
//     if (!root) return [];

//     return Array.from(root.querySelectorAll(".rptWhereTypeRow")).map((row) => {
//       const chk = row.querySelector(".rptWhereTypeChk");
//       const suffix = row.querySelector(".rptWhereTypeSuffix");

//       return {
//         value: norm(chk?.value),
//         checked: !!chk?.checked,
//         suffixText: !!chk?.checked ? norm(suffix?.value) : ""
//       };
//     }).filter((x) => x.value);
//   }

//   function collectPersons() {
//     return Array.from(document.querySelectorAll("#rptPersonList .rptRepeatCard")).map((card, idx) => ({
//       seq: idx + 1,
//       who: norm(card.querySelector(".rptPersonWho")?.value),
//       position: norm(card.querySelector(".rptPersonPosition")?.value),
//       positionOther: norm(card.querySelector(".rptPersonPositionOther")?.value),
//       department: norm(card.querySelector(".rptPersonDepartment")?.value),
//       departmentOther: norm(card.querySelector(".rptPersonDepartmentOther")?.value),
//       remark: norm(card.querySelector(".rptPersonRemark")?.value),
//       remarkOther: norm(card.querySelector(".rptPersonRemarkOther")?.value)
//     })).filter((x) =>
//       x.who || x.position || x.positionOther || x.department || x.departmentOther || x.remark || x.remarkOther
//     );
//   }

//   function collectIndexedRows(listId) {
//     return Array.from(document.querySelectorAll(`#${listId} .rptRepeatCard`)).map((card, idx) => ({
//       seq: idx + 1,
//       title: norm(card.querySelector(".rptIdxTitle")?.value),
//       detail: norm(card.querySelector(".rptIdxDetail")?.value)
//     })).filter((x) => x.title || x.detail);
//   }

//   function collectStepTakens() {
//     return Array.from(document.querySelectorAll("#rptStepTakenList .rptRepeatCard")).map((card, idx) => ({
//       seq: idx + 1,
//       actionType: norm(card.querySelector(".rptStepActionType")?.value),
//       actionTypeOther: norm(card.querySelector(".rptStepActionTypeOther")?.value),
//       alcoholResult: norm(card.querySelector(".rptAlcoholResult")?.value),
//       alcoholMgPercent: norm(card.querySelector(".rptAlcoholMgPercent")?.value),
//       drugConfirmed: norm(card.querySelector(".rptDrugConfirmed")?.value),
//       drugShortDetail: norm(card.querySelector(".rptDrugShortDetail")?.value),
//       detail: norm(card.querySelector(".rptStepDetail")?.value)
//     })).filter((x) =>
//       x.actionType || x.actionTypeOther || x.alcoholResult || x.alcoholMgPercent || x.drugConfirmed || x.drugShortDetail || x.detail
//     );
//   }

//   async function fileToBase64(file) {
//     return new Promise((resolve, reject) => {
//       const fr = new FileReader();
//       fr.onload = () => {
//         const out = String(fr.result || "");
//         const i = out.indexOf(",");
//         resolve(i >= 0 ? out.slice(i + 1) : out);
//       };
//       fr.onerror = () => reject(fr.error || new Error("ไม่สามารถอ่านไฟล์ได้"));
//       fr.readAsDataURL(file);
//     });
//   }

//   async function collectImages() {
//     const rows = Array.from(document.querySelectorAll("#rptImageList .rptRepeatCard"));
//     const out = [];

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       const fileInput = row.querySelector(".rptImageFile");
//       const file = fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null;
//       const caption = norm(row.querySelector(".rptImageCaption")?.value);

//       if (!file && !caption) continue;
//       if (!file) throw new Error(`รูปภาพรายการที่ ${i + 1} ยังไม่ได้เลือกไฟล์`);
//       if (!/^image\//i.test(file.type || "")) {
//         throw new Error(`ไฟล์รูปภาพรายการที่ ${i + 1} ไม่ถูกต้อง`);
//       }

//       const base64 = await fileToBase64(file);
//       out.push({
//         filename: file.name,
//         mimeType: file.type || "application/octet-stream",
//         base64: base64,
//         caption: caption
//       });
//     }

//     return out;
//   }

//   function collectEmailRecipients() {
//     const checked = Array.from(document.querySelectorAll(".rptEmailChk:checked"))
//       .map((el) => norm(el.value))
//       .filter(Boolean);

//     const extra = splitMultiEmails($("rptEmailOther")?.value || "");
//     return uniqueEmails([].concat(checked).concat(extra));
//   }

//   function collectPayload() {
//     const auth = getAuth();

//     const payload = {
//       refNo: getRefNo(),
//       lps: norm(auth.name),

//       reportedBy: norm($("rptReportedBy")?.value) || norm(auth.name),
//       reporterPosition: norm($("rptReporterPosition")?.value),
//       reporterPositionOther: norm($("rptReporterPositionOther")?.value),
//       reportDate: norm($("rptReportDate")?.value),

//       branch: norm($("rptBranch")?.value),
//       branchOther: norm($("rptBranchOther")?.value),
//       subject: norm($("rptSubject")?.value),

//       reportTypes: collectCheckedOptionObjects("rptReportTypes", "rptReportTypes"),
//       urgencyTypes: collectCheckedOptionObjects("rptUrgencyTypes", "rptUrgencyTypes"),
//       notifyTo: collectCheckedOptionObjects("rptNotifyTo", "rptNotifyTo"),

//       incidentDate: norm($("rptIncidentDate")?.value),
//       incidentTime: norm($("rptIncidentTime")?.value),
//       whatHappen: norm($("rptWhatHappen")?.value),

//       whereDidItHappen: norm($("rptWhereDidItHappen")?.value),
//       whereTypeSelections: collectWhereTypes(),
//       area: norm($("rptArea")?.value),

//       involvedPersons: collectPersons(),

//       damages: collectIndexedRows("rptDamageList"),
//       stepTakens: collectStepTakens(),
//       offenderStatement: norm($("rptOffenderStatement")?.value),
//       evidences: collectIndexedRows("rptEvidenceList"),
//       summaryText: norm($("rptSummaryText")?.value),
//       causes: collectIndexedRows("rptCauseList"),
//       preventions: collectIndexedRows("rptPreventionList"),
//       learnings: collectIndexedRows("rptLearningList"),

//       emailRecipients: Array.from(document.querySelectorAll(".rptEmailChk:checked"))
//         .map((el) => norm(el.value))
//         .filter(Boolean),
//       emailOther: norm($("rptEmailOther")?.value)
//     };

//     validatePayload(payload);
//     return payload;
//   }

//   function validatePayload(p) {
//     if (!norm(p.refNo)) throw new Error("กรุณากรอก Ref No.");
//     if (!norm(p.branch)) throw new Error("กรุณาเลือกสาขา");
//     if (isOther(p.branch) && !norm(p.branchOther)) throw new Error("กรุณาระบุสาขาอื่นๆ");
//     if (!norm(p.subject)) throw new Error("กรุณากรอกเรื่อง");

//     if (!(p.reportTypes || []).some((x) => x.checked)) throw new Error("กรุณาเลือกประเภทรายงานอย่างน้อย 1 รายการ");
//     if (!(p.urgencyTypes || []).some((x) => x.checked)) throw new Error("กรุณาเลือกระดับความเร่งด่วนอย่างน้อย 1 รายการ");
//     if (!(p.notifyTo || []).some((x) => x.checked)) throw new Error("กรุณาเลือกผู้รับทราบอย่างน้อย 1 รายการ");

//     if (!norm(p.incidentDate)) throw new Error("กรุณาเลือกวันที่เกิดเหตุ");
//     if (!norm(p.whereDidItHappen)) throw new Error("กรุณาเลือกสถานที่เกิดเหตุ");
//     if (!norm(p.whatHappen)) throw new Error("กรุณากรอกรายละเอียดเหตุการณ์");
//     if (!norm(p.reportedBy)) throw new Error("ไม่พบชื่อผู้รายงาน");
//     if (!norm(p.reportDate)) throw new Error("กรุณาเลือกวันที่รายงาน");

//     (p.whereTypeSelections || []).forEach((x) => {
//       const isStore = /store$/i.test(norm(x.value));
//       if (x.checked && isStore && !norm(x.suffixText)) {
//         throw new Error(`กรุณากรอกข้อมูลต่อท้าย ${x.value}`);
//       }
//     });

//     (p.involvedPersons || []).forEach((x, idx) => {
//       if (isOther(x.position) && !norm(x.positionOther)) {
//         throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Position อื่นๆ`);
//       }
//       if (isOther(x.department) && !norm(x.departmentOther)) {
//         throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Department อื่นๆ`);
//       }
//       if (isOther(x.remark) && !norm(x.remarkOther)) {
//         throw new Error(`ผู้เกี่ยวข้องลำดับ ${idx + 1}: กรุณาระบุ Remark อื่นๆ`);
//       }
//     });

//     (p.stepTakens || []).forEach((x, idx) => {
//       if (x.actionType === "ตรวจวัดปริมาณแอลกอฮอล์") {
//         if (!norm(x.alcoholResult)) {
//           throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณาเลือกผลการตรวจแอลกอฮอล์`);
//         }
//         if (norm(x.alcoholResult) === "พบ" && !norm(x.alcoholMgPercent)) {
//           throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณากรอกค่า Mg%`);
//         }
//       }
//       if (x.actionType === "ตรวจสารเสพติดเมทแอเฟตามีน") {
//         if (!norm(x.drugConfirmed)) {
//           throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณากรอกผลยืนยันการเสพ`);
//         }
//       }
//       if (isOther(x.actionType) && !norm(x.actionTypeOther)) {
//         throw new Error(`การดำเนินการลำดับ ${idx + 1}: กรุณาระบุการดำเนินการอื่นๆ`);
//       }
//     });

//     if (isOther(p.reporterPosition) && !norm(p.reporterPositionOther)) {
//       throw new Error("กรุณาระบุตำแหน่งผู้รายงานอื่นๆ");
//     }
//   }

//   function payloadSummaryHtml(payload, images) {
//     const selectedEmails = collectEmailRecipients();

//     return `
//       <div class="swalSummary">
//         <div class="swalHero">
//           <div class="swalHeroTitle">ตรวจสอบข้อมูลก่อนบันทึก</div>
//           <div class="swalHeroSub">Report500</div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">ข้อมูลหลัก</div>
//           <div class="swalKvGrid">
//             <div class="swalKv"><div class="swalKvLabel">Ref No.</div><div class="swalKvValue">${escapeHtml(payload.refNo)}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">สาขา</div><div class="swalKvValue">${escapeHtml(payload.branch)}${payload.branchOther ? " (" + escapeHtml(payload.branchOther) + ")" : ""}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">เรื่อง</div><div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">Reported by</div><div class="swalKvValue">${escapeHtml(payload.reportedBy || "-")}</div></div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">เหตุการณ์</div>
//           <div class="swalKvGrid">
//             <div class="swalKv"><div class="swalKvLabel">วันที่</div><div class="swalKvValue">${escapeHtml(payload.incidentDate || "-")}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">เวลา</div><div class="swalKvValue">${escapeHtml(payload.incidentTime || "-")}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">สถานที่หลัก</div><div class="swalKvValue">${escapeHtml(payload.whereDidItHappen || "-")}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">Area</div><div class="swalKvValue">${escapeHtml(payload.area || "-")}</div></div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">สรุปจำนวนรายการ</div>
//           <div class="swalKvGrid">
//             <div class="swalKv"><div class="swalKvLabel">ผู้เกี่ยวข้อง</div><div class="swalKvValue">${payload.involvedPersons.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">ความเสียหาย</div><div class="swalKvValue">${payload.damages.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">การดำเนินการ</div><div class="swalKvValue">${payload.stepTakens.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">หลักฐาน</div><div class="swalKvValue">${payload.evidences.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">สาเหตุ</div><div class="swalKvValue">${payload.causes.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">การป้องกัน</div><div class="swalKvValue">${payload.preventions.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">ข้อสรุป/บทเรียน</div><div class="swalKvValue">${payload.learnings.length}</div></div>
//             <div class="swalKv"><div class="swalKvLabel">รูปภาพ</div><div class="swalKvValue">${images.length}</div></div>
//           </div>
//         </div>

//         <div class="swalSection">
//           <div class="swalSectionTitle">อีเมลปลายทาง</div>
//           <div class="swalKvValue">${selectedEmails.length} รายการ</div>
//         </div>
//       </div>
//     `;
//   }

//   async function preview() {
//     try {
//       const payload = collectPayload();
//       const images = await collectImages();

//       await Swal.fire({
//         title: "สรุปก่อนบันทึก",
//         html: payloadSummaryHtml(payload, images),
//         width: 920,
//         confirmButtonText: "ปิด"
//       });
//     } catch (err) {
//       Swal.fire({
//         icon: "warning",
//         title: "ตรวจสอบข้อมูลไม่ผ่าน",
//         text: err?.message || String(err)
//       });
//     }
//   }

//  async function submit() {
//   const auth = getAuth();
//   if (!norm(auth.pass)) {
//     Swal.fire({
//       icon: "warning",
//       title: "ยังไม่ได้เข้าสู่ระบบ",
//       text: "กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล"
//     });
//     return;
//   }

//   try {
//     const payload = collectPayload();
//     const images = await collectImages();

//     const ok = await Swal.fire({
//       icon: "question",
//       title: "ยืนยันการบันทึก Report",
//       html: payloadSummaryHtml(payload, images),
//       width: 920,
//       showCancelButton: true,
//       confirmButtonText: "ยืนยันบันทึก",
//       cancelButtonText: "ยกเลิก"
//     });

//     if (!ok.isConfirmed) return;

//     const Progress = window.ProgressUI;
//     Progress?.show(
//       "กำลังบันทึก Report",
//       "ระบบกำลังตรวจสอบข้อมูล อัปโหลดรูป สร้าง PDF และส่งอีเมล"
//     );

//     Progress?.activateOnly("validate", 8, "กำลังตรวจสอบข้อมูลรายงาน");
//     await (window.sleepMs ? window.sleepMs(160) : new Promise((r) => setTimeout(r, 160)));
//     Progress?.markDone("validate", 14, "ตรวจสอบข้อมูลเรียบร้อย");

//     Progress?.activateOnly("upload", 18, "กำลังเตรียมรูปภาพสำหรับรายงาน");
//     const uploadProg = typeof window.estimateUploadProgressByFiles === "function"
//       ? window.estimateUploadProgressByFiles(Math.max(images.length, 1), 18, 42)
//       : {
//           next: (currentIndex) => {
//             const count = Math.max(1, images.length || 1);
//             const ratio = Math.max(0, Math.min(1, currentIndex / count));
//             return Math.round(18 + ((42 - 18) * ratio));
//           }
//         };

//     images.forEach((_, idx) => {
//       Progress?.setProgress(uploadProg.next(idx + 1), `เตรียมรูปภาพ ${idx + 1}/${images.length || 1}`);
//     });

//     await (window.sleepMs ? window.sleepMs(120) : new Promise((r) => setTimeout(r, 120)));
//     Progress?.markDone("upload", 44, `เตรียมรูปภาพเรียบร้อย (${images.length} รูป)`);

//     Progress?.activateOnly("save", 56, "กำลังบันทึกข้อมูล Report500");

//     const res = await fetch(apiUrl("/report500/submit"), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         pass: auth.pass,
//         payload: payload,
//         files: images
//       })
//     });

//     const text = await res.text();
//     let json = {};
//     try {
//       json = JSON.parse(text);
//     } catch (_) {
//       throw new Error("Backend ตอบกลับไม่ใช่ JSON");
//     }

//     if (!res.ok || !json.ok) {
//       throw new Error(json?.error || `บันทึกข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
//     }

//     Progress?.markDone("save", 72, "บันทึกข้อมูลลงระบบเรียบร้อย");

//     Progress?.activateOnly("pdf", 84, "กำลังสร้างไฟล์ PDF");
//     await (window.sleepMs ? window.sleepMs(180) : new Promise((r) => setTimeout(r, 180)));

//     if (json.pdfFileId || json.pdfUrl) {
//       const sizeText = json.pdfSizeText ? ` (${json.pdfSizeText})` : "";
//       Progress?.markDone("pdf", 93, `สร้างไฟล์ PDF เรียบร้อย${sizeText}`);
//     } else {
//       Progress?.markDone("pdf", 93, "สร้างไฟล์ PDF เรียบร้อย");
//     }

//     Progress?.activateOnly("email", 97, "กำลังตรวจสอบผลการส่งอีเมล");
//     await (window.sleepMs ? window.sleepMs(160) : new Promise((r) => setTimeout(r, 160)));

//     const emailResult = json.emailResult || {};
//     const emailOk = !!emailResult.ok;
//     const emailSkipped = !!emailResult.skipped;
//     const attachmentMode = String(emailResult.attachmentMode || "").trim();
//     const emailErr = String(emailResult.error || "").trim();

//     let emailText = "ส่งอีเมลเรียบร้อย";
//     if (attachmentMode === "LINK_ONLY") emailText = "ส่งอีเมลพร้อมลิงก์ PDF";
//     if (attachmentMode === "ATTACHED") emailText = "ส่งอีเมลพร้อมไฟล์ PDF";

//     if (emailOk) {
//       Progress?.markDone("email", 100, emailText, emailText);
//       Progress?.success("บันทึกสำเร็จ", "รายงานถูกบันทึกเรียบร้อยแล้ว");
//     } else if (emailSkipped) {
//       Progress?.markDone("email", 100, "ไม่ได้เลือกส่งอีเมล", "ข้าม");
//       Progress?.success("บันทึกสำเร็จ", "บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว");
//     } else {
//       Progress?.markError("email", "ส่งอีเมลไม่สำเร็จ", 100);
//       Progress?.success("บันทึกสำเร็จ", "ข้อมูลและ PDF สำเร็จแล้ว แต่การส่งอีเมลไม่สำเร็จ");
//       Progress?.setHint(emailErr || "กรุณาตรวจสอบสิทธิ์เมลหรือขนาดไฟล์ PDF");
//     }

//     Progress?.hide(120);

//     await Swal.fire({
//       icon: (emailOk || emailSkipped) ? "success" : "warning",
//       title: (emailOk || emailSkipped) ? "บันทึก Report สำเร็จ" : "บันทึก Report สำเร็จบางส่วน",
//       showConfirmButton: false,
//       width: 820,
//       html: `
//         <div class="swalSummary">
//           <div class="swalHero">
//             <div class="swalHeroTitle">บันทึกรายงานเรียบร้อยแล้ว</div>
//             <div class="swalHeroSub">ระบบจัดเก็บข้อมูล รูปภาพ และไฟล์ PDF เรียบร้อย</div>
//             <div class="swalPillRow">
//               <div class="swalPill primary">Ref: ${escapeHtml(json.refNo || payload.refNo || "-")}</div>
//               <div class="swalPill">รูป ${Number(json.imageCount || images.length || 0)}</div>
//               <div class="swalPill">${emailOk ? "ส่งอีเมลสำเร็จ" : emailSkipped ? "ไม่ได้ส่งอีเมล" : "อีเมลไม่สำเร็จ"}</div>
//             </div>
//           </div>

//           <div class="swalSection">
//             <div class="swalSectionTitle">สรุปผลการบันทึก</div>
//             <div class="swalKvGrid">
//               <div class="swalKv">
//                 <div class="swalKvLabel">Ref No.</div>
//                 <div class="swalKvValue">${escapeHtml(json.refNo || payload.refNo || "-")}</div>
//               </div>
//               <div class="swalKv">
//                 <div class="swalKvLabel">เรื่อง</div>
//                 <div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div>
//               </div>
//               <div class="swalKv">
//                 <div class="swalKvLabel">รูปภาพ</div>
//                 <div class="swalKvValue">${Number(json.imageCount || images.length || 0)} รูป</div>
//               </div>
//               <div class="swalKv">
//                 <div class="swalKvLabel">PDF</div>
//                 <div class="swalKvValue">${json.pdfUrl ? "สร้างแล้ว" : "ไม่พบลิงก์ PDF"}</div>
//               </div>
//               <div class="swalKv">
//                 <div class="swalKvLabel">การส่งอีเมล</div>
//                 <div class="swalKvValue">${
//                   emailOk ? emailText :
//                   emailSkipped ? "ไม่ได้เลือกผู้รับอีเมล" :
//                   `ไม่สำเร็จ${emailErr ? ` - ${escapeHtml(emailErr)}` : ""}`
//                 }</div>
//               </div>
//             </div>
//           </div>

//           <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
//             ${
//               json.pdfUrl
//                 ? `<button type="button" id="btnRptOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
//                 : ``
//             }
//             <button type="button" id="btnRptCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
//           </div>
//         </div>
//       `,
//       didOpen: () => {
//         const btnOpen = document.getElementById("btnRptOpenPdfAfterSave");
//         const btnClose = document.getElementById("btnRptCloseAfterSave");

//         if (btnOpen && json.pdfUrl) {
//           btnOpen.addEventListener("click", () => {
//             window.open(json.pdfUrl, "_blank", "noopener,noreferrer");
//             Swal.close();
//           });
//         }

//         if (btnClose) {
//           btnClose.addEventListener("click", () => {
//             Swal.close();
//           });
//         }
//       },
//       willClose: () => {
//         resetForm();
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     window.ProgressUI?.markError("save", err?.message || "เกิดข้อผิดพลาด", 56);
//     window.ProgressUI?.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

//     await Swal.fire({
//       icon: "error",
//       title: "บันทึก Report500 ไม่สำเร็จ",
//       text: err?.message || String(err)
//     });

//     window.ProgressUI?.hide(180);
//   }
// }

//   function resetForm() {
//     [
//       "rptRefNo",
//       "rptBranchOther",
//       "rptSubject",
//       "rptIncidentTime",
//       "rptWhatHappen",
//       "rptArea",
//       "rptOffenderStatement",
//       "rptSummaryText",
//       "rptReporterPositionOther",
//       "rptEmailOther"
//     ].forEach((id) => {
//       const el = $(id);
//       if (el) el.value = "";
//     });

//     ["rptBranch", "rptWhereDidItHappen", "rptReporterPosition"].forEach((id) => {
//       const el = $(id);
//       if (el) el.value = "";
//     });

//     if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
//     if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();

//     setRefYear();
//     setReadonlyValue("rptReportedBy", norm(getAuth().name));

//     document.querySelectorAll('.rptEmailChk, #rptReportTypes input[type="checkbox"], #rptUrgencyTypes input[type="checkbox"], #rptNotifyTo input[type="checkbox"], #rptWhereTypeSelections input[type="checkbox"]').forEach((el) => {
//       el.checked = false;
//     });

//     document.querySelectorAll(".rptWhereTypeSuffix").forEach((el) => {
//       el.value = "";
//       el.closest(".optionChoiceOther")?.classList.add("hidden");
//     });

//     bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
//     bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

//     if ($("rptPersonList")) $("rptPersonList").innerHTML = "";
//     if ($("rptDamageList")) $("rptDamageList").innerHTML = "";
//     if ($("rptStepTakenList")) $("rptStepTakenList").innerHTML = "";
//     if ($("rptEvidenceList")) $("rptEvidenceList").innerHTML = "";
//     if ($("rptCauseList")) $("rptCauseList").innerHTML = "";
//     if ($("rptPreventionList")) $("rptPreventionList").innerHTML = "";
//     if ($("rptLearningList")) $("rptLearningList").innerHTML = "";
//     if ($("rptImageList")) $("rptImageList").innerHTML = "";

//     toggleEmptyState("rptPersonList", "ผู้เกี่ยวข้อง");
//     toggleEmptyState("rptDamageList", "ความเสียหาย");
//     toggleEmptyState("rptStepTakenList", "การดำเนินการ");
//     toggleEmptyState("rptEvidenceList", "หลักฐาน");
//     toggleEmptyState("rptCauseList", "สาเหตุ");
//     toggleEmptyState("rptPreventionList", "การป้องกัน");
//     toggleEmptyState("rptLearningList", "ข้อสรุป/บทเรียน");
//     toggleEmptyState("rptImageList", "รูปภาพ");

//     appendRow("rptPersonList", createPersonRowHtml(1), "ผู้เกี่ยวข้อง");
//     appendRow("rptImageList", createImageRowHtml(1), "รูปภาพ");
//   }

//   function bindTopButtons() {
//     $("btnRptPreview")?.addEventListener("click", preview);
//     $("btnRptSubmit")?.addEventListener("click", submit);

//     $("btnRptEmailCheckAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", true));
//     $("btnRptEmailClearAll")?.addEventListener("click", () => setAllChecks(".rptEmailChk", false));

//     $("btnRptAddPerson")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptPersonList .rptRepeatCard").length + 1;
//       appendRow("rptPersonList", createPersonRowHtml(idx), "ผู้เกี่ยวข้อง");
//     });

//     $("btnRptAddDamage")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptDamageList .rptRepeatCard").length + 1;
//       appendRow(
//         "rptDamageList",
//         createSimpleIndexedRowHtml("damage", idx, "ความเสียหาย", "รายละเอียด", "หัวข้อความเสียหาย", "รายละเอียดเพิ่มเติม"),
//         "ความเสียหาย"
//       );
//     });

//     $("btnRptAddStepTaken")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptStepTakenList .rptRepeatCard").length + 1;
//       appendRow("rptStepTakenList", createStepTakenRowHtml(idx), "การดำเนินการ");
//     });

//     $("btnRptAddEvidence")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptEvidenceList .rptRepeatCard").length + 1;
//       appendRow(
//         "rptEvidenceList",
//         createSimpleIndexedRowHtml("evidence", idx, "หลักฐาน", "รายละเอียด", "หัวข้อหลักฐาน", "รายละเอียดเพิ่มเติม"),
//         "หลักฐาน"
//       );
//     });

//     $("btnRptAddCause")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptCauseList .rptRepeatCard").length + 1;
//       appendRow(
//         "rptCauseList",
//         createSimpleIndexedRowHtml("cause", idx, "สาเหตุ", "รายละเอียด", "หัวข้อสาเหตุ", "รายละเอียดเพิ่มเติม"),
//         "สาเหตุ"
//       );
//     });

//     $("btnRptAddPrevention")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptPreventionList .rptRepeatCard").length + 1;
//       appendRow(
//         "rptPreventionList",
//         createSimpleIndexedRowHtml("prevention", idx, "การป้องกัน", "รายละเอียด", "หัวข้อการป้องกัน", "รายละเอียดเพิ่มเติม"),
//         "การป้องกัน"
//       );
//     });

//     $("btnRptAddLearning")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptLearningList .rptRepeatCard").length + 1;
//       appendRow(
//         "rptLearningList",
//         createSimpleIndexedRowHtml("learning", idx, "ข้อสรุป/บทเรียน", "รายละเอียด", "หัวข้อข้อสรุป", "รายละเอียดเพิ่มเติม"),
//         "ข้อสรุป/บทเรียน"
//       );
//     });

//     $("btnRptAddImage")?.addEventListener("click", () => {
//       const idx = document.querySelectorAll("#rptImageList .rptRepeatCard").length + 1;
//       appendRow("rptImageList", createImageRowHtml(idx), "รูปภาพ");
//     });
//   }

//   async function ensureReady() {
//     if (state.ready || state.loading) return;
//     state.loading = true;

//     try {
//       setRefYear();

//       const res = await fetch(apiUrl("/report500/options"), { method: "GET" });
//       const text = await res.text();

//       let json = {};
//       try {
//         json = JSON.parse(text);
//       } catch (_) {}

//       if (!res.ok || !json.ok) {
//         throw new Error(json?.error || `โหลดตัวเลือก Report500 ไม่สำเร็จ (HTTP ${res.status})`);
//       }

//       state.options = (json && json.data) ? json.data : {};

//       renderSelect("rptBranch", state.options.branchList, true);
//       renderOptionMatrix("rptReportTypes", "rptReportTypes", state.options.reportTypeList);
//       renderOptionMatrix("rptUrgencyTypes", "rptUrgencyTypes", state.options.urgencyList);
//       renderOptionMatrix("rptNotifyTo", "rptNotifyTo", state.options.notifyToList);

//       renderSelect("rptWhereDidItHappen", state.options.locationList, false);
//       if ($("rptWhereDidItHappen") && state.options.whereDidItHappenDefault) {
//         $("rptWhereDidItHappen").value = state.options.whereDidItHappenDefault;
//       }

//       renderWhereTypeSelections();
//       renderSelect("rptReporterPosition", state.options.reporterPositionList, true);
//       renderEmailSelector();

//       setReadonlyValue("rptReportedBy", norm(getAuth().name));
//       if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();
//       if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();

//       bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
//       bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

//       bindTopButtons();

//       resetForm();
//       state.ready = true;
//     } finally {
//       state.loading = false;
//     }
//   }

//   window.Report500UI = {
//     ensureReady,
//     preview,
//     submit,
//     reset: resetForm
//   };
// })();

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

    select.removeEventListener?.("__dummy__", sync);
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
      </div>
    `;
  }

  function createPersonRowHtml(index) {
    const positionOptions = buildOptionsHtml(state.options?.personPositionList, true);
    const departmentOptions = buildOptionsHtml(state.options?.personDepartmentList, true);
    const remarkOptions = buildOptionsHtml(state.options?.personRemarkList, true);

    return `
      <div class="rptRepeatCard" data-type="person">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">ผู้เกี่ยวข้อง ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

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
    `;
  }

  function createStepTakenRowHtml(index) {
    const actionOptions = buildOptionsHtml(state.options?.actionTypeList, true);

    return `
      <div class="rptRepeatCard" data-type="stepTaken">
        <div class="rptCardHead" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e7eef8">
          <div style="font-size:13px;font-weight:900;line-height:1.2">การดำเนินการ ${index}</div>
          <div class="rptRowIndex" style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:999px;background:#eef4ff;color:#1d4ed8;border:1px solid #d8e5fb;font-size:11px;font-weight:900">${index}</div>
        </div>

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
          <button type="button" class="btn ghost rptRemoveRow">ลบแถว</button>
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

  function bindDynamicRow(node) {
    if (!node) return;

    node.querySelector(".rptRemoveRow")?.addEventListener("click", () => {
      const img = node.querySelector(".rptImagePreview");
      if (img && img.dataset.objectUrl) {
        try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_) {}
      }
      const parentId = node.parentElement?.id || "";
      node.remove();
      if (parentId) {
        refreshRowIndex(parentId);
        toggleEmptyState(parentId, emptyStateLabelFor(parentId));
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
    };

    typeEl?.addEventListener("change", syncType);
    alcoholResult?.addEventListener("change", syncAlcoholMg);

    syncType();
  }

  function bindImageRow(node) {
    const fileInput = node.querySelector(".rptImageFile");
    const preview = node.querySelector(".rptImagePreview");
    const previewEmpty = node.querySelector(".rptImagePreviewEmpty");
    const meta = node.querySelector(".rptImageMeta");

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!file) {
        if (preview && preview.dataset.objectUrl) {
          try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
        }
        if (preview) {
          preview.removeAttribute("src");
          preview.dataset.objectUrl = "";
          preview.classList.add("hidden");
        }
        previewEmpty?.classList.remove("hidden");
        if (meta) meta.textContent = "";
        return;
      }

      if (!/^image\//i.test(file.type || "")) {
        fileInput.value = "";
        Swal.fire({
          icon: "warning",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
        });
        return;
      }

      if (preview && preview.dataset.objectUrl) {
        try { URL.revokeObjectURL(preview.dataset.objectUrl); } catch (_) {}
      }

      const url = URL.createObjectURL(file);
      if (preview) {
        preview.src = url;
        preview.dataset.objectUrl = url;
        preview.classList.remove("hidden");
      }
      previewEmpty?.classList.add("hidden");

      const mb = file.size / (1024 * 1024);
      if (meta) meta.textContent = `ไฟล์: ${file.name} (${mb.toFixed(2)} MB)`;
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
      const file = fileInput?.files && fileInput.files[0] ? fileInput.files[0] : null;
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
          <div class="swalHeroSub">Report500</div>
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

      Progress?.activateOnly("save", 56, "กำลังบันทึกข้อมูล Report500");

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
                  <div class="swalKvLabel">เรื่อง</div>
                  <div class="swalKvValue">${escapeHtml(payload.subject || "-")}</div>
                </div>
                <div class="swalKv">
                  <div class="swalKvLabel">รูปภาพ</div>
                  <div class="swalKvValue">${Number(json.imageCount || images.length || 0)} รูป</div>
                </div>
                <div class="swalKv">
                  <div class="swalKvLabel">PDF</div>
                  <div class="swalKvValue">${json.pdfUrl ? "สร้างแล้ว" : "ไม่พบลิงก์ PDF"}</div>
                </div>
                <div class="swalKv">
                  <div class="swalKvLabel">การส่งอีเมล</div>
                  <div class="swalKvValue">${
                    emailOk ? emailText :
                    emailSkipped ? "ไม่ได้เลือกผู้รับอีเมล" :
                    `ไม่สำเร็จ${emailErr ? ` - ${escapeHtml(emailErr)}` : ""}`
                  }</div>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
              ${
                json.pdfUrl
                  ? `<button type="button" id="btnRptOpenPdfAfterSave" class="swal2-confirm swal2-styled" style="background:#2563eb">เปิด PDF</button>`
                  : ``
              }
              <button type="button" id="btnRptCloseAfterSave" class="swal2-cancel swal2-styled" style="display:inline-block;background:#64748b">ปิดหน้าต่าง</button>
            </div>
          </div>
        `,
        didOpen: () => {
          const btnOpen = document.getElementById("btnRptOpenPdfAfterSave");
          const btnClose = document.getElementById("btnRptCloseAfterSave");

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
      window.ProgressUI?.markError("save", err?.message || "เกิดข้อผิดพลาด", 56);
      window.ProgressUI?.setHint("กรุณาตรวจสอบข้อมูล เครือข่าย หรือ backend แล้วลองใหม่อีกครั้ง");

      await Swal.fire({
        icon: "error",
        title: "บันทึก Report500 ไม่สำเร็จ",
        text: err?.message || String(err)
      });

      window.ProgressUI?.hide(180);
    }
  }

  function resetForm() {
    [
      "rptRefNo",
      "rptBranchOther",
      "rptSubject",
      "rptIncidentTime",
      "rptWhatHappen",
      "rptArea",
      "rptOffenderStatement",
      "rptSummaryText",
      "rptReporterPositionOther",
      "rptEmailOther"
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    ["rptBranch", "rptWhereDidItHappen", "rptReporterPosition"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });

    if ($("rptIncidentDate")) $("rptIncidentDate").value = todayIsoLocal();
    if ($("rptReportDate")) $("rptReportDate").value = todayIsoLocal();

    setRefYear();
    setReadonlyValue("rptReportedBy", norm(getAuth().name));

    document.querySelectorAll('.rptEmailChk, #rptReportTypes input[type="checkbox"], #rptUrgencyTypes input[type="checkbox"], #rptNotifyTo input[type="checkbox"], #rptWhereTypeSelections input[type="checkbox"]').forEach((el) => {
      el.checked = false;
    });

    document.querySelectorAll(".rptWhereTypeSuffix").forEach((el) => {
      el.value = "";
      el.closest(".optionChoiceOther")?.classList.add("hidden");
    });

    bindOtherSelect("rptBranch", "rptBranchOtherWrap", "rptBranchOther");
    bindOtherSelect("rptReporterPosition", "rptReporterPositionOtherWrap", "rptReporterPositionOther");

    if ($("rptPersonList")) $("rptPersonList").innerHTML = "";
    if ($("rptDamageList")) $("rptDamageList").innerHTML = "";
    if ($("rptStepTakenList")) $("rptStepTakenList").innerHTML = "";
    if ($("rptEvidenceList")) $("rptEvidenceList").innerHTML = "";
    if ($("rptCauseList")) $("rptCauseList").innerHTML = "";
    if ($("rptPreventionList")) $("rptPreventionList").innerHTML = "";
    if ($("rptLearningList")) $("rptLearningList").innerHTML = "";
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
  }

  function bindTopButtons() {
    if (state.buttonsBound) return;
    state.buttonsBound = true;

    $("btnRptPreview")?.addEventListener("click", preview);
    $("btnRptSubmit")?.addEventListener("click", submit);

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
  }

  async function ensureReady() {
    if (state.ready || state.loading) return;
    state.loading = true;

    try {
      setRefYear();

      const res = await fetch(apiUrl("/report500/options"), { method: "GET" });
      const text = await res.text();

      let json = {};
      try {
        json = JSON.parse(text);
      } catch (_) {}

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `โหลดตัวเลือก Report500 ไม่สำเร็จ (HTTP ${res.status})`);
      }

      state.options = (json && json.data) ? json.data : {};

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
