import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const pkgDir = resolve(process.cwd(), 'node_modules/@ag-ui/core')
const distDir = resolve(pkgDir, 'dist')

const shims = {
  'index.mjs': "export * from './index.js'\n",
  'schemas.mjs': "export * from './schemas.js'\n",
}

if (existsSync(pkgDir)) {
  mkdirSync(distDir, { recursive: true })
  for (const [file, content] of Object.entries(shims)) {
    const target = resolve(distDir, file)
    if (!existsSync(target)) {
      writeFileSync(target, content)
    }
  }
}
