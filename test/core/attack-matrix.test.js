import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyEngagement } from '../../src/core/verify.js';
import { fixture, signEvent } from '../helpers/fixtures.js';

const cases = [
  ['unknown app', (f) => signEvent({ ...f.body, app_id: 'app.unknown' }, f.key), 'UNKNOWN_APP'],
  ['unknown key', (f) => signEvent({ ...f.body, key_id: 'k2' }, f.key), 'UNKNOWN_KEY'],
  ['key not yet valid', (f) => {
    f.registry.getKey('app.marketplace', 'k1').not_before_ms = f.ctx.nowMs + 1;
    return f.event;
  }, 'KEY_NOT_YET_VALID'],
  ['expired key', (f) => {
    f.registry.getKey('app.marketplace', 'k1').expires_at_ms = f.ctx.nowMs;
    return f.event;
  }, 'EXPIRED_KEY'],
  ['revoked key', (f) => {
    f.registry.revoke('app.marketplace', 'k1', f.ctx.nowMs);
    return f.event;
  }, 'REVOKED_KEY'],
  ['invalid signature', (f) => ({
    ...f.event,
    signature: `${f.event.signature[0] === 'B' ? 'C' : 'B'}${f.event.signature.slice(1)}`,
  }), 'INVALID_SIGNATURE'],
  ['malformed signature', (f) => ({ ...f.event, signature: 'x'.repeat(80) }), 'INVALID_SIGNATURE'],
  ['expired timestamp', (f) => signEvent({ ...f.body, timestamp_ms: f.ctx.nowMs - 300001 }, f.key), 'TIMESTAMP_EXPIRED'],
  ['future timestamp', (f) => signEvent({ ...f.body, timestamp_ms: f.ctx.nowMs + 300001 }, f.key), 'TIMESTAMP_IN_FUTURE'],
  ['class ceiling overflow', (f) => signEvent({ ...f.body, weight: 101 }, f.key), 'WEIGHT_OVERFLOW'],
  ['missing KYC', (f) => {
    f.registry.addUser(f.uid, { kyc: false, mainnet: true });
    return f.event;
  }, 'INELIGIBLE_USER'],
  ['missing Mainnet eligibility', (f) => {
    f.registry.addUser(f.uid, { kyc: true, mainnet: false });
    return f.event;
  }, 'INELIGIBLE_USER'],
  ['unknown pioneer', (f) => signEvent({
    ...f.body,
    pioneer_uid_hash: 'h1:dW5rbm93bg==',
  }, f.key), 'INELIGIBLE_USER'],
  ['payload eligibility flag', (f) => ({ ...f.event, eligible: true }), 'SCHEMA'],
  ['PEP floor field', (f) => ({ ...f.event, p_floor: 1 }), 'SCHEMA'],
  ['unsupported spec', (f) => ({ ...f.event, spec: 'SIGNET-PEP-v2' }), 'SCHEMA'],
  ['invalid utility class', (f) => ({ ...f.event, utility_class: 'D' }), 'SCHEMA'],
  ['fractional weight', (f) => ({ ...f.event, weight: 1.5 }), 'SCHEMA'],
  ['short nonce', (f) => ({ ...f.event, nonce: 'short' }), 'SCHEMA'],
  ['invalid UID hash', (f) => ({ ...f.event, pioneer_uid_hash: 'raw-uid' }), 'SCHEMA'],
  ['replay', async (f) => {
    await verifyEngagement(f.event, f.ctx);
    return f.event;
  }, 'REPLAY_DETECTED'],
];

test('the core attack matrix returns exact denial codes', async () => {
  for (const [name, build, expected] of cases) {
    const f = fixture();
    const event = await build(f);
    const result = await verifyEngagement(event, f.ctx);
    assert.equal(result.code, expected, name);
    assert.deepEqual(Object.keys(result).sort(), ['code', 'crypto', 'evidence_id', 'registry_epoch'].sort(), `${name} result shape`);
  }
});

test('nonce races have exactly one winner', async () => {
  const f = fixture();
  const results = await Promise.all(
    Array.from({ length: 32 }, () => verifyEngagement(f.event, f.ctx)),
  );
  assert.equal(results.filter((result) => result.code === 'OK').length, 1);
  assert.equal(results.filter((result) => result.code === 'REPLAY_DETECTED').length, 31);
});