import { canonicalBytes, DOMAINS, evidenceId } from './canonical.js';
import { verifySignature } from './keys-crypto.js';
import { validateEngagement } from './schema.js';

const result = (ctx, crypto, code, evidence_id = null) => ({
  crypto,
  code,
  evidence_id,
  registry_epoch: ctx.registry.epoch,
});

export async function verifyEngagement(event, ctx) {
  if (!validateEngagement(event)) return result(ctx, 'DENY', 'SCHEMA');
  if (!ctx.registry.hasApp(event.app_id)) return result(ctx, 'DENY', 'UNKNOWN_APP');
  const key = ctx.registry.getKey(event.app_id, event.key_id);
  if (!key) return result(ctx, 'DENY', 'UNKNOWN_KEY');
  if (key.not_before_ms != null && event.timestamp_ms < key.not_before_ms) return result(ctx, 'DENY', 'KEY_NOT_YET_VALID');
  if (key.expires_at_ms != null && event.timestamp_ms >= key.expires_at_ms) return result(ctx, 'DENY', 'EXPIRED_KEY');
  if (key.revoked_at_ms != null && event.timestamp_ms >= key.revoked_at_ms) return result(ctx, 'DENY', 'REVOKED_KEY');
  const { signature, ...body } = event;
  try { canonicalBytes(body); } catch { return result(ctx, 'DENY', 'SCHEMA'); }
  if (!verifySignature(body, signature, key.pubkey, DOMAINS.PEP)) return result(ctx, 'DENY', 'INVALID_SIGNATURE');
  const now = ctx.nowMs ?? Date.now();
  const skew = ctx.maxSkewMs ?? 300000;
  if (event.timestamp_ms < now - skew) return result(ctx, 'DENY', 'TIMESTAMP_EXPIRED');
  if (event.timestamp_ms > now + skew) return result(ctx, 'DENY', 'TIMESTAMP_IN_FUTURE');
  const ceiling = ctx.classCeilings?.[event.utility_class];
  if (ceiling == null || event.weight > ceiling) return result(ctx, 'DENY', 'WEIGHT_OVERFLOW');
  const eligibility = ctx.registry.eligibility(event.pioneer_uid_hash);
  if (!eligibility.kyc || !eligibility.mainnet) return result(ctx, 'DENY', 'INELIGIBLE_USER');
  if (!await ctx.nonceStore.claimIfAbsent(event.app_id, event.nonce)) return result(ctx, 'DENY', 'REPLAY_DETECTED');
  return result(ctx, 'ALLOW', 'OK', evidenceId(event));
}

export const verify = verifyEngagement;

export default verifyEngagement;
