import React, { useState } from "react";
import { BookOpen, Search, Code, Sliders, Shield, Zap, Activity, CheckCircle2, ChevronRight, Copy, Check } from "lucide-react";

interface ApiFunctionDoc {
  id: string;
  name: string;
  signature: string;
  category: "Initialization" | "Configuration" | "Licensing" | "Camera & Frames" | "Filters & Beauty" | "Error Handling" | "Automated Tests";
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  returns: string;
  exampleCode: string;
}

const API_DOCS: ApiFunctionDoc[] = [
  {
    id: "fn_init",
    name: "SnapARCameraSDK.initialize()",
    signature: "initialize(config: SDKConfig): Promise<boolean>",
    category: "Initialization",
    description: "Initializes the SnapAR Camera Engine, validates API key or offline license credentials, and initializes WebGL2 shaders.",
    parameters: [
      { name: "apiKey", type: "string", required: true, description: "Your active SnapAR commercial or enterprise client API key." },
      { name: "cameraResolution", type: "'720p' | '1080p' | '4k'", required: false, description: "Target camera resolution preset (default '1080p')." },
      { name: "fps", type: "30 | 60", required: false, description: "Target frame rate cap (default 60 FPS)." },
      { name: "mirrorMode", type: "boolean", required: false, description: "Mirror camera video horizontally (default true)." },
      { name: "recordAudio", type: "boolean", required: false, description: "Enable microphone capture stream (default true)." },
      { name: "enableFaceTracking", type: "boolean", required: false, description: "Enable MediaPipe 468-point face tracking (default true)." },
    ],
    returns: "Promise<boolean> - Resolves true once GPU pipeline and license authorization succeed.",
    exampleCode: `import { sdk } from './lib/cameraSdk';

await sdk.initialize({
  apiKey: "snap_live_sk_enterprise_8829",
  cameraResolution: "1080p",
  fps: 60,
  mirrorMode: true,
  enableFaceTracking: true,
});`,
  },
  {
    id: "fn_license_val",
    name: "SnapARCameraSDK.validateLicense()",
    signature: "validateLicense(apiKey: string, offlineKey?: string): LicenseInfo",
    category: "Licensing",
    description: "Validates local API keys, offline signature tokens, subscription expiration, and returns license info.",
    parameters: [
      { name: "apiKey", type: "string", required: true, description: "SDK API Key string." },
      { name: "offlineKey", type: "string", required: false, description: "Optional offline license activation key." },
    ],
    returns: "LicenseInfo - Object containing valid, tier, expiresAt, and offlineAuthorized status.",
    exampleCode: `const license = sdk.validateLicense("snap_live_sk_1234");
console.log("Tier:", license.tier, "Valid:", license.valid);`,
  },
  {
    id: "fn_start_camera",
    name: "SnapARCameraSDK.startCamera()",
    signature: "startCamera(containerId?: string): Promise<HTMLCanvasElement>",
    category: "Camera & Frames",
    description: "Requests camera hardware permissions and starts the 60 FPS real-time WebGL rendering frame loop.",
    parameters: [
      { name: "containerId", type: "string", required: false, description: "Optional DOM element ID to attach render canvas." },
    ],
    returns: "Promise<HTMLCanvasElement> - Canvas element running real-time processed GPU frame stream.",
    exampleCode: `const canvas = await sdk.startCamera("camera-viewport");
document.body.appendChild(canvas);`,
  },
  {
    id: "fn_apply_beauty",
    name: "SnapARCameraSDK.setBeautyLevel()",
    signature: "setBeautyLevel(params: Partial<BeautyParameters>): void",
    category: "Filters & Beauty",
    description: "Updates real-time GPU skin smoothing, eye brightening, teeth whitening, and face slimming parameters.",
    parameters: [
      { name: "params", type: "Partial<BeautyParameters>", required: true, description: "Beauty levels (0 to 100)." },
    ],
    returns: "void",
    exampleCode: `sdk.setBeautyLevel({
  skinSmoothing: 80,
  faceSlimming: 25,
  eyeBrightening: 40,
  teethWhitening: 50,
});`,
  },
  {
    id: "fn_apply_filter",
    name: "SnapARCameraSDK.applyFilter()",
    signature: "applyFilter(filterId: string): void",
    category: "Filters & Beauty",
    description: "Applies a built-in GPU filter or custom Lens Studio filter by ID.",
    parameters: [
      { name: "filterId", type: "string", required: true, description: "Filter ID, e.g., 'neon_cyber' or 'cute_puppy'." },
    ],
    returns: "void",
    exampleCode: `sdk.applyFilter("neon_cyber");`,
  },
  {
    id: "fn_capture_photo",
    name: "SnapARCameraSDK.capturePhoto()",
    signature: "capturePhoto(): Promise<{ dataUrl: string; width: number; height: number; filterId: string }>",
    category: "Camera & Frames",
    description: "Captures a high-resolution snapshot with real-time AR filters rendered.",
    parameters: [],
    returns: "Promise<CapturedPhoto> - Object containing base64 dataUrl, dimensions, and active filter metadata.",
    exampleCode: `const photo = await sdk.capturePhoto();
console.log("Photo Captured:", photo.dataUrl);`,
  },
  {
    id: "fn_start_recording",
    name: "SnapARCameraSDK.startRecording()",
    signature: "startRecording(): void",
    category: "Camera & Frames",
    description: "Begins video buffer recording with hardware GPU stream encoding.",
    parameters: [],
    returns: "void",
    exampleCode: `sdk.startRecording();`,
  },
  {
    id: "fn_stop_recording",
    name: "SnapARCameraSDK.stopRecording()",
    signature: "stopRecording(): Promise<{ videoBlobUrl: string; durationMs: number }>",
    category: "Camera & Frames",
    description: "Stops recording and returns encoded MP4 video Blob URL.",
    parameters: [],
    returns: "Promise<RecordedVideo> - Object containing video Blob URL and duration.",
    exampleCode: `const record = await sdk.stopRecording();
videoElement.src = record.videoBlobUrl;`,
  },
  {
    id: "fn_error_handling",
    name: "Error Handling & SDK Errors",
    signature: "CameraSDKError (Permission, GPU, Device, Memory)",
    category: "Error Handling",
    description: "Handles structured errors including CameraPermissionError, GpuCompatibilityError, UnsupportedDeviceError, MemoryWarningError, and CameraInitializationError.",
    parameters: [
      { name: "onError", type: "(err: CameraSDKError) => void", required: false, description: "Callback triggered on SDK runtime failures." },
    ],
    returns: "CameraSDKError",
    exampleCode: `try {
  await sdk.startCamera();
} catch (err) {
  if (err instanceof CameraPermissionError) {
    alert("Please allow camera access in browser settings.");
  } else if (err instanceof GpuCompatibilityError) {
    console.warn("GPU WebGL2 fallback activated.");
  }
}`,
  },
  {
    id: "fn_test_suite",
    name: "SnapARCameraSDK.runAutomatedTestSuite()",
    signature: "runAutomatedTestSuite(): Promise<TestResult[]>",
    category: "Automated Tests",
    description: "Runs automated diagnostics on Camera acquisition, Face Tracking, Beauty Engine, Filter Engine, and SDK API interfaces.",
    parameters: [],
    returns: "Promise<TestResult[]> - Array of test results with status, durationMs, and diagnostics.",
    exampleCode: `const testResults = await sdk.runAutomatedTestSuite();
testResults.forEach(r => console.log(\`[\${r.status}] \${r.module}: \${r.testName}\`));`,
  },
  {
    id: "fn_stop_camera",
    name: "SnapARCameraSDK.stopCamera()",
    signature: "stopCamera(): void",
    category: "Camera & Frames",
    description: "Stops hardware media tracks and renders loop.",
    parameters: [],
    returns: "void",
    exampleCode: `sdk.stopCamera();`,
  },
];

