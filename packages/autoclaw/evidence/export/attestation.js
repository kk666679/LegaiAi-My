export class Attestation {
  constructor() {
    this.attestations = [];
  }

  sign(summary, privateKey) {
    const payload = JSON.stringify(summary);
    const signature = privateKey ? createSign('sha256').update(payload).sign(privateKey, 'hex') : null;
    return { ...summary, signature, signed: !!signature };
  }
}
