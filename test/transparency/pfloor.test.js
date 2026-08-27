import test from 'node:test';
import assert from 'node:assert/strict';
import { computePFloor, createPFloorReport, verifyPFloorReport } from '../../src/transparency/pfloor.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';
import { fixture } from '../helpers/fixtures.js';

test('p_floor uses reduced integer fractions', () => {
  assert.deepEqual(computePFloor({ R: 100, S: 0, Q: 1 }), {
    code: 'OK', numerator: '1', denominator: '100', method_id: 'circulating-v1',
  });
  assert.deepEqual(computePFloor({ R: 100, S: 100, Q: 1 }), {
    code: 'OK', numerator: '1', denominator: '400', method_id: 'circulating-v1',
  });
  assert.equal(computePFloor({ R: 0, S: 0, Q: 1 }).code, 'FLOOR_UNDEFINED');
});

test('p_floor rejects unsafe caller inputs and verifies a signed report', () => {
  const key = generateKeyPair();
  assert.equal(computePFloor({ R: -1, S: 1, Q: 1 }).code, 'FLOOR_INPUT');
  assert.equal(computePFloor({ R: 1.5, S: 1, Q: 1 }).code, 'FLOOR_INPUT');
  const report = createPFloorReport({
    R: 100, S: 100, Q: 1, registry_epoch: 'epoch-1', issued_at_ms: 1764000000000,
    issuer: 'oracle', nonce: 'floor-test-nonce-1',
  }, key.privateKey);
  const result = verifyPFloorReport(report, key.publicKey, 'epoch-1');
  assert.equal(result.status, 'ATTESTED');
  assert.equal(result.numerator, '1');
  assert.equal(result.denominator, '400');
  assert.equal(verifyPFloorReport({ ...report, numerator: '2' }, key.publicKey, 'epoch-1').code, 'FLOOR_DOMAIN');
});

test('p_floor never becomes a PEP field', () => {
  const f = fixture();
  assert.equal(f.event.p_floor, undefined);
});