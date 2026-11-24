import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

describe('studioRuntime safety checks', () => {
  it('has no undeclared identifiers (prevents ReferenceErrors hidden by @ts-nocheck)', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8').replace(/^\/\/ @ts-nocheck/, '');

    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      types: [],
      skipLibCheck: true,
      noEmit: true,
    };

    const host = ts.createCompilerHost(compilerOptions);
    const origGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (path.resolve(fileName) === runtimePath) {
        return ts.createSourceFile(fileName, sourceText, languageVersion);
      }
      return origGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };

    const program = ts.createProgram([runtimePath], compilerOptions, host);
    const sf = program.getSourceFile(runtimePath);
    expect(sf).toBeDefined();

    // TS2304: Cannot find name 'X'.
    // TS2552: Cannot find name 'X'. Did you mean 'Y'?
    const undeclared = program
      .getSemanticDiagnostics(sf!)
      .filter((d) => d.code === 2304 || d.code === 2552)
      .map((d) => {
        const pos = d.file!.getLineAndCharacterOfPosition(d.start!);
        const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
        return `L${pos.line + 1}:${pos.character + 1} TS${d.code}: ${msg}`;
      });

    expect(undeclared).toEqual([]);
  }, 30_000);

  it('implements procedural geometry for every shape declared in PARTS_CATALOG', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const catalogMatch = sourceText.match(/const PARTS_CATALOG = \{([\s\S]*?)\n\};/);
    expect(catalogMatch).not.toBeNull();
    const declaredShapes = new Set<string>();
    for (const m of catalogMatch![1].matchAll(/shape:\s*'([^']+)'/g)) {
      declaredShapes.add(m[1]);
    }
    expect(declaredShapes.size).toBeGreaterThanOrEqual(20);

    const emitStart = sourceText.indexOf('const emitSingleLeaf =');
    const emitEnd = sourceText.indexOf('const emitPart =', emitStart);
    expect(emitStart).toBeGreaterThan(-1);
    expect(emitEnd).toBeGreaterThan(emitStart);
    const emitBody = sourceText.slice(emitStart, emitEnd);

    const unhandled = Array.from(declaredShapes).filter(
      (shape) => !emitBody.includes(`def.shape === '${shape}'`),
    );
    expect(unhandled).toEqual([]);
  });

  it('renders Bricks Library previews with heroQuality, heroShading, and tightFit', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const fnStart = sourceText.indexOf('function renderPartPreviewDataUrl(');
    const fnEnd = sourceText.indexOf('function stopLibThumbQueue(', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = sourceText.slice(fnStart, fnEnd);

    expect(fnBody).toContain('heroQuality: true');
    expect(fnBody).toContain('heroShading: true');
    expect(fnBody).toContain('tightFit: true');
  });
});
