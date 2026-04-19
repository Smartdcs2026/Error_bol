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

  function closeEditor(result = { ok: false }) {
  setEditorPreparing(false);
  editorState.modal?.classList.add("hidden");
  editorState.modal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("progress-lock");
  document.body.classList.remove("img-editor-lock");

  destroyCanvas();
  revokeOriginalUrl();

  editorState.originalFile = null;
  editorState.history = [];
  editorState.historyIndex = -1;
  editorState.restoringHistory = false;
  editorState.isApplyingCrop = false;
  editorState.isRefreshingEffect = false;

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

  function buildArrowPathData(x1, y1, x2, y2, strokeWidth) {
    const sw = Math.max(2, Number(strokeWidth) || 2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    const headLen = Math.max(18, sw * 5.5);
    const headHalf = Math.max(8, sw * 2.6);
    const shaftHalf = Math.max(1.2, sw * 0.5);

    const usableHeadLen = Math.min(headLen, Math.max(10, len * 0.45));
    const bx = x2 - ux * usableHeadLen;
    const by = y2 - uy * usableHeadLen;

    const s1x = x1 + px * shaftHalf;
    const s1y = y1 + py * shaftHalf;

    const s2x = bx + px * shaftHalf;
    const s2y = by + py * shaftHalf;

    const h1x = bx + px * headHalf;
    const h1y = by + py * headHalf;

    const h2x = bx - px * headHalf;
    const h2y = by - py * headHalf;

    const s3x = bx - px * shaftHalf;
    const s3y = by - py * shaftHalf;

    const s4x = x1 - px * shaftHalf;
    const s4y = y1 - py * shaftHalf;

    return [
      `M ${s1x} ${s1y}`,
      `L ${s2x} ${s2y}`,
      `L ${h1x} ${h1y}`,
      `L ${x2} ${y2}`,
      `L ${h2x} ${h2y}`,
      `L ${s3x} ${s3y}`,
      `L ${s4x} ${s4y}`,
      "Z"
    ].join(" ");
  }

  function isArrowObject(obj) {
    return !!(obj && obj.toolType === "arrow" && obj.type === "path");
  }

  function createArrowGroup(x1, y1, x2, y2) {
    const pathData = buildArrowPathData(x1, y1, x2, y2, editorState.strokeWidth);

    const arrow = new fabric.Path(pathData, {
      fill: editorState.strokeColor,
      stroke: null,
      selectable: true,
      evented: true,
      objectCaching: false,
      hasControls: true,
      hasBorders: true,
      lockRotation: false
    });

    arrow.set({
      toolType: "arrow"
    });

    arrow.setCoords();
    return arrow;
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

  async function blobToFile(blob, filename, mimeType = "image/jpeg") {
    return new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  }

  function isEffectOverlay(obj) {
    return !!(obj && (obj.effectType === "blur" || obj.effectType === "mosaic"));
  }

  function getEffectShapeType(obj) {
    const tool = String(obj?.toolType || "");
    return /Circle$/i.test(tool) ? "circle" : "rect";
  }

  function getCanvasSnapshotDataUrl(options = {}) {
    const canvas = editorState.canvas;
    if (!canvas) return "";

    const active = canvas.getActiveObject();
    if (active) canvas.discardActiveObject();

    const hidden = [];
    const rememberHidden = (obj) => {
      if (!obj || hidden.some((x) => x.obj === obj)) return;
      hidden.push({ obj, visible: obj.visible });
      obj.visible = false;
    };

    if (editorState.cropRect && canvas.getObjects().includes(editorState.cropRect)) {
      rememberHidden(editorState.cropRect);
    }

    if (options.excludeEffectObjects) {
      canvas.getObjects().forEach((obj) => {
        if (isEffectOverlay(obj)) rememberHidden(obj);
      });
    }

    if (Array.isArray(options.hideObjects)) {
      options.hideObjects.forEach((obj) => {
        if (obj && canvas.getObjects().includes(obj)) rememberHidden(obj);
      });
    }

    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({
      format: options.format || "png",
      quality: options.quality == null ? 1 : options.quality,
      multiplier: options.multiplier || 1,
      enableRetinaScaling: false
    });

    hidden.forEach(({ obj, visible }) => { obj.visible = visible; });
    canvas.requestRenderAll();

    return dataUrl;
  }

  function createOffscreenCanvas(width, height) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(width));
    c.height = Math.max(1, Math.round(height));
    return c;
  }

  function applyMosaicToCanvasRegion(ctx, width, height, blockSize) {
    const size = Math.max(4, Math.round(blockSize || 12));
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;

        for (let yy = y; yy < Math.min(y + size, height); yy++) {
          for (let xx = x; xx < Math.min(x + size, width); xx++) {
            const idx = (yy * width + xx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }

        if (!count) continue;

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);

        for (let yy = y; yy < Math.min(y + size, height); yy++) {
          for (let xx = x; xx < Math.min(x + size, width); xx++) {
            const idx = (yy * width + xx) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function maskCanvasToEllipse(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function normalizeRegionBounds(x, y, w, h) {
    return {
      sx: Math.round(x),
      sy: Math.round(y),
      sw: Math.max(1, Math.round(w)),
      sh: Math.max(1, Math.round(h))
    };
  }

  async function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataUrl;
    });
  }

  async function buildEffectOverlayFromRegion(shapeType, effectType, x, y, w, h, opts = {}) {
    const snapshotUrl = getCanvasSnapshotDataUrl({
      format: "png",
      multiplier: 1,
      excludeEffectObjects: true,
      hideObjects: Array.isArray(opts.hideObjects) ? opts.hideObjects : []
    });

    if (!snapshotUrl) return null;

    const img = await loadImageFromDataUrl(snapshotUrl);

    const sx = clamp(Math.round(x), 0, img.width);
    const sy = clamp(Math.round(y), 0, img.height);
    const sw = clamp(Math.round(w), 1, img.width - sx);
    const sh = clamp(Math.round(h), 1, img.height - sy);

    const off = createOffscreenCanvas(sw, sh);
    const offCtx = off.getContext("2d");

    if (effectType === "blur") {
      offCtx.filter = "blur(10px)";
      offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      offCtx.filter = "none";
    } else {
      offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      applyMosaicToCanvasRegion(offCtx, sw, sh, 12);
    }

    if (shapeType === "circle") {
      maskCanvasToEllipse(offCtx, sw, sh);
    }

    const regionUrl = off.toDataURL("image/png");
    const regionImg = await loadImageFromDataUrl(regionUrl);

    const overlay = new fabric.Image(regionImg, {
      left: sx,
      top: sy,
      originX: "left",
      originY: "top",
      selectable: true,
      evented: true,
      objectCaching: false
    });

    overlay.set({
      effectType,
      toolType: shapeType === "circle"
        ? (effectType === "blur" ? "blurCircle" : "mosaicCircle")
        : (effectType === "blur" ? "blurRect" : "mosaicRect"),
      hasControls: true,
      hasBorders: true,
      lockRotation: true
    });

    overlay.scaleX = 1;
    overlay.scaleY = 1;

    return overlay;
  }

  function getObjectBounds(obj) {
    if (!obj) return null;

    if (obj.type === "rect") {
      return normalizeRegionBounds(
        obj.left,
        obj.top,
        obj.width * obj.scaleX,
        obj.height * obj.scaleY
      );
    }

    if (obj.type === "ellipse") {
      const rx = (obj.rx || 0) * (obj.scaleX || 1);
      const ry = (obj.ry || 0) * (obj.scaleY || 1);
      return normalizeRegionBounds(
        (obj.left || 0) - rx,
        (obj.top || 0) - ry,
        rx * 2,
        ry * 2
      );
    }

    if (isEffectOverlay(obj)) {
      return normalizeRegionBounds(
        obj.left || 0,
        obj.top || 0,
        (obj.width || 1) * (obj.scaleX || 1),
        (obj.height || 1) * (obj.scaleY || 1)
      );
    }

    return null;
  }

  async function regenerateEffectOverlayObject(overlay, pushHistoryAfter = true) {
    const canvas = editorState.canvas;
    if (!canvas || !overlay || !isEffectOverlay(overlay) || editorState.isRefreshingEffect) return;

    const bounds = getObjectBounds(overlay);
    if (!bounds) return;

    const shapeType = getEffectShapeType(overlay);
    const effectType = overlay.effectType || "blur";
    const idx = canvas.getObjects().indexOf(overlay);

    try {
      editorState.isRefreshingEffect = true;

      const replacement = await buildEffectOverlayFromRegion(
        shapeType,
        effectType,
        bounds.sx,
        bounds.sy,
        bounds.sw,
        bounds.sh,
        { hideObjects: [overlay] }
      );

      if (!replacement) return;

      canvas.remove(overlay);
      if (idx >= 0 && typeof canvas.insertAt === "function") {
        canvas.insertAt(replacement, idx, false);
      } else {
        canvas.add(replacement);
      }

      canvas.setActiveObject(replacement);
      canvas.requestRenderAll();

      if (pushHistoryAfter) pushHistorySnapshot();
    } finally {
      editorState.isRefreshingEffect = false;
    }
  }

  async function applyCrop() {
    const canvas = editorState.canvas;
    const crop = editorState.cropRect;
    if (!canvas || !crop || editorState.isApplyingCrop) return;

    try {
      editorState.isApplyingCrop = true;

      const dataUrl = getCanvasSnapshotDataUrl({ format: "png", multiplier: 1 });
      const img = await loadImageFromDataUrl(dataUrl);

      const left = clamp(Math.round(crop.left), 0, img.width - 1);
      const top = clamp(Math.round(crop.top), 0, img.height - 1);
      const width = clamp(Math.round(crop.width * crop.scaleX), 1, img.width - left);
      const height = clamp(Math.round(crop.height * crop.scaleY), 1, img.height - top);

      const off = createOffscreenCanvas(width, height);
      const ctx = off.getContext("2d");
      ctx.drawImage(img, left, top, width, height, 0, 0, width, height);

      const blob = dataURLToBlob(off.toDataURL("image/png"));
      const baseName = (editorState.originalFile?.name || "edited-image").replace(/\.[^.]+$/, "");
      const croppedFile = await blobToFile(blob, `${baseName}_cropped.png`, "image/png");

      editorState.originalFile = croppedFile;

      destroyCanvas();
      revokeOriginalUrl();
      await loadImageToCanvas(croppedFile);

      resetViewport();
      if (editorState.canvas) {
        editorState.canvas.calcOffset();
        editorState.canvas.requestRenderAll();
      }

      setActiveTool("select");
      pushHistorySnapshot(true);
    } catch (err) {
      console.error(err);
      await showMessage("error", "ครอปภาพไม่สำเร็จ", err?.message || String(err));
    } finally {
      editorState.isApplyingCrop = false;
    }
  }

  async function applyAreaEffect(effectType, shapeType) {
    const canvas = editorState.canvas;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || active === editorState.baseImage) {
      await showMessage("info", "ยังไม่ได้เลือกพื้นที่", "กรุณาวาดพื้นที่ก่อน แล้วจึงกดใช้เอฟเฟกต์");
      return;
    }

    const bounds = getObjectBounds(active);
    if (!bounds) {
      await showMessage("warning", "รูปทรงไม่ถูกต้อง", "กรุณาเลือกสี่เหลี่ยมหรือวงกลมสำหรับใช้เอฟเฟกต์นี้");
      return;
    }

    try {
      const overlay = await buildEffectOverlayFromRegion(
        shapeType,
        effectType,
        bounds.sx,
        bounds.sy,
        bounds.sw,
        bounds.sh,
        { hideObjects: [active] }
      );

      if (!overlay) throw new Error("สร้างเอฟเฟกต์ไม่สำเร็จ");

      canvas.remove(active);
      canvas.add(overlay);
      canvas.setActiveObject(overlay);
      canvas.requestRenderAll();
      pushHistorySnapshot();

      setActiveTool("select");
    } catch (err) {
      console.error(err);
      await showMessage("error", "ใช้เอฟเฟกต์ไม่สำเร็จ", err?.message || String(err));
    }
  }

  function collectCanvasState() {
    const canvas = editorState.canvas;
    if (!canvas) return null;

    const cropWasVisible = !!(editorState.cropRect && editorState.cropRect.visible);
    if (editorState.cropRect) {
      editorState.cropRect.visible = false;
      canvas.requestRenderAll();
    }

    const json = canvas.toDatalessJSON([
      "toolType",
      "effectType"
    ]);

    if (editorState.cropRect) {
      editorState.cropRect.visible = cropWasVisible;
      canvas.requestRenderAll();
    }

    return {
      json,
      zoom: editorState.zoom,
      brightness: editorState.brightness
    };
  }

  function pushHistorySnapshot(force = false) {
    const canvas = editorState.canvas;
    if (!canvas || editorState.restoringHistory || editorState.isRefreshingEffect) return;

    const snapshot = collectCanvasState();
    if (!snapshot) return;

    const serialized = JSON.stringify(snapshot);
    const last = editorState.history[editorState.historyIndex];
    if (!force && last && JSON.stringify(last) === serialized) return;

    if (editorState.historyIndex < editorState.history.length - 1) {
      editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    }

    editorState.history.push(snapshot);
    editorState.historyIndex = editorState.history.length - 1;

    if (editorState.history.length > 40) {
      editorState.history.shift();
      editorState.historyIndex = editorState.history.length - 1;
    }

    updateUndoRedoState();
  }

  async function restoreHistoryAt(index) {
    const canvas = editorState.canvas;
    if (!canvas) return;
    if (index < 0 || index >= editorState.history.length) return;

    const snapshot = editorState.history[index];
    if (!snapshot) return;

    editorState.restoringHistory = true;
    try {
      removeCropRect();

      await new Promise((resolve) => {
        canvas.loadFromJSON(snapshot.json, () => {
          canvas.renderAll();
          resolve();
        });
      });

      const objs = canvas.getObjects();
      editorState.baseImage = objs.length ? objs[0] : null;
      editorState.historyIndex = index;
      editorState.zoom = snapshot.zoom || 1;
      editorState.brightness = Number(snapshot.brightness || 0);

      const brightEl = $("ieBrightness");
      if (brightEl) brightEl.value = String(editorState.brightness);

      if (editorState.baseImage) {
        applyBrightness(editorState.brightness);
      }

      resetViewport();
      if (editorState.zoom !== 1) setZoom(editorState.zoom);
      else setZoomLabel();

      if (editorState.canvas) {
        editorState.canvas.calcOffset();
        editorState.canvas.requestRenderAll();
      }

      setActiveTool("select");
      updateUndoRedoState();
    } finally {
      editorState.restoringHistory = false;
    }
  }

  function undoHistory() {
    if (editorState.historyIndex <= 0) return;
    restoreHistoryAt(editorState.historyIndex - 1);
  }

  function redoHistory() {
    if (editorState.historyIndex >= editorState.history.length - 1) return;
    restoreHistoryAt(editorState.historyIndex + 1);
  }

  function updateUndoRedoState() {
    const undoBtn = $("ieUndoBtn");
    const redoBtn = $("ieRedoBtn");
    if (undoBtn) undoBtn.disabled = !(editorState.historyIndex > 0);
    if (redoBtn) redoBtn.disabled = !(editorState.historyIndex < editorState.history.length - 1);
  }

  function bindObjectEvents() {
    const canvas = editorState.canvas;
    if (!canvas || canvas.__imgEditorObjectEventsBound) return;
    canvas.__imgEditorObjectEventsBound = true;

    canvas.on("object:modified", async (evt) => {
      if (editorState.restoringHistory) return;
      const obj = evt?.target;
      if (!obj) return;

      if (isEffectOverlay(obj)) {
        await regenerateEffectOverlayObject(obj, true);
        return;
      }

      pushHistorySnapshot();
    });
  }

  function getPointerFromEvent(canvas, evt) {
    if (typeof canvas.getPointer === "function") return canvas.getPointer(evt);
    const rect = canvas.upperCanvasEl.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function bindPointerDrawing() {
    const canvas = editorState.canvas;
    if (!canvas || canvas.__imgEditorPointerBound) return;
    canvas.__imgEditorPointerBound = true;

    let startX = 0;
    let startY = 0;
    let drawingObject = null;

    canvas.on("mouse:down", function (opt) {
      const evt = opt.e;
      if (!evt) return;

      if (editorState.activeTool === "pan") {
        editorState.isPanning = true;
        canvas.defaultCursor = "grabbing";
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
        return;
      }

      if (editorState.activeTool === "text") {
        addTextbox();
        return;
      }

      if (!["line", "arrow", "rect", "circle", "blurRect", "blurCircle", "mosaicRect", "mosaicCircle"].includes(editorState.activeTool)) {
        return;
      }

      const pointer = getPointerFromEvent(canvas, evt);
      startX = pointer.x;
      startY = pointer.y;
      const tool = editorState.activeTool;

      if (tool === "line" || tool === "arrow") {
        drawingObject = new fabric.Line([startX, startY, startX, startY], {
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false,
          hasControls: true,
          hasBorders: true,
          lockRotation: false
        });
        editorState.tempDraft = drawingObject;
        canvas.add(drawingObject);
      }

      if (tool === "rect" || tool === "blurRect" || tool === "mosaicRect") {
        drawingObject = new fabric.Rect({
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          originX: "left",
          originY: "top",
          fill: ["blurRect", "mosaicRect"].includes(tool) ? "rgba(37,99,235,0.08)" : "transparent",
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false,
          hasControls: true,
          hasBorders: true,
          lockRotation: false
        });
        editorState.tempDraft = drawingObject;
        canvas.add(drawingObject);
      }

      if (tool === "circle" || tool === "blurCircle" || tool === "mosaicCircle") {
        drawingObject = new fabric.Ellipse({
          left: startX,
          top: startY,
          rx: 1,
          ry: 1,
          originX: "center",
          originY: "center",
          fill: ["blurCircle", "mosaicCircle"].includes(tool) ? "rgba(37,99,235,0.08)" : "transparent",
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false,
          hasControls: true,
          hasBorders: true,
          lockRotation: false
        });
        editorState.tempDraft = drawingObject;
        canvas.add(drawingObject);
      }
    });

    canvas.on("mouse:move", function (opt) {
      const evt = opt.e;
      if (!evt) return;

      if (editorState.activeTool === "pan" && editorState.isPanning) {
        const vpt = this.viewportTransform;
        vpt[4] += evt.clientX - this.lastPosX;
        vpt[5] += evt.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
        return;
      }

      const draft = editorState.tempDraft;
      if (!draft) return;

      const pointer = getPointerFromEvent(canvas, evt);
      const tool = editorState.activeTool;

      if (tool === "line" || tool === "arrow") {
        draft.set({ x2: pointer.x, y2: pointer.y });
      }

      if (tool === "rect" || tool === "blurRect" || tool === "mosaicRect") {
        draft.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY)
        });
      }

      if (tool === "circle" || tool === "blurCircle" || tool === "mosaicCircle") {
        draft.set({
          left: (startX + pointer.x) / 2,
          top: (startY + pointer.y) / 2,
          rx: Math.abs(pointer.x - startX) / 2,
          ry: Math.abs(pointer.y - startY) / 2
        });
      }

      canvas.requestRenderAll();
    });

    canvas.on("mouse:up", async function () {
      if (editorState.activeTool === "pan") {
        editorState.isPanning = false;
        canvas.defaultCursor = "grab";
        return;
      }

      const draft = editorState.tempDraft;
      const tool = editorState.activeTool;
      if (!draft) return;
      editorState.tempDraft = null;

      if (tool === "arrow") {
        const arrow = createArrowGroup(draft.x1, draft.y1, draft.x2, draft.y2);
        canvas.remove(draft);
        canvas.add(arrow);
        canvas.setActiveObject(arrow);
        canvas.requestRenderAll();
        pushHistorySnapshot();
        setActiveTool("select");
        return;
      }

      if (tool === "line" || tool === "rect" || tool === "circle") {
        draft.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: false
        });
        canvas.setActiveObject(draft);
        canvas.requestRenderAll();
        pushHistorySnapshot();
        setActiveTool("select");
        return;
      }

      if (tool === "blurRect") {
        canvas.setActiveObject(draft);
        await applyAreaEffect("blur", "rect");
        return;
      }

      if (tool === "blurCircle") {
        canvas.setActiveObject(draft);
        await applyAreaEffect("blur", "circle");
        return;
      }

      if (tool === "mosaicRect") {
        canvas.setActiveObject(draft);
        await applyAreaEffect("mosaic", "rect");
        return;
      }

      if (tool === "mosaicCircle") {
        canvas.setActiveObject(draft);
        await applyAreaEffect("mosaic", "circle");
      }
    });

    canvas.on("mouse:wheel", function (opt) {
      const evt = opt.e;
      if (!evt) return;
      evt.preventDefault();
      evt.stopPropagation();

      let zoom = canvas.getZoom();
      zoom *= 0.999 ** evt.deltaY;
      zoom = Math.max(0.2, Math.min(5, zoom));
      editorState.zoom = zoom;
      canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
      setZoomLabel();
    });
  }

 async function loadImageToCanvas(file) {
  const url = URL.createObjectURL(file);
  editorState.originalUrl = url;

  const wrap = editorState.canvasEl.parentElement;
  if (!wrap) throw new Error("ไม่พบพื้นที่แสดง canvas");

  // อ่านขนาดหลัง modal เปิดแล้วจริง เพื่อลดอาการวาบ/เด้งบนมือถือ
  const wrapRect = wrap.getBoundingClientRect();
  const safeWrapW = Math.max(320, Math.floor(wrapRect.width || wrap.clientWidth || 0));
  const safeWrapH = Math.max(240, Math.floor(wrapRect.height || wrap.clientHeight || 0));

  const maxW = Math.max(320, safeWrapW - 20);
  const maxH = Math.max(240, safeWrapH - 20);

  if (editorState.canvas) {
    try { editorState.canvas.dispose(); } catch (_) {}
    editorState.canvas = null;
  }

  const canvas = new fabric.Canvas(editorState.canvasEl, {
    preserveObjectStacking: true,
    selection: true,
    renderOnAddRemove: true
  });

  editorState.canvas = canvas;

  const imgEl = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดรูปภาพไม่สำเร็จ"));
    img.decoding = "async";
    img.src = url;
  });

  const imgW = imgEl.naturalWidth || imgEl.width;
  const imgH = imgEl.naturalHeight || imgEl.height;
  if (!imgW || !imgH) throw new Error("ไม่สามารถอ่านขนาดรูปภาพได้");

  const scale = Math.min(maxW / imgW, maxH / imgH, 1);
  const canvasW = Math.max(320, Math.round(imgW * scale));
  const canvasH = Math.max(240, Math.round(imgH * scale));

  if (typeof canvas.setDimensions === "function") {
    canvas.setDimensions({ width: canvasW, height: canvasH });
  } else if (typeof canvas.setWidth === "function" && typeof canvas.setHeight === "function") {
    canvas.setWidth(canvasW);
    canvas.setHeight(canvasH);
  } else {
    editorState.canvasEl.width = canvasW;
    editorState.canvasEl.height = canvasH;
  }

  if (canvas.lowerCanvasEl) {
    canvas.lowerCanvasEl.style.width = canvasW + "px";
    canvas.lowerCanvasEl.style.height = canvasH + "px";
  }
  if (canvas.upperCanvasEl) {
    canvas.upperCanvasEl.style.width = canvasW + "px";
    canvas.upperCanvasEl.style.height = canvasH + "px";
  }
  if (canvas.wrapperEl) {
    canvas.wrapperEl.style.width = canvasW + "px";
    canvas.wrapperEl.style.height = canvasH + "px";
  }

  const baseImage = new fabric.Image(imgEl, {
    left: canvasW / 2,
    top: canvasH / 2,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
    objectCaching: false
  });

  baseImage.scaleX = scale;
  baseImage.scaleY = scale;
  editorState.baseImage = baseImage;

  canvas.clear();
  canvas.add(baseImage);

  if (typeof baseImage.moveTo === "function") {
    baseImage.moveTo(0);
  } else if (typeof canvas.sendToBack === "function") {
    canvas.sendToBack(baseImage);
  } else if (typeof canvas.sendObjectToBack === "function") {
    canvas.sendObjectToBack(baseImage);
  }

  bindObjectEvents();
  bindPointerDrawing();

  resetViewport();
  if (typeof canvas.calcOffset === "function") {
    canvas.calcOffset();
  }

  // render รอบเดียวพอ ลดอาการกระพริบบนมือถือ
  canvas.renderAll();
}
  async function exportEditedFile() {
    const canvas = editorState.canvas;
    if (!canvas) throw new Error("ยังไม่มี canvas สำหรับ export");

    removeCropRect();

    const dataUrl = canvas.toDataURL({
      format: "jpeg",
      quality: 0.92,
      multiplier: 1,
      enableRetinaScaling: false
    });

    const blob = dataURLToBlob(dataUrl);
    const filenameBase = (editorState.originalFile?.name || "edited-image").replace(/\.[^.]+$/, "");
    const outFile = await blobToFile(blob, `${filenameBase}_edited.jpg`, "image/jpeg");

    return {
      ok: true,
      file: outFile,
      blob,
      dataUrl,
      filename: outFile.name,
      mimeType: outFile.type
    };
  }

  function getEditIconSvg() {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" fill="currentColor"></path>
        <path d="M14.06 4.94l3.75 3.75 1.47-1.47a1.5 1.5 0 0 0 0-2.12l-1.63-1.63a1.5 1.5 0 0 0-2.12 0l-1.47 1.47Z" fill="currentColor"></path>
      </svg>
    `;
  }

  function setFloatingPanelOpen(isOpen) {
    const panel = editorState.floatingToolPanel;
    const btn = editorState.floatingToggleBtn;
    if (!panel || !btn) return;

    panel.classList.toggle("hidden", !isOpen);
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    btn.title = isOpen ? "ซ่อนเครื่องมือแก้ไขภาพ" : "แสดงเครื่องมือแก้ไขภาพ";
  }

  function toggleFloatingPanel(forceState) {
    const panel = editorState.floatingToolPanel;
    if (!panel) return;

    const next = typeof forceState === "boolean"
      ? forceState
      : panel.classList.contains("hidden");

    setFloatingPanelOpen(next);
  }

  function ensureFloatingToolUi() {
    const canvasWrap = document.querySelector(".imgEditorCanvasWrap");
    const toolbarWrap = document.querySelector(".imgEditorToolbarWrap");
    if (!canvasWrap || !toolbarWrap) return;

    if (!editorState.floatingToggleBtn) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "ieFloatingToggleBtn";
      btn.className = "ieFloatingToggle";
      btn.innerHTML = getEditIconSvg();
      btn.setAttribute("aria-label", "เปิดเครื่องมือแก้ไขภาพ");
      btn.setAttribute("aria-expanded", "false");
      btn.title = "แสดงเครื่องมือแก้ไขภาพ";
      canvasWrap.appendChild(btn);
      editorState.floatingToggleBtn = btn;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFloatingPanel();
      });
    }

    if (!editorState.floatingToolPanel) {
      const panel = document.createElement("div");
      panel.id = "ieFloatingToolPanel";
      panel.className = "ieFloatingPanel hidden";
      canvasWrap.appendChild(panel);
      editorState.floatingToolPanel = panel;

      panel.addEventListener("click", (e) => e.stopPropagation());
    }

    if (toolbarWrap.parentElement !== editorState.floatingToolPanel) {
      editorState.floatingToolPanel.appendChild(toolbarWrap);
    }

    if (!canvasWrap.__ieOutsidePanelBind) {
      canvasWrap.__ieOutsidePanelBind = true;
      document.addEventListener("click", (e) => {
        if (!editorState.modal || editorState.modal.classList.contains("hidden")) return;
        const panel = editorState.floatingToolPanel;
        const btn = editorState.floatingToggleBtn;
        if (!panel || !btn) return;
        if (panel.contains(e.target) || btn.contains(e.target)) return;
        setFloatingPanelOpen(false);
      });
    }
  }

  function collapseFloatingPanelAfterToolPick() {
    if (window.matchMedia("(max-width: 950px)").matches) {
      setFloatingPanelOpen(false);
    }
  }

  function getToolButton(toolName) {
    return document.querySelector(`.ie-tool[data-tool="${toolName}"]`);
  }

  function getFieldByInputId(inputId) {
    const input = $(inputId);
    return input ? input.closest(".ieField") : null;
  }

  function ensureBtn(container, id, text, className = "btn ghost", attrs = {}) {
    let btn = $(id);
    if (btn) {
      if (text != null) btn.textContent = text;
      if (className) btn.className = className;
      Object.keys(attrs || {}).forEach((k) => btn.setAttribute(k, attrs[k]));
      return btn;
    }

    btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className = className;
    btn.textContent = text || "";
    Object.keys(attrs || {}).forEach((k) => btn.setAttribute(k, attrs[k]));
    container.appendChild(btn);
    return btn;
  }

  function ensureToolBtn(container, id, text, toolName) {
    const btn = ensureBtn(container, id, text, "btn ghost ie-tool", { "data-tool": toolName });
    btn.classList.add("ie-tool");
    btn.setAttribute("data-tool", toolName);
    return btn;
  }

  function setButtonIcon(id, fallbackIcon) {
    const el = $(id);
    if (el) el.setAttribute("data-icon", TOOL_ICONS[id] || fallbackIcon || "•");
  }

  function applyIconsToToolbar() {
    Object.keys(TOOL_ICONS).forEach((id) => setButtonIcon(id, TOOL_ICONS[id]));
  }

  function createToolbarSection(title, extraClass = "") {
    const section = document.createElement("section");
    section.className = `ieToolbarSection ${extraClass}`.trim();

    const head = document.createElement("div");
    head.className = "ieToolbarTitle";
    head.textContent = title;

    const grid = document.createElement("div");
    grid.className = "ieButtonGrid";

    section.appendChild(head);
    section.appendChild(grid);

    return { section, grid };
  }

  function appendNodes(container, nodes) {
    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
      if (node) container.appendChild(node);
    });
  }

  function ensureToolbarResponsiveLabels() {
    const compact = window.matchMedia("(max-width: 560px)").matches;
    const compact2 = window.matchMedia("(max-width: 390px)").matches;

    const labels = {
      ieSelectBtn: "เลือก",
      iePanBtn: compact2 ? "เลื่อน" : (compact ? "เลื่อน" : "เลื่อนภาพ"),
      ieTextBtn: "ข้อความ",
      ieCropToolBtn: "ครอป",

      ieLineBtn: compact2 ? "เส้น" : "เส้น",
      ieArrowBtn: "ลูกศร",
      ieRectBtn: compact2 ? "กรอบ" : "สี่เหลี่ยม",
      ieCircleBtn: compact2 ? "วง" : "วงกลม",

      ieBlurRectBtn: compact2 ? "เบลอสี่" : "เบลอสี่",
      ieBlurCircleBtn: compact2 ? "เบลอวง" : "เบลอวง",
      ieMosaicRectBtn: compact2 ? "โมเสกสี่" : "โมเสกสี่",
      ieMosaicCircleBtn: compact2 ? "โมเสกวง" : "โมเสกวง",

      ieZoomOutBtn: "ซูม-",
      ieZoomResetBtn: "100%",
      ieZoomInBtn: "ซูม+",
      ieFitBtn: "พอดี",

      ieRotateLeftBtn: "ซ้าย",
      ieRotateRightBtn: "ขวา",

      ieUndoBtn: "ย้อน",
      ieRedoBtn: "ทำซ้ำ",
      ieDeleteBtn: "ลบ",
      ieApplyCropBtn: "ใช้"
    };

    Object.keys(labels).forEach((id) => {
      const el = $(id);
      if (el) el.textContent = labels[id];
    });

    applyIconsToToolbar();
  }

  function rebuildToolbarLayoutInWrap(toolbarWrap) {
    if (!toolbarWrap) return;

    let toolbar = toolbarWrap.querySelector(".imgEditorToolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "imgEditorToolbar";
      toolbarWrap.innerHTML = "";
      toolbarWrap.appendChild(toolbar);
    }

    const selectBtn = getToolButton("select");
    const panBtn = getToolButton("pan");
    const textBtn = getToolButton("text");
    const cropBtn = $("ieCropToolBtn");

    const lineBtn = getToolButton("line");
    const arrowBtn = getToolButton("arrow");
    const rectBtn = getToolButton("rect");
    const circleBtn = getToolButton("circle");

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
    });

    $("ieZoomOutBtn")?.addEventListener("click", () => {
      setZoom(editorState.zoom - 0.1);
    });

    $("ieZoomResetBtn")?.addEventListener("click", () => {
      resetViewport();
    });

    $("ieFitBtn")?.addEventListener("click", () => {
      resetViewport();
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
function setEditorPreparing(isPreparing) {
  if (!editorState.modal) return;
  editorState.modal.classList.toggle("is-preparing", !!isPreparing);
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

  // เปิด modal แบบซ่อนไว้ก่อน เพื่อให้ layout พร้อม แต่ผู้ใช้ยังไม่เห็นช่วงกระพริบ
  editorState.modal.classList.remove("hidden");
  editorState.modal.setAttribute("aria-hidden", "false");
  setEditorPreparing(true);
  document.body.classList.add("progress-lock");
  document.body.classList.add("img-editor-lock");

  destroyCanvas();
  revokeOriginalUrl();

  try {
    // รอให้ browser จัด layout/modal เสร็จก่อน แล้วค่อยสร้าง canvas
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));

    await loadImageToCanvas(file);

    // อย่า render ซ้ำหลายรอบเกินจำเป็น
    ensureExtraControls();
    bindToolButtons();
    setFloatingPanelOpen(false);
    setActiveTool("select");
    setZoomLabel();
    setToolLabel();
    pushHistorySnapshot(true);
    updateUndoRedoState();

    // รออีก 1 frame หลัง canvas พร้อม แล้วค่อยแสดงจริง
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    setEditorPreparing(false);
  } catch (err) {
    console.error("openImageEditor error:", err);
    setEditorPreparing(false);
    closeEditor({ ok: false });
    await showMessage("error", "เปิดภาพไม่สำเร็จ", err?.message || String(err));
    return Promise.resolve({ ok: false });
  }

  return new Promise((resolve) => {
    editorState.resultResolve = resolve;
  });
}
window.ImageEditorX = {
  open: openImageEditor
};
})();

