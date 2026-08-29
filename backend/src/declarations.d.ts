declare module 'cors' {
  import { RequestHandler } from 'express'
  function cors(options?: Record<string, unknown>): RequestHandler
  export = cors
}

declare module 'superjson' {
  const superjson: {
    serialize: (value: unknown) => { json: unknown; meta?: unknown }
    deserialize: <T>(payload: { json: unknown; meta?: unknown }) => T
    stringify: (value: unknown) => string
    parse: <T>(text: string) => T
  }
  export default superjson
}

declare module '*/queues/index.js' {
  import type { Queue } from 'bullmq'
  const queues: Record<string, Queue>
  export { queues }
}

declare module '../../queues/index.js' {
  import type { Queue } from 'bullmq'
  const queues: Record<string, Queue>
  export { queues }
}

declare module '../queues/index.js' {
  import type { Queue } from 'bullmq'
  const queues: Record<string, Queue>
  export { queues }
}

declare module '../../../queues/index.js' {
  import type { Queue } from 'bullmq'
  const queues: Record<string, Queue>
  export { queues }
}
