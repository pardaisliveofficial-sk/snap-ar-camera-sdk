import React, { useMemo, useState } from "react";
import { Camera, FlipHorizontal, RotateCcw, Sparkles, SlidersHorizontal, Wand2, X, Check, Download, Search, ChevronDown, CircleStop } from "lucide-react";
import { AR_MASKS, DEFAULT_BEAUTY_PARAMS, PRESET_BEAUTY_MODES } from "../data/presets";
import { BUILT_IN_FILTERS, FILTER_CATEGORIES } from "../data/builtInFilters";
import { filterManager } from "../lib/filterManager";
import { ARMaskId, BeautyParameters, CapturedMedia } from "../types";
import { CameraView } from "./CameraView";

interface Props {
  activeMaskId: ARMaskId;
  onSelectMask: (id: ARMaskId) => void;
  activeBuiltInFilterId?: string | null;
  onSelectBuiltInFilter: (id: string | null) => void;
  beautyParams: BeautyParameters;
  onChangeBeauty: (p: BeautyParameters) => void;
  cameraFacing: "user" | "environment";
  onToggleCameraFacing: () => void;
  onCapture: (m: CapturedMedia) => void;
  onExit: () => void;
}

type Tab = "filters" | "beauty" | "adjust";

const iconFor = (name: string) => {
  const map: Record<string, string> = { Dog: "🐶", Cat: "🐱", Sun: "☀️", Glasses: "🕶️", Flower2: "🌼", Crown: "👑", Heart: "💗", Smile: "✨", Video: "📹", Stars: "💎", Binary: "🟢", Sparkles: "✨", Zap: "⚡", Aperture: "◉" };
  return map[name] || "✨";
};

