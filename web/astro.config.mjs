// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://sheetstack.app',
  server: { port: 4321 },
  vite: {
    ssr: { noExternal: ['antd', '@ant-design/icons'] },
  },
});
