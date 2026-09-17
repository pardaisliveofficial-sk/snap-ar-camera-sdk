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
import { FaceTracker } from "../core/tracking/FaceTracker";
import { FilterEngine } from "../utils/filterEngine";
import { GpuPipeline } from "../core/renderer/GpuPipeline";
import { BeautyConfig } from "../core/types";
import confetti from "canvas-confetti";
import { BUILT_IN_FILTERS, BuiltInFilter } from "../data/builtInFilters";

interface CameraViewProps {
  beautyParams: BeautyParameters;
  activeMaskId: ARMaskId;
  activeBuiltInFilterId?: string | null;
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
  activeBuiltInFilterId = null,
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

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(true);

  useEffect(() => {
    setIsFlipped(cameraFacing === "user");
  }, [cameraFacing]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  const lastLandmarksRef = useRef(faceTrackerRef.current.getLandmarks());
  const lastRenderTimeRef = useRef(performance.now());
  const lastProcessedFrameTimeRef = useRef(0);

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

        // Use the production Tasks Vision tracker used by the Test Lab/SDK.
        // Do not fall back to the legacy utility tracker here: it can return
        // synthetic/low-density landmarks and makes beauty/AR appear detached.
        faceTrackerRef.current.setVideoSource(videoRef.current);
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
        // Keep the camera capture at the requested quality, but process the expensive
        // beauty shader at a bounded internal resolution. This is the main mobile FPS win.
        const processingMaxWidth = mobileMode ? 720 : 960;
        const targetW = Math.min(video.videoWidth, processingMaxWidth);
        const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);
        const now = performance.now();
        // Render the GPU pipeline at ~30 FPS instead of running a multi-tap shader
        // on every display refresh (60/90/120 Hz).
        if (now - lastProcessedFrameTimeRef.current < 32) {
          animId = requestAnimationFrame(renderLoop);
          return;
        }
        lastProcessedFrameTimeRef.current = now;
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        // Face tracking is expensive; keep it around 24-30Hz while the renderer stays smooth.
        if (now - lastTrackingTimeRef.current >= 34) {
          lastLandmarksRef.current = faceTrackerRef.current.update();
          lastTrackingTimeRef.current = now;
        }
        const landmarks = lastLandmarksRef.current;

