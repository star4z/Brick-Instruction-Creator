import { jsPDF } from 'jspdf';
import { getPageDimensions } from '../data/themePresets';
import { buildStepPliEntries, getStepRenderPartSets } from '../engine/layoutEngine';
import { technicalRenderer } from '../renderer/technicalRenderer';
import type {
  BackConfig,
  BomConfig,
  CanonicalModel,
  CoverConfig,
  InstructionPlan,
  PagePlan,
  PartInstance,
  StepOverride,
  ThemeSettings,
} from '../types/manual';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function drawPageBackground(doc: jsPDF, widthMm: number, heightMm: number, theme: ThemeSettings) {
  const [r, g, b] = hexToRgb(theme.backgroundColor);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, widthMm, heightMm, 'F');

  if (theme.backgroundMode === 'blueprint-grid') {
    doc.setDrawColor(116, 211, 255);
    doc.setLineWidth(0.12);
    for (let x = 10; x < widthMm; x += 10) doc.line(x, 0, x, heightMm);
    for (let y = 10; y < heightMm; y += 10) doc.line(0, y, widthMm, y);
  }
}

export async function exportManualToPdf(
  model: CanonicalModel,
  plan: InstructionPlan,
  pages: PagePlan[],
  overrides: Record<string, StepOverride>,
  theme: ThemeSettings,
  cover: CoverConfig,
  back: BackConfig,
  bom: BomConfig,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const { widthMm, heightMm } = getPageDimensions(theme.pageSize, theme.orientation);
  const doc = new jsPDF({
    orientation: theme.orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const partsById: Record<string, PartInstance> = Object.fromEntries(
    model.parts.map((p) => [p.id, p]),
  );

  const textRgb = hexToRgb(theme.textColor);
  const mutedRgb = hexToRgb(theme.mutedTextColor);
  const accentRgb = hexToRgb(theme.accentColor);
  const pliBgRgb = hexToRgb(theme.pliBackground);
  const pliBorderRgb = hexToRgb(theme.pliBorderColor);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) doc.addPage([widthMm, heightMm], theme.orientation);
    onProgress?.(i + 1, pages.length);

    drawPageBackground(doc, widthMm, heightMm, theme);

    if (page.kind === 'cover') {
      // Hero 3D render
      const heroUrl = technicalRenderer.renderStepDataUrl(
        `pdf_cover_${model.id}_${cover.heroView}_${theme.presetId}`,
        {
          previousParts: [],
          newParts: model.parts,
          viewId: cover.heroView,
          theme: { ...theme, highlightNewParts: false, fadePreviousParts: false, showPlacementArrows: false },
          width: 900,
          height: 620,
        },
      );
      if (heroUrl) {
        doc.addImage(heroUrl, 'PNG', widthMm * 0.14, heightMm * 0.24, widthMm * 0.72, heightMm * 0.56);
      }
      doc.setTextColor(...accentRgb);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${cover.setNumber}  •  BUILDING INSTRUCTIONS`, 16, 18);

      doc.setTextColor(...textRgb);
      doc.setFontSize(28);
      doc.text(cover.title || model.name, 16, 30);

      doc.setTextColor(...mutedRgb);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(cover.subtitle || `Designed by ${cover.author}`, 16, 38);

      // Metadata badge bottom left
      const totalSteps = Object.keys(plan.steps).length;
      const statsText = [
        cover.showPieceCount ? `${model.parts.length} PIECES` : null,
        cover.showStepCount ? `${totalSteps} STEPS` : null,
        cover.author ? `BY ${cover.author.toUpperCase()}` : null,
      ]
        .filter(Boolean)
        .join('   |   ');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...textRgb);
      doc.text(statsText, 16, heightMm - 12);
      continue;
    }

    if (page.kind === 'back') {
      doc.setTextColor(...textRgb);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(back.headline || 'Build Complete!', widthMm / 2, 28, { align: 'center' });

      if (back.showCompletionRender) {
        const heroUrl = technicalRenderer.renderStepDataUrl(
          `pdf_back_${model.id}_${theme.presetId}`,
          {
            previousParts: [],
            newParts: model.parts,
            viewId: 'top_front_left',
            theme: { ...theme, highlightNewParts: false, fadePreviousParts: false, showPlacementArrows: false },
            width: 800,
            height: 520,
          },
        );
        if (heroUrl) {
          doc.addImage(heroUrl, 'PNG', widthMm * 0.2, 36, widthMm * 0.6, heightMm * 0.52);
        }
      }

      doc.setTextColor(...mutedRgb);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(back.footerNote || 'Created with Brick Instruction Works', widthMm / 2, heightMm - 16, {
        align: 'center',
      });
      continue;
    }

    if (page.kind === 'bom' && page.bomEntries) {
      doc.setTextColor(...textRgb);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(
        `${bom.title || 'Parts Inventory'} (${page.bomPageIndex}/${page.bomTotalPages})`,
        14,
        18,
      );

      const cols = Math.min(6, Math.max(4, bom.columns));
      const padX = 14;
      const topY = 25;
      const cellW = (widthMm - padX * 2) / cols;
      const cellH = 34;

      page.bomEntries.forEach((entry, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = padX + col * cellW;
        const y = topY + row * cellH;
        if (y + cellH > heightMm - 14) return;

        doc.setFillColor(...pliBgRgb);
        doc.setDrawColor(...pliBorderRgb);
        doc.roundedRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3, 2, 2, 'FD');

        const thumb = technicalRenderer.renderPliThumbnail(entry.partId, entry.colorId, theme);
        if (thumb) {
          doc.addImage(thumb, 'PNG', x + 4, y + 4, 18, 18);
        }
        doc.setTextColor(...textRgb);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${entry.quantity}×`, x + cellW - 5, y + 13, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mutedRgb);
        doc.text(entry.partId.toUpperCase(), x + 4, y + cellH - 5);
      });
    }

    if (page.kind === 'steps' && page.slots) {
      const slots = page.slots;
      const cols = slots.length === 1 ? 1 : 2;
      const rows = slots.length <= 2 ? 1 : 2;
      const margin = 10;
      const slotW = (widthMm - margin * 2) / cols;
      const slotH = (heightMm - margin * 2 - 8) / rows;

      slots.forEach((slot, sIdx) => {
        const step = plan.steps[slot.stepId];
        if (!step) return;
        const ov = overrides[step.id];

        const c = sIdx % cols;
        const r = Math.floor(sIdx / cols);
        const sx = margin + c * slotW;
        const sy = margin + r * slotH;

        // Subtle divider between multi-step slots
        if (slots.length > 1) {
          doc.setDrawColor(...pliBorderRgb);
          doc.setLineWidth(0.25);
          doc.roundedRect(sx + 1, sy + 1, slotW - 2, slotH - 2, 2, 2, 'S');
        }

        // Step Number
        doc.setTextColor(...textRgb);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.round(22 * theme.stepNumberScale));
        doc.text(`${step.stepNumber}`, sx + 5, sy + 13);

        // Rotation cue text pill
        if (theme.showRotationIndicators && step.rotationCue !== 'none') {
          doc.setFillColor(...accentRgb);
          doc.roundedRect(sx + slotW - 28, sy + 4, 24, 7, 1.5, 1.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7.5);
          const cueLabel =
            step.rotationCue === 'flip_vertical'
              ? 'FLIP 180°'
              : step.rotationCue === 'yaw_180'
                ? 'TURN 180°'
                : 'ROTATE 90°';
          doc.text(cueLabel, sx + slotW - 16, sy + 8.8, { align: 'center' });
        }

        // PLI box
        const pliEntries = buildStepPliEntries(step, partsById);
        if (pliEntries.length > 0) {
          const pliW = Math.min(slotW * 0.42, Math.max(24, pliEntries.length * 16 + 6));
          const pliH = 22;
          doc.setFillColor(...pliBgRgb);
          doc.setDrawColor(...pliBorderRgb);
          doc.roundedRect(sx + 18, sy + 3, pliW, pliH, 2, 2, 'FD');

          pliEntries.slice(0, 4).forEach((e, pIdx) => {
            const thumb = technicalRenderer.renderPliThumbnail(e.partId, e.colorId, theme);
            const px = sx + 20 + pIdx * 15;
            if (thumb) doc.addImage(thumb, 'PNG', px, sy + 4.5, 12, 12);
            doc.setTextColor(...textRgb);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(`${e.quantity}×`, px + 6, sy + 21.5, { align: 'center' });
          });
        }

        // Main 3D Step Render
        const { previousPartIds, newPartIds } = getStepRenderPartSets(plan, slot.chapterId, step.id);
        const stepImg = technicalRenderer.renderStepDataUrl(
          `pdf_step_${step.id}_${ov?.cameraViewOverride ?? step.cameraView}_${theme.presetId}_${theme.highlightNewParts}_${theme.fadePreviousParts}`,
          {
            previousParts: previousPartIds.map((id) => partsById[id]).filter(Boolean),
            newParts: newPartIds.map((id) => partsById[id]).filter(Boolean),
            viewId: ov?.cameraViewOverride ?? step.cameraView,
            customAzimuthDeg: ov?.customAzimuthDeg,
            customElevationDeg: ov?.customElevationDeg,
            zoomScale: ov?.zoomScale,
            theme,
            transforms: ov?.presentationTransforms,
            insertionDirection: step.insertionDirection,
            width: 720,
            height: 480,
          },
        );
        if (stepImg) {
          const imgTop = sy + 26;
          const imgH = slotH - 30;
          const imgW = slotW - 10;
          doc.addImage(stepImg, 'PNG', sx + 5, imgTop, imgW, imgH);
        }
      });
    }

    // Page number footer
    if (theme.showPageNumbers) {
      doc.setTextColor(...mutedRgb);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${page.pageNumber}`, widthMm - 10, heightMm - 6, { align: 'right' });
      if (page.chapterName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(page.chapterName, 10, heightMm - 6);
      }
    }
  }

  const slug = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'instructions';
  doc.save(`${slug}-instructions.pdf`);
}
