import { useMemo } from 'react';
import { Orbit, Pin, RotateCw } from 'lucide-react';
import { getLDrawColor } from '../data/ldrawColors';
import { getPageDimensions } from '../data/themePresets';
import { buildStepPliEntries, getStepRenderPartSets } from '../engine/layoutEngine';
import { technicalRenderer } from '../renderer/technicalRenderer';
import { useManualStore } from '../store/useManualStore';
import type { PartInstance, SubassemblyNode, ThemeSettings } from '../types/manual';
import { InteractiveStepViewport } from './InteractiveStepViewport';
import { RotationCueIcon } from './RotationCueIcon';

function getPageBgStyle(theme: ThemeSettings): React.CSSProperties {
  if (theme.backgroundMode === 'image' && theme.backgroundImageDataUrl) {
    return {
      backgroundImage: `url(${theme.backgroundImageDataUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: theme.backgroundColor,
    };
  }
  if (theme.backgroundMode === 'gradient') {
    return {
      background: `linear-gradient(160deg, ${theme.backgroundColor} 0%, ${theme.backgroundGradientEnd} 100%)`,
    };
  }
  return {
    backgroundColor: theme.backgroundColor,
  };
}

function getFontClass(font: ThemeSettings['fontFamily']): string {
  if (font === 'space') return 'font-display';
  if (font === 'mono') return 'font-mono-tech';
  return '';
}

function SubassemblyCalloutCard({
  sub,
  partsById,
  theme,
  showAttachRotation,
}: {
  sub: SubassemblyNode;
  partsById: Record<string, PartInstance>;
  theme: ThemeSettings;
  showAttachRotation: boolean;
}) {
  const subParts = sub.partIds.map((id) => partsById[id]).filter(Boolean);
  const subPli = useMemo(() => {
    const map = new Map<string, { partId: string; colorId: number; qty: number; name: string }>();
    for (const p of subParts) {
      const k = `${p.partId}:${p.colorId}`;
      const prev = map.get(k);
      if (prev) prev.qty += 1;
      else map.set(k, { partId: p.partId, colorId: p.colorId, qty: 1, name: p.partName });
    }
    return Array.from(map.values());
  }, [subParts]);

  const calloutImg = technicalRenderer.renderStepDataUrl(
    `sub_${sub.id}_${theme.presetId}_${theme.showEdgeLines}`,
    {
      previousParts: [],
      newParts: subParts,
      viewId: 'top_front_right',
      theme: {
        ...theme,
        highlightNewParts: false,
        fadePreviousParts: false,
        showPlacementArrows: false,
      },
      sceneRotation: sub.buildOrientation,
      width: 340,
      height: 240,
    },
  );

  return (
    <div
      className="rounded-xl p-2.5 shadow-sm flex flex-col gap-2 max-w-[230px] shrink-0 overflow-hidden"
      style={{
        backgroundColor: theme.calloutBackground,
        border: `1.5px solid ${theme.calloutBorderColor}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wide min-w-0 truncate" style={{ color: theme.textColor }}>
          {sub.name}
        </span>
        {sub.repeatCount > 1 && (
          <span
            className="font-display text-xs font-extrabold px-1.5 py-0.5 rounded text-white shrink-0"
            style={{ backgroundColor: theme.accentColor }}
          >
            {sub.repeatCount}×
          </span>
        )}
      </div>

      {/* Subassembly parts mini-PLI */}
      <div className="flex flex-wrap gap-1">
        {subPli.map((item) => {
          const thumb = technicalRenderer.renderPliThumbnail(item.partId, item.colorId, theme);
          return (
            <div
              key={`${item.partId}:${item.colorId}`}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: theme.pliBackground,
                border: `1px solid ${theme.pliBorderColor}`,
                color: theme.textColor,
              }}
            >
              {thumb && <img src={thumb} alt={item.name} className="w-5 h-5 object-contain" />}
              <span>{item.qty}×</span>
            </div>
          );
        })}
      </div>

      {/* Natural upright subassembly build render */}
      {calloutImg && (
        <img
          src={calloutImg}
          alt={sub.name}
          className="w-full h-28 object-contain select-none"
        />
      )}

      {/* Automatic build-vs-attach rotation cue */}
      {sub.requiresAttachRotation && showAttachRotation && (
        <div
          className="flex items-center justify-center gap-1 text-[10px] font-bold rounded-md px-2 py-1"
          style={{
            backgroundColor: theme.pliBackground,
            color: theme.accentColor,
            border: `1px dashed ${theme.calloutBorderColor}`,
          }}
        >
          <RotateCw className="w-3 h-3" />
          <span>Rotate to attach</span>
        </div>
      )}
    </div>
  );
}

