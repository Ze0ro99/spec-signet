import test from 'node:test';
import assert from 'node:assert/strict';
import { certificate, register, revokeCertificate } from '../../src/keys/certs.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';
import { Registry } from '../../src/core/registry.js';

test('revocation certificate takes effect at its timestamp', () => {
  const issuer = generateKeyPair();
  const appKey = generateKeyPair();
  const registry = new Registry({ issuerPublicKey: issuer.publicKey });
  registry.addApp('app.marketplace', 'secret');
  register(registry, certificate({
    op: 'register', app_id: 'app.marketplace', key_id: 'k1', pubkey: appKey.publicKey,
  }, issuer.privateKey));
  revokeCertificate(registry, certificate({
    op: 'revoke', app_id: 'app.marketplace', key_id: 'k1', revoked_at_ms: 100,
  }, issuer.privateKey));
  assert.equal(registry.getKey('app.marketplace', 'k1').revoked_at_ms, 100);
});