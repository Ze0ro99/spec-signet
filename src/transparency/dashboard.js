 v0/ze0ro99-a8e6e867
import { canonicalBytes } from '../core/canonical.js'

export function dashboard(input) {
  return {
    escrow: input.escrow ?? 'UNVERIFIABLE',
    floor: input.floor ?? 'UNVERIFIABLE',
    pool: input.pool ?? [],
    engagement: input.engagement ?? [],
    alloc: input.alloc ?? null,
  }
}

export function dashboardBytes(input) {
  return canonicalBytes(dashboard(input))
}

import { DOMAINS } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';

function fieldStatus(value, fallback = 'UNVERIFIABLE') {
  if (!value) return { status: fallback, code: 'DASH_UNVERIFIABLE_INPUT' };
  return value;
}

export function buildDashboardSnapshot(
  { registry_epoch, issued_at_ms, escrow, pfloor, pool, engagement, alloc, raw_reserves = [] },
  privateKey,
) {
  const escrowView = fieldStatus(escrow);
  const floorView = fieldStatus(pfloor);
  const poolView = fieldStatus(pool);
  const snapshot = {
    spec: 'SIGNET-DASH-v1',
    registry_epoch,
    issued_at_ms,
    escrow: escrowView.status === 'ATTESTED'
      ? { status: 'ATTESTED', code: escrowView.code, claim: escrowView.claim ?? null }
      : { status: 'UNVERIFIABLE', code: escrowView.code ?? 'DASH_UNVERIFIABLE_INPUT' },
    pfloor: floorView.status === 'ATTESTED'
      ? {
        status: 'ATTESTED',
        code: floorView.code,
        numerator: floorView.numerator,
        denominator: floorView.denominator,
        method_id: floorView.method_id,
      }
      : { status: 'UNVERIFIABLE', code: floorView.code ?? 'DASH_UNVERIFIABLE_INPUT' },
    pool: poolView.status === 'ATTESTED'
      ? { status: poolView.code, code: poolView.code, k: poolView.k }
      : { status: 'UNVERIFIABLE', code: poolView.code ?? 'DASH_UNVERIFIABLE_INPUT' },
    engagement: engagement ?? { leaderboard: [], consistency_note: 'No attested engagement score supplied.' },
    alloc: {
      reject_counts: alloc?.reject_counts ?? {},
      sum_eligible_weight: alloc?.allocations?.reduce((sum, item) => sum + item.weight, 0) ?? 0,
    },
    unverified_inputs: floorView.status === 'ATTESTED' ? [] : [...raw_reserves],
  };
  return privateKey ? { ...snapshot, signature: sign(snapshot, privateKey, DOMAINS.DASH) } : snapshot;
}

export function verifyDashboardSnapshot(snapshot, publicKey) {
  if (!snapshot || snapshot.spec !== 'SIGNET-DASH-v1' || !snapshot.signature) return false;
  const { signature, ...body } = snapshot;
  return verifySignature(body, signature, publicKey, DOMAINS.DASH);
}
 main
