import React, { useState } from "react";
import {
  Code,
  Terminal,
  Key,
  Copy,
  Check,
  Send,
  Zap,
  Layers,
  Globe,
  Smartphone,
  Cpu,
  Tv,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ARMaskId, BeautyParameters } from "../types";
import { AR_MASKS } from "../data/presets";

interface ApiSdkConsoleProps {
  activeMaskId: ARMaskId;
  beautyParams: BeautyParameters;
  onApplyFilterFromApi: (maskId: ARMaskId, beautyParams?: Partial<BeautyParameters>) => void;
}

export const ApiSdkConsole: React.FC<ApiSdkConsoleProps> = ({
  activeMaskId,
  beautyParams,
  onApplyFilterFromApi,
}) => {
  const [activeTab, setActiveTab] = useState<"playground" | "keys" | "code" | "virtual_cam">("playground");
  const [codeLanguage, setCodeLanguage] = useState<
    "js" | "flutter" | "kotlin" | "java" | "swift" | "react" | "vue" | "webrtc" | "curl" | "obs"
  >("js");

  // API Key State
  const [apiKey, setApiKey] = useState("snap_live_sk_8f92a1b3c4d5");
  const [appName, setAppName] = useState("TikTok Live & OBS Streamer");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Playground Test State
  const [testMaskId, setTestMaskId] = useState<ARMaskId>(activeMaskId);
  const [testSkinSmoothing, setTestSkinSmoothing] = useState(85);
  const [testEyeBrightening, setTestEyeBrightening] = useState(60);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [lastApiSource, setLastApiSource] = useState<string | null>(null);

  const hostUrl = typeof window !== "undefined" ? window.location.origin : "https://app.snapstream.io";

  // Generate new API Key via Server
  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await fetch("/api/v1/sdk/generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, platform: "Cross-Platform Streaming SDK" }),
      });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    } catch (e) {
      setApiKey(`snap_live_sk_${Math.random().toString(36).substring(2, 12)}`);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Execute Live API Request
  const handleTestApiCall = async () => {
    setIsSendingRequest(true);
    setApiResponse(null);

    const payload = {
      apiKey,
      maskId: testMaskId,
      beautyParams: {
        skinSmoothing: testSkinSmoothing,
        eyeBrightening: testEyeBrightening,
      },
      sourceApp: "Interactive API Playground",
    };

    try {
      const res = await fetch("/api/v1/apply-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));

      if (data.success) {
        // Apply to live UI stream instantly!
        onApplyFilterFromApi(testMaskId, {
          skinSmoothing: testSkinSmoothing,
          eyeBrightening: testEyeBrightening,
        });
        setLastApiSource("API Request Success: Applied to Live Camera!");
      }
    } catch (e: any) {
      setApiResponse(JSON.stringify({ error: "Failed to connect to API", details: e?.message }, null, 2));
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Fetch Available Filters List API
  const handleFetchFiltersList = async () => {
    setIsSendingRequest(true);
    try {
      const res = await fetch("/api/v1/filters");
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setApiResponse(JSON.stringify({ error: e?.message }, null, 2));
    } finally {
      setIsSendingRequest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Generated Code Snippets for all target SDK platforms
  const getJsCode = () => `// JavaScript / Web Browser SDK Initialization
import { SnapStreamSDK } from '@snapstream/ar-sdk';

const sdk = new SnapStreamSDK({
  apiKey: "${apiKey}",
  endpoint: "${hostUrl}/api/v1"
});

await sdk.startCamera({ videoResolution: "1080p", targetFps: 60 });
await sdk.applyFilter('${testMaskId}', {
  skinSmoothing: ${testSkinSmoothing},
  eyeBrightening: ${testEyeBrightening}
});`;

  const getFlutterCode = () => `// Flutter AR Camera SDK (iOS & Android)
import 'package:snapstream_ar_sdk/snapstream_ar_sdk.dart';

final snapSdk = SnapStreamSDK(
  apiKey: "${apiKey}",
  baseUrl: "${hostUrl}/api/v1",
);

await snapSdk.initializeCamera(
  lensId: "${testMaskId}",
  beautyParams: {
    "skinSmoothing": ${testSkinSmoothing},
    "eyeBrightening": ${testEyeBrightening},
  },
);`;

  const getKotlinCode = () => `// Android SDK (Kotlin)
import io.snapstream.ar.SnapStreamCameraKit

val cameraKit = SnapStreamCameraKit(
    context = applicationContext,
    apiKey = "${apiKey}"
)

cameraKit.startCameraSession(lifecycleOwner = this)
cameraKit.applyFilter(
    maskId = "${testMaskId}",
    skinSmoothing = ${testSkinSmoothing}
)`;

  const getJavaCode = () => `// Android SDK (Java)
import io.snapstream.ar.SnapStreamCameraKit;

SnapStreamCameraKit cameraKit = new SnapStreamCameraKit(
    getApplicationContext(),
    "${apiKey}"
);

cameraKit.startCameraSession(this);
cameraKit.applyFilter("${testMaskId}", ${testSkinSmoothing});`;

  const getSwiftCode = () => `// iOS SDK (Swift / ARKit + Metal)
import SnapStreamARSDK

let snapCam = SnapStreamCameraKit(apiKey: "${apiKey}")
snapCam.startSession(resolution: .fullHD)

snapCam.applyLens(
    id: "${testMaskId}",
    beautySettings: BeautySettings(skinSmoothing: ${testSkinSmoothing})
)`;

  const getReactCode = () => `// React & React Native AR Camera Component
import { SnapStreamCameraView } from '@snapstream/react-ar';

export function MyCameraApp() {
  return (
    <SnapStreamCameraView
      apiKey="${apiKey}"
      activeMaskId="${testMaskId}"
      beautyParams={{ skinSmoothing: ${testSkinSmoothing} }}
      onMediaCaptured={(url) => console.log('Saved AR snap:', url)}
    />
  );
}`;

  const getVueCode = () => `// Vue 3 AR Filter Component
<template>
  <SnapStreamCamera
    :apiKey="apiKey"
    :activeMaskId="maskId"
    @onFrame="handleFrame"
  />
</template>

<script setup>
import { SnapStreamCamera } from '@snapstream/vue-ar';
const apiKey = "${apiKey}";
const maskId = "${testMaskId}";
</script>`;

  const getWebRtcCode = () => `// WebRTC Live Stream Integration (MediaStream pipeline)
const canvasStream = canvas.captureStream(60);
const peerConnection = new RTCPeerConnection(rtcConfig);

canvasStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, canvasStream);
});`;

  const getCurlCode = () => `# Apply Snapchat AR Filter via REST API
curl -X POST "${hostUrl}/api/v1/apply-filter" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "maskId": "${testMaskId}",
    "beautyParams": {
      "skinSmoothing": ${testSkinSmoothing},
      "eyeBrightening": ${testEyeBrightening}
    },
    "sourceApp": "External Live Streaming App"
  }'`;

  const getObsCode = () => `// OBS Studio / TikTok Live Studio - Browser Source Filter Listener Script
const evtSource = new EventSource("${hostUrl}/api/v1/active-filter");

// Automatically updates Snapchat AR filter when triggered remotely
fetch("${hostUrl}/api/v1/active-filter")
  .then(res => res.json())
  .then(data => {
    console.log("Active Stream Filter Config:", data.state);
  });`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              SnapStream AR Filters REST & SDK API
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                v1.0 LIVE API
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Implement these Snapchat AR filters directly into streaming apps, WebRTC, OBS, or mobile apps via REST API & SDK.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab("playground")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "playground"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>API Playground</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "code"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SDK Code Snippets</span>
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "keys"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE API PLAYGROUND */}
      {activeTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Left Column: API Request Constructor */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-pink-400" />
                Live API Controller Request
              </span>
              <span className="font-mono text-[11px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md">
                POST /api/v1/apply-filter
              </span>
            </div>

            {/* Select Filter ID */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Target Snapchat Filter (maskId)</label>
              <select
                value={testMaskId}
                onChange={(e) => setTestMaskId(e.target.value as ARMaskId)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 font-medium focus:outline-none focus:border-pink-500"
              >
                {AR_MASKS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Beauty Parameters in Payload */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">skinSmoothing</label>
                  <span className="text-pink-400 font-mono font-bold">{testSkinSmoothing}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={testSkinSmoothing}
                  onChange={(e) => setTestSkinSmoothing(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">eyeBrightening</label>
                  <span className="text-cyan-400 font-mono font-bold">{testEyeBrightening}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={testEyeBrightening}
                  onChange={(e) => setTestEyeBrightening(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleTestApiCall}
                disabled={isSendingRequest}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isSendingRequest ? "Executing API..." : "Send API Request & Apply Live"}</span>
              </button>

              <button
                onClick={handleFetchFiltersList}
                disabled={isSendingRequest}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 flex items-center gap-1.5"
                title="Fetch Filter Specs JSON"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>GET Filters Schema</span>
              </button>
            </div>

            {lastApiSource && (
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lastApiSource}</span>
              </p>
            )}
          </div>

          {/* Right Column: Live API JSON Response Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                JSON API Response Output
              </span>
              <span className="text-[10px] text-slate-500">200 OK</span>
            </div>

            <div className="flex-1 min-h-[180px] max-h-[220px] overflow-y-auto bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-pink-300 whitespace-pre-wrap">
              {apiResponse || (
                <span className="text-slate-600 italic">
                  // Click 'Send API Request' above to test the REST API live.
                  <br />
                  // Response payload from /api/v1/apply-filter will render here.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE SNIPPETS & SDK EXPORTER */}
      {activeTab === "code" && (
        <div className="space-y-4 text-xs">
          {/* Sub-language switch tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "js", label: "JavaScript / Web", icon: Globe },
              { id: "flutter", label: "Flutter SDK", icon: Smartphone },
              { id: "kotlin", label: "Android (Kotlin)", icon: Smartphone },
              { id: "java", label: "Android (Java)", icon: Smartphone },
              { id: "swift", label: "iOS (Swift)", icon: Smartphone },
              { id: "react", label: "React / RN", icon: Code },
              { id: "vue", label: "Vue.js", icon: Code },
              { id: "webrtc", label: "WebRTC", icon: Cpu },
              { id: "curl", label: "cURL / REST", icon: Terminal },
              { id: "obs", label: "OBS Studio", icon: Tv },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCodeLanguage(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    codeLanguage === (item.id as any)
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Box */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono">
            <button
              onClick={() => {
                const code =
                  codeLanguage === "js"
                    ? getJsCode()
                    : codeLanguage === "flutter"
                    ? getFlutterCode()
                    : codeLanguage === "kotlin"
                    ? getKotlinCode()
                    : codeLanguage === "java"
                    ? getJavaCode()
                    : codeLanguage === "swift"
                    ? getSwiftCode()
                    : codeLanguage === "react"
                    ? getReactCode()
                    : codeLanguage === "vue"
                    ? getVueCode()
                    : codeLanguage === "webrtc"
                    ? getWebRtcCode()
                    : codeLanguage === "curl"
                    ? getCurlCode()
                    : getObsCode();
                copyToClipboard(code);
              }}
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-bold border border-slate-700 z-10"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied!" : "Copy SDK Code"}</span>
            </button>

            <pre className="text-[11px] text-cyan-300 overflow-x-auto p-2 leading-relaxed">
              {codeLanguage === "js" && getJsCode()}
              {codeLanguage === "flutter" && getFlutterCode()}
              {codeLanguage === "kotlin" && getKotlinCode()}
              {codeLanguage === "java" && getJavaCode()}
              {codeLanguage === "swift" && getSwiftCode()}
              {codeLanguage === "react" && getReactCode()}
              {codeLanguage === "vue" && getVueCode()}
              {codeLanguage === "webrtc" && getWebRtcCode()}
              {codeLanguage === "curl" && getCurlCode()}
              {codeLanguage === "obs" && getObsCode()}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: API KEYS MANAGEMENT */}
      {activeTab === "keys" && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Active SDK Secret Key</p>
                <p className="text-[11px] text-slate-400">
                  Use this API key in your authorization header (`X-API-Key`) when calling SnapStream Filters REST API.
                </p>
              </div>

              <button
                onClick={handleGenerateApiKey}
                disabled={isGeneratingKey}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isGeneratingKey ? "Generating..." : "Generate New Key"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
              <span className="flex-1 text-pink-400 font-bold truncate">{apiKey}</span>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans font-bold border border-slate-700 flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
