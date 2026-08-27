import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboard, dashboardBytes } from '../../src/transparency/dashboard.js';

test('dashboard is read-only, deterministic, and honest about missing claims', () => {
  const input = { floor: { code: 'OK', numerator: '1', denominator: '400' }, pool: [{ k: 100, status: 'K_OK' }], engagement: [], alloc: { reject_counts: { SCHEMA: 1 } } };
  const first = dashboardBytes(input);
  const second = dashboardBytes(input);
  assert.deepEqual(first, second);
  assert.equal(dashboard({}).escrow, 'UNVERIFIABLE');
  assert.equal(dashboard({}).floor, 'UNVERIFIABLE');
  assert.equal('ALLOW' in dashboard({}), false);
});

test('dashboard never invents claims', () => {
  const result = dashboard({ escrow: null, floor: undefined });
  assert.equal(result.escrow, 'UNVERIFIABLE');
  assert.equal(result.floor, 'UNVERIFIABLE');
});
