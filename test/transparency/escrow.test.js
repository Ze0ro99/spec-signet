import test from 'node:test';
import assert from 'node:assert/strict';
import { keyFingerprint, createEscrowAttestation, verifyEscrowAttestation } from '../../src/transparency/escrow.js';
import { generateKeyPair, sign } from '../../src/core/keys-crypto.js';
import { InMemoryNonceStore } from '../../src/core/nonces.js';

const now = 1764000000000;

function claim(key) {
  return createEscrowAttestation({
    status: 'SIGNING_AUTHORITY_REVOKED',
    escrow_id: 'launchpad.escrow.main',
    key_id: 'escrow-k1',
    key_fingerprint: keyFingerprint(key.publicKey),
    revoked_at_ms: now - 1000,
    as_of_ms: now,
    registry_epoch: 'epoch-1',
    nonce: 'escrow-test-nonce-1',
    anchor: null,
    issuer: 'launchpad',
  }, key.privateKey);
}

test('valid revoked escrow attestation is ATTESTED', async () => {
  const key = generateKeyPair();
  const result = await verifyEscrowAttestation(claim(key), {
    publicKey: key.publicKey,
    epoch: 'epoch-1',
    nowMs: now,
    nonceStore: new InMemoryNonceStore(),
    expectedFingerprint: keyFingerprint(key.publicKey),
  });
  assert.deepEqual({ status: result.status, code: result.code }, { status: 'ATTESTED', code: 'ATTESTED' });
});

test('escrow freshness, nonce, and fingerprint checks are exact', async () => {
  const key = generateKeyPair();
  const stale = await verifyEscrowAttestation(claim(key), {
    publicKey: key.publicKey, epoch: 'epoch-1', nowMs: now + 300001,
  });
  assert.equal(stale.code, 'ESCROW_STALE');
  const store = new InMemoryNonceStore();
  const first = await verifyEscrowAttestation(claim(key), {
    publicKey: key.publicKey, epoch: 'epoch-1', nowMs: now, nonceStore: store,
  });
  const replay = await verifyEscrowAttestation(claim(key), {
    publicKey: key.publicKey, epoch: 'epoch-1', nowMs: now, nonceStore: store,
  });
  assert.equal(first.code, 'ATTESTED');
  assert.equal(replay.code, 'ESCROW_REPLAY');
  const mismatch = await verifyEscrowAttestation(claim(key), {
    publicKey: key.publicKey, epoch: 'epoch-1', nowMs: now, expectedFingerprint: 'sha256:wrong',
  });
  assert.equal(mismatch.code, 'ESCROW_FINGERPRINT');
});

test('escrow claims signed in another domain are unverifiable', async () => {
  const key = generateKeyPair();
  const body = claim(key);
  const { signature, ...unsigned } = body;
  const wrong = { ...unsigned, signature: sign(unsigned, key.privateKey) };
  const result = await verifyEscrowAttestation(wrong, { publicKey: key.publicKey, epoch: 'epoch-1', nowMs: now });
  assert.equal(result.code, 'UNVERIFIABLE');
});