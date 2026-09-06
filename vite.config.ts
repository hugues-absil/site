import path from 'path'
import fs from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin : copie index.html → 404.html (SPA sur GitHub Pages) + .nojekyll (évite le traitement Jekyll).
function copy404Plugin() {
  return {
    name: 'copy-404',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const indexPath = path.join(outDir, 'index.html')
      const notFoundPath = path.join(outDir, '404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
      }
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '')
    },
  }
}

// https://vite.dev/config/
// Les .env ne sont pas chargés automatiquement dans la config ; on utilise loadEnv
// pour que GITHUB_PAGES et VITE_BASE_PATH dans .env soient pris en compte.
// Pour GitHub Pages, le base path par défaut est /site/ (URL type github.io/site). Surcharger avec VITE_BASE_PATH si le dépôt a un autre nom.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH
    ? (env.VITE_BASE_PATH.endsWith('/') ? env.VITE_BASE_PATH : env.VITE_BASE_PATH + '/')
    : env.GITHUB_PAGES === 'true'
      ? '/site/'
      : '/'
  const basePath = base.replace(/\/$/, '') // ex: '/site' sans slash final
  return {
    plugins: [
      react(),
      copy404Plugin(),
      // En dev, rediriger /site vers /site/ pour éviter 404 quand on ouvre sans slash final
      basePath
        ? {
            name: 'redirect-base-without-trailing-slash',
            configureServer(server: ViteDevServer) {
              server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
                if (req.url === basePath || req.url?.startsWith(basePath + '?')) {
                  const suffix = req.url!.slice(basePath.length) || ''
                  res.statusCode = 301
                  res.setHeader('Location', base + suffix)
                  res.end()
                  return
                }
                next()
              })
            },
          }
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base,
  }
})
