import React, { useState, useEffect } from "react";
import {
  MANUAL_QA_TESTS,
  QA_GROUPS,
  QaGroupCategory,
  QaTestItem,
  QaTestStatus,
} from "./manualQaData";
import {
  ArFilterId,
  BeautyConfig,
  EffectId,
  RealtimePerformanceStats,
  RenderComparisonMode,
} from "../../core/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Download,
  Search,
  Filter,
  Layers,
  Sparkles,
  Camera,
  Activity,
  Sliders,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
} from "lucide-react";

interface ManualQaChecklistProps {
  stats: RealtimePerformanceStats;
  onApplyBeautyConfig: (config: BeautyConfig) => void;
  onApplyEffect: (effect: EffectId, intensity?: number) => void;
  onApplyArFilter: (filter: ArFilterId) => void;
  onApplyComparisonMode: (mode: RenderComparisonMode) => void;
  onSwitchCamera: () => void;
  onSelectCameraFacing: (facing: "user" | "environment") => void;
  onToggleMirroring: () => void;
  onToggleCamera: () => void;
  onCapturePhoto: () => void;
  onToggleRecording: () => void;
  onApplyFullCombinedPreset: () => void;
  isCameraRunning: boolean;
  isRecording: boolean;
}

const STORAGE_KEY = "ar_camera_manual_qa_checklist_v1";
const NOTES_STORAGE_KEY = "ar_camera_manual_qa_notes_v1";

