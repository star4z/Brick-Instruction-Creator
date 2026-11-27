import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';

function thirdpartyPartsChunksPlugin(): Plugin {
  const srcDir = path.resolve(process.cwd(), 'thirdparty/parts-chunks');
  const distDir = path.resolve(process.cwd(), 'dist/parts-chunks');
  const attachMiddleware = (middlewares: {
    use: (
      fn: (
        req: { url?: string; headers?: Record<string, string | string[] | undefined> },
        res: {
          setHeader: (k: string, v: string | number) => void;
          statusCode: number;
          end: (msg?: string) => void;
          headersSent?: boolean;
        },
        next: () => void,
      ) => void,
    ) => void;
  }) => {
    middlewares.use((req, res, next) => {
      const urlPath = (req.url || '').split('?')[0];
      if (!urlPath.startsWith('/parts-chunks/')) return next();
      const rel = path.basename(urlPath.slice('/parts-chunks/'.length));
      const filePath = path.join(srcDir, rel);
      if (!rel || !fs.existsSync(filePath)) return next();
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return next();
      const isJson = rel.endsWith('.json');
      res.setHeader('Content-Type', isJson ? 'application/json; charset=utf-8' : 'application/octet-stream');
      res.setHeader('Cache-Control', isJson ? 'no-cache' : 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');

      const rangeHeader = req.headers?.range;
      const rangeStr = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;
      let stream: fs.ReadStream;
      if (rangeStr && /^bytes=\d*-\d*$/i.test(rangeStr.trim())) {
        const [startStr, endStr] = rangeStr.trim().slice(6).split('-');
        const start = startStr ? Number.parseInt(startStr, 10) : 0;
        const end = endStr ? Math.min(Number.parseInt(endStr, 10), stat.size - 1) : stat.size - 1;
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= stat.size) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${stat.size}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Content-Length', end - start + 1);
        stream = fs.createReadStream(filePath, { start, end });
      } else {
        res.setHeader('Content-Length', stat.size);
        stream = fs.createReadStream(filePath);
      }

      stream.on('error', () => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error reading part chunk');
        }
      });
      stream.pipe(res as unknown as NodeJS.WritableStream);
    });
  };
  return {
    name: 'thirdparty-parts-chunks',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
    closeBundle() {
      if (!fs.existsSync(path.join(srcDir, 'manifest.json'))) return;
      fs.rmSync(distDir, { recursive: true, force: true });
      fs.cpSync(srcDir, distDir, { recursive: true });
    },
  };
}

export default defineConfig({
  // Relative paths so static builds deploy cleanly at root or subpath (e.g. Neocities)
  base: './',
  plugins: [tailwindcss(), thirdpartyPartsChunksPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Keep individual chunks well below Neocities file size limits
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/jszip') || id.includes('node_modules/@zip.js') || id.includes('node_modules/idb')) {
            return 'vendor-storage';
          }
          return undefined;
        },
      },
    },
  },
});
