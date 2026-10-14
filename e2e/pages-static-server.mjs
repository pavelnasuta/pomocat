import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'

const root = resolve(process.cwd(), 'dist')
const base = '/pomokitty/'
const port = Number(process.env.PORT ?? 4174)

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : ''
  const requested = relative && relative.endsWith('/') ? `${relative}index.html` : relative || 'index.html'
  const file = resolve(root, requested)
  const safeFile = file === root || file.startsWith(`${root}${sep}`) ? file : resolve(root, 'index.html')
  try {
    if (!statSync(safeFile).isFile()) throw new Error('not-file')
    const contentTypes = {
      '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png',
      '.opus': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json',
    }
    response.setHeader('Content-Type', contentTypes[extname(safeFile)] ?? 'text/html')
    createReadStream(safeFile).pipe(response)
  } catch {
    response.setHeader('Content-Type', 'text/html')
    createReadStream(resolve(root, 'index.html')).pipe(response)
  }
}).listen(port, '127.0.0.1')
