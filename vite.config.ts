import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: dist/index.html contains everything (code, styles, data),
// so it opens with a double-click — no server needed.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
});
