import test from 'node:test';import assert from 'node:assert/strict';import {canonicalBytes,canonicalString} from '../../src/core/canonical.js';
test('canonicalization is idempotent',()=>{const x={z:'e\u0301',a:[1,0]};assert.equal(canonicalString(JSON.parse(new TextDecoder().decode(canonicalBytes(x)))),canonicalString(x));});
test('rejects unsafe values',()=>assert.throws(()=>canonicalBytes({x:-1})));
