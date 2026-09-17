import { ArDiagnosticsData, ArFilterId, FaceLandmarksData } from "../types";
import { ArAssetRegistry } from "./ArAssetRegistry";
import { FilterAnchor, FilterLayer } from "./types";

export class ArFilterEngine {
  private registry: ArAssetRegistry;

  constructor() {
    this.registry = ArAssetRegistry.getInstance();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filterId: ArFilterId,
    landmarks: FaceLandmarksData,
    arEnabled: boolean,
    debugOverlay: boolean = false
  ): void {
    if (!arEnabled || filterId === "none" || !landmarks.faceDetected) {
      if (debugOverlay && landmarks.faceDetected) {
        this.renderDebugOverlay(ctx, width, height, landmarks, null);
      }
      return;
    }

    const filterPkg = this.registry.getFilter(filterId);
    if (!filterPkg) {
      if (debugOverlay && landmarks.faceDetected) {
        this.renderDebugOverlay(ctx, width, height, landmarks, null);
      }
      return;
    }

    ctx.save();

    const headW = landmarks.headWidth * width;
    const headH = landmarks.headHeight * height;
    const roll = landmarks.rollAngleRad;
    const yawDeg = landmarks.yawAngleDeg || 0;
    const pitchDeg = landmarks.pitchAngleDeg || 0;

    // Render each component layer from the asset package
    for (const layer of filterPkg.layers) {
      const anchorPos = this.getAnchorPosition(layer.anchor, landmarks, width, height, headW, headH);
      const layerW = headW * layer.size[0];
      const layerH = headW * layer.size[1];

      const posX = anchorPos.x + layer.offset[0] * headW;
      const posY = anchorPos.y + layer.offset[1] * headW;

      ctx.save();
      ctx.translate(posX, posY);

      // Roll rotation
      if (layer.followRoll !== false) {
        const rot = roll + (layer.rotationOffsetRad || 0);
        ctx.rotate(rot);
      }

      // Yaw foreshortening perspective
      if (layer.followYaw !== false && Math.abs(yawDeg) > 5) {
        const yawScale = Math.max(0.7, Math.cos((yawDeg * Math.PI) / 180));
        ctx.scale(yawScale, 1.0);
      }

      // Pitch vertical perspective
      if (layer.followPitch !== false && Math.abs(pitchDeg) > 5) {
        const pitchScale = Math.max(0.75, Math.cos((pitchDeg * Math.PI) / 180));
        ctx.scale(1.0, pitchScale);
      }

      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode;
      }
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity;
      }

      const texture = layer.getTexture();
      if (texture) {
        ctx.drawImage(texture, -layerW / 2, -layerH / 2, layerW, layerH);
      }

