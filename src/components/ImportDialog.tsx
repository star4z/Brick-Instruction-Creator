import { Layers, Sparkles, ListOrdered, X } from 'lucide-react';
import { useManualStore } from '../store/useManualStore';
import type { ImportMode } from '../types/manual';

export function ImportDialog() {
  const pending = useManualStore((s) => s.pendingImportModel);
  const confirm = useManualStore((s) => s.confirmPendingImport);
  const cancel = useManualStore((s) => s.cancelPendingImport);

  if (!pending) return null;

  const options: Array<{
    mode: ImportMode;
    title: string;
    recommended?: boolean;
    desc: string;
    icon: typeof Sparkles;
  }> = [
    {
      mode: 'preserve_submodels',
      title: 'Preserve Submodels & Auto-Generate Steps',
      recommended: true,
      desc: 'Keep explicit submodels from your file while letting Brick Instruction Works build clean, buildable steps, SNOT callouts, and optimal camera rotations.',
      icon: Layers,
    },
    {
      mode: 'regenerate_all',
      title: 'Auto-Generate Everything From Scratch',
      desc: 'Ignore existing step markers and submodel groupings. Analyze raw brick connectivity, auto-detect SNOT & repeated modules, and generate fresh steps.',
      icon: Sparkles,
    },
    {
      mode: 'preserve_steps',
      title: 'Respect Existing Step Markers',
      desc: 'Keep the exact step sequence from your imported file and apply automatic Viterbi camera rotation optimization and reactive page layout.',
      icon: ListOrdered,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#dcd9d0] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#eceae4] bg-[#f9f8f5]">
          <div>
            <h2 id="import-dialog-title" className="font-display text-lg font-bold text-[#17191c]">
              Existing Structure Detected in “{pending.name}”
            </h2>
            <p className="text-xs text-[#5a5f66] mt-0.5">
              Found {pending.parts.length} parts
              {pending.hasExistingSubmodels ? ` · ${pending.explicitSubmodels.length} submodel(s)` : ''}
              {pending.hasExistingSteps ? ' · existing STEP markers' : ''}. How should Brick Instruction Works import it?
            </p>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="p-1.5 rounded-lg text-[#5a5f66] hover:bg-[#eceae4] cursor-pointer"
            aria-label="Cancel import"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => confirm(opt.mode)}
                className="w-full text-left p-3.5 rounded-xl border border-[#dcd9d0] hover:border-[#006cb7] hover:bg-[#f4f9fd] transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-[#f4f3ef] group-hover:bg-[#006cb7] group-hover:text-white text-[#17191c] transition shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#17191c]">{opt.title}</span>
                    {opt.recommended && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e6f2fb] text-[#006cb7]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5a5f66] mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
