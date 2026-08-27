import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardSnapshot, verifyDashboardSnapshot } from '../../src/transparency/dashboard.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';

const common = {
  registry_epoch: 'epoch-1',
  issued_at_ms: 1764000000000,
  engagement: { leaderboard: [], consistency_note: 'test' },
  alloc: { allocations: [{ weight: 2 }], reject_counts: { REPLAY_DETECTED: 1 } },
};

test('same dashboard inputs produce identical signed bytes', () => {
  const key = generateKeyPair();
  const inputs = {
    ...common,
    escrow: { status: 'ATTESTED', code: 'ATTESTED', claim: { escrow_id: 'e1' } },
    pfloor: { status: 'ATTESTED', code: 'ATTESTED', numerator: '1', denominator: '400', method_id: 'circulating-v1' },
    pool: { status: 'ATTESTED', code: 'K_OK', k: '10000' },
  };
  const first = buildDashboardSnapshot(inputs, key.privateKey);
  const second = buildDashboardSnapshot(inputs, key.privateKey);
  assert.deepEqual(first, second);
  assert.equal(verifyDashboardSnapshot(first, key.publicKey), true);
});

test('missing floor is unverifiable and never invents a number', () => {
  const result = buildDashboardSnapshot({
    ...common,
    escrow: null,
    pfloor: null,
    pool: null,
    raw_reserves: ['R', 'S', 'Q'],
  });
  assert.deepEqual(result.pfloor, { status: 'UNVERIFIABLE', code: 'DASH_UNVERIFIABLE_INPUT' });
  assert.deepEqual(result.unverified_inputs, ['R', 'S', 'Q']);
  assert.equal('numerator' in result.pfloor, false);
});

test('dashboard is not a crypto decision engine', () => {
  const result = buildDashboardSnapshot({
    ...common,
    escrow: null,
    pfloor: null,
    pool: null,
  });
  assert.equal('crypto' in result, false);
  assert.equal(JSON.stringify(result).includes('"ALLOW"'), false);
});