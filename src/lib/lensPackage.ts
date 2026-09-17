import { LensElement, LensProject } from "../types";

export interface LensPackageHeader {
  formatVersion: string;
  lensId: string;
  name: string;
  author: string;
  category: string;
  createdAt: string;
  sdkVersion: string;
  fpsTarget: number;
  previewImage: string;
}

export interface LensPackageContent {
  header: LensPackageHeader;
  elements: LensElement[];
  shaderConfigs: {
    vertexShader?: string;
    fragmentShader?: string;
    uniforms?: Record<string, any>;
  };
  assetManifest: {
    id: string;
    filename: string;
    type: string;
    base64Data?: string;
  }[];
  animations: {
    id: string;
    trigger: string;
    durationMs: number;
    easing: string;
  }[];
}

export class LensPackage {
  /**
   * Export a Lens Project or filter configuration as a .lenspkg file
   */
  public static exportLensPackage(project: LensProject): Blob {
    const pkg: LensPackageContent = {
      header: {
        formatVersion: "2.5.0",
        lensId: project.id,
        name: project.name,
        author: project.author || "SnapAR Lens Creator",
        category: project.category || "AR Custom",
        createdAt: new Date().toISOString(),
        sdkVersion: "SnapAR-v2.5.0",
        fpsTarget: 60,
        previewImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
      elements: project.elements,
      shaderConfigs: {
        vertexShader: "attribute vec3 aPosition; attribute vec2 aTexCoord; void main() { gl_Position = vec4(aPosition, 1.0); }",
        fragmentShader: "precision highp float; uniform sampler2D uTexture; void main() { gl_FragColor = texture2D(uTexture, gl_FragCoord.xy); }",
        uniforms: {
          uTime: 0.0,
          uResolution: [1080, 1920],
        },
      },
      assetManifest: project.elements.map((el, index) => ({
        id: `asset_${index}`,
        filename: el.name.toLowerCase().replace(/\s+/g, "_") + ".png",
        type: el.type,
        base64Data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      })),
      animations: project.elements.map((el) => ({
        id: `anim_${el.id}`,
        trigger: el.trigger,
        durationMs: 1200,
        easing: el.curve || "ease_in_out",
      })),
    };

    const jsonStr = JSON.stringify(pkg, null, 2);
    return new Blob([jsonStr], { type: "application/vnd.snapar.lenspkg+json" });
  }

  /**
   * Import a .lenspkg file and parse its content back into a LensProject
   */
  public static async importLensPackage(file: File): Promise<LensProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string) as LensPackageContent;
          if (!content.header || !content.elements) {
            throw new Error("Invalid .lenspkg package structure.");
          }

          const importedProject: LensProject = {
            id: content.header.lensId || `imported_${Date.now()}`,
            name: content.header.name || file.name.replace(".lenspkg", ""),
            category: content.header.category || "Imported Lens",
            description: `Imported from package (SDK ${content.header.sdkVersion || "2.5"})`,
            elements: content.elements,
            author: content.header.author || "External Developer",
            status: "Published",
            updatedAt: new Date().toISOString(),
          };

          resolve(importedProject);
        } catch (err: any) {
          reject(new Error(`Failed to parse .lenspkg package: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error("File reading failed."));
      reader.readAsText(file);
    });
  }
}
