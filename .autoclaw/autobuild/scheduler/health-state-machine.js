/**
 * Health state machine — tracks build run status and transitions.
 * States: idle, running, stalled, recovering, failed, complete.
 */
class HealthStateMachine {
  constructor(opts = {}) {
    this.onTransition = onTransition;
    this.state = 'idle';
  }

  enter(newState) {
    const oldState = this.state;
    this.state = newState;
    if (this.onTransition) {
      this.onTransition({ from: oldState, to: newState });
    }
  }

  handleSignal(signal) {
    switch (this.state) {
      case 'idle':
        if (signal.type === 'start') this.enter('running');
        break;
      case 'running':
        if (signal.type === 'stall') this.enter('stalled');
        break;
      case 'stalled':
        if (signal.type === 'recovery-start') this.enter('recovering');
        if (signal.type === 'fail') this.enter('failed');
        break;
      case 'recovering':
        if (signal.type === 'complete') this.enter('running');
        if (signal.type === 'fail') this.enter('failed');
        break;
      case 'failed':
      case 'complete':
        if (signal.type === 'restart') this.enter('running');
        if (signal.type === 'reset') this.enter('idle');
        break;
      default:
        this.enter('idle');
    }
  }
}

export { HealthStateMachine };
