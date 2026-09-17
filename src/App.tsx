import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DashboardNav } from "./components/DashboardNav";
import { CameraView } from "./components/CameraView";
import { ARFilterSelector } from "./components/ARFilterSelector";
import { BeautyControls } from "./components/BeautyControls";
import { ApiSdkConsole } from "./components/ApiSdkConsole";
import { AiStylistModal } from "./components/AiStylistModal";
import { GalleryModal } from "./components/GalleryModal";
import { LensStudioModal } from "./components/LensStudioModal";
import { AssetManagerModal } from "./components/AssetManagerModal";
import { AiFaceTrackingView } from "./components/AiFaceTrackingView";
import { CameraSettingsView } from "./components/CameraSettingsView";
import { SampleIntegrationView } from "./components/SampleIntegrationView";
import { PerformanceMonitorView } from "./components/PerformanceMonitorView";
import { LensEditorView } from "./components/LensEditorView";
import { AiFilterBuilderView } from "./components/AiFilterBuilderView";
import { FilterMarketplaceView } from "./components/FilterMarketplaceView";
import { SdkDownloadCenterView } from "./components/SdkDownloadCenterView";
import { DocumentationView } from "./components/DocumentationView";
import { ArCameraTestLab } from "./components/testlab/ArCameraTestLab";
import { TestReportView } from "./components/testlab/TestReportView";
import { MobileCameraTestView } from "./components/MobileCameraTestView";

import { AR_MASKS, DEFAULT_BEAUTY_PARAMS } from "./data/presets";
import {
  ARMaskId,
  BeautyParameters,
  CapturedMedia,
  DashboardSection,
  LensElement,
} from "./types";

