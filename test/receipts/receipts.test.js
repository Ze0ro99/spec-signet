import test from 'node:test';
import assert from 'node:assert/strict';
import { claimReceipt, verifyReceipt } from '../../src/receipt/issue.js';
import { ReceiptStore } from '../../src/receipt/store.js';
import { decide } from '../../src/policy/decide.js';
import { loadPacks } from '../../src/policy/packs.js';
import { generateKeyPair } from '../../src/core/keys-crypto.js';
import { fixture } from '../helpers/fixtures.js';

test('a receipt is one-time and its signature verifies', async () => {
  const f = fixture();
  const issuer = generateKeyPair();
  const crypto = await import('../../src/core/verify.js').then(({ verifyEngagement }) => verifyEngagement(f.event, f.ctx));
  const decision = decide(f.event, crypto, loadPacks().retail?.missing);
  assert.equal(decision.code, 'POLICY_ACTION');
  const allow = decide(f.event, crypto, loadPacks()['retail-purchase-v1'], f.ctx);
  const store = new ReceiptStore();
  const first = claimReceipt(f.event, allow, '2026-W35', 'registry-v1', issuer.privateKey, store, f.ctx.nowMs);
  assert.equal(first.code, 'OK');
  assert.equal(verifyReceipt(first.receipt, issuer.publicKey), true);
  const second = claimReceipt(f.event, allow, '2026-W35', 'registry-v1', issuer.privateKey, store, f.ctx.nowMs);
  assert.equal(second.code, 'RECEIPT_REPLAY');
});

test('crypto or policy failure does not burn a receipt claim', () => {
  const f = fixture();
  const issuer = generateKeyPair();
  const store = new ReceiptStore();
  const failed = claimReceipt(f.event, { crypto: 'DENY', code: 'INVALID_SIGNATURE' }, '2026-W35', 'registry-v1', issuer.privateKey, store);
  assert.equal(failed.code, 'INVALID_SIGNATURE');
  const allowed = claimReceipt(f.event, { crypto: 'ALLOW', policy: 'ALLOW', alloc_eligible: true }, '2026-W35', 'registry-v1', issuer.privateKey, store);
  assert.equal(allowed.code, 'OK');
});

test('policy denial does not burn a receipt claim', () => {
  const f = fixture();
  const issuer = generateKeyPair();
  const store = new ReceiptStore();
  const failed = claimReceipt(f.event, { crypto: 'ALLOW', policy: 'DENY', code: 'POLICY_WEIGHT', alloc_eligible: false }, '2026-W35', 'registry-v1', issuer.privateKey, store);
  assert.equal(failed.code, 'POLICY_WEIGHT');
  const allowed = claimReceipt(f.event, { crypto: 'ALLOW', policy: 'ALLOW', alloc_eligible: true }, '2026-W35', 'registry-v1', issuer.privateKey, store);
  assert.equal(allowed.code, 'OK');
});