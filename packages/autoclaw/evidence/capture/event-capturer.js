export class EventCapturer {
  constructor() {
    this.events = [];
  }

  capture(event) {
    const record = {
      ...event,
      capturedAt: Date.now(),
      id: crypto.randomUUID(),
    };
    this.events.push(record);
    return record;
  }
}
