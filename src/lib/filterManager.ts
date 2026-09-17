import { BUILT_IN_FILTERS, BuiltInFilter } from "../data/builtInFilters";

export class FilterManager {
  private static instance: FilterManager;
  private activeFilterId: string | null = "cute_puppy";
  private favorites: Set<string> = new Set();
  private recents: string[] = ["cute_puppy", "golden_hour", "neon_cyber"];
  private listeners: Array<() => void> = [];

  private constructor() {
    this.loadState();
  }

  public static getInstance(): FilterManager {
    if (!FilterManager.instance) {
      FilterManager.instance = new FilterManager();
    }
    return FilterManager.instance;
  }

  private loadState() {
    try {
      const storedFavs = localStorage.getItem("snapar_fav_filters");
      if (storedFavs) {
        this.favorites = new Set(JSON.parse(storedFavs));
      } else {
        this.favorites = new Set(["filter_beauty_1", "filter_cute_animals_7", "filter_cyberpunk_37"]);
      }

      const storedRecents = localStorage.getItem("snapar_recent_filters");
      if (storedRecents) {
        this.recents = JSON.parse(storedRecents);
      }
    } catch (e) {
      // Storage fallback
    }
  }

  private saveState() {
    try {
      localStorage.setItem("snapar_fav_filters", JSON.stringify(Array.from(this.favorites)));
      localStorage.setItem("snapar_recent_filters", JSON.stringify(this.recents));
    } catch (e) {
      // Storage fallback
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  // SDK / Developer Required Methods
  public getFilters(category?: string): BuiltInFilter[] {
    if (!category || category === "All") {
      return BUILT_IN_FILTERS;
    }
    return BUILT_IN_FILTERS.filter(
      (f) => f.category.toLowerCase() === category.toLowerCase()
    );
  }

  public getFilter(id: string): BuiltInFilter | undefined {
    return BUILT_IN_FILTERS.find((f) => f.id === id);
  }

  public searchFilters(keyword: string): BuiltInFilter[] {
    if (!keyword.trim()) return BUILT_IN_FILTERS;
    const q = keyword.toLowerCase().trim();
    return BUILT_IN_FILTERS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q)) ||
        f.description.toLowerCase().includes(q)
    );
  }

  public applyFilter(id: string): boolean {
    const filter = this.getFilter(id);
    if (!filter && id !== "none" && id !== "cute_puppy") {
      console.warn(`[FilterManager] Filter with ID "${id}" not found.`);
    }
    this.activeFilterId = id;

    // Track recents
    if (id && id !== "none") {
      this.recents = [id, ...this.recents.filter((r) => r !== id)].slice(0, 20);
    }

    this.saveState();
    return true;
  }

  public removeFilter(): void {
    this.activeFilterId = "none";
    this.saveState();
  }

  public getActiveFilterId(): string | null {
    return this.activeFilterId;
  }

  public downloadFilter(id: string): { filename: string; blobUrl: string } {
    const filter = this.getFilter(id);
    const filterData = filter || {
      id,
      name: `Custom Filter ${id}`,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      sdkVersion: "2.5.0",
    };

    const jsonString = JSON.stringify(filterData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const filename = `${id}_filter.lenspkg`;

    // Trigger download in browser
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { filename, blobUrl };
  }

  public favoriteFilter(id: string): boolean {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    this.saveState();
    return this.favorites.has(id);
  }

  public isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  public getFavorites(): BuiltInFilter[] {
    return BUILT_IN_FILTERS.filter((f) => this.favorites.has(f.id));
  }

  public recentFilters(): BuiltInFilter[] {
    const filters: BuiltInFilter[] = [];
    this.recents.forEach((id) => {
      const f = this.getFilter(id);
      if (f) filters.push(f);
    });
    return filters;
  }
}

export const filterManager = FilterManager.getInstance();
