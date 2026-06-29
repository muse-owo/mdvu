import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

const isElectron = process.env.BUILD_TARGET === 'electron';

export default defineConfig({
  integrations: [svelte()],
  base: isElectron ? './' : '/mdvu',
  vite: isElectron ? {
    plugins: [{
      name: 'electron-relative-paths',
      transformIndexHtml: (html) => html.replace(/\/\.\//g, './'),
    }],
  } : {},
});
