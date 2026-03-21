import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

function apiProxy(target: string): Plugin {
  const url = new URL(target)
  const isHttps = url.protocol === 'https:'
  const requester = isHttps ? https : http

  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/v1', (req, res) => {
        const opts = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: '/v1' + (req.url ?? ''),
          method: req.method,
          headers: {
            ...req.headers,
            host: url.hostname,
          },
        }
        delete (opts.headers as Record<string, unknown>).cookie
        const proxyReq = requester.request(opts, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
          proxyRes.pipe(res)
        })
        proxyReq.on('error', (err) => {
          console.error('[api-proxy]', err.message)
          res.writeHead(502)
          res.end('Proxy error')
        })
        req.pipe(proxyReq)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'https://api.accsaberreloaded.com'

  return {
    plugins: [vue(), apiProxy(proxyTarget)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
  }
})
