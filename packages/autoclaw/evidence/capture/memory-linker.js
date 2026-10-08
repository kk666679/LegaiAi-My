export class MemoryLinker {
  constructor() {
    this.links = [];
  }

  link(event) {
    const link = { eventId: event.id, memoryId: crypto.randomUUID(), linkedAt: Date.now() };
    this.links.push(link);
    return link;
  }
}
