import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import fs from 'fs';
import { fileURLToPath } from 'url';

const isElectron = process.env.BUILD_TARGET === 'electron';

const electronPathFix = {
  name: 'electron-path-fix',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const htmlFile = fileURLToPath(new URL('index.html', dir));
      let html = fs.readFileSync(htmlFile, 'utf8');
      html = html.replace(/\/\.\//g, './');
      fs.writeFileSync(htmlFile, html);
      console.log('[electron-path-fix] paths rewritten');
    },
  },
};

export default defineConfig({
  integrations: isElectron ? [svelte(), electronPathFix] : [svelte()],
  base: isElectron ? './' : '/mdvu',
});
