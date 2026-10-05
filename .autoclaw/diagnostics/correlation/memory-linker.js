export class MemoryLinker {
  constructor() {
    this.memories = [];
  }

  async link({ symptom, classification }) {
    return this.memories.filter((m) => {
      const text = `${symptom.message ?? ''} ${classification.class ?? ''}`;
      return m.content.toLowerCase().includes(text.toLowerCase().slice(0, 20));
    });
  }
}
