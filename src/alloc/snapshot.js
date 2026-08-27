import { DOMAINS, evidenceId } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';
import { validateAllocation } from '../core/schema.js';

function stableRejects(rejects = {}) {
  return Object.fromEntries(Object.entries(rejects).sort(([a], [b]) => a.localeCompare(b)));
}

export function snapshot(events, rejects, epoch, privateKey, issuedAt = Date.now()) {
  const accepted = events
    .filter((event) => event.alloc_eligible === true)
    .map((event) => ({ ...event, evidence_id: event.evidence_id ?? evidenceId(event) }));
  const sum = accepted.reduce((total, event) => total + event.weight, 0);
  const allocations = accepted
    .map((event) => ({ ...event, normalized_weight: event.weight / Math.max(1, sum) }))
    .sort((a, b) => a.evidence_id.localeCompare(b.evidence_id));
  const body = {
    spec: 'SIGNET-ALLOC-v1',
    registry_epoch: epoch,
    issued_at_ms: issuedAt,
    allocations,
    reject_counts: stableRejects(rejects),
  };
  return privateKey ? { ...body, signature: sign(body, privateKey, DOMAINS.ALLOC) } : body;
}

export function verifySnapshot(value, publicKey) {
  if (!validateAllocation(value) || !value.signature) return false;
  const { signature, ...body } = value;
  return verifySignature(body, signature, publicKey, DOMAINS.ALLOC);
}
