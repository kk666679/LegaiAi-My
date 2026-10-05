import { createHash, randomBytes } from 'crypto';

export class OAuthClient {
  constructor({ issuer, clientId, redirectUri, scopes = [] }) {
    this.issuer = issuer;
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
    this.discovery = null;
    this.tokens = null;
  }

  async discover() {
    if (this.discovery) return this.discovery;

    try {
      const res = await fetch(`${this.issuer}/.well-known/openid-configuration`);
      this.discovery = await res.json();
      return this.discovery;
    } catch (error) {
      console.error('[cloud] OIDC discovery failed:', error.message);
      throw error;
    }
  }

  async authorizeWithPKCE() {
    const { authorization_endpoint, token_endpoint } = await this.discover();

    const codeVerifier = this.base64URLEncode(randomBytes(32));
    const codeChallenge = this.base64URLEncode(
      createHash('sha256').update(codeVerifier).digest()
    );
    const state = this.base64URLEncode(randomBytes(16));

    const authUrl = new URL(authorization_endpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', this.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log(`[cloud] Open in browser: ${authUrl.toString()}`);

    // Simulate callback (in real implementation, would set up local server)
    const code = await this.waitForCallback({ state });

    const tokenRes = await fetch(token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      throw new Error(`Token error: ${tokens.error_description}`);
    }

    this.tokens = tokens;
    return tokens;
  }

  async waitForCallback({ state }) {
    // In a real implementation, this would spin up a local HTTP server
    // and wait for the OAuth callback
    console.log('[cloud] Waiting for OAuth callback...');
    // Simulate user opening browser and authorizing
    return `code-${Math.random().toString(36).slice(2)}`;
  }

  base64URLEncode(buf) {
    return buf
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async ensureFreshToken() {
    if (!this.tokens) {
      throw new Error('Not authenticated. Run "autoclaw cloud login" first.');
    }

    const expiresAt = this.tokens.ts + this.tokens.expires_in * 1000;
    if (expiresAt - Date.now() > 60000) {
      return this.tokens.access_token;
    }

    return this.refresh();
  }

  async refresh() {
    if (!this.tokens || !this.tokens.refresh_token) {
      throw new Error('Cannot refresh: no refresh token');
    }

    const { token_endpoint } = await this.discover();

    const res = await fetch(token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refresh_token,
        client_id: this.clientId,
      }),
    });

    const tokens = await res.json();
    if (tokens.error) {
      throw new Error(`Refresh failed: ${tokens.error_description}`);
    }

    tokens.ts = Date.now();
    this.tokens = tokens;
    return tokens.access_token;
  }

  getToken() {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }
    return this.tokens.access_token;
  }
}
