import { DOMAINS } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';

const CERTIFICATE_FIELDS = new Set([
  'spec', 'op', 'app_id', 'key_id', 'pubkey', 'not_before_ms',
  'expires_at_ms', 'previous_key_id', 'overlap_until_ms', 'revoked_at_ms',
]);

export function certificate(body, issuerKey) {
  return {
    spec: 'SIGNET-KEY-v1',
    ...body,
    signature: sign({ spec: 'SIGNET-KEY-v1', ...body }, issuerKey, DOMAINS.KEY),
  };
}

export function verifyCertificate(cert, issuerPublicKey) {
  if (!issuerPublicKey || !cert || cert.spec !== 'SIGNET-KEY-v1' || !cert.signature) return false;
  const { signature, ...body } = cert;
  if ([...Object.keys(body)].some((field) => !CERTIFICATE_FIELDS.has(field))) return false;
  return verifySignature(body, signature, issuerPublicKey, DOMAINS.KEY);
}

export function register(reg, cert) {
  if (!verifyCertificate(cert, reg.issuerPublicKey)) throw Error('KEY_CERTIFICATE_INVALID');
  if (!['register', 'rotate'].includes(cert.op) || !cert.app_id || !cert.key_id || !cert.pubkey) {
    throw Error('KEY_CERTIFICATE_INVALID');
  }
  const current = reg.getKey(cert.app_id, cert.key_id);
  if (current) throw Error('KEY_ALREADY_REGISTERED');
  if (cert.op === 'rotate') {
    const previous = reg.getKey(cert.app_id, cert.previous_key_id);
    if (!previous || cert.overlap_until_ms == null) throw Error('KEY_ROTATION_INVALID');
  }
  reg.addKey(cert.app_id, cert);
  return cert;
}

export function revokeCertificate(reg, cert) {
  if (!verifyCertificate(cert, reg.issuerPublicKey) || cert.op !== 'revoke') {
    throw Error('KEY_CERTIFICATE_INVALID');
  }
  if (!reg.revoke(cert.app_id, cert.key_id, cert.revoked_at_ms)) throw Error('UNKNOWN_KEY');
  return cert;
}

export const revoke = (reg, app, id, at) => reg.revoke(app, id, at);
