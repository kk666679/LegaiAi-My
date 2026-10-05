/**
 * Bridge contract types.
 *
 * Implements the ACP (Agent Client Protocol) type surface.
 * A Bridge exposes a `connect` method for each IDE adapter and a
 * transport layer for sending/receiving JSON-RPC 2.0 messages.
 */

const ACP_METHODS = {
  INITIALIZE: 'initialize',
  SESSION_NEW: 'session/new',
  SESSION_PROMPT: 'session/prompt',
  SESSION_CANCEL: 'session/cancel',
  SESSION_LOAD: 'session/load',
  SESSION_UPDATE: 'session/update',
  PERMISSION_REQUEST: 'session/request_permission',
  FS_READ: 'fs/read_text_file',
  FS_WRITE: 'fs/write_text_file',
  TERMINAL_CREATE: 'terminal/create',
  TERMINAL_OUTPUT: 'terminal/output',
};

export { ACP_METHODS };
