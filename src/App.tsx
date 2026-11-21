import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ImportDialog } from './components/ImportDialog';
import { InspectorPanel } from './components/InspectorPanel';
import { PageCanvas } from './components/PageCanvas';
import { PageThumbnailRail } from './components/PageThumbnailRail';
import { StepTreeSidebar } from './components/StepTreeSidebar';
import { TopBar } from './components/TopBar';
import { useManualStore } from './store/useManualStore';

export function App() {
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'steps' | 'inspector'>('none');

  const statusMessage = useManualStore((s) => s.statusMessage);
  const setStatusMessage = useManualStore((s) => s.setStatusMessage);
  const currentPageIndex = useManualStore((s) => s.currentPageIndex);
  const pages = useManualStore((s) => s.pages);
  const selectPage = useManualStore((s) => s.selectPage);
  const undo = useManualStore((s) => s.undo);
  const redo = useManualStore((s) => s.redo);

  // Global keyboard shortcuts (Arrow Left/Right for pages, Ctrl/Cmd+Z for Undo/Redo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === 'ArrowRight') {
        selectPage(Math.min(pages.length - 1, currentPageIndex + 1));
      } else if (e.key === 'ArrowLeft') {
        selectPage(Math.max(0, currentPageIndex - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPageIndex, pages.length, selectPage, undo, redo]);

  // Auto-dismiss status toast after 4.5s
  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(null), 4500);
    return () => clearTimeout(t);
  }, [statusMessage, setStatusMessage]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f4f3ef]">
      <TopBar
        onOpenMobileSteps={() => setMobileDrawer('steps')}
        onOpenMobileInspector={() => setMobileDrawer('inspector')}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:flex h-full">
          <StepTreeSidebar />
        </div>

        {/* Center Live Manual Page Spread + Bottom Thumbnail Rail */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <PageCanvas />
          <PageThumbnailRail />
        </main>

        {/* Desktop Right 3-Tier Customization Inspector */}
        <div className="hidden lg:flex h-full">
          <InspectorPanel />
        </div>

        {/* Mobile / Tablet Slide-over Drawers */}
        {mobileDrawer !== 'none' && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileDrawer('none')}
            />
            <div
              className={`relative z-50 h-full w-[88vw] max-w-sm bg-white shadow-2xl flex flex-col ${
                mobileDrawer === 'inspector' ? 'ml-auto' : ''
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#eceae4] bg-[#f9f8f5]">
                <span className="font-display text-xs font-bold uppercase tracking-wider">
                  {mobileDrawer === 'steps' ? 'Build Sequence' : 'Customize Manual'}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawer('none')}
                  className="p-1.5 rounded-lg hover:bg-[#eceae4] cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {mobileDrawer === 'steps' ? <StepTreeSidebar /> : <InspectorPanel />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Dialog when uploaded .io/.mpd has existing steps or submodels */}
      <ImportDialog />

      {/* Subtle Status Toast */}
      {statusMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#17191c] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
          <span className="truncate">{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-white/70 hover:text-white ml-1 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
