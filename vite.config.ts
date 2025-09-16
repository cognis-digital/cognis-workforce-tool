import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    root: 'web',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': 'http://localhost:3000'
      }
    },
    base: '/',
    build: {
      outDir: 'dist/web',
      sourcemap: true,
    },
  };
});
