import { promises as fs } from 'fs';

const DEFAULT_CONFIG = {
  healthPort: 9501,
  socketPath: '/tmp/autoclawd.sock',
  ledgerPath: '.autoclaw/budget/ledger.jsonl',
  relayEndpoint: 'http://localhost:9500',
  issuer: 'https://auth.example.com',
  clientId: 'autoclaw-cli',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['agent:read', 'agent:write', 'mcp:invoke'],
};

export async function loadConfig() {
  try {
    const path = '.autoclaw/cli/config.json';
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG;
  }
}