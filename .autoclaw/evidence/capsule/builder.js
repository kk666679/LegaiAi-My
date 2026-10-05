import { CapsuleSchema } from './schema.js';

export class CapsuleBuilder {
  async build({ event, actor, context, linked, timestamp }) {
    const capsule = {
      id: crypto.randomUUID(),
      event,
      actor,
      context,
      linked,
      timestamp,
      createdAt: Date.now(),
    };

    if (!CapsuleSchema.validate(capsule)) {
      throw new Error('Invalid capsule schema');
    }

    return capsule;
  }
}
