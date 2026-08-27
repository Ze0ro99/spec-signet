import { createHash } from 'node:crypto';
import { DOMAINS, unb64 } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';

const STATUSES = new Set(['LOCKED', 'UNLOCKED', 'SIGNING_AUTHORITY_REVOKED']);
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

export function keyFingerprint(publicKey) {
  return `sha256:${createHash('sha256').update(unb64(publicKey)).digest('hex')}`;
}

export function createEscrowAttestation(body, privateKey) {
  const payload = { spec: 'SIGNET-ESCROW-v1', ...body };
  return { ...payload, signature: sign(payload, privateKey, DOMAINS.ESCROW) };
}

function validShape(claim) {
  const fields = [
    'spec', 'status', 'escrow_id', 'key_id', 'key_fingerprint',
    'revoked_at_ms', 'as_of_ms', 'registry_epoch', 'nonce', 'anchor',
    'issuer', 'signature',
  ];
  return claim && typeof claim === 'object' && !Array.isArray(claim)
    && !Object.keys(claim).some((field) => !fields.includes(field))
    && fields.every((field) => field in claim)
    && claim.spec === 'SIGNET-ESCROW-v1'
    && STATUSES.has(claim.status)
    && typeof claim.escrow_id === 'string' && claim.escrow_id.length > 0
    && typeof claim.key_id === 'string' && claim.key_id.length > 0
    && typeof claim.key_fingerprint === 'string'
    && integer(claim.revoked_at_ms) && integer(claim.as_of_ms)
    && typeof claim.registry_epoch === 'string' && claim.registry_epoch.length > 0
    && typeof claim.nonce === 'string' && claim.nonce.length >= 16
    && (claim.anchor === null || typeof claim.anchor === 'string')
    && typeof claim.issuer === 'string' && claim.issuer.length > 0
    && typeof claim.signature === 'string';
}

function verdict(code, claim = null) {
  return { status: code === 'ATTESTED' ? 'ATTESTED' : 'UNVERIFIABLE', code, claim };
}

export async function verifyEscrowAttestation(
  claim,
  { publicKey, epoch, nowMs, maxAgeMs = 300000, nonceStore, expectedFingerprint } = {},
) {
  if (!validShape(claim) || !publicKey) return verdict('UNVERIFIABLE');
  const { signature, ...body } = claim;
  if (claim.registry_epoch !== epoch || !verifySignature(body, signature, publicKey, DOMAINS.ESCROW)) {
    return verdict('UNVERIFIABLE');
  }
  if (Math.abs(claim.as_of_ms - (nowMs ?? Date.now())) > maxAgeMs) return verdict('ESCROW_STALE');
  if (expectedFingerprint && claim.key_fingerprint !== expectedFingerprint) return verdict('ESCROW_FINGERPRINT');
  if (nonceStore && !await nonceStore.claimIfAbsent(`escrow:${claim.escrow_id}`, claim.nonce)) {
    return verdict('ESCROW_REPLAY');
  }
  return verdict('ATTESTED', claim);
}