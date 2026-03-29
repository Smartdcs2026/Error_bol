(function () {
  const editorState = {
    modal: null,
    canvasEl: null,
    canvas: null,
    baseImage: null,
    originalFile: null,
    originalUrl: "",
    resultResolve: null,

    activeTool: "select",
    strokeColor: "#dc2626",
    strokeWidth: 3,
    zoom: 1,
    brightness: 0,

    isPanning: false,
    isApplyingCrop: false,
    isRefreshingEffect: false,

    cropRect: null,
    tempDraft: null,
    history: [],
    historyIndex: -1,
    restoringHistory: false,

    floatingToggleBtn: null,
    floatingToolPanel: null
  };

  const $ = (id) => document.getElementById(id);

  const TOOL_ICONS = {
    ieSelectBtn: "⌖",
    iePanBtn: "✥",
    ieTextBtn: "T",
    ieCropToolBtn: "◫",

    ieLineBtn: "／",
    ieArrowBtn: "➜",
    ieRectBtn: "▭",
    ieCircleBtn: "◯",

    ieBlurRectBtn: "◫",
    ieBlurCircleBtn: "◌",
    ieMosaicRectBtn: "▦",
    ieMosaicCircleBtn: "◍",

    ieZoomOutBtn: "－",
    ieZoomResetBtn: "◎",
    ieZoomInBtn: "＋",
    ieFitBtn: "⤢",

    ieUndoBtn: "↶",
    ieRedoBtn: "↷",
    ieDeleteBtn: "⌫",
    ieApplyCropBtn: "✓",

    ieRotateLeftBtn: "↺",
    ieRotateRightBtn: "↻"
  };

  function showMessage(type, title, text) {
    if (window.Swal) {
      return Swal.fire({
        icon: type || "info",
        title: title || "",
        text: text || "",
        confirmButtonText: "ตกลง"
      });
    }
    alert((title ? title + "\n" : "") + (text || ""));
    return Promise.resolve();
  }

  function ensureFabricReady() {
    if (!window.fabric) throw new Error("ยังไม่พบ Fabric.js");
  }

  function ensureModal() {
    editorState.modal = $("imgEditorModal");
    editorState.canvasEl = $("imgEditorCanvas");
    if (!editorState.modal || !editorState.canvasEl) {
      throw new Error("ยังไม่พบโครง modal ของ image editor");
    }
  }

  function revokeOriginalUrl() {
    if (editorState.originalUrl) {
      try { URL.revokeObjectURL(editorState.originalUrl); } catch (_) {}
      editorState.originalUrl = "";
    }
  }

  function destroyCanvas() {
    if (editorState.canvas) {
      try { editorState.canvas.dispose(); } catch (_) {}
      editorState.canvas = null;
    }
    editorState.baseImage = null;
    editorState.cropRect = null;
    editorState.tempDraft = null;
    editorState.isRefreshingEffect = false;
  }

  function nextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  function closeEditor(result = { ok: false }) {
    editorState.modal?.classList.add("hidden");
    editorState.modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("img-editor-lock");

    destroyCanvas();
    revokeOriginalUrl();

    editorState.originalFile = null;
    editorState.history = [];
    editorState.historyIndex = -1;
    editorState.restoringHistory = false;
    editorState.isApplyingCrop = false;

    const resolve = editorState.resultResolve;
    editorState.resultResolve = null;
    if (resolve) resolve(result);
  }

  function setZoomLabel() {
    const el = $("ieZoomLabel");
    if (el) el.textContent = `${Math.round(editorState.zoom * 100)}%`;
  }

  function setToolLabel() {
    const map = {
      select: "เลือก",
      pan: "เลื่อนภาพ",
      line: "เส้นตรง",
      arrow: "ลูกศร",
      rect: "สี่เหลี่ยม",
      circle: "วงกลม",
      text: "ข้อความ",
      crop: "ครอปภาพ",
      blurRect: "เบลอสี่เหลี่ยม",
      blurCircle: "เบลอวงกลม",
      mosaicRect: "โมเสกสี่เหลี่ยม",
      mosaicCircle: "โมเสกวงกลม"
    };
    const el = $("ieToolLabel");
    if (el) el.textContent = map[editorState.activeTool] || editorState.activeTool;
  }

  function setActiveButtonByTool(tool) {
    document.querySelectorAll(".ie-tool").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tool") === tool);
    });
  }

  function setObjectEditableState(obj, editable) {
    if (!obj || obj === editorState.baseImage) return;
    obj.selectable = !!editable;
    obj.evented = true;
    obj.hasControls = true;
    obj.hasBorders = true;
    obj.lockRotation = false;
  }

  function setCanvasInteractivityForTool(tool) {
    const canvas = editorState.canvas;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = (tool === "select");
    canvas.defaultCursor = tool === "pan" ? "grab" : "default";

    canvas.forEachObject((obj) => {
      if (obj === editorState.baseImage) return;

      if (obj === editorState.cropRect) {
        obj.selectable = tool === "crop";
        obj.evented = tool === "crop";
        obj.hasControls = true;
        obj.hasBorders = true;
        obj.lockRotation = true;
        return;
      }

      setObjectEditableState(obj, tool === "select");
    });

    if (tool !== "crop") {
      removeCropRect();
    } else {
      ensureCropRect();
    }

    canvas.requestRenderAll();
  }

  function setActiveTool(tool) {
    editorState.activeTool = tool || "select";
    setActiveButtonByTool(editorState.activeTool);
    setToolLabel();
    setCanvasInteractivityForTool(editorState.activeTool);
  }

  function resetViewport() {
    const canvas = editorState.canvas;
    if (!canvas) return;
    editorState.zoom = 1;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.requestRenderAll();
    setZoomLabel();
  }

  function setZoom(nextZoom) {
    const canvas = editorState.canvas;
    if (!canvas) return;

    editorState.zoom = Math.max(0.2, Math.min(5, Number(nextZoom) || 1));

    const center = typeof canvas.getCenter === "function"
      ? canvas.getCenter()
      : { left: canvas.getWidth() / 2, top: canvas.getHeight() / 2 };

    canvas.zoomToPoint(new fabric.Point(center.left, center.top), editorState.zoom);
    canvas.requestRenderAll();
    setZoomLabel();
  }

  function rotateBaseImage(delta) {
    const canvas = editorState.canvas;
    if (!canvas || !editorState.baseImage) return;
    editorState.baseImage.rotate((editorState.baseImage.angle || 0) + delta);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function applyBrightness(value) {
    const canvas = editorState.canvas;
    const baseImage = editorState.baseImage;
    if (!canvas || !baseImage || !fabric.filters || !fabric.filters.Brightness) return;

    editorState.brightness = Number(value || 0);
    baseImage.filters = [new fabric.filters.Brightness({ brightness: editorState.brightness })];
    baseImage.applyFilters();
    canvas.requestRenderAll();
  }

  function commitBrightnessToHistory() {
    pushHistorySnapshot();
  }

  function addTextbox() {
    const canvas = editorState.canvas;
    if (!canvas) return;

    const text = new fabric.IText("ข้อความ", {
      left: 80,
      top: 80,
      fill: editorState.strokeColor,
      fontSize: 28,
      fontFamily: "Kanit, Arial, sans-serif",
      editable: true,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    pushHistorySnapshot();
    setActiveTool("select");
  }

  function deleteSelectedObject() {
    const canvas = editorState.canvas;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active === editorState.baseImage || active === editorState.cropRect) return;

    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function createArrowGroup(x1, y1, x2, y2) {
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: editorState.strokeColor,
      strokeWidth: editorState.strokeWidth,
      selectable: true,
      evented: true,
      objectCaching: false
    });

    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    const head = new fabric.Triangle({
      left: x2,
      top: y2,
      originX: "center",
      originY: "center",
      width: 18 + editorState.strokeWidth,
      height: 24 + editorState.strokeWidth,
      fill: editorState.strokeColor,
      angle: angle + 90,
      selectable: true,
      evented: true,
      objectCaching: false
    });

    return new fabric.Group([line, head], {
      selectable: true,
      evented: true,
      objectCaching: false,
      hasControls: true,
      hasBorders: true,
      lockRotation: false
    });
  }

  function ensureCropRect() {
    const canvas = editorState.canvas;
    if (!canvas || editorState.cropRect) return;

    const w = Math.max(80, Math.round(canvas.getWidth() * 0.7));
    const h = Math.max(80, Math.round(canvas.getHeight() * 0.7));

    editorState.cropRect = new fabric.Rect({
      left: Math.round((canvas.getWidth() - w) / 2),
      top: Math.round((canvas.getHeight() - h) / 2),
      width: w,
      height: h,
      fill: "rgba(37,99,235,0.10)",
      stroke: "#2563eb",
      strokeWidth: 2,
      strokeDashArray: [8, 6],
      cornerColor: "#2563eb",
      cornerStyle: "circle",
      transparentCorners: false,
      selectable: true,
      evented: true,
      hasRotatingPoint: false,
      lockRotation: true,
      objectCaching: false
    });

    editorState.cropRect.scaleX = 1;
    editorState.cropRect.scaleY = 1;

    canvas.add(editorState.cropRect);
    canvas.setActiveObject(editorState.cropRect);
    canvas.requestRenderAll();
  }

  function removeCropRect() {
    const canvas = editorState.canvas;
    if (!canvas || !editorState.cropRect) return;
    try { canvas.remove(editorState.cropRect); } catch (_) {}
    editorState.cropRect = null;
    canvas.requestRenderAll();
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function dataURLToBlob(dataUrl) {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  async function blobToFile(blob, filename, mimeType) {
    const type = mimeType || blob.type || "image/png";
    return new File([blob], filename, { type });
  }

  function genEditedFilename(originalName) {
    const name = String(originalName || "edited-image.png");
    const dot = name.lastIndexOf(".");
    if (dot <= 0) return `${name}-edited.png`;
    return `${name.slice(0, dot)}-edited${name.slice(dot)}`;
  }

  function serializeCanvasForHistory() {
    const canvas = editorState.canvas;
    if (!canvas) return null;

    const json = canvas.toJSON(["dataRole", "effectType", "effectShape", "effectMeta"]);
    return {
      json,
      zoom: editorState.zoom,
      brightness: editorState.brightness,
      activeTool: editorState.activeTool
    };
  }

  function updateUndoRedoState() {
    const undoBtn = $("ieUndoBtn");
    const redoBtn = $("ieRedoBtn");
    if (undoBtn) undoBtn.disabled = editorState.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = editorState.historyIndex >= editorState.history.length - 1;
  }

  function pushHistorySnapshot(replaceCurrent = false) {
    if (editorState.restoringHistory) return;
    const snapshot = serializeCanvasForHistory();
    if (!snapshot) return;

    if (replaceCurrent && editorState.historyIndex >= 0) {
      editorState.history[editorState.historyIndex] = snapshot;
      updateUndoRedoState();
      return;
    }

    if (editorState.historyIndex < editorState.history.length - 1) {
      editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    }

    editorState.history.push(snapshot);

    if (editorState.history.length > 30) {
      editorState.history.shift();
    }

    editorState.historyIndex = editorState.history.length - 1;
    updateUndoRedoState();
  }

  async function restoreHistorySnapshot(snapshot) {
    const canvas = editorState.canvas;
    if (!canvas || !snapshot?.json) return;

    editorState.restoringHistory = true;

    try {
      canvas.clear();
      await new Promise((resolve) => {
        canvas.loadFromJSON(snapshot.json, () => {
          canvas.renderAll();
          resolve();
        });
      });

      editorState.baseImage = null;
      editorState.cropRect = null;

      canvas.getObjects().forEach((obj) => {
        if (obj?.dataRole === "base-image") editorState.baseImage = obj;
        if (obj?.dataRole === "crop-rect") editorState.cropRect = obj;
      });

      editorState.zoom = Number(snapshot.zoom || 1);
      editorState.brightness = Number(snapshot.brightness || 0);

      if ($("ieBrightness")) $("ieBrightness").value = String(editorState.brightness);

      const center = typeof canvas.getCenter === "function"
        ? canvas.getCenter()
        : { left: canvas.getWidth() / 2, top: canvas.getHeight() / 2 };

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), editorState.zoom);
      setZoomLabel();
      setActiveTool(snapshot.activeTool || "select");
      canvas.requestRenderAll();
    } finally {
      editorState.restoringHistory = false;
      updateUndoRedoState();
    }
  }

  function undoHistory() {
    if (editorState.historyIndex <= 0) return;
    editorState.historyIndex -= 1;
    restoreHistorySnapshot(editorState.history[editorState.historyIndex]);
  }

  function redoHistory() {
    if (editorState.historyIndex >= editorState.history.length - 1) return;
    editorState.historyIndex += 1;
    restoreHistorySnapshot(editorState.history[editorState.historyIndex]);
  }

  function getCanvasPointer(e) {
    const canvas = editorState.canvas;
    if (!canvas) return { x: 0, y: 0 };
    return canvas.getPointer(e);
  }

  function makeRectFromPoints(x1, y1, x2, y2) {
    return {
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };
  }

  function addRectShape(rect) {
    const canvas = editorState.canvas;
    if (!canvas || !rect) return;

    const shape = new fabric.Rect({
      ...rect,
      fill: "rgba(0,0,0,0)",
      stroke: editorState.strokeColor,
      strokeWidth: editorState.strokeWidth,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      objectCaching: false
    });

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function addCircleShape(rect) {
    const canvas = editorState.canvas;
    if (!canvas || !rect) return;

    const shape = new fabric.Ellipse({
      left: rect.left,
      top: rect.top,
      rx: Math.max(1, rect.width / 2),
      ry: Math.max(1, rect.height / 2),
      fill: "rgba(0,0,0,0)",
      stroke: editorState.strokeColor,
      strokeWidth: editorState.strokeWidth,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      objectCaching: false
    });

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function addLineShape(x1, y1, x2, y2) {
    const canvas = editorState.canvas;
    if (!canvas) return;

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: editorState.strokeColor,
      strokeWidth: editorState.strokeWidth,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      objectCaching: false
    });

    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function addArrowShape(x1, y1, x2, y2) {
    const canvas = editorState.canvas;
    if (!canvas) return;
    const group = createArrowGroup(x1, y1, x2, y2);
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function getBaseImageElementFromCanvas() {
    const base = editorState.baseImage;
    if (!base) return null;

    if (typeof base.getElement === "function") {
      return base.getElement();
    }

    return base._element || null;
  }

  function createEffectOverlay(effectType, effectShape, rect) {
    const canvas = editorState.canvas;
    if (!canvas || !rect || rect.width < 2 || rect.height < 2) return null;

    const imgEl = getBaseImageElementFromCanvas();
    if (!imgEl) return null;

    const left = Math.round(rect.left);
    const top = Math.round(rect.top);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");

    try {
      ctx.drawImage(imgEl, left, top, width, height, 0, 0, width, height);
    } catch (_) {
      return null;
    }

    if (effectType === "blur") {
      const tmp = document.createElement("canvas");
      const tctx = tmp.getContext("2d");
      const smallW = Math.max(4, Math.round(width / 12));
      const smallH = Math.max(4, Math.round(height / 12));
      tmp.width = smallW;
      tmp.height = smallH;
      tctx.imageSmoothingEnabled = true;
      tctx.drawImage(off, 0, 0, smallW, smallH);
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, width, height);
    } else if (effectType === "mosaic") {
      const block = 10;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let y = 0; y < height; y += block) {
        for (let x = 0; x < width; x += block) {
          const px = ((y * width) + x) * 4;
          const r = data[px];
          const g = data[px + 1];
          const b = data[px + 2];
          const a = data[px + 3] / 255;
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(x, y, block, block);
        }
      }
    }

    const dataUrl = off.toDataURL("image/png");
    const overlay = new fabric.Image.fromURL ? null : null;
    return new Promise((resolve) => {
      fabric.Image.fromURL(dataUrl, (img) => {
        img.set({
          left,
          top,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: false,
          objectCaching: false,
          dataRole: "effect-overlay",
          effectType,
          effectShape,
          effectMeta: { left, top, width, height }
        });

        if (effectShape === "circle") {
          img.clipPath = new fabric.Ellipse({
            rx: width / 2,
            ry: height / 2,
            left: width / 2,
            top: height / 2,
            originX: "center",
            originY: "center"
          });
        }

        resolve(img);
      }, { crossOrigin: "anonymous" });
    });
  }

  async function addEffectShape(effectType, effectShape, rect) {
    const canvas = editorState.canvas;
    if (!canvas) return;
    const overlay = await createEffectOverlay(effectType, effectShape, rect);
    if (!overlay) return;
    canvas.add(overlay);
    canvas.setActiveObject(overlay);
    canvas.requestRenderAll();
    pushHistorySnapshot();
  }

  function normalizeRectObject(rect) {
    if (!rect) return null;
    const scaleX = Number(rect.scaleX || 1);
    const scaleY = Number(rect.scaleY || 1);
    return {
      left: Number(rect.left || 0),
      top: Number(rect.top || 0),
      width: Number(rect.width || 0) * scaleX,
      height: Number(rect.height || 0) * scaleY
    };
  }

  async function applyCrop() {
    if (editorState.isApplyingCrop) return;

    const canvas = editorState.canvas;
    const base = editorState.baseImage;
    const cropRect = editorState.cropRect;
    if (!canvas || !base || !cropRect) return;

    const rect = normalizeRectObject(cropRect);
    if (!rect || rect.width < 10 || rect.height < 10) {
      await showMessage("warning", "ยังครอปไม่ได้", "กรุณาปรับกรอบครอปให้มีขนาดใหญ่ขึ้น");
      return;
    }

    editorState.isApplyingCrop = true;

    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.round(rect.width);
      exportCanvas.height = Math.round(rect.height);
      const ctx = exportCanvas.getContext("2d");

      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 1,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });

      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = dataUrl;
      });

      const blob = dataURLToBlob(exportCanvas.toDataURL("image/png"));
      const file = await blobToFile(blob, genEditedFilename(editorState.originalFile?.name), "image/png");

      destroyCanvas();
      revokeOriginalUrl();
      await loadImageToCanvas(file);
      editorState.originalFile = file;

      if ($("ieBrightness")) $("ieBrightness").value = "0";
      editorState.brightness = 0;

      setActiveTool("select");
      pushHistorySnapshot(true);
    } catch (err) {
      console.error(err);
      await showMessage("error", "ครอปภาพไม่สำเร็จ", err?.message || String(err));
    } finally {
      editorState.isApplyingCrop = false;
    }
  }

  async function exportEditedFile() {
    const canvas = editorState.canvas;
    if (!canvas) throw new Error("ยังไม่พบ canvas");

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1
    });

    const blob = dataURLToBlob(dataUrl);
    const filename = genEditedFilename(editorState.originalFile?.name || "edited-image.png");
    const file = await blobToFile(blob, filename, "image/png");

    return {
      ok: true,
      file,
      filename,
      dataUrl
    };
  }

  async function loadImageToCanvas(file) {
    ensureModal();

    const wrap = document.querySelector(".imgEditorCanvasWrap");
    const wrapWidth = Math.max(320, Math.round(wrap?.clientWidth || 920));
    const wrapHeight = Math.max(320, Math.round(wrap?.clientHeight || 560));

    editorState.originalUrl = URL.createObjectURL(file);

    const img = await new Promise((resolve, reject) => {
      fabric.Image.fromURL(editorState.originalUrl, (image) => {
        if (!image) {
          reject(new Error("โหลดภาพไม่สำเร็จ"));
          return;
        }
        resolve(image);
      }, { crossOrigin: "anonymous" });
    });

    const canvas = new fabric.Canvas(editorState.canvasEl, {
      width: wrapWidth,
      height: wrapHeight,
      preserveObjectStacking: true,
      selection: true
    });

    editorState.canvas = canvas;
    editorState.baseImage = img;

    img.set({
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      dataRole: "base-image"
    });

    const scale = Math.min(
      canvas.getWidth() / img.width,
      canvas.getHeight() / img.height
    );

    img.scale(scale);
    img.set({
      left: Math.round((canvas.getWidth() - img.getScaledWidth()) / 2),
      top: Math.round((canvas.getHeight() - img.getScaledHeight()) / 2)
    });

    canvas.add(img);
    canvas.sendToBack(img);
    canvas.requestRenderAll();

    bindCanvasPointerEvents();
  }

  function bindCanvasPointerEvents() {
    const canvas = editorState.canvas;
    if (!canvas) return;

    let downPoint = null;
    let tempShape = null;

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    canvas.off("selection:created");
    canvas.off("selection:updated");
    canvas.off("selection:cleared");

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      const pointer = getCanvasPointer(evt);

      if (editorState.activeTool === "pan") {
        editorState.isPanning = true;
        canvas.defaultCursor = "grabbing";
        downPoint = { x: evt.clientX, y: evt.clientY };
        return;
      }

      if (editorState.activeTool === "select" || editorState.activeTool === "crop" || editorState.activeTool === "text") {
        return;
      }

      downPoint = pointer;

      if (editorState.activeTool === "rect") {
        tempShape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          fill: "rgba(0,0,0,0)",
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        canvas.add(tempShape);
      } else if (editorState.activeTool === "circle") {
        tempShape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 1,
          ry: 1,
          fill: "rgba(0,0,0,0)",
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        canvas.add(tempShape);
      } else if (editorState.activeTool === "line") {
        tempShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        canvas.add(tempShape);
      } else if (editorState.activeTool === "arrow") {
        tempShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        canvas.add(tempShape);
      }
    });

    canvas.on("mouse:move", (opt) => {
      const evt = opt.e;
      const pointer = getCanvasPointer(evt);

      if (editorState.activeTool === "pan" && editorState.isPanning && downPoint) {
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - downPoint.x;
        vpt[5] += evt.clientY - downPoint.y;
        canvas.requestRenderAll();
        downPoint = { x: evt.clientX, y: evt.clientY };
        return;
      }

      if (!downPoint || !tempShape) return;

      const rect = makeRectFromPoints(downPoint.x, downPoint.y, pointer.x, pointer.y);

      if (editorState.activeTool === "rect") {
        tempShape.set({
          left: rect.left,
          top: rect.top,
          width: Math.max(1, rect.width),
          height: Math.max(1, rect.height)
        });
      } else if (editorState.activeTool === "circle") {
        tempShape.set({
          left: rect.left,
          top: rect.top,
          rx: Math.max(1, rect.width / 2),
          ry: Math.max(1, rect.height / 2)
        });
      } else if (editorState.activeTool === "line" || editorState.activeTool === "arrow") {
        tempShape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.requestRenderAll();
    });

    canvas.on("mouse:up", async (opt) => {
      const evt = opt.e;
      const pointer = getCanvasPointer(evt);

      if (editorState.activeTool === "pan") {
        editorState.isPanning = false;
        canvas.defaultCursor = "grab";
        downPoint = null;
        return;
      }

      if (editorState.activeTool === "text") {
        addTextbox();
        downPoint = null;
        tempShape = null;
        return;
      }

      if (!downPoint) return;

      const rect = makeRectFromPoints(downPoint.x, downPoint.y, pointer.x, pointer.y);

      if (tempShape) {
        canvas.remove(tempShape);
        tempShape = null;
      }

      if (editorState.activeTool === "rect" && rect.width > 3 && rect.height > 3) {
        addRectShape(rect);
      } else if (editorState.activeTool === "circle" && rect.width > 3 && rect.height > 3) {
        addCircleShape(rect);
      } else if (editorState.activeTool === "line") {
        addLineShape(downPoint.x, downPoint.y, pointer.x, pointer.y);
      } else if (editorState.activeTool === "arrow") {
        addArrowShape(downPoint.x, downPoint.y, pointer.x, pointer.y);
      } else if (editorState.activeTool === "blurRect" && rect.width > 3 && rect.height > 3) {
        await addEffectShape("blur", "rect", rect);
      } else if (editorState.activeTool === "blurCircle" && rect.width > 3 && rect.height > 3) {
        await addEffectShape("blur", "circle", rect);
      } else if (editorState.activeTool === "mosaicRect" && rect.width > 3 && rect.height > 3) {
        await addEffectShape("mosaic", "rect", rect);
      } else if (editorState.activeTool === "mosaicCircle" && rect.width > 3 && rect.height > 3) {
        await addEffectShape("mosaic", "circle", rect);
      }

      downPoint = null;
      tempShape = null;
    });

    canvas.on("selection:created", () => {
      canvas.requestRenderAll();
    });

    canvas.on("selection:updated", () => {
      canvas.requestRenderAll();
    });

    canvas.on("selection:cleared", () => {
      canvas.requestRenderAll();
    });
  }

  function appendNodes(parent, nodes) {
    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
      if (node) parent.appendChild(node);
    });
  }

  function createToolbarSection(title, sectionClass = "") {
    const section = document.createElement("section");
    section.className = `ieToolbarSection ${sectionClass}`.trim();

    const head = document.createElement("div");
    head.className = "ieToolbarSectionTitle";
    head.textContent = title;

    const grid = document.createElement("div");
    grid.className = "ieToolbarSectionGrid";

    section.appendChild(head);
    section.appendChild(grid);

    return { section, grid };
  }

  function getFieldByInputId(inputId) {
    const input = $(inputId);
    if (!input) return null;
    return input.closest(".ieToolbarField") || input.parentElement || null;
  }

  function createButton(id, text, className = "btn ghost") {
    let btn = $(id);
    if (btn) return btn;

    btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className = className;
    btn.textContent = text || "";
    return btn;
  }

  function ensureBtn(parent, id, label, className = "btn ghost") {
    let btn = $(id);
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = id;
      btn.className = className;
      btn.textContent = label || "";
      parent.appendChild(btn);
    }
    return btn;
  }

  function ensureToolBtn(parent, id, label, toolName) {
    let btn = $(id);
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = id;
      btn.className = "btn ghost ie-tool";
      btn.setAttribute("data-tool", toolName);
      btn.textContent = label || "";
      parent.appendChild(btn);
    } else {
      btn.classList.add("ie-tool");
      btn.setAttribute("data-tool", toolName);
      if (!btn.textContent.trim()) btn.textContent = label || "";
    }
    return btn;
  }

  function ensureToolbarField(id, labelText, inputHtml) {
    let field = getFieldByInputId(id);
    if (field) return field;

    field = document.createElement("label");
    field.className = "ieToolbarField";
    field.innerHTML = `
      <span>${labelText}</span>
      ${inputHtml}
    `;
    return field;
  }

  function ensureToolbarBaseStructure() {
    const body = document.querySelector(".imgEditorBody");
    if (!body) return null;

    let wrap = body.querySelector(".imgEditorToolbarWrap");
    if (!wrap) {
      wrap = document.createElement("aside");
      wrap.className = "imgEditorToolbarWrap";
      body.insertBefore(wrap, body.firstChild);
    }

    let toolbar = wrap.querySelector(".imgEditorToolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "imgEditorToolbar";
      wrap.appendChild(toolbar);
    }

    return { wrap, toolbar };
  }

  function ensureTopToolbarButtons(toolbar) {
    const selectBtn = ensureToolBtn(toolbar, "ieSelectBtn", "เลือก", "select");
    const panBtn = ensureToolBtn(toolbar, "iePanBtn", "เลื่อน", "pan");
    const textBtn = ensureToolBtn(toolbar, "ieTextBtn", "ข้อความ", "text");
    const cropBtn = ensureToolBtn(toolbar, "ieCropToolBtn", "ครอป", "crop");

    const lineBtn = ensureToolBtn(toolbar, "ieLineBtn", "เส้น", "line");
    const arrowBtn = ensureToolBtn(toolbar, "ieArrowBtn", "ลูกศร", "arrow");
    const rectBtn = ensureToolBtn(toolbar, "ieRectBtn", "สี่เหลี่ยม", "rect");
    const circleBtn = ensureToolBtn(toolbar, "ieCircleBtn", "วงกลม", "circle");

    const blurRectBtn = ensureToolBtn(toolbar, "ieBlurRectBtn", "เบลอสี่", "blurRect");
    const blurCircleBtn = ensureToolBtn(toolbar, "ieBlurCircleBtn", "เบลอวง", "blurCircle");
    const mosaicRectBtn = ensureToolBtn(toolbar, "ieMosaicRectBtn", "โมเสกสี่", "mosaicRect");
    const mosaicCircleBtn = ensureToolBtn(toolbar, "ieMosaicCircleBtn", "โมเสกวง", "mosaicCircle");

    const zoomOutBtn = ensureBtn(toolbar, "ieZoomOutBtn", "ย่อ");
    const zoomResetBtn = ensureBtn(toolbar, "ieZoomResetBtn", "100%");
    const zoomInBtn = ensureBtn(toolbar, "ieZoomInBtn", "ขยาย");
    const fitBtn = ensureBtn(toolbar, "ieFitBtn", "พอดี");

    const undoBtn = ensureBtn(toolbar, "ieUndoBtn", "ย้อน");
    const redoBtn = ensureBtn(toolbar, "ieRedoBtn", "ทำซ้ำ");
    const deleteBtn = ensureBtn(toolbar, "ieDeleteBtn", "ลบ");
    const applyCropBtn = ensureBtn(toolbar, "ieApplyCropBtn", "ใช้");

    const rotateLeftBtn = ensureBtn(toolbar, "ieRotateLeftBtn", "หมุนซ้าย");
    const rotateRightBtn = ensureBtn(toolbar, "ieRotateRightBtn", "หมุนขวา");

    return {
      selectBtn, panBtn, textBtn, cropBtn,
      lineBtn, arrowBtn, rectBtn, circleBtn,
      blurRectBtn, blurCircleBtn, mosaicRectBtn, mosaicCircleBtn,
      zoomOutBtn, zoomResetBtn, zoomInBtn, fitBtn,
      undoBtn, redoBtn, deleteBtn, applyCropBtn,
      rotateLeftBtn, rotateRightBtn
    };
  }

  function ensureSettingsFields(toolbar) {
    const colorField = ensureToolbarField(
      "ieColorPicker",
      "สี",
      `<input id="ieColorPicker" type="color" value="#dc2626">`
    );

    const strokeField = ensureToolbarField(
      "ieStrokeWidth",
      "ความหนา",
      `<input id="ieStrokeWidth" type="range" min="1" max="12" step="1" value="3">`
    );

    const brightnessField = ensureToolbarField(
      "ieBrightness",
      "ความสว่าง",
      `<input id="ieBrightness" type="range" min="-1" max="1" step="0.05" value="0">`
    );

    [colorField, strokeField, brightnessField].forEach((field) => {
      if (field && !toolbar.contains(field)) toolbar.appendChild(field);
    });
  }

  function ensureToolbarResponsiveLabels() {
    const isNarrow = window.matchMedia("(max-width: 560px)").matches;
    const isVeryNarrow = window.matchMedia("(max-width: 390px)").matches;

    const labelMap = {
      ieSelectBtn: isVeryNarrow ? "" : "เลือก",
      iePanBtn: isVeryNarrow ? "" : "เลื่อน",
      ieTextBtn: isVeryNarrow ? "" : "ข้อความ",
      ieCropToolBtn: isVeryNarrow ? "" : "ครอป",

      ieLineBtn: isVeryNarrow ? "" : "เส้น",
      ieArrowBtn: isVeryNarrow ? "" : "ลูกศร",
      ieRectBtn: isVeryNarrow ? "" : "สี่เหลี่ยม",
      ieCircleBtn: isVeryNarrow ? "" : "วงกลม",

      ieBlurRectBtn: isVeryNarrow ? "" : "เบลอสี่",
      ieBlurCircleBtn: isVeryNarrow ? "" : "เบลอวง",
      ieMosaicRectBtn: isVeryNarrow ? "" : "โมเสกสี่",
      ieMosaicCircleBtn: isVeryNarrow ? "" : "โมเสกวง",

      ieZoomOutBtn: isNarrow ? "" : "ย่อ",
      ieZoomResetBtn: isNarrow ? "100%" : "100%",
      ieZoomInBtn: isNarrow ? "" : "ขยาย",
      ieFitBtn: isNarrow ? "" : "พอดี",

      ieUndoBtn: isNarrow ? "" : "ย้อน",
      ieRedoBtn: isNarrow ? "" : "ทำซ้ำ",
      ieDeleteBtn: isNarrow ? "" : "ลบ",
      ieApplyCropBtn: isNarrow ? "" : "ใช้",

      ieRotateLeftBtn: isNarrow ? "" : "หมุนซ้าย",
      ieRotateRightBtn: isNarrow ? "" : "หมุนขวา"
    };

    Object.entries(labelMap).forEach(([id, label]) => {
      const btn = $(id);
      if (!btn) return;

      const icon = TOOL_ICONS[id] || "";
      if (icon && label) {
        btn.innerHTML = `<span class="ieBtnIcon">${icon}</span><span class="ieBtnText">${label}</span>`;
      } else if (icon && !label) {
        btn.innerHTML = `<span class="ieBtnIcon">${icon}</span>`;
      } else {
        btn.textContent = label;
      }
    });
  }

  function ensureFloatingToolUi() {
    const toolbarWrap = document.querySelector(".imgEditorToolbarWrap");
    const toolbar = toolbarWrap?.querySelector(".imgEditorToolbar");
    const dialog = document.querySelector(".imgEditorDialog");
    if (!toolbarWrap || !toolbar || !dialog) return;

    let fab = dialog.querySelector(".ieFloatingToggleBtn");
    let panel = dialog.querySelector(".ieFloatingPanel");

    if (!fab) {
      fab = document.createElement("button");
      fab.type = "button";
      fab.className = "ieFloatingToggleBtn";
      fab.setAttribute("aria-label", "เปิดเครื่องมือแก้ไขภาพ");
      fab.innerHTML = `<span class="ieFabIcon">✎</span>`;
      dialog.appendChild(fab);
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "ieFloatingPanel hidden";
      panel.setAttribute("aria-hidden", "true");
      dialog.appendChild(panel);
    }

    editorState.floatingToggleBtn = fab;
    editorState.floatingToolPanel = panel;

    if (!panel.contains(toolbarWrap)) {
      panel.appendChild(toolbarWrap);
    }

    if (!fab.dataset.boundClick) {
      fab.dataset.boundClick = "1";
      fab.addEventListener("click", () => {
        setFloatingPanelOpen(!panel.classList.contains("hidden"));
      });
    }
  }

  function setFloatingPanelOpen(shouldOpen) {
    const panel = editorState.floatingToolPanel;
    if (!panel) return;
    const open = !!shouldOpen;

    panel.classList.toggle("hidden", !open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("ie-panel-open", open);
  }

  function collapseFloatingPanelAfterToolPick() {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    setFloatingPanelOpen(false);
  }

  function rebuildToolbarLayoutInWrap(toolbarWrap) {
    const toolbar = toolbarWrap?.querySelector(".imgEditorToolbar");
    if (!toolbar) return;

    const selectBtn = $("ieSelectBtn");
    const panBtn = $("iePanBtn");
    const textBtn = $("ieTextBtn");
    const cropBtn = $("ieCropToolBtn");

    const lineBtn = $("ieLineBtn");
    const arrowBtn = $("ieArrowBtn");
    const rectBtn = $("ieRectBtn");
    const circleBtn = $("ieCircleBtn");

    const blurRectBtn = $("ieBlurRectBtn");
    const blurCircleBtn = $("ieBlurCircleBtn");
    const mosaicRectBtn = $("ieMosaicRectBtn");
    const mosaicCircleBtn = $("ieMosaicCircleBtn");

    const zoomOutBtn = $("ieZoomOutBtn");
    const zoomResetBtn = $("ieZoomResetBtn");
    const zoomInBtn = $("ieZoomInBtn");
    const fitBtn = $("ieFitBtn");

    const rotateLeftBtn = $("ieRotateLeftBtn");
    const rotateRightBtn = $("ieRotateRightBtn");

    const undoBtn = $("ieUndoBtn");
    const redoBtn = $("ieRedoBtn");
    const deleteBtn = $("ieDeleteBtn");
    const applyCropBtn = $("ieApplyCropBtn");

    const colorField = getFieldByInputId("ieColorPicker");
    const strokeField = getFieldByInputId("ieStrokeWidth");
    const brightnessField = getFieldByInputId("ieBrightness");

    if (selectBtn) selectBtn.id = "ieSelectBtn";
    if (panBtn) panBtn.id = "iePanBtn";
    if (textBtn) textBtn.id = "ieTextBtn";
    if (lineBtn) lineBtn.id = "ieLineBtn";
    if (arrowBtn) arrowBtn.id = "ieArrowBtn";
    if (rectBtn) rectBtn.id = "ieRectBtn";
    if (circleBtn) circleBtn.id = "ieCircleBtn";

    toolbar.innerHTML = "";

    const gridRoot = document.createElement("div");
    gridRoot.className = "imgEditorToolbarGrid ieToolbarGridEnhanced";

    const secPrimary = createToolbarSection("หลัก", "ieSectionPrimary");
    secPrimary.grid.classList.add("ieButtonGridTools");
    appendNodes(secPrimary.grid, [selectBtn, panBtn, textBtn, cropBtn]);

    const secDraw = createToolbarSection("วาด", "ieSectionDraw");
    secDraw.grid.classList.add("ieButtonGridTools");
    appendNodes(secDraw.grid, [lineBtn, arrowBtn, rectBtn, circleBtn]);

    const secMask = createToolbarSection("เบลอ/โมเสก", "ieSectionMask");
    secMask.grid.classList.add("ieButtonGridEffects");
    appendNodes(secMask.grid, [blurRectBtn, blurCircleBtn, mosaicRectBtn, mosaicCircleBtn]);

    const secView = createToolbarSection("มุมมอง", "ieSectionView");
    secView.grid.classList.add("ieButtonGridView");
    appendNodes(secView.grid, [zoomOutBtn, zoomResetBtn, zoomInBtn, fitBtn]);

    const secManage = createToolbarSection("จัดการ", "ieSectionManage");
    secManage.grid.classList.add("ieButtonGridView");
    appendNodes(secManage.grid, [undoBtn, redoBtn, deleteBtn, applyCropBtn, rotateLeftBtn, rotateRightBtn]);

    const secControl = createToolbarSection("ตั้งค่า", "ieSectionControl");
    secControl.grid.classList.add("ieControlGrid");
    appendNodes(secControl.grid, [colorField, strokeField, brightnessField]);

    [
      secPrimary.section,
      secDraw.section,
      secMask.section,
      secView.section,
      secManage.section,
      secControl.section
    ].forEach((section) => gridRoot.appendChild(section));

    toolbar.appendChild(gridRoot);
  }

  function ensureFooterControls() {
    const footerActions = document.querySelector(".imgEditorActions");
    if (!footerActions) return;
    ensureBtn(footerActions, "ieFitBtn", "พอดี");
  }

  function ensureCoreEditorButtons() {
    const toolbarWrap = document.querySelector(".imgEditorToolbarWrap");
    if (!toolbarWrap) return;

    let toolbar = toolbarWrap.querySelector(".imgEditorToolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "imgEditorToolbar";
      toolbarWrap.appendChild(toolbar);
    }

    ensureBtn(toolbar, "ieUndoBtn", "ย้อน");
    ensureBtn(toolbar, "ieRedoBtn", "ทำซ้ำ");
    ensureBtn(toolbar, "ieDeleteBtn", "ลบ");

    ensureToolBtn(toolbar, "ieCropToolBtn", "ครอป", "crop");
    ensureBtn(toolbar, "ieApplyCropBtn", "ใช้");

    ensureToolBtn(toolbar, "ieBlurRectBtn", "เบลอสี่", "blurRect");
    ensureToolBtn(toolbar, "ieBlurCircleBtn", "เบลอวง", "blurCircle");
    ensureToolBtn(toolbar, "ieMosaicRectBtn", "โมเสกสี่", "mosaicRect");
    ensureToolBtn(toolbar, "ieMosaicCircleBtn", "โมเสกวง", "mosaicCircle");
  }

  function ensureExtraControls() {
    const toolbarWrap = document.querySelector(".imgEditorToolbarWrap");
    if (!toolbarWrap) return;

    ensureCoreEditorButtons();
    ensureFooterControls();
    rebuildToolbarLayoutInWrap(toolbarWrap);
    ensureToolbarResponsiveLabels();
    ensureFloatingToolUi();
  }

  function bindResponsiveToolbarLabelOnce() {
    if (window.__imgEditorResponsiveLabelBound) return;
    window.__imgEditorResponsiveLabelBound = true;

    const mq1 = window.matchMedia("(max-width: 560px)");
    const mq2 = window.matchMedia("(max-width: 390px)");

    const apply = () => {
      try { ensureToolbarResponsiveLabels(); } catch (_) {}
    };

    [mq1, mq2].forEach((mq) => {
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", apply);
      else if (typeof mq.addListener === "function") mq.addListener(apply);
    });

    window.addEventListener("resize", apply, { passive: true });
  }

  function bindToolButtons() {
    document.querySelectorAll(".ie-tool").forEach((btn) => {
      if (btn.dataset.boundClick === "1") return;
      btn.dataset.boundClick = "1";

      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool") || "select";
        setActiveTool(tool);
        collapseFloatingPanelAfterToolPick();
      });
    });
  }

  function bindUiOnce() {
    if (window.__imgEditorBoundOnce) return;
    window.__imgEditorBoundOnce = true;

    ensureExtraControls();
    bindResponsiveToolbarLabelOnce();

    $("imgEditorCloseBtn")?.addEventListener("click", () => closeEditor({ ok: false }));
    $("ieCancelBtn")?.addEventListener("click", () => closeEditor({ ok: false }));

    $("ieSaveBtn")?.addEventListener("click", async () => {
      try {
        const result = await exportEditedFile();
        closeEditor(result);
      } catch (err) {
        console.error(err);
        showMessage("error", "บันทึกภาพไม่สำเร็จ", err?.message || String(err));
      }
    });

    $("ieZoomInBtn")?.addEventListener("click", () => {
      setZoom(editorState.zoom + 0.1);
      collapseFloatingPanelAfterToolPick();
    });

    $("ieZoomOutBtn")?.addEventListener("click", () => {
      setZoom(editorState.zoom - 0.1);
      collapseFloatingPanelAfterToolPick();
    });

    $("ieZoomResetBtn")?.addEventListener("click", () => {
      resetViewport();
      collapseFloatingPanelAfterToolPick();
    });

    $("ieFitBtn")?.addEventListener("click", () => {
      resetViewport();
      collapseFloatingPanelAfterToolPick();
    });

    $("ieRotateLeftBtn")?.addEventListener("click", () => {
      rotateBaseImage(-90);
      collapseFloatingPanelAfterToolPick();
    });

    $("ieRotateRightBtn")?.addEventListener("click", () => {
      rotateBaseImage(90);
      collapseFloatingPanelAfterToolPick();
    });

    $("ieColorPicker")?.addEventListener("input", (e) => {
      editorState.strokeColor = e.target.value || "#dc2626";
    });

    $("ieStrokeWidth")?.addEventListener("input", (e) => {
      editorState.strokeWidth = Number(e.target.value || 3);
    });

    $("ieBrightness")?.addEventListener("input", (e) => {
      applyBrightness(e.target.value);
    });

    $("ieBrightness")?.addEventListener("change", () => {
      commitBrightnessToHistory();
    });

    $("ieResetBtn")?.addEventListener("click", async () => {
      if (!editorState.originalFile) return;
      try {
        destroyCanvas();
        revokeOriginalUrl();
        await loadImageToCanvas(editorState.originalFile);
        editorState.zoom = 1;
        editorState.brightness = 0;
        if ($("ieBrightness")) $("ieBrightness").value = "0";
        ensureExtraControls();
        bindToolButtons();
        setActiveTool("select");
        pushHistorySnapshot(true);
      } catch (err) {
        console.error(err);
        showMessage("error", "รีเซ็ตภาพไม่สำเร็จ", err?.message || String(err));
      }
    });

    $("ieUndoBtn")?.addEventListener("click", () => {
      undoHistory();
      collapseFloatingPanelAfterToolPick();
    });

    $("ieRedoBtn")?.addEventListener("click", () => {
      redoHistory();
      collapseFloatingPanelAfterToolPick();
    });

    $("ieDeleteBtn")?.addEventListener("click", () => {
      deleteSelectedObject();
      collapseFloatingPanelAfterToolPick();
    });

    $("ieApplyCropBtn")?.addEventListener("click", () => {
      applyCrop();
      collapseFloatingPanelAfterToolPick();
    });

    bindToolButtons();
  }

  async function openImageEditor(file, options = {}) {
    ensureFabricReady();
    ensureModal();
    bindUiOnce();

    if (!file || !/^image\//i.test(file.type || "")) {
      throw new Error("ไฟล์ที่ส่งเข้า editor ต้องเป็นรูปภาพ");
    }

    editorState.originalFile = file;
    editorState.zoom = 1;
    editorState.strokeColor = options.strokeColor || "#dc2626";
    editorState.strokeWidth = Number(options.strokeWidth || 3);
    editorState.brightness = 0;
    editorState.history = [];
    editorState.historyIndex = -1;
    editorState.restoringHistory = false;
    editorState.isRefreshingEffect = false;

    if ($("ieColorPicker")) $("ieColorPicker").value = editorState.strokeColor;
    if ($("ieStrokeWidth")) $("ieStrokeWidth").value = String(editorState.strokeWidth);
    if ($("ieBrightness")) $("ieBrightness").value = "0";

    editorState.modal.classList.remove("hidden");
    editorState.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("img-editor-lock");

    await nextFrame();
    await nextFrame();

    destroyCanvas();
    revokeOriginalUrl();

    try {
      await loadImageToCanvas(file);
    } catch (err) {
      console.error("loadImageToCanvas error:", err);
      closeEditor({ ok: false });
      await showMessage("error", "เปิดภาพไม่สำเร็จ", err?.message || String(err));
      return Promise.resolve({ ok: false });
    }

    if (editorState.canvas) {
      if (typeof editorState.canvas.calcOffset === "function") {
        editorState.canvas.calcOffset();
      }
      editorState.canvas.requestRenderAll();
    }

    ensureExtraControls();
    bindToolButtons();
    setFloatingPanelOpen(false);
    setActiveTool("select");
    setZoomLabel();
    setToolLabel();
    pushHistorySnapshot(true);
    updateUndoRedoState();

    return new Promise((resolve) => {
      editorState.resultResolve = resolve;
    });
  }

  window.ImageEditorX = {
    open: openImageEditor
  };
})();
