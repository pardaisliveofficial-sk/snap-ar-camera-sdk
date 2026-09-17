import React, { useState, useRef } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Move,
  RotateCw,
  Maximize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Save,
  Smile,
  Zap,
  Box,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Clock,
  Compass,
} from "lucide-react";
import { FaceAnchorPoint, LensElement, LensProject, TriggerEvent } from "../types";

interface LensEditorViewProps {
  onApplyCustomLens?: (elements: LensElement[]) => void;
}

const SAMPLE_ASSETS = [
  { id: "ast_1", name: "Neon Cyber Horns", type: "3d_model", icon: Box, category: "3D Props", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop" },
  { id: "ast_2", name: "Golden Angel Halo", type: "3d_model", icon: Sparkles, category: "3D Props", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop" },
  { id: "ast_3", name: "Cute Puppy Ears & Nose", type: "2d_overlay", icon: ImageIcon, category: "2D Stickers", url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop" },
  { id: "ast_4", name: "Glitch Cyber HUD", type: "svg_vector", icon: Sliders, category: "Vector HUD", url: "" },
  { id: "ast_5", name: "Floating Sparkle Dust", type: "particle_emitter", icon: Zap, category: "Particles", url: "" },
  { id: "ast_6", name: "Anime Blush Pink Lips", type: "2d_overlay", icon: ImageIcon, category: "Makeup", url: "" },
];

const INITIAL_PROJECT: LensProject = {
  id: "proj_lens_01",
  name: "Neon Cyberpunk AR Lens",
  category: "3D & Face Mesh",
  description: "Interactive AR filter with 3D Cyber Horns, eye tracking triggers, and particle dust.",
  author: "SnapAR Developer",
  status: "Draft",
  updatedAt: new Date().toISOString(),
  elements: [
    {
      id: "el_1",
      name: "Cyber Neon Horns",
      type: "3d_model",
      anchor: "forehead",
      assetUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop",
      offsetX: 0,
      offsetY: -45,
      scale: 1.2,
      rotation: 0,
      opacity: 100,
      trigger: "always",
      animated: true,
      curve: "ease_in_out",
    },
    {
      id: "el_2",
      name: "Eye Iris Cyber Ring",
      type: "svg_vector",
      anchor: "bothEyes",
      assetUrl: "",
      offsetX: 0,
      offsetY: 0,
      scale: 1.0,
      rotation: 15,
      opacity: 90,
      trigger: "blink",
      color: "#00f0ff",
      curve: "elastic",
    },
    {
      id: "el_3",
      name: "Sparkle Dust Cloud",
      type: "particle_emitter",
      anchor: "cheeks",
      assetUrl: "",
      offsetX: 0,
      offsetY: 10,
      scale: 1.4,
      rotation: 0,
      opacity: 80,
      trigger: "smile",
      color: "#ec4899",
      curve: "bounce",
    },
  ],
};

export const LensEditorView: React.FC<LensEditorViewProps> = ({ onApplyCustomLens }) => {
  const [project, setProject] = useState<LensProject>(INITIAL_PROJECT);
  const [selectedElementId, setSelectedElementId] = useState<string>(INITIAL_PROJECT.elements[0].id);

  // Timeline State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(1200);
  const [timelineDurationMs] = useState<number>(3000);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Asset Browser Modal State
  const [isAssetBrowserOpen, setIsAssetBrowserOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Drag State for Canvas
  const [isDragging, setIsDragging] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedElement =
    project.elements.find((el) => el.id === selectedElementId) || project.elements[0];

  const handleUpdateElement = (id: string, updates: Partial<LensElement>) => {
    setProject((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const handleToggleHide = (id: string) => {
    setProject((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, opacity: el.opacity === 0 ? 100 : 0 } : el
      ),
    }));
  };

  const handleAddElementFromAsset = (asset: typeof SAMPLE_ASSETS[0]) => {
    const newEl: LensElement = {
      id: `el_${Date.now()}`,
      name: asset.name,
      type: asset.type as any,
      anchor: "forehead",
      assetUrl: asset.url,
      offsetX: 0,
      offsetY: 0,
      scale: 1.0,
      rotation: 0,
      opacity: 100,
      trigger: "always",
      color: "#a855f7",
      curve: "ease_in_out",
    };
    setProject((prev) => ({
      ...prev,
      elements: [...prev.elements, newEl],
    }));
    setSelectedElementId(newEl.id);
    setIsAssetBrowserOpen(false);
  };

  const handleDeleteElement = (id: string) => {
    if (project.elements.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    const remaining = project.elements.filter((el) => el.id !== id);
    if (remaining.length > 0) setSelectedElementId(remaining[0].id);
  };

  const handleSaveProject = async () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportPackage = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}.snaplens`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Canvas Drag Simulation
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedElement) return;
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedElement || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    handleUpdateElement(selectedElement.id, {
      offsetX: Math.round(x / 2),
      offsetY: Math.round(y / 2),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const filteredAssets = SAMPLE_ASSETS.filter((ast) => {
    const matchesSearch = ast.name.toLowerCase().includes(assetSearchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || ast.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <h2 className="text-lg font-bold text-white">SnapAR Visual Lens Editor Studio</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Interactive 3D AR Studio
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build custom Snapchat filters with drag-and-drop layer management, MediaPipe 3D face anchors, animation timelines, and triggers.
          </p>
        </div>

        {/* Action Controls: Save, Export, Apply */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveProject}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-purple-400" />}
            <span>{savedSuccess ? "Saved!" : "Save Project"}</span>
          </button>

          <button
            onClick={handleExportPackage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export .snaplens</span>
          </button>

          {onApplyCustomLens && (
            <button
              onClick={() => onApplyCustomLens(project.elements)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-pink-900/30 transition-all border border-pink-400/30"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Apply Lens to Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Layer Manager & Asset Pickers (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Layer Manager</h3>
              </div>
              <button
                onClick={() => setIsAssetBrowserOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[11px] font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Layer</span>
              </button>
            </div>

            {/* Layer Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {project.elements.map((el, index) => {
                const isSelected = el.id === selectedElementId;
                const isHidden = el.opacity === 0;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-900/20"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-slate-500 w-4">#{index + 1}</span>
                      <div className="truncate">
                        <p className="font-bold truncate">{el.name}</p>
                        <p className="text-[10px] text-pink-400 font-mono capitalize">
                          Anchor: {el.anchor} • {el.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHide(el.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Toggle Layer Visibility"
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      {project.elements.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete Layer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Asset Library Trigger */}
          <button
            onClick={() => setIsAssetBrowserOpen(true)}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between text-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Box className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-bold text-slate-200">Asset & 3D Model Browser</p>
                <p className="text-[10px] text-slate-400">Pick stickers, GLTF models, shaders, particle clouds</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        {/* Center Column: Interactive Live Drag & Drop Canvas (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div
            ref={canvasContainerRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center select-none shadow-2xl group cursor-crosshair"
          >
            {/* Background Simulated Face Grid */}
            <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full opacity-30 text-slate-600">
              <ellipse cx="200" cy="150" rx="90" ry="110" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="160" cy="125" rx="20" ry="12" fill="none" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="240" cy="125" rx="20" ry="12" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M200 115 L200 160 L190 170 H210 L200 160" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M165 200 Q200 185 235 200 Q200 220 165 200" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Rendered Elements Layer */}
            {project.elements.map((el) => {
              if (el.opacity === 0) return null;
              const isSelected = el.id === selectedElementId;

              return (
                <div
                  key={el.id}
                  style={{
                    transform: `translate(${el.offsetX}px, ${el.offsetY}px) scale(${el.scale}) rotate(${el.rotation}deg)`,
                    opacity: el.opacity / 100,
                  }}
                  className={`absolute transition-all duration-75 flex flex-col items-center justify-center p-2 rounded-xl ${
                    isSelected ? "ring-2 ring-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/30" : ""
                  }`}
                >
                  {el.assetUrl ? (
                    <img src={el.assetUrl} alt={el.name} className="w-16 h-16 object-contain drop-shadow-md" />
                  ) : el.type === "particle_emitter" ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center animate-ping">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-mono text-[10px] font-bold"
                      style={{ borderColor: el.color || "#00f0ff", color: el.color || "#00f0ff" }}
                    >
                      {el.type.toUpperCase()}
                    </div>
                  )}

                  <span className="text-[9px] font-mono font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded-full border border-slate-700 mt-1 whitespace-nowrap">
                    {el.name}
                  </span>
                </div>
              );
            })}

            {/* Canvas Interactive Overlay HUD */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-pink-300">
              Interactive Drag & Drop Canvas
            </div>

            <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400">
              Anchor: {selectedElement?.anchor || "forehead"}
            </div>
          </div>

          {/* Keyframe Timeline Engine */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">Animation Keyframe Timeline</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">{currentTimeMs} ms / {timelineDurationMs} ms</span>
            </div>

            {/* Timeline Scrubbing Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCurrentTimeMs(0)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Reset Timeline"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0"
                max={timelineDurationMs}
                step="50"
                value={currentTimeMs}
                onChange={(e) => setCurrentTimeMs(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border font-mono transition-all ${
                  isLooping ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                LOOP
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector & Properties Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedElement && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Layer Inspector & Anchors</span>
                </h3>
              </div>

              {/* Element Name */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Layer Name</label>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 3D Face Landmark Attachment Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] flex items-center justify-between">
                  <span>3D Face Landmark Anchor</span>
                  <span className="text-pink-400 font-mono text-[9px]">468 Nodes</span>
                </label>
                <select
                  value={selectedElement.anchor}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { anchor: e.target.value as FaceAnchorPoint })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-pink-500 font-mono text-xs cursor-pointer"
                >
                  <option value="forehead">Forehead (#10 Landmark)</option>
                  <option value="noseBridge">Nose Bridge (#1 Landmark)</option>
                  <option value="leftEye">Left Eye Iris (#33 Landmark)</option>
                  <option value="rightEye">Right Eye Iris (#263 Landmark)</option>
                  <option value="bothEyes">Both Eyes Center</option>
                  <option value="lips">Lips Contour (#0 Landmark)</option>
                  <option value="chin">Chin & Jawline (#152 Landmark)</option>
                  <option value="cheeks">Cheekbones (#234 / #454)</option>
                  <option value="fullFace">Full Face Mask Overlay</option>
                </select>
              </div>

              {/* Trigger Events Selector */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] flex items-center justify-between">
                  <span>Trigger Event</span>
                  <Zap className="w-3 h-3 text-amber-400" />
                </label>
                <select
                  value={selectedElement.trigger}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { trigger: e.target.value as TriggerEvent })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs cursor-pointer"
                >
                  <option value="always">Always Active</option>
                  <option value="mouth_open">On Mouth Open</option>
                  <option value="blink">On Eye Blink</option>
                  <option value="smile">On Smile Gesture</option>
                  <option value="eyebrow_raise">On Eyebrow Raise</option>
                </select>
              </div>

              {/* Animation Easing Curve */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Animation Easing Curve</label>
                <select
                  value={selectedElement.curve || "ease_in_out"}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { curve: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
                >
                  <option value="linear">Linear Interpolation</option>
                  <option value="ease_in">Ease-In Smooth</option>
                  <option value="ease_out">Ease-Out Smooth</option>
                  <option value="ease_in_out">Ease-In-Out Curve</option>
                  <option value="bounce">Bounce Physics</option>
                  <option value="elastic">Elastic Spring</option>
                </select>
              </div>

              {/* Transform Sliders: Scale, Rotation, Opacity */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scale Transform</span>
                    <span className="font-mono text-pink-400 font-bold">{selectedElement.scale}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={selectedElement.scale}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { scale: Number(e.target.value) })}
                    className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rotation Angle</span>
                    <span className="font-mono text-purple-400 font-bold">{selectedElement.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedElement.rotation}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Layer Opacity</span>
                    <span className="font-mono text-cyan-400 font-bold">{selectedElement.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.opacity}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset Browser Modal Popup */}
      {isAssetBrowserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-pink-400" />
                <span>AR Asset Library & 3D Props</span>
              </h3>
              <button onClick={() => setIsAssetBrowserOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search stickers, 3D GLTF models, shaders..."
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                {["All", "3D Props", "2D Stickers", "Vector HUD", "Particles"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-all font-semibold whitespace-nowrap ${
                      selectedCategory === cat ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {filteredAssets.map((ast) => {
                const Icon = ast.icon;
                return (
                  <div
                    key={ast.id}
                    onClick={() => handleAddElementFromAsset(ast)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 cursor-pointer transition-all space-y-2 group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-pink-400 px-1.5 py-0.5 rounded bg-pink-500/10">
                        {ast.category}
                      </span>
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition-colors" />
                    </div>

                    <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors">{ast.name}</p>

                    <button className="w-full py-1 text-[10px] font-bold rounded-lg bg-slate-900 group-hover:bg-pink-600 text-slate-300 group-hover:text-white transition-all text-center">
                      + Add to Lens
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
