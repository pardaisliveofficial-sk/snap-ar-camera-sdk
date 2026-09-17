import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __dirname = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client securely server-side
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Global active filter state for live API synchronization
  let activeApiFilterState = {
    activeMaskId: "cute_puppy",
    beautyParams: {
      skinSmoothing: 70,
      eyeBrightening: 50,
      faceSlimming: 30,
      noseSlimming: 25,
      lipTint: 30,
      lipColor: "#ff4d6d",
      virtualRingLight: true,
      ringLightIntensity: 60,
      ringLightColor: "white",
      sharpening: 40,
      brightness: 105,
      saturation: 110,
      warmth: 10,
      vignette: 20,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: "SDK Client",
  };

  // In-memory data store for uploaded assets, Lens Studio projects, and published filters
  const mockProjects = [
    {
      id: "proj_01",
      name: "Neon Cyberpunk HUD Lens",
      category: "AR Filter",
      status: "Published",
      views: "1.4M",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetPlatform: "iOS / Android / Flutter / Web",
      elementsCount: 6,
    },
    {
      id: "proj_02",
      name: "Kawaii Bunny Ears & Blush",
      category: "Face Mask",
      status: "Draft",
      views: "89K",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetPlatform: "iOS / Android / WebRTC",
      elementsCount: 4,
    },
  ];

  const mockAssets = [
    { id: "asset_01", name: "dog_ears_overlay.png", type: "image/png", size: "245 KB", category: "2D Overlay", url: "/assets/dog_ears.png" },
    { id: "asset_02", name: "cyber_grid.svg", type: "image/svg+xml", size: "18 KB", category: "Vector HUD", url: "/assets/cyber_grid.svg" },
    { id: "asset_03", name: "sparkles.webm", type: "video/webm", size: "1.2 MB", category: "Animated Particles", url: "/assets/sparkles.webm" },
    { id: "asset_04", name: "angel_halo.glb", type: "model/gltf-binary", size: "3.4 MB", category: "3D Model", url: "/assets/angel_halo.glb" },
  ];

  // API 1: GET /api/v1/filters - Get list of available AR camera filters and parameters
  app.get("/api/v1/filters", (_req, res) => {
    res.json({
      success: true,
      version: "1.0.0",
      totalFilters: 12,
      filters: [
        { id: "cute_puppy", name: "Doggy Snout & Ears", category: "ar_masks", icon: "Dog", tag: "Popular", features: ["dog_ears", "snout", "tongue_animation"] },
        { id: "golden_hour", name: "Golden Sunset Hour", category: "cinematic", icon: "Sun", tag: "Trending", features: ["warm_glow", "sunflare", "lens_flare"] },
        { id: "kawaii_cat", name: "Kawaii Cat & Whiskers", category: "ar_masks", icon: "Cat", features: ["cat_ears", "pink_whiskers", "soft_blush"] },
        { id: "cool_glasses", name: "Cyber Retro Shades", category: "ar_masks", icon: "Glasses", features: ["tinted_shades", "neon_reflection"] },
        { id: "flower_crown", name: "Boho Flower Crown", category: "beauty", icon: "Flower2", features: ["flower_crown", "sparkles", "soft_skin"] },
        { id: "angel_wings", name: "Angel Halo & Glow", category: "beauty", icon: "Crown", tag: "NEW", features: ["glowing_halo", "soft_aureole"] },
        { id: "heart_aura", name: "Floating Hearts Aura", category: "beauty", icon: "Heart", features: ["floating_hearts", "blush_cheeks"] },
        { id: "soft_glam", name: "K-Beauty Glass Skin", category: "beauty", icon: "Smile", tag: "HD Glam", features: ["smoothing_90", "eye_sparkle", "pink_tint"] },
        { id: "vhs_retro", name: "90s Retro Camcorder", category: "retro", icon: "Video", features: ["scanlines", "vhs_timestamp", "chromatic_aberration"] },
        { id: "sparkle_halo", name: "Sparkle & Glitter", category: "beauty", icon: "Stars", features: ["face_glitter", "eye_shimmer"] },
        { id: "neon_cyber", name: "Cyberpunk HUD", category: "cyber", icon: "Binary", tag: "Sci-Fi", features: ["face_grid", "neon_lines", "cyber_eyes"] },
      ],
      beautyParameterSchema: {
        skinSmoothing: { type: "number", min: 0, max: 100, default: 70 },
        eyeBrightening: { type: "number", min: 0, max: 100, default: 50 },
        faceSlimming: { type: "number", min: 0, max: 100, default: 30 },
        noseSlimming: { type: "number", min: 0, max: 100, default: 25 },
        lipTint: { type: "number", min: 0, max: 100, default: 30 },
        lipColor: { type: "string", format: "hex", default: "#ff4d6d" },
        virtualRingLight: { type: "boolean", default: true },
        ringLightIntensity: { type: "number", min: 0, max: 100, default: 60 },
        brightness: { type: "number", min: 80, max: 140, default: 105 },
        saturation: { type: "number", min: 50, max: 180, default: 110 },
        warmth: { type: "number", min: -30, max: 50, default: 10 },
      }
    });
  });

  // API 2: GET /api/v1/active-filter - Fetch current active camera filter state
  app.get("/api/v1/active-filter", (_req, res) => {
    res.json({
      success: true,
      state: activeApiFilterState,
    });
  });

  // API 3: POST /api/v1/apply-filter & /api/v1/filter/apply
  const handleApplyFilter = (req: express.Request, res: express.Response) => {
    const { maskId, filterId, beautyParams, sourceApp } = req.body;
    const targetMask = maskId || filterId;

    if (targetMask) {
      activeApiFilterState.activeMaskId = targetMask;
    }
    if (beautyParams && typeof beautyParams === "object") {
      activeApiFilterState.beautyParams = {
        ...activeApiFilterState.beautyParams,
        ...beautyParams,
      };
    }
    activeApiFilterState.updatedAt = new Date().toISOString();
    activeApiFilterState.updatedBy = sourceApp || "SnapAR SDK";

    res.json({
      success: true,
      message: `Filter successfully applied to AR Camera Pipeline!`,
      currentState: activeApiFilterState,
    });
  };

  app.post("/api/v1/apply-filter", handleApplyFilter);
  app.post("/api/v1/filter/apply", handleApplyFilter);

  // API: POST /api/v1/filter/upload - Upload new Lens Studio filter package
  app.post("/api/v1/filter/upload", (req, res) => {
    const { filterName, author, assets, trigger, attachPoint } = req.body;
    const newFilter = {
      id: `custom_${Date.now()}`,
      name: filterName || "Untitled Custom Filter",
      author: author || "Developer Studio User",
      status: "Uploaded",
      attachPoint: attachPoint || "forehead",
      trigger: trigger || "none",
      assetsCount: Array.isArray(assets) ? assets.length : 1,
      uploadedAt: new Date().toISOString(),
    };
    res.json({
      success: true,
      message: "Filter package uploaded successfully!",
      filter: newFilter,
    });
  });

  // API: POST /api/v1/filter/publish - Publish Lens Studio filter to SnapStream Marketplace
  app.post("/api/v1/filter/publish", (req, res) => {
    const { filterId, filterName, targetPlatforms } = req.body;
    res.json({
      success: true,
      message: "Filter published successfully to SnapStream Global Marketplace!",
      filterId: filterId || `snap_lens_${Date.now()}`,
      filterName: filterName || "Custom AR Lens",
      platforms: targetPlatforms || ["iOS", "Android", "Web", "Flutter", "OBS"],
      publishedAt: new Date().toISOString(),
    });
  });

  // API: POST /api/v1/generate-ai-filter - AI Filter Builder endpoint
  app.post("/api/v1/generate-ai-filter", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    try {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are an expert AR Camera Filter GLSL Shader Engine. A user wants to create an AR face filter with prompt: "${prompt}".
Generate a JSON response with the following keys:
"name": A catchy short title (e.g. Cyberpunk Neon Horizon)
"category": Category e.g. "AI Cyberpunk" or "AI Fantasy"
"description": A 1-sentence description of the visual effect
"shaderCode": A valid WebGL fragment shader string
"anchors": Array of 3D face mesh landmark points (e.g. ["Forehead (#10)", "Iris (#33)"])
"primaryColor": Hex color string e.g. "#00f0ff"
"particleCount": Number between 50 and 200

Return ONLY valid raw JSON with no markdown formatting.`,
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            success: true,
            filter: {
              id: `ai_${Date.now()}`,
              name: parsed.name || "AI Generated Filter",
              category: parsed.category || "AI Custom",
              description: parsed.description || `Generated from prompt: "${prompt}"`,
              shaderCode: parsed.shaderCode || `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nvoid main() {\n  vec4 col = texture2D(uTexture, vUv);\n  gl_FragColor = col;\n}`,
              anchors: parsed.anchors || ["Forehead (#10)", "Lips (#0)"],
              primaryColor: parsed.primaryColor || "#00f0ff",
              particleCount: parsed.particleCount || 100,
              beautyOverlay: true,
            },
          });
        }
      }

      // Smart Parametric Fallback if no Gemini API Key is configured
      const titleClean = prompt.length > 25 ? prompt.slice(0, 25) + "..." : prompt;
      res.json({
        success: true,
        filter: {
          id: `ai_${Date.now()}`,
          name: titleClean.replace(/^\w/, (c) => c.toUpperCase()) + " Lens",
          category: "AI Synthesized",
          description: `Custom AR filter generated from prompt: "${prompt}"`,
          shaderCode: `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform float uTime;\n\nvoid main() {\n  vec4 color = texture2D(uTexture, vUv);\n  color.rgb += vec3(0.0, 0.94, 1.0) * sin(uTime * 3.0 + vUv.x * 10.0) * 0.2;\n  gl_FragColor = color;\n}`,
          anchors: ["Forehead (#10)", "Both Eyes Center", "Cheekbones (#234)"],
          primaryColor: "#00f0ff",
          particleCount: 120,
          beautyOverlay: true,
        },
      });
    } catch (err: any) {
      res.json({
        success: true,
        filter: {
          id: `ai_${Date.now()}`,
          name: "Synthesized AR Filter",
          category: "AI Synthesized",
          description: `Generated filter from prompt: "${prompt}"`,
          shaderCode: `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nvoid main() {\n  gl_FragColor = texture2D(uTexture, vUv);\n}`,
          anchors: ["Forehead (#10)", "Lips (#0)"],
          primaryColor: "#ec4899",
          particleCount: 90,
          beautyOverlay: true,
        },
      });
    }
  });

  // API: GET /api/v1/projects & POST /api/v1/projects
  app.get("/api/v1/projects", (_req, res) => {
    res.json({
      success: true,
      total: mockProjects.length,
      projects: mockProjects,
    });
  });

  app.post("/api/v1/projects", (req, res) => {
    const { name, category, targetPlatform } = req.body;
    const newProj = {
      id: `proj_${Date.now()}`,
      name: name || "New Lens Project",
      category: category || "AR Filter",
      status: "Draft",
      views: "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetPlatform: targetPlatform || "iOS / Android / Web",
      elementsCount: 0,
    };
    mockProjects.unshift(newProj);
    res.json({
      success: true,
      message: "Project created successfully!",
      project: newProj,
    });
  });

  // API: POST /api/v1/auth/login & POST /api/v1/auth/register
  app.post("/api/v1/auth/login", (req, res) => {
    const { email, password } = req.body;
    res.json({
      success: true,
      token: `jwt_snap_token_${Math.random().toString(36).substring(2)}${Date.now()}`,
      user: {
        id: "usr_snap_99",
        name: "SnapStream Developer",
        email: email || "developer@snapstream.io",
        tier: "Studio Enterprise Pro",
      },
    });
  });

  app.post("/api/v1/auth/register", (req, res) => {
    const { name, email } = req.body;
    res.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: `usr_snap_${Date.now()}`,
        name: name || "Developer",
        email: email || "user@snapstream.io",
        tier: "Free Developer Sandbox",
      },
    });
  });

  // API: GET /api/v1/assets & POST /api/v1/assets/upload
  app.get("/api/v1/assets", (_req, res) => {
    res.json({
      success: true,
      total: mockAssets.length,
      assets: mockAssets,
    });
  });

  app.post("/api/v1/assets/upload", (req, res) => {
    const { filename, filetype, category } = req.body;
    const newAsset = {
      id: `asset_${Date.now()}`,
      name: filename || "uploaded_asset.png",
      type: filetype || "image/png",
      size: "450 KB",
      category: category || "2D Overlay",
      url: `/assets/${filename || "asset.png"}`,
    };
    mockAssets.unshift(newAsset);
    res.json({
      success: true,
      message: "Asset uploaded successfully!",
      asset: newAsset,
    });
  });

  // API 4: POST /api/v1/sdk/generate-key - Generate API Key & App Secret for embedding in third-party apps
  app.post("/api/v1/sdk/generate-key", (req, res) => {
    const { appName, platform } = req.body;
    const apiKey = `snap_live_sk_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    const appSecret = `sec_${Math.random().toString(36).substring(2, 15)}`;

    res.json({
      success: true,
      appName: appName || "My Custom Streaming App",
      platform: platform || "OBS / Web / Mobile",
      apiKey,
      appSecret,
      endpointUrl: `https://${req.get("host")}/api/v1`,
      sdkScriptUrl: `https://${req.get("host")}/api/v1/sdk/embed.js`,
      createdAt: new Date().toISOString(),
    });
  });

  // API 5: GET /api/v1/sdk/embed.js - Embeddable JavaScript SDK snippet for web & streaming apps
  app.get("/api/v1/sdk/embed.js", (req, res) => {
    const hostUrl = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
/**
 * SnapStream Camera AR Filters SDK v1.0.0
 * Embed real-time Snapchat AR filters & beauty controls in any web or streaming app!
 */
(function(window) {
  class SnapStreamFilterSDK {
    constructor(config = {}) {
      this.apiKey = config.apiKey || '';
      this.baseUrl = config.baseUrl || '${hostUrl}/api/v1';
      this.currentFilter = config.defaultFilter || 'cute_puppy';
      console.log('✨ [SnapStream SDK] Initialized with Base URL:', this.baseUrl);
    }

    async getAvailableFilters() {
      const res = await fetch(this.baseUrl + '/filters');
      return await res.json();
    }

    async setFilter(maskId, beautyParams = {}) {
      const res = await fetch(this.baseUrl + '/apply-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maskId,
          beautyParams,
          sourceApp: 'SnapStream JS SDK Client'
        })
      });
      return await res.json();
    }

    async getActiveState() {
      const res = await fetch(this.baseUrl + '/active-filter');
      return await res.json();
    }
  }

  window.SnapStreamFilterSDK = SnapStreamFilterSDK;
})(window);
    `);
  });

  // AI Beauty Advisor endpoint
  app.post("/api/ai/beauty-advisor", async (req, res) => {
    try {
      const { streamingPlatform, lightingType, vibe, currentSettings } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured.",
          fallbackAdvice: "Recommended: Set Skin Smoothing to 65%, Soft Glow to 40%, and apply the Golden Hour preset for optimal live streaming quality!"
        });
      }

      const prompt = `You are a professional Snapchat & TikTok Live Stream Beauty Camera Stylist and Lighting Engineer.