export default function App() {
  // Application & Active Navigation State - Mobile Test is the default validation surface
  const [activeSection, setActiveSection] = useState<DashboardSection>("mobile_test");
  const [activeMaskId, setActiveMaskId] = useState<ARMaskId>("cute_puppy");
  const [beautyParams, setBeautyParams] = useState<BeautyParameters>(DEFAULT_BEAUTY_PARAMS);

  // Camera Hardware State
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [fps, setFps] = useState(60);
  const [resolution, setResolution] = useState("1080p");
  const [isMicOn, setIsMicOn] = useState(true);

  // Captured Media Gallery
  const [mediaList, setMediaList] = useState<CapturedMedia[]>([]);

  // Modals State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isLensStudioOpen, setIsLensStudioOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);

  // Poll server for active filter updates triggered by external API calls
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/v1/active-filter");
        const data = await res.json();
        if (data.success && data.state) {
          if (data.state.activeMaskId && data.state.activeMaskId !== activeMaskId) {
            setActiveMaskId(data.state.activeMaskId);
          }
        }
      } catch (err) {
        // Silently handle if offline
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeMaskId]);

  const handleCapture = (media: CapturedMedia) => {
    setMediaList((prev) => [media, ...prev]);
  };

  const handleApplyAiAdvice = (params: Partial<BeautyParameters>) => {
    setBeautyParams((prev) => ({ ...prev, ...params }));
    setIsAiModalOpen(false);
  };

  const handleApplyCustomLens = (elements: LensElement[]) => {
    setActiveMaskId("cute_puppy");
    setIsLensStudioOpen(false);
  };

  const handleApplyFilterFromApi = (maskId: string, params?: Partial<BeautyParameters>) => {
    setActiveMaskId(maskId as ARMaskId);
    if (params) {
      setBeautyParams((prev) => ({ ...prev, ...params }));
    }
  };

  if (activeSection === "mobile_test") {
    return (
      <MobileCameraTestView
        activeMaskId={activeMaskId}
        onSelectMask={setActiveMaskId}
        beautyParams={beautyParams}
        onChangeBeauty={setBeautyParams}
        cameraFacing={cameraFacing}
        onToggleCameraFacing={() => setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))}
        onCapture={handleCapture}
        onExit={() => setActiveSection("test_lab")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* App Top Header */}
      <Header
        activeMaskName={AR_MASKS.find((m) => m.id === activeMaskId)?.name || "Doggy Snout & Ears"}
        fps={fps}
        capturedCount={mediaList.length}
        onOpenGallery={() => setIsGalleryModalOpen(true)}
      />

      {/* Primary Section Navigation Tabs */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-4">
        <DashboardNav
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {activeSection === "test_lab" && (
          <section className="w-full">
            <ArCameraTestLab />
          </section>
        )}

        {activeSection === "test_report" && (
          <section className="w-full">
            <TestReportView />
          </section>
        )}

        {activeSection === "camera_preview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Camera View (7 Cols) */}
            <section className="lg:col-span-7">
              <CameraView
                activeMaskId={activeMaskId}
                beautyParams={beautyParams}
                cameraFacing={cameraFacing}
                onCapture={handleCapture}
                onFpsUpdate={setFps}
                onOpenGallery={() => setIsGalleryModalOpen(true)}
              />
            </section>

            {/* Sidebar Controls (5 Cols) */}
            <section className="lg:col-span-5 space-y-6">
              <ARFilterSelector
                activeMaskId={activeMaskId}
                onSelectMask={setActiveMaskId}
                onOpenCustomAiFilter={() => setIsAiModalOpen(true)}
              />

              <BeautyControls
                params={beautyParams}
                onChangeParams={setBeautyParams}
                onResetParams={() => setBeautyParams(DEFAULT_BEAUTY_PARAMS)}
              />
            </section>
          </div>
        )}

        {activeSection === "filter_library" && (
          <section className="w-full space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">AR Filter & Lens Library</h2>
              <p className="text-xs text-slate-400 mb-6">
                Explore real-time GPU filters including 2D face masks, animated stickers, vector HUDs, and 3D GLB models.
              </p>
              <ARFilterSelector
                activeMaskId={activeMaskId}
                onSelectMask={setActiveMaskId}
                onOpenCustomAiFilter={() => setIsAiModalOpen(true)}
              />
            </div>
          </section>
        )}

        {activeSection === "beauty_studio" && (
          <section className="w-full space-y-6">
            <BeautyControls
              params={beautyParams}
              onChangeParams={setBeautyParams}
              onResetParams={() => setBeautyParams(DEFAULT_BEAUTY_PARAMS)}
            />
          </section>
        )}

        {activeSection === "lens_studio" && (
          <section className="w-full">
            <LensEditorView onApplyCustomLens={handleApplyCustomLens} />
          </section>
        )}

        {activeSection === "ai_filter_builder" && (
          <section className="w-full">
            <AiFilterBuilderView
              onApplyFilter={(filter) => {
                setActiveMaskId(filter.id as ARMaskId);
                setActiveSection("camera_preview");
              }}
            />
          </section>
        )}

        {activeSection === "marketplace" && (
          <section className="w-full">
            <FilterMarketplaceView
              onApplyFilter={(filter) => {
                setActiveMaskId(filter.id as ARMaskId);
                setActiveSection("camera_preview");
              }}
            />
          </section>
        )}

        {activeSection === "face_tracking" && (
          <section className="w-full">
            <AiFaceTrackingView />
          </section>
        )}

        {activeSection === "camera_settings" && (
          <section className="w-full">
            <CameraSettingsView
              cameraFacing={cameraFacing}
              onToggleCameraFacing={() => setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))}
              resolution={resolution}
              onResolutionChange={setResolution}
              fps={fps}
              isMicOn={isMicOn}
              onToggleMic={() => setIsMicOn(!isMicOn)}
            />
          </section>
        )}

        {activeSection === "asset_manager" && (
          <section className="w-full">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">2D / 3D Asset & Media Manager</h2>
              <p className="text-xs text-slate-400">
                Manage uploaded overlays, vector graphics, animated WebM stickers, and 3D GLTF models.
              </p>
              <button
                onClick={() => setIsAssetManagerOpen(true)}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 border border-purple-400/40"
              >
                Open Asset Manager
              </button>
            </div>
          </section>
        )}

        {(activeSection === "sdk_playground" || activeSection === "api_keys") && (
          <section className="w-full">
            <ApiSdkConsole
              activeMaskId={activeMaskId}
              beautyParams={beautyParams}
              onApplyFilterFromApi={handleApplyFilterFromApi}
            />
          </section>
        )}

        {activeSection === "sdk_downloads" && (
          <section className="w-full">
            <SdkDownloadCenterView />
          </section>
        )}

        {activeSection === "documentation" && (
          <section className="w-full">
            <DocumentationView />
          </section>
        )}

        {activeSection === "sample_integration" && (
          <section className="w-full">
            <SampleIntegrationView />
          </section>
        )}

        {activeSection === "performance_monitor" && (
          <section className="w-full">
            <PerformanceMonitorView fps={fps} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-4 px-6 text-center">
        <p>SnapAR Camera SDK — Production-Ready Real-Time Beauty & AR Lens Engine for Android, iOS, Flutter, React Native, Unity, and Web</p>
      </footer>

      {/* Modals */}
      <AiStylistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentParams={beautyParams}
        onApplyAdvice={handleApplyAiAdvice}
      />

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        mediaList={mediaList}
        onClearAll={() => setMediaList([])}
      />

      <LensStudioModal
        isOpen={isLensStudioOpen}
        onClose={() => setIsLensStudioOpen(false)}
        onApplyCustomLens={handleApplyCustomLens}
      />

      <AssetManagerModal
        isOpen={isAssetManagerOpen}
        onClose={() => setIsAssetManagerOpen(false)}
      />
    </div>
  );
}
