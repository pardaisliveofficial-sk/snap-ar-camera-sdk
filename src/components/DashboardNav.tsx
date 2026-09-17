import React from "react";
import {
  Camera,
  Sparkles,
  Wand2,
  ScanFace,
  Sliders,
  FolderOpen,
  Terminal,
  Key,
  Download,
  BookOpen,
  Layers,
  Activity,
  ShoppingBag,
  Zap,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { DashboardSection } from "../types";

interface DashboardNavProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const sections: { id: DashboardSection; label: string; icon: any; tag?: string }[] = [
    { id: "test_lab", label: "AR Camera Test Lab", icon: FlaskConical, tag: "Live 3-Layer" },
    { id: "test_report", label: "Test Report", icon: ShieldCheck, tag: "19 Tests" },
    { id: "camera_preview", label: "Camera Preview", icon: Camera },
    { id: "filter_library", label: "Filter Library", icon: Sparkles, tag: "12 AR Filters" },
    { id: "beauty_studio", label: "Beauty Studio", icon: Sliders, tag: "Skin & Mesh" },
    { id: "lens_studio", label: "Lens Editor", icon: Wand2, tag: "3D AR Studio" },
    { id: "ai_filter_builder", label: "AI Filter Builder", icon: Zap, tag: "Prompt to Filter" },
    { id: "marketplace", label: "Filter Marketplace", icon: ShoppingBag, tag: "Store" },
    { id: "face_tracking", label: "AI Face Tracking", icon: ScanFace, tag: "468 Mesh" },
    { id: "camera_settings", label: "Camera Settings", icon: Sliders, tag: "4K / 60FPS" },
    { id: "asset_manager", label: "Asset Manager", icon: FolderOpen, tag: "3D & Vector" },
    { id: "sdk_playground", label: "SDK Playground", icon: Terminal, tag: "Interactive" },
    { id: "api_keys", label: "API Keys", icon: Key, tag: "Auth & Sec" },
    { id: "sdk_downloads", label: "SDK Download Center", icon: Download, tag: "Flutter/Native" },
    { id: "documentation", label: "Documentation", icon: BookOpen, tag: "API Specs" },
    { id: "sample_integration", label: "Sample Integration", icon: Layers, tag: "6 Platforms" },
    { id: "performance_monitor", label: "Performance Analyzer", icon: Activity, tag: "GPU Metrics" },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-xl shadow-xl overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/30 border border-pink-400/40"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-400 group-hover:scale-110"} transition-transform`} />
              <span>{sec.label}</span>
              {sec.tag && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800"
                  }`}
                >
                  {sec.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
