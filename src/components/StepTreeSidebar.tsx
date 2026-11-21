import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Box,
  ChevronRight,
  Combine,
  Layers,
  Pin,
  RotateCw,
  Scissors,
  User,
} from 'lucide-react';
import { getLDrawColor } from '../data/ldrawColors';
import { useManualStore } from '../store/useManualStore';

export function StepTreeSidebar() {
  const model = useManualStore((s) => s.model);
  const plan = useManualStore((s) => s.plan);
  const overrides = useManualStore((s) => s.overrides);
  const selectedStepId = useManualStore((s) => s.selectedStepId);

  const selectStep = useManualStore((s) => s.selectStep);
  const splitSelectedStep = useManualStore((s) => s.splitSelectedStep);
  const mergeSelectedStep = useManualStore((s) => s.mergeSelectedStep);
  const reorderSelectedStep = useManualStore((s) => s.reorderSelectedStep);
  const movePartToStep = useManualStore((s) => s.movePartToStep);
  const updateStepOverride = useManualStore((s) => s.updateStepOverride);

  const [expandedStepParts, setExpandedStepParts] = useState<string | null>(null);

  const partsById = Object.fromEntries(model.parts.map((p) => [p.id, p]));
  const selectedStep = selectedStepId ? plan.steps[selectedStepId] : null;
  const selectedChapter = selectedStep
    ? plan.chapters.find((c) => c.id === selectedStep.chapterId)
    : null;
  const selectedIdx =
    selectedChapter && selectedStep ? selectedChapter.stepIds.indexOf(selectedStep.id) : -1;

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-white border-r border-[#dcd9d0] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-[#eceae4] bg-[#f9f8f5] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#006cb7]" />
          <span className="font-display text-xs font-bold uppercase tracking-wider text-[#17191c]">
            Build Sequence
          </span>
        </div>
        <span className="font-mono-tech text-[11px] text-[#5a5f66]">
          {Object.keys(plan.steps).length} steps
        </span>
      </div>

      {/* Quick Step Edit Toolbar for selected step */}
      {selectedStep && selectedChapter && (
        <div className="px-3 py-2 border-b border-[#eceae4] bg-[#fcfbf8] flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold text-[#5a5f66] truncate">
            Step {selectedStep.stepNumber}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                updateStepOverride(selectedStep.id, {
                  pinPageBreakBefore: !overrides[selectedStep.id]?.pinPageBreakBefore,
                })
              }
              className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
                overrides[selectedStep.id]?.pinPageBreakBefore
                  ? 'bg-[#fff3e8] border-[#d9480f] text-[#d9480f]'
                  : 'bg-white border-[#dcd9d0] text-[#5a5f66] hover:text-[#17191c]'
              }`}
              title="Pin Page Break before this step (locks downstream pagination)"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={selectedStep.partIds.length < 2}
              onClick={() => splitSelectedStep(selectedStep.id)}
              className="p-1.5 rounded-md border border-[#dcd9d0] bg-white text-[#5a5f66] hover:text-[#17191c] disabled:opacity-35 cursor-pointer disabled:cursor-default"
              title="Split step into two consecutive steps"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={selectedIdx < 0 || selectedIdx >= selectedChapter.stepIds.length - 1}
              onClick={() => mergeSelectedStep(selectedStep.id)}
              className="p-1.5 rounded-md border border-[#dcd9d0] bg-white text-[#5a5f66] hover:text-[#17191c] disabled:opacity-35 cursor-pointer disabled:cursor-default"
              title="Merge with next step"
            >
              <Combine className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={selectedIdx <= 0}
              onClick={() => reorderSelectedStep(selectedStep.id, 'up')}
              className="p-1.5 rounded-md border border-[#dcd9d0] bg-white text-[#5a5f66] hover:text-[#17191c] disabled:opacity-35 cursor-pointer disabled:cursor-default"
              title="Move step earlier"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={selectedIdx < 0 || selectedIdx >= selectedChapter.stepIds.length - 1}
              onClick={() => reorderSelectedStep(selectedStep.id, 'down')}
              className="p-1.5 rounded-md border border-[#dcd9d0] bg-white text-[#5a5f66] hover:text-[#17191c] disabled:opacity-35 cursor-pointer disabled:cursor-default"
              title="Move step later"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating-Part Warnings Banner */}
      {plan.floatingWarnings.length > 0 && (
        <div className="mx-3 mt-2.5 p-2.5 rounded-lg bg-[#fff5eb] border border-[#f3c399] text-xs text-[#7c350a]">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-[#d9480f] shrink-0" />
            <span>{plan.floatingWarnings.length} Floating Part Warning(s)</span>
          </div>
          <ul className="mt-1 space-y-1 text-[11px] leading-snug">
            {plan.floatingWarnings.slice(0, 3).map((w) => (
              <li key={w.instanceId}>• {w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chapters & Steps Tree */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4">
        {plan.chapters.map((chapter, chIdx) => (
          <div key={chapter.id}>
            <div className="flex items-center justify-between px-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {chapter.kind === 'minifigure' ? (
                  <User className="w-3.5 h-3.5 text-[#d9480f] shrink-0" />
                ) : (
                  <Box className="w-3.5 h-3.5 text-[#006cb7] shrink-0" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#17191c] truncate">
                  {chIdx + 1}. {chapter.name}
                </span>
              </div>
              <span className="font-mono-tech text-[10px] text-[#5a5f66]">
                {chapter.partIds.length} pcs
              </span>
            </div>

            <div className="space-y-1">
              {chapter.stepIds.map((sid) => {
                const step = plan.steps[sid];
                if (!step) return null;
                const isSelected = selectedStepId === sid;
                const ov = overrides[sid];
                const isPinned = Boolean(ov?.pinPageBreakBefore);
                const hasSub = step.attachedSubassemblyIds.length > 0;
                const isExpanded = expandedStepParts === sid;

                return (
                  <div key={sid}>
                    <div
                      onClick={() => selectStep(sid)}
                      className={`group rounded-lg px-2 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition border ${
                        isSelected
                          ? 'bg-[#edf6fe] border-[#7bb8e8] text-[#0b2942]'
                          : 'bg-white border-transparent hover:bg-[#f4f3ef] text-[#17191c]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedStepParts(isExpanded ? null : sid);
                          }}
                          className="p-0.5 text-[#5a5f66] hover:text-[#17191c] cursor-pointer"
                          aria-label="Inspect parts in step"
                        >
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        <span className="font-display text-xs font-bold w-5 text-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {hasSub
                              ? step.attachedSubassemblyIds
                                  .map((id) => plan.subassemblies[id]?.name ?? 'Subassembly')
                                  .join(', ')
                              : `${step.partIds.length} piece${step.partIds.length === 1 ? '' : 's'}`}
                          </div>
                          {hasSub && (
                            <span className="text-[10px] font-semibold text-[#006cb7]">
                              Auto SNOT / Subassembly Callout
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isPinned && (
                          <span
                            className="p-0.5 rounded bg-[#fff3e8] text-[#d9480f]"
                            title="Pinned Page Break"
                          >
                            <Pin className="w-3 h-3" />
                          </span>
                        )}
                        {step.rotationCue !== 'none' && (
                          <span
                            className="p-0.5 rounded bg-[#e6f2fb] text-[#006cb7]"
                            title={`Automatic camera rotation: ${step.rotationCue}`}
                          >
                            <RotateCw className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable per-part reassignment list */}
                    {isExpanded && step.partIds.length > 0 && (
                      <div className="ml-6 mt-1 mb-1.5 pl-2 border-l-2 border-[#e5e3dc] space-y-1">
                        {step.partIds.map((pid) => {
                          const p = partsById[pid];
                          if (!p) return null;
                          const col = getLDrawColor(p.colorId);
                          return (
                            <div
                              key={pid}
                              className="flex items-center justify-between gap-1.5 text-[11px] py-0.5 pr-1"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span className="truncate text-[#17191c]" title={p.partName}>
                                  {p.partName}
                                </span>
                              </div>
                              {chapter.stepIds.length > 1 && (
                                <select
                                  aria-label={`Move ${p.partName} to step`}
                                  value={sid}
                                  onChange={(e) => movePartToStep(pid, sid, e.target.value)}
                                  className="text-[10px] font-mono-tech bg-[#f9f8f5] border border-[#dcd9d0] rounded px-1 py-0.5 cursor-pointer"
                                >
                                  {chapter.stepIds.map((targetSid) => (
                                    <option key={targetSid} value={targetSid}>
                                      → S{plan.steps[targetSid]?.stepNumber}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
