export class BackpressureController {
  constructor({ highWaterMark = 1000 } = {}) {
    this.highWaterMark = highWaterMark;
    this.pending = 0;
  }

  acquire() {
    if (this.pending >= this.highWaterMark) {
      throw new Error('Backpressure: queue full');
    }
    this.pending++;
  }

  release() {
    this.pending = Math.max(0, this.pending - 1);
  }

  get pressure() {
    return this.pending / this.highWaterMark;
  }
}
