import { mapContext } from '../adapter/map.js';
import { sign } from '../core/keys-crypto.js';
import { verifyEngagement } from '../core/verify.js';
import { decide } from '../policy/decide.js';
import { claimReceipt } from '../receipt/issue.js';
import { snapshot } from '../alloc/snapshot.js';
import { DOMAINS } from '../core/canonical.js';

export function createSignet({ registry, nonceStore, receiptStore, catalog, packs, now = Date.now, issuerKey }) {
  const ctx = { registry, nonceStore, nowMs: now(), classCeilings: catalog.class_ceilings };
  return {
    map: (context) => mapContext({
      ...context,
      pioneer_uid_hash: context.pioneer_uid_hash ?? registry.uidHash(context.app_id, context.raw_uid),
    }, catalog),
    sign: (body, key) => ({ ...body, signature: sign(body, key, DOMAINS.PEP) }),
    verify: (event) => verifyEngagement(event, ctx),
    decide: async (event, packName) => decide(event, await verifyEngagement(event, ctx), packs[packName], ctx),
    claimReceipt: (event, decision, window) => claimReceipt(
      event, decision, window, registry.issuer, issuerKey, receiptStore, now(),
    ),
    snapshot: (events, rejects) => snapshot(events, rejects, registry.epoch, issuerKey, now()),
    catalog,
  };
}
