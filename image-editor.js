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
    restoringHistory: false
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
  }

  function setActiveButtonByTool(tool) {
    document.querySelectorAll(".ie-tool").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tool") === tool);
    });
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
        return;
      }

      obj.selectable = (tool === "select");
      obj.evented = true;
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
    const center = canvas.getCenter();
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
      selectable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    pushHistorySnapshot();
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
      objectCaching: false
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
        : (effectType === "blur" ? "blurRect" : "mosaicRect")
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
      if (!overlay) {
        throw new Error("สร้างเอฟเฟกต์ไม่สำเร็จ");
      }

      canvas.remove(active);
      canvas.add(overlay);
      canvas.setActiveObject(overlay);
      canvas.requestRenderAll();
      pushHistorySnapshot();
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

    if (undoBtn) undoBtn.disabled = !(editorState.historyIndex > 0);
    if (redoBtn) redoBtn.disabled = !(editorState.historyIndex < editorState.history.length - 1);
  }

  function bindObjectEvents() {
    const canvas = editorState.canvas;
    if (!canvas) return;

    canvas.on("object:modified", () => {
      if (editorState.restoringHistory) return;
      pushHistorySnapshot();
    });
  }

  function bindPointerDrawing() {
    const canvas = editorState.canvas;
    if (!canvas) return;

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

      const pointer = canvas.getPointer(evt);
      startX = pointer.x;
      startY = pointer.y;

      const tool = editorState.activeTool;

      if (tool === "line" || tool === "arrow") {
        drawingObject = new fabric.Line([startX, startY, startX, startY], {
          stroke: editorState.strokeColor,
          strokeWidth: editorState.strokeWidth,
          selectable: false,
          evented: false,
          objectCaching: false
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
          objectCaching: false
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
          objectCaching: false
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

      const pointer = canvas.getPointer(evt);
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
        return;
      }

      if (tool === "line" || tool === "rect" || tool === "circle") {
        draft.set({
          selectable: true,
          evented: true
        });
        canvas.setActiveObject(draft);
        canvas.requestRenderAll();
        pushHistorySnapshot();
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

  if (typeof canvas.requestRenderAll === "function") {
    canvas.requestRenderAll();
  } else if (typeof canvas.renderAll === "function") {
    canvas.renderAll();
  }
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

  function ensureExtraControls() {
    const toolbar = document.querySelector(".imgEditorToolbar");
    const footerActions = document.querySelector(".imgEditorActions");
    if (!toolbar || !footerActions) return;

    function ensureBtn(container, id, text, className = "btn ghost", attrs = {}) {
      let btn = $(id);
      if (btn) return btn;

      btn = document.createElement("button");
      btn.type = "button";
      btn.id = id;
      btn.className = className;
      btn.textContent = text;

      Object.keys(attrs || {}).forEach((k) => {
        btn.setAttribute(k, attrs[k]);
      });

      container.appendChild(btn);
      return btn;
    }

    function ensureDivider(container) {
      const div = document.createElement("div");
      div.className = "ieDivider";
      container.appendChild(div);
    }

    if (!$("ieUndoBtn")) {
      ensureDivider(toolbar);
      ensureBtn(toolbar, "ieUndoBtn", "ย้อนกลับ");
      ensureBtn(toolbar, "ieRedoBtn", "ทำซ้ำ");
      ensureBtn(toolbar, "ieDeleteBtn", "ลบที่เลือก");
    }

    if (!$("ieCropToolBtn")) {
      ensureDivider(toolbar);
      const cropBtn = ensureBtn(toolbar, "ieCropToolBtn", "ครอป");
      cropBtn.classList.add("ie-tool");
      cropBtn.setAttribute("data-tool", "crop");

      ensureBtn(toolbar, "ieApplyCropBtn", "ใช้ครอป");
    }

    if (!$("ieBlurRectBtn")) {
      ensureDivider(toolbar);

      const b1 = ensureBtn(toolbar, "ieBlurRectBtn", "เบลอสี่เหลี่ยม");
      b1.classList.add("ie-tool");
      b1.setAttribute("data-tool", "blurRect");

      const b2 = ensureBtn(toolbar, "ieBlurCircleBtn", "เบลอวงกลม");
      b2.classList.add("ie-tool");
      b2.setAttribute("data-tool", "blurCircle");

      const m1 = ensureBtn(toolbar, "ieMosaicRectBtn", "โมเสกสี่เหลี่ยม");
      m1.classList.add("ie-tool");
      m1.setAttribute("data-tool", "mosaicRect");

      const m2 = ensureBtn(toolbar, "ieMosaicCircleBtn", "โมเสกวงกลม");
      m2.classList.add("ie-tool");
      m2.setAttribute("data-tool", "mosaicCircle");
    }

    if (!$("ieFitBtn")) {
      ensureBtn(footerActions, "ieFitBtn", "พอดีจอ");
    }
  }

  function bindUiOnce() {
    if (window.__imgEditorBoundOnce) return;
    window.__imgEditorBoundOnce = true;

    ensureExtraControls();

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

    document.querySelectorAll(".ie-tool").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool") || "select";
        setActiveTool(tool);
      });
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
      editorState.canvas.calcOffset();
      editorState.canvas.requestRenderAll();
    }

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
