// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
  },
  site: 'https://lowrycito.github.io',
  base: '/diff-viewer',
  vite: {
    ssr: {
      noExternal: ['diff2html']
    },
    optimizeDeps: {
      include: ['diff2html']
    }
  }
});