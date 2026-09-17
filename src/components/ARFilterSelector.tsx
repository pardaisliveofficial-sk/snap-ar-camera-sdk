import React, { useState, useMemo } from "react";
import { AR_MASKS } from "../data/presets";
import { BUILT_IN_FILTERS, FILTER_CATEGORIES, BuiltInFilter } from "../data/builtInFilters";
import { filterManager } from "../lib/filterManager";
import { ARMaskId } from "../types";
import {
  Sparkles,
  Dog,
  Sun,
  Cat,
  Glasses,
  Flower2,
  Crown,
  Heart,
  Smile,
  Video,
  Stars,
  Binary,
  Wand2,
  Search,
  Download,
  Star,
  Check,
} from "lucide-react";

interface ARFilterSelectorProps {
  activeMaskId: ARMaskId;
  onSelectMask: (id: ARMaskId) => void;
  onOpenCustomAiFilter: () => void;
}

export const ARFilterSelector: React.FC<ARFilterSelectorProps> = ({
  activeMaskId,
  onSelectMask,
  onOpenCustomAiFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(filterManager.getFavorites().map((f) => f.id))
  );
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Filter combined preset masks + 160 built-in filters
  const filteredBuiltInFilters = useMemo(() => {
    let list = BUILT_IN_FILTERS;

    if (selectedCategory !== "All") {
      list = list.filter(
        (f) => f.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          f.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    filterManager.favoriteFilter(id);
    setFavoriteIds(new Set(filterManager.getFavorites().map((f) => f.id)));
  };

  const handleDownloadLensPkg = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    filterManager.downloadFilter(id);
    setDownloadedId(id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  const handleSelectFilter = (id: string) => {
    filterManager.applyFilter(id);
    onSelectMask(id as ARMaskId);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Dog":
        return <Dog className="w-5 h-5" />;
      case "Sun":
        return <Sun className="w-5 h-5" />;
      case "Cat":
        return <Cat className="w-5 h-5" />;
      case "Glasses":
        return <Glasses className="w-5 h-5" />;
      case "Flower2":
        return <Flower2 className="w-5 h-5" />;
      case "Crown":
        return <Crown className="w-5 h-5" />;
      case "Heart":
        return <Heart className="w-5 h-5" />;
      case "Smile":
        return <Smile className="w-5 h-5" />;
      case "Video":
        return <Video className="w-5 h-5" />;
      case "Stars":
        return <Stars className="w-5 h-5" />;
      case "Binary":
        return <Binary className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-4 backdrop-blur-md">
      {/* Top Search Bar & Category Navigation */}
      <div className="space-y-3 border-b border-slate-800 pb-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 150+ filters by category, name, or tag..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/80 transition-all"
            />
          </div>

          {/* AI Custom Prompt Filter Button */}
          <button
            onClick={onOpenCustomAiFilter}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all border border-purple-400/30 whitespace-nowrap shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-300" />
            <span>Generate AI Filter</span>
          </button>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar py-1">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Snapchat Masks Section (If All is selected & search empty) */}
      {!searchQuery && selectedCategory === "All" && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Featured Preset Lenses</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {AR_MASKS.map((mask) => {
              const isActive = activeMaskId === mask.id;
              return (
                <button
                  key={mask.id}
                  onClick={() => handleSelectFilter(mask.id)}
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl transition-all border text-left ${
                    isActive
                      ? "bg-slate-800 border-pink-500/80 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/50"
                      : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {mask.tag && (
                    <span className="absolute top-2 right-2 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {mask.tag}
                    </span>
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                      isActive
                        ? "bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30"
                        : "bg-slate-800 text-slate-300 group-hover:text-pink-400"
                    }`}
                  >
                    {getIcon(mask.icon)}
                  </div>

                  <div className="w-full text-center">
                    <p className="text-xs font-bold text-slate-100 truncate">{mask.name}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{mask.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 150+ Built-in Filters Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Built-in GPU Filters ({filteredBuiltInFilters.length})
          </p>
          <span className="text-[10px] text-pink-400 font-mono">160+ Total Lenses</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto no-scrollbar pr-1">
          {filteredBuiltInFilters.map((filter) => {
            const isActive = activeMaskId === filter.id;
            const isFav = favoriteIds.has(filter.id);

            return (
              <div
                key={filter.id}
                onClick={() => handleSelectFilter(filter.id)}
                className={`group relative flex flex-col justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                  isActive
                    ? "bg-slate-800 border-pink-500 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/50"
                    : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Actions: Favorite & Download .lenspkg */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => handleToggleFavorite(e, filter.id)}
                    title="Favorite"
                    className={`p-1 rounded-full transition-all ${
                      isFav ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-900/60 text-slate-400 hover:text-amber-400"
                    }`}
                  >
                    <Star className={`w-3 h-3 ${isFav ? "fill-amber-400" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => handleDownloadLensPkg(e, filter.id)}
                    title="Export .lenspkg"
                    className="p-1 rounded-full bg-slate-900/60 text-slate-400 hover:text-pink-400 transition-all"
                  >
                    {downloadedId === filter.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
                  </button>
                </div>

                {/* Thumbnail Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md"
                    style={{ background: `linear-gradient(135deg, ${filter.presetColors.primary}, ${filter.presetColors.secondary})` }}
                  >
                    {getIcon(filter.icon)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-slate-900/80 text-pink-300 border border-slate-800">
                      {filter.assetType}
                    </span>
                  </div>
                </div>

                {/* Filter Metadata */}
                <div>
                  <p className="text-xs font-bold text-slate-100 truncate">{filter.name}</p>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">{filter.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
