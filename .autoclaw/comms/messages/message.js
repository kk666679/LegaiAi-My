export class Message {
  constructor({
    id = null,
    from = null,
    to = null,
    type = 'message',
    payload = {},
    room = null,
    ts = Date.now(),
  }) {
    this.id = id ?? this.generateId();
    this.from = from;
    this.to = to;
    this.type = type;
    this.payload = payload;
    this.room = room;
    this.ts = ts;
  }

  generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  static fromJSON(json) {
    return new Message(json);
  }

  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      payload: this.payload,
      room: this.room,
      ts: this.ts,
    };
  }

  validate() {
    const errors = [];
    if (!this.id) errors.push('Message id is required');
    if (!this.type) errors.push('Message type is required');
    if (!this.ts || typeof this.ts !== 'number') errors.push('Message ts must be a number');
    return errors;
  }
}
