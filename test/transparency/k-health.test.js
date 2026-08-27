import test from 'node:test';
import assert from 'node:assert/strict';
import { computePoolHealth, createPoolHealthReport, verifyPoolHealthReport } from '../../src/transparency/pool.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';

const base = 1764000000000;

test('pool health distinguishes flat, informational up, and material drops', () => {
  const flat = computePoolHealth([{ t: base, x: 100, y: 100 }, { t: base + 1, x: 100, y: 100 }]);
  const up = computePoolHealth([{ t: base, x: 100, y: 100 }, { t: base + 1, x: 101, y: 100 }]);
  const drop = computePoolHealth([{ t: base, x: 100, y: 100 }, { t: base + 1, x: 90, y: 100 }]);
  const within = computePoolHealth([{ t: base, x: 100, y: 100 }, { t: base + 1, x: 99.6, y: 100 }]);
  assert.deepEqual(flat.health.map((sample) => sample.code), ['K_OK', 'K_OK']);
  assert.equal(up.health.at(-1).code, 'K_UP');
  assert.equal(drop.health.at(-1).code, 'K_DROP');
  assert.equal(within.code, 'UNVERIFIABLE');
});

test('pool health report is signed under POOL and recomputed on verify', () => {
  const key = generateKeyPair();
  const report = createPoolHealthReport({
    samples: [{ t: base, x: 100, y: 100 }, { t: base + 1, x: 90, y: 100 }],
    tau_bps: 50, registry_epoch: 'epoch-1', issued_at_ms: base,
    issuer: 'oracle', nonce: 'pool-test-nonce-1',
  }, key.privateKey);
  const result = verifyPoolHealthReport(report, key.publicKey, 'epoch-1');
  assert.equal(result.status, 'ATTESTED');
  assert.equal(result.code, 'K_DROP');
});