import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, sign, verifySignature } from '../../src/core/keys-crypto.js';
import { DOMAINS } from '../../src/core/canonical.js';

test('all signature domains are isolated', () => {
  const key = generateKeyPair();
  const body = { value: 1 };
  for (const a of Object.values(DOMAINS)) for (const b of Object.values(DOMAINS)) if (a !== b) assert.equal(verifySignature(body, sign(body, key.privateKey, a), key.publicKey, b), false);
});
