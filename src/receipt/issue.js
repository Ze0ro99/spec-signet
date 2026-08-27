import { DOMAINS, evidenceId } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';
import { validateReceipt } from '../core/schema.js';

export function issueReceipt(event, window, issuer, privateKey, issuedAt = Date.now()) {
  const body = {
    spec: 'SIGNET-RECEIPT-v1',
    app_id: event.app_id,
    evidence_id: evidenceId(event),
    claim_window: window,
    pioneer_uid_hash: event.pioneer_uid_hash,
    pack: 'reward-claim-v1',
    issuer,
    issued_at_ms: issuedAt,
  };
  return { ...body, signature: sign(body, privateKey, DOMAINS.RECEIPT) };
}

export function verifyReceipt(receipt, publicKey) {
  if (!validateReceipt(receipt)) return false;
  const { signature, ...body } = receipt;
  return verifySignature(body, signature, publicKey, DOMAINS.RECEIPT);
}

export function claimReceipt(
  event,
  decision,
  window,
  issuer,
  privateKey,
  receiptStore,
  issuedAt = Date.now(),
) {
  if (decision?.crypto !== 'ALLOW') {
    return { code: decision?.code ?? 'CRYPTO_DENY', receipt: null };
  }
  if (decision?.policy !== 'ALLOW' || decision?.alloc_eligible !== true) {
    return { code: decision?.code ?? 'POLICY_DENY', receipt: null };
  }
  const id = evidenceId(event);
  if (!receiptStore.claimIfAbsent(event.app_id, id, window)) {
    return { code: 'RECEIPT_REPLAY', receipt: null };
  }
  return { code: 'OK', receipt: issueReceipt(event, window, issuer, privateKey, issuedAt) };
}