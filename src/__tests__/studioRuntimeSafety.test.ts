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
});
