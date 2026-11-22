import { useRef, useState } from 'react';
import {
  Blocks,
  Download,
  FileCode2,
  FolderOpen,
  GitCompareArrows,
  ListOrdered,
  Redo2,
  Save,
  SlidersHorizontal,
  Undo2,
  Upload,
} from 'lucide-react';
import { exportInteractiveHtmlViewer } from '../export/htmlExporter';
import { exportManualToPdf } from '../export/pdfExporter';
import { downloadProjectFile, parseProjectFile } from '../storage/projectStorage';
import { useManualStore } from '../store/useManualStore';
import type { PacingPreset } from '../types/manual';

interface Props {
  onOpenMobileSteps: () => void;
  onOpenMobileInspector: () => void;
}

export function TopBar({ onOpenMobileSteps, onOpenMobileInspector }: Props) {
  const model = useManualStore((s) => s.model);
  const plan = useManualStore((s) => s.plan);
  const pages = useManualStore((s) => s.pages);
  const overrides = useManualStore((s) => s.overrides);
  const theme = useManualStore((s) => s.theme);
  const cover = useManualStore((s) => s.cover);
  const back = useManualStore((s) => s.back);
  const bom = useManualStore((s) => s.bom);
  const undoStack = useManualStore((s) => s.undoStack);
  const redoStack = useManualStore((s) => s.redoStack);

  const uploadModelFile = useManualStore((s) => s.uploadModelFile);
  const reimportModelDiffFile = useManualStore((s) => s.reimportModelDiffFile);
  const setPacing = useManualStore((s) => s.setPacing);
  const undo = useManualStore((s) => s.undo);
  const redo = useManualStore((s) => s.redo);
  const getProjectSnapshot = useManualStore((s) => s.getProjectSnapshot);
  const loadProjectFile = useManualStore((s) => s.loadProjectFile);
  const setStatusMessage = useManualStore((s) => s.setStatusMessage);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const reimportInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setExportingPdf('0%');
    try {
      await exportManualToPdf(
        model,
        plan,
        pages,
        overrides,
        theme,
        cover,
        back,
        bom,
        (cur, tot) => setExportingPdf(`${Math.round((cur / tot) * 100)}%`),
      );
      setStatusMessage(`Exported ${pages.length}-page PDF manual.`);
    } catch (err) {
      setStatusMessage(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExportingPdf(null);
    }
  };

  const handleExportHtml = () => {
    exportInteractiveHtmlViewer(model, plan, overrides, theme, cover, bom);
    setStatusMessage('Exported interactive web viewer.');
  };

  const pacingItems: Array<{ id: PacingPreset; label: string }> = [
    { id: 'kids', label: 'Simple' },
    { id: 'standard', label: 'Standard' },
    { id: 'adult', label: 'Compact' },
  ];

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#dadce0] px-3 lg:px-5 flex items-center justify-between gap-3 z-20">
      {/* Brand + Import */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSteps}
          className="lg:hidden p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
          aria-label="Steps"
        >
          <ListOrdered className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
            <Blocks className="w-5 h-5" />
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-[#202124] truncate">
              Brick Instruction Creator
            </h1>
            <p className="text-[11px] text-[#5f6368] truncate">
              {model.name} · {model.parts.length} pieces · {Object.keys(plan.steps).length} steps
            </p>
          </div>
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept=".io,.ldr,.mpd,.txt,application/zip,application/octet-stream"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadModelFile(file);
            e.target.value = '';
          }}
        />
        <button
          id="upload-model-btn"
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e8f0fe] text-[#174ea6] text-xs font-semibold hover:bg-[#d2e3fc] transition cursor-pointer shrink-0"
          title="Import a BrickLink Studio (.io) or LDraw (.ldr, .mpd) model"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>

        <input
          ref={reimportInputRef}
          type="file"
          accept=".io,.ldr,.mpd"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void reimportModelDiffFile(file);
            e.target.value = '';
          }}
        />
        <button
          id="smart-reimport-btn"
          type="button"
          onClick={() => reimportInputRef.current?.click()}
          className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#dadce0] bg-white text-[#202124] text-xs font-medium hover:bg-[#f1f3f4] transition cursor-pointer shrink-0"
          title="Replace model geometry while keeping all your existing step edits and page breaks"
        >
          <GitCompareArrows className="w-4 h-4 text-[#1a73e8]" />
          <span>Update Model</span>
        </button>
      </div>

      {/* Center: Step Density Segmented Pill */}
      <div className="hidden md:flex items-center gap-0.5 bg-[#f1f3f4] rounded-full p-1">
        {pacingItems.map((item) => {
          const active = plan.pacing === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPacing(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                active
                  ? 'bg-white text-[#174ea6] shadow-xs'
                  : 'text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right: Undo/Redo, Save/Open, Exports */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={undo}
            className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-35 cursor-pointer disabled:cursor-default"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={redo}
            className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-35 cursor-pointer disabled:cursor-default"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={projectInputRef}
          type="file"
          accept=".json,.bic"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const proj = await parseProjectFile(file);
                loadProjectFile(proj);
                setStatusMessage(`Opened "${proj.model.name}".`);
              } catch (err) {
                setStatusMessage(err instanceof Error ? err.message : 'Invalid project file.');
              }
            }
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => projectInputRef.current?.click()}
          className="hidden md:inline-flex p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
          title="Open saved project"
          aria-label="Open project"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            downloadProjectFile(getProjectSnapshot());
            setStatusMessage('Project saved.');
          }}
          className="hidden md:inline-flex p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
          title="Save project file"
          aria-label="Save project"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          id="export-html-btn"
          type="button"
          onClick={handleExportHtml}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#dadce0] bg-white text-[#202124] text-xs font-medium hover:bg-[#f1f3f4] transition cursor-pointer"
          title="Export offline interactive web instructions"
        >
          <FileCode2 className="w-4 h-4 text-[#1a73e8]" />
          <span>Web Viewer</span>
        </button>

        <button
          id="export-pdf-btn"
          type="button"
          disabled={Boolean(exportingPdf)}
          onClick={handleExportPdf}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-semibold hover:bg-[#1557b0] shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>{exportingPdf ? `Exporting ${exportingPdf}` : 'Export PDF'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenMobileInspector}
          className="lg:hidden p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
          aria-label="Customize"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
