import React from "react";
import { Monitor, X, CheckCircle2, Copy, ExternalLink } from "lucide-react";

interface VirtualCamGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VirtualCamGuideModal: React.FC<VirtualCamGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">How to Stream with Virtual Camera in OBS</h2>
            <p className="text-xs text-slate-400">
              Use SnapStream Snapchat AR filters directly in OBS Studio, TikTok Live Studio, or Discord!
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Method 1: OBS Studio Browser Source / Window Capture</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 leading-relaxed">
              <li>Keep this SnapStream Cam window open with your favorite Snapchat filter active.</li>
              <li>Open <strong>OBS Studio</strong> or <strong>TikTok Live Studio</strong>.</li>
              <li>Add a new <strong>Window Capture</strong> or <strong>Browser Source</strong> in your OBS scene.</li>
              <li>Select the browser tab running SnapStream Cam as the video source!</li>
            </ol>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-pink-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Method 2: Virtual Camera Output</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              SnapStream outputs a 60 FPS Canvas WebRTC stream (`canvas.captureStream()`). You can capture this feed using OBS Virtual Camera or OBS Screen Capture to transmit AR filtered camera video directly into Zoom, Discord, or Streamlabs!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
