import { createHash } from 'crypto';

export class MerkleTree {
  constructor({ algorithm = 'sha256' } = {}) {
    this.algorithm = algorithm;
  }

  hash(data) {
    return createHash(this.algorithm).update(JSON.stringify(data)).digest('hex');
  }

  build(leaves) {
    if (leaves.length === 0) return { root: null, levels: [] };
    let level = leaves.map((l) => this.hash(l));
    const levels = [level];

    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        next.push(this.hash(left + right));
      }
      levels.push(next);
      level = next;
    }

    return { root: level[0], levels };
  }

  proof(leaves, index) {
    const { levels } = this.build(leaves);
    const proof = [];
    let idx = index;

    for (let i = 0; i < levels.length - 1; i++) {
      const level = levels[i];
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;
      const sibling = level[siblingIdx] ?? level[idx];
      proof.push({ position: isRight ? 'left' : 'right', hash: sibling });
      idx = Math.floor(idx / 2);
    }

    return proof;
  }

  verify(leaf, proof, root) {
    let hash = this.hash(leaf);
    for (const { position, hash: sibling } of proof) {
      hash = position === 'left' ? this.hash(sibling + hash) : this.hash(hash + sibling);
    }
    return hash === root;
  }
}
