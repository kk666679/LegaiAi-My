const JSONRPC_VERSION = '2.0';
const MCP_VERSION     = '2024-11-05';
const SERVER_NAME     = 'autoclaw-mcp';
const SERVER_VERSION  = '2.0.0';

const ERROR_CODES = Object.freeze({
  PARSE_ERROR:        -32700,
  INVALID_REQUEST:    -32600,
  METHOD_NOT_FOUND:   -32601,
  INVALID_PARAMS:     -32602,
  INTERNAL_ERROR:     -32603,
  RESOURCE_NOT_FOUND: -32002,
  TOOL_NOT_FOUND:     -32003,
  PROMPT_NOT_FOUND:   -32004
});

const successResponse = (id, result) => ({ jsonrpc: JSONRPC_VERSION, id, result });
const errorResponse   = (id, code, message, data) => ({
  jsonrpc: JSONRPC_VERSION, id,
  error: data !== undefined ? { code, message, data } : { code, message }
});
const textContent = text => ({ type: 'text', text: String(text == null ? '' : text) });
const jsonContent = value => ({ type: 'text', text: JSON.stringify(value, null, 2) });

function toolResult(content, { isError = false } = {}) {
  const blocks = Array.isArray(content) ? content : [content];
  return { content: blocks, isError };
}
function toolError(message) { return toolResult(textContent(message), { isError: true }); }

function mcpError(code, message, data) {
  const e = new Error(message);
  e.mcpCode = code;
  if (data !== undefined) e.data = data;
  return e;
}

;

export { JSONRPC_VERSION, MCP_VERSION, SERVER_NAME, SERVER_VERSION, ERROR_CODES, successResponse, errorResponse, textContent, jsonContent, toolResult, toolError, mcpError };
