'use strict';

function buildCapabilities({ tools, resources, prompts } = {}) {
  const caps = {};
  if (tools && typeof tools.size === 'function' && tools.size() > 0) {
    caps.tools = { listChanged: false };
  }
  if (resources && typeof resources.size === 'function' && resources.size() > 0) {
    caps.resources = { subscribe: false, listChanged: false };
  }
  if (prompts && typeof prompts.size === 'function' && prompts.size() > 0) {
    caps.prompts = { listChanged: false };
  }
  caps.logging = {};
  return caps;
}

module.exports = { buildCapabilities };
