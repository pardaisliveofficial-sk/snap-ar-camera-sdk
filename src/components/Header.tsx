import React from "react";
import {
  Camera,
  Sparkles,
  Bot,
  Image as ImageIcon,
  Mic,
  MicOff,
  Code,
  FolderOpen,
  Wand2,
  Terminal,
  Activity,
  Key,
  BookOpen,
  Download,
} from "lucide-react";
import { DashboardSection } from "../types";

interface HeaderProps {
  fps: number;
  resolution: string;
  onResolutionChange: (res: string) => void;
  isMicOn: boolean;
  onToggleMic: () => void;
  onOpenAiStylist: () => void;
  onOpenGallery: () => void;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  activeMaskName: string;
  galleryCount: number;
  cameraFacing: "user" | "environment";
  onToggleCameraFacing: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fps,
  resolution,
  onResolutionChange,
  isMicOn,
  onToggleMic,
  onOpenAiStylist,
  onOpenGallery,
  activeSection,
  onSelectSection,
  activeMaskName,
  galleryCount,
  cameraFacing,
  onToggleCameraFacing,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 text-white sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Logo & SDK Identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectSection("camera_preview")}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-rose-500 shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">
                  SnapAR Camera SDK
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  v2.4.0 Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Active Lens:</span>
                <span className="text-pink-400 font-semibold">{activeMaskName}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-mono text-[10px]">WebGL2 GPU</span>
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry & Quick Camera Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
          {/* Camera Facing Switch */}
          <button
            onClick={onToggleCameraFacing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all"
            title="Switch Front/Back Camera"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="capitalize">{cameraFacing === "user" ? "Front" : "Back"}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* FPS Gauge */}
          <div className="flex items-center gap-1 text-slate-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{fps}</span>
            <span className="text-[10px] text-slate-500">FPS</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Resolution Selector */}
          <select
            value={resolution}
            onChange={(e) => onResolutionChange(e.target.value)}
            className="bg-transparent text-slate-300 text-xs font-mono font-medium focus:outline-none cursor-pointer"
          >
            <option value="1080p" className="bg-slate-900 text-white">
              1080p (FHD)
            </option>
            <option value="720p" className="bg-slate-900 text-white">
              720p (HD)
            </option>
            <option value="4k" className="bg-slate-900 text-white">
              4K (UHD)
            </option>
          </select>
        </div>

        {/* Top Header Quick Nav Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
          {/* Mic Toggle */}
          <button
            onClick={onToggleMic}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            className={`p-2 rounded-xl transition-all border ${
              isMicOn
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-red-500/20 border-red-500/40 text-red-400"
            }`}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Playground Button */}
          <button
            onClick={() => onSelectSection("sdk_playground")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeSection === "sdk_playground"
                ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>SDK Sandbox</span>
          </button>

          {/* Lens Studio Button */}
          <button
            onClick={() => onSelectSection("lens_studio")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeSection === "lens_studio"
                ? "bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-900/40"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Lens Studio</span>
          </button>

          {/* API Keys */}
          <button
            onClick={() => onSelectSection("api_keys")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeSection === "api_keys"
                ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">API Keys</span>
          </button>

          {/* Docs */}
          <button
            onClick={() => onSelectSection("documentation")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeSection === "documentation"
                ? "bg-purple-600 text-white border-purple-400"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Docs</span>
          </button>

          {/* Downloads */}
          <button
            onClick={() => onSelectSection("sdk_downloads")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeSection === "sdk_downloads"
                ? "bg-pink-600 text-white border-pink-400"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">Downloads</span>
          </button>

          {/* AI Advisor Modal trigger */}
          <button
            onClick={onOpenAiStylist}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all border border-purple-400/30"
            title="AI Filter & Beauty Advisor"
          >
            <Bot className="w-3.5 h-3.5 text-pink-300 animate-bounce" />
            <span className="hidden xl:inline">AI Stylist</span>
          </button>

          {/* Media Gallery */}
          <button
            onClick={onOpenGallery}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
            title="Captured Media Gallery"
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
            {galleryCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900">
                {galleryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

