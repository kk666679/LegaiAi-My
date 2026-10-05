"use strict";
/**
 * spine/sign.ts — Cryptographic signature verification for the AutoClaw spine.
 *
 * Provides Ed25519 envelope verification for remote control commands.
 * This module is vscode-free and depends only on Node's built-in crypto module.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const crypto = require("crypto");

/**
 * Verify an Ed25519 signature over a canonical envelope.
 *
 * @param carrier - The envelope object that was signed (command or commandFile)
 * @param signatureB64 - Base64url-encoded Ed25519 signature
 * @param now - Current time for timestamp validation
 * @returns { ok: boolean, reason?: string }
 */
function verifyEnvelope(carrier, signatureB64, now) {
  if (!carrier || typeof carrier !== "object") {
    return { ok: false, reason: "carrier must be an object" };
  }

  if (!signatureB64 || typeof signatureB64 !== "string") {
    return { ok: false, reason: "signature must be a base64url string" };
  }

  // Verify the carrier has required fields for signing
  if (!carrier.command_id || typeof carrier.command_id !== "string") {
    return { ok: false, reason: "carrier missing command_id" };
  }

  if (!carrier.issued_at || !Number.isFinite(carrier.issued_at)) {
    return { ok: false, reason: "carrier missing issued_at timestamp" };
  }

  if (!carrier.expires_at || !Number.isFinite(carrier.expires_at)) {
    return { ok: false, reason: "carrier missing expires_at timestamp" };
  }

  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowMs)) {
    return { ok: false, reason: "invalid timestamp" };
  }

  // Check expiration
  if (carrier.expires_at <= nowMs) {
    return { ok: false, reason: "envelope expired" };
  }

  // Check not-before (issued_at should be in the past or now)
  if (carrier.issued_at > nowMs + 60000) { // 60s clock skew tolerance
    return { ok: false, reason: "envelope issued in future" };
  }

  // Decode signature
  let signature;
  try {
    signature = Buffer.from(signatureB64, "base64url");
  } catch {
    return { ok: false, reason: "invalid base64url signature" };
  }

  if (signature.length !== 64) {
    return { ok: false, reason: "Ed25519 signature must be 64 bytes" };
  }

  // Get public key from environment or carrier
  const publicKeyB64 = process.env.AUTOCLAW_TRUSTED_PUBLIC_KEY;
  if (!publicKeyB64) {
    return { ok: false, reason: "no trusted public key configured (AUTOCLAW_TRUSTED_PUBLIC_KEY)" };
  }

  let publicKeyDer;
  try {
    publicKeyDer = Buffer.from(publicKeyB64, "base64url");
  } catch {
    return { ok: false, reason: "invalid public key encoding" };
  }

  // Build canonical signing input (deterministic JSON)
  const signingInput = canonicalize(carrier);
  const signingInputBytes = Buffer.from(signingInput, "utf8");

  // Create public key object for verification (SPKI DER format)
  let publicKeyObj;
  try {
    publicKeyObj = crypto.createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });
  } catch {
    return { ok: false, reason: "invalid public key format" };
  }

  // Verify signature using Node's built-in crypto
  let verified;
  try {
    verified = crypto.verify(
      null,  // Ed25519 doesn't use a digest
      signingInputBytes,
      publicKeyObj,
      signature
    );
  } catch (e) {
    return { ok: false, reason: `verification error: ${e.message}` };
  }

  if (!verified) {
    return { ok: false, reason: "signature verification failed" };
  }

  return { ok: true };
}

/**
 * Canonicalize an object for deterministic signing.
 * Sorts keys, removes undefined values, uses compact JSON.
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalize).join(",") + "]";
  }

  const keys = Object.keys(obj).sort();
  const parts = [];
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined) continue; // Skip undefined
    parts.push(JSON.stringify(key) + ":" + canonicalize(value));
  }
  return "{" + parts.join(",") + "}";
}

/**
 * Generate a key pair for testing (not for production use)
 */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  // Keep full SPKI DER for both signing and verification
  return {
    publicKey: publicKey.toString("base64url"),
    privateKey: privateKey.toString("base64url"),
  };
}

/**
 * Sign an envelope (for testing only - production should use secure HSM)
 */
function signEnvelope(carrier, privateKeyB64) {
  const privateKeyDer = Buffer.from(privateKeyB64, "base64url");
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: "der",
    type: "pkcs8",
  });
  const signingInput = canonicalize(carrier);
  const signingInputBytes = Buffer.from(signingInput, "utf8");
  // Ed25519 doesn't use a digest algorithm - pass null
  const signature = crypto.sign(null, signingInputBytes, privateKey);
  return signature.toString("base64url");
}

exports.verifyEnvelope = verifyEnvelope;
exports.canonicalize = canonicalize;
exports.generateKeyPair = generateKeyPair;
exports.signEnvelope = signEnvelope;