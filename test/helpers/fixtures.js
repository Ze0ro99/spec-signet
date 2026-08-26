import { generateKeyPair, sign } from '../../src/core/keys-crypto.js';
import { Registry } from '../../src/core/registry.js';
import { InMemoryNonceStore } from '../../src/core/nonces.js';

export const NOW = 1764000000000;

export function fixture({ app = 'app.marketplace', action = 'retail.order_delivered' } = {}) {
  const key = generateKeyPair();
  const registry = new Registry({ issuer: 'registry-v1', epoch: 'epoch-1' });
  registry.addApp(app, 'app-secret');
  registry.addKey(app, { key_id: 'k1', pubkey: key.publicKey });
  const uid = registry.uidHash(app, 'pioneer-1');
  registry.addUser(uid, { kyc: true, mainnet: true });
  const ctx = {
    registry,
    nonceStore: new InMemoryNonceStore(),
    nowMs: NOW,
    maxSkewMs: 300000,
    classCeilings: { A: 100, B: 20, C: 5 },
  };
  const body = {
    spec: 'SIGNET-PEP-v1',
    app_id: app,
    key_id: 'k1',
    pioneer_uid_hash: uid,
    action_id: action,
    utility_class: 'A',
    weight: 50,
    timestamp_ms: NOW,
    nonce: 'fixture-nonce-0001',
  };
  return { key, registry, uid, ctx, body, event: signEvent(body, key) };
}

export function signEvent(body, key) {
  return { ...body, signature: sign(body, key.privateKey) };
}