import React, { useState } from "react";
import {
  X,
  Layers,
  Plus,
  Trash2,
  Move,
  RotateCw,
  Maximize2,
  Sparkles,
  Upload,
  Download,
  Send,
  Eye,
  Sliders,
  CheckCircle2,
  Box,
  Image as ImageIcon,
  Type,
  Zap,
  Play,
  FileCode,
  Smile,
} from "lucide-react";
import { FaceAnchorPoint, LensElement, LensProject, TriggerEvent } from "../types";

interface LensStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCustomLens: (elements: LensElement[]) => void;
}

const DEFAULT_ELEMENTS: LensElement[] = [
  {
    id: "elem_1",
    name: "Crown & Sparkles",
    type: "2d_overlay",
    anchor: "forehead",
    assetUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop",
    offsetX: 0,
    offsetY: -35,
    scale: 1.2,
    rotation: 0,
    opacity: 100,
    trigger: "always",
    animated: true,
  },
  {
    id: "elem_2",
    name: "Neon Eye Cyber Lines",
    type: "svg_vector",
    anchor: "bothEyes",
    assetUrl: "",
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
    rotation: 0,
    opacity: 90,
    trigger: "blink",
    color: "#00f0ff",
  },
  {
    id: "elem_3",
    name: "Golden Hearts Particle Cloud",
    type: "particle_emitter",
    anchor: "cheeks",
    assetUrl: "",
    offsetX: 0,
    offsetY: 10,
    scale: 1.5,
    rotation: 0,
    opacity: 85,
    trigger: "smile",
    color: "#ff3366",
  },
];

