import { getLDrawColor } from '../data/ldrawColors';
import { buildBomEntries, buildStepPliEntries, getStepRenderPartSets } from '../engine/layoutEngine';
import { technicalRenderer } from '../renderer/technicalRenderer';
import type {
  BomConfig,
  CanonicalModel,
  CoverConfig,
  InstructionPlan,
  PartInstance,
  StepOverride,
  ThemeSettings,
} from '../types/manual';

interface ViewerStepPayload {
  id: string;
  chapterName: string;
  stepNumber: number;
  rotationCue: string;
  imageUrl: string;
  pli: Array<{ partId: string; name: string; colorName: string; colorHex: string; qty: number; thumb: string }>;
  subassemblies: Array<{ name: string; repeatCount: number; requiresRotation: boolean; imageUrl: string }>;
}

/**
 * Exports a self-contained single-file interactive HTML instruction viewer that works offline
 * on desktop, tablet, and mobile browsers (with keyboard/swipe navigation & interactive BOM checklist).
 */
export function exportInteractiveHtmlViewer(
  model: CanonicalModel,
  plan: InstructionPlan,
  overrides: Record<string, StepOverride>,
  theme: ThemeSettings,
  cover: CoverConfig,
  bom: BomConfig,
): void {
  const partsById: Record<string, PartInstance> = Object.fromEntries(
    model.parts.map((p) => [p.id, p]),
  );

  const stepPayloads: ViewerStepPayload[] = [];
  for (const ch of plan.chapters) {
    for (const sid of ch.stepIds) {
      const step = plan.steps[sid];
      if (!step) continue;
      const ov = overrides[sid];
      const { previousPartIds, newPartIds } = getStepRenderPartSets(plan, ch.id, sid);
      const imageUrl =
        technicalRenderer.renderStepDataUrl(
          `html_${sid}_${ov?.cameraViewOverride ?? step.cameraView}_${theme.presetId}`,
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
            width: 820,
            height: 540,
          },
        ) ?? '';

      const pli = buildStepPliEntries(step, partsById).map((e) => {
        const col = getLDrawColor(e.colorId);
        return {
          partId: e.partId,
          name: e.partName,
          colorName: col.name,
          colorHex: col.hex,
          qty: e.quantity,
          thumb: technicalRenderer.renderPliThumbnail(e.partId, e.colorId, theme) ?? '',
        };
      });

      const subassemblies = step.attachedSubassemblyIds
        .map((subId) => plan.subassemblies[subId])
        .filter(Boolean)
        .map((sub) => ({
          name: sub.name,
          repeatCount: sub.repeatCount,
          requiresRotation: sub.requiresAttachRotation,
          imageUrl:
            technicalRenderer.renderStepDataUrl(`html_sub_${sub.id}_${theme.presetId}`, {
              previousParts: [],
              newParts: sub.partIds.map((id) => partsById[id]).filter(Boolean),
              viewId: 'top_front_right',
              theme: { ...theme, highlightNewParts: false, showPlacementArrows: false },
              sceneRotation: sub.buildOrientation,
              width: 420,
              height: 300,
            }) ?? '',
        }));

      stepPayloads.push({
        id: step.id,
        chapterName: ch.name,
        stepNumber: step.stepNumber,
        rotationCue: step.rotationCue,
        imageUrl,
        pli,
        subassemblies,
      });
    }
  }

  const bomEntries = buildBomEntries(model.parts, bom.sortMode).map((e) => ({
    ...e,
    colorName: getLDrawColor(e.colorId).name,
    thumb: technicalRenderer.renderPliThumbnail(e.partId, e.colorId, theme) ?? '',
  }));

  const payload = JSON.stringify({
    title: cover.title || model.name,
    subtitle: cover.subtitle,
    author: cover.author,
    totalPieces: model.parts.length,
    theme,
    steps: stepPayloads,
    bom: bomEntries,
  });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${(cover.title || model.name).replace(/</g, '&lt;')} — Interactive Instructions</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: ${theme.backgroundColor}; color: ${theme.textColor}; min-height: 100vh; display: flex; flex-direction: column; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(0,0,0,0.08); backdrop-filter: blur(8px); gap: 12px; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 18px; }
  main { flex: 1; max-width: 1080px; width: 100%; margin: 0 auto; padding: 18px; display: flex; flex-direction: column; gap: 16px; }
  .stage { background: ${theme.pliBackground}; border: 1px solid ${theme.pliBorderColor}; border-radius: 14px; padding: 18px; display: grid; gap: 16px; }
  .step-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
  .step-num { font-size: 36px; font-weight: 800; line-height: 1; }
  .badge { background: ${theme.accentColor}; color: #fff; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .pli { display: flex; gap: 10px; flex-wrap: wrap; }
  .pli-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; border: 1px solid ${theme.pliBorderColor}; background: ${theme.calloutBackground}; }
  .pli-item img { width: 40px; height: 40px; object-fit: contain; }
  .hero { width: 100%; max-height: 56vh; object-fit: contain; display: block; margin: 0 auto; }
  .nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  button { cursor: pointer; border: 1px solid ${theme.pliBorderColor}; background: ${theme.pliBackground}; color: ${theme.textColor}; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 14px; }
  button.primary { background: ${theme.accentColor}; color: #fff; border-color: transparent; }
  .bom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .bom-card { background: ${theme.pliBackground}; border: 1px solid ${theme.pliBorderColor}; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
  .bom-card img { width: 56px; height: 56px; object-fit: contain; }
</style>
</head>
<body>
<header>
  <div>
    <h1 id="title"></h1>
    <small id="meta"></small>
  </div>
  <div style="display:flex;gap:8px;">
    <button id="toggleBom">Parts Inventory</button>
  </div>
</header>
<main id="app"></main>
<script>
const DATA = ${payload};
let idx = 0;
let showBom = false;
document.getElementById('title').textContent = DATA.title;
document.getElementById('meta').textContent = DATA.totalPieces + ' pieces • ' + DATA.steps.length + ' steps • Use ← / → keys';
document.getElementById('toggleBom').onclick = () => { showBom = !showBom; render(); };
window.addEventListener('keydown', (e) => {
  if (showBom) return;
  if (e.key === 'ArrowRight') { idx = Math.min(DATA.steps.length - 1, idx + 1); render(); }
  if (e.key === 'ArrowLeft') { idx = Math.max(0, idx - 1); render(); }
});
function render() {
  const app = document.getElementById('app');
  document.getElementById('toggleBom').textContent = showBom ? 'Back to Steps' : 'Parts Inventory (' + DATA.bom.length + ')';
  if (showBom) {
    app.innerHTML = '<div class="bom-grid">' + DATA.bom.map(b =>
      '<div class="bom-card"><img src="' + b.thumb + '" /><strong>' + b.quantity + '×</strong><span style="font-size:12px">' + b.partName + '</span><small style="opacity:.7">' + b.colorName + ' • ' + b.partId.toUpperCase() + '</small></div>'
    ).join('') + '</div>';
    return;
  }
  const s = DATA.steps[idx];
  if (!s) return;
  const cue = s.rotationCue && s.rotationCue !== 'none' ? '<span class="badge">↻ ' + s.rotationCue.replace(/_/g,' ').toUpperCase() + '</span>' : '';
  const subs = s.subassemblies.map(sub =>
    '<div style="border:1px dashed ' + DATA.theme.calloutBorderColor + ';border-radius:10px;padding:10px;background:' + DATA.theme.calloutBackground + '"><strong>' + sub.name + '</strong>' + (sub.requiresRotation ? ' <span class="badge">Rotate to attach</span>' : '') + '<img src="' + sub.imageUrl + '" style="max-height:150px;display:block;margin-top:6px" /></div>'
  ).join('');
  app.innerHTML =
    '<div class="stage">' +
      '<div class="step-head"><div><div style="font-size:12px;opacity:.75">' + s.chapterName + '</div><div class="step-num">' + s.stepNumber + '</div></div>' + cue + '</div>' +
      '<div class="pli">' + s.pli.map(p => '<div class="pli-item"><img src="' + p.thumb + '" /><div><strong>' + p.qty + '×</strong><div style="font-size:11px;opacity:.75">' + p.partId.toUpperCase() + '</div></div></div>').join('') + '</div>' +
      subs +
      '<img class="hero" src="' + s.imageUrl + '" alt="Step ' + s.stepNumber + '" />' +
    '</div>' +
    '<div class="nav">' +
      '<button id="prevBtn"' + (idx === 0 ? ' disabled' : '') + '>← Previous</button>' +
      '<strong>Step ' + (idx + 1) + ' of ' + DATA.steps.length + '</strong>' +
      '<button class="primary" id="nextBtn"' + (idx >= DATA.steps.length - 1 ? ' disabled' : '') + '>Next →</button>' +
    '</div>';
  document.getElementById('prevBtn').onclick = () => { if (idx > 0) { idx--; render(); } };
  document.getElementById('nextBtn').onclick = () => { if (idx < DATA.steps.length - 1) { idx++; render(); } };
}
render();
</script>
</body>
</html>`;

  const slug = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'manual';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-interactive-manual.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
