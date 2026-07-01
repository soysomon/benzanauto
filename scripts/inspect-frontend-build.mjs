import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST_ASSETS_DIR = join(process.cwd(), 'dist', 'assets')

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`
}

function pickAsset(prefix) {
  return readdirSync(DIST_ASSETS_DIR)
    .filter((file) => file.startsWith(prefix) && file.endsWith('.js'))
    .sort()
    .at(-1)
}

function inspectJavaScriptAsset(file) {
  const fullPath = join(DIST_ASSETS_DIR, file)
  const source = readFileSync(fullPath, 'utf8')
  const rawBytes = statSync(fullPath).size
  const gzipBytes = gzipSync(source).length

  return {
    file,
    rawBytes,
    gzipBytes,
    staticMotionImport: /from\s+["']\.\/motion-vendor/.test(source),
  }
}

if (!existsSync(DIST_ASSETS_DIR)) {
  console.error('No se encontro dist/assets. Ejecuta primero `npm run build:frontend`.')
  process.exit(1)
}

const assets = readdirSync(DIST_ASSETS_DIR)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const fullPath = join(DIST_ASSETS_DIR, file)
    return {
      file,
      rawBytes: statSync(fullPath).size,
    }
  })
  .sort((a, b) => b.rawBytes - a.rawBytes)

const indexAsset = pickAsset('index-')
const homeAsset = pickAsset('Home-')

console.log('Frontend build report')
console.log('=====================')

if (indexAsset) {
  const report = inspectJavaScriptAsset(indexAsset)
  console.log(`Shell entry: ${report.file} | raw ${formatKiB(report.rawBytes)} | gzip ${formatKiB(report.gzipBytes)} | static motion import: ${report.staticMotionImport ? 'yes' : 'no'}`)
}

if (homeAsset) {
  const report = inspectJavaScriptAsset(homeAsset)
  console.log(`Home chunk:  ${report.file} | raw ${formatKiB(report.rawBytes)} | gzip ${formatKiB(report.gzipBytes)} | static motion import: ${report.staticMotionImport ? 'yes' : 'no'}`)
}

console.log('\nTop JS assets by raw size')
console.log('-------------------------')
for (const asset of assets.slice(0, 10)) {
  console.log(`${asset.file.padEnd(40)} ${formatKiB(asset.rawBytes)}`)
}
