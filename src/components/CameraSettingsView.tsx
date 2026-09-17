import React from "react";
import { Sliders, Camera, Monitor, Cpu, Radio, ShieldCheck, Zap, RefreshCw, Volume2, VolumeX } from "lucide-react";

interface CameraSettingsViewProps {
  cameraFacing: "user" | "environment";
  onToggleCameraFacing: () => void;
  resolution: string;
  onResolutionChange: (res: string) => void;
  fps: number;
  isMicOn: boolean;
  onToggleMic: () => void;
}

export const CameraSettingsView: React.FC<CameraSettingsViewProps> = ({
  cameraFacing,
  onToggleCameraFacing,
  resolution,
  onResolutionChange,
  fps,
  isMicOn,
  onToggleMic,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-bold text-white">SDK Camera & Pipeline Settings</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Hardware Controls
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure raw video input stream capturing, GPU rendering engine, and frame output pipeline specifications.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Camera Facing Selector */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Camera className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-sm">Active Camera Lens</h3>
          </div>
          <p className="text-xs text-slate-400">
            Switch between front self-portrait sensor and rear back ultra-wide/telephoto sensor.
          </p>

          <button
            onClick={onToggleCameraFacing}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-900/30 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch to {cameraFacing === "user" ? "Back Camera" : "Front Camera"}</span>
          </button>
        </div>

        {/* Video Resolution Output */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm">Capture Resolution</h3>
          </div>
          <p className="text-xs text-slate-400">
            Choose output resolution for third-party streaming, recording, or WebRTC encoding.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "720p", label: "720p HD", res: "1280x720" },
              { id: "1080p", label: "1080p FHD", res: "1920x1080" },
              { id: "4k", label: "4K UHD", res: "3840x2160" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => onResolutionChange(r.id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  resolution === r.id
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-900/30"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="font-bold">{r.label}</div>
                <div className="text-[9px] font-mono opacity-70">{r.res}</div>
              </button>
            ))}
          </div>
        </div>

        {/* GPU Rendering Engine */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">GPU Pipeline Engine</h3>
          </div>
          <p className="text-xs text-slate-400">
            Hardware acceleration backend powering shader shaders and 3D matrix math.
          </p>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-emerald-400">WebGL2 + WASM Engine</p>
              <p className="text-[10px] text-slate-400">Hardware Direct Texture Binding</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 font-bold">
              60 FPS
            </span>
          </div>
        </div>

        {/* Audio Mic Capture Switch */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              {isMicOn ? <Volume2 className="w-5 h-5 text-indigo-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              <h3 className="font-bold text-sm">Microphone Input</h3>
            </div>
            <button
              onClick={onToggleMic}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                isMicOn
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isMicOn ? "MUTED" : "UNMUTED"}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Pass pristine audio stream through SDK audio nodes or bypass to main system mixer.
          </p>
        </div>

        {/* Frame Latency & Buffer Mode */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Latency & Buffer Mode</h3>
          </div>
          <p className="text-xs text-slate-400">
            Zero-copy texture pass-through optimized for live video call and WebRTC streams.
          </p>

          <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Target Latency:</span>
            <span className="text-amber-400 font-bold">&lt; 2.5 ms</span>
          </div>
        </div>

        {/* SDK Security & Domain Sandbox */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">SDK Licensing & Security</h3>
          </div>
          <p className="text-xs text-slate-400">
            Validates active enterprise app key, origin domain whitelist, and bundle ID checksums.
          </p>

          <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">License Key:</span>
            <span className="text-emerald-400 font-bold">VALID (PRO)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
