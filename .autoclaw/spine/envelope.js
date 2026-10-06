/**
 * spine/envelope.ts — Event envelope helpers for the AutoClaw spine.
 *
 * Provides stable event ID generation and validation for the three core
 * event families that flow through the spine: seat lifecycle, control
 * commands, and control acknowledgments.
 *
 * The schema version is a single source of truth so that producers and
 * consumers can evolve in lock-step.
 */


/** Current spine event schema version. Increment on breaking changes. */
export let SPINE_SCHEMA = "1.0.0";

/** Valid seat state transitions. */
export let SEAT_TRANSITIONS = Object.freeze([
  "created", "granted", "renewed", "revoked", "expired", "released",
]);

/** Valid control command states. */
export let CONTROL_STATES = Object.freeze([
  "pending", "assigned", "running", "completed", "failed", "cancelled",
]);

/** Valid control acknowledgment outcomes. */
export let CONTROL_ACK_OUTCOMES = Object.freeze([
  "accepted", "rejected", "completed", "failed", "timeout",
]);

/**
 * Generate a deterministic event ID for seat lifecycle events.
 * Format: seat:{seat_id}:{transition}:{timestamp_ms}
 */
function seatEventId(seatId, transition, occurredAt) {
  if (!seatId || typeof seatId !== "string") {
    throw new Error("seatId is required and must be a string");
  }
  if (!exports.SEAT_TRANSITIONS.includes(transition)) {
    throw new Error(`Invalid seat transition: ${transition}`);
  }
  const ts = Number.isFinite(occurredAt) ? occurredAt : Date.now();
  return `seat:${seatId}:${transition}:${ts}`;
}

/**
 * Generate a deterministic event ID for control command events.
 * Format: control:cmd:{command_id}:{timestamp_ms}
 */
function controlCommandEventId(commandId) {
  if (!commandId || typeof commandId !== "string") {
    throw new Error("commandId is required and must be a string");
  }
  const ts = Date.now();
  return `control:cmd:${commandId}:${ts}`;
}

/**
 * Generate a deterministic event ID for control acknowledgment events.
 * Format: control:ack:{command_id}:{timestamp_ms}
 */
function controlAckEventId(commandId) {
  if (!commandId || typeof commandId !== "string") {
    throw new Error("commandId is required and must be a string");
  }
  const ts = Date.now();
  return `control:ack:${commandId}:${ts}`;
}

/**
 * Validate a spine event object.
 * Returns an array of validation error messages (empty if valid).
 */
function validateSpineEvent(event) {
  const errors = [];

  if (!event || typeof event !== "object") {
    return ["event must be an object"];
  }

  // Required fields
  if (!event.schema || typeof event.schema !== "string") {
    errors.push("schema is required and must be a string");
  } else if (event.schema !== exports.SPINE_SCHEMA) {
    errors.push(`schema version mismatch: expected ${exports.SPINE_SCHEMA}, got ${event.schema}`);
  }

  if (!event.event_id || typeof event.event_id !== "string") {
    errors.push("event_id is required and must be a string");
  }

  if (!event.occurred_at || !Number.isFinite(event.occurred_at)) {
    errors.push("occurred_at is required and must be a finite timestamp");
  }

  if (!event.payload || typeof event.payload !== "object") {
    errors.push("payload is required and must be an object");
  }

  // Type-specific validation
  if (event.event_id) {
    if (event.event_id.startsWith("seat:")) {
      validateSeatEvent(event, errors);
    } else if (event.event_id.startsWith("control:cmd:")) {
      validateControlCommandEvent(event, errors);
    } else if (event.event_id.startsWith("control:ack:")) {
      validateControlAckEvent(event, errors);
    }
  }

  return errors;
}

function validateSeatEvent(event, errors) {
  const parts = event.event_id.split(":");
  if (parts.length !== 4 || parts[0] !== "seat" || parts[1] === "" || parts[2] === "" || parts[3] === "") {
    errors.push("seat event_id must be in format 'seat:{seat_id}:{transition}:{timestamp}'");
  }
  if (parts[2] && !exports.SEAT_TRANSITIONS.includes(parts[2])) {
    errors.push(`invalid seat transition: ${parts[2]}`);
  }
  if (event.payload && typeof event.payload === "object") {
    if (!event.payload.seat_id) errors.push("seat payload missing seat_id");
    if (event.payload.transition && !exports.SEAT_TRANSITIONS.includes(event.payload.transition)) {
      errors.push(`invalid transition in payload: ${event.payload.transition}`);
    }
  }
}

function validateControlCommandEvent(event, errors) {
  const parts = event.event_id.split(":");
  if (parts.length !== 4 || parts[0] !== "control" || parts[1] !== "cmd" || parts[2] === "" || parts[3] === "") {
    errors.push("control command event_id must be in format 'control:cmd:{command_id}:{timestamp}'");
  }
  if (event.payload && typeof event.payload === "object") {
    if (!event.payload.command_id) errors.push("control command payload missing command_id");
    if (event.payload.command && !exports.CONTROL_STATES.includes(event.payload.command)) {
      errors.push(`invalid command state: ${event.payload.command}`);
    }
  }
}

function validateControlAckEvent(event, errors) {
  const parts = event.event_id.split(":");
  if (parts.length !== 4 || parts[0] !== "control" || parts[1] !== "ack" || parts[2] === "" || parts[3] === "") {
    errors.push("control ack event_id must be in format 'control:ack:{command_id}:{timestamp}'");
  }
  if (event.payload && typeof event.payload === "object") {
    if (!event.payload.command_id) errors.push("control ack payload missing command_id");
    if (event.payload.outcome && !exports.CONTROL_ACK_OUTCOMES.includes(event.payload.outcome)) {
      errors.push(`invalid ack outcome: ${event.payload.outcome}`);
    }
  }
}

export { seatEventId as seatEventId, controlCommandEventId as controlCommandEventId, controlAckEventId as controlAckEventId, validateSpineEvent as validateSpineEvent };
