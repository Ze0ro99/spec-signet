import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateKeyPair, sign } from '../src/core/keys-crypto.js';
import { Registry } from '../src/core/registry.js';
import { InMemoryNonceStore } from '../src/core/nonces.js';
import { verifyEngagement } from '../src/core/verify.js';
import { decide } from '../src/policy/decide.js';
import { loadPacks } from '../src/policy/packs.js';

const model = await readFile(new URL('../formal/signet_gates.tla', import.meta.url), 'utf8');
assert.match(model, /NonceClaimed/);
assert.match(model, /PolicyCannotUpgradeCryptoDeny/);

function setup() {
  const key = generateKeyPair();
  const registry = new Registry({ epoch: 'epoch-1' });
  registry.addApp('app.marketplace', 'formal-secret');
  registry.addKey('app.marketplace', { key_id: 'k1', pubkey: key.publicKey });
  const uid = registry.uidHash('app.marketplace', 'formal-user');
  registry.addUser(uid);
  const body = {
    spec: 'SIGNET-PEP-v1',
    app_id: 'app.marketplace',
    key_id: 'k1',
    pioneer_uid_hash: uid,
    action_id: 'retail.order_delivered',
    utility_class: 'A',
    weight: 1,
    timestamp_ms: 1000,
    nonce: 'formal-nonce-0001',
  };
  return {
    event: { ...body, signature: sign(body, key.privateKey) },
    ctx: {
      registry,
      nonceStore: new InMemoryNonceStore(),
      nowMs: 1000,
      maxSkewMs: 100,
      classCeilings: { A: 100, B: 20, C: 5 },
    },
  };
}

const valid = setup();
const malformed = { ...valid.event, p_floor: 1 };
assert.equal((await verifyEngagement(malformed, valid.ctx)).code, 'SCHEMA');
assert.equal(valid.ctx.nonceStore.used.size, 0);

const forged = { ...valid.event, signature: `B${valid.event.signature.slice(1)}` };
assert.equal((await verifyEngagement(forged, valid.ctx)).code, 'INVALID_SIGNATURE');
assert.equal(valid.ctx.nonceStore.used.size, 0);

const accepted = await verifyEngagement(valid.event, valid.ctx);
assert.equal(accepted.code, 'OK');
const denied = decide(valid.event, { crypto: 'DENY', code: 'REPLAY_DETECTED' }, loadPacks()['retail-purchase-v1'], valid.ctx);
assert.equal(denied.crypto, 'DENY');
assert.equal(denied.policy, 'DENY');
assert.equal(denied.alloc_eligible, false);
assert.equal(denied.code, 'REPLAY_DETECTED');

console.log('FORMAL CHECK OK: schema-before-nonce, crypto-before-policy, and deny monotonicity');