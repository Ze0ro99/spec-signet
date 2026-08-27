export function decide(event, crypto, pack, ctx = {}) {
  const base = { ...crypto, catalog_hash: ctx.catalog_hash ?? null };
  if (crypto.crypto !== 'ALLOW') return { ...base, policy: 'DENY', alloc_eligible: false };
  if (!pack) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_ACTION' };
  if (pack.issuer_allowlist && !pack.issuer_allowlist.includes(event.app_id)) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_ISSUER', pack: pack.pack };
  if (!pack.action_ids.includes(event.action_id) || !pack.action_classes.includes(event.utility_class)) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_ACTION', pack: pack.pack };
  if (event.weight < pack.min_weight || event.weight > pack.max_weight) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_WEIGHT', pack: pack.pack };
  if (pack.max_age_ms != null && event.timestamp_ms < (ctx.nowMs ?? Date.now()) - pack.max_age_ms) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_AGE', pack: pack.pack };
  const e = ctx.registry.eligibility(event.pioneer_uid_hash);
  if ((pack.require_kyc && !e.kyc) || (pack.require_mainnet && !e.mainnet)) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_ELIGIBILITY', pack: pack.pack };
  if (pack.require_epoch_bound && !crypto.registry_epoch) return { ...base, policy: 'DENY', alloc_eligible: false, code: 'POLICY_EPOCH', pack: pack.pack };
  return { ...base, policy: 'ALLOW', alloc_eligible: true, code: 'OK', pack: pack.pack };
}
