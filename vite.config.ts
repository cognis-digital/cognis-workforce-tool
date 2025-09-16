import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Use project root so both React/TS app in /src and any legacy scripts are resolved
    root: '.',
    plugins: [
      react(), 
      wasm(),
      topLevelAwait(),
    ],
    optimizeDeps: {
      exclude: ['lucide-react', 'onnxruntime-web', '@xenova/transformers'],
      esbuildOptions: {
        supported: {
          // Required for proper WebAssembly support
          'top-level-await': true
        }
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      'import.meta.env.MODEL_STORAGE_PATH': JSON.stringify(env.MODEL_STORAGE_PATH || 'models'),
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/api/v1/chat/completions': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/api/models': {
          target: 'http://localhost:3000', 
          changeOrigin: true,
          secure: false
        },
        '/api/v1/research/query': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/api/v1/research/enhance': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      },
      cors: true
    },
    // For GitHub Pages deployment
    base: process.env.NODE_ENV === 'production' ? '/cognis-workforce-tool/' : '/',
    build: {
      outDir: 'dist/web',
      assetsInlineLimit: 0, // ensure .wasm stays as separate file
      target: 'esnext', // Ensure proper support for top-level await
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('onnxruntime-web')) return 'runtime';
            if (id.includes('@xenova')) return 'models';
          }
        }
      },
      sourcemap: true,
    },
  };
});
