import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEngagement } from '../../src/core/schema.js';
test('engagement schema is closed', () => { const base = { spec:'SIGNET-PEP-v1', app_id:'app.marketplace', key_id:'k1', pioneer_uid_hash:'h1:YWJjZA==', action_id:'retail.order_delivered', utility_class:'A', weight:1, timestamp_ms:0, nonce:'nonce-1234567890', signature:'x'.repeat(80) }; assert.equal(validateEngagement(base), true); assert.equal(validateEngagement({...base, eligible:true}), false); assert.equal(validateEngagement({...base, p_floor:1}), false); });
