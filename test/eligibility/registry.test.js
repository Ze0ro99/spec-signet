import test from 'node:test';import assert from 'node:assert/strict';import {Registry} from '../../src/core/registry.js';
test('eligibility is registry sourced',()=>{const r=new Registry();r.addApp('a','s');const h=r.uidHash('a','u');r.addUser(h,{kyc:false,mainnet:true});assert.equal(r.eligibility(h).kyc,false);});
