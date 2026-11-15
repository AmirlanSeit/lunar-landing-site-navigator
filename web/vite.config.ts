import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { GET as horizons } from './api/horizons'
import { GET as terrain } from './api/terrain'

const ROUTES: Record<string, (request: Request) => Promise<Response>> = { '/api/horizons': horizons, '/api/terrain': terrain }

/** Serves the Vercel functions in `vite dev`. */
function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const handler = ROUTES[url.pathname]
        if (!handler) return next()
        if (req.method !== 'GET') {
          res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify({ error: 'Use GET for this endpoint.' }))
          return
        }
        try {
          const response = await handler(new Request(url))
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localApi()],
})
