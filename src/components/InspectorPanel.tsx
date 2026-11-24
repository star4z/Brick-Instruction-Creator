import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Camera,
  Database,
  Move3d,
  Palette,
  Pin,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { getLDrawColor } from '../data/ldrawColors';
import { THEME_PRESETS } from '../data/themePresets';
import { partsProvider } from '../engine/partsProvider';
import { useManualStore } from '../store/useManualStore';
import type {
  BackgroundMode,
  BomSortMode,
  CanonicalViewId,
  PageOrientation,
  PageSizeId,
  ThemePresetId,
} from '../types/manual';

type InspectorTab = 'theme' | 'step' | 'cover-bom' | 'library';

const CORNER_OPTIONS: Array<{ suffix: 'front_right' | 'back_right' | 'back_left' | 'front_left'; label: string }> = [
  { suffix: 'front_right', label: 'Front Right' },
  { suffix: 'back_right', label: 'Back Right' },
  { suffix: 'back_left', label: 'Back Left' },
  { suffix: 'front_left', label: 'Front Left' },
];

export function InspectorPanel() {
  const [tab, setTab] = useState<InspectorTab>('theme');
  const [selectedMovePartId, setSelectedMovePartId] = useState<string>('');
  const [cachedPartCount, setCachedPartCount] = useState<number>(0);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  const model = useManualStore((s) => s.model);
  const plan = useManualStore((s) => s.plan);
  const overrides = useManualStore((s) => s.overrides);
  const theme = useManualStore((s) => s.theme);
  const cover = useManualStore((s) => s.cover);
  const back = useManualStore((s) => s.back);
  const bom = useManualStore((s) => s.bom);
  const selectedStepId = useManualStore((s) => s.selectedStepId);

  const applyThemePreset = useManualStore((s) => s.applyThemePreset);
  const updateTheme = useManualStore((s) => s.updateTheme);
  const updateCover = useManualStore((s) => s.updateCover);
  const updateBack = useManualStore((s) => s.updateBack);
  const updateBom = useManualStore((s) => s.updateBom);
  const updateStepOverride = useManualStore((s) => s.updateStepOverride);
  const resetStepOverride = useManualStore((s) => s.resetStepOverride);
  const updatePresentationTransform = useManualStore((s) => s.updatePresentationTransform);
  const clearPresentationTransform = useManualStore((s) => s.clearPresentationTransform);
  const setStatusMessage = useManualStore((s) => s.setStatusMessage);

  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ldrawZipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void partsProvider.getCachedCount().then(setCachedPartCount);
  }, [tab]);

  const selectedStep = selectedStepId ? plan.steps[selectedStepId] : null;
  const selectedOverride = selectedStep ? overrides[selectedStep.id] : undefined;
  const partsById = Object.fromEntries(model.parts.map((p) => [p.id, p]));

  const stepTargetPartIds = selectedStep
    ? [
        ...selectedStep.partIds,
        ...selectedStep.attachedSubassemblyIds.flatMap(
          (sid) => plan.subassemblies[sid]?.instancePartIdGroups.flat() ?? [],
        ),
      ]
    : [];

  const activeMoveTargetId =
    selectedMovePartId && stepTargetPartIds.includes(selectedMovePartId)
      ? selectedMovePartId
      : stepTargetPartIds[0] ?? '';

  const activeTransform =
    selectedStep && activeMoveTargetId
      ? selectedOverride?.presentationTransforms?.[activeMoveTargetId] ?? {
          offset: [0, 0, 0] as [number, number, number],
          hingeAngleDeg: 0,
          hingeAxis: 'x' as const,
          showArrow: true,
        }
      : null;

  const effectiveView = selectedStep
    ? (selectedOverride?.cameraViewOverride ?? selectedStep.cameraView)
    : 'top_front_right';
  const isBottomView = effectiveView.startsWith('bottom_');
  const currentCorner = effectiveView.replace(/^(top|bottom)_/, '') as
    | 'front_right'
    | 'back_right'
    | 'back_left'
    | 'front_left';

  const setViewParts = (side: 'top' | 'bottom', corner: string) => {
    if (!selectedStep) return;
    updateStepOverride(selectedStep.id, {
      cameraViewOverride: `${side}_${corner}` as CanonicalViewId,
      customAzimuthDeg: undefined,
      customElevationDeg: undefined,
    });
  };

  const tabs: Array<{ id: InspectorTab; label: string; icon: typeof Palette }> = [
    { id: 'theme', label: 'Style', icon: Palette },
    { id: 'step', label: 'Adjust', icon: Move3d },
    { id: 'cover-bom', label: 'Pages', icon: BookOpen },
    { id: 'library', label: 'Parts', icon: Database },
  ];

  const offsetLabels = ['Slide Left / Right', 'Lift Up / Down', 'Slide Front / Back'];

  return (
    <aside className="w-full lg:w-84 shrink-0 bg-white border-l border-[#dadce0] flex flex-col h-full overflow-hidden">
      {/* Material 3 Navigation Tabs */}
      <div className="grid grid-cols-4 border-b border-[#dadce0] px-2 pt-2 gap-1 bg-white">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 pb-2.5 pt-1 text-[11px] font-semibold border-b-2 transition cursor-pointer ${
                active
                  ? 'border-[#1a73e8] text-[#1a73e8]'
                  : 'border-transparent text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {tab === 'theme' && (
          <>
            <section className="space-y-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Manual Theme
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((pid) => {
                  const p = THEME_PRESETS[pid];
                  const active = theme.presetId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => applyThemePreset(pid)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        active
                          ? 'border-[#1a73e8] bg-[#e8f0fe]'
                          : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {p.swatch.map((hex, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="font-semibold text-xs text-[#202124] leading-tight">
                        {p.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-[#e8eaed]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Page Layout
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Paper Size</span>
                  <select
                    value={theme.pageSize}
                    onChange={(e) => updateTheme({ pageSize: e.target.value as PageSizeId })}
                    className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-2 text-xs font-medium"
                  >
                    <option value="letter">US Letter</option>
                    <option value="a4">A4 Paper</option>
                    <option value="square">Square Book</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Orientation</span>
                  <select
                    value={theme.orientation}
                    onChange={(e) =>
                      updateTheme({ orientation: e.target.value as PageOrientation })
                    }
                    className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-2 text-xs font-medium"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-[#e8eaed]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Background & Colors
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Background</span>
                  <select
                    value={theme.backgroundMode}
                    onChange={(e) =>
                      updateTheme({ backgroundMode: e.target.value as BackgroundMode })
                    }
                    className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-2 text-xs font-medium"
                  >
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Soft Gradient</option>
                    <option value="blueprint-grid">Blueprint Grid</option>
                    <option value="image">Custom Image</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Typography</span>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) =>
                      updateTheme({
                        fontFamily: e.target.value as 'jakarta' | 'space' | 'mono',
                      })
                    }
                    className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-2 text-xs font-medium"
                  >
                    <option value="jakarta">Clean Sans</option>
                    <option value="space">Geometric Bold</option>
                    <option value="mono">Technical Mono</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Background</span>
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-[#dadce0] cursor-pointer"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Gradient End</span>
                  <input
                    type="color"
                    value={theme.backgroundGradientEnd}
                    onChange={(e) => updateTheme({ backgroundGradientEnd: e.target.value })}
                    className="w-full h-9 rounded-xl border border-[#dadce0] cursor-pointer"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Accent</span>
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-[#dadce0] cursor-pointer"
                  />
                </label>
              </div>

              {theme.backgroundMode === 'image' && (
                <div>
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          updateTheme({ backgroundImageDataUrl: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => bgImageInputRef.current?.click()}
                    className="w-full py-2 rounded-full border border-[#1a73e8] text-[#1a73e8] font-semibold hover:bg-[#e8f0fe] cursor-pointer"
                  >
                    Choose Background Image
                  </button>
                </div>
              )}

              <label className="block space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-[#5f6368]">
                  <span>Step Number Size</span>
                  <span>{Math.round(theme.stepNumberScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.45}
                  step={0.05}
                  value={theme.stepNumberScale}
                  onChange={(e) => updateTheme({ stepNumberScale: parseFloat(e.target.value) })}
                  className="w-full accent-[#1a73e8]"
                />
              </label>
            </section>

            <section className="space-y-2.5 pt-4 border-t border-[#e8eaed]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Visual Guides
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme.highlightNewParts}
                      onChange={(e) => updateTheme({ highlightNewParts: e.target.checked })}
                      className="accent-[#1a73e8] w-4 h-4"
                    />
                    <span>Outline New Pieces</span>
                  </label>
                  <input
                    type="color"
                    value={theme.highlightColor}
                    onChange={(e) => updateTheme({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-[#dadce0] cursor-pointer"
                  />
                </div>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.fadePreviousParts}
                    onChange={(e) => updateTheme({ fadePreviousParts: e.target.checked })}
                    className="accent-[#1a73e8] w-4 h-4"
                  />
                  <span>Fade Earlier Pieces</span>
                </label>

                {theme.fadePreviousParts && (
                  <div className="pl-6 space-y-2">
                    <label className="block">
                      <div className="flex justify-between text-[11px] text-[#5f6368]">
                        <span>Earlier Opacity</span>
                        <span>{Math.round(theme.fadeOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.3}
                        max={1}
                        step={0.05}
                        value={theme.fadeOpacity}
                        onChange={(e) => updateTheme({ fadeOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-[#1a73e8]"
                      />
                    </label>
                    <label className="block">
                      <div className="flex justify-between text-[11px] text-[#5f6368]">
                        <span>Muted Color Strength</span>
                        <span>{Math.round(theme.fadeDesaturation * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={theme.fadeDesaturation}
                        onChange={(e) =>
                          updateTheme({ fadeDesaturation: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#1a73e8]"
                      />
                    </label>
                  </div>
                )}

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.showEdgeLines}
                    onChange={(e) => updateTheme({ showEdgeLines: e.target.checked })}
                    className="accent-[#1a73e8] w-4 h-4"
                  />
                  <span>Brick Outlines</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.showPlacementArrows}
                    onChange={(e) => updateTheme({ showPlacementArrows: e.target.checked })}
                    className="accent-[#1a73e8] w-4 h-4"
                  />
                  <span>Placement Arrows</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.showRotationIndicators}
                    onChange={(e) => updateTheme({ showRotationIndicators: e.target.checked })}
                    className="accent-[#1a73e8] w-4 h-4"
                  />
                  <span>Rotation Badges</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.showPageNumbers}
                    onChange={(e) => updateTheme({ showPageNumbers: e.target.checked })}
                    className="accent-[#1a73e8] w-4 h-4"
                  />
                  <span>Page Numbers</span>
                </label>
              </div>
            </section>
          </>
        )}

        {tab === 'step' && (
          <>
            {!selectedStep ? (
              <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] text-center text-[#5f6368]">
                Select any step on the manual page to adjust its camera angle, page break, or piece position.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#202124]">
                      Step {selectedStep.stepNumber}
                    </h3>
                    <p className="text-[11px] text-[#5f6368]">
                      Custom settings stay attached to this step
                    </p>
                  </div>
                  {selectedOverride && (
                    <button
                      type="button"
                      onClick={() => resetStepOverride(selectedStep.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f1f3f4] text-[#202124] text-xs font-medium hover:bg-[#e8eaed] cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Page Break & Local Step Count */}
                <section className="space-y-3 p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e8eaed]">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-semibold text-[#202124] cursor-pointer">
                      <Pin className="w-4 h-4 text-[#1a73e8]" />
                      <span>Page Break</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedOverride?.pinPageBreakBefore)}
                      onChange={(e) =>
                        updateStepOverride(selectedStep.id, {
                          pinPageBreakBefore: e.target.checked,
                        })
                      }
                      className="accent-[#1a73e8] w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-[#5f6368] leading-relaxed">
                    Keeps this step at the start of a new page so editing earlier steps won&apos;t shift later pages. Pages remain editable.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-[#5f6368]">
                      Steps on This Page
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {(['inherit', '1-up', '2-up', '3-up', '4-up'] as const).map((mode) => {
                        const active =
                          mode === 'inherit'
                            ? !selectedOverride?.pageLayoutOverride
                            : selectedOverride?.pageLayoutOverride === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              updateStepOverride(selectedStep.id, {
                                pageLayoutOverride: mode === 'inherit' ? undefined : mode,
                              })
                            }
                            className={`py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer ${
                              active
                                ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                                : 'bg-white text-[#5f6368] border-[#dadce0]'
                            }`}
                          >
                            {mode === 'inherit' ? 'Auto' : mode.replace('-up', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Camera Angle — Plain English with Top/Bottom + 4 Corners */}
                <section className="space-y-3 pt-3 border-t border-[#e8eaed]">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Camera Angle
                  </h4>

                  <div className="grid grid-cols-2 gap-1.5 bg-[#f1f3f4] p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => setViewParts('top', currentCorner)}
                      className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                        !isBottomView
                          ? 'bg-white text-[#174ea6] shadow-xs'
                          : 'text-[#5f6368]'
                      }`}
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      Top View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewParts('bottom', currentCorner)}
                      className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                        isBottomView
                          ? 'bg-white text-[#174ea6] shadow-xs'
                          : 'text-[#5f6368]'
                      }`}
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Bottom View
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CORNER_OPTIONS.map((opt) => {
                      const active = currentCorner === opt.suffix;
                      return (
                        <button
                          key={opt.suffix}
                          type="button"
                          onClick={() =>
                            setViewParts(isBottomView ? 'bottom' : 'top', opt.suffix)
                          }
                          className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                            active
                              ? 'bg-[#e8f0fe] text-[#174ea6] border-[#1a73e8]'
                              : 'bg-white text-[#202124] border-[#dadce0] hover:bg-[#f8f9fa]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-[11px] text-[#5f6368]">
                      <span>Zoom</span>
                      <span>{Math.round((selectedOverride?.zoomScale ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.7}
                      step={0.05}
                      value={selectedOverride?.zoomScale ?? 1}
                      onChange={(e) =>
                        updateStepOverride(selectedStep.id, {
                          zoomScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#1a73e8]"
                    />
                  </label>
                </section>

                {/* Visual Piece Offset & Hinge Pose */}
                <section className="space-y-3 pt-3 border-t border-[#e8eaed]">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                    <Move3d className="w-3.5 h-3.5 text-[#1a73e8]" />
                    Nudge or Tilt Piece for Clarity
                  </h4>

                  {stepTargetPartIds.length > 0 && activeTransform && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e8eaed]">
                      <select
                        value={activeMoveTargetId}
                        onChange={(e) => setSelectedMovePartId(e.target.value)}
                        className="w-full rounded-xl border border-[#dadce0] bg-white px-2.5 py-2 text-xs font-medium"
                      >
                        {stepTargetPartIds.map((pid) => {
                          const p = partsById[pid];
                          if (!p) return null;
                          return (
                            <option key={pid} value={pid}>
                              {p.partName} ({getLDrawColor(p.colorId).name})
                            </option>
                          );
                        })}
                      </select>

                      {offsetLabels.map((label, idx) => (
                        <label key={label} className="block">
                          <div className="flex justify-between text-[11px] font-medium text-[#5f6368]">
                            <span>{label}</span>
                            <span>{(activeTransform.offset[idx] / 20).toFixed(1)} studs</span>
                          </div>
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            step={4}
                            value={activeTransform.offset[idx]}
                            onChange={(e) => {
                              const nextOffset: [number, number, number] = [
                                ...activeTransform.offset,
                              ];
                              nextOffset[idx] = parseInt(e.target.value, 10);
                              updatePresentationTransform(selectedStep.id, activeMoveTargetId, {
                                offset: nextOffset,
                              });
                            }}
                            className="w-full accent-[#1a73e8]"
                          />
                        </label>
                      ))}

                      <div className="grid grid-cols-3 gap-2 items-end">
                        <label className="col-span-2 block">
                          <div className="flex justify-between text-[11px] font-medium text-[#5f6368]">
                            <span>Tilt Angle</span>
                            <span>{activeTransform.hingeAngleDeg}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            step={5}
                            value={activeTransform.hingeAngleDeg}
                            onChange={(e) =>
                              updatePresentationTransform(selectedStep.id, activeMoveTargetId, {
                                hingeAngleDeg: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-[#1a73e8]"
                          />
                        </label>
                        <select
                          value={activeTransform.hingeAxis}
                          onChange={(e) =>
                            updatePresentationTransform(selectedStep.id, activeMoveTargetId, {
                              hingeAxis: e.target.value as 'x' | 'y' | 'z',
                            })
                          }
                          className="rounded-xl border border-[#dadce0] bg-white px-2 py-1.5 text-xs font-medium"
                        >
                          <option value="x">Tilt Fwd</option>
                          <option value="y">Spin</option>
                          <option value="z">Tilt Side</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeTransform.showArrow}
                            onChange={(e) =>
                              updatePresentationTransform(selectedStep.id, activeMoveTargetId, {
                                showArrow: e.target.checked,
                              })
                            }
                            className="accent-[#1a73e8] w-4 h-4"
                          />
                          <span>Show Arrow</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            clearPresentationTransform(selectedStep.id, activeMoveTargetId)
                          }
                          className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                        >
                          Reset Piece
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {tab === 'cover-bom' && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                  Cover Page
                </h3>
                <input
                  type="checkbox"
                  checked={cover.enabled}
                  onChange={(e) => updateCover({ enabled: e.target.checked })}
                  className="accent-[#1a73e8] w-4 h-4"
                />
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-[#5f6368]">Manual Title</span>
                <input
                  type="text"
                  value={cover.title}
                  onChange={(e) => updateCover({ title: e.target.value })}
                  className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-[#5f6368]">Subtitle</span>
                <input
                  type="text"
                  value={cover.subtitle}
                  onChange={(e) => updateCover({ subtitle: e.target.value })}
                  className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Model Code</span>
                  <input
                    type="text"
                    value={cover.setNumber}
                    onChange={(e) => updateCover({ setNumber: e.target.value })}
                    className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5f6368]">Designer</span>
                  <input
                    type="text"
                    value={cover.author}
                    onChange={(e) => updateCover({ author: e.target.value })}
                    className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                  />
                </label>
              </div>

              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        updateCover({ customLogoDataUrl: reader.result });
                      }
                    };
                    reader.readAsDataURL(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-2 rounded-full border border-[#dadce0] bg-[#f8f9fa] hover:bg-[#f1f3f4] text-xs font-semibold cursor-pointer"
                >
                  {cover.customLogoDataUrl ? 'Change Cover Logo' : 'Add Cover Logo'}
                </button>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-[#e8eaed]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                  End-of-Book Parts List
                </h3>
                <input
                  type="checkbox"
                  checked={bom.enabled}
                  onChange={(e) => updateBom({ enabled: e.target.checked })}
                  className="accent-[#1a73e8] w-4 h-4"
                />
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-[#5f6368]">Sort Pieces By</span>
                <select
                  value={bom.sortMode}
                  onChange={(e) => updateBom({ sortMode: e.target.value as BomSortMode })}
                  className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-2 text-xs"
                >
                  <option value="color-part">Color, then Shape</option>
                  <option value="quantity-desc">Most Used First</option>
                  <option value="part-id">Part Number</option>
                </select>
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-[#5f6368]">
                  <span>Columns per Page</span>
                  <span>{bom.columns}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={7}
                  step={1}
                  value={bom.columns}
                  onChange={(e) => updateBom({ columns: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#1a73e8]"
                />
              </label>
            </section>

            <section className="space-y-3 pt-4 border-t border-[#e8eaed]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                  Back Page
                </h3>
                <input
                  type="checkbox"
                  checked={back.enabled}
                  onChange={(e) => updateBack({ enabled: e.target.checked })}
                  className="accent-[#1a73e8] w-4 h-4"
                />
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-[#5f6368]">Closing Headline</span>
                <input
                  type="text"
                  value={back.headline}
                  onChange={(e) => updateBack({ headline: e.target.value })}
                  className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-[#5f6368]">Footer Text</span>
                <input
                  type="text"
                  value={back.footerNote}
                  onChange={(e) => updateBack({ footerNote: e.target.value })}
                  className="w-full rounded-xl border border-[#dadce0] px-3 py-2 text-xs"
                />
              </label>
            </section>
          </>
        )}

        {tab === 'library' && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
              3D Parts Library
            </h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Common bricks, plates, slopes, brackets, rods, clips, and minifigures are built in.
              Import an LDraw <span className="font-mono-tech">complete.zip</span> or custom{' '}
              <span className="font-mono-tech">.dat</span> file to cache additional shapes locally.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e8eaed] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Cached Shapes</span>
                <span className="font-semibold text-[#202124]">{cachedPartCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Embedded in Model</span>
                <span className="font-semibold text-[#202124]">
                  {Object.keys(model.embeddedLDrawFiles).length}
                </span>
              </div>
            </div>

            <input
              ref={ldrawZipInputRef}
              type="file"
              accept=".zip,.dat"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImportProgress('Reading archive...');
                try {
                  const count = await partsProvider.importLocalLibraryFile(f, (done, total) => {
                    setImportProgress(`Indexing ${done} / ${total} shapes...`);
                  });
                  setCachedPartCount(await partsProvider.getCachedCount());
                  setStatusMessage(`Cached ${count} part shapes locally.`);
                } catch (err) {
                  setStatusMessage(
                    `Library import failed: ${err instanceof Error ? err.message : String(err)}`,
                  );
                } finally {
                  setImportProgress(null);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              disabled={Boolean(importProgress)}
              onClick={() => ldrawZipInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-full bg-[#1a73e8] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1557b0] transition cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              <span>{importProgress ?? 'Import LDraw Parts (.zip / .dat)'}</span>
            </button>
          </section>
        )}
      </div>
    </aside>
  );
}
