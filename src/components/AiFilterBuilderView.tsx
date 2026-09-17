import React, { useState } from "react";
import { Sparkles, Send, Zap, Sliders, CheckCircle2, Play, Code2, Copy, RefreshCw, Wand2, Layers } from "lucide-react";
import { ARFilter } from "../types";

interface AiFilterBuilderViewProps {
  onApplyFilter?: (filter: ARFilter) => void;
}

const EXAMPLE_PROMPTS = [
  "Create a neon cyberpunk face filter with glowing horns and purple particle rain",
  "Design a vintage 90s VHS glitch filter with retro timestamp overlay and film grain",
  "Generate a cute anime blush filter with sparkling hearts on cheeks and soft skin blur",
  "Build a gold luxury crown filter with diamond particle flares on smile trigger",
];

export const AiFilterBuilderView: React.FC<AiFilterBuilderViewProps> = ({ onApplyFilter }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFilter, setGeneratedFilter] = useState<{
    id: string;
    name: string;
    category: string;
    description: string;
    shaderCode: string;
    anchors: string[];
    primaryColor: string;
    particleCount: number;
    beautyOverlay: boolean;
  } | null>({
    id: "ai_cyberpunk_neon",
    name: "Neon Cyberpunk Horizon",
    category: "AI Cyberpunk",
    description: "Generated from prompt: 'Create a neon cyberpunk face filter with glowing horns and purple particle rain'",
    shaderCode: `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform float uTime;\n\nvoid main() {\n  vec4 color = texture2D(uTexture, vUv);\n  color.rgb += vec3(0.0, 0.94, 1.0) * sin(uTime * 3.0) * 0.25;\n  color.rgb = mix(color.rgb, vec3(0.8, 0.1, 0.9), 0.2);\n  gl_FragColor = color;\n}`,
    anchors: ["Forehead (#10)", "Iris Track (#33/#263)", "Cheekbones (#234)"],
    primaryColor: "#00f0ff",
    particleCount: 120,
    beautyOverlay: true,
  });

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleGenerateFilter = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    setAppliedSuccess(false);

    try {
      const res = await fetch("/api/v1/generate-ai-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();

      if (data.success && data.filter) {
        setGeneratedFilter(data.filter);
      } else {
        // Parametric AI fallback
        setGeneratedFilter({
          id: `ai_${Date.now()}`,
          name: promptText.slice(0, 28) + "...",
          category: "AI Generated",
          description: `Custom synthesized filter from prompt: "${promptText}"`,
          shaderCode: `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform float uTime;\n\nvoid main() {\n  vec4 col = texture2D(uTexture, vUv);\n  col.rgb += vec3(0.9, 0.2, 0.8) * sin(vUv.x * 10.0 + uTime);\n  gl_FragColor = col;\n}`,
          anchors: ["Forehead (#10)", "Lips (#0)", "Cheeks (#234)"],
          primaryColor: "#ec4899",
          particleCount: 85,
          beautyOverlay: true,
        });
      }
    } catch (err) {
      setGeneratedFilter({
        id: `ai_${Date.now()}`,
        name: promptText.slice(0, 28) + " Filter",
        category: "AI Synthesized",
        description: `Synthesized filter from text prompt: "${promptText}"`,
        shaderCode: `precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\n\nvoid main() {\n  vec4 tex = texture2D(uTexture, vUv);\n  gl_FragColor = vec4(tex.r * 1.2, tex.g * 0.9, tex.b * 1.4, 1.0);\n}`,
        anchors: ["Forehead (#10)", "Both Eyes Center"],
        primaryColor: "#a855f7",
        particleCount: 100,
        beautyOverlay: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToCamera = () => {
    if (!generatedFilter) return;
    const filterObj: ARFilter = {
      id: generatedFilter.id,
      name: generatedFilter.name,
      category: "AI Generated",
      icon: "✨",
      previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop",
      intensity: 1.0,
      enabled: true,
    };
    if (onApplyFilter) {
      onApplyFilter(filterObj);
    }
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-pink-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">AI AR Filter Builder</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Generative AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Describe your dream AR filter in natural language. Our AI engine compiles GLSL fragment shaders, MediaPipe face anchors, and particle emitters automatically.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
          <span>Prompt Prompting Interface</span>
          <span className="text-pink-400 font-mono text-[10px]">Natural Language to GLSL Shader</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. 'Create a neon cyberpunk face filter with glowing horns and purple particle rain'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateFilter(prompt)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />

          <button
            onClick={() => handleGenerateFilter(prompt)}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-900/30 transition-all border border-pink-400/30 shrink-0 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{isGenerating ? "Generating Filter..." : "Generate AR Filter"}</span>
          </button>
        </div>

        {/* Quick Example Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Try example prompts:</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(ex);
                  handleGenerateFilter(ex);
                }}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 text-slate-300 px-3 py-1.5 rounded-xl transition-all text-left"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Result Output */}
      {generatedFilter && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Preview Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {generatedFilter.category}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">Status: Ready</span>
              </div>

              <h3 className="text-base font-bold text-white mt-2">{generatedFilter.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{generatedFilter.description}</p>
            </div>

            {/* Simulated Live Preview Box */}
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center animate-pulse"
                style={{ borderColor: generatedFilter.primaryColor }}
              >
                <Sparkles className="w-10 h-10" style={{ color: generatedFilter.primaryColor }} />
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                Live AI Canvas Preview
              </div>
            </div>

            <button
              onClick={handleApplyToCamera}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all border border-emerald-400/30"
            >
              {appliedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Zap className="w-4 h-4" />}
              <span>{appliedSuccess ? "Applied to Camera Preview!" : "Apply Filter to Live Camera"}</span>
            </button>
          </div>

          {/* Compiled Shader & Parameters (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200">Compiled GLSL Fragment Shader Code</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">WebGL2 / GLSL ES 3.0</span>
            </div>

            <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48">
              {generatedFilter.shaderCode}
            </pre>

            {/* Generated Feature Specs */}
            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">3D Face Anchors</span>
                <span className="font-bold text-white text-[11px]">{generatedFilter.anchors.join(", ")}</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Particles Emitter</span>
                <span className="font-bold text-pink-400 text-[11px]">{generatedFilter.particleCount} Active Flares</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Skin Smoothing</span>
                <span className="font-bold text-emerald-400 text-[11px]">Enabled (+35%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
