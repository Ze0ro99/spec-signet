import test from 'node:test';
import assert from 'node:assert/strict';
import { createEscrowClaim, createFloorClaim, verifyEscrow, verifyFloor } from '../../src/transparency/claims.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';

const epoch = 'epoch-1';

test('valid escrow and floor claims are attested in their own domains', () => {
  const key = generateKeyPair();
  const escrow = createEscrowClaim({
    registry_epoch: epoch,
    escrow_id: 'escrow-2026-01',
    locked_until_ms: 1765000000000,
    amount_commitment: 'sha256:escrow-commitment',
    issued_at_ms: 1764000000000,
  }, key.privateKey);
  const floor = createFloorClaim({
    registry_epoch: epoch,
    floor_id: 'floor-2026-01',
    floor_value: 100,
    valid_from_ms: 1764000000000,
    valid_until_ms: 1765000000000,
    issued_at_ms: 1764000000000,
  }, key.privateKey);
  assert.equal(verifyEscrow(escrow, key.publicKey, epoch), 'attested_claim');
  assert.equal(verifyFloor(floor, key.publicKey, epoch), 'attested_claim');
  assert.equal(verifyFloor(escrow, key.publicKey, epoch), 'UNVERIFIABLE');
});

test('bad, stale, and malformed transparency claims are unverifiable', () => {
  const key = generateKeyPair();
  const claim = createFloorClaim({
    registry_epoch: epoch,
    floor_id: 'floor-2026-01',
    floor_value: 100,
    valid_from_ms: 1764000000000,
    valid_until_ms: 1765000000000,
    issued_at_ms: 1764000000000,
  }, key.privateKey);
  assert.equal(verifyFloor({ ...claim, registry_epoch: 'epoch-old' }, key.publicKey, epoch), 'UNVERIFIABLE');
  assert.equal(verifyFloor({ ...claim, floor_value: -1 }, key.publicKey, epoch), 'UNVERIFIABLE');
  assert.equal(verifyFloor({ ...claim, signature: `A${claim.signature.slice(1)}` }, key.publicKey, epoch), 'UNVERIFIABLE');
});