import test from 'node:test';
import assert from 'node:assert/strict';
import { Registry } from '../../src/core/registry.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';
import { certificate, register, revoke } from '../../src/keys/certs.js';

test('register a key and verify', () => {
  const issuerKey = generateKeyPair();
  const reg = new Registry();
  reg.issuerPublicKey = issuerKey.publicKey;
  const appKey = generateKeyPair();
  reg.addApp('app.test', 'secret');
  const cert = certificate({ spec: 'SIGNET-KEY-v1', op: 'register', app_id: 'app.test', key_id: 'k1', pubkey: appKey.publicKey, not_before_ms: 0, not_after_ms: Date.now() + 86400000, issuer: 'registry' }, issuerKey.privateKey);
  const result = register(reg, cert);
  assert(result.signature);
});

test('revoke a key and verify it fails', () => {
  const issuerKey = generateKeyPair();
  const reg = new Registry();
  reg.issuerPublicKey = issuerKey.publicKey;
  const appKey = generateKeyPair();
  reg.addApp('app.test', 'secret');
  const cert = certificate({ spec: 'SIGNET-KEY-v1', op: 'register', app_id: 'app.test', key_id: 'k1', pubkey: appKey.publicKey, not_before_ms: 0, not_after_ms: Date.now() + 86400000, issuer: 'registry' }, issuerKey.privateKey);
  register(reg, cert);
  revoke(reg, 'app.test', 'k1', Date.now());
  const key = reg.getKey('app.test', 'k1');
  assert(key.revoked_at_ms > 0);
});
