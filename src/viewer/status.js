import { sign } from '../core/keys-crypto.js';
import { DOMAINS } from '../core/canonical.js';
import { Registry } from '../core/registry.js';
import { InMemoryNonceStore } from '../core/nonces.js';
import { verifyEngagement } from '../core/verify.js';
import { loadPacks } from '../policy/packs.js';
import { decide } from '../policy/decide.js';
import { snapshot } from '../alloc/snapshot.js';

const NOW = 1764000000000;
const PRIVATE_KEY = 'MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g';
const PUBLIC_KEY = 'MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=';
const UID_HASH = 'h1:dGVzdC1wcm9vZg==';

export async function buildViewerStatus() {
  const registry = new Registry({ epoch: 'epoch-1', issuer: 'registry-v1' });
  registry.addApp('app.marketplace', 'viewer-fixture');
  registry.addKey('app.marketplace', { key_id: 'k1', pubkey: PUBLIC_KEY });
  registry.addUser(UID_HASH, { kyc: true, mainnet: true });

  const body = {
    spec: 'SIGNET-PEP-v1',
    app_id: 'app.marketplace',
    key_id: 'k1',
    pioneer_uid_hash: UID_HASH,
    action_id: 'retail.order_delivered',
    utility_class: 'A',
    weight: 2,
    timestamp_ms: NOW,
    nonce: 'viewer-fixture-0001',
  };
  const event = { ...body, signature: sign(body, PRIVATE_KEY, DOMAINS.PEP) };
  const context = {
    registry,
    nonceStore: new InMemoryNonceStore(),
    nowMs: NOW,
    maxSkewMs: 300000,
    classCeilings: { A: 100, B: 20, C: 5 },
  };
  const crypto = await verifyEngagement(event, context);
  const decision = decide(event, crypto, loadPacks()['retail-purchase-v1'], context);
  const allocation = snapshot(
    [{ ...event, ...decision }],
    decision.code === 'OK' ? {} : { [decision.code]: 1 },
    registry.epoch,
    null,
    NOW,
  );

  return {
    decision,
    allocation,
    fixture: {
      action: body.action_id,
      evidence_id: crypto.evidence_id,
      registry_epoch: crypto.registry_epoch,
    },
  };
}