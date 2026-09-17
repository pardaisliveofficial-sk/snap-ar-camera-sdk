import React, { useState } from "react";
import {
  X,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Box,
  Video,
  Music,
  Type,
  FileCode,
  Check,
  Copy,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";
import { AssetFile } from "../types";

interface AssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset?: (asset: AssetFile) => void;
}

const INITIAL_ASSETS: AssetFile[] = [
  {
    id: "ast_1",
    name: "dog_ears_hd.png",
    type: "png",
    size: "245 KB",
    category: "2D Overlay",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&auto=format&fit=crop",
  },
  {
    id: "ast_2",
    name: "cyber_hud_vector.svg",
    type: "svg",
    size: "18 KB",
    category: "Vector HUD",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop",
  },
  {
    id: "ast_3",
    name: "sparkles_loop.webm",
    type: "webm",
    size: "1.4 MB",
    category: "Animated Particles",
    url: "https://assets.mixkit.co/videos/preview/mixkit-glittering-particles-in-motion-41584-large.mp4",
  },
  {
    id: "ast_4",
    name: "angel_halo_3d.glb",
    type: "glb",
    size: "3.2 MB",
    category: "3D Model",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop",
  },
  {
    id: "ast_5",
    name: "cyber_visor.gltf",
    type: "gltf",
    size: "2.8 MB",
    category: "3D Model",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop",
  },
  {
    id: "ast_6",
    name: "heart_burst.gif",
    type: "gif",
    size: "680 KB",
    category: "Animated Particles",
    url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop",
  },
  {
    id: "ast_7",
    name: "camera_shutter.mp3",
    type: "audio",
    size: "82 KB",
    category: "Audio Effect",
    url: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
  },
  {
    id: "ast_8",
    name: "cyberpunk_bold.ttf",
    type: "font",
    size: "112 KB",
    category: "Custom Font",
    url: "https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap",
  },
];

export const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
}) => {
  const [assets, setAssets] = useState<AssetFile[]>(INITIAL_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const categories = ["All", "2D Overlay", "Vector HUD", "Animated Particles", "3D Model", "Audio Effect", "Custom Font"];

  const filteredAssets = selectedCategory === "All"
    ? assets
    : assets.filter((a) => a.category === selectedCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setTimeout(() => {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const newAsset: AssetFile = {
        id: `ast_${Date.now()}`,
        name: file.name,
        type: ext as any,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        category: ext === "glb" || ext === "gltf" ? "3D Model" : ext === "webm" || ext === "mp4" ? "Animated Particles" : "2D Overlay",
        url: URL.createObjectURL(file),
      };
      setAssets((prev) => [newAsset, ...prev]);
      setIsUploading(false);
    }, 800);
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                SnapStream AR Asset Manager
              </h3>
              <p className="text-xs text-slate-400">
                Support for PNG, JPG, SVG, GIF, WebM, MP4, GLB, GLTF, Audio & Fonts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-pink-900/20">
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Asset"}
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".png,.jpg,.jpeg,.svg,.gif,.webm,.mp4,.glb,.gltf,.mp3" />
            </label>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Asset Grid */}
        <div className="p-5 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredAssets.map((ast) => (
            <div
              key={ast.id}
              className="group relative bg-slate-950/70 border border-slate-800 hover:border-pink-500/50 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-pink-500/5"
            >
              <div className="relative aspect-square rounded-lg bg-slate-900/80 overflow-hidden flex items-center justify-center mb-2">
                {ast.type === "png" || ast.type === "jpg" || ast.type === "glb" ? (
                  <img src={ast.url} alt={ast.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                ) : ast.type === "svg" ? (
                  <Box className="w-10 h-10 text-cyan-400" />
                ) : ast.type === "webm" || ast.type === "mp4" ? (
                  <Video className="w-10 h-10 text-pink-400" />
                ) : (
                  <Music className="w-10 h-10 text-amber-400" />
                )}

                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono font-bold text-slate-300 uppercase">
                  {ast.type}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white truncate" title={ast.name}>
                  {ast.name}
                </h4>
                <p className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>{ast.category}</span>
                  <span>{ast.size}</span>
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                {onSelectAsset && (
                  <button
                    onClick={() => onSelectAsset(ast)}
                    className="flex-1 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold transition-all"
                  >
                    Insert
                  </button>
                )}
                <button
                  onClick={() => handleCopyUrl(ast.id, ast.url)}
                  title="Copy Asset URL"
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  {copiedId === ast.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(ast.id)}
                  title="Delete Asset"
                  className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
