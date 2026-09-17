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
}

export const CameraView: React.FC<CameraViewProps> = ({
  beautyParams,
  activeMaskId,
  onAddMedia,
  onCapture,
  onFpsUpdate,
  cameraFacing = "user",
  resolution = "1080p",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(true);
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

  // Initialize Camera. The facing direction is a physical camera selection,
  // not a mirror/transform operation.
  const startCamera = useCallback(async (deviceId?: string, facing: "user" | "environment" = cameraFacing) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }

      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const videoConstraints: MediaTrackConstraints = deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          }
        : {
            // exact prevents the browser from silently keeping the front camera
            // when the user requested the rear camera (or vice versa).
            facingMode: { exact: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      const actualFacing = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
      if (!deviceId && actualFacing && actualFacing !== facing) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error(
          `Requested ${facing === "user" ? "front" : "rear"} camera, but the browser opened the other camera.`
        );
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await faceTrackerRef.current.init(videoRef.current);
      }

      // Auto mirror follows the physical camera. Manual flip remains available.
      setIsFlipped(facing === "user");
    } catch (err) {
      console.warn("Camera access/switch failed:", err);
    }
  }, [cameraFacing]);

  // Enumerate cameras once after permission is available.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setDevices(devs.filter((d) => d.kind === "videoinput"));
        }
      } catch {
        // Camera list is optional; the facingMode API still works.
      }
      await startCamera(undefined, cameraFacing);
    };
    init();

    return () => {
      cancelled = true;
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [startCamera, cameraFacing]);

  // Render Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState >= 2) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
          }

          // Detect Face Landmarks
          const landmarks = faceTrackerRef.current.detectNextFrame(tempCanvasRef.current);

          // Apply Filter Engine Processing
          filterEngineRef.current.render(
            ctx,
            video,
            canvas.width,
            canvas.height,
            beautyParams,
            activeMaskId,
            landmarks,
            showSplit,
            splitPos
          );

          // FPS Metric Calculation
          frameCountRef.current++;
          const now = performance.now();
          if (now - lastFpsTimeRef.current >= 1000) {
            const currentFps = Math.round(
              (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
            );
            if (onFpsUpdate) {
              onFpsUpdate(currentFps);
            }
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [beautyParams, activeMaskId, showSplit, splitPos, onFpsUpdate]);

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
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "w-full aspect-[16/9] min-h-[420px]"
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
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
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
      </div>

      {/* Floating Bottom Capture & Control Toolbar */}
      <div className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-4 pointer-events-auto px-4">
        {/* Device Dropdown Selector */}
        {devices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={async (e) => {
              const id = e.target.value;
              setSelectedDeviceId(id);
              await startCamera(id);
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
