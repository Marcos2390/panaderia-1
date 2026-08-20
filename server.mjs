// Servidor Node genérico para producción.
// Sirve los archivos estáticos generados (dist/client) y delega el resto
// (rutas SSR / funciones de servidor) al handler que genera el build.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import handler from './dist/server/server.js'

const clientDir = join(process.cwd(), 'dist/client')

const mimeTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function tryServeStatic(pathname) {
  if (pathname === '/' || pathname === '') return null
  const filePath = join(clientDir, decodeURIComponent(pathname))
  try {
    const data = await readFile(filePath)
    const ext = extname(filePath)
    return { data, type: mimeTypes[ext] || 'application/octet-stream' }
  } catch {
    return null
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    const staticFile = await tryServeStatic(url.pathname)
    if (staticFile) {
      res.writeHead(200, {
        'Content-Type': staticFile.type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      })
      res.end(staticFile.data)
      return
    }

    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length ? Buffer.concat(chunks) : undefined

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : body,
    })

    const response = await handler.fetch(request)

    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))

    if (response.body) {
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    res.end()
  } catch (err) {
    console.error('Error en el servidor:', err)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`)
})
