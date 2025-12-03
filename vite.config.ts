import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Supabase configuration
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': [
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-popover',
                '@radix-ui/react-select',
                '@radix-ui/react-tabs',
                '@radix-ui/react-tooltip',
              ],
              'charts-vendor': ['recharts'],
              'xlsx-vendor': ['xlsx'],
              'pdf-vendor': ['jspdf', 'html2canvas'],
              'supabase-vendor': ['@supabase/supabase-js'],
            },
          },
        },
      },
    };
});
