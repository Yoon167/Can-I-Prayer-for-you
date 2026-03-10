import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    plugins: [react(), buildVersionManifestPlugin(buildId, deployedAt)],
    base: command === 'build' ? './' : '/',
    define: {
      'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(buildId),
      'import.meta.env.VITE_APP_DEPLOYED_AT': JSON.stringify(deployedAt),
    },
  }
})
