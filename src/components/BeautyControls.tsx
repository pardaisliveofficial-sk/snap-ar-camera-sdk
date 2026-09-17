import React, { useState } from "react";
import { BeautyParameters } from "../types";
import { PRESET_BEAUTY_MODES } from "../data/presets";
import {
  Sparkles,
  SunMedium,
  Sliders,
  Wand2,
  Eye,
  Smile,
  Zap,
  RotateCcw,
  Aperture,
  Tv,
} from "lucide-react";

interface BeautyControlsProps {
  params: BeautyParameters;
  onChangeParams: (newParams: BeautyParameters) => void;
  onResetParams: () => void;
}

export const BeautyControls: React.FC<BeautyControlsProps> = ({
  params,
  onChangeParams,
  onResetParams,
}) => {
  const [activeTab, setActiveTab] = useState<"beauty" | "lighting" | "camera" | "presets">(
    "beauty"
  );

  const updateParam = (key: keyof BeautyParameters, value: any) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const applyPreset = (presetParams: Partial<BeautyParameters>) => {
    onChangeParams({
      ...params,
      ...presetParams,
    });
  };

  const tabs: { id: "beauty" | "lighting" | "camera" | "presets"; label: string; icon: any }[] = [
    { id: "beauty", label: "Skin & Beauty", icon: Sparkles },
    { id: "lighting", label: "Virtual Ring Light", icon: SunMedium },
    { id: "camera", label: "Camera Adjust", icon: Sliders },
    { id: "presets", label: "Quick Presets", icon: Wand2 },
  ];

  const lipColors = ["#ff4d6d", "#ff758f", "#ffb3c6", "#e63946", "#d90429", "#c77dff"];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-4 backdrop-blur-md">
      {/* Tab Header Bar & Reset Button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Reset Parameters Button */}
        <button
          onClick={onResetParams}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all shrink-0"
          title="Reset to default"
        >
          <RotateCcw className="w-3 h-3 text-pink-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* Tab 1: Skin & Beauty Enhancements */}
      {activeTab === "beauty" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Skin Smoothing Slider */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Skin Smoothing (Glass Skin)
              </span>
              <span className="text-pink-400 font-mono font-bold">{params.skinSmoothing}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.skinSmoothing}
              onChange={(e) => updateParam("skinSmoothing", Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Eye Brightening & Enlargement */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Eye Sparkle & Brightness
              </span>
              <span className="text-cyan-400 font-mono font-bold">{params.eyeBrightening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.eyeBrightening}
              onChange={(e) => updateParam("eyeBrightening", Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Face Slimming */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-purple-400" />
                Face Slimming & V-Line
              </span>
              <span className="text-purple-400 font-mono font-bold">{params.faceSlimming || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.faceSlimming || 0}
              onChange={(e) => updateParam("faceSlimming", Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Nose Slimming */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                Nose Slimming & Contour
              </span>
              <span className="text-indigo-400 font-mono font-bold">{params.noseSlimming || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.noseSlimming || 0}
              onChange={(e) => updateParam("noseSlimming", Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Lip Tint & Color Picker */}
          <div className="space-y-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-rose-400" />
                Lip Tint Intensity
              </span>
              <span className="text-rose-400 font-mono font-bold">{params.lipTint}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.lipTint}
              onChange={(e) => updateParam("lipTint", Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />

            {/* Lip Color Swatches */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Shade:</span>
              {lipColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => updateParam("lipColor", hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    params.lipColor === hex ? "scale-125 ring-2 ring-white" : "opacity-80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Virtual Ring Light Controls */}
      {activeTab === "lighting" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-200">Virtual Soft Ring Light</p>
              <p className="text-[10px] text-slate-400">
                Adds soft fill lighting and ring reflections in your eyes.
              </p>
            </div>
            <button
              onClick={() => updateParam("virtualRingLight", !params.virtualRingLight)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                params.virtualRingLight
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {params.virtualRingLight ? "RING LIGHT ON" : "OFF"}
            </button>
          </div>

          {params.virtualRingLight && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ring Light Intensity */}
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Light Intensity</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {params.ringLightIntensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.ringLightIntensity}
                  onChange={(e) => updateParam("ringLightIntensity", Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              {/* Ring Light Color Temperature */}
              <div className="space-y-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                <p className="text-xs font-bold text-slate-200">Ring Light Color</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "white", label: "Studio White", color: "#ffffff" },
                    { id: "warm", label: "Warm Gold", color: "#ffd166" },
                    { id: "pink", label: "Soft Pink", color: "#ffb3c6" },
                    { id: "cyan", label: "Ice Cyan", color: "#80e5ff" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateParam("ringLightColor", c.id)}
                      className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        params.ringLightColor === c.id
                          ? "bg-slate-700 border-amber-400 text-white"
                          : "bg-slate-800/60 border-slate-700 text-slate-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Camera Color & Quality Adjustments */}
      {activeTab === "camera" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sharpening */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">AI Sharpening</span>
              <span className="text-emerald-400 font-mono font-bold">{params.sharpening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.sharpening}
              onChange={(e) => updateParam("sharpening", Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Exposure / Brightness</span>
              <span className="text-amber-400 font-mono font-bold">{params.brightness}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="140"
              value={params.brightness}
              onChange={(e) => updateParam("brightness", Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Color Saturation</span>
              <span className="text-purple-400 font-mono font-bold">{params.saturation}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="180"
              value={params.saturation}
              onChange={(e) => updateParam("saturation", Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Warmth */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Color Warmth</span>
              <span className="text-orange-400 font-mono font-bold">{params.warmth}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              value={params.warmth}
              onChange={(e) => updateParam("warmth", Number(e.target.value))}
              className="w-full accent-orange-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Vignette */}
          <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Lens Vignette</span>
              <span className="text-pink-400 font-mono font-bold">{params.vignette}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={params.vignette}
              onChange={(e) => updateParam("vignette", Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Tab 4: 1-Tap Quick Beauty Presets */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_BEAUTY_MODES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.params)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 hover:border-pink-500/50 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{preset.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