A live streamer needs real-time filter recommendations.
Stream Context:
- Platform: ${streamingPlatform || "Twitch / TikTok / Live"}
- Lighting Environment: ${lightingType || "Standard Room / Ring Light"}
- Desired Aesthetic Vibe: ${vibe || "Soft Glam & Fresh"}
- Current Filter Parameters: ${JSON.stringify(currentSettings || {})}

Provide a tailored recommendations JSON response with:
1. "title": Short catchy preset title (e.g., "K-Beauty Soft Glow" or "Cyberpunk Streamer")
2. "beautySettings": { "smoothing": 0-100, "eyeEnlargement": 0-100, "faceSlimming": 0-100, "vibrance": 0-100, "warmth": -50 to 50, "sharpness": 0-100, "softGlow": 0-100, "ringLightGlow": 0-100 }
3. "recommendedMask": ID of recommended AR filter (e.g. "golden_hour", "cute_puppy", "kawaii_cat", "neon_cyber", "flower_crown", "angel_wings", "soft_glam", "vhs_retro")
4. "proTips": Array of 3 expert live streaming camera & lighting tips for Roman Urdu/English users.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      res.json({ success: true, advice: parsed });
    } catch (err: any) {
      console.error("AI Beauty Advisor error:", err);
      res.status(500).json({ error: "Failed to generate AI advice", message: err?.message });
    }
  });

  // AI Custom Filter Generator Endpoint
  app.post("/api/ai/generate-custom-filter", async (req, res) => {
    try {
      const { filterPrompt } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured.",
          fallbackPreset: {
            name: "Custom Warm Dream",
            smoothing: 70,
            vibrance: 65,
            contrast: 105,
            brightness: 105,
            sepia: 20,
            hueRotate: 15,
            blur: 0,
            softGlow: 45,
            mask: "golden_hour",
            tintColor: "#ffa852"
          }
        });
      }

      const prompt = `Create a custom video filter parameter set based on this prompt: "${filterPrompt}".
Return a JSON object with:
- "name": String short name for the filter
- "smoothing": Number (0 to 100)
- "brightness": Number (80 to 140)
- "contrast": Number (80 to 150)
- "saturate": Number (50 to 200)
- "vibrance": Number (0 to 100)
- "hueRotate": Number (0 to 360)
- "sepia": Number (0 to 80)
- "softGlow": Number (0 to 100)
- "sharpness": Number (0 to 100)
- "tintColor": Hex color string (e.g. "#ff6b9d" or "transparent")
- "tintOpacity": Number (0 to 0.5)
- "mask": String one of ["golden_hour", "cute_puppy", "kawaii_cat", "neon_cyber", "flower_crown", "angel_wings", "heart_aura", "soft_glam", "vhs_retro", "sparkle_halo"]
- "description": Short description of the visual style.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, filter: parsed });
    } catch (err: any) {
      console.error("AI Custom Filter Error:", err);
      res.status(500).json({ error: "Failed to generate filter", message: err?.message });
    }
  });

  // Serve static assets or Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SnapStream Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
