import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative paths so static builds deploy cleanly at root or subpath (e.g. Neocities)
  base: './',
  plugins: [react(), tailwindcss()],
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
