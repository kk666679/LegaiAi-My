/**
 * @lawmate/cli — safety subcommand.
 */
import { PolicyEngine, InMemoryRateLimiter, InMemoryResourceLimiter } from '@lawmate/safety';

export function safetyInfo(): void {
  const engine = new PolicyEngine();
  const limiter = new InMemoryRateLimiter();
  const resource = new InMemoryResourceLimiter();
  void engine; void limiter; void resource;
  process.stdout.write('LAWMATE Safety\n');
  process.stdout.write('=============\n\n');
  process.stdout.write('Decisions: ALLOW | DENY | REQUIRE_APPROVAL | REDACT | ESCALATE\n');
  process.stdout.write('Components: PolicyEngine, RateLimiter, ResourceLimiter, AuditRecorder, InputValidator\n');
}