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

    cropRect: null,
    tempDraft: null,
    history: [],
    historyIndex: -1,
    restoringHistory: false,

    fabRoot: null,
    fabLauncher: null,
    fabPanel: null,
    fabBackdrop: null
  };

  const $ = (id) => document.getElementById(id);

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
    if (!window.fabric) {
      throw new Error("ยังไม่พบ Fabric.js");
    }
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
      try {
        editorState.canvas.dispose();
      } catch (_) {}
      editorState.canvas = null;
    }
    editorState.baseImage = null;
    editorState.cropRect = null;
    editorState.tempDraft = null;
  }

  function closeEditor(result = { ok: false }) {
    closeFabPanel();

    editorState.modal?.classList.add("hidden");
    editorState.modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("progress-lock");

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
    updateFabLauncherLabel();
    updateFabActiveButtons();
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

  function setActiveTool(tool, autoCloseFab = false) {
    editorState.activeTool = tool || "select";
    setActiveButtonByTool(editorState.activeTool);
    setToolLabel();
    setCanvasInteractivityForTool(editorState.activeTool);

    if (autoCloseFab) {
      closeFabPanel();
    }
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

    let center;
    if (typeof canvas.getCenter === "function") {
      center = canvas.getCenter();
    } else {
      center = {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2
      };
    }

    canvas.zoomToPoint(
      new fabric.Point(center.left, center.top),
      editorState.zoom
    );
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
    baseImage.filters = [
      new fabric.filters.Brightness({ brightness: editorState.brightness })
    ];
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
    if (!active) return;

    if (active === editorState.baseImage) return;
    if (active === editorState.cropRect) return;

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

    try {
      canvas.remove(editorState.cropRect);
    } catch (_) {}
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

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  async function blobToFile(blob, filename, mimeType = "image/jpeg") {
    return new File([blob], filename, {
      type: mimeType,
      lastModified: Date.now()
    });
  }

  function getCanvasSnapshotDataUrl(options = {}) {
    const canvas = editorState.canvas;
    if (!canvas) return "";

    const active = canvas.getActiveObject();
    if (active) canvas.discardActiveObject();

    const hadCrop = !!editorState.cropRect && canvas.getObjects().includes(editorState.cropRect);
    if (hadCrop) {
      editorState.cropRect.visible = false;
      canvas.requestRenderAll();
    }

    const dataUrl = canvas.toDataURL({
      format: options.format || "png",
      quality: options.quality == null ? 1 : options.quality,
      multiplier: options.multiplier || 1,
      enableRetinaScaling: false
    });

    if (hadCrop) {
      editorState.cropRect.visible = true;
      canvas.requestRenderAll();
    }

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

  async function buildEffectOverlayFromRegion(shapeType, effectType, x, y, w, h) {
    const snapshotUrl = getCanvasSnapshotDataUrl({ format: "png", multiplier: 1 });
    if (!snapshotUrl) return null;

    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = snapshotUrl;
    });

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

    const regionUrl = off.toDataURL("image/png");
    const regionImg = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = regionUrl;
    });

    const overlay = new fabric.Image(regionImg, {
      left: sx,
      top: sy,
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
      lockRotation: false
    });

    if (shapeType === "circle") {
      overlay.clipPath = new fabric.Ellipse({
        rx: sw / 2,
        ry: sh / 2,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top"
      });
    }

    return overlay;
  }

  async function applyCrop() {
    const canvas = editorState.canvas;
    const crop = editorState.cropRect;
    if (!canvas || !crop || editorState.isApplyingCrop) return;

    try {
      editorState.isApplyingCrop = true;

      const dataUrl = getCanvasSnapshotDataUrl({ format: "png", multiplier: 1 });
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = dataUrl;
      });

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

    let x = 0, y = 0, w = 0, h = 0;

    if (active.type === "rect") {
      x = active.left;
      y = active.top;
      w = active.width * active.scaleX;
      h = active.height * active.scaleY;
    } else if (active.type === "ellipse") {
      x = active.left;
      y = active.top;
      w = (active.rx * 2) * active.scaleX;
      h = (active.ry * 2) * active.scaleY;
    } else {
      await showMessage("warning", "รูปทรงไม่ถูกต้อง", "กรุณาเลือกสี่เหลี่ยมหรือวงกลมสำหรับใช้เอฟเฟกต์นี้");
      return;
    }

    try {
      const overlay = await buildEffectOverlayFromRegion(shapeType, effectType, x, y, w, h);
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

    const cropWasVisible = !!editorState.cropRect && editorState.cropRect.visible;
    if (editorState.cropRect) {
      editorState.cropRect.visible = false;
      canvas.requestRenderAll();
    }

    const json = canvas.toDatalessJSON(["toolType", "effectType"]);

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
    if (!canvas || editorState.restoringHistory) return;

    const snapshot = collectCanvasState();
    if (!snapshot) return;

    const serialized = JSON.stringify(snapshot);
    const last = editorState.history[editorState.historyIndex];
    if (!force && last && JSON.stringify(last) === serialized) {
      return;
    }

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

      resetViewport();
      if (editorState.zoom !== 1) {
        setZoom(editorState.zoom);
      } else {
        setZoomLabel();
      }

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
    const fabUndo = $("ieFabUndoBtn");
    const fabRedo = $("ieFabRedoBtn");

    const canUndo = editorState.historyIndex > 0;
    const canRedo = editorState.historyIndex < editorState.history.length - 1;

    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
    if (fabUndo) fabUndo.disabled = !canUndo;
    if (fabRedo) fabRedo.disabled = !canRedo;
  }

  function bindObjectEvents() {
    const canvas = editorState.canvas;
    if (!canvas) return;
    if (canvas.__imageEditorObjectEventsBound) return;
    canvas.__imageEditorObjectEventsBound = true;

    canvas.on("object:modified", () => {
      if (editorState.restoringHistory) return;
      pushHistorySnapshot();
    });
  }

  function getPointerFromEvent(canvas, evt) {
    if (typeof canvas.getPointer === "function") {
      return canvas.getPointer(evt);
    }
    const rect = canvas.upperCanvasEl.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  function bindPointerDrawing() {
    const canvas = editorState.canvas;
    if (!canvas) return;
    if (canvas.__imageEditorPointerBound) return;
    canvas.__imageEditorPointerBound = true;

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
          fill: ["blurCircle", "mosaicCircle"].includes(tool) ? "rgba(37,99,235,0.08)" : "transparent",
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          originX: "left",
          originY: "top",
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
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
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
        return;
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

    const maxW = Math.max(640, Math.floor(wrap.clientWidth - 20));
    const maxH = Math.max(420, Math.floor(wrap.clientHeight - 20));

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

    if (!imgW || !imgH) {
      throw new Error("ไม่สามารถอ่านขนาดรูปภาพได้");
    }

    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const canvasW = Math.max(320, Math.round(imgW * scale));
    const canvasH = Math.max(240, Math.round(imgH * scale));

    if (typeof canvas.setWidth === "function" && typeof canvas.setHeight === "function") {
      canvas.setWidth(canvasW);
      canvas.setHeight(canvasH);
    } else if (typeof canvas.setDimensions === "function") {
      canvas.setDimensions({ width: canvasW, height: canvasH });
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
    canvas.requestRenderAll();
  }

  async function exportEditedFile() {
    const canvas = editorState.canvas;
    if (!canvas) {
      throw new Error("ยังไม่มี canvas สำหรับ export");
    }

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

  function injectFabStylesOnce() {
    if (document.getElementById("ieFabDynamicStyle")) return;

    const css = `
      .imgEditorToolbarWrap{
        display:none !important;
      }

      .ieFabRoot{
        position:absolute;
        top:14px;
        left:14px;
        z-index:20;
        pointer-events:none;
      }

      .ieFabRoot *{
        pointer-events:auto;
      }

      .ieFabLauncher{
        min-width:68px;
        min-height:68px;
        padding:10px 12px;
        border:none;
        border-radius:20px;
        background:linear-gradient(180deg,#2563eb 0%,#1d4ed8 100%);
        color:#fff;
        box-shadow:0 18px 34px rgba(37,99,235,.28);
        display:grid;
        justify-items:center;
        align-content:center;
        gap:3px;
        cursor:pointer;
      }

      .ieFabLauncher:active{
        transform:translateY(1px);
      }

      .ieFabIcon{
        font-size:18px;
        line-height:1;
      }

      .ieFabLabel{
        font-size:11px;
        font-weight:900;
        line-height:1.1;
        white-space:nowrap;
      }

      .ieFabCurrent{
        font-size:10px;
        font-weight:800;
        line-height:1.1;
        opacity:.96;
      }

      .ieFabPanel{
        position:absolute;
        top:0;
        left:0;
        width:min(320px, calc(100vw - 28px));
        max-height:min(72dvh, 640px);
        overflow:auto;
        padding:12px;
        border-radius:24px;
        border:1px solid #d9e6f7;
        background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);
        box-shadow:0 24px 70px rgba(15,23,42,.24);
        opacity:0;
        transform:translateY(10px) scale(.98);
        pointer-events:none;
        transition:opacity .18s ease, transform .18s ease;
      }

      .ieFabPanel.open{
        opacity:1;
        transform:translateY(0) scale(1);
        pointer-events:auto;
      }

      .ieFabBackdrop{
        position:fixed;
        inset:0;
        background:transparent;
        display:none;
      }

      .ieFabBackdrop.open{
        display:block;
      }

      .ieFabPanelHead{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
      }

      .ieFabPanelTitle{
        font-size:15px;
        font-weight:900;
        color:#0f172a;
        line-height:1.15;
      }

      .ieFabClose{
        min-height:36px;
        padding:6px 12px;
        border-radius:12px;
      }

      .ieFabSection + .ieFabSection{
        margin-top:10px;
      }

      .ieFabSectionTitle{
        display:inline-flex;
        align-items:center;
        min-height:28px;
        padding:5px 10px;
        border-radius:999px;
        background:#eef4ff;
        color:#1d4ed8;
        border:1px solid #d8e5fb;
        font-size:11px;
        font-weight:900;
        margin-bottom:8px;
      }

      .ieFabGrid{
        display:grid;
        gap:8px;
      }

      .ieFabGrid.cols2{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .ieFabGrid.cols3{
        grid-template-columns:repeat(3,minmax(0,1fr));
      }

      .ieFabGrid.cols4{
        grid-template-columns:repeat(4,minmax(0,1fr));
      }

      .ieFabBtn{
        width:100%;
        min-width:0;
        min-height:42px;
        height:42px;
        padding:7px 8px;
        border-radius:14px;
        border:1.2px solid #d8e4f4;
        background:linear-gradient(180deg,#ffffff 0%,#f9fbff 100%);
        color:#0f172a;
        font-size:12px;
        font-weight:900;
        line-height:1.08;
        text-align:center;
        box-shadow:0 4px 12px rgba(15,23,42,.04);
      }

      .ieFabBtn.active{
        background:linear-gradient(180deg,#2563eb 0%,#1d4ed8 100%);
        color:#fff;
        border-color:transparent;
        box-shadow:0 10px 20px rgba(37,99,235,.22);
      }

      .ieFabBtn.dark{
        background:linear-gradient(180deg,#0f172a 0%,#1f2937 100%);
        color:#fff;
        border-color:transparent;
        box-shadow:0 10px 20px rgba(15,23,42,.18);
      }

      .ieFabBtn:disabled{
        opacity:.45;
        cursor:not-allowed;
        box-shadow:none;
      }

      .ieFabField{
        display:grid;
        grid-template-columns:52px minmax(0,1fr);
        align-items:center;
        gap:8px;
        min-height:42px;
        padding:8px 10px;
        border:1.2px solid #d9e4f1;
        border-radius:14px;
        background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%);
        font-size:12px;
        font-weight:800;
        color:#334155;
      }

      .ieFabField input[type="color"]{
        width:100%;
        height:28px;
        min-height:28px;
        padding:0;
        border:none;
        background:transparent;
        box-shadow:none;
        cursor:pointer;
      }

      .ieFabField input[type="range"]{
        width:100%;
        min-width:0;
        padding:0;
        border:none;
        background:transparent;
        box-shadow:none;
      }

      @media (max-width: 860px){
        .ieFabRoot{
          top:10px;
          left:10px;
        }

        .ieFabLauncher{
          min-width:60px;
          min-height:60px;
          border-radius:18px;
          padding:8px 10px;
        }

        .ieFabPanel{
          width:min(296px, calc(100vw - 20px));
          max-height:min(70dvh, 560px);
          padding:10px;
          border-radius:20px;
        }

        .ieFabBtn{
          min-height:40px;
          height:40px;
          font-size:11px;
          padding:6px 6px;
          border-radius:12px;
        }

        .ieFabGrid.cols4{
          grid-template-columns:repeat(4,minmax(0,1fr));
        }

        .ieFabGrid.cols3{
          grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .ieFabGrid.cols2{
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }

      @media (max-width: 560px){
        .ieFabPanel{
          width:min(280px, calc(100vw - 16px));
          left:0;
        }

        .ieFabLauncher{
          min-width:56px;
          min-height:56px;
          border-radius:16px;
        }

        .ieFabIcon{
          font-size:16px;
        }

        .ieFabLabel{
          font-size:10px;
        }

        .ieFabCurrent{
          font-size:9px;
        }

        .ieFabBtn{
          min-height:38px;
          height:38px;
          font-size:10.5px;
          border-radius:11px;
          padding:5px 4px;
        }

        .ieFabField{
          grid-template-columns:44px minmax(0,1fr);
          min-height:38px;
          padding:6px 7px;
          font-size:10.5px;
          border-radius:11px;
        }
      }
    `;

    const style = document.createElement("style");
    style.id = "ieFabDynamicStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function toolDisplayName(tool) {
    const map = {
      select: "เลือก",
      pan: "เลื่อน",
      text: "ข้อความ",
      crop: "ครอป",
      line: "เส้น",
      arrow: "ลูกศร",
      rect: "กรอบ",
      circle: "วงกลม",
      blurRect: "เบลอสี่",
      blurCircle: "เบลอวง",
      mosaicRect: "โมเสกสี่",
      mosaicCircle: "โมเสกวง"
    };
    return map[tool] || "เครื่องมือ";
  }

  function openFabPanel() {
    if (!editorState.fabPanel || !editorState.fabBackdrop) return;
    editorState.fabPanel.classList.add("open");
    editorState.fabBackdrop.classList.add("open");
    if (editorState.fabLauncher) editorState.fabLauncher.setAttribute("aria-expanded", "true");
  }

  function closeFabPanel() {
    if (!editorState.fabPanel || !editorState.fabBackdrop) return;
    editorState.fabPanel.classList.remove("open");
    editorState.fabBackdrop.classList.remove("open");
    if (editorState.fabLauncher) editorState.fabLauncher.setAttribute("aria-expanded", "false");
  }

  function toggleFabPanel() {
    if (!editorState.fabPanel) return;
    const isOpen = editorState.fabPanel.classList.contains("open");
    if (isOpen) closeFabPanel();
    else openFabPanel();
  }

  function updateFabLauncherLabel() {
    const label = $("ieFabCurrentLabel");
    if (label) label.textContent = toolDisplayName(editorState.activeTool);
  }

  function updateFabActiveButtons() {
    document.querySelectorAll(".ie-fab-tool").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tool") === editorState.activeTool);
    });
  }

  function createFabButton({ id, text, className = "", onClick, tool = "" }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = id || "";
    btn.className = `ieFabBtn ${className}`.trim();
    btn.textContent = text || "";
    if (tool) {
      btn.classList.add("ie-fab-tool");
      btn.setAttribute("data-tool", tool);
    }
    if (typeof onClick === "function") {
      btn.addEventListener("click", onClick);
    }
    return btn;
  }

  function createFabField(labelText, inputEl) {
    const wrap = document.createElement("label");
    wrap.className = "ieFabField";

    const span = document.createElement("span");
    span.textContent = labelText;

    wrap.appendChild(span);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function buildFabSection(title, cols, nodes) {
    const section = document.createElement("section");
    section.className = "ieFabSection";

    const head = document.createElement("div");
    head.className = "ieFabSectionTitle";
    head.textContent = title;

    const grid = document.createElement("div");
    grid.className = `ieFabGrid ${cols}`.trim();

    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
      if (node) grid.appendChild(node);
    });

    section.appendChild(head);
    section.appendChild(grid);
    return section;
  }

  function syncControlValuesToFab() {
    const fabColor = $("ieFabColorPicker");
    const fabStroke = $("ieFabStrokeWidth");
    const fabBrightness = $("ieFabBrightness");

    const color = $("ieColorPicker");
    const stroke = $("ieStrokeWidth");
    const brightness = $("ieBrightness");

    if (fabColor && color) fabColor.value = color.value || editorState.strokeColor || "#dc2626";
    if (fabStroke && stroke) fabStroke.value = stroke.value || String(editorState.strokeWidth || 3);
    if (fabBrightness && brightness) fabBrightness.value = brightness.value || "0";
  }

  function ensureFabUi() {
    injectFabStylesOnce();

    if (editorState.fabRoot && document.body.contains(editorState.fabRoot)) {
      syncControlValuesToFab();
      updateFabLauncherLabel();
      updateFabActiveButtons();
      return;
    }

    const body = editorState.modal?.querySelector(".imgEditorBody");
    if (!body) return;

    const root = document.createElement("div");
    root.className = "ieFabRoot";
    root.id = "ieFabRoot";

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "ieFabBackdrop";
    backdrop.id = "ieFabBackdrop";
    backdrop.addEventListener("click", closeFabPanel);

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "ieFabLauncher";
    launcher.id = "ieFabLauncher";
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = `
      <span class="ieFabIcon">✦</span>
      <span class="ieFabLabel">เครื่องมือ</span>
      <span class="ieFabCurrent" id="ieFabCurrentLabel">เลือก</span>
    `;
    launcher.addEventListener("click", toggleFabPanel);

    const panel = document.createElement("div");
    panel.className = "ieFabPanel";
    panel.id = "ieFabPanel";

    const panelHead = document.createElement("div");
    panelHead.className = "ieFabPanelHead";

    const panelTitle = document.createElement("div");
    panelTitle.className = "ieFabPanelTitle";
    panelTitle.textContent = "เครื่องมือแก้ไขภาพ";

    const panelClose = document.createElement("button");
    panelClose.type = "button";
    panelClose.className = "btn ghost ieFabClose";
    panelClose.textContent = "ปิด";
    panelClose.addEventListener("click", closeFabPanel);

    panelHead.appendChild(panelTitle);
    panelHead.appendChild(panelClose);

    const primarySection = buildFabSection("หลัก", "cols2", [
      createFabButton({
        id: "ieFabSelectBtn",
        text: "เลือก",
        tool: "select",
        onClick: () => setActiveTool("select", true)
      }),
      createFabButton({
        id: "ieFabPanBtn",
        text: "เลื่อน",
        tool: "pan",
        onClick: () => setActiveTool("pan", true)
      }),
      createFabButton({
        id: "ieFabTextBtn",
        text: "ข้อความ",
        tool: "text",
        onClick: () => setActiveTool("text", true)
      }),
      createFabButton({
        id: "ieFabCropBtn",
        text: "ครอป",
        tool: "crop",
        onClick: () => setActiveTool("crop", true)
      })
    ]);

    const drawSection = buildFabSection("วาด / ทำเครื่องหมาย", "cols2", [
      createFabButton({
        id: "ieFabLineBtn",
        text: "เส้น",
        tool: "line",
        onClick: () => setActiveTool("line", true)
      }),
      createFabButton({
        id: "ieFabArrowBtn",
        text: "ลูกศร",
        tool: "arrow",
        onClick: () => setActiveTool("arrow", true)
      }),
      createFabButton({
        id: "ieFabRectBtn",
        text: "กรอบ",
        tool: "rect",
        onClick: () => setActiveTool("rect", true)
      }),
      createFabButton({
        id: "ieFabCircleBtn",
        text: "วงกลม",
        tool: "circle",
        onClick: () => setActiveTool("circle", true)
      })
    ]);

    const maskSection = buildFabSection("ปิดข้อมูลสำคัญ", "cols2", [
      createFabButton({
        id: "ieFabBlurRectBtn",
        text: "เบลอสี่",
        tool: "blurRect",
        onClick: () => setActiveTool("blurRect", true)
      }),
      createFabButton({
        id: "ieFabBlurCircleBtn",
        text: "เบลอวง",
        tool: "blurCircle",
        onClick: () => setActiveTool("blurCircle", true)
      }),
      createFabButton({
        id: "ieFabMosaicRectBtn",
        text: "โมเสกสี่",
        tool: "mosaicRect",
        onClick: () => setActiveTool("mosaicRect", true)
      }),
      createFabButton({
        id: "ieFabMosaicCircleBtn",
        text: "โมเสกวง",
        tool: "mosaicCircle",
        onClick: () => setActiveTool("mosaicCircle", true)
      })
    ]);

    const viewSection = buildFabSection("มุมมองภาพ", "cols2", [
      createFabButton({
        id: "ieFabZoomOutBtn",
        text: "ซูม-",
        onClick: () => setZoom(editorState.zoom - 0.1)
      }),
      createFabButton({
        id: "ieFabZoomResetBtn",
        text: "100%",
        onClick: () => resetViewport()
      }),
      createFabButton({
        id: "ieFabZoomInBtn",
        text: "ซูม+",
        onClick: () => setZoom(editorState.zoom + 0.1)
      }),
      createFabButton({
        id: "ieFabFitBtn",
        text: "พอดี",
        onClick: () => resetViewport()
      })
    ]);

    const manageSection = buildFabSection("จัดการภาพ", "cols2", [
      createFabButton({
        id: "ieFabUndoBtn",
        text: "ย้อน",
        onClick: () => undoHistory()
      }),
      createFabButton({
        id: "ieFabRedoBtn",
        text: "ทำซ้ำ",
        onClick: () => redoHistory()
      }),
      createFabButton({
        id: "ieFabDeleteBtn",
        text: "ลบ",
        onClick: () => deleteSelectedObject()
      }),
      createFabButton({
        id: "ieFabApplyCropBtn",
        text: "ใช้ครอป",
        className: "dark",
        onClick: () => applyCrop()
      }),
      createFabButton({
        id: "ieFabRotateLeftBtn",
        text: "หมุนซ้าย",
        onClick: () => rotateBaseImage(-90)
      }),
      createFabButton({
        id: "ieFabRotateRightBtn",
        text: "หมุนขวา",
        onClick: () => rotateBaseImage(90)
      })
    ]);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = "ieFabColorPicker";
    colorInput.value = editorState.strokeColor || "#dc2626";
    colorInput.addEventListener("input", (e) => {
      editorState.strokeColor = e.target.value || "#dc2626";
      const base = $("ieColorPicker");
      if (base) base.value = editorState.strokeColor;
    });

    const strokeInput = document.createElement("input");
    strokeInput.type = "range";
    strokeInput.min = "1";
    strokeInput.max = "12";
    strokeInput.step = "1";
    strokeInput.id = "ieFabStrokeWidth";
    strokeInput.value = String(editorState.strokeWidth || 3);
    strokeInput.addEventListener("input", (e) => {
      editorState.strokeWidth = Number(e.target.value || 3);
      const base = $("ieStrokeWidth");
      if (base) base.value = String(editorState.strokeWidth);
    });

    const brightInput = document.createElement("input");
    brightInput.type = "range";
    brightInput.min = "-1";
    brightInput.max = "1";
    brightInput.step = "0.05";
    brightInput.id = "ieFabBrightness";
    brightInput.value = "0";
    brightInput.addEventListener("input", (e) => {
      const base = $("ieBrightness");
      if (base) base.value = e.target.value;
      applyBrightness(e.target.value);
    });
    brightInput.addEventListener("change", () => {
      commitBrightnessToHistory();
    });

    const controlSection = buildFabSection("ตั้งค่า", "cols1", [
      createFabField("สี", colorInput),
      createFabField("เส้น", strokeInput),
      createFabField("แสง", brightInput)
    ]);

    panel.appendChild(panelHead);
    panel.appendChild(primarySection);
    panel.appendChild(drawSection);
    panel.appendChild(maskSection);
    panel.appendChild(viewSection);
    panel.appendChild(manageSection);
    panel.appendChild(controlSection);

    root.appendChild(backdrop);
    root.appendChild(launcher);
    root.appendChild(panel);
    body.appendChild(root);

    editorState.fabRoot = root;
    editorState.fabLauncher = launcher;
    editorState.fabPanel = panel;
    editorState.fabBackdrop = backdrop;

    syncControlValuesToFab();
    updateFabLauncherLabel();
    updateFabActiveButtons();
    updateUndoRedoState();
  }

  function bindUiOnce() {
    if (window.__imgEditorBoundOnce) return;
    window.__imgEditorBoundOnce = true;

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

    $("ieZoomInBtn")?.addEventListener("click", () => setZoom(editorState.zoom + 0.1));
    $("ieZoomOutBtn")?.addEventListener("click", () => setZoom(editorState.zoom - 0.1));
    $("ieZoomResetBtn")?.addEventListener("click", () => resetViewport());
    $("ieFitBtn")?.addEventListener("click", () => resetViewport());

    $("ieRotateLeftBtn")?.addEventListener("click", () => rotateBaseImage(-90));
    $("ieRotateRightBtn")?.addEventListener("click", () => rotateBaseImage(90));

    $("ieColorPicker")?.addEventListener("input", (e) => {
      editorState.strokeColor = e.target.value || "#dc2626";
      const fab = $("ieFabColorPicker");
      if (fab) fab.value = editorState.strokeColor;
    });

    $("ieStrokeWidth")?.addEventListener("input", (e) => {
      editorState.strokeWidth = Number(e.target.value || 3);
      const fab = $("ieFabStrokeWidth");
      if (fab) fab.value = String(editorState.strokeWidth);
    });

    $("ieBrightness")?.addEventListener("input", (e) => {
      applyBrightness(e.target.value);
      const fab = $("ieFabBrightness");
      if (fab) fab.value = e.target.value;
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
        syncControlValuesToFab();
        setActiveTool("select");
        pushHistorySnapshot(true);
      } catch (err) {
        console.error(err);
        showMessage("error", "รีเซ็ตภาพไม่สำเร็จ", err?.message || String(err));
      }
    });

    $("ieUndoBtn")?.addEventListener("click", () => undoHistory());
    $("ieRedoBtn")?.addEventListener("click", () => redoHistory());
    $("ieDeleteBtn")?.addEventListener("click", () => deleteSelectedObject());
    $("ieApplyCropBtn")?.addEventListener("click", () => applyCrop());

    document.addEventListener("keydown", (e) => {
      if (editorState.modal?.classList.contains("hidden")) return;
      if (e.key === "Escape") {
        if (editorState.fabPanel?.classList.contains("open")) {
          closeFabPanel();
        }
      }
    });
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

    if ($("ieColorPicker")) $("ieColorPicker").value = editorState.strokeColor;
    if ($("ieStrokeWidth")) $("ieStrokeWidth").value = String(editorState.strokeWidth);
    if ($("ieBrightness")) $("ieBrightness").value = "0";

    editorState.modal.classList.remove("hidden");
    editorState.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("progress-lock");

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

    ensureFabUi();
    closeFabPanel();
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
