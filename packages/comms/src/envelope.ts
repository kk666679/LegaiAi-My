/**
 * @lawmate/comms — Message envelope.
 */
export interface Envelope<T = unknown> {
  id: string;
  from: string;
  to: string;
  topic: string;
  payload: T;
  sentAt: string;
  correlationId?: string;
}