export const LensStudioModal: React.FC<LensStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyCustomLens,
}) => {
  const [project, setProject] = useState<LensProject>({
    id: "proj_custom_01",
    name: "Cyber Neon Glow Lens",
    category: "AR Face Filter",
    description: "Custom interactive Snapchat lens built in SnapStream Lens Studio",
    elements: DEFAULT_ELEMENTS,
    author: "Snap Developer",
    status: "Draft",
    updatedAt: new Date().toISOString(),
  });

  const [selectedElementId, setSelectedElementId] = useState<string>(DEFAULT_ELEMENTS[0].id);
  const [activeTab, setActiveTab] = useState<"editor" | "publish" | "export">("editor");
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const selectedElement = project.elements.find((e) => e.id === selectedElementId) || project.elements[0];

  const handleUpdateElement = (id: string, updates: Partial<LensElement>) => {
    setProject((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const handleAddElement = (type: LensElement["type"]) => {
    const newEl: LensElement = {
      id: `elem_${Date.now()}`,
      name: `New ${type.replace("_", " ")} Layer`,
      type,
      anchor: "forehead",
      assetUrl: "",
      offsetX: 0,
      offsetY: 0,
      scale: 1.0,
      rotation: 0,
      opacity: 100,
      trigger: "always",
      color: "#ff007f",
    };
    setProject((prev) => ({
      ...prev,
      elements: [...prev.elements, newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  const handleDeleteElement = (id: string) => {
    if (project.elements.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedElementId === id) {
      const remaining = project.elements.filter((el) => el.id !== id);
      if (remaining.length > 0) setSelectedElementId(remaining[0].id);
    }
  };

  const handlePublishFilter = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/v1/filter/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterId: project.id,
          filterName: project.name,
          targetPlatforms: ["iOS", "Android", "Web", "Flutter", "OBS"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPublished(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportPackage = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}.lens.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  className="bg-transparent text-sm sm:text-base font-bold text-white focus:bg-slate-800 px-2 py-0.5 rounded border border-transparent focus:border-purple-500 outline-none"
                />
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 font-semibold">
                  Lens Studio Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">Visual AR Filter Authoring Platform • 468 Face Mesh Landmarks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onApplyCustomLens(project.elements)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Live Preview
            </button>

            <button
              onClick={handleExportPackage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export .lens
            </button>

            <button
              onClick={handlePublishFilter}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-pink-900/30"
            >
              <Send className="w-3.5 h-3.5" />
              {isPublishing ? "Publishing..." : isPublished ? "Published!" : "Publish Filter"}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-900/50">
          {/* Left Column: Layers & Object Hierarchy */}
          <div className="md:col-span-3 border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" /> Layer Stack ({project.elements.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddElement("2d_overlay")}
                  title="Add 2D Image Overlay"
                  className="p-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAddElement("svg_vector")}
                  title="Add Vector Object"
                  className="p-1 rounded-lg bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white transition-all"
                >
                  <Box className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAddElement("particle_emitter")}
                  title="Add Particle Emitter"
                  className="p-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Elements List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {project.elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-white shadow-md shadow-pink-500/10"
                        : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {el.type === "2d_overlay" && <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />}
                      {el.type === "svg_vector" && <Box className="w-4 h-4 text-cyan-400 shrink-0" />}
                      {el.type === "particle_emitter" && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
                      {el.type === "3d_model" && <Box className="w-4 h-4 text-purple-400 shrink-0" />}
                      <div>
                        <div className="text-xs font-semibold truncate">{el.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          Anchor: {el.anchor} • {el.trigger}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteElement(el.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Buttons */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Add Element
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddElement("2d_overlay")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/50"
                >
                  <Plus className="w-3 h-3 text-pink-400" /> 2D Image
                </button>
                <button
                  onClick={() => handleAddElement("particle_emitter")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/50"
                >
                  <Plus className="w-3 h-3 text-purple-400" /> Particles
                </button>
              </div>
            </div>
          </div>

          {/* Center Column: Face Mesh Viewport & Anchor Visualizer */}
          <div className="md:col-span-5 bg-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Face Mesh Viewport Simulator */}
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl border-2 border-dashed border-pink-500/30 bg-slate-900/80 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
              {/* Simulated Head Model Silhouette & 468 Landmark Mesh Grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <svg viewBox="0 0 200 260" className="w-full h-full text-pink-400 stroke-current fill-none">
                  <ellipse cx="100" cy="130" rx="65" ry="90" strokeWidth="1.5" strokeDasharray="3 3" />
                  <ellipse cx="75" cy="110" rx="12" ry="7" strokeWidth="1" />
                  <ellipse cx="125" cy="110" rx="12" ry="7" strokeWidth="1" />
                  <path d="M100 115 L100 145 L90 155 L110 155 Z" strokeWidth="1" />
                  <path d="M75 180 Q100 195 125 180" strokeWidth="1.5" />
                  {/* Face Mesh Grid Dots */}
                  <circle cx="100" cy="60" r="2" className="fill-pink-400" />
                  <circle cx="75" cy="110" r="2" className="fill-cyan-400" />
                  <circle cx="125" cy="110" r="2" className="fill-cyan-400" />
                  <circle cx="100" cy="150" r="2" className="fill-emerald-400" />
                  <circle cx="100" cy="180" r="2" className="fill-pink-400" />
                  <circle cx="100" cy="210" r="2" className="fill-purple-400" />
                </svg>
              </div>

              {/* Render Selected Layer Element Overlay Preview */}
              {project.elements.map((el) => {
                const isSel = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    style={{
                      transform: `translate(${el.offsetX}px, ${el.offsetY}px) scale(${el.scale}) rotate(${el.rotation}deg)`,
                      opacity: el.opacity / 100,
                    }}
                    className={`absolute transition-all cursor-move flex items-center justify-center ${
                      isSel ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-950 rounded-lg p-1" : ""
                    }`}
                  >
                    {el.type === "2d_overlay" && el.assetUrl ? (
                      <img src={el.assetUrl} alt={el.name} className="w-20 h-20 object-contain rounded-lg" />
                    ) : el.type === "particle_emitter" ? (
                      <div className="flex items-center gap-1 text-pink-400 animate-pulse">
                        <Sparkles className="w-8 h-8" />
                        <Sparkles className="w-6 h-6 text-purple-400" />
                      </div>
                    ) : (
                      <div
                        className="px-3 py-1.5 rounded-full border text-xs font-bold shadow-lg"
                        style={{
                          backgroundColor: `${el.color || "#ff007f"}22`,
                          borderColor: el.color || "#ff007f",
                          color: el.color || "#ff007f",
                        }}
                      >
                        {el.name}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Landmark Anchor Tag */}
              <div className="absolute bottom-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[10px] text-pink-400 font-mono font-bold">
                Target Anchor: {selectedElement.anchor}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Target face landmark anchors automatically tracking 468 MediaPipe Face Points at 60 FPS
            </p>
          </div>

          {/* Right Column: Element Inspector & Parameters */}
          <div className="md:col-span-4 border-l border-slate-800 bg-slate-950/80 p-4 flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-pink-400" /> Inspector Panel
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {selectedElement.type}
              </span>
            </div>

            {/* Element Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Layer Name</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => handleUpdateElement(selectedElement.id, { name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none"
              />
            </div>

            {/* Target Landmark Anchor */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Face Attachment Point</label>
              <select
                value={selectedElement.anchor}
                onChange={(e) =>
                  handleUpdateElement(selectedElement.id, { anchor: e.target.value as FaceAnchorPoint })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none"
              >
                <option value="forehead">Forehead / Crown</option>
                <option value="leftEye">Left Eye</option>
                <option value="rightEye">Right Eye</option>
                <option value="bothEyes">Both Eyes / Glasses</option>
                <option value="noseTip">Nose Tip / Snout</option>
                <option value="mouthCenter">Mouth / Lips</option>
                <option value="chin">Chin / Beard</option>
                <option value="cheeks">Cheeks / Blush</option>
                <option value="fullHead">Full Head Mask</option>
                <option value="screenBackground">Screen Background / Sky</option>
              </select>
            </div>

            {/* Trigger Event */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Animation Trigger Event
              </label>
              <select
                value={selectedElement.trigger}
                onChange={(e) =>
                  handleUpdateElement(selectedElement.id, { trigger: e.target.value as TriggerEvent })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none"
              >
                <option value="always">Always Visible</option>
                <option value="smile">Trigger on Smile</option>
                <option value="blink">Trigger on Eye Blink</option>
                <option value="mouthOpen">Trigger on Mouth Open</option>
                <option value="headTilt">Trigger on Head Tilt</option>
              </select>
            </div>

            {/* Transform Controls */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Transform & Offset
              </span>

              {/* Offset X & Y */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Offset X</span>
                    <span>{selectedElement.offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={selectedElement.offsetX}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, { offsetX: parseInt(e.target.value) })
                    }
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Offset Y</span>
                    <span>{selectedElement.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={selectedElement.offsetY}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, { offsetY: parseInt(e.target.value) })
                    }
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              {/* Scale & Rotation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Scale</span>
                    <span>{selectedElement.scale}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={selectedElement.scale}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, { scale: parseFloat(e.target.value) })
                    }
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Rotation</span>
                    <span>{selectedElement.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedElement.rotation}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })
                    }
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span>{selectedElement.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedElement.opacity}
                  onChange={(e) =>
                    handleUpdateElement(selectedElement.id, { opacity: parseInt(e.target.value) })
                  }
                  className="w-full accent-pink-500"
                />
              </div>

              {/* Accent Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Accent Tint Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.color || "#ff007f"}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.color || "#ff007f"}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & published banner */}
        {isPublished && (
          <div className="px-4 py-2 bg-emerald-500/20 border-t border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Lens successfully published to SnapStream Cloud Network! Available on API and mobile SDKs.
            </span>
            <span className="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
              ID: {project.id}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
