import { metrics } from '@opentelemetry/api';
const meter = metrics.getMeter('autoclaw-fabric');

const seatsAssigned = meter.createCounter('fabric_seats_assigned_total');
const promoted = meter.createCounter('fabric_promoted_total');
const halted = meter.createCounter('fabric_halted_total');

export const fabricMetrics = {
  increment(name, attributes = {}, value = 1) {
    const map = {
      'fabric.seat.assigned': seatsAssigned,
      'fleet.promoted': promoted,
      'fleet.halted': halted,
    };
    map[name]?.add(value, attributes);
  },
};
