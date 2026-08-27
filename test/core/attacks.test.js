import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPair,sign} from '../../src/core/keys-crypto.js';import {Registry} from '../../src/core/registry.js';import {InMemoryNonceStore} from '../../src/core/nonces.js';import {verifyEngagement} from '../../src/core/verify.js';
test('valid event then replay is denied',async()=>{const kp=generateKeyPair(),r=new Registry();r.addApp('app.marketplace','secret');r.addKey('app.marketplace',{key_id:'k1',pubkey:kp.publicKey});const uid=r.uidHash('app.marketplace','pioneer-1');r.addUser(uid);const body={spec:'SIGNET-PEP-v1',app_id:'app.marketplace',key_id:'k1',pioneer_uid_hash:uid,action_id:'retail.order_delivered',utility_class:'A',weight:50,timestamp_ms:1000,nonce:'n-retail-0000001'};const e={...body,signature:sign(body,kp.privateKey)};const ctx={registry:r,nonceStore:new InMemoryNonceStore(),nowMs:1000,maxSkewMs:100,classCeilings:{A:100,B:20,C:5}};assert.equal((await verifyEngagement(e,ctx)).code,'OK');assert.equal((await verifyEngagement(e,ctx)).code,'REPLAY_DETECTED');});
test('bad signature is denied',async()=>{const r=new Registry();r.addApp('a','s');const ctx={registry:r,nonceStore:new InMemoryNonceStore()};assert.equal((await verifyEngagement({},ctx)).code,'SCHEMA');});
test('schema-valid forged signature is INVALID_SIGNATURE', async () => {
  const f = await import('../helpers/fixtures.js').then(({ fixture }) => fixture());
  const forged = { ...f.event, signature: `B${f.event.signature.slice(1)}` };
  if (forged.signature === f.event.signature) forged.signature = `C${f.event.signature.slice(1)}`;
  assert.equal((await verifyEngagement(forged, f.ctx)).code, 'INVALID_SIGNATURE');
});
