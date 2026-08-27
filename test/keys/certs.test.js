import test from 'node:test';
import assert from 'node:assert/strict';
import { certificate, register, revokeCertificate, verifyCertificate } from '../../src/keys/certs.js';
import { generateKeyPair, sign } from '../../src/core/keys-crypto.js';
import { Registry } from '../../src/core/registry.js';
import { fixture, NOW } from '../helpers/fixtures.js';

test('register, rotate, overlap, and instantly revoke app keys', () => {
  const issuer = generateKeyPair();
  const appKey = generateKeyPair();
  const nextKey = generateKeyPair();
  const registry = new Registry({ issuerPublicKey: issuer.publicKey });
  registry.addApp('app.marketplace', 'secret');

  const first = certificate({
    op: 'register',
    app_id: 'app.marketplace',
    key_id: 'k1',
    pubkey: appKey.publicKey,
    not_before_ms: NOW - 1000,
  }, issuer.privateKey);
  assert.equal(verifyCertificate(first, issuer.publicKey), true);
  register(registry, first);

  const rotated = certificate({
    op: 'rotate',
    app_id: 'app.marketplace',
    key_id: 'k2',
    pubkey: nextKey.publicKey,
    previous_key_id: 'k1',
    not_before_ms: NOW,
    overlap_until_ms: NOW + 60000,
  }, issuer.privateKey);
  register(registry, rotated);
  assert.equal(registry.getKey('app.marketplace', 'k1').pubkey, appKey.publicKey);
  assert.equal(registry.getKey('app.marketplace', 'k2').pubkey, nextKey.publicKey);

  const revoke = certificate({
    op: 'revoke',
    app_id: 'app.marketplace',
    key_id: 'k1',
    revoked_at_ms: NOW,
  }, issuer.privateKey);
  revokeCertificate(registry, revoke);
  assert.equal(registry.getKey('app.marketplace', 'k1').revoked_at_ms, NOW);
});

test('duplicate and forged certificates are rejected', () => {
  const issuer = generateKeyPair();
  const registry = new Registry({ issuerPublicKey: issuer.publicKey });
  registry.addApp('app.marketplace', 'secret');
  const appKey = generateKeyPair();
  const cert = certificate({
    op: 'register', app_id: 'app.marketplace', key_id: 'k1', pubkey: appKey.publicKey,
  }, issuer.privateKey);
  register(registry, cert);
  assert.throws(() => register(registry, cert), /KEY_ALREADY_REGISTERED/);
  const forged = { ...cert, key_id: 'k2' };
  assert.throws(() => register(registry, forged), /KEY_CERTIFICATE_INVALID/);
});

test('certificate signatures are domain separated from engagement signatures', () => {
  const issuer = generateKeyPair();
  const body = { op: 'register', app_id: 'app.marketplace', key_id: 'k1' };
  const forged = { spec: 'SIGNET-KEY-v1', ...body, signature: sign(body, issuer.privateKey) };
  assert.equal(verifyCertificate(forged, issuer.publicKey), false);
});

test('fixture remains usable for app-key verification', async () => {
  const f = fixture();
  assert.equal(f.registry.getKey('app.marketplace', 'k1').pubkey, f.key.publicKey);
});