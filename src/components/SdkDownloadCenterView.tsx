import React, { useState } from "react";
import { Download, Check, Copy, ExternalLink, ShieldCheck, Terminal, Smartphone, Monitor, Cpu, Box, Sparkles, Layers } from "lucide-react";

interface SdkPackage {
  id: string;
  name: string;
  platform: string;
  version: string;
  fileFormat: string;
  fileSize: string;
  badgeColor: string;
  description: string;
  installCommand: string;
  filename: string;
}

const SDK_PACKAGES: SdkPackage[] = [
  {
    id: "android_sdk",
    name: "Android SnapAR Camera SDK",
    platform: "Android (Kotlin / Java)",
    version: "v2.4.0-stable",
    fileFormat: ".aar",
    fileSize: "14.2 MB",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    description: "Native Android SDK powered by MediaPipe C++ bindings, WebGL texture rendering, and GPU accelerated filters.",
    installCommand: "implementation('com.snap.camerakit:camerakit:2.4.0')",
    filename: "snap-camerakit-v2.4.0.aar",
  },
  {
    id: "ios_sdk",
    name: "iOS SnapAR Camera SDK",
    platform: "iOS (Swift / Metal)",
    version: "v2.4.0-stable",
    fileFormat: ".xcframework",
    fileSize: "22.8 MB",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    description: "Native iOS framework with Swift Package Manager support, Metal Shader Pipeline, and zero-latency face tracking.",
    installCommand: "pod 'SnapCameraKit', '~> 2.4.0'",
    filename: "SnapCameraKit.xcframework.zip",
  },
  {
    id: "flutter_plugin",
    name: "Flutter SnapAR Camera Plugin",
    platform: "Cross-Platform (Flutter / Dart)",
    version: "v2.4.0",
    fileFormat: "pub.dev package",
    fileSize: "8.5 MB",
    badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    description: "Official Flutter plugin embedding native Android .aar & iOS .xcframework via PlatformView with Texture Widgets.",
    installCommand: "flutter pub add snap_camera_kit",
    filename: "snap_camera_kit-2.4.0.tar.gz",
  },
  {
    id: "react_native",
    name: "React Native SnapAR Plugin",
    platform: "Cross-Platform (React Native / TS)",
    version: "v2.4.0",
    fileFormat: ".tgz / npm",
    fileSize: "7.9 MB",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    description: "React Native bridge component for iOS and Android with full JS callback support, frame streaming, and UI overlays.",
    installCommand: "npm install react-native-snap-camera-kit",
    filename: "react-native-snap-camera-kit-2.4.0.tgz",
  },
  {
    id: "unity_package",
    name: "Unity AR Engine Extension",
    platform: "3D Game Engine (Unity C#)",
    version: "v2.4.0",
    fileFormat: ".unitypackage",
    fileSize: "38.5 MB",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    description: "Unity AR Foundation integration package with custom 3D mesh deformation shaders and Mecanim facial triggers.",
    installCommand: "Import custom package via Unity Package Manager",
    filename: "SnapCameraKit_v2.4.0.unitypackage",
  },
  {
    id: "javascript_sdk",
    name: "JavaScript / WebAR SDK",
    platform: "Web (TypeScript / React)",
    version: "v2.4.0",
    fileFormat: ".js / .npm",
    fileSize: "4.1 MB",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    description: "WebAR engine running MediaPipe SIMD WASM & WebGL2 in browser. Supports React, Vue, Svelte, and plain JS.",
    installCommand: "npm install @snap/camera-kit-web",
    filename: "snap-camera-kit-web-2.4.0.tgz",
  },
];

export const SdkDownloadCenterView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopyCommand = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (pkg: SdkPackage) => {
    setDownloadingId(pkg.id);
    setTimeout(() => {
      setDownloadingId(null);
      // Trigger file download simulation
      const content = `// SnapAR Camera SDK - ${pkg.name} (${pkg.version})\n// Downloaded for ${pkg.platform}\n\nExport Package Manifest:\n{\n  "sdk": "${pkg.id}",\n  "version": "${pkg.version}",\n  "file": "${pkg.filename}"\n}\n`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pkg.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 800);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-bold text-white">SnapAR SDK Download Center</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Cross-Platform v2.4.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Download native SDKs, cross-platform wrappers, and game engine extensions for Android, iOS, Flutter, React Native, Unity, and JavaScript.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Security Signature</span>
        </div>
      </div>

      {/* Grid of SDK Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SDK_PACKAGES.map((pkg) => {
          const isCopied = copiedId === pkg.id;
          const isDownloading = downloadingId === pkg.id;

          return (
            <div
              key={pkg.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 transition-all duration-200 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                {/* Platform Badge & Format */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${pkg.badgeColor}`}>
                    {pkg.fileFormat}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{pkg.fileSize}</span>
                </div>

                {/* Package Title & Platform */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{pkg.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{pkg.platform}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{pkg.description}</p>

                {/* Install Snippet Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="truncate text-slate-300">{pkg.installCommand}</span>
                  <button
                    onClick={() => handleCopyCommand(pkg.id, pkg.installCommand)}
                    className="p-1 text-slate-400 hover:text-white shrink-0"
                    title="Copy Command"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Download Action Button */}
              <button
                onClick={() => handleDownload(pkg)}
                disabled={isDownloading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 transition-all border border-purple-400/30 disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
                <span>{isDownloading ? "Preparing Bundle..." : `Download ${pkg.filename}`}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
