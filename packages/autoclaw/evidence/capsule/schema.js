export class CapsuleSchema {
  static validate(capsule) {
    const required = ['id', 'event', 'actor', 'timestamp'];
    return required.every((field) => capsule[field] !== undefined);
  }
}
