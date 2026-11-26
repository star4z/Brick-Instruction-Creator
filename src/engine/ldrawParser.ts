import { BlobReader, TextWriter, ZipReader, type Entry, type FileEntry } from '@zip.js/zip.js';
import { normalizePartId, resolvePartDefinition } from '../data/partCatalog';
import type {
  CanonicalModel,
  ExplicitSubmodel,
  Mat3,
  PartInstance,
  SourceFormat,
  Vec3,
} from '../types/manual';
import {
  IDENTITY_MAT3,
  ldrawMatToYUp,
  ldrawPosToYUp,
  mat3Mul,
  mat3MulVec,
  quantize,
  vec3Add,
} from './math';
import { applyStudioOriginOffset, getStudioOriginOffset, isStudioAuthoredSource } from './studioPartOrigins';
import { BRICKLINK_TO_LDRAW_COLOR, convertStudioDatLinesToLDraw } from '../data/bricklinkColors';

interface ParsedSubfile {
  name: string;
  key: string;
  lines: string[];
  stepCount: number;
  hasGeometryPrimitives: boolean;
}

export function buildPartSignature(
  partId: string,
  colorId: number,
  pos: Vec3,
  rot: Mat3,
): string {
  const p = pos.map((v) => quantize(v, 1)).join(',');
  const r = rot.map((v) => Math.round(v * 100)).join(',');
  return `${partId}#${colorId}@${p}|${r}`;
}

function splitMpdSubfiles(source: string, rootName: string): Map<string, ParsedSubfile> {
  const subfiles = new Map<string, ParsedSubfile>();
  const cleaned = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = cleaned.split('\n');

  let currentName = rootName;
  let currentKey = rootName.toLowerCase();
  let currentLines: string[] = [];
  let currentSteps = 0;
  let currentHasGeom = false;
  let sawFileHeader = false;

  const flush = () => {
    if (currentLines.length === 0 && subfiles.size > 0) return;
    subfiles.set(currentKey, {
      name: currentName,
      key: currentKey,
      lines: currentLines,
      stepCount: currentSteps,
      hasGeometryPrimitives: currentHasGeom,
    });
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const fileMatch = line.match(/^0\s+FILE\s+(.+)$/i);
    if (fileMatch) {
      if (sawFileHeader || currentLines.length > 0) {
        flush();
      }
      sawFileHeader = true;
      currentName = fileMatch[1].trim();
      currentKey = currentName.toLowerCase();
      currentLines = [];
      currentSteps = 0;
      currentHasGeom = false;
      continue;
    }

    if (/^0\s+NOFILE\b/i.test(line)) {
      flush();
      currentName = rootName;
      currentKey = rootName.toLowerCase();
      currentLines = [];
      currentSteps = 0;
      currentHasGeom = false;
      continue;
    }

    if (/^0\s+STEP\b/i.test(line)) {
      currentSteps += 1;
    }
    if (/^[2345]\s+/.test(line)) {
      currentHasGeom = true;
    }
    currentLines.push(line);
  }

  if (currentLines.length > 0 || subfiles.size === 0) {
    flush();
  }

  return subfiles;
}

let modelIdSeq = 0;

function parseLDrawColorTokenLocal(tok: string): number {
  if (/^0x2[0-9a-f]{6}$/i.test(tok)) {
    return parseInt(tok, 16);
  }
  return parseInt(tok, 10);
}

