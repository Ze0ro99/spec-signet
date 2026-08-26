import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../../src/policy/decide.js';
test('policy cannot override crypto denial', () => { const result = decide({}, {crypto:'DENY', code:'REPLAY_DETECTED'}, {pack:'retail-purchase-v1', action_ids:['x'], action_classes:['A'], min_weight:1, max_weight:80}, {}); assert.equal(result.policy,'DENY'); assert.equal(result.alloc_eligible,false); assert.equal(result.code,'REPLAY_DETECTED'); });
