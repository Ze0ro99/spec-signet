import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, sign } from '../../src/core/keys-crypto.js';
import { Registry } from '../../src/core/registry.js';
import { InMemoryNonceStore } from '../../src/core/nonces.js';
import { verifyEngagement } from '../../src/core/verify.js';

function fixture() {
  const kp = generateKeyPair(); const r = new Registry(); r.addApp('app.marketplace', 'secret'); r.addKey('app.marketplace', { key_id: 'k1', pubkey: kp.publicKey });
  const uid = r.uidHash('app.marketplace', 'pioneer-1'); r.addUser(uid);
  const body = { spec: 'SIGNET-PEP-v1', app_id: 'app.marketplace', key_id: 'k1', pioneer_uid_hash: uid, action_id: 'retail.order_delivered', utility_class: 'A', weight: 50, timestamp_ms: 1000, nonce: 'nonce-1234567890' };
  const ctx = { registry: r, nonceStore: new InMemoryNonceStore(), nowMs: 1000, maxSkewMs: 100, classCeilings: { A: 100, B: 20, C: 5 } };
  return { kp, r, body, event: { ...body, signature: sign(body, kp.privateKey) }, ctx };
}
const cases = [
  ['forged signature', (x) => ({ ...x, signature: 'x'.repeat(88) }), 'INVALID_SIGNATURE'],
  ['post-sign mutation', (x) => ({ ...x, weight: 51 }), 'INVALID_SIGNATURE'],
  ['stale timestamp', (x) => ({ ...x, timestamp_ms: 1, signature: sign({ ...x, timestamp_ms: 1 }, f.kp.privateKey) }), 'TIMESTAMP_EXPIRED'],
  ['future timestamp', (x) => ({ ...x, timestamp_ms: 10000, signature: sign({ ...x, timestamp_ms: 10000 }, f.kp.privateKey) }), 'TIMESTAMP_IN_FUTURE'],
  ['weight overflow', (x) => ({ ...x, weight: 101, signature: sign({ ...x, weight: 101 }, f.kp.privateKey) }), 'WEIGHT_OVERFLOW'],
  ['unknown app', (x) => ({ ...x, app_id: 'unknown', signature: sign({ ...x, app_id: 'unknown' }, f.kp.privateKey) }), 'UNKNOWN_APP'],
  ['unknown key', (x) => ({ ...x, key_id: 'missing' }), 'UNKNOWN_KEY'],
  ['bad spec', (x) => ({ ...x, spec: 'BAD', signature: sign({ ...x, spec: 'BAD' }, f.kp.privateKey) }), 'SCHEMA'],
  ['extra field', (x) => ({ ...x, eligible: true }), 'SCHEMA'],
  ['missing field', (x) => { const { signature, ...b } = x; delete b.weight; return { ...b, signature: sign(b, f.kp.privateKey) }; }, 'SCHEMA'],
  ['unregistered pioneer', (x) => ({ ...x, pioneer_uid_hash: 'h1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', signature: sign({ ...x, pioneer_uid_hash: 'h1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' }, f.kp.privateKey) }), 'INELIGIBLE_USER'],
];

test('valid event then replay is denied', async () => { const f=fixture(); assert.equal((await verifyEngagement(f.event, f.ctx)).code, 'OK'); assert.equal((await verifyEngagement(f.event, f.ctx)).code, 'REPLAY_DETECTED'); });
for (const [name, mutate, expected] of cases) test(name, async () => { const f=fixture(); const event = mutate(f.event, f); assert.equal((await verifyEngagement(event, f.ctx)).code, expected); });
test('bad signature is schema-valid and denied as INVALID_SIGNATURE', async () => { const f=fixture(); const event = { ...f.event, signature: 'x'.repeat(88) }; assert.equal((await verifyEngagement(event, f.ctx)).code, 'INVALID_SIGNATURE'); });
test('KYC mismatch is denied', async () => { const f=fixture(); f.r.users.set(f.event.pioneer_uid_hash, { kyc: false, mainnet: true }); assert.equal((await verifyEngagement(f.event, f.ctx)).code, 'INELIGIBLE_USER'); });
test('Mainnet mismatch is denied', async () => { const f=fixture(); f.r.users.set(f.event.pioneer_uid_hash, { kyc: true, mainnet: false }); assert.equal((await verifyEngagement(f.event, f.ctx)).code, 'INELIGIBLE_USER'); });