export function parseLDrawSource(
  source: string,
  fileName = 'model.ldr',
  sourceFormat: SourceFormat = 'ldr',
  extraEmbeddedFiles: Record<string, string> = {},
  useStudioColorMap = false,
): CanonicalModel {
  const cleanRoot = fileName.trim() || 'model.ldr';
  const subfiles = splitMpdSubfiles(source, cleanRoot);
  const firstEntry = subfiles.values().next().value as ParsedSubfile | undefined;

  let modelTitle = cleanRoot.replace(/\.(io|ldr|mpd)$/i, '');
  let author = 'Builder';

  if (firstEntry) {
    for (const line of firstEntry.lines.slice(0, 12)) {
      const authorMatch = line.match(/^0\s+Author:\s*(.+)$/i);
      if (authorMatch) author = authorMatch[1].trim();
      const nameMatch = line.match(/^0\s+Name:\s*(.+)$/i);
      if (nameMatch) {
        const clean = nameMatch[1].trim().replace(/\.(ldr|mpd|dat)$/i, '');
        if (clean && !/^modelv?\d*$/i.test(clean)) modelTitle = clean;
      }
    }
    const firstComment = firstEntry.lines[0]?.match(
      /^0\s+(?![!/])(?!Name:|Author:|FILE|STEP|BFC|ROTSTEP)(.+)$/i,
    );
    if (firstComment && firstComment[1].trim().length > 2 && !/^modelv?\d*$/i.test(firstComment[1].trim())) {
      modelTitle = firstComment[1].trim();
    }
  }

  const embeddedLDrawFiles: Record<string, string> = { ...extraEmbeddedFiles };
  for (const sf of subfiles.values()) {
    if (sf.hasGeometryPrimitives) {
      embeddedLDrawFiles[normalizePartId(sf.name)] = sf.lines.join('\n');
    }
  }

  // Studio exports place a few parts with Studio-library origins that differ from LDraw's
  const studioAuthored = sourceFormat === 'io' || isStudioAuthoredSource(source);

  const parts: PartInstance[] = [];
  const submodelPartMap = new Map<string, { partIds: string[]; hasSteps: boolean }>();
  let totalStepsDetected = 0;
  let partCounter = 0;

  const mapColor = (rawColor: number, parentColor: number): number => {
    if (rawColor === 16 || rawColor === -1 || rawColor === -2) return parentColor;
    if (!Number.isFinite(rawColor)) return 71;
    if (useStudioColorMap && BRICKLINK_TO_LDRAW_COLOR[rawColor] !== undefined) {
      return BRICKLINK_TO_LDRAW_COLOR[rawColor];
    }
    return rawColor;
  };

  const visitSubfile = (
    sf: ParsedSubfile,
    parentPos: Vec3,
    parentRot: Mat3,
    parentColor: number,
    pathStack: string[],
    ancestorKeys: Set<string>,
    depth: number,
  ) => {
    if (depth > 16) return;
    let localStep = 0;
    if (sf.stepCount > 0) totalStepsDetected += sf.stepCount;

    for (const line of sf.lines) {
      if (/^0\s+STEP\b/i.test(line)) {
        localStep += 1;
        continue;
      }
      // Support both standard LDraw type-1 lines and Studio modelv2.ldr type-11 part lines
      if (!line.startsWith('1 ') && !line.startsWith('11 ')) continue;

      const mLine = line.match(/^(?:1|11)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);
      if (!mLine) continue;

      const rawColor = parseLDrawColorTokenLocal(mLine[1]);
      const colorId = mapColor(rawColor, parentColor);
      const x = parseFloat(mLine[2]);
      const y = parseFloat(mLine[3]);
      const z = parseFloat(mLine[4]);
      const m: Mat3 = [
        parseFloat(mLine[5]), parseFloat(mLine[6]), parseFloat(mLine[7]),
        parseFloat(mLine[8]), parseFloat(mLine[9]), parseFloat(mLine[10]),
        parseFloat(mLine[11]), parseFloat(mLine[12]), parseFloat(mLine[13]),
      ];
      const refName = mLine[14].trim();
      const refKey = refName.toLowerCase();

      if ([x, y, z, ...m].some((n) => !Number.isFinite(n))) continue;

      const worldLdrPos = vec3Add(parentPos, mat3MulVec(parentRot, [x, y, z]));
      const worldLdrRot = mat3Mul(parentRot, m);

      const nested = subfiles.get(refKey);
      if (nested && !nested.hasGeometryPrimitives && !ancestorKeys.has(nested.key)) {
        const nextPath = [...pathStack, nested.name];
        const nextAncestors = new Set(ancestorKeys);
        nextAncestors.add(nested.key);
        visitSubfile(nested, worldLdrPos, worldLdrRot, colorId, nextPath, nextAncestors, depth + 1);
      } else {
        const partId = normalizePartId(refName);
        const def = resolvePartDefinition(partId);
        const studioOffset =
          studioAuthored && !embeddedLDrawFiles[partId] ? getStudioOriginOffset(partId) : null;
        const placedLdrPos = studioOffset
          ? applyStudioOriginOffset(worldLdrPos, worldLdrRot, studioOffset)
          : worldLdrPos;
        const yUpPos = ldrawPosToYUp(placedLdrPos);
        const yUpRot = ldrawMatToYUp(worldLdrRot);
        const id = `part_${++partCounter}`;
        const signature = buildPartSignature(partId, colorId, yUpPos, yUpRot);

        parts.push({
          id,
          signature,
          partId,
          partName: def.name,
          colorId,
          position: yUpPos,
          rotation: yUpRot,
          submodelPath: pathStack,
          originalStepIndex: localStep,
        });

        if (pathStack.length > 0) {
          const topSub = pathStack[pathStack.length - 1];
          const entry = submodelPartMap.get(topSub) ?? {
            partIds: [],
            hasSteps: (subfiles.get(topSub.toLowerCase())?.stepCount ?? 0) > 0,
          };
          entry.partIds.push(id);
          submodelPartMap.set(topSub, entry);
        }
      }
    }
  };

  if (firstEntry) {
    visitSubfile(firstEntry, [0, 0, 0], IDENTITY_MAT3, 71, [], new Set([firstEntry.key]), 0);
  }

  const explicitSubmodels: ExplicitSubmodel[] = Array.from(submodelPartMap.entries()).map(
    ([name, info]) => ({
      name,
      partIds: info.partIds,
      hasSteps: info.hasSteps,
    }),
  );

  return {
    id: `model_${Date.now().toString(36)}_${++modelIdSeq}`,
    name: modelTitle,
    author,
    sourceFormat,
    parts,
    explicitSubmodels,
    embeddedLDrawFiles,
    hasExistingSteps: totalStepsDetected > 0,
    hasExistingSubmodels: explicitSubmodels.length > 0,
    importTimestamp: Date.now(),
  };
}

