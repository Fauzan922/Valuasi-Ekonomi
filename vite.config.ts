import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project sites are served from /<repository>/.
// On GitHub Actions the repository name is available automatically.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
  process.env.GITHUB_ACTIONS === 'true' && repository ? `/${repository}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('victory-vendor')
            ) {
              return 'charts';
            }
            if (id.includes('react')) return 'react-vendor';
          }
          if (id.includes('reference.json')) return 'reference-data';
          return undefined;
        },
      },
    },
  },
});
