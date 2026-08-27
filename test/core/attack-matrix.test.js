import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEngagement } from '../../src/core/schema.js';

test('schema-valid bad signature is INVALID_SIGNATURE candidate', () => {
  const body = { spec: 'SIGNET-PEP-v1', app_id: 'app.marketplace', key_id: 'k1', pioneer_uid_hash: 'h1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', action_id: 'retail.order_delivered', utility_class: 'A', weight: 1, timestamp_ms: 1, nonce: 'nonce-1234567890' };
  assert.equal(validateEngagement({ ...body, signature: 'x'.repeat(80) }), true);
});
test('empty and extra-field bodies are schema-invalid', () => {
  assert.equal(validateEngagement({}), false);
  assert.equal(validateEngagement({ spec: 'SIGNET-PEP-v1', extra: true }), false);
});
