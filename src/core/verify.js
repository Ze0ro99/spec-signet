import { canonicalBytes, DOMAINS, evidenceId } from './canonical.js';
import { verifySignature } from './keys-crypto.js';
import { validateEngagement } from './schema.js';

const deny = (code, extra = {}) => ({ crypto: 'DENY', code, ...extra });

export async function verifyEngagement(event, ctx) {
  if (!validateEngagement(event)) return deny('SCHEMA');
  if (!ctx.registry.hasApp(event.app_id)) return deny('UNKNOWN_APP');
  const key = ctx.registry.getKey(event.app_id, event.key_id);
  if (!key) return deny('UNKNOWN_KEY');
  if (key.not_before_ms != null && event.timestamp_ms < key.not_before_ms) return deny('KEY_NOT_YET_VALID');
  if (key.expires_at_ms != null && event.timestamp_ms >= key.expires_at_ms) return deny('EXPIRED_KEY');
  if (key.revoked_at_ms != null && event.timestamp_ms >= key.revoked_at_ms) return deny('REVOKED_KEY');
  const { signature, ...body } = event;
  try { canonicalBytes(body); } catch { return deny('SCHEMA'); }
  if (!verifySignature(body, signature, key.pubkey, DOMAINS.PEP)) return deny('INVALID_SIGNATURE');
  const now = ctx.nowMs ?? Date.now();
  const skew = ctx.maxSkewMs ?? 300000;
  if (event.timestamp_ms < now - skew) return deny('TIMESTAMP_EXPIRED');
  if (event.timestamp_ms > now + skew) return deny('TIMESTAMP_IN_FUTURE');
  const ceiling = ctx.classCeilings?.[event.utility_class];
  if (ceiling == null || event.weight > ceiling) return deny('WEIGHT_OVERFLOW');
  const eligibility = ctx.registry.eligibility(event.pioneer_uid_hash);
  if (!eligibility.kyc || !eligibility.mainnet) return deny('INELIGIBLE_USER');
  if (!await ctx.nonceStore.claimIfAbsent(event.app_id, event.nonce)) return deny('REPLAY_DETECTED');
  return { crypto: 'ALLOW', code: 'OK', evidence_id: evidenceId(event), registry_epoch: ctx.registry.epoch };
}

export const verify = verifyEngagement;

export default verifyEngagement;