      ctx.restore();
    }

    // Execute custom dynamic render pass if package defines one (e.g. responsive whiskers, dynamic tongue, makeup)
    if (filterPkg.customRenderPass) {
      filterPkg.customRenderPass(ctx, width, height, landmarks);
    }

    ctx.restore();

    // Render Developer AR Debug Overlay if active
    if (debugOverlay) {
      this.renderDebugOverlay(ctx, width, height, landmarks, filterPkg);
    }
  }

  private renderDebugOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lm: FaceLandmarksData,
    filterPkg: any | null
  ): void {
    ctx.save();
    ctx.font = "bold 12px monospace";
    ctx.lineWidth = 2;

    const headW = lm.headWidth * width;
    const headH = lm.headHeight * height;

    // Draw Face Landmarks Markers (Forehead, Eyes, Nose, Mouth, Chin)
    const markers = [
      { name: "FOREHEAD", pt: lm.forehead, color: "#facc15" },
      { name: "L EYE", pt: lm.leftEye, color: "#38bdf8" },
      { name: "R EYE", pt: lm.rightEye, color: "#38bdf8" },
      { name: "NOSE", pt: lm.noseTip, color: "#f43f5e" },
      { name: "MOUTH", pt: lm.mouthCenter, color: "#fb923c" },
      { name: "CHIN", pt: lm.chin, color: "#4ade80" },
    ];

    for (const m of markers) {
      const px = m.pt.x * width;
      const py = m.pt.y * height;

      // Outer ring
      ctx.strokeStyle = m.color;
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center dot
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Label with background pill
      const text = `${m.name} (${Math.round(px)},${Math.round(py)})`;
      const textW = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(px + 10, py - 10, textW + 8, 18);
      ctx.strokeStyle = m.color;
      ctx.strokeRect(px + 10, py - 10, textW + 8, 18);

      ctx.fillStyle = m.color;
      ctx.fillText(text, px + 14, py + 3);
    }

    // Draw AR Anchor Bounding Boxes if filter package exists
    if (filterPkg && filterPkg.layers) {
      for (const layer of filterPkg.layers) {
        const anchorPos = this.getAnchorPosition(layer.anchor, lm, width, height, headW, headH);
        const layerW = headW * layer.size[0];
        const layerH = headW * layer.size[1];
        const posX = anchorPos.x + layer.offset[0] * headW;
        const posY = anchorPos.y + layer.offset[1] * headW;

        ctx.strokeStyle = "#a855f7"; // purple dashed box
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(posX - layerW / 2, posY - layerH / 2, layerW, layerH);
        ctx.setLineDash([]);

        // Layer anchor label
        const boxLabel = `[AR ANCHOR: ${layer.id} ${Math.round(layerW)}x${Math.round(layerH)}]`;
        ctx.fillStyle = "rgba(88, 28, 135, 0.85)";
        ctx.fillRect(posX - layerW / 2, posY - layerH / 2 - 18, ctx.measureText(boxLabel).width + 6, 16);
        ctx.fillStyle = "#f3e8ff";
        ctx.fillText(boxLabel, posX - layerW / 2 + 3, posY - layerH / 2 - 6);
      }
    }

    ctx.restore();
  }

  public getDiagnostics(filterId: ArFilterId, landmarks: FaceLandmarksData, arPixelsCount: number): ArDiagnosticsData {
    if (filterId === "none") {
      return {
        filterId,
        assetStatus: "LOADED",
        textureStatus: "VALID",
        dimensions: "N/A",
        alphaPresent: "NO",
        rendererDrawn: "NOT DRAWN",
        anchorStatus: "VALID",
        finalComposite: "NOT DETECTED",
        arRenderedPixels: 0,
      };
    }

    const pkg = this.registry.getFilter(filterId);
    if (!pkg) {
      return {
        filterId,
        assetStatus: "ERROR",
        textureStatus: "INVALID",
        dimensions: "0x0",
        alphaPresent: "NO",
        rendererDrawn: "NOT DRAWN",
        anchorStatus: "INVALID",
        finalComposite: "NOT DETECTED",
        arRenderedPixels: 0,
      };
    }

    // Inspect first layer texture
    let dims = "256x256";
    let textureValid = false;
    let alphaPresent = false;

    if (pkg.layers.length > 0) {
      const tex = pkg.layers[0].getTexture();
      if (tex && tex.width > 0 && tex.height > 0) {
        dims = `${tex.width}x${tex.height}`;
        textureValid = true;
        alphaPresent = true;
      }
    }

    const anchorValid = landmarks.faceDetected && landmarks.headWidth > 0;
    const rendererDrawn = (landmarks.faceDetected && textureValid && arPixelsCount > 0) ? "DRAWN" : "NOT DRAWN";
    const finalComposite = arPixelsCount > 0 ? "AR PIXELS DETECTED" : "NOT DETECTED";

    return {
      filterId,
      assetStatus: "LOADED",
      textureStatus: textureValid ? "VALID" : "INVALID",
      dimensions: dims,
      alphaPresent: alphaPresent ? "YES" : "NO",
      rendererDrawn,
      anchorStatus: anchorValid ? "VALID" : "INVALID",
      finalComposite,
      arRenderedPixels: arPixelsCount,
    };
  }

  private getAnchorPosition(
    anchor: FilterAnchor,
    lm: FaceLandmarksData,
    w: number,
    h: number,
    headW: number,
    headH: number
  ): { x: number; y: number } {
    switch (anchor) {
      case "forehead":
        return { x: lm.forehead.x * w, y: lm.forehead.y * h };
      case "head_top":
        return { x: lm.forehead.x * w, y: lm.forehead.y * h - headH * 0.22 };
      case "left_eye":
        return { x: lm.leftEye.x * w, y: lm.leftEye.y * h };
      case "right_eye":
        return { x: lm.rightEye.x * w, y: lm.rightEye.y * h };
      case "eyes_center":
        return {
          x: (lm.leftEye.x + lm.rightEye.x) * 0.5 * w,
          y: (lm.leftEye.y + lm.rightEye.y) * 0.5 * h,
        };
      case "nose_bridge":
        return {
          x: lm.noseTip.x * w,
          y: ((lm.leftEye.y + lm.rightEye.y) * 0.5 * 0.6 + lm.noseTip.y * 0.4) * h,
        };
      case "nose_tip":
        return { x: lm.noseTip.x * w, y: lm.noseTip.y * h };
      case "mouth_center":
        return { x: lm.mouthCenter.x * w, y: lm.mouthCenter.y * h };
      case "left_cheek":
        return { x: lm.leftCheek.x * w, y: lm.leftCheek.y * h };
      case "right_cheek":
        return { x: lm.rightCheek.x * w, y: lm.rightCheek.y * h };
      case "chin":
        return { x: lm.chin.x * w, y: lm.chin.y * h };
      default:
        return { x: lm.noseTip.x * w, y: lm.noseTip.y * h };
    }
  }
}

