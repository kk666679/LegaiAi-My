/**
 * @lawmate/cli — comms subcommand.
 */
import { CommsEvents, topics, subscribe, publish } from '@lawmate/comms';

export function commsInfo(): void {
  void CommsEvents; void topics; void subscribe; void publish;
  process.stdout.write('LAWMATE Comms\n');
  process.stdout.write('============\n\n');
  process.stdout.write('Provider-neutral messaging: request/response, event, pub/sub, queues, streams, broadcast, direct agent-to-agent.\n');
  process.stdout.write('Transports: in-memory, redis, nats, rabbitmq, cloud.\n');
}