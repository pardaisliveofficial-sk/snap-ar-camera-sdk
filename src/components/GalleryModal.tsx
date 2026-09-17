import React from "react";
import { CapturedMedia } from "../types";
import { X, Download, Share2, Trash2, Video, Image as ImageIcon } from "lucide-react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: CapturedMedia[];
  onClearAll: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white">Snapshots & Recorded Clips Gallery</h2>
            <span className="text-xs bg-slate-800 text-pink-300 font-bold px-2.5 py-0.5 rounded-full">
              {mediaList.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mediaList.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {mediaList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
              <ImageIcon className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-bold text-slate-400">No Snapshots Yet</p>
              <p className="text-xs">Take HD camera snaps or record video clips during live stream.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden group relative flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-black">
                    {item.type === "photo" ? (
                      <img src={item.url} alt="Snapshot" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} controls className="w-full h-full object-cover" />
                    )}

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      {item.type === "photo" ? (
                        <ImageIcon className="w-3 h-3 text-pink-400" />
                      ) : (
                        <Video className="w-3 h-3 text-cyan-400" />
                      )}
                      <span>{item.type.toUpperCase()}</span>
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 flex items-center justify-between text-xs border-t border-slate-700/50">
                    <span className="text-[10px] text-slate-400">{item.createdAt}</span>
                    <a
                      href={item.url}
                      download={`SnapStream_${item.id}.${item.type === "photo" ? "jpg" : "webm"}`}
                      className="flex items-center gap-1 text-pink-400 hover:text-pink-300 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
