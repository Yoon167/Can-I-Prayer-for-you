import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function buildVersionManifestPlugin(buildId, deployedAt) {
  return {
    name: 'build-version-manifest',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            buildId,
            deployedAt,
          },
          null,
          2,
        ),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const buildId = process.env.VITE_APP_BUILD_ID || 'dev-local'
  const deployedAt = process.env.VITE_APP_DEPLOYED_AT || new Date().toISOString()

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [
          'app-logo.png',
          'social-preview.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
        ],
        manifest: {
          name: 'Can I Pray for You',
          short_name: 'Pray for You',
          description:
            'A global prayer community app for requests, praise reports, journals, and daily encouragement.',
          theme_color: '#30473b',
          background_color: '#f6efe4',
          display: 'standalone',
          orientation: 'portrait',
          scope: './',
          start_url: './',
          categories: ['lifestyle', 'productivity', 'social'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'app-logo.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: 'index.html',
        },
      }),
      buildVersionManifestPlugin(buildId, deployedAt),
    ],
    base: command === 'build' ? './' : '/',
    define: {
      'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(buildId),
      'import.meta.env.VITE_APP_DEPLOYED_AT': JSON.stringify(deployedAt),
    },
  }
})
