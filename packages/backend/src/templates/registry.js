import fs from 'node:fs'
import path from 'node:path'

const ROOT = __dirname

let cache = null

function resolveFromRoot(relPath) {
  // relPath is typically "./folder/file" relative to ROOT
  const full = path.resolve(ROOT, relPath.replace(/^\.\//, ''))
  return full
}

export function loadTemplatesRegistry() {
  if (cache) return cache

  const registryPath = path.resolve(ROOT, 'templates.json')
  const raw = fs.readFileSync(registryPath, 'utf-8')
  const parsed = JSON.parse(raw)

  const templates = parsed.templates ?? []

  cache = new Map(templates.map((t) => [t.templateId, t]))
  return cache
}

export function getTemplateConfig(templateId) {
  const reg = loadTemplatesRegistry()
  const cfg = reg.get(templateId)
  if (!cfg) throw new Error(`Unknown templateId: ${templateId}`)
  return cfg
}

export function readTemplateSchema(templateId) {
  const cfg = getTemplateConfig(templateId)
  const schemaPath = resolveFromRoot(cfg.schemaPath)
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
}

export function readTemplatePrompt(templateId) {
  const cfg = getTemplateConfig(templateId)
  const promptPath = resolveFromRoot(cfg.promptPath)
  return fs.readFileSync(promptPath, 'utf-8')
}
