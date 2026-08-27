import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, sign, verifySignature } from '../../src/core/keys-crypto.js';
import { DOMAINS } from '../../src/core/canonical.js';

test('PEP signature cannot verify in another domain', () => {
  const key = generateKeyPair();
  const body = { spec: 'SIGNET-PEP-v1', app_id: 'a', weight: 1 };
  const signature = sign(body, key.privateKey, DOMAINS.PEP);
  for (const [name, domain] of Object.entries(DOMAINS)) {
    if (name !== 'PEP') assert.equal(verifySignature(body, signature, key.publicKey, domain), false, name);
  }
});
