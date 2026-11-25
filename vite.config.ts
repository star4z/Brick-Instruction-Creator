import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function thirdpartyPartsChunksPlugin(): Plugin {
  const srcDir = path.resolve(process.cwd(), 'thirdparty/parts-chunks');
  const distDir = path.resolve(process.cwd(), 'dist/parts-chunks');
  return {
    name: 'thirdparty-parts-chunks',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (!urlPath.startsWith('/parts-chunks/')) return next();
        const rel = path.basename(urlPath.slice('/parts-chunks/'.length));
        const filePath = path.join(srcDir, rel);
        if (!rel || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return next();
        res.setHeader(
          'Content-Type',
          rel.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/octet-stream',
        );
        fs.createReadStream(filePath).pipe(res);
      });
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
  plugins: [react(), tailwindcss(), thirdpartyPartsChunksPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Keep individual chunks well below Neocities file size limits
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'vendor-three';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/fflate') || id.includes('node_modules/jszip')) {
            return 'vendor-export';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          return undefined;
        },
      },
    },
  },
});
