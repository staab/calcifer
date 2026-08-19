import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// browser-only: same-origin path forwarded to Brave so CORS doesn't apply
const braveProxy = {
  '/brave-api': {
    target: 'https://api.search.brave.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/brave-api/, ''),
  },
};

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      $src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { proxy: braveProxy },
  preview: { proxy: braveProxy },
});
