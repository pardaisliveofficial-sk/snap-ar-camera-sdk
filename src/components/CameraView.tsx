import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Camera,
  Video,
  Square,
  FlipHorizontal,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sun,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  ARMaskId,
  BeautyParameters,
  CapturedMedia,
} from "../types";
import { FaceTracker } from "../utils/faceTracker";
import { FilterEngine } from "../utils/filterEngine";
import { GpuPipeline } from "../core/renderer/GpuPipeline";
import { BeautyConfig } from "../core/types";
import confetti from "canvas-confetti";

interface CameraViewProps {
  beautyParams: BeautyParameters;
  activeMaskId: ARMaskId;
  onAddMedia?: (media: CapturedMedia) => void;
  onCapture?: (media: CapturedMedia) => void;
  onFpsUpdate?: (fps: number) => void;
  onSelectMask?: (id: ARMaskId) => void;
  onOpenGallery?: () => void;
  cameraFacing?: "user" | "environment";
  resolution?: string;
  mobileMode?: boolean;
  onToggleCameraFacing?: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  beautyParams,
  activeMaskId,
  onAddMedia,
  onCapture,
  onFpsUpdate,
  cameraFacing = "user",
  resolution = "1080p",
  mobileMode = false,
  onToggleCameraFacing,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(true);

  useEffect(() => {
    setIsFlipped(cameraFacing === "user");
  }, [cameraFacing]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Before vs After Split Screen
  const [showSplit, setShowSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(0.5);

  // Snapshot & Recording State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  // MediaRecorder Ref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Engine Instances
  const faceTrackerRef = useRef<FaceTracker>(new FaceTracker());
  const filterEngineRef = useRef<FilterEngine>(new FilterEngine());
  const gpuPipelineRef = useRef<GpuPipeline>(new GpuPipeline());
  const lastTrackingTimeRef = useRef(0);
  const lastLandmarksRef = useRef(faceTrackerRef.current.detectNextFrame(tempCanvasRef.current));
  const lastRenderTimeRef = useRef(performance.now());

  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // Audio elements for Camera Shutter sound
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Shutter Sound
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3");
    audio.volume = 0.5;
    shutterAudioRef.current = audio;
  }, []);

