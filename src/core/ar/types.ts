import { Point2D, FaceLandmarksData } from "../types";

export type FilterAnchor =
  | "forehead"
  | "head_top"
  | "left_eye"
  | "right_eye"
  | "eyes_center"
  | "nose_bridge"
  | "nose_tip"
  | "mouth_center"
  | "left_cheek"
  | "right_cheek"
  | "chin"
  | "face_mesh";

export type FilterBlendMode =
  | "source-over"
  | "screen"
  | "multiply"
  | "overlay"
  | "soft-light";

export interface FilterLayer {
  id: string;
  name: string;
  anchor: FilterAnchor;
  // Normalized offset relative to face size [dx, dy]
  offset: [number, number];
  // Normalized size relative to face size [widthRatio, heightRatio]
  size: [number, number];
  rotationOffsetRad?: number;
  followRoll?: boolean;
  followPitch?: boolean;
  followYaw?: boolean;
  blendMode?: FilterBlendMode;
  opacity?: number;
  // Dynamic behavior (e.g. mouth opening, blinking)
  dynamicTrigger?: "mouth_open" | "always" | "eyes_blink";
  // Generates or returns the high-definition canvas texture
  getTexture: () => HTMLCanvasElement | HTMLImageElement;
}

export interface ArFilterAssetPackage {
  id: string;
  name: string;
  description: string;
  category: "Animals" | "Fashion" | "Face Art" | "Beauty";
  layers: FilterLayer[];
  customRenderPass?: (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lm: FaceLandmarksData
  ) => void;
}
