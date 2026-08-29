type Service = 'chroma' | 'llm' | 'redis' | 'postgres'
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

const FAILURE_THRESHOLD = 3
const RECOVERY_MS = 60_000

class CircuitBreaker {
  private failures = new Map<Service, number>()
  private state = new Map<Service, State>()
  private openedAt = new Map<Service, number>()

  getState(service: Service): State {
    return this.state.get(service) || 'CLOSED'
  }

  getStats() {
    const stats: Record<string, { state: State; failures: number }> = {}
    for (const svc of ['chroma', 'llm', 'redis', 'postgres'] as Service[]) {
      stats[svc] = { state: this.getState(svc), failures: this.failures.get(svc) || 0 }
    }
    return stats
  }

  async call<T>(service: Service, fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    const state = this.getState(service)

    if (state === 'OPEN') {
      const elapsed = Date.now() - (this.openedAt.get(service) || 0)
      if (elapsed > RECOVERY_MS) {
        this.state.set(service, 'HALF_OPEN')
      } else {
        return fallback()
      }
    }

    try {
      const result = await fn()
      this.failures.set(service, 0)
      if (this.getState(service) === 'HALF_OPEN') this.state.set(service, 'CLOSED')
      return result
    } catch (err) {
      const fails = (this.failures.get(service) || 0) + 1
      this.failures.set(service, fails)
      if (fails >= FAILURE_THRESHOLD) {
        this.state.set(service, 'OPEN')
        this.openedAt.set(service, Date.now())
      }
      return fallback()
    }
  }
}

export const circuitBreaker = new CircuitBreaker()