export function PageCanvas() {
  const model = useManualStore((s) => s.model);
  const plan = useManualStore((s) => s.plan);
  const pages = useManualStore((s) => s.pages);
  const currentPageIndex = useManualStore((s) => s.currentPageIndex);
  const overrides = useManualStore((s) => s.overrides);
  const theme = useManualStore((s) => s.theme);
  const cover = useManualStore((s) => s.cover);
  const back = useManualStore((s) => s.back);
  const bom = useManualStore((s) => s.bom);
  const selectedStepId = useManualStore((s) => s.selectedStepId);
  const interactive3DStepId = useManualStore((s) => s.interactive3DStepId);

  const selectStep = useManualStore((s) => s.selectStep);
  const toggleInteractive3D = useManualStore((s) => s.toggleInteractive3D);
  const updateStepOverride = useManualStore((s) => s.updateStepOverride);

  const page = pages[currentPageIndex];
  const partsById = useMemo(
    () => Object.fromEntries(model.parts.map((p) => [p.id, p])),
    [model.parts],
  );

  if (!page) return null;

  const { aspectRatio } = getPageDimensions(theme.pageSize, theme.orientation);
  const bgStyle = getPageBgStyle(theme);
  const fontClass = getFontClass(theme.fontFamily);

  const renderCover = () => {
    const heroImg = technicalRenderer.renderStepDataUrl(
      `cover_${model.id}_${cover.heroView}_${theme.presetId}_${theme.showEdgeLines}`,
      {
        previousParts: [],
        newParts: model.parts,
        viewId: cover.heroView,
        theme: {
          ...theme,
          highlightNewParts: false,
          fadePreviousParts: false,
          showPlacementArrows: false,
        },
        width: 960,
        height: 640,
      },
    );

    return (
      <div className="w-full h-full p-6 sm:p-10 flex flex-col justify-between relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2"
              style={{
                backgroundColor: theme.accentColor,
                color: '#FFFFFF',
              }}
            >
              <span>{cover.setNumber || 'CUSTOM'}</span>
              <span>•</span>
              <span>Building Instructions</span>
            </div>
            <h2
              className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight"
              style={{ color: theme.textColor }}
            >
              {cover.title || model.name}
            </h2>
            {cover.subtitle && (
              <p className="text-xs sm:text-sm mt-1.5 max-w-xl" style={{ color: theme.mutedTextColor }}>
                {cover.subtitle}
              </p>
            )}
          </div>

          {cover.customLogoDataUrl && (
            <img
              src={cover.customLogoDataUrl}
              alt="Custom manual logo"
              className="h-12 sm:h-16 max-w-[140px] object-contain rounded-lg"
            />
          )}
        </div>

        <div className="flex-1 flex items-center justify-center my-2 min-h-0">
          {heroImg && (
            <img
              src={heroImg}
              alt={cover.title || model.name}
              className="max-w-full max-h-full object-contain drop-shadow-md select-none"
            />
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t" style={{ borderColor: theme.pliBorderColor }}>
          <div className="flex items-center gap-2.5 flex-wrap">
            {cover.showPieceCount && (
              <span
                className="px-3 py-1 rounded-lg text-xs font-extrabold"
                style={{
                  backgroundColor: theme.pliBackground,
                  border: `1px solid ${theme.pliBorderColor}`,
                  color: theme.textColor,
                }}
              >
                {model.parts.length} PIECES
              </span>
            )}
            {cover.showStepCount && (
              <span
                className="px-3 py-1 rounded-lg text-xs font-extrabold"
                style={{
                  backgroundColor: theme.pliBackground,
                  border: `1px solid ${theme.pliBorderColor}`,
                  color: theme.textColor,
                }}
              >
                {Object.keys(plan.steps).length} STEPS
              </span>
            )}
          </div>
          {cover.author && (
            <span className="text-xs font-semibold" style={{ color: theme.mutedTextColor }}>
              Designed by {cover.author}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderBack = () => {
    const heroImg = back.showCompletionRender
      ? technicalRenderer.renderStepDataUrl(
          `back_${model.id}_${theme.presetId}_${theme.showEdgeLines}`,
          {
            previousParts: [],
            newParts: model.parts,
            viewId: 'top_front_left',
            theme: {
              ...theme,
              highlightNewParts: false,
              fadePreviousParts: false,
              showPlacementArrows: false,
            },
            width: 820,
            height: 520,
          },
        )
      : null;

    return (
      <div className="w-full h-full p-8 flex flex-col items-center justify-between text-center">
        <div>
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: theme.accentColor }}
          >
            {cover.setNumber} · {cover.title}
          </span>
          <h2 className="font-display text-3xl font-extrabold mt-1" style={{ color: theme.textColor }}>
            {back.headline || 'Build Complete!'}
          </h2>
        </div>

        {heroImg && (
          <div className="flex-1 flex items-center justify-center my-3 min-h-0">
            <img src={heroImg} alt="Completed model" className="max-h-full max-w-full object-contain" />
          </div>
        )}

        <div className="space-y-3 w-full max-w-md">
          {back.showStatsSummary && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pieces', val: model.parts.length },
                { label: 'Steps', val: Object.keys(plan.steps).length },
                { label: 'Subassemblies', val: Object.keys(plan.subassemblies).length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-2.5"
                  style={{
                    backgroundColor: theme.pliBackground,
                    border: `1px solid ${theme.pliBorderColor}`,
                  }}
                >
                  <div className="font-display text-xl font-extrabold" style={{ color: theme.accentColor }}>
                    {stat.val}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs" style={{ color: theme.mutedTextColor }}>
            {back.footerNote}
          </p>
        </div>
      </div>
    );
  };

  const renderBom = () => {
    const entries = page.bomEntries ?? [];
    return (
      <div className="w-full h-full p-5 sm:p-7 flex flex-col">
        <div className="flex items-baseline justify-between mb-4 pb-2 border-b" style={{ borderColor: theme.pliBorderColor }}>
          <h2 className="font-display text-xl font-extrabold" style={{ color: theme.textColor }}>
            {bom.title || 'Parts Inventory'}
          </h2>
          <span className="text-xs font-mono-tech font-semibold" style={{ color: theme.mutedTextColor }}>
            {model.parts.length} total pieces · Sheet {page.bomPageIndex}/{page.bomTotalPages}
          </span>
        </div>

        <div
          className="grid gap-2.5 flex-1 content-start"
          style={{
            gridTemplateColumns: `repeat(${Math.max(3, Math.min(7, bom.columns))}, minmax(0, 1fr))`,
          }}
        >
          {entries.map((entry) => {
            const thumb = technicalRenderer.renderPliThumbnail(entry.partId, entry.colorId, theme);
            const col = getLDrawColor(entry.colorId);
            return (
              <div
                key={`${entry.partId}:${entry.colorId}`}
                className="rounded-xl p-2 flex flex-col items-center justify-between text-center gap-1"
                style={{
                  backgroundColor: theme.pliBackground,
                  border: `1px solid ${theme.pliBorderColor}`,
                }}
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                  <span className="font-display text-sm font-extrabold" style={{ color: theme.textColor }}>
                    {entry.quantity}×
                  </span>
                </div>
                {thumb && (
                  <img
                    src={thumb}
                    alt={entry.partName}
                    className="w-12 h-12 object-contain select-none"
                  />
                )}
                <div className="w-full">
                  <div className="text-[10px] font-semibold truncate" style={{ color: theme.textColor }} title={entry.partName}>
                    {entry.partName}
                  </div>
                  <div className="font-mono-tech text-[9px] uppercase" style={{ color: theme.mutedTextColor }}>
                    {entry.partId} · {col.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStepsPage = () => {
    const slots = page.slots ?? [];
    const gridClass =
      slots.length === 1
        ? 'grid-cols-1 grid-rows-1'
        : slots.length === 2
          ? theme.orientation === 'portrait'
            ? 'grid-cols-1 grid-rows-2'
            : 'grid-cols-2 grid-rows-1'
          : 'grid-cols-2 grid-rows-2';

    return (
      <div className="w-full h-full p-4 sm:p-6 pb-8 flex flex-col">
        <div className={`flex-1 grid ${gridClass} gap-3 min-h-0`}>
          {slots.map((slot) => {
            const step = plan.steps[slot.stepId];
            if (!step) return null;
            const ov = overrides[step.id];
            const isSelected = selectedStepId === step.id;
            const isOrbiting = interactive3DStepId === step.id;
            const pliEntries = buildStepPliEntries(step, partsById);
            const { previousPartIds, newPartIds } = getStepRenderPartSets(
              plan,
              slot.chapterId,
              step.id,
            );
            const prevParts = previousPartIds.map((id) => partsById[id]).filter(Boolean);
            const newParts = newPartIds.map((id) => partsById[id]).filter(Boolean);

            const effectiveView = ov?.cameraViewOverride ?? step.cameraView;
            const transformHash = ov?.presentationTransforms
              ? JSON.stringify(ov.presentationTransforms)
              : '';
            const cacheKey = [
              step.id,
              effectiveView,
              ov?.customAzimuthDeg ?? '',
              ov?.customElevationDeg ?? '',
              ov?.zoomScale ?? '',
              theme.presetId,
              theme.highlightNewParts,
              theme.highlightColor,
              theme.highlightIntensity,
              theme.fadePreviousParts,
              theme.fadeOpacity,
              theme.fadeDesaturation,
              theme.showEdgeLines,
              theme.showPlacementArrows,
              theme.accentColor,
              transformHash,
              prevParts.length,
              newParts.length,
            ].join('|');

            const stepImg = !isOrbiting
              ? technicalRenderer.renderStepDataUrl(cacheKey, {
                  previousParts: prevParts,
                  newParts,
                  viewId: effectiveView,
                  customAzimuthDeg: ov?.customAzimuthDeg,
                  customElevationDeg: ov?.customElevationDeg,
                  zoomScale: ov?.zoomScale,
                  theme,
                  transforms: ov?.presentationTransforms,
                  insertionDirection: step.insertionDirection,
                  width: slots.length === 1 ? 860 : 540,
                  height: slots.length === 1 ? 560 : 380,
                })
              : null;

            const attachedSubs = step.attachedSubassemblyIds
              .map((id) => plan.subassemblies[id])
              .filter(Boolean);

            return (
              <div
                key={step.id}
                onClick={() => selectStep(step.id)}
                className="relative rounded-xl p-3 flex flex-col min-h-0 transition cursor-pointer"
                style={{
                  border: isSelected
                    ? `2px solid ${theme.accentColor}`
                    : slots.length > 1
                      ? `1px solid ${theme.pliBorderColor}`
                      : '2px solid transparent',
                  backgroundColor:
                    slots.length > 1 ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                {/* Step Header Row: Step Number, PLI Box, Rotation Cue, 3D Orbit Button */}
                <div className="flex items-start justify-between gap-2 z-10 shrink-0">
                  <div className="flex items-start gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-display font-extrabold leading-none select-none"
                        style={{
                          color: theme.textColor,
                          fontSize: `${Math.round((slots.length > 2 ? 26 : 36) * theme.stepNumberScale)}px`,
                        }}
                      >
                        {step.stepNumber}
                      </span>
                      {ov?.pinPageBreakBefore && (
                        <span
                          className="p-1 rounded-md bg-[#fff3e8] text-[#d9480f] border border-[#f5c7a3]"
                          title="Pinned Page Break"
                        >
                          <Pin className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* PLI Box (Piece Previews for this Step) */}
                    {pliEntries.length > 0 && (
                      <div
                        className="rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-2 flex-wrap"
                        style={{
                          backgroundColor: theme.pliBackground,
                          border: `1.5px solid ${theme.pliBorderColor}`,
                        }}
                      >
                        {pliEntries.map((entry) => {
                          const thumb = technicalRenderer.renderPliThumbnail(
                            entry.partId,
                            entry.colorId,
                            theme,
                          );
                          return (
                            <div
                              key={`${entry.partId}:${entry.colorId}`}
                              className="flex flex-col items-center"
                              title={`${entry.quantity}× ${entry.partName} (${getLDrawColor(entry.colorId).name})`}
                            >
                              {thumb && (
                                <img
                                  src={thumb}
                                  alt={entry.partName}
                                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain select-none"
                                />
                              )}
                              <span
                                className="text-[11px] font-extrabold leading-none"
                                style={{ color: theme.textColor }}
                              >
                                {entry.quantity}×
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right controls: Automatic Rotation Indicator + Interactive 3D Orbit toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {theme.showRotationIndicators && step.rotationCue !== 'none' && (
                      <RotationCueIcon
                        cue={step.rotationCue}
                        accentColor={theme.accentColor}
                        compact={slots.length > 2}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectStep(step.id);
                        toggleInteractive3D(step.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/90 text-[#17191c] border border-[#dcd9d0] hover:border-[#006cb7] shadow-xs cursor-pointer"
                      title="Orbit this step in live 3D and optionally lock a custom camera angle"
                    >
                      <Orbit className="w-3.5 h-3.5 text-[#006cb7]" />
                      <span className="hidden sm:inline">{isOrbiting ? 'Exit 3D' : '3D'}</span>
                    </button>
                  </div>
                </div>

                {/* Step Main Content: Subassembly Callout(s) + 3D Step Model */}
                <div className="flex-1 flex items-center justify-center gap-3 min-h-0 mt-1 overflow-hidden">
                  {attachedSubs.length > 0 && (
                    <div className="flex flex-col gap-2 shrink-0 self-start mt-1">
                      {attachedSubs.map((sub) => (
                        <SubassemblyCalloutCard
                          key={sub.id}
                          sub={sub}
                          partsById={partsById}
                          theme={theme}
                          showAttachRotation={ov?.showSubassemblyAttachRotation ?? true}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex-1 h-full flex items-center justify-center min-w-0 min-h-0">
                    {isOrbiting ? (
                      <InteractiveStepViewport
                        previousParts={prevParts}
                        newParts={newParts}
                        viewId={effectiveView}
                        initialAzimuthDeg={ov?.customAzimuthDeg}
                        initialElevationDeg={ov?.customElevationDeg}
                        theme={theme}
                        transforms={ov?.presentationTransforms}
                        insertionDirection={step.insertionDirection}
                        onSaveAngle={(az, el) => {
                          updateStepOverride(step.id, {
                            customAzimuthDeg: az,
                            customElevationDeg: el,
                          });
                          toggleInteractive3D(null);
                        }}
                        onClose={() => toggleInteractive3D(null)}
                      />
                    ) : stepImg ? (
                      <img
                        src={stepImg}
                        alt={`Step ${step.stepNumber}`}
                        className="max-w-full max-h-full object-contain select-none"
                      />
                    ) : (
                      <div className="text-xs opacity-60">WebGL preview unavailable</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 studio-desk overflow-auto flex items-center justify-center p-3 sm:p-6">
      <div
        className={`relative shadow-[0_18px_50px_rgba(23,25,28,0.18)] rounded-md overflow-hidden transition-all duration-200 ${fontClass} ${
          theme.backgroundMode === 'blueprint-grid' ? 'manual-blueprint-bg' : ''
        }`}
        style={{
          ...bgStyle,
          width: '100%',
          maxWidth: theme.orientation === 'portrait' ? '640px' : '960px',
          aspectRatio: `${aspectRatio}`,
        }}
      >
        {page.kind === 'cover' && renderCover()}
        {page.kind === 'steps' && renderStepsPage()}
        {page.kind === 'bom' && renderBom()}
        {page.kind === 'back' && renderBack()}

        {/* Page Footer (Chapter label & Page Number) */}
        {theme.showPageNumbers && page.kind !== 'cover' && (
          <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="text-[11px] font-semibold" style={{ color: theme.mutedTextColor }}>
              {page.chapterName ?? (page.kind === 'bom' ? bom.title : cover.title)}
            </span>
            <span className="font-display text-xs font-extrabold" style={{ color: theme.textColor }}>
              {page.pageNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
