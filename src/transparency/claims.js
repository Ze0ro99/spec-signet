import {DOMAINS} from '../core/canonical.js';import {verifySignature} from '../core/keys-crypto.js';
export function verifyClaim(claim,pubkey,epoch,domain){const {signature,...body}=claim;return body.registry_epoch===epoch&&verifySignature(body,signature,pubkey,domain)?'attested_claim':'UNVERIFIABLE';}
export const verifyEscrow=(c,k,e)=>verifyClaim(c,k,e,DOMAINS.ESCROW);export const verifyFloor=(c,k,e)=>verifyClaim(c,k,e,DOMAINS.FLOOR);
