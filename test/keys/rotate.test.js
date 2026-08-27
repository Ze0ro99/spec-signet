import test from 'node:test';
import assert from 'node:assert/strict';
import { certificate, register } from '../../src/keys/certs.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';
import { Registry } from '../../src/core/registry.js';

test('rotation registers a new key with an explicit overlap window', () => {
  const issuer = generateKeyPair();
  const registry = new Registry({ issuerPublicKey: issuer.publicKey });
  registry.addApp('app.marketplace', 'secret');
  const first = generateKeyPair();
  const next = generateKeyPair();
  register(registry, certificate({
    op: 'register', app_id: 'app.marketplace', key_id: 'k1', pubkey: first.publicKey,
  }, issuer.privateKey));
  register(registry, certificate({
    op: 'rotate', app_id: 'app.marketplace', key_id: 'k2', pubkey: next.publicKey,
    previous_key_id: 'k1', overlap_until_ms: 1764000060000,
  }, issuer.privateKey));
  assert.ok(registry.getKey('app.marketplace', 'k1'));
  assert.ok(registry.getKey('app.marketplace', 'k2'));
});