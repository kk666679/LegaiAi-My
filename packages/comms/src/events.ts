/**
 * @lawmate/comms — Event names used across the bus.
 */
export const CommsEvents = {
  MessageSent: 'comms.message.sent',
  MessageReceived: 'comms.message.received',
  MessageFailed: 'comms.message.failed',
} as const;

export type CommsEvent = (typeof CommsEvents)[keyof typeof CommsEvents];