export const DocumentationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDocId, setSelectedDocId] = useState<string>(API_DOCS[0].id);
  const [copied, setCopied] = useState(false);

  const selectedDoc = API_DOCS.find((d) => d.id === selectedDocId) || API_DOCS[0];

  const filteredDocs = API_DOCS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const copyCode = () => {
    navigator.clipboard.writeText(selectedDoc.exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-bold text-white">SnapAR SDK Complete Developer Documentation</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Copy-Paste API Examples
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete API specification for Initialization, Configuration, Licensing, Camera, Beauty, Error Handling, and Test Suite.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Index (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search functions & topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
            {["All", "Initialization", "Configuration", "Licensing", "Camera & Frames", "Filters & Beauty", "Error Handling", "Automated Tests"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold whitespace-nowrap ${
                  selectedCategory === cat ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Functions List */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? "bg-purple-600/20 border-purple-500 text-white font-bold shadow-md shadow-purple-900/20"
                      : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="truncate">
                    <p className="font-mono text-xs">{doc.name}</p>
                    <p className="text-[10px] text-purple-400 font-mono mt-0.5">{doc.category}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 ${isSelected ? "text-purple-400" : ""}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Function Details (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4 space-y-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
              {selectedDoc.category}
            </span>
            <h3 className="text-xl font-bold text-white font-mono">{selectedDoc.name}</h3>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-pink-300">
              {selectedDoc.signature}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedDoc.description}</p>
          </div>

          {/* Parameters Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Function Parameters & Options</span>
            </h4>

            {selectedDoc.parameters.length > 0 ? (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {selectedDoc.parameters.map((param, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-pink-400">{param.name}</td>
                        <td className="p-3 text-cyan-300">{param.type}</td>
                        <td className="p-3">
                          {param.required ? (
                            <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300 font-sans text-xs">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">This call accepts no arguments.</p>
            )}
          </div>

          {/* Return Value */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Return Value</h4>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
              {selectedDoc.returns}
            </div>
          </div>

          {/* Example Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Copy-Paste Example Code Snippet</span>
              </h4>

              <button
                onClick={copyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
              {selectedDoc.exampleCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
