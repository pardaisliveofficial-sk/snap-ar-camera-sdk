import { ArFilterAssetPackage } from "./types";
import { catFilterAsset } from "./assets/cat";
import { dogFilterAsset } from "./assets/dog";
import { elephantFilterAsset } from "./assets/elephant";
import { glassesFilterAsset } from "./assets/glasses";
import { crownFilterAsset } from "./assets/crown";
import { maskFilterAsset } from "./assets/mask";
import { makeupFilterAsset } from "./assets/makeup";

export class ArAssetRegistry {
  private static instance: ArAssetRegistry;
  private filters: Map<string, ArFilterAssetPackage> = new Map();

  private constructor() {
    this.registerDefaultFilters();
  }

  public static getInstance(): ArAssetRegistry {
    if (!ArAssetRegistry.instance) {
      ArAssetRegistry.instance = new ArAssetRegistry();
    }
    return ArAssetRegistry.instance;
  }

  private registerDefaultFilters(): void {
    this.registerFilter(catFilterAsset);
    this.registerFilter(dogFilterAsset);
    this.registerFilter(elephantFilterAsset);
    this.registerFilter(glassesFilterAsset);
    this.registerFilter(crownFilterAsset);
    this.registerFilter(maskFilterAsset);
    this.registerFilter(makeupFilterAsset);
  }

  public registerFilter(pkg: ArFilterAssetPackage): void {
    this.filters.set(pkg.id, pkg);
  }

  public getFilter(id: string): ArFilterAssetPackage | undefined {
    return this.filters.get(id);
  }

  public getAllFilters(): ArFilterAssetPackage[] {
    return Array.from(this.filters.values());
  }

  public hasFilter(id: string): boolean {
    return this.filters.has(id);
  }
}
