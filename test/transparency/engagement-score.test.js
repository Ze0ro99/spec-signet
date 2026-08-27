import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreEngagement } from '../../src/transparency/engagement.js';

const day = 86400000;
const start = 1764000000000;
const options = { windowStartMs: start, windowEndMs: start + 10 * day };

test('spread engagement scores higher than an end-window burst', () => {
  const spread = Array.from({ length: 10 }, (_, index) => ({
    app_id: 'app.spread', action_id: 'retail.order_delivered', utility_class: 'A',
    weight: 10, timestamp_ms: start + index * day, policy: 'ALLOW',
  }));
  const burst = spread.map((event) => ({ ...event, app_id: 'app.burst', timestamp_ms: start + 9 * day }));
  const result = scoreEngagement([...spread, ...burst], options);
  const byApp = Object.fromEntries(result.leaderboard.map((entry) => [entry.app_id, entry]));
  assert.equal(byApp['app.spread'].consistency_ppm, 1000000);
  assert.ok(byApp['app.spread'].score > byApp['app.burst'].score);
});

test('manifest weights can lower but never raise protocol ceilings', () => {
  const event = {
    app_id: 'app.manifest', action_id: 'retail.order_delivered', utility_class: 'A',
    weight: 80, timestamp_ms: start, policy: 'ALLOW',
  };
  const lowered = scoreEngagement([event], {
    ...options,
    manifest: { 'retail.order_delivered': 5 },
    catalog: { 'retail.order_delivered': { utility_class: 'A', weight_ceiling: 80 } },
  });
  assert.equal(lowered.leaderboard[0].pou, 5);
  assert.throws(() => scoreEngagement([event], {
    ...options,
    manifest: { 'retail.order_delivered': 81 },
    catalog: { 'retail.order_delivered': { utility_class: 'A', weight_ceiling: 80 } },
  }), /MANIFEST_WEIGHT_OVERFLOW/);
});