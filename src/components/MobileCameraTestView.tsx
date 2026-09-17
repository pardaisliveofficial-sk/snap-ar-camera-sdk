import React, { useMemo, useState } from "react";
import { Camera, FlipHorizontal, RotateCcw, Sparkles, SlidersHorizontal, Wand2, X, Check } from "lucide-react";
import { AR_MASKS, DEFAULT_BEAUTY_PARAMS, PRESET_BEAUTY_MODES } from "../data/presets";
import { ARMaskId, BeautyParameters, CapturedMedia } from "../types";
import { CameraView } from "./CameraView";

interface Props {
  activeMaskId: ARMaskId;
  onSelectMask: (id: ARMaskId) => void;
  beautyParams: BeautyParameters;
  onChangeBeauty: (p: BeautyParameters) => void;
  cameraFacing: "user" | "environment";
  onToggleCameraFacing: () => void;
  onCapture: (m: CapturedMedia) => void;
  onExit: () => void;
}

type Tab = "filters" | "beauty" | "adjust";

export const MobileCameraTestView: React.FC<Props> = ({
  activeMaskId,
  onSelectMask,
  beautyParams,
  onChangeBeauty,
  cameraFacing,
  onToggleCameraFacing,
  onCapture,
  onExit,
}) => {
  const [tab, setTab] = useState<Tab>("filters");
  const [showSheet, setShowSheet] = useState(true);

  const update = (key: keyof BeautyParameters, value: any) => {
    onChangeBeauty({ ...beautyParams, [key]: value });
  };

  const featured = useMemo(() => AR_MASKS, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      <CameraView
        mobileMode
        activeMaskId={activeMaskId}
        beautyParams={beautyParams}
        cameraFacing={cameraFacing}
        onToggleCameraFacing={onToggleCameraFacing}
        onCapture={onCapture}
      />

      {/* Close / status */}
      <div className="absolute top-0 left-0 z-[110] pt-[calc(env(safe-area-inset-top)+12px)] pl-4 pointer-events-auto">
        <button onClick={onExit} className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-95">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Face / pipeline status */}
      <div className="absolute top-0 right-0 z-[110] pt-[calc(env(safe-area-inset-top)+62px)] pr-4 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[10px] font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE PROCESSING
        </div>
      </div>

      {/* Bottom mobile camera UI */}
      {showSheet && (
        <div className="absolute inset-x-0 bottom-0 z-[120] pointer-events-auto pb-[env(safe-area-inset-bottom)]">
          <div className="mx-2 mb-2 rounded-[26px] bg-black/78 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Active selection line */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Mobile Test Preview</p>
                <p className="text-sm font-bold mt-0.5">
                  {activeMaskId === "none" ? "Natural Camera" : (AR_MASKS.find(m => m.id === activeMaskId)?.name || activeMaskId)}
                </p>
              </div>
              <button onClick={() => setShowSheet(false)} className="text-white/50 text-[10px] px-2 py-1 rounded-full bg-white/5">Hide</button>
            </div>

            {/* Tabs */}
            <div className="px-2 pb-2 grid grid-cols-3 gap-1">
              {([
                ["filters", Sparkles, "Filters"],
                ["beauty", Wand2, "Beauty"],
                ["adjust", SlidersHorizontal, "Adjust"],
              ] as const).map(([id, Icon, label]) => (
                <button key={id} onClick={() => setTab(id)} className={`py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 ${tab === id ? "bg-white text-black" : "bg-white/6 text-white/65"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {tab === "filters" && (
              <div className="px-3 pb-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1">
                  {featured.map((mask) => {
                    const active = activeMaskId === mask.id;
                    return (
                      <button key={mask.id} onClick={() => onSelectMask(mask.id)} className={`snap-start shrink-0 w-[76px] ${active ? "text-white" : "text-white/55"}`}>
                        <div className={`w-[76px] h-[76px] rounded-2xl flex items-center justify-center border ${active ? "border-white bg-white/12 ring-2 ring-white/20" : "border-white/10 bg-white/5"}`}>
                          <span className="text-2xl">{mask.id === "none" ? "◉" : mask.id === "cute_puppy" ? "🐶" : mask.id === "kawaii_cat" ? "🐱" : mask.id === "flower_crown" ? "🌼" : mask.id === "angel_wings" ? "😇" : mask.id === "heart_aura" ? "💗" : mask.id === "soft_glam" ? "✨" : mask.id === "golden_hour" ? "☀️" : mask.id === "neon_cyber" ? "🕶️" : mask.id === "vhs_retro" ? "📼" : mask.id === "sparkle_halo" ? "💎" : "🟢"}</span>
                        </div>
                        <p className="text-[10px] font-semibold mt-1.5 truncate">{mask.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "beauty" && (
              <div className="px-3 pb-4 space-y-3 max-h-[245px] overflow-y-auto no-scrollbar">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {PRESET_BEAUTY_MODES.map((preset) => (
                    <button key={preset.name} onClick={() => onChangeBeauty({ ...beautyParams, ...preset.params })} className="shrink-0 px-3 py-2 rounded-xl bg-white/7 border border-white/10 text-[10px] font-bold">{preset.name}</button>
                  ))}
                  <button onClick={() => onChangeBeauty(DEFAULT_BEAUTY_PARAMS)} className="shrink-0 px-3 py-2 rounded-xl bg-white/7 border border-white/10 text-[10px] font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Reset</button>
                </div>
                {[
                  ["Skin Smoothing", "skinSmoothing"],
                  ["Glow", "skinToneGlow"],
                  ["Face Slim", "faceSlimming"],
                  ["Eye Bright", "eyeBrightening"],
                  ["Eye Size", "eyeEnlargement"],
                  ["Nose Slim", "noseSlimming"],
                  ["Lip Tint", "lipTint"],
                  ["Teeth", "teethWhitening"],
                ].map(([label, key]) => (
                  <label key={key} className="block">
                    <div className="flex justify-between text-[10px] mb-1 text-white/70"><span>{label}</span><span className="font-mono text-white">{Number(beautyParams[key as keyof BeautyParameters]) || 0}%</span></div>
                    <input type="range" min="0" max="100" value={Number(beautyParams[key as keyof BeautyParameters]) || 0} onChange={e => update(key as keyof BeautyParameters, Number(e.target.value))} className="w-full accent-white" />
                  </label>
                ))}
              </div>
            )}

            {tab === "adjust" && (
              <div className="px-3 pb-4 space-y-3 max-h-[245px] overflow-y-auto no-scrollbar">
                {[
                  ["Brightness", "brightness", 50, 150],
                  ["Contrast", "contrast", 50, 150],
                  ["Saturation", "saturation", 0, 200],
                  ["Sharpening", "sharpening", 0, 100],
                  ["Warmth", "warmth", -50, 50],
                ].map(([label, key, min, max]) => (
                  <label key={key} className="block">
                    <div className="flex justify-between text-[10px] mb-1 text-white/70"><span>{label}</span><span className="font-mono text-white">{Number(beautyParams[key as keyof BeautyParameters]) || 0}</span></div>
                    <input type="range" min={Number(min)} max={Number(max)} value={Number(beautyParams[key as keyof BeautyParameters]) || 0} onChange={e => update(key as keyof BeautyParameters, Number(e.target.value))} className="w-full accent-white" />
                  </label>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={onToggleCameraFacing} className="py-2.5 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-2"><FlipHorizontal className="w-4 h-4"/> Switch Camera</button>
                  <button onClick={() => onChangeBeauty(DEFAULT_BEAUTY_PARAMS)} className="py-2.5 rounded-xl bg-white/7 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"><Check className="w-4 h-4"/> Reset All</button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom mode bar */}
          <div className="mx-6 grid grid-cols-3 items-center text-center text-[10px] font-semibold text-white/55">
            <span className={tab === "filters" ? "text-white" : ""}>FILTERS</span>
            <span className="text-white/85">CAMERA</span>
            <span className={tab === "beauty" ? "text-white" : ""}>BEAUTY</span>
          </div>
        </div>
      )}

      {!showSheet && (
        <button onClick={() => setShowSheet(true)} className="absolute bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 -translate-x-1/2 z-[130] px-5 py-3 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 text-xs font-bold pointer-events-auto">
          Open Camera Controls
        </button>
      )}
    </div>
  );
};
