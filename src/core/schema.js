const app = /^[a-z0-9._-]{1,64}$/;
const action = /^[a-z0-9._-]{1,64}$/;
const hash = /^h1:[A-Za-z0-9+/]+=*$/;
const text = (value) => typeof value === 'string' && value.length > 0;
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

export function validateEngagement(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
  if (Object.keys(e).some((k) => ![
    'spec', 'app_id', 'key_id', 'pioneer_uid_hash', 'action_id',
    'utility_class', 'weight', 'timestamp_ms', 'nonce', 'signature',
  ].includes(k))) return false;
  return e.spec === 'SIGNET-PEP-v1' && app.test(e.app_id) && text(e.key_id)
    && hash.test(e.pioneer_uid_hash) && action.test(e.action_id)
    && ['A', 'B', 'C'].includes(e.utility_class) && integer(e.weight)
    && integer(e.timestamp_ms) && text(e.nonce) && e.nonce.length >= 16
    && e.nonce.length <= 128 && text(e.signature) && e.signature.length >= 80;
}

export function validateReceipt(r) {
  const fields = ['spec', 'app_id', 'evidence_id', 'claim_window', 'pioneer_uid_hash', 'pack', 'issuer', 'issued_at_ms', 'signature'];
  return r && typeof r === 'object' && !Array.isArray(r)
    && !Object.keys(r).some((k) => !fields.includes(k))
    && fields.every((k) => k in r)
    && r.spec === 'SIGNET-RECEIPT-v1' && r.pack === 'reward-claim-v1'
    && app.test(r.app_id) && text(r.evidence_id) && text(r.claim_window)
    && hash.test(r.pioneer_uid_hash) && text(r.issuer) && integer(r.issued_at_ms)
    && text(r.signature);
}

export function validateClaim(claim, spec) {
  const fields = spec === 'SIGNET-ESCROW-v1'
    ? ['spec', 'registry_epoch', 'escrow_id', 'locked_until_ms', 'amount_commitment', 'issued_at_ms', 'signature']
    : ['spec', 'registry_epoch', 'floor_id', 'floor_value', 'valid_from_ms', 'valid_until_ms', 'issued_at_ms', 'signature'];
  return claim && typeof claim === 'object' && !Array.isArray(claim)
    && !Object.keys(claim).some((k) => !fields.includes(k))
    && fields.every((k) => k in claim)
    && claim.spec === spec && text(claim.registry_epoch)
    && text(spec === 'SIGNET-ESCROW-v1' ? claim.escrow_id : claim.floor_id)
    && integer(claim[spec === 'SIGNET-ESCROW-v1' ? 'locked_until_ms' : 'valid_from_ms'])
    && integer(claim.issued_at_ms) && text(claim.signature)
    && (spec === 'SIGNET-ESCROW-v1'
      ? text(claim.amount_commitment)
      : integer(claim.floor_value) && integer(claim.valid_until_ms)
        && claim.valid_until_ms > claim.valid_from_ms);
}

export const validateAllocation = (value) => value && value.spec === 'SIGNET-ALLOC-v1'
  && typeof value.registry_epoch === 'string'
  && Array.isArray(value.allocations)
  && value.allocations.every((item) => item && typeof item.evidence_id === 'string'
    && Number.isSafeInteger(item.weight) && item.weight >= 0
    && typeof item.normalized_weight === 'number')
  && value.reject_counts && typeof value.reject_counts === 'object';
