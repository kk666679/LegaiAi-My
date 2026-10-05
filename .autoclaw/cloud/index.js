import { OAuthClient } from './auth/oauth-client.js';
import { TokenStore } from './auth/token-store.js';
import { MCPFederation } from './federation/mcp-federation.js';

export class AutoClawCloud {
  constructor({ config = {} }) {
    this.config = {
      issuer: config.issuer ?? 'https://auth.farms.dev',
      clientId: config.clientId ?? process.env.AUTOCLAW_CLIENT_ID,
      redirectUri: config.redirectUri ?? 'http://localhost:9600/callback',
      scopes: config.scopes ?? ['agent:read', 'agent:write', 'mcp:invoke'],
      tokenStorePath: config.tokenStorePath ?? '.autoclaw/cloud/tokens.json',
      relayEndpoint: config.relayEndpoint ?? process.env.AUTOCLAW_RELAY_ENDPOINT,
    };

    this.authClient = new OAuthClient({
      issuer: this.config.issuer,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
    });

    this.tokenStore = new TokenStore({ path: this.config.tokenStorePath });
    this.federation = new MCPFederation({
      relay: this,
      auth: this.authClient,
    });
  }

  async login() {
    try {
      const tokens = await this.authClient.authorizeWithPKCE();
      tokens.ts = Date.now();
      await this.tokenStore.save(tokens);
      console.log('[cloud] ✓ Authentication successful');
      return { authenticated: true, expiresIn: tokens.expires_in };
    } catch (error) {
      console.error('[cloud] Login failed:', error.message);
      throw error;
    }
  }

  async logout() {
    await this.tokenStore.clear();
    this.authClient.tokens = null;
    console.log('[cloud] ✓ Logged out');
    return { authenticated: false };
  }

  async ensureAuthenticated() {
    if (!this.authClient.tokens) {
      const stored = await this.tokenStore.load();
      if (stored) {
        this.authClient.tokens = stored;
      }
    }

    if (!this.authClient.tokens) {
      throw new Error('Not authenticated. Run "autoclaw cloud login" first.');
    }

    await this.authClient.ensureFreshToken();
  }

  async forward({ target, message, headers = {} }) {
    // In a real implementation, would forward to actual relay service
    console.log(`[cloud] Forward to ${target}: ${message.method}`);
    return { status: 'forwarded' };
  }

  async federateMCP({ servers }) {
    await this.federation.register(servers);
    return this.federation.getStatus();
  }

  async listRemoteTools() {
    return this.federation.listTools();
  }

  async invokeTool(fullyQualifiedName, args) {
    return this.federation.invoke(fullyQualifiedName, args);
  }

  async health() {
    try {
      await this.ensureAuthenticated();
      return {
        authenticated: true,
        serverStatus: this.federation.getStatus(),
      };
    } catch {
      return { authenticated: false };
    }
  }

  async status() {
    return this.health();
  }
}

export { OAuthClient } from './auth/oauth-client.js';
export { TokenStore } from './auth/token-store.js';
export { MCPFederation } from './federation/mcp-federation.js';
