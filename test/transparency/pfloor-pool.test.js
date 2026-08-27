import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFloor } from '../../src/transparency/pfloor.js';
import { poolInvariant } from '../../src/transparency/pool.js';

test('p_floor uses reduced BigInt fractions', () => {
  assert.deepEqual(computeFloor(100n, 0n, 1n), { code: 'OK', numerator: 1n, denominator: 100n });
  assert.deepEqual(computeFloor(100n, 100n, 1n), { code: 'OK', numerator: 1n, denominator: 400n });
  assert.deepEqual(computeFloor(0n, 0n, 1n), { code: 'FLOOR_UNDEFINED' });
});

test('pool invariant classifies drops and increases', () => {
  const rows = poolInvariant([{ x: 10, y: 10 }, { x: 9, y: 9 }, { x: 11, y: 11 }], 0.1);
  assert.equal(rows[1].status, 'K_DROP');
  assert.equal(rows[2].status, 'K_UP');
});
