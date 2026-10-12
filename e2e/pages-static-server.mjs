import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'

const root = resolve(process.cwd(), 'dist')
const base = '/pomokitty/'
const port = Number(process.env.PORT ?? 4174)

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : ''
  const file = resolve(root, relative || 'index.html')
  const safeFile = file === root || file.startsWith(`${root}${sep}`) ? file : resolve(root, 'index.html')
  try {
    if (!statSync(safeFile).isFile()) throw new Error('not-file')
    response.setHeader('Content-Type', extname(safeFile) === '.js' ? 'application/javascript' : extname(safeFile) === '.mp3' ? 'audio/mpeg' : 'text/html')
    createReadStream(safeFile).pipe(response)
  } catch {
    response.setHeader('Content-Type', 'text/html')
    createReadStream(resolve(root, 'index.html')).pipe(response)
  }
}).listen(port, '127.0.0.1')