export const MobileCameraTestView: React.FC<Props> = ({
  activeMaskId, onSelectMask, activeBuiltInFilterId, onSelectBuiltInFilter,
  beautyParams, onChangeBeauty, cameraFacing, onToggleCameraFacing, onCapture, onExit,
}) => {
  const [tab, setTab] = useState<Tab>("filters");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [installEvent, setInstallEvent] = useState<any>(null);

  React.useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const installApp = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice.catch(() => {});
    setInstallEvent(null);
  };

  const update = (key: keyof BeautyParameters, value: number) => onChangeBeauty({ ...beautyParams, [key]: value });
  const featured = useMemo(() => AR_MASKS, []);
  const filters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUILT_IN_FILTERS.filter(f => (category === "All" || f.category.toLowerCase() === category.toLowerCase()) &&
      (!q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q))));
  }, [category, query]);

  const selectBuiltIn = (id: string) => {
    filterManager.applyFilter(id);
    onSelectBuiltInFilter(id);
    setLoadedId(id);
    setTimeout(() => setLoadedId(null), 1300);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      <CameraView
        mobileMode
        activeMaskId={activeMaskId}
        activeBuiltInFilterId={activeBuiltInFilterId}
        beautyParams={beautyParams}
        cameraFacing={cameraFacing}
        onToggleCameraFacing={onToggleCameraFacing}
        onCapture={onCapture}
      />

      <div className="absolute inset-x-0 top-0 z-[140] pt-[calc(env(safe-area-inset-top)+10px)] px-3 flex items-center justify-between pointer-events-none">
        <button onClick={onExit} className="pointer-events-auto w-10 h-10 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 flex items-center justify-center"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/15">
            <img src="/brand/snap-ar-icon.png" className="w-5 h-5 rounded-md" alt="Snap AR" />
            <span className="font-bold text-xs">Snap <span className="text-fuchsia-300">AR</span></span>
          </div>
          <button onClick={onToggleCameraFacing} className="pointer-events-auto w-10 h-10 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 flex items-center justify-center"><FlipHorizontal className="w-5 h-5" /></button>
          <span className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 text-[10px] font-mono">{cameraFacing === "user" ? "FRONT" : "BACK"}</span>
          {installEvent && <button onClick={installApp} className="pointer-events-auto px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold shadow-lg">Install</button>}
        </div>
      </div>

      {loadedId && <div className="absolute top-[calc(env(safe-area-inset-top)+66px)] left-1/2 -translate-x-1/2 z-[145] px-4 py-2 rounded-full bg-black/65 backdrop-blur-xl border border-emerald-400/30 text-[10px] font-bold flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-300" /> FILTER LOADED & APPLIED</div>}

      {showPanel && <div className="absolute inset-x-0 bottom-0 z-[130] pb-[calc(env(safe-area-inset-bottom)+8px)] pointer-events-auto">
        <div className="mx-2 rounded-[28px] bg-black/82 backdrop-blur-2xl border border-white/12 shadow-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div><p className="text-[9px] uppercase tracking-[0.2em] text-white/45">Mobile Camera Test</p><p className="text-sm font-bold">{activeBuiltInFilterId ? (BUILT_IN_FILTERS.find(f => f.id === activeBuiltInFilterId)?.name || activeBuiltInFilterId) : activeMaskId === "none" ? "Natural Camera" : (AR_MASKS.find(m => m.id === activeMaskId)?.name || activeMaskId)}</p></div>
            <button onClick={() => setShowPanel(false)} className="text-white/55 text-[10px] px-2 py-1 rounded-full bg-white/6">Hide</button>
          </div>
          <div className="px-2 pb-2 grid grid-cols-3 gap-1">
            {([["filters", Sparkles, "Filters"],["beauty", Wand2, "Beauty"],["adjust", SlidersHorizontal, "Adjust"]] as const).map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={`py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 ${tab === id ? "bg-white text-black" : "bg-white/6 text-white/65"}`}><Icon className="w-4 h-4"/>{label}</button>)}
          </div>

          {tab === "filters" && <div className="px-3 pb-3">
            <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
              <div className="relative shrink-0"><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-white/40"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search filters" className="w-32 bg-white/7 border border-white/10 rounded-xl pl-8 pr-2 py-1.5 text-[10px] outline-none"/></div>
              {FILTER_CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold ${category===c?"bg-fuchsia-500 text-white":"bg-white/7 text-white/60"}`}>{c}</button>)}
            </div>
            {!query && category === "All" && <>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1.5">Featured AR Lenses</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {featured.map(mask=><button key={mask.id} onClick={()=>{onSelectMask(mask.id);onSelectBuiltInFilter(null)}} className={`shrink-0 w-[72px] ${activeMaskId===mask.id && !activeBuiltInFilterId?"text-white":"text-white/55"}`}><div className={`w-[72px] h-[62px] rounded-2xl border flex items-center justify-center ${activeMaskId===mask.id && !activeBuiltInFilterId?"border-fuchsia-400 bg-fuchsia-500/15":"border-white/10 bg-white/5"}`}><span className="text-2xl">{iconFor(mask.icon)}</span></div><span className="block text-[9px] mt-1 truncate">{mask.name}</span></button>)}
              </div>
            </>}
            <div className="flex items-center justify-between mt-1 mb-1.5"><p className="text-[9px] text-white/40 uppercase tracking-wider">All Built-in Filters</p><span className="text-[9px] text-fuchsia-300">{filters.length} available</span></div>
            <div className="grid grid-cols-4 gap-2 max-h-[230px] overflow-y-auto no-scrollbar pr-0.5">
              {filters.map(f=> <button key={f.id} onClick={()=>selectBuiltIn(f.id)} className={`relative rounded-2xl border p-1.5 text-left ${activeBuiltInFilterId===f.id?"border-fuchsia-400 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30":"border-white/10 bg-white/5"}`}>
                <div className="aspect-square rounded-xl flex items-center justify-center text-lg" style={{background:`linear-gradient(135deg,${f.presetColors.primary},${f.presetColors.secondary})`}}>{iconFor(f.icon)}</div>
                <p className="text-[9px] font-bold truncate mt-1">{f.name}</p><p className="text-[7px] text-white/40 truncate">{f.category}</p>
              </button>)}
            </div>
          </div>}

          {tab === "beauty" && <div className="px-3 pb-3 max-h-[285px] overflow-y-auto no-scrollbar">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">{PRESET_BEAUTY_MODES.map(p=><button key={p.name} onClick={()=>onChangeBeauty({...beautyParams,...p.params})} className="shrink-0 px-3 py-2 rounded-xl bg-white/7 border border-white/10 text-[10px] font-bold">{p.name}</button>)}<button onClick={()=>onChangeBeauty(DEFAULT_BEAUTY_PARAMS)} className="shrink-0 px-3 py-2 rounded-xl bg-white/7 border border-white/10 text-[10px] font-bold"><RotateCcw className="inline w-3 h-3 mr-1"/>Reset</button></div>
            {[['Skin Smoothing','skinSmoothing'],['Glow','skinToneGlow'],['Face Slim','faceSlimming'],['Eye Bright','eyeBrightening'],['Eye Size','eyeEnlargement'],['Nose Slim','noseSlimming'],['Lip Tint','lipTint'],['Teeth','teethWhitening']].map(([label,key])=><label key={key} className="block mb-2.5"><div className="flex justify-between text-[10px] text-white/70 mb-1"><span>{label}</span><span className="font-mono text-white">{Number(beautyParams[key as keyof BeautyParameters])||0}%</span></div><input type="range" min="0" max="100" value={Number(beautyParams[key as keyof BeautyParameters])||0} onChange={e=>update(key as keyof BeautyParameters,Number(e.target.value))} className="w-full accent-fuchsia-400"/></label>)}
          </div>}

          {tab === "adjust" && <div className="px-3 pb-3 max-h-[285px] overflow-y-auto no-scrollbar">{[['Brightness','brightness',50,150],['Contrast','contrast',50,150],['Saturation','saturation',0,200],['Sharpening','sharpening',0,100],['Warmth','warmth',-50,50]].map(([label,key,min,max])=><label key={key as string} className="block mb-2.5"><div className="flex justify-between text-[10px] text-white/70 mb-1"><span>{label}</span><span className="font-mono text-white">{Number(beautyParams[key as keyof BeautyParameters])||0}</span></div><input type="range" min={Number(min)} max={Number(max)} value={Number(beautyParams[key as keyof BeautyParameters])||0} onChange={e=>update(key as keyof BeautyParameters,Number(e.target.value))} className="w-full accent-fuchsia-400"/></label>)}<div className="grid grid-cols-2 gap-2 mt-1"><button onClick={onToggleCameraFacing} className="py-2.5 rounded-xl bg-white text-black text-xs font-bold"><FlipHorizontal className="inline w-4 h-4 mr-1"/>Camera</button><button onClick={()=>onChangeBeauty(DEFAULT_BEAUTY_PARAMS)} className="py-2.5 rounded-xl bg-white/7 border border-white/10 text-xs font-bold"><Check className="inline w-4 h-4 mr-1"/>Reset</button></div></div>}
        </div>
        <div className="text-center pt-1 text-[8px] text-white/30 tracking-[0.25em]">SNAP AR · MOBILE TEST ENGINE</div>
      </div>}
      {!showPanel && <button onClick={()=>setShowPanel(true)} className="absolute bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 -translate-x-1/2 z-[150] px-5 py-3 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 text-xs font-bold">Open Camera Controls <ChevronDown className="inline w-4 h-4 ml-1"/></button>}
    </div>
  );
};
