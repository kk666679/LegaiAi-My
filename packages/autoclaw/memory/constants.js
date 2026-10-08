const TIER = Object.freeze({ STM: 'stm', LTM: 'ltm' });

const KIND = Object.freeze({
  TURN:        'turn',
  OBSERVATION: 'observation',
  INSIGHT:     'insight',
  FACT:        'fact',
  NOTE:        'note',
  REFLECTION:  'reflection',
  LEGISLATION: 'legislation'
});

const DEFAULT_STM = Object.freeze({
  capacity: 100,
  ttlMs: 30 * 60 * 1000
});

const DEFAULT_LTM = Object.freeze({
  salienceFloor: 0.05,
  decayFactor: 0.95,
  maxEntries: 10000
});

export { TIER, KIND, DEFAULT_STM, DEFAULT_LTM };