/**
 * Parses either a BrickLink Studio (.io ZIP) file or an LDraw (.ldr / .mpd) file.
 * Supports plain ZIP .io files (Studio 2.x) including model.ldr, modelv2.ldr (type-11), and model2.ldr.
 */
export async function parseModelFile(file: File): Promise<CanonicalModel> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.io')) {
    const reader = new ZipReader(new BlobReader(file), { useWebWorkers: false });
    try {
      const entries = await reader.getEntries();
      const fileEntries = entries.filter(
        (e: Entry): e is FileEntry => !e.directory,
      );

      // Prefer model.ldr (standard LDraw colors), then modelv2.ldr, then model2.ldr
      const findEntry = (target: string) =>
        fileEntries.find((e) => e.filename.toLowerCase().split('/').pop() === target);

      const primary =
        findEntry('model.ldr') ??
        findEntry('modelv2.ldr') ??
        findEntry('model2.ldr') ??
        fileEntries.find(
          (e) =>
            e.filename.toLowerCase().endsWith('.ldr') ||
            e.filename.toLowerCase().endsWith('.mpd'),
        );

      if (!primary) {
        throw new Error('Could not locate model.ldr or modelv2.ldr inside this .io file.');
      }

      if (primary.encrypted) {
        throw new Error(
          'This .io file uses legacy Studio encryption. In BrickLink Studio, choose File → Export As → LDraw (.ldr) or re-save in Studio 2.x.',
        );
      }

      const sourceText = await primary.getData(new TextWriter());
      const embedded: Record<string, string> = {};

      // Extract all embedded .dat part & primitive meshes from model2.ldr (Studio embeds full 3D geometry here!)
      const model2Entry = findEntry('model2.ldr');
      if (model2Entry && !model2Entry.encrypted) {
        try {
          const m2Text =
            model2Entry === primary ? sourceText : await model2Entry.getData(new TextWriter());
          const m2Subfiles = splitMpdSubfiles(m2Text, 'model2.ldr');
          for (const sf of m2Subfiles.values()) {
            const isPartDef =
              sf.name.toLowerCase().endsWith('.dat') ||
              sf.hasGeometryPrimitives ||
              sf.lines.some((l) => /^0\s+IsSubModel\s+False/i.test(l));
            if (isPartDef) {
              embedded[normalizePartId(sf.name)] = convertStudioDatLinesToLDraw(sf.lines).join('\n');
            }
          }
        } catch {
          // Non-fatal if model2.ldr cannot be read
        }
      }

      for (const entry of fileEntries) {
        if (entry.filename.toLowerCase().endsWith('.dat') && !entry.encrypted) {
          try {
            const content = await entry.getData(new TextWriter());
            embedded[normalizePartId(entry.filename)] = convertStudioDatLinesToLDraw(content.split(/\r?\n/)).join('\n');
          } catch {
            // Skip unreadable custom part entry
          }
        }
      }

      const baseName = primary.filename.toLowerCase().split('/').pop() ?? '';
      const usesStudioColors = baseName === 'model2.ldr';
      const model = parseLDrawSource(sourceText, file.name, 'io', embedded, usesStudioColors);
      if (/^modelv?\d*$/i.test(model.name)) {
        model.name = file.name.replace(/\.io$/i, '');
      }
      return model;
    } finally {
      await reader.close();
    }
  }

  const text = await file.text();
  const format: SourceFormat = lower.endsWith('.mpd') ? 'mpd' : 'ldr';
  return parseLDrawSource(text, file.name, format);
}