export function ManualQaChecklist({
  stats,
  onApplyBeautyConfig,
  onApplyEffect,
  onApplyArFilter,
  onApplyComparisonMode,
  onSwitchCamera,
  onSelectCameraFacing,
  onToggleMirroring,
  onToggleCamera,
  onCapturePhoto,
  onToggleRecording,
  onApplyFullCombinedPreset,
  isCameraRunning,
  isRecording,
}: ManualQaChecklistProps) {
  // Test statuses map: testId -> "PASS" | "FAIL" | "NOT TESTED"
  const [testStatuses, setTestStatuses] = useState<Record<string, QaTestStatus>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Fallback
    }
    const initial: Record<string, QaTestStatus> = {};
    MANUAL_QA_TESTS.forEach((t) => {
      initial[t.id] = "NOT TESTED";
    });
    return initial;
  });

  // Tester visual notes: testId -> string
  const [testNotes, setTestNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    return {};
  });

  // UI state
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | QaTestStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testStatuses));
    } catch (e) {
      console.warn("Could not save QA checklist to localStorage", e);
    }
  }, [testStatuses]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(testNotes));
    } catch (e) {
      console.warn("Could not save QA notes to localStorage", e);
    }
  }, [testNotes]);

  // Handler for marking status
  const handleSetStatus = (testId: string, status: QaTestStatus) => {
    setTestStatuses((prev) => ({
      ...prev,
      [testId]: status,
    }));
  };

  // Handler for notes
  const handleSetNote = (testId: string, text: string) => {
    setTestNotes((prev) => ({
      ...prev,
      [testId]: text,
    }));
  };

  // Reset all
  const handleResetAll = () => {
    if (window.confirm("Reset all tests to NOT TESTED? Your visual notes will be retained.")) {
      const resetMap: Record<string, QaTestStatus> = {};
      MANUAL_QA_TESTS.forEach((t) => {
        resetMap[t.id] = "NOT TESTED";
      });
      setTestStatuses(resetMap);
    }
  };

  // Quick Action execution handler
  const handleQuickAction = (test: QaTestItem, subValue?: any) => {
    switch (test.quickActionType) {
      case "cam_front":
        onSelectCameraFacing("user");
        break;
      case "cam_back":
        onSelectCameraFacing("environment");
        break;
      case "cam_switch":
        onSwitchCamera();
        break;
      case "cam_mirror":
        onToggleMirroring();
        break;
      case "cam_toggle":
        onToggleCamera();
        break;
      case "beauty_level":
        if (test.quickActionPayload?.param) {
          const param = test.quickActionPayload.param as keyof BeautyConfig;
          const level = typeof subValue === "number" ? subValue : 50;
          // Set beauty config with only this parameter focused or adjusted
          const baseConfig: BeautyConfig = {
            smooth: 0,
            glow: 0,
            tone: 0,
            faceSlim: 0,
            eyeScale: 0,
            noseSlim: 0,
            jaw: 0,
            lips: 0,
            teeth: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            sharpness: 20,
          };
          baseConfig[param] = level;
          onApplyBeautyConfig(baseConfig);
          onApplyComparisonMode("beauty");
        }
        break;
      case "effect_apply":
        if (test.quickActionPayload?.effect) {
          onApplyEffect(test.quickActionPayload.effect, 0.85);
          onApplyComparisonMode("effects");
        }
        break;
      case "ar_apply":
        if (test.quickActionPayload?.filter) {
          onApplyArFilter(test.quickActionPayload.filter);
          onApplyComparisonMode("ar");
        }
        break;
      case "combo_beauty_effect":
        onApplyBeautyConfig({
          smooth: 60,
          glow: 40,
          tone: 30,
          faceSlim: 20,
          eyeScale: 20,
          noseSlim: 20,
          jaw: 20,
          lips: 30,
          teeth: 30,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sharpness: 20,
        });
        onApplyEffect("pink_glow", 0.7);
        onApplyComparisonMode("beauty_effects");
        break;
      case "combo_beauty_ar":
        onApplyBeautyConfig({
          smooth: 60,
          glow: 30,
          tone: 30,
          faceSlim: 30,
          eyeScale: 20,
          noseSlim: 20,
          jaw: 20,
          lips: 30,
          teeth: 30,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sharpness: 20,
        });
        onApplyArFilter("cat");
        onApplyComparisonMode("beauty_ar");
        break;
      case "combo_effect_ar":
        onApplyEffect("pink_glow", 0.7);
        onApplyArFilter("cat");
        onApplyComparisonMode("effects_ar");
        break;
      case "combo_full":
        onApplyFullCombinedPreset();
        break;
      case "mode_switch":
        if (test.quickActionPayload?.mode) {
          onApplyComparisonMode(test.quickActionPayload.mode);
        } else {
          onApplyFullCombinedPreset();
        }
        break;
      case "photo_capture":
        onCapturePhoto();
        break;
      case "video_record":
        onToggleRecording();
        break;
      default:
        break;
    }
  };

  // Calculations for dashboard
  const totalTests = MANUAL_QA_TESTS.length;
  let passCount = 0;
  let failCount = 0;
  let notTestedCount = 0;

  MANUAL_QA_TESTS.forEach((t) => {
    const s = testStatuses[t.id] || "NOT TESTED";
    if (s === "PASS") passCount++;
    else if (s === "FAIL") failCount++;
    else notTestedCount++;
  });

  const evaluatedCount = passCount + failCount;
  const progressPct = totalTests > 0 ? Math.round((evaluatedCount / totalTests) * 100) : 0;
  const passPct = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0;
  const failPct = totalTests > 0 ? Math.round((failCount / totalTests) * 100) : 0;

  // Filtered test items
  const filteredTests = MANUAL_QA_TESTS.filter((item) => {
    if (selectedGroup !== "ALL" && item.group !== selectedGroup) return false;
    const status = testStatuses[item.id] || "NOT TESTED";
    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchAction = item.userAction.toLowerCase().includes(q);
      const matchExpected = item.expectedResult.toLowerCase().includes(q);
      const matchGroup = item.group.toLowerCase().includes(q);
      if (!matchName && !matchAction && !matchExpected && !matchGroup) return false;
    }
    return true;
  });

  // Export QA summary
  const generateMarkdownReport = () => {
    let md = `# AR Camera Engine - Manual QA Execution Report\n`;
    md += `Generated: ${new Date().toLocaleString()}\n\n`;
    md += `## Summary Dashboard\n`;
    md += `- **Total Tests:** ${totalTests}\n`;
    md += `- **PASS:** ${passCount} (${passPct}%)\n`;
    md += `- **FAIL:** ${failCount} (${failPct}%)\n`;
    md += `- **NOT TESTED:** ${notTestedCount}\n`;
    md += `- **Progress:** ${progressPct}% evaluated\n\n`;
    md += `## Hardware & Telemetry at Run Time\n`;
    md += `- Camera Resolution: ${stats.cameraResolution}\n`;
    md += `- Camera Orientation: ${stats.cameraOrientation} (Mirroring: ${stats.cameraMirroring})\n`;
    md += `- Face Tracking: ${stats.faceDetected ? "DETECTED" : "NOT DETECTED"} (${stats.landmarkCount} landmarks, Provider: ${stats.trackingProvider || stats.trackerType})\n`;
    md += `- Measured Render FPS: ${stats.renderFps} FPS\n`;
    md += `- Tracking FPS: ${stats.trackingFps} FPS\n`;
    md += `- Processing Latency: ${stats.processingLatencyMs ?? "N/A"} ms\n\n`;
    md += `## Detailed Test Results by Group\n\n`;

    QA_GROUPS.forEach((group) => {
      const groupTests = MANUAL_QA_TESTS.filter((t) => t.group === group);
      md += `### ${group}\n\n`;
      groupTests.forEach((t) => {
        const s = testStatuses[t.id] || "NOT TESTED";
        const note = testNotes[t.id];
        md += `#### [${s}] ${t.name}\n`;
        md += `- **User Action:** ${t.userAction}\n`;
        md += `- **Expected:** ${t.expectedResult}\n`;
        if (note) {
          md += `- **Visual Observation:** ${note}\n`;
        }
        md += `\n`;
      });
    });

    return md;
  };

  const handleCopyReport = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md).then(() => {
      setCopyFeedback("QA Report copied to clipboard!");
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  const handleDownloadReport = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ar-camera-manual-qa-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-6">
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Manual QA Checklist & Verification Suite
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Human visual inspection suite with strictly user-verified PASS / FAIL controls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Copy Markdown QA Report"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            Copy Report
          </button>

          <button
            onClick={handleDownloadReport}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Download .md QA Report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export .md
          </button>

          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-200 text-slate-400 text-xs font-semibold flex items-center gap-1 border border-slate-700/80 transition-colors"
            title="Reset All Test Statuses"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUMMARY QA DASHBOARD */}
      {/* ========================================================= */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              QA Execution Summary
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {evaluatedCount} of {totalTests} Tests Evaluated ({progressPct}% Complete)
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          {/* PASS */}
          <button
            onClick={() => setStatusFilter(statusFilter === "PASS" ? "ALL" : "PASS")}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === "PASS"
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30"
                : "bg-slate-900 border-slate-800 hover:border-emerald-500/40 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
              <span className="text-base font-bold text-white">{passCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{passPct}% of total tests</p>
          </button>

          {/* FAIL */}
          <button
            onClick={() => setStatusFilter(statusFilter === "FAIL" ? "ALL" : "FAIL")}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === "FAIL"
                ? "bg-rose-950/70 border-rose-500 text-rose-200 ring-2 ring-rose-500/30"
                : "bg-slate-900 border-slate-800 hover:border-rose-500/40 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                FAIL
              </span>
              <span className="text-base font-bold text-white">{failCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{failPct}% of total tests</p>
          </button>

          {/* NOT TESTED */}
          <button
            onClick={() => setStatusFilter(statusFilter === "NOT TESTED" ? "ALL" : "NOT TESTED")}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === "NOT TESTED"
                ? "bg-amber-950/70 border-amber-500 text-amber-200 ring-2 ring-amber-500/30"
                : "bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                NOT TESTED
              </span>
              <span className="text-base font-bold text-white">{notTestedCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{totalTests - evaluatedCount} remaining</p>
          </button>

          {/* TOTAL */}
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === "ALL"
                ? "bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30"
                : "bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                ALL TESTS
              </span>
              <span className="text-base font-bold text-white">{totalTests}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Across 12 test groups</p>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${passPct}%` }}
              title={`Pass: ${passCount}`}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{ width: `${failPct}%` }}
              title={`Fail: ${failCount}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Pass: {passCount}</span>
            <span>Fail: {failCount}</span>
            <span>Not Tested: {notTestedCount}</span>
          </div>
        </div>

        {/* Live Hardware Telemetry Strip */}
        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Live Hardware Feed:</span>
            <span className={stats.cameraActive ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {stats.cameraActive ? "ACTIVE" : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Face Tracking:</span>
            <span className={stats.faceDetected ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {stats.faceDetected ? `LOCKED (${stats.landmarkCount} pts)` : "NO FACE DETECTED"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Render:</span>
            <span className="text-emerald-300 font-bold">{stats.renderFps} FPS</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Resolution:</span>
            <span className="text-cyan-300 font-bold">{stats.cameraResolution}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER CONTROLS: GROUPS & SEARCH */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {/* Search & Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tests by name, action, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 px-2 uppercase">Status:</span>
            {(["ALL", "PASS", "FAIL", "NOT TESTED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] font-bold ${
                  statusFilter === s
                    ? s === "PASS"
                      ? "bg-emerald-600 text-white"
                      : s === "FAIL"
                      ? "bg-rose-600 text-white"
                      : s === "NOT TESTED"
                      ? "bg-amber-600 text-white"
                      : "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Group Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedGroup("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedGroup === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Groups (12)
          </button>

          {QA_GROUPS.map((group) => {
            const groupTests = MANUAL_QA_TESTS.filter((t) => t.group === group);
            const groupPass = groupTests.filter((t) => testStatuses[t.id] === "PASS").length;
            const groupFail = groupTests.filter((t) => testStatuses[t.id] === "FAIL").length;
            const isGroupActive = selectedGroup === group;

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isGroupActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <span>{group}</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({groupPass + groupFail}/{groupTests.length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TEST LIST VIEW */}
      {/* ========================================================= */}
      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 border-dashed rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No tests match your current search or status filter.</p>
            <button
              onClick={() => {
                setSelectedGroup("ALL");
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-3 text-xs text-indigo-400 hover:underline font-mono"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredTests.map((test) => {
            const currentStatus = testStatuses[test.id] || "NOT TESTED";
            const note = testNotes[test.id] || "";
            const isNoteOpen = expandedNotes[test.id] || !!note;

            return (
              <div
                key={test.id}
                className={`p-4 rounded-2xl border transition-all ${
                  currentStatus === "PASS"
                    ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
                    : currentStatus === "FAIL"
                    ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                    : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Top Row: Group, Name, Status Buttons */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {test.group}
                      </span>
                      <h4 className="text-sm font-bold text-white">{test.name}</h4>
                    </div>
                  </div>

                  {/* Manual QA Choice: PASS | FAIL | NOT TESTED */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleSetStatus(test.id, "PASS")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                        currentStatus === "PASS"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                          : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      PASS
                    </button>

                    <button
                      onClick={() => handleSetStatus(test.id, "FAIL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                        currentStatus === "FAIL"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                          : "text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      FAIL
                    </button>

                    <button
                      onClick={() => handleSetStatus(test.id, "NOT TESTED")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1 transition-all ${
                        currentStatus === "NOT TESTED"
                          ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      NOT TESTED
                    </button>
                  </div>
                </div>

                {/* Instructions & Expectations */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      What you must do:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{test.userAction}</p>
                  </div>

                  <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider block mb-1">
                      Expected visual result:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{test.expectedResult}</p>
                  </div>
                </div>

                {/* Quick Helper Action Buttons */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Dedicated 0%, 50%, 100% buttons for beauty controls */}
                    {test.quickActionType === "beauty_level" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-pink-400 mr-1 flex items-center gap-1">
                          <Sliders className="w-3 h-3" /> Quick Setup:
                        </span>
                        <button
                          onClick={() => handleQuickAction(test, 0)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-colors"
                        >
                          Set 0%
                        </button>
                        <button
                          onClick={() => handleQuickAction(test, 50)}
                          className="px-2.5 py-1 rounded-lg bg-pink-900/40 hover:bg-pink-800/60 text-pink-200 text-xs font-mono font-bold border border-pink-700/50 transition-colors"
                        >
                          Set 50%
                        </button>
                        <button
                          onClick={() => handleQuickAction(test, 100)}
                          className="px-2.5 py-1 rounded-lg bg-pink-700 hover:bg-pink-600 text-white text-xs font-mono font-bold transition-colors"
                        >
                          Set 100%
                        </button>
                      </div>
                    ) : test.quickActionLabel ? (
                      <button
                        onClick={() => handleQuickAction(test)}
                        className="px-3 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 border border-indigo-700/50 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {test.quickActionLabel}
                      </button>
                    ) : null}

                    {/* Specific live values for Performance test */}
                    {test.id === "perf_telemetry_qa" && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Camera FPS: <strong className="text-white">{stats.cameraFps}</strong></span>
                        <span className="text-slate-400">Track FPS: <strong className="text-emerald-400">{stats.trackingFps}</strong></span>
                        <span className="text-slate-400">Render FPS: <strong className="text-indigo-400">{stats.renderFps}</strong></span>
                        <span className="text-slate-400">Latency: <strong className="text-amber-400">{stats.processingLatencyMs ?? "N/A"} ms</strong></span>
                        <span className="text-slate-400">Res: <strong className="text-cyan-400">{stats.cameraResolution}</strong></span>
                      </div>
                    )}

                    {/* Specific landmark display for face tracking */}
                    {test.group === "2. FACE TRACKING" && (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Live Landmarks: <strong className="text-emerald-400">{stats.landmarkCount}</strong>
                      </span>
                    )}
                  </div>

                  {/* Toggle Notes */}
                  <button
                    onClick={() =>
                      setExpandedNotes((prev) => ({
                        ...prev,
                        [test.id]: !prev[test.id],
                      }))
                    }
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {note ? "Edit Observation" : "Add Observation"}
                    {isNoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Observation Text Input Area */}
                {isNoteOpen && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => handleSetNote(test.id, e.target.value)}
                      placeholder="Write your visual observation (e.g. skin smoothing observed on forehead, background unaffected, etc.)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
