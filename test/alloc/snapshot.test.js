import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, verifySnapshot } from '../../src/alloc/snapshot.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';

test('allocation snapshots are deterministic and exclude denied evidence', () => {
  const key = generateKeyPair();
  const events = [
    { app_id: 'b', weight: 2, alloc_eligible: true, evidence_id: 'sha256:b' },
    { app_id: 'a', weight: 100, alloc_eligible: false, evidence_id: 'sha256:a' },
    { app_id: 'a', weight: 1, alloc_eligible: true, evidence_id: 'sha256:a-accepted' },
  ];
  const first = snapshot(events, { POLICY_WEIGHT: 1, REPLAY_DETECTED: 2 }, 'epoch-1', key.privateKey, 1764000000000);
  const second = snapshot([...events].reverse(), { REPLAY_DETECTED: 2, POLICY_WEIGHT: 1 }, 'epoch-1', key.privateKey, 1764000000000);
  assert.deepEqual(first, second);
  assert.deepEqual(first.allocations.map((item) => item.evidence_id), ['sha256:a-accepted', 'sha256:b']);
  assert.equal(first.allocations[0].normalized_weight, 1 / 3);
  assert.equal(first.allocations[1].normalized_weight, 2 / 3);
  assert.equal(verifySnapshot(first, key.publicKey), true);
});