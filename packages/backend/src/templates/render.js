// Minimal mustache-like renderer with support for:
// - {{path.to.value}}
// - {{#each arr}}...{{/each}} with {{this.some}} and {{this}}

export function render(template, context) {
  let out = template

  // each blocks
  out = out.replace(/\{\{#each\s+([^\s\}]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrPath, block) => {
    const arr = getByPath(context, arrPath)
    if (!Array.isArray(arr) || arr.length === 0) return ''

    return arr
      .map((item) => {
        const blockCtx = { ...context, this: item }
        return render(block, blockCtx) // recursion for nested replacements
      })
      .join('')
  })

  // simple replacements
  out = out.replace(/\{\{\s*([^\}]+?)\s*\}\}/g, (_, rawPath) => {
    const val = getByPath(context, rawPath)
    if (val === undefined || val === null) return ''
    return String(val)
  })

  return out
}

function getByPath(obj, p) {
  const parts = String(p)
    .split('.')
    .map((x) => x.trim())
    .filter(Boolean)

  let cur = obj
  for (const part of parts) {
    if (cur == null) return undefined
    cur = cur[part]
  }
  return cur
}