        const builtIn = getBuiltInFilter();
        const builtInBoost = builtIn ? Math.min(24, Math.round((builtIn.parameters.smoothing ?? 0) * 0.16)) : 0;
        const filterIntensity = builtIn ? Math.min(100, Math.max(0, builtIn.parameters.intensity ?? 0)) : 0;
        const colorLift = builtIn ? Math.round((filterIntensity - 50) * 0.035) : 0;
        const satLift = builtIn ? Math.round((filterIntensity - 50) * 0.08) : 0;
        const beautyConfig: BeautyConfig = {
          smooth: Math.min(100, beautyParams.skinSmoothing + builtInBoost),
          glow: Math.min(100, beautyParams.skinToneGlow + (builtIn?.parameters.glow ?? 0) * 0.22),
          tone: Math.min(100, beautyParams.skinToneGlow + (builtIn?.parameters.glow ?? 0) * 0.16),
          brightness: Math.max(85, Math.min(120, beautyParams.brightness + colorLift)),
          contrast: Math.max(90, Math.min(115, beautyParams.contrast + colorLift * 0.5)),
          saturation: Math.max(85, Math.min(125, beautyParams.saturation + satLift)),
          sharpness: beautyParams.sharpening,
          noiseReduction: beautyParams.noiseReduction,
          vibrance: beautyParams.vibrance,
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
          0,
          processingMaxWidth
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
          if (activeBuiltInFilterId && builtIn) {
            renderBuiltInOverlay(ctx, canvas.width, canvas.height, builtIn, landmarks, now / 1000);
          } else {
            filterEngineRef.current.renderAROverlay(
              ctx,
              canvas.width,
              canvas.height,
              activeMaskId,
              landmarks,
              dt || 1 / 30
            );
          }
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
  }, [beautyParams, activeMaskId, activeBuiltInFilterId, onFpsUpdate]);

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

  const getBuiltInFilter = (): BuiltInFilter | undefined =>
    activeBuiltInFilterId ? BUILT_IN_FILTERS.find(f => f.id === activeBuiltInFilterId) : undefined;

  const renderBuiltInOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: BuiltInFilter,
    landmarks: any,
    time: number
  ) => {
    const c1 = filter.presetColors.primary;
    const c2 = filter.presetColors.secondary;
    const category = filter.category;
    const hex = (h: string) => {
      const v = h.replace('#','');
      const n = parseInt(v.length === 3 ? v.split('').map(x=>x+x).join('') : v, 16);
      return [(n>>16)&255,(n>>8)&255,n&255];
    };
    const a = hex(c1), b = hex(c2);
    const face = landmarks?.faceDetected;
    const fx = (landmarks?.noseTip?.x ?? .5) * width;
    const fy = (landmarks?.noseTip?.y ?? .5) * height;
    const fw = (landmarks?.headWidth ?? .35) * width;
    const fh = (landmarks?.headHeight ?? .5) * height;
    ctx.save();
    const glow = (x:number,y:number,r:number,alpha:number) => {
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(${a[0]},${a[1]},${a[2]},${alpha})`); g.addColorStop(1,`rgba(${b[0]},${b[1]},${b[2]},0)`);
      ctx.fillStyle=g; ctx.fillRect(0,0,width,height);
    };
    const faceGlow=()=>{ if(!face)return; glow(fx,fy-fh*.05,fw*.9,.16); };

    if (["Beauty","Makeup"].includes(category)) {
      faceGlow();
      if (face) {
        ctx.globalAlpha = Math.min(.34, .12 + filter.parameters.glow/500);
        ctx.fillStyle=c1; ctx.beginPath(); ctx.ellipse(fx-fw*.22,fy+fh*.10,fw*.15,fh*.06,0,0,Math.PI*2); ctx.ellipse(fx+fw*.22,fy+fh*.10,fw*.15,fh*.06,0,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = Math.min(.45, .16 + filter.parameters.intensity/500);
        ctx.fillStyle=c2; ctx.beginPath(); ctx.ellipse(fx,fy+fh*.23,fw*.13,fh*.045,0,0,Math.PI*2); ctx.fill();
      }
    } else if (category === "Glasses") {
      if (face) {
        const lx=landmarks.leftEye.x*width, ly=landmarks.leftEye.y*height, rx=landmarks.rightEye.x*width, ry=landmarks.rightEye.y*height;
        const r=fw*.17; ctx.strokeStyle=c1; ctx.lineWidth=Math.max(3,fw*.025); ctx.globalAlpha=.92;
        ctx.translate((lx+rx)*0.5,(ly+ry)*0.5);
        ctx.rotate(Math.atan2(ry-ly,rx-lx));
        const gap=Math.max(r*0.15,fw*.018);
        ctx.beginPath(); ctx.ellipse(-(r+gap),0,r,r*.58,0,0,Math.PI*2); ctx.ellipse(r+gap,0,r,r*.58,0,0,Math.PI*2); ctx.moveTo(-gap,0); ctx.lineTo(gap,0); ctx.stroke();
      }
    } else if (["Hats","Hair","Seasonal","Festival"].includes(category)) {
      if (face) { ctx.strokeStyle=c1; ctx.fillStyle=`rgba(${a[0]},${a[1]},${a[2]},.18)`; ctx.lineWidth=Math.max(3,fw*.03); ctx.beginPath(); ctx.arc(fx,fy-fh*.58,fw*.62,Math.PI,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(fx,fy-fh*.57,fw*.68,fh*.08,0,0,Math.PI*2); ctx.fill(); }
    } else if (category === "Cute Animals") {
      if (face) {
        ctx.translate(fx,fy); ctx.rotate(Math.atan2(landmarks.rightEye.y-landmarks.leftEye.y, landmarks.rightEye.x-landmarks.leftEye.x));
        ctx.fillStyle=`rgba(${a[0]},${a[1]},${a[2]},.68)`;
        ctx.beginPath(); ctx.ellipse(-fw*.40,-fh*.48,fw*.15,fh*.23,-.12,0,Math.PI*2); ctx.ellipse(fw*.40,-fh*.48,fw*.15,fh*.23,.12,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=c2; ctx.beginPath(); ctx.ellipse(0,fh*.02,fw*.075,fh*.055,0,0,Math.PI*2); ctx.fill();
      }
    } else if (["Neon","Cyberpunk"].includes(category)) {
      if (face) { ctx.globalAlpha=.72; ctx.strokeStyle=c1; ctx.lineWidth=Math.max(2,fw*.012); ctx.beginPath(); ctx.ellipse(fx,fy-fh*.03,fw*.53,fh*.52,0,0,Math.PI*2); ctx.stroke(); glow(fx,fy,fw*.8,.10); }
    } else if (["Golden Hour","Vintage","Retro Film","Black & White","HDR","Blur","Bokeh"].includes(category)) {
      if (category === "Black & White") { ctx.fillStyle='rgba(128,128,128,.28)'; ctx.globalCompositeOperation='saturation'; ctx.fillRect(0,0,width,height); }
      else if (category === "Bokeh" || category === "Blur") { ctx.globalAlpha=.10; for(let i=0;i<18;i++){const x=(Math.sin(i*12.7)*.5+.5)*width,y=(Math.cos(i*7.3)*.5+.5)*height,r=8+(i%5)*8;ctx.fillStyle=i%2?c1:c2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}}
      else { const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,`rgba(${a[0]},${a[1]},${a[2]},.08)`);g.addColorStop(1,`rgba(${b[0]},${b[1]},${b[2]},.10)`);ctx.fillStyle=g;ctx.fillRect(0,0,width,height); }
    } else if (["Snow","Rain","Fire","Hearts","Sparkles","Butterfly"].includes(category)) {
      const count = category === "Snow" ? 55 : 26;
      ctx.globalAlpha=.65;
      for(let i=0;i<count;i++) { const x=(Math.sin(i*17.13)*.5+.5)*width; const y=(Math.cos(i*9.71 + time*.35*(1+i%3))*.5+.5)*height; const size=2+(i%4)*1.8; ctx.fillStyle=i%2?c1:c2; ctx.beginPath(); if(category==='Hearts'){ctx.font=`${10+size*2}px sans-serif`;ctx.fillText('♥',x,y);} else if(category==='Rain'){ctx.moveTo(x,y);ctx.lineTo(x-2,y+16);ctx.strokeStyle=c1;ctx.stroke();} else {ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();} }
    } else if (["Cartoon","Anime","Comic","Sketch"].includes(category)) {
      if (face) { ctx.globalAlpha=.20; ctx.strokeStyle=c1; ctx.lineWidth=Math.max(1.5,fw*.01); ctx.beginPath();ctx.ellipse(fx,fy,fw*.50,fh*.52,0,0,Math.PI*2);ctx.stroke(); glow(fx,fy,fw*.75,.07); }
    }
    ctx.restore();
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
