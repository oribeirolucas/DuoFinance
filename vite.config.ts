import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Recharts e suas dependências de d3 somam ~377 kB e quase nunca
          // mudam. Num arquivo próprio, eles continuam sendo pré-carregados em
          // paralelo com o código do app (o Vite emite modulepreload para
          // dependência estática), mas sobrevivem ao cache entre deploys, em
          // vez de serem rebaixados junto a cada mudança nossa.
          manualChunks(id: string) {
            if (/node_modules\/(recharts|d3-|victory-|internmap|delaunator|robust-predicates)/.test(id)) {
              return 'graficos';
            }
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
              return 'react';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
