import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot } from '../../src/alloc/snapshot.js';
test('allocation excludes denied evidence', () => { const out = snapshot([{alloc_eligible:true,weight:2},{alloc_eligible:false,weight:100}], {REPLAY_DETECTED:1}, 'e1', null, 1); assert.equal(out.allocations.length,1); assert.equal(out.allocations[0].normalized_weight,1); });
