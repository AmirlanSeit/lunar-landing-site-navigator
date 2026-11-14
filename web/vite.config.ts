import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { GET } from './api/horizons'

function horizonsApi(): Plugin {
  return {
    name: 'horizons-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname !== '/api/horizons') return next()
        if (req.method !== 'GET') {
          res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify({ error: 'Use GET for this endpoint.' }))
          return
        }
        try {
          const response = await GET(new Request(url))
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
  plugins: [react(), horizonsApi()],
})