  // Initialize Camera
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }

      const baseVideo = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      };

      const exactVideoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, ...baseVideo }
        : { facingMode: { exact: cameraFacing }, ...baseVideo };

      const fallbackVideoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, ...baseVideo }
        : { facingMode: { ideal: cameraFacing }, ...baseVideo };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: exactVideoConstraints,
          audio: false,
        });
      } catch (firstError) {
        // Some mobile browsers reject exact facingMode even though they can switch cameras.
        // Retry with ideal facingMode before surfacing the failure.
        console.warn("Exact camera selection failed; retrying with ideal facingMode", firstError);
        stream = await navigator.mediaDevices.getUserMedia({
          video: fallbackVideoConstraints,
          audio: false,
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Initialize Face Tracker
        await faceTrackerRef.current.init(videoRef.current);
      }
    } catch (err) {
      console.warn("Camera access failed or user denied permission:", err);
    }
  }, [cameraFacing]);

  // Enumerate Webcams
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (e) {
        // Enumerate error fallback
      }
    };
    getDevices();
    startCamera(undefined);
  }, [startCamera]);

  // Render Loop: GPU beauty first, then AR overlay. This is the production preview path.
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const targetW = Math.min(video.videoWidth, 1280);
        const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const now = performance.now();
        // Face tracking is expensive; keep it around 24-30Hz while the renderer stays smooth.
        if (now - lastTrackingTimeRef.current >= 34) {
          lastLandmarksRef.current = faceTrackerRef.current.detectNextFrame(tempCanvasRef.current);
          lastTrackingTimeRef.current = now;
        }
        const landmarks = lastLandmarksRef.current;

        const beautyConfig: BeautyConfig = {
          smooth: beautyParams.skinSmoothing,
          glow: beautyParams.skinToneGlow,
          tone: beautyParams.skinToneGlow,
          brightness: beautyParams.brightness,
          contrast: beautyParams.contrast,
          saturation: beautyParams.saturation,
          sharpness: beautyParams.sharpening,
          faceSlim: beautyParams.faceSlimming,
          eyeScale: beautyParams.eyeEnlargement,
          noseSlim: beautyParams.noseSlimming,
          jaw: Math.round(beautyParams.faceSlimming * 0.75),
          lips: beautyParams.lipTint,
          teeth: beautyParams.teethWhitening,
          eyeBright: beautyParams.eyeBrightening,
        };

        const gpuCanvas = gpuPipelineRef.current.render(
          video,
          beautyConfig,
          true,
          "none",
          false,
          landmarks as any,
          "beauty",
          0
        );

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (gpuCanvas) {
            ctx.drawImage(gpuCanvas, 0, 0, canvas.width, canvas.height);
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          // Keep existing AR asset library on top of the new GPU beauty output.
          const dt = Math.min((now - lastRenderTimeRef.current) / 1000, 0.1);
          lastRenderTimeRef.current = now;
          filterEngineRef.current.renderAROverlay(
            ctx,
            canvas.width,
            canvas.height,
            activeMaskId,
            landmarks,
            dt || 1 / 30
          );
        }

        frameCountRef.current++;
        if (now - lastFpsTimeRef.current >= 1000) {
          const currentFps = Math.round(
            (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
          );
          onFpsUpdate?.(currentFps);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [beautyParams, activeMaskId, onFpsUpdate]);

  // Snapshot Capture Function
  const triggerSnapshot = () => {
    if (countdown !== null) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          executeSnapshot();
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  };

  const executeSnapshot = () => {
    if (!canvasRef.current) return;

    // Camera Shutter Sound & Flash
    if (shutterAudioRef.current) {
      shutterAudioRef.current.play().catch(() => {});
    }
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // Save Canvas Snapshot
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95);
    const newSnapshot: CapturedMedia = {
      id: Date.now().toString(),
      type: "photo",
      url: dataUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      filterUsed: activeMaskId,
    };

    if (onCapture) {
      onCapture(newSnapshot);
    } else if (onAddMedia) {
      onAddMedia(newSnapshot);
    }

    // Confetti burst for snapshot creation
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  // Video Clip Recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!canvasRef.current) return;

    const stream = canvasRef.current.captureStream(30);
    recordedChunksRef.current = [];

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);

        const newVideoMedia: CapturedMedia = {
          id: Date.now().toString(),
          type: "video",
          url: videoUrl,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          filterUsed: activeMaskId,
          duration: recordingTime,
        };

        if (onCapture) {
          onCapture(newVideoMedia);
        } else if (onAddMedia) {
          onAddMedia(newVideoMedia);
        }
        setRecordingTime(0);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Record Timer
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("MediaRecorder init failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-slate-950 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl transition-all ${
        mobileMode
          ? "fixed inset-0 z-50 w-screen h-[100dvh] rounded-none border-none"
          : isFullscreen
            ? "fixed inset-0 z-50 rounded-none border-none"
            : "w-full aspect-[16/9] min-h-[420px]"
      }`}
    >
      {/* Hidden Raw HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Primary Enhanced Canvas Player */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover transition-transform duration-300 ${
          isFlipped ? "scale-x-[-1]" : ""
        }`}
      />

      {/* Camera Flash Overlay */}
      {flashEffect && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-8xl font-extrabold text-pink-500 animate-ping">
            {countdown}
          </span>
        </div>
      )}

      {/* Camera HUD Overlay */}
      {!mobileMode && <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
        {/* Top HUD Row */}
        <div className="flex items-start justify-between w-full">
          {/* SDK Pipeline Active Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/80 border border-purple-500/40 text-purple-200 font-mono font-bold text-[11px] rounded-full shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPU Pipeline: ACTIVE</span>
            </div>

            <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-pink-300 font-mono font-bold text-xs rounded-full border border-pink-500/30 hidden sm:block">
              MediaPipe 468 Tracking
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Split Screen Before/After Toggle */}
            <button
              onClick={() => setShowSplit(!showSplit)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 border transition-all ${
                showSplit
                  ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-600/30"
                  : "bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-pink-400" />
              <span>{showSplit ? "Raw vs AR Split ON" : "Compare Before/After"}</span>
            </button>

            {/* Flip Horizontal */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 backdrop-blur-md transition-all"
              title="Flip Mirror Camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 backdrop-blur-md transition-all"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>}

      {mobileMode && (
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pointer-events-none">
          <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold">
            SnapAR Mobile Test
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleCameraFacing}
              className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white flex items-center justify-center active:scale-95"
              title="Switch front / back camera"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
            <div className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] font-mono">
              {cameraFacing === "user" ? "FRONT" : "BACK"}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Capture & Control Toolbar */}
      <div className={`absolute inset-x-0 z-30 flex items-center justify-center gap-4 pointer-events-auto px-4 ${mobileMode ? "bottom-[236px]" : "bottom-4"}`}>
        {/* Device Dropdown Selector */}
        {devices.length > 1 && !mobileMode && (
          <select
            value={selectedDeviceId}
            onChange={(e) => {
                const id = e.target.value;
                setSelectedDeviceId(id);
                startCamera(id);
              }}
            className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none max-w-[140px] truncate"
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}

        {/* Shutter Snapshot Button */}
        <button
          onClick={triggerSnapshot}
          className="group relative p-4 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 hover:scale-105 active:scale-95 text-white shadow-xl shadow-pink-500/40 transition-all border-2 border-white/80"
          title="Take Snapshot (3s timer)"
        >
          <Camera className="w-7 h-7" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700 transition-opacity whitespace-nowrap">
            Take Snap
          </span>
        </button>

        {/* Video Record Clip Button */}
        <button
          onClick={toggleRecording}
          className={`group relative p-4 rounded-full transition-all border-2 ${
            isRecording
              ? "bg-red-600 border-white text-white animate-pulse shadow-lg shadow-red-600/50"
              : "bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800"
          }`}
          title={isRecording ? "Stop Recording" : "Record Clip"}
        >
          {isRecording ? <Square className="w-7 h-7 fill-white" /> : <Video className="w-7 h-7 text-pink-400" />}

          {isRecording && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              00:0{recordingTime}s
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
