import { randomUUID } from 'crypto'

export interface ProvenanceNode {
  id: string
  type: 'case' | 'statute' | 'inference' | 'query'
  citation: string
  text: string
  confidence?: number
  court?: string
  date?: string
}

export interface ProvenanceEdge {
  from: string
  to: string
  rule: 'supports' | 'contradicts' | 'cites' | 'derives'
}

export class ProvenanceGraph {
  nodes: ProvenanceNode[] = []
  edges: ProvenanceEdge[] = []
  traceId: string

  constructor(traceId = randomUUID()) {
    this.traceId = traceId
  }

  addQuery(query: string): string {
    const id = `query:${this.traceId}`
    this.nodes.push({ id, type: 'query', citation: '', text: query })
    return id
  }

  addCase(citation: string, text: string, meta: Partial<ProvenanceNode> = {}): string {
    const id = `case:${citation.replace(/\s/g, '_')}`
    if (!this.nodes.find(n => n.id === id)) {
      this.nodes.push({ id, type: 'case', citation, text: text.slice(0, 300), ...meta })
    }
    return id
  }

  addStatute(citation: string, text: string): string {
    const id = `statute:${citation.replace(/\s/g, '_')}`
    this.nodes.push({ id, type: 'statute', citation, text: text.slice(0, 300) })
    return id
  }

  addInference(fromIds: string[], conclusion: string, confidence = 0.8): string {
    const id = `inf:${randomUUID().slice(0, 8)}`
    this.nodes.push({ id, type: 'inference', citation: '', text: conclusion, confidence })
    for (const from of fromIds) {
      this.edges.push({ from, to: id, rule: 'supports' })
    }
    return id
  }

  link(from: string, to: string, rule: ProvenanceEdge['rule'] = 'cites') {
    this.edges.push({ from, to, rule })
  }

  toJSON() {
    return { traceId: this.traceId, nodes: this.nodes, edges: this.edges }
  }
}
