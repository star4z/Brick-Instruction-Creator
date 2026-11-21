import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { useManualStore } from '../store/useManualStore';

export function PageThumbnailRail() {
  const pages = useManualStore((s) => s.pages);
  const currentPageIndex = useManualStore((s) => s.currentPageIndex);
  const plan = useManualStore((s) => s.plan);
  const selectPage = useManualStore((s) => s.selectPage);

  return (
    <div className="h-16 shrink-0 bg-white border-t border-[#dcd9d0] px-3 flex items-center gap-2">
      <button
        type="button"
        disabled={currentPageIndex <= 0}
        onClick={() => selectPage(currentPageIndex - 1)}
        className="p-1.5 rounded-lg border border-[#dcd9d0] hover:bg-[#f4f3ef] disabled:opacity-35 cursor-pointer disabled:cursor-default shrink-0"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1">
        {pages.map((page, idx) => {
          const active = idx === currentPageIndex;
          const label =
            page.kind === 'cover'
              ? 'Cover'
              : page.kind === 'back'
                ? 'Back'
                : page.kind === 'bom'
                  ? `BOM ${page.bomPageIndex}`
                  : page.slots && page.slots.length > 0
                    ? page.slots.length === 1
                      ? `S${plan.steps[page.slots[0].stepId]?.stepNumber ?? '?'}`
                      : `S${plan.steps[page.slots[0].stepId]?.stepNumber}–${plan.steps[page.slots[page.slots.length - 1].stepId]?.stepNumber}`
                    : `P${page.pageNumber}`;

          return (
            <button
              key={page.id}
              type="button"
              onClick={() => selectPage(idx)}
              className={`relative shrink-0 px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer min-w-[66px] ${
                active
                  ? 'bg-[#edf6fe] border-[#006cb7] text-[#005594] shadow-xs'
                  : 'bg-[#f9f8f5] border-[#dcd9d0] text-[#5a5f66] hover:border-[#b5b1a6] hover:text-[#17191c]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono-tech text-[10px] font-semibold">
                  p.{page.pageNumber}
                </span>
                {page.pinnedStart && <Pin className="w-2.5 h-2.5 text-[#d9480f]" />}
              </div>
              <div className="text-[11px] font-bold truncate mt-0.5">{label}</div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPageIndex >= pages.length - 1}
        onClick={() => selectPage(currentPageIndex + 1)}
        className="p-1.5 rounded-lg border border-[#dcd9d0] hover:bg-[#f4f3ef] disabled:opacity-35 cursor-pointer disabled:cursor-default shrink-0"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
