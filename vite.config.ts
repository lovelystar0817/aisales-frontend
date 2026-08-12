import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    sentryVitePlugin({
      org: 'hupo-ve',
      project: 'ai-salesapp',
      telemetry: false,
      sourcemaps: {
        filesToDeleteAfterUpload: 'build/client/assets/*.js.map',
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    port: 5361,
  },
});
