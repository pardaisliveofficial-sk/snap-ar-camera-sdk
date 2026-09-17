import React, { useState } from "react";
import { Search, Sparkles, Download, Star, TrendingUp, Upload, CheckCircle2, Tag, Eye, Heart, Zap, ShieldCheck } from "lucide-react";
import { ARFilter } from "../types";

interface MarketplaceItem {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  downloads: number;
  likes: number;
  featured: boolean;
  trending: boolean;
  previewUrl: string;
  description: string;
  tags: string[];
}

const INITIAL_MARKETPLACE: MarketplaceItem[] = [
  {
    id: "mk_1",
    title: "Neon Cyberpunk Horizon 3D",
    author: "SnapStudio_Pro",
    category: "Cyberpunk",
    rating: 4.9,
    downloads: 142500,
    likes: 38200,
    featured: true,
    trending: true,
    previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop",
    description: "Cyberpunk 3D horn mesh with eye tracking neon rings and particle bloom flares.",
    tags: ["Cyberpunk", "3D Mesh", "Neon", "Particles"],
  },
  {
    id: "mk_2",
    title: "Korean Glass Skin & Soft Blush",
    author: "BeautyLab_AR",
    category: "Beauty & Glam",
    rating: 4.8,
    downloads: 289000,
    likes: 89400,
    featured: true,
    trending: true,
    previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop",
    description: "Ultra-natural skin smoothing with automatic eye widening and soft peach cheek glow.",
    tags: ["Beauty", "Glass Skin", "Makeup", "Smooth"],
  },
  {
    id: "mk_3",
    title: "Golden Angel Wings & Halo",
    author: "Heavenly_Lens",
    category: "3D Props",
    rating: 4.95,
    downloads: 198000,
    likes: 54100,
    featured: true,
    trending: false,
    previewUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop",
    description: "Interactive 3D head halo that reacts with golden sparkle bursts on smile trigger.",
    tags: ["3D Halo", "Angel", "Sparkles", "Trigger"],
  },
  {
    id: "mk_4",
    title: "90s Retro VHS & Glitch Cam",
    author: "RetroVibes_Dev",
    category: "Glitch & Retro",
    rating: 4.7,
    downloads: 94000,
    likes: 21000,
    featured: false,
    trending: true,
    previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop",
    description: "Authentic tape noise emulation, RGB chromatic aberration, and date overlay.",
    tags: ["VHS", "Glitch", "Retro", "RGB"],
  },
  {
    id: "mk_5",
    title: "Anime Kawaii Heart Glasses",
    author: "TokyoAR",
    category: "Gaming & Anime",
    rating: 4.85,
    downloads: 165000,
    likes: 42000,
    featured: false,
    trending: true,
    previewUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop",
    description: "3D heart glass frame attached to nose bridge with animated sparkle particle cloud.",
    tags: ["Anime", "Kawaii", "Glasses", "3D"],
  },
];

interface FilterMarketplaceViewProps {
  onApplyFilter?: (filter: ARFilter) => void;
}

export const FilterMarketplaceView: React.FC<FilterMarketplaceViewProps> = ({ onApplyFilter }) => {
  const [items, setItems] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterType, setFilterType] = useState<"all" | "trending" | "featured">("all");

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("Snap_Dev_User");
  const [newCategory, setNewCategory] = useState("Cyberpunk");
  const [newDescription, setNewDescription] = useState("");
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const handleDownloadLens = (item: MarketplaceItem) => {
    setDownloadedIds((prev) => new Set(prev).add(item.id));
    if (onApplyFilter) {
      onApplyFilter({
        id: item.id,
        name: item.title,
        category: item.category,
        icon: "✨",
        previewUrl: item.previewUrl,
        intensity: 1.0,
        enabled: true,
      });
    }
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: MarketplaceItem = {
      id: `mk_${Date.now()}`,
      title: newTitle,
      author: newAuthor,
      category: newCategory,
      rating: 5.0,
      downloads: 1,
      likes: 1,
      featured: false,
      trending: true,
      previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop",
      description: newDescription || "Custom user published Snapchat Lens.",
      tags: [newCategory, "Community"],
    };

    setItems([newItem, ...items]);
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      setIsPublishModalOpen(false);
      setNewTitle("");
      setNewDescription("");
    }, 1500);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesType =
      filterType === "all" ||
      (filterType === "trending" && item.trending) ||
      (filterType === "featured" && item.featured);

    return matchesSearch && matchesCat && matchesType;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <h2 className="text-lg font-bold text-white">SnapAR Community Filter Marketplace</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Global AR Ecosystem
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover, try, and publish custom Snapchat AR filters created by creators and developers worldwide.
          </p>
        </div>

        {/* Publish Button */}
        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-900/30 transition-all border border-pink-400/30 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Publish New Filter</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search filters by name, category, or tag (e.g. Cyberpunk, 3D Halo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Filter Type Pills: All, Trending, Featured */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Filters
          </button>
          <button
            onClick={() => setFilterType("trending")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterType === "trending" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>
          <button
            onClick={() => setFilterType("featured")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterType === "featured" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Featured</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {["All", "Cyberpunk", "Beauty & Glam", "3D Props", "Gaming & Anime", "Glitch & Retro"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl border font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400/40 shadow-md shadow-purple-900/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isDownloaded = downloadedIds.has(item.id);

          return (
            <div
              key={item.id}
              className="bg-slate-950/90 border border-slate-800 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Image Preview & Badges */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {item.featured && (
                  <span className="absolute top-3 left-3 bg-amber-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-slate-950" /> Featured
                  </span>
                )}

                {item.trending && (
                  <span className="absolute top-3 right-3 bg-pink-500/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </span>
                )}

                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="font-bold font-mono text-[11px] text-pink-300">by @{item.author}</span>
                  <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Downloads & Likes Stats */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>{(item.downloads / 1000).toFixed(1)}k installs</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                    <span>{(item.likes / 1000).toFixed(1)}k</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleDownloadLens(item)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    isDownloaded
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-900 hover:bg-pink-600 text-slate-200 hover:text-white border border-slate-800 hover:border-pink-500/50"
                  }`}
                >
                  {isDownloaded ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4" />}
                  <span>{isDownloaded ? "Lens Downloaded & Applied!" : "Download & Try Lens"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Publish Filter Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-pink-400" />
                <span>Publish Lens to Marketplace</span>
              </h3>
              <button type="button" onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Filter Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberpunk Neon Dragon"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="Cyberpunk">Cyberpunk</option>
                  <option value="Beauty & Glam">Beauty & Glam</option>
                  <option value="3D Props">3D Props</option>
                  <option value="Gaming & Anime">Gaming & Anime</option>
                  <option value="Glitch & Retro">Glitch & Retro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Filter Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your filter features, face triggers, and effects..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs hover:from-pink-500 hover:to-purple-500 shadow-md shadow-pink-900/30 flex items-center gap-1.5"
              >
                {publishSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Upload className="w-4 h-4" />}
                <span>{publishSuccess ? "Published!" : "Publish Filter"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
