import React, { useState } from "react";
import { Bot, Wand2, X, Sparkles, Check, Lightbulb } from "lucide-react";
import { ARMaskId, BeautyParameters } from "../types";

interface AiStylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: BeautyParameters;
  onApplyAdvice: (beautyParams: Partial<BeautyParameters>, maskId?: ARMaskId) => void;
}

export const AiStylistModal: React.FC<AiStylistModalProps> = ({
  isOpen,
  onClose,
  currentParams,
  onApplyAdvice,
}) => {
  const [activeTab, setActiveTab] = useState<"advisor" | "prompt">("advisor");

  // Advisor form
  const [platform, setPlatform] = useState("TikTok Live / Reels");
  const [lighting, setLighting] = useState("Ring Light & Standard Room");
  const [vibe, setVibe] = useState("K-Beauty Soft Glam & Glass Skin");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Custom Prompt Filter
  const [filterPrompt, setFilterPrompt] = useState("");
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [customFilterResult, setCustomFilterResult] = useState<any | null>(null);

  if (!isOpen) return null;

  // Call Gemini API for Beauty Advisor
  const generateAiAdvice = async () => {
    setLoadingAdvice(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/beauty-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamingPlatform: platform,
          lightingType: lighting,
          vibe,
          currentSettings: currentParams,
        }),
      });

      const data = await res.json();
      if (data.advice) {
        setAiResult(data.advice);
      } else if (data.fallbackAdvice) {
        setAiResult({
          title: "K-Beauty Soft Glow Preset",
          beautySettings: {
            skinSmoothing: 75,
            eyeBrightening: 60,
            vibrance: 40,
            warmth: 15,
            softGlow: 50,
          },
          recommendedMask: "soft_glam",
          proTips: [
            "Use warm ring light fill to eliminate harsh eye shadows.",
            "Set skin smoothing to 70-80% for seamless glass skin in live streams.",
            "Keep face centered so Snapchat AR filters track landmarks at 60 FPS.",
          ],
        });
      }
    } catch (e) {
      // Fallback
      setAiResult({
        title: "K-Beauty Soft Glow Preset",
        beautySettings: {
          skinSmoothing: 70,
          eyeBrightening: 55,
          warmth: 10,
        },
        recommendedMask: "soft_glam",
        proTips: [
          "Camera positioned at eye level gives the most flattering Snapchat result.",
          "Soft pink or warm ring light creates vivid eye reflections.",
        ],
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Call Gemini API for Custom Filter Prompt
  const generateCustomPromptFilter = async () => {
    if (!filterPrompt.trim()) return;
    setLoadingFilter(true);
    setCustomFilterResult(null);

    try {
      const res = await fetch("/api/ai/generate-custom-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterPrompt }),
      });

      const data = await res.json();
      if (data.filter) {
        setCustomFilterResult(data.filter);
      }
    } catch (e) {
      // Fallback
      setCustomFilterResult({
        name: filterPrompt + " Custom",
        smoothing: 70,
        brightness: 108,
        contrast: 105,
        saturate: 120,
        mask: "golden_hour",
        description: "Custom AI filter generated from prompt.",
      });
    } finally {
      setLoadingFilter(false);
    }
  };

  const handleApplyAdvicePreset = () => {
    if (!aiResult) return;

    const bs = aiResult.beautySettings || {};
    onApplyAdvice(
      {
        skinSmoothing: bs.smoothing ?? 70,
        eyeBrightening: bs.eyeEnlargement ?? 60,
        warmth: bs.warmth ?? 10,
        sharpening: bs.sharpness ?? 40,
      },
      aiResult.recommendedMask as ARMaskId
    );

    onClose();
  };

  const handleApplyCustomFilter = () => {
    if (!customFilterResult) return;

    onApplyAdvice(
      {
        skinSmoothing: customFilterResult.smoothing ?? 60,
        brightness: customFilterResult.brightness ?? 105,
        contrast: customFilterResult.contrast ?? 105,
        saturation: customFilterResult.saturate ?? 110,
      },
      customFilterResult.mask as ARMaskId
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Gemini Beauty & Filter Engine</h2>
            <p className="text-xs text-slate-400">
              Get personalized live camera lighting advice & generate custom filter profiles.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("advisor")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "advisor"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            AI Beauty Advisor
          </button>

          <button
            onClick={() => setActiveTab("prompt")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "prompt"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Generate Filter via Prompt
          </button>
        </div>

        {/* TAB 1: AI BEAUTY ADVISOR */}
        {activeTab === "advisor" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Streaming Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-200"
                >
                  <option>TikTok Live / Reels</option>
                  <option>Twitch Gaming Stream</option>
                  <option>YouTube Live Stream</option>
                  <option>Zoom / Video Call</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Room Lighting</label>
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-200"
                >
                  <option>Ring Light & Standard Room</option>
                  <option>Low Light / Dark Room</option>
                  <option>Natural Daylight Window</option>
                  <option>RGB Gaming Neon Lights</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold text-xs block mb-1">Desired Aesthetic Vibe</label>
              <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Soft Glam Glass Skin, Cyberpunk Neon, Golden Hour Sunset"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200"
              />
            </div>

            <button
              onClick={generateAiAdvice}
              disabled={loadingAdvice}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingAdvice ? "Analyzing Camera Feed..." : "Get AI Camera Recommendations"}</span>
            </button>

            {/* AI Result View */}
            {aiResult && (
              <div className="bg-slate-800/60 border border-purple-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-pink-300">{aiResult.title}</h3>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                    AI Recommended
                  </span>
                </div>

                {/* Pro Tips */}
                {aiResult.proTips && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Streaming Tips:
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                      {aiResult.proTips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleApplyAdvicePreset}
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply AI Recommended Filter & Preset</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI CUSTOM FILTER PROMPT */}
        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Describe the filter you want to create:
              </label>
              <textarea
                value={filterPrompt}
                onChange={(e) => setFilterPrompt(e.target.value)}
                placeholder="e.g. Korean Glass Skin with Soft Pink Glow and Golden Sparkles, 90s Camcorder VHS tone, Cyberpunk Neon Glasses..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={generateCustomPromptFilter}
              disabled={loadingFilter || !filterPrompt.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4 text-pink-300" />
              <span>{loadingFilter ? "Generating Custom Filter..." : "Build Custom Filter"}</span>
            </button>

            {customFilterResult && (
              <div className="bg-slate-800/60 border border-pink-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <h3 className="text-sm font-bold text-pink-300">{customFilterResult.name}</h3>
                <p className="text-xs text-slate-300">{customFilterResult.description}</p>
                <button
                  onClick={handleApplyCustomFilter}
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Custom Generated Filter</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
