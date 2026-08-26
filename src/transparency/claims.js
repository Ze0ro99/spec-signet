import { DOMAINS } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';
import { validateClaim } from '../core/schema.js';

const CLAIM_SPECS = {
  escrow: 'SIGNET-ESCROW-v1',
  floor: 'SIGNET-FLOOR-v1',
};

export function createEscrowClaim(body, privateKey) {
  const payload = { spec: CLAIM_SPECS.escrow, ...body };
  return { ...payload, signature: sign(payload, privateKey, DOMAINS.ESCROW) };
}

export function createFloorClaim(body, privateKey) {
  const payload = { spec: CLAIM_SPECS.floor, ...body };
  return { ...payload, signature: sign(payload, privateKey, DOMAINS.FLOOR) };
}

export function verifyClaim(claim, publicKey, epoch, domain) {
  const spec = domain === DOMAINS.ESCROW ? CLAIM_SPECS.escrow : CLAIM_SPECS.floor;
  if (!validateClaim(claim, spec) || claim.registry_epoch !== epoch) return 'UNVERIFIABLE';
  const { signature, ...body } = claim;
  return verifySignature(body, signature, publicKey, domain) ? 'attested_claim' : 'UNVERIFIABLE';
}

export const verifyEscrow = (claim, key, epoch) => verifyClaim(claim, key, epoch, DOMAINS.ESCROW);
export const verifyFloor = (claim, key, epoch) => verifyClaim(claim, key, epoch, DOMAINS.FLOOR);
